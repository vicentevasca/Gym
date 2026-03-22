import { defineStore } from 'pinia'
import { ref } from 'vue'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth.store'

export const useProfileStore = defineStore('profile', () => {
  const saving = ref(false)

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

  return { saving, updateProfile, completeOnboarding }
})
