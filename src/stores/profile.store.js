import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth.store'

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

  return { saving, nutritionPlan, updateProfile, completeOnboarding, saveThemeColor, initTheme }
})
