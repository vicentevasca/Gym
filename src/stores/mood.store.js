import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, where, documentId,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from '@/stores/auth.store'
import { toDateKey } from '@/utils/formatters'

export const useMoodStore = defineStore('mood', () => {
  const auth = useAuthStore()

  // ── Estado ────────────────────────────────────────────────────────────────
  const todayMood   = ref(null)   // 1-5 o null si no hizo check-in
  const moodHistory = ref([])     // últimos 7 días [{ date, mood }]
  const loading     = ref(false)
  let _moodDateKey = null         // caché de fecha — evita re-leer al cambiar de tab

  // ── Computed ──────────────────────────────────────────────────────────────
  const hasCheckedIn = computed(() => todayMood.value !== null)

  // ── Cargar estado de ánimo de hoy ────────────────────────────────────────
  async function loadTodayMood() {
    if (!auth.uid) return
    const today = toDateKey()
    if (_moodDateKey === today) return   // ya cargado hoy, no re-leer
    loading.value = true
    try {
      const docRef = doc(db, 'users', auth.uid, 'habit_logs', today)
      const snap   = await getDoc(docRef)
      todayMood.value = snap.exists() && snap.data().mood != null ? snap.data().mood : null
      _moodDateKey = today
    } catch (err) {
      console.error('[mood.store] loadTodayMood:', err)
      todayMood.value = null
    } finally {
      loading.value = false
    }
  }

  // ── Guardar check-in de estado de ánimo ──────────────────────────────────
  async function saveMood(moodLevel) {
    if (!auth.uid) return
    const today  = toDateKey()
    const docRef = doc(db, 'users', auth.uid, 'habit_logs', today)

    try {
      // merge:true crea o actualiza sin leer primero
      await setDoc(docRef, { mood: moodLevel, mood_at: serverTimestamp(), date: today }, { merge: true })
      todayMood.value = moodLevel
      _moodDateKey = today

      // Actualizar historial local si está cargado
      const existing = moodHistory.value.find(e => e.date === today)
      if (existing) {
        existing.mood = moodLevel
      } else {
        moodHistory.value.unshift({ date: today, mood: moodLevel })
        if (moodHistory.value.length > 7) moodHistory.value.pop()
      }
    } catch (err) {
      console.error('[mood.store] saveMood:', err)
    }
  }

  // ── Cargar historial de los últimos 7 días ────────────────────────────────
  async function loadMoodHistory() {
    if (!auth.uid) return
    loading.value = true
    try {
      const today = new Date()
      const fmt   = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

      // Construir array de los últimos 7 días (más reciente primero)
      const days = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        days.push(fmt(d))
      }
      const startKey = days[days.length - 1]
      const endKey   = days[0]

      // Una sola query de rango en vez de 7 lecturas secuenciales
      const snap = await getDocs(
        query(
          collection(db, 'users', auth.uid, 'habit_logs'),
          where(documentId(), '>=', startKey),
          where(documentId(), '<=', endKey)
        )
      )
      const docsMap = {}
      snap.docs.forEach(d => { docsMap[d.id] = d.data() })

      moodHistory.value = days.map(key => ({
        date: key,
        mood: docsMap[key]?.mood ?? null,
      }))
    } catch (err) {
      console.error('[mood.store] loadMoodHistory:', err)
    } finally {
      loading.value = false
    }
  }

  function clearState() {
    todayMood.value   = null
    moodHistory.value = []
    loading.value     = false
    _moodDateKey      = null
  }

  return {
    todayMood,
    moodHistory,
    loading,
    hasCheckedIn,
    loadTodayMood,
    saveMood,
    loadMoodHistory,
    clearState,
  }
})
