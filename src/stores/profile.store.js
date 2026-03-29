import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth.store'
import { toDateKey } from '@/utils/formatters'
import { useToast } from '@/composables/useToast'

export const useProfileStore = defineStore('profile', () => {
  const saving = ref(false)

  const nutritionPlan = computed(() => {
    const auth = useAuthStore()
    return auth.profile?.nutrition_plan ?? null
  })

  async function updateProfile(data) {
    const auth = useAuthStore()
    if (!auth.uid) return
    saving.value = true
    try {
      const ref = doc(db, 'users', auth.uid, 'profile', 'data')
      await updateDoc(ref, { ...data, updated_at: serverTimestamp() })
      await auth.loadProfile(auth.uid)
    } finally {
      saving.value = false
    }
  }

  async function completeOnboarding() {
    await updateProfile({ onboarding_completed: true })
  }

  async function saveThemeColor(themeId) {
    await updateProfile({ theme_color: themeId })
    applyThemeColor(themeId)
  }

  function applyThemeColor(themeId) {
    document.documentElement.setAttribute('data-theme', themeId)
    localStorage.setItem('disciplina-theme', themeId)
  }

  function initTheme() {
    const saved = localStorage.getItem('disciplina-theme')
    if (saved) applyThemeColor(saved)
  }

  async function saveWeight(weightKg) {
    const auth = useAuthStore()
    if (!auth.uid || !weightKg || weightKg <= 0) return
    saving.value = true
    try {
      const dateKey = toDateKey()
      await setDoc(
        doc(db, 'users', auth.uid, 'weight_logs', dateKey),
        { date: dateKey, weight_kg: weightKg, recorded_at: serverTimestamp() }
      )
      await updateProfile({ 'biometrics.weight_kg': weightKg })
      const { toast } = useToast()
      toast.success(`Peso registrado: ${weightKg} kg`)
    } finally {
      saving.value = false
    }
  }

  return { saving, nutritionPlan, updateProfile, completeOnboarding, saveThemeColor, initTheme, saveWeight }
})
