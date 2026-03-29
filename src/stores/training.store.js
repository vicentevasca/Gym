import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  doc, getDoc, setDoc, updateDoc,
  collection, getDocs, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore }   from './auth.store'
import { usePointsStore } from './points.store'
import { useRankingStore } from './ranking.store'
import { toDateKey }      from '@/utils/formatters'
import { generateSession, checkProgression } from '@/utils/progressionEngine'
import { generateRoutine, getSessionForDate } from '@/utils/routineGenerator'
import { useToast } from '@/composables/useToast'

export const useTrainingStore = defineStore('training', () => {
  const auth    = useAuthStore()

  const session             = ref(null)
  const records             = ref({})
  const elapsedSeconds      = ref(0)
  const loading             = ref(false)
  const newRecord           = ref(null)
  const sessionPointsEarned = ref(0)  // acumulado de sets+ejercicios en la sesión actual
  const routine             = ref(null)
  let sessionTimer          = null
  let sessionUnsub          = null

  // Aliases for views
  const todaySession           = computed(() => session.value)
  const progressionSuggestions = computed(() => session.value?.progression_suggestions ?? [])

  const today         = () => toDateKey()
  const isActive      = computed(() => session.value?.status === 'in_progress')
  const isComplete    = computed(() => session.value?.status === 'completed')
  const progressPct   = computed(() => {
    if (!session.value) return 0
    const { exercises_completed, exercises_total } = session.value
    return exercises_total ? Math.round((exercises_completed / exercises_total) * 100) : 0
  })

  // ── Cargar rutina del usuario ──────────────────────────────

  async function loadRoutine() {
    if (!auth.uid) return
    try {
      const snap = await getDoc(doc(db, 'users', auth.uid, 'routines', 'current'))
      if (snap.exists()) routine.value = snap.data()
    } catch (e) {
      console.warn('[training] No se pudo cargar la rutina:', e)
    }
  }

  async function saveRoutine(routineData) {
    if (!auth.uid) return
    await setDoc(doc(db, 'users', auth.uid, 'routines', 'current'), {
      ...routineData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    routine.value = routineData
  }

  async function createAutoRoutine(params) {
    const recs = Object.keys(records.value).length ? records.value : await loadRecords()
    const generated = generateRoutine(params, recs)
    generated.id   = Date.now().toString()
    generated.name = `Mi rutina — ${params.style}`
    await saveRoutine(generated)
    return generated
  }

  // ── Cargar sesión del día ──────────────────────────────────

  async function loadTodaySession() {
    if (!auth.uid) return
    loading.value = true
    try {
      const dateKey  = today()
      const logRef   = doc(db, 'users', auth.uid, 'training_logs', dateKey)
      const snap     = await getDoc(logRef)

      if (snap.exists()) {
        session.value = snap.data()
      } else {
        // Cargar rutina si no está en memoria
        if (!routine.value) await loadRoutine()

        const recs = await loadRecords()

        let generated = null

        // Intentar generar desde la rutina personalizada
        if (routine.value) {
          generated = getSessionForDate(routine.value, dateKey, recs)
        }

        // Fallback al generador legacy
        if (!generated) {
          generated = generateSession(auth.profile, dateKey, recs)
        }

        if (generated) {
          await setDoc(logRef, generated)
          session.value = generated
        }
      }

      // Listener realtime
      sessionUnsub?.()
      sessionUnsub = onSnapshot(logRef, (s) => {
        if (s.exists()) session.value = s.data()
      })
    } finally {
      loading.value = false
    }
  }

  // ── Récords personales ─────────────────────────────────────

  async function loadRecords() {
    if (!auth.uid) return {}
    const snap = await getDocs(collection(db, 'users', auth.uid, 'records'))
    const recs = {}
    snap.forEach(d => { recs[d.id] = d.data() })
    records.value = recs
    return recs
  }

  async function checkAndUpdateRecord(exerciseId, weightKg, reps) {
    if (!auth.uid) return false
    const recRef  = doc(db, 'users', auth.uid, 'records', exerciseId)
    const current = records.value[exerciseId]
    const volume  = weightKg * reps
    const isNewPR = !current || weightKg > (current.max_weight_kg || 0)

    if (isNewPR) {
      const update = {
        exercise_id:     exerciseId,
        max_weight_kg:   weightKg,
        max_weight_date: today(),
        target_reps:     reps,
        history:         [...(current?.history || []), { date: today(), weight_kg: weightKg, reps, volume }],
      }
      await setDoc(recRef, update, { merge: true })
      records.value[exerciseId] = update
      newRecord.value = { exerciseId, weightKg }
      setTimeout(() => { newRecord.value = null }, 4000)
      // Toast de PR
      const exName = session.value?.exercises?.find(e => e.exercise_id === exerciseId)?.name || exerciseId
      const { toast } = useToast()
      toast.pr(exName)
      return true
    }
    return false
  }

  // ── Completar serie ────────────────────────────────────────

  async function completeSerie(exerciseIndex, setIndex, weightKg, reps) {
    if (!auth.uid || !session.value) return
    const logRef     = doc(db, 'users', auth.uid, 'training_logs', today())
    const exercises  = [...(session.value.exercises || [])]
    const exercise   = { ...exercises[exerciseIndex] }
    const sets       = [...exercise.sets]

    sets[setIndex] = { ...sets[setIndex], weight_kg: weightKg, reps, completed: true, timestamp: new Date().toISOString() }
    exercise.sets  = sets

    // ¿Ejercicio completo?
    const exComplete = sets.every(s => s.completed)
    if (exComplete) {
      exercise.completed = true
      // Verificar PR solo si hay peso real
      if (weightKg > 0) {
        const maxSet = sets.reduce((a, b) => b.weight_kg > a.weight_kg ? b : a, sets[0])
        await checkAndUpdateRecord(exercise.exercise_id, maxSet.weight_kg, maxSet.reps)
      }
    }

    exercises[exerciseIndex] = exercise
    const completedCount = exercises.filter(e => e.completed).length

    await updateDoc(logRef, {
      exercises,
      exercises_completed: completedCount,
    })

    // Puntos por serie y ejercicio
    const pts = usePointsStore()
    await pts.earnSet()
    sessionPointsEarned.value += 3

    if (exComplete) {
      await pts.earnExercise()
      sessionPointsEarned.value += 10
    }

    // Vibración
    navigator.vibrate?.(30)

    // ¿Sesión completa?
    if (completedCount >= exercises.length) {
      await completeSession()
    }
  }

  // ── Iniciar / Completar sesión ─────────────────────────────

  async function startSession() {
    if (!auth.uid || !session.value) return
    const logRef = doc(db, 'users', auth.uid, 'training_logs', today())
    await updateDoc(logRef, { status: 'in_progress', started_at: serverTimestamp() })
    startTimer()
  }

  async function completeSession() {
    if (!auth.uid) return
    stopTimer()
    const logRef = doc(db, 'users', auth.uid, 'training_logs', today())
    const durationMin = Math.floor(elapsedSeconds.value / 60)

    // Calcular volumen total
    const totalVolume = (session.value?.exercises || []).reduce((total, ex) => {
      return total + ex.sets.filter(s => s.completed).reduce((v, s) => v + s.weight_kg * s.reps, 0)
    }, 0)

    await updateDoc(logRef, {
      status:          'completed',
      completed_at:    serverTimestamp(),
      duration_min:    durationMin,
      volume_total_kg: Math.round(totalVolume),
    })

    // ── Puntos y ranking ─────────────────────────────────────────────────────
    const pts     = usePointsStore()
    const ranking = useRankingStore()

    const completedExercises = session.value?.exercises?.filter(e => e.completed).length || 0
    const allComplete  = completedExercises >= (session.value?.exercises?.length || 0)
    const sessionPts   = sessionPointsEarned.value
    const earnedTotal  = await pts.earnSessionComplete(sessionPts, allComplete)

    // Decaimiento pendiente (días sin entrenar)
    const decayAmt = ranking.consumeDecay?.() || 0
    if (decayAmt > 0) await pts.applyDecay?.(decayAmt)

    // Registrar en ranking: XP = sessionPts + earnedTotal (session bonus)
    const totalXP = sessionPts + (allComplete ? Math.round(sessionPts * 0.5) : 0) + earnedTotal
    await ranking.recordTraining(totalXP, Math.round(totalVolume))

    sessionPointsEarned.value = 0  // reset para la próxima sesión

    navigator.vibrate?.([50, 30, 50, 30, 100])

    // Sugerencias de progresión
    await generateProgressionSuggestions()
  }

  async function generateProgressionSuggestions() {
    if (!session.value?.exercises) return
    const suggestions = []
    for (const ex of session.value.exercises) {
      if (!ex.completed) continue
      const suggestion = checkProgression(ex.sets, records.value[ex.exercise_id])
      if (suggestion) suggestions.push({ exercise: ex.name, ...suggestion })
    }
    if (suggestions.length && auth.uid) {
      const logRef = doc(db, 'users', auth.uid, 'training_logs', today())
      await updateDoc(logRef, { progression_suggestions: suggestions })
    }
  }

  // ── Timer ──────────────────────────────────────────────────

  function startTimer() {
    elapsedSeconds.value = 0
    sessionTimer = setInterval(() => { elapsedSeconds.value++ }, 1000)
  }

  function stopTimer() {
    clearInterval(sessionTimer)
    sessionTimer = null
  }

  function cleanup() {
    stopTimer()
    sessionUnsub?.()
  }

  return {
    session, todaySession, progressionSuggestions,
    records, elapsedSeconds, loading, newRecord, sessionPointsEarned,
    isActive, isComplete, progressPct,
    routine,
    loadTodaySession, loadRecords, completeSerie, startSession, completeSession, cleanup,
    loadRoutine, saveRoutine, createAutoRoutine,
  }
})
