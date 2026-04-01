import { defineStore } from 'pinia'
import { ref } from 'vue'
import { doc, getDoc, setDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth.store'
import { toDateKey } from '@/utils/formatters'

// Versos de fallback mientras se implementan las Cloud Functions
const FALLBACK_VERSES = [
  {
    verse_text: 'El que persevera\nno es el más fuerte —\nes el que sabe detenerse\njusto antes de rendirse.\n\nUn día más.\nEso es suficiente.',
    tao_fragment: '"Actúa sin forzar. Logra sin luchar."',
    tao_source: '— Tao Te Ching, Cap. 48',
  },
  {
    verse_text: 'No llevas el peso para demostrar nada.\nLo llevas porque algo en ti\nsabe que puede más\nde lo que cree.\n\nEso ya es todo.',
    tao_fragment: '"El que se conoce a sí mismo es sabio."',
    tao_source: '— Tao Te Ching, Cap. 33',
  },
  {
    verse_text: 'La constancia no es hacer todo perfecto.\nEs volver\naun cuando ayer falló,\naun cuando hoy duele.\n\nLa raíz no necesita aplausos para crecer.',
    tao_fragment: '"Las raíces profundas resisten cualquier viento."',
    tao_source: '— Tao Te Ching, Cap. 59',
  },
]

export const useVerseStore = defineStore('verse', () => {
  const auth    = useAuthStore()
  const verse   = ref(null)
  const library = ref([])
  const loading = ref(false)
  const shown   = ref(false)   // si ya se mostró hoy

  async function loadTodayVerse() {
    if (!auth.uid) return
    loading.value = true
    try {
      const dateKey = toDateKey()
      const ref     = doc(db, 'users', auth.uid, 'daily_verse', dateKey)
      const snap    = await getDoc(ref)

      if (snap.exists()) {
        verse.value = snap.data()
        shown.value = localStorage.getItem(`verse-shown-${auth.uid}-${dateKey}`) === '1'
      } else {
        // Fallback local hasta que Cloud Functions esté activo
        const fallback = FALLBACK_VERSES[new Date().getDay() % FALLBACK_VERSES.length]
        const verseData = {
          date:              dateKey,
          ...fallback,
          saved:             false,
          generated_at:      new Date().toISOString(),
          source:            'fallback',
        }
        await setDoc(ref, verseData)
        verse.value = verseData
        shown.value = false
      }
    } finally {
      loading.value = false
    }
  }

  function markShown() {
    shown.value = true
    localStorage.setItem(`verse-shown-${auth.uid}-${toDateKey()}`, '1')
  }

  async function saveVerse() {
    if (!auth.uid || !verse.value) return
    const dateKey = toDateKey()

    // Marcar en el doc del día
    const dayRef = doc(db, 'users', auth.uid, 'daily_verse', dateKey)
    await setDoc(dayRef, { ...verse.value, saved: true }, { merge: true })

    // Guardar en biblioteca
    const libRef = doc(db, 'users', auth.uid, 'verse_library', dateKey)
    await setDoc(libRef, {
      original_date:  dateKey,
      verse_text:     verse.value.verse_text,
      tao_fragment:   verse.value.tao_fragment,
      tao_source:     verse.value.tao_source,
      saved_at:       serverTimestamp(),
      personal_note:  '',
    })

    verse.value = { ...verse.value, saved: true }
  }

  async function loadLibrary() {
    if (!auth.uid) return
    const q    = query(collection(db, 'users', auth.uid, 'verse_library'), orderBy('original_date', 'desc'))
    const snap = await getDocs(q)
    library.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }

  function clearState() {
    verse.value   = null
    library.value = []
    loading.value = false
    shown.value   = false
  }

  return { verse, library, loading, shown, loadTodayVerse, markShown, saveVerse, loadLibrary, clearState }
})
