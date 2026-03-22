import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'

const googleProvider = new GoogleAuthProvider()

// Registrar con email + password
export async function registerWithEmail(email, password, alias) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName: alias })
  await createUserProfile(credential.user, alias)
  return credential.user
}

// Login con email + password
export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

// Login con Google
export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider)
  const user = credential.user
  // Solo crear perfil si es la primera vez
  const profileSnap = await getDoc(doc(db, 'users', user.uid, 'profile', 'data'))
  if (!profileSnap.exists()) {
    await createUserProfile(user, user.displayName || 'Usuario')
  }
  return user
}

// Cerrar sesión
export async function logout() {
  await signOut(auth)
}

// Recuperar contraseña
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email)
}

// Escuchar cambios de auth (retorna unsubscribe)
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

// Crear perfil inicial en Firestore
async function createUserProfile(user, alias) {
  const profileRef = doc(db, 'users', user.uid, 'profile', 'data')
  await setDoc(profileRef, {
    uid: user.uid,
    email: user.email,
    alias,
    trainer_alias: 'Coach',
    created_at: serverTimestamp(),
    onboarding_completed: false,
    theme_color: 'lilac',
    language: 'es',
    speak_mode: 'tu',
    biometrics: {},
    goals: {},
    personal: {},
    training_prefs: {},
    settings: {
      notifications_enabled: false,
      verse_time: '06:00',
      verse_style: 'poetico',
      units: 'metric',
    },
    spotify: { connected: false },
  })
}
