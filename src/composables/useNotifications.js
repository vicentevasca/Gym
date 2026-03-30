import { ref } from 'vue'
import { useAuthStore }    from '@/stores/auth.store'
import { useTrainingStore } from '@/stores/training.store'

// ── Bancos de mensajes genereados ──────────────────────────────────────────────

const MSG = {
  femenino: {
    morning: [
      { title: '🌸 Buenos días, campeona', body: 'Hoy eres más fuerte que ayer. Tu cuerpo te lo va a agradecer.' },
      { title: '✨ Hola, bella', body: 'El mundo brilla diferente cuando entrenas con amor propio. ¡Vamos!' },
      { title: '🌺 Empezamos bien', body: 'Cada repetición es un acto de cuidado hacia ti misma. ¡Tú puedes!' },
      { title: '💪 Mañana de poder', body: 'Tu energía de hoy va a definir cómo te sientes el resto del día. ¡A moverse!' },
    ],
    afternoon: [
      { title: '🌻 Pausa activa', body: 'Ya pasó la mitad del día. ¿Y si te regalas 40 minutos para ti?' },
      { title: '💫 Momento tuyo', body: 'No necesitas motivación perfecta. Solo dar el primer paso. Tú tienes el poder.' },
      { title: '🎯 Recuerda tu meta', body: 'Cada día que entrenas es un día que te eliges a ti misma. Hoy es ese día.' },
      { title: '🌸 Te mereces esto', body: 'Entrenar no es un castigo, es un regalo. Y hoy te lo mereces.' },
    ],
    evening: [
      { title: '🌙 Última oportunidad hoy', body: '¿Todavía sin entrenar? Aún tienes tiempo. 30 minutos bastan.' },
      { title: '💆‍♀️ Cierra el día fuerte', body: 'Un entrenamiento nocturno libera el estrés acumulado. ¡Inténtalo!' },
      { title: '✨ Termina bien', body: 'Quienes entrenan de noche duermen mejor y sueñan más bonito. 😊' },
    ],
    rest: [
      { title: '🌿 Hoy toca descanso', body: 'Tu cuerpo crece mientras descansas. Cuídate, hidrátate y recupérate.' },
      { title: '💆‍♀️ Día de recuperación', body: 'El descanso también es parte del progreso. ¡Escucha a tu cuerpo!' },
    ],
    training: [
      { title: '💪 Toca entrenar hoy', body: 'Tu sesión de {session} te espera. ¡Puedes con eso y más!' },
      { title: '🔥 ¡Es tu día!', body: 'Tienes {count} ejercicios esperándote. Vamos paso a paso.' },
      { title: '🌟 Hora de brillar', body: 'Sesión de hoy: {session}. Cada gota de sudor vale la pena.' },
    ],
  },
  masculino: {
    morning: [
      { title: '💀 Despierta, mediocre', body: 'Mientras tú dormías, alguien más se levantó a entrenar. ¿Te vas a quedar atrás?' },
      { title: '🔥 Buenos días, novato', body: 'El abuelo del gym ya completó su primera serie. ¿Y tú qué esperas?' },
      { title: '⚡ Amanecer de batalla', body: 'Los que no entrenan hoy son los que se arrepienten mañana. ¿Cuál quieres ser tú?' },
      { title: '🏋️ Levántate', body: 'El dolor de hoy es la fortaleza de mañana. ¡Deja de buscar pretextos!' },
    ],
    afternoon: [
      { title: '🎯 ¿Ya entrenaste?', body: 'Llevas la mitad del día. Si no has entrenado, es que decidiste no hacerlo. Arréglalo.' },
      { title: '💪 El reto de hoy', body: 'Reto: termina la sesión de hoy sin pausas extra. ¿Tienes lo que se necesita?' },
      { title: '🔥 Sin excusas', body: 'La motivación es para aficionados. La disciplina es para ganadores. ¿Cuál eres tú?' },
      { title: '⚔️ Hora de guerra', body: 'Cada día sin entrenar es un día que tu rival te lleva ventaja. ¡Muévete!' },
    ],
    evening: [
      { title: '⏰ Último aviso', body: 'Faltan pocas horas. Si no entrenas hoy, mañana el arrepentimiento llega más temprano.' },
      { title: '🌙 Hombres de noche', body: 'Los mejores entrenamientos son los que otros no ven. ¡Demuéstrate a ti mismo!' },
      { title: '💀 ¿Sí o no?', body: 'Simple: ¿entrenaste hoy o dejaste que ganara la flojera? Aún puedes cambiar la respuesta.' },
    ],
    rest: [
      { title: '🛡️ Hoy toca descanso', body: 'Los músculos crecen en el descanso. Aliméntate bien y duerme como un campeón.' },
      { title: '⚡ Recuperación activa', body: 'Descansa estratégicamente. Mañana te vas a necesitar al 100%.' },
    ],
    training: [
      { title: '💀 Sesión de hoy', body: '{session} — {count} ejercicios. El abuelo del gym lo haría con los ojos cerrados. ¿Y tú?' },
      { title: '🏋️ No te rajes', body: 'Toca {session}. Cada serie que evites es debilidad que acumulas. ¡A por ello!' },
      { title: '⚔️ Batalla del día', body: 'Tu misión: {session}. Completa los {count} ejercicios sin excusas. ¡Demuéstralo!' },
    ],
  },
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function todayKey() {
  return `notif_shown_${new Date().toISOString().slice(0, 10)}`
}

function getTimeSlot() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

function alreadyShownToday() {
  return localStorage.getItem(todayKey()) === '1'
}

function markShownToday() {
  localStorage.setItem(todayKey(), '1')
}

// ── Composable ─────────────────────────────────────────────────────────────────

export function useNotifications() {
  const permission = ref(typeof Notification !== 'undefined' ? Notification.permission : 'denied')

  // ── Request OS permission ────────────────────────────────────────────────
  async function requestPermission() {
    if (typeof Notification === 'undefined') return 'denied'
    const result = await Notification.requestPermission()
    permission.value = result

    if (result === 'granted') {
      // Save preference to Firestore via auth profile
      const auth = useAuthStore()
      if (auth.uid) {
        const { doc, updateDoc } = await import('firebase/firestore')
        const { db } = await import('@/firebase/config')
        await updateDoc(doc(db, 'users', auth.uid), {
          'settings.notifications_enabled': true,
        }).catch(() => {})
      }
    }
    return result
  }

  // ── Show OS notification ─────────────────────────────────────────────────
  async function showOSNotification(title, body, opts = {}) {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return

    const options = {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: opts.tag || 'disciplina-reminder',
      renotify: true,
      ...opts,
    }

    try {
      // Prefer service worker notification (shows even in background)
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration()
        if (reg) {
          await reg.showNotification(title, options)
          return
        }
      }
    } catch (_) { /* fall through */ }

    // Fallback: direct Notification API
    new Notification(title, options)
  }

  // ── Build notification content ───────────────────────────────────────────
  function buildMessage(gender, isRest, sessionName, exerciseCount) {
    const bank = gender === 'femenino' ? MSG.femenino : MSG.masculino

    if (isRest) {
      return randomPick(bank.rest)
    }

    if (sessionName && exerciseCount > 0) {
      const tmpl = randomPick(bank.training)
      return {
        title: tmpl.title,
        body: tmpl.body
          .replace('{session}', sessionName)
          .replace('{count}', exerciseCount),
      }
    }

    const slot = getTimeSlot()
    return randomPick(bank[slot])
  }

  // ── Daily reminder check (called on app open) ────────────────────────────
  async function checkDailyReminder() {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return
    if (alreadyShownToday()) return

    const auth = useAuthStore()
    if (!auth.isLoggedIn) return

    // Check user reminder settings
    const notifEnabled = auth.profile?.settings?.notifications_enabled
    if (!notifEnabled) return

    const reminderTime = auth.profile?.settings?.reminder_time || '08:00'
    const [rh, rm] = reminderTime.split(':').map(Number)
    const now = new Date()
    const targetMinutes = rh * 60 + rm
    const nowMinutes    = now.getHours() * 60 + now.getMinutes()
    const diff = Math.abs(nowMinutes - targetMinutes)

    // Only show within ±90 min of configured reminder time
    if (diff > 90) return

    const training = useTrainingStore()
    const gender   = auth.profile?.gender || 'masculino'
    const session  = training.todaySession
    const isRest   = !session

    const { title, body } = buildMessage(
      gender,
      isRest,
      session?.name,
      session?.exercises?.length ?? 0,
    )

    markShownToday()
    await showOSNotification(title, body, { tag: 'disciplina-daily' })
  }

  // ── Manual test notification ─────────────────────────────────────────────
  async function sendTestNotification() {
    const auth    = useAuthStore()
    const gender  = auth.profile?.gender || 'masculino'
    const slot    = getTimeSlot()
    const bank    = gender === 'femenino' ? MSG.femenino : MSG.masculino
    const { title, body } = randomPick(bank[slot])
    await showOSNotification(title, body, { tag: 'disciplina-test' })
  }

  // ── Save notification prefs to Firestore ─────────────────────────────────
  async function saveNotificationPrefs(enabled, reminderTime) {
    const auth = useAuthStore()
    if (!auth.uid) return
    const { doc, updateDoc } = await import('firebase/firestore')
    const { db } = await import('@/firebase/config')
    await updateDoc(doc(db, 'users', auth.uid), {
      'settings.notifications_enabled': enabled,
      'settings.reminder_time': reminderTime,
    })
    // Reload profile so the store reflects latest settings
    if (auth.loadProfile) await auth.loadProfile(auth.uid)
  }

  return {
    permission,
    requestPermission,
    showOSNotification,
    checkDailyReminder,
    sendTestNotification,
    saveNotificationPrefs,
  }
}
