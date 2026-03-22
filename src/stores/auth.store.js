import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logout,
  resetPassword,
  onAuthChange,
} from '@/firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref(null)   // Firebase user object
  const profile = ref(null)   // Firestore profile doc
  const loading = ref(true)   // Mientras resuelve el auth state
  const error   = ref(null)

  const isLoggedIn           = computed(() => !!user.value)
  const onboardingCompleted  = computed(() => profile.value?.onboarding_completed ?? false)
  const uid                  = computed(() => user.value?.uid)
  const alias                = computed(() => profile.value?.alias || user.value?.displayName || 'Tú')

  // Inicializa el listener de auth — llamar UNA vez en App.vue
  function init() {
    return new Promise((resolve) => {
      const unsub = onAuthChange(async (firebaseUser) => {
        user.value = firebaseUser
        if (firebaseUser) {
          await loadProfile(firebaseUser.uid)
        } else {
          profile.value = null
        }
        loading.value = false
        resolve()
        unsub()
      })
    })
  }

  async function loadProfile(userId) {
    try {
      const snap = await getDoc(doc(db, 'users', userId, 'profile', 'data'))
      if (snap.exists()) profile.value = snap.data()
    } catch (e) {
      console.error('Error cargando perfil:', e)
    }
  }

  async function register(email, password, alias) {
    error.value = null
    try {
      const firebaseUser = await registerWithEmail(email, password, alias)
      user.value = firebaseUser
      await loadProfile(firebaseUser.uid)
    } catch (e) {
      error.value = getAuthErrorMessage(e.code)
      throw e
    }
  }

  async function login(email, password) {
    error.value = null
    try {
      const firebaseUser = await loginWithEmail(email, password)
      user.value = firebaseUser
      await loadProfile(firebaseUser.uid)
    } catch (e) {
      error.value = getAuthErrorMessage(e.code)
      throw e
    }
  }

  async function loginGoogle() {
    error.value = null
    try {
      const firebaseUser = await loginWithGoogle()
      user.value = firebaseUser
      await loadProfile(firebaseUser.uid)
    } catch (e) {
      error.value = getAuthErrorMessage(e.code)
      throw e
    }
  }

  async function signOut() {
    await logout()
    user.value = null
    profile.value = null
  }

  async function forgotPassword(email) {
    error.value = null
    try {
      await resetPassword(email)
    } catch (e) {
      error.value = getAuthErrorMessage(e.code)
      throw e
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    user, profile, loading, error,
    isLoggedIn, onboardingCompleted, uid, alias,
    init, login, register, loginGoogle, signOut, forgotPassword, clearError, loadProfile,
  }
})

function getAuthErrorMessage(code) {
  const messages = {
    'auth/user-not-found':       'No existe cuenta con ese correo.',
    'auth/wrong-password':       'Contraseña incorrecta.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
    'auth/weak-password':        'La contraseña debe tener al menos 6 caracteres.',
    'auth/invalid-email':        'Correo electrónico inválido.',
    'auth/too-many-requests':    'Demasiados intentos. Espera unos minutos.',
    'auth/popup-closed-by-user': 'Cerraste el popup de Google. Intenta de nuevo.',
    'auth/network-request-failed': 'Error de red. Verifica tu conexión.',
    'auth/invalid-credential':   'Correo o contraseña incorrectos.',
  }
  return messages[code] || 'Ocurrió un error. Intenta de nuevo.'
}
