import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  doc, getDoc, setDoc, onSnapshot,
  runTransaction, collection, addDoc, getDocs, orderBy, query, limit, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore }   from './auth.store'
import { useRankingStore } from './ranking.store'
import { toDateKey } from '@/utils/formatters'

const POINTS_CONFIG = {
  set_complete:        3,
  exercise_complete:   10,
  session_complete:    50,
  session_full_bonus:  25,    // extra cuando se completan TODOS los ejercicios
  nutrition_logged:    30,
  water_goal:          20,
  daily_close:         25,
  new_record:          50,
  streak_7:            150,
  streak_30:           500,
  challenge_complete:  null,  // variable, viene del reward
}

// Multiplicador cuando se completan todos los ejercicios del día
const FULL_DAY_MULTIPLIER = 1.5

export const usePointsStore = defineStore('points', () => {
  const auth        = useAuthStore()
  const _balance    = ref({ balance: 0, total_earned: 0, total_redeemed: 0 })
  const log         = ref([])
  const lastEarned  = ref(0)
  const loading     = ref(false)
  let unsub         = null

  const balance      = computed(() => _balance.value.balance ?? 0)
  const totalEarned  = computed(() => _balance.value.total_earned ?? 0)

  // ── Suscripción realtime ───────────────────────────────

  function subscribe() {
    if (!auth.uid) return
    const ref = doc(db, 'users', auth.uid, 'points', 'balance')
    unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) _balance.value = snap.data()
    })
    loadLog()
  }

  function unsubscribe() { unsub?.() }

  // ── Inicializar balance si no existe ──────────────────

  async function initBalance() {
    if (!auth.uid) return
    const ref  = doc(db, 'users', auth.uid, 'points', 'balance')
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, { balance: 0, total_earned: 0, total_redeemed: 0, last_updated: serverTimestamp() })
    }
    subscribe()
  }

  async function loadLog() {
    if (!auth.uid) return
    const q    = query(collection(db, 'users', auth.uid, 'points_history'), orderBy('timestamp', 'desc'), limit(20))
    const snap = await getDocs(q)
    log.value  = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }

  // ── Ganar puntos ───────────────────────────────────────

  async function earnPoints(reason, customAmount = null) {
    if (!auth.uid) return
    const amount  = customAmount ?? POINTS_CONFIG[reason] ?? 10
    lastEarned.value = amount
    const balRef  = doc(db, 'users', auth.uid, 'points', 'balance')
    const histRef = collection(db, 'users', auth.uid, 'points_history')

    await runTransaction(db, async (tx) => {
      const snap   = await tx.get(balRef)
      const current = snap.exists() ? snap.data().balance : 0
      const newBal  = current + amount

      tx.set(balRef, {
        balance:        newBal,
        total_earned:   (snap.data()?.total_earned || 0) + amount,
        total_redeemed: snap.data()?.total_redeemed || 0,
        last_updated:   serverTimestamp(),
      })

      await addDoc(histRef, {
        type:          'earn',
        amount,
        reason,
        balance_after: newBal,
        timestamp:     serverTimestamp(),
      })
    })

    // Cada punto ganado también avanza el XP de rango (XP nunca decrece).
    // La importación es lazy para evitar circularidad en módulos.
    const ranking = useRankingStore()
    await ranking.addXP(amount)
  }

  // ── Canjear recompensa ─────────────────────────────────

  async function redeemReward(rewardLabel, cost, quantity = 1) {
    if (!auth.uid) return
    const totalCost = cost * quantity
    if (balance.value < totalCost) throw new Error('Puntos insuficientes')

    const balRef  = doc(db, 'users', auth.uid, 'points', 'balance')
    const histRef = collection(db, 'users', auth.uid, 'points_history')

    await runTransaction(db, async (tx) => {
      const snap   = await tx.get(balRef)
      const current = snap.data().balance
      if (current < totalCost) throw new Error('Puntos insuficientes')
      const newBal = current - totalCost

      tx.update(balRef, {
        balance:        newBal,
        total_redeemed: (snap.data().total_redeemed || 0) + totalCost,
        last_updated:   serverTimestamp(),
      })

      await addDoc(histRef, {
        type:          'redeem',
        amount:        totalCost,
        reward_label:  rewardLabel,
        reward_qty:    quantity,
        balance_after: newBal,
        timestamp:     serverTimestamp(),
      })
    })
  }

  // ── Hábitos diarios ────────────────────────────────────

  async function logHabit(habitId, amount) {
    if (!auth.uid) return
    const dateKey = toDateKey()
    const logRef  = doc(db, 'users', auth.uid, 'habit_logs', dateKey)
    const snap    = await getDoc(logRef)
    const current = snap.exists() ? snap.data() : { date: dateKey, habits: {} }
    const prev    = current.habits[habitId] || { consumed: 0 }

    await setDoc(logRef, {
      ...current,
      habits: {
        ...current.habits,
        [habitId]: { consumed: prev.consumed + amount, last_updated: new Date().toISOString() },
      },
    })
  }

  // ── Ganar puntos por serie / ejercicio / sesión ────────────────────────────

  async function earnSet()                { await earnPoints('set_complete') }
  async function earnExercise()           { await earnPoints('exercise_complete') }
  async function earnSessionBonus()       { await earnPoints('session_complete') }

  // Llamar al completar sesión. sessionPoints = puntos acumulados de sets+ejercicios.
  // Si all_complete, aplica multiplicador ×1.5 al total y suma bonus.
  async function earnSessionComplete(sessionPoints, allComplete) {
    const base    = POINTS_CONFIG.session_complete
    let total     = base
    if (allComplete && sessionPoints > 0) {
      const multiplied = Math.round(sessionPoints * FULL_DAY_MULTIPLIER)
      const bonus      = multiplied - sessionPoints
      if (bonus > 0) await earnPoints('session_full_bonus', bonus)
    }
    await earnPoints('session_complete', total)
    return total
  }

  // ── Aplicar decaimiento (resta solo del balance, no del total_earned) ───────

  async function applyDecay(amount) {
    if (!auth.uid || amount <= 0) return
    const balRef  = doc(db, 'users', auth.uid, 'points', 'balance')
    const histRef = collection(db, 'users', auth.uid, 'points_history')

    await runTransaction(db, async (tx) => {
      const snap    = await tx.get(balRef)
      const current = snap.exists() ? snap.data().balance : 0
      const newBal  = Math.max(current - amount, 0)

      tx.set(balRef, {
        balance:        newBal,
        total_earned:   snap.data()?.total_earned    || 0,
        total_redeemed: snap.data()?.total_redeemed  || 0,
        last_updated:   serverTimestamp(),
      })

      await addDoc(histRef, {
        type:          'decay',
        amount:        -(current - newBal),
        reason:        'días_sin_entrenar',
        balance_after: newBal,
        timestamp:     serverTimestamp(),
      })
    })
  }

  return {
    balance, totalEarned, log, lastEarned, loading,
    initBalance, subscribe, unsubscribe,
    earnPoints, earnSet, earnExercise, earnSessionComplete, applyDecay,
    redeemReward, logHabit,
  }
})
