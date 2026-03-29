import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs,
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

  // ── Computed ──────────────────────────────────────────────────────────────
  const hasCheckedIn = computed(() => todayMood.value !== null)

  // ── Cargar estado de ánimo de hoy ────────────────────────────────────────
  async function loadTodayMood() {
    if (!auth.uid) return
    loading.value = true
    try {
      const today   = toDateKey()
      const docRef  = doc(db, 'users', auth.uid, 'habit_logs', today)
      const snap    = await getDoc(docRef)
      if (snap.exists() && snap.data().mood != null) {
        todayMood.value = snap.data().mood
      } else {
        todayMood.value = null
      }
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
      const snap = await getDoc(docRef)
      if (snap.exists()) {
        await updateDoc(docRef, {
          mood:    moodLevel,
          mood_at: serverTimestamp(),
        })
      } else {
        await setDoc(docRef, {
          mood:    moodLevel,
          mood_at: serverTimestamp(),
          date:    today,
        })
      }
      todayMood.value = moodLevel

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
      const history = []
      const today   = new Date()

      for (let i = 0; i < 7; i++) {
        const d    = new Date(today)
        d.setDate(d.getDate() - i)
        const key  = toDateKey(d)
        const snap = await getDoc(doc(db, 'users', auth.uid, 'habit_logs', key))
        if (snap.exists() && snap.data().mood != null) {
          history.push({ date: key, mood: snap.data().mood })
        } else {
          history.push({ date: key, mood: null })
        }
      }

      moodHistory.value = history
    } catch (err) {
      console.error('[mood.store] loadMoodHistory:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    todayMood,
    moodHistory,
    loading,
    hasCheckedIn,
    loadTodayMood,
    saveMood,
    loadMoodHistory,
  }
})
