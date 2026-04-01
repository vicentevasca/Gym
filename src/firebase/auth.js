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
import { toDateKey } from '@/utils/formatters'

const googleProvider = new GoogleAuthProvider()

// Registrar con email + password
export async function registerWithEmail(email, password, alias, gender = '') {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName: alias })
  await createUserProfile(credential.user, alias, gender)
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

// Crear perfil inicial en Firestore + todos los documentos base del usuario
async function createUserProfile(user, alias, gender = '') {
  const uid = user.uid
  const today = toDateKey()

  // 1. Documento principal de perfil
  await setDoc(doc(db, 'users', uid, 'profile', 'data'), {
    uid,
    email: user.email,
    alias,
    gender:        gender || 'masculino',
    trainer_alias: 'Coach',
    created_at:    serverTimestamp(),
    onboarding_completed: false,
    theme_color:   'lilac',
    language:      'es',
    speak_mode:    'tu',
    biometrics:    {},
    goals:         {},
    personal:      {},
    training_prefs:{},
    settings: {
      notifications_enabled: false,
      mode:         'dark',
      verse_time:   '06:00',
      verse_style:  'poetico',
      units:        'metric',
    },
    spotify: { connected: false },
  })

  // 2. Ranking inicial — crea el documento para que addXP() y recordTraining() funcionen sin race condition
  await setDoc(doc(db, 'users', uid, 'ranking', 'data'), {
    xp:              0,
    streak:          0,
    last_trained:    null,
    missed_days:     0,
    personal_bests:  { best_volume: 0, best_streak: 0 },
    last_decay_date: today,
    created_at:      serverTimestamp(),
  })

  // 3. Balance de puntos inicial
  await setDoc(doc(db, 'users', uid, 'points', 'balance'), {
    balance:        0,
    total_earned:   0,
    total_redeemed: 0,
    last_updated:   serverTimestamp(),
  })
}
