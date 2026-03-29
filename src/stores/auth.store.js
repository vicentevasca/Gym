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
  const user    = ref(null)
  const profile = ref(null)
  const loading = ref(true)
  const error   = ref(null)

  const isLoggedIn          = computed(() => !!user.value)
  const onboardingCompleted = computed(() => profile.value?.onboarding_completed ?? false)
  const uid                 = computed(() => user.value?.uid ?? null)
  const alias               = computed(() => profile.value?.alias || user.value?.displayName || 'Tú')

  let _initPromise = null

  // Inicializa listener de auth — llamar UNA sola vez en App.vue y en el router guard.
  // Devuelve siempre la misma Promise para que múltiples awaits esperen la misma resolución.
  function init() {
    if (_initPromise) return _initPromise
    _initPromise = new Promise((resolve) => {
      onAuthChange(async (firebaseUser) => {
        user.value = firebaseUser
        if (firebaseUser) {
          await loadProfile(firebaseUser.uid)
        } else {
          profile.value = null
        }
        loading.value = false
        resolve()
      })
    })
    return _initPromise
  }

  async function loadProfile(userId) {
    try {
      const snap = await getDoc(doc(db, 'users', userId, 'profile', 'data'))
      if (snap.exists()) profile.value = { ...snap.data() }
    } catch (e) {
      console.error('Error cargando perfil:', e)
    }
  }

  async function register(email, password, alias, gender = '') {
    error.value = null
    const firebaseUser = await registerWithEmail(email, password, alias, gender)
    user.value = firebaseUser
    await loadProfile(firebaseUser.uid)
  }

  async function login(email, password) {
    error.value = null
    const firebaseUser = await loginWithEmail(email, password)
    user.value = firebaseUser
    await loadProfile(firebaseUser.uid)
  }

  async function loginGoogle() {
    error.value = null
    const firebaseUser = await loginWithGoogle()
    user.value = firebaseUser
    await loadProfile(firebaseUser.uid)
  }

  async function signOut() {
    await logout()        // Firebase elimina el token de localStorage
    user.value    = null
    profile.value = null
    // Resetear la promesa para que un nuevo login pueda reinicializar el listener
    _initPromise  = null
    loading.value = true
  }

  async function forgotPassword(email) {
    error.value = null
    await resetPassword(email)
  }

  // Wrapper con manejo de errores para las vistas
  async function tryAction(action) {
    error.value = null
    try {
      await action()
    } catch (e) {
      error.value = getAuthErrorMessage(e.code)
      throw e
    }
  }

  function clearError() { error.value = null }

  return {
    user, profile, loading, error,
    isLoggedIn, onboardingCompleted, uid, alias,
    init, login, register, loginGoogle, signOut, forgotPassword,
    clearError, loadProfile, tryAction,
  }
})

function getAuthErrorMessage(code) {
  const messages = {
    'auth/user-not-found':          'No existe cuenta con ese correo.',
    'auth/wrong-password':          'Contraseña incorrecta.',
    'auth/email-already-in-use':    'Ya existe una cuenta con ese correo.',
    'auth/weak-password':           'La contraseña debe tener al menos 6 caracteres.',
    'auth/invalid-email':           'Correo electrónico inválido.',
    'auth/too-many-requests':       'Demasiados intentos. Espera unos minutos.',
    'auth/popup-closed-by-user':    'Cerraste el popup de Google. Intenta de nuevo.',
    'auth/popup-blocked':           'El navegador bloqueó el popup. Permite popups para este sitio.',
    'auth/network-request-failed':  'Error de red. Verifica tu conexión.',
    'auth/invalid-credential':      'Correo o contraseña incorrectos.',
    'auth/user-disabled':           'Esta cuenta fue deshabilitada.',
    'auth/requires-recent-login':   'Por seguridad, vuelve a iniciar sesión.',
  }
  return messages[code] || `Error inesperado (${code}).`
}
