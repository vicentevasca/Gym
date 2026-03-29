import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth.store'
import { toDateKey } from '@/utils/formatters'

// ── 10 niveles ────────────────────────────────────────────────────────────────
export const LEVELS = [
  { index: 0, name: 'Iniciado',       min: 0,       color: '#94a3b8', emoji: '🌱' },
  { index: 1, name: 'Constante',      min: 500,     color: '#22c55e', emoji: '🔥' },
  { index: 2, name: 'Comprometido',   min: 1500,    color: '#3b82f6', emoji: '💪' },
  { index: 3, name: 'Forjado',        min: 3500,    color: '#8b5cf6', emoji: '⚡' },
  { index: 4, name: 'Resistente',     min: 7500,    color: '#f59e0b', emoji: '🏋️' },
  { index: 5, name: 'Disciplinado',   min: 15000,   color: '#ef4444', emoji: '🎯' },
  { index: 6, name: 'Inquebrantable', min: 28000,   color: '#ec4899', emoji: '🛡️' },
  { index: 7, name: 'Élite',          min: 50000,   color: '#06b6d4', emoji: '👑' },
  { index: 8, name: 'Leyenda',        min: 85000,   color: '#f97316', emoji: '⭐' },
  { index: 9, name: 'Trascendente',   min: 130000,  color: '#a855f7', emoji: '🌟' },
]

// ── Decaimiento por días consecutivos sin entrenar ────────────────────────────
// día 1 perdido = -5, día 2 = -8, día 3 = -11... tope en -50/día
export function calcDecayAmount(missedDays) {
  let total = 0
  for (let d = 1; d <= missedDays; d++) {
    total += Math.min(5 + (d - 1) * 3, 50)
  }
  return total
}

export const useRankingStore = defineStore('ranking', () => {
  const auth = useAuthStore()

  const data = ref({
    xp:             0,
    streak:         0,
    last_trained:   null,
    missed_days:    0,
    personal_bests: { best_volume: 0, best_streak: 0 },
    last_decay_date: null,
  })

  const loading       = ref(false)
  const justLeveledUp = ref(null)   // { name, emoji, color } cuando sube nivel
  const pendingDecay  = ref(0)      // puntos a restar del balance esta sesión

  // ── Computeds ────────────────────────────────────────────────────────────────

  const xp      = computed(() => data.value.xp ?? 0)
  const streak  = computed(() => data.value.streak ?? 0)
  const bests   = computed(() => data.value.personal_bests ?? {})

  const currentLevel = computed(() => {
    const total = xp.value
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (total >= LEVELS[i].min) return LEVELS[i]
    }
    return LEVELS[0]
  })

  const nextLevel = computed(() => {
    const idx = currentLevel.value.index
    return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null
  })

  const levelProgress = computed(() => {
    if (!nextLevel.value) return 100
    const cur    = currentLevel.value.min
    const next   = nextLevel.value.min
    return Math.min(Math.round(((xp.value - cur) / (next - cur)) * 100), 100)
  })

  const pointsToNext = computed(() =>
    nextLevel.value ? Math.max(nextLevel.value.min - xp.value, 0) : 0
  )

  // ── Carga / init ──────────────────────────────────────────────────────────

  async function load() {
    if (!auth.uid) return
    loading.value = true
    try {
      const ref  = doc(db, 'users', auth.uid, 'ranking', 'data')
      const snap = await getDoc(ref)
      if (snap.exists()) {
        data.value = { ...data.value, ...snap.data() }
        await _checkDecay()
      } else {
        await setDoc(ref, { ...data.value, last_decay_date: toDateKey(), created_at: serverTimestamp() })
      }
    } finally {
      loading.value = false
    }
  }

  // ── Decaimiento ───────────────────────────────────────────────────────────

  async function _checkDecay() {
    if (!auth.uid) return
    const today     = toDateKey()
    const lastDecay = data.value.last_decay_date

    if (lastDecay === today) return

    const lastTrained = data.value.last_trained
    if (!lastTrained) {
      await updateDoc(doc(db, 'users', auth.uid, 'ranking', 'data'), { last_decay_date: today })
      return
    }

    const lastDate  = new Date(lastTrained + 'T12:00:00')
    const todayDate = new Date(today + 'T12:00:00')
    const diffDays  = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24))

    if (diffDays > 1) {
      const missed     = diffDays - 1
      const decayAmt   = calcDecayAmount(missed)
      const newMissed  = missed    // reset, not cumulative (counted fresh each day)
      const newStreak  = 0

      await updateDoc(doc(db, 'users', auth.uid, 'ranking', 'data'), {
        streak:          newStreak,
        missed_days:     newMissed,
        last_decay_date: today,
      })
      data.value = { ...data.value, streak: newStreak, missed_days: newMissed, last_decay_date: today }
      pendingDecay.value = decayAmt  // caller (points store) will consume this
    } else {
      await updateDoc(doc(db, 'users', auth.uid, 'ranking', 'data'), { last_decay_date: today })
      data.value = { ...data.value, last_decay_date: today }
    }
  }

  // ── Registrar entrenamiento completado ────────────────────────────────────

  async function recordTraining(xpEarned, sessionVolume = 0) {
    if (!auth.uid) return
    const today       = toDateKey()
    const prevLvlIdx  = currentLevel.value.index

    const lastTrained = data.value.last_trained
    const yesterday   = (() => {
      const d = new Date(); d.setDate(d.getDate() - 1)
      return d.toISOString().split('T')[0]
    })()
    const wasConsecutive = lastTrained === yesterday || lastTrained === today

    const newStreak = wasConsecutive ? (data.value.streak || 0) + 1 : 1
    const newXP     = (data.value.xp || 0) + xpEarned

    // Personal bests
    const pb = { ...(data.value.personal_bests || {}) }
    if (sessionVolume > (pb.best_volume || 0)) {
      pb.best_volume      = sessionVolume
      pb.best_volume_date = today
    }
    if (newStreak > (pb.best_streak || 0)) {
      pb.best_streak = newStreak
    }

    await updateDoc(doc(db, 'users', auth.uid, 'ranking', 'data'), {
      xp:             newXP,
      streak:         newStreak,
      last_trained:   today,
      missed_days:    0,
      personal_bests: pb,
      last_updated:   serverTimestamp(),
    })

    data.value = { ...data.value, xp: newXP, streak: newStreak, last_trained: today, missed_days: 0, personal_bests: pb }

    // Detectar subida de nivel
    const newLvlIdx = currentLevel.value.index
    if (newLvlIdx > prevLvlIdx) {
      justLeveledUp.value = LEVELS[newLvlIdx]
      setTimeout(() => { justLeveledUp.value = null }, 10000)
    }
  }

  function clearLevelUp() { justLeveledUp.value = null }
  function consumeDecay()  { const d = pendingDecay.value; pendingDecay.value = 0; return d }

  return {
    data, loading, justLeveledUp, pendingDecay,
    xp, streak, bests,
    currentLevel, nextLevel, levelProgress, pointsToNext,
    load, recordTraining, clearLevelUp, consumeDecay,
  }
})
