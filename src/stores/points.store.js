import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  doc, getDoc, setDoc, onSnapshot,
  runTransaction, collection, addDoc, getDocs, orderBy, query, limit, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth.store'
import { toDateKey } from '@/utils/formatters'

const POINTS_CONFIG = {
  training_completed:  100,
  session_complete:    100,
  nutrition_logged:     30,
  water_goal:           20,
  daily_close:          25,
  new_record:           50,
  streak_7:            150,
  streak_30:           500,
}

export const usePointsStore = defineStore('points', () => {
  const auth        = useAuthStore()
  const _balance    = ref({ balance: 0, total_earned: 0, total_redeemed: 0 })
  const log         = ref([])
  const lastEarned  = ref(0)
  const loading     = ref(false)
  let unsub         = null

  const balance = computed(() => _balance.value.balance ?? 0)

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
        balance:       newBal,
        total_earned:  (snap.data()?.total_earned || 0) + amount,
        total_redeemed: snap.data()?.total_redeemed || 0,
        last_updated:  serverTimestamp(),
      })

      await addDoc(histRef, {
        type:          'earn',
        amount,
        reason,
        balance_after: newBal,
        timestamp:     serverTimestamp(),
      })
    })
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

  return {
    balance, log, lastEarned, loading,
    initBalance, subscribe, unsubscribe, earnPoints, redeemReward, logHabit,
  }
})
