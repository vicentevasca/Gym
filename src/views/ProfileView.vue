<script setup>
import { ref, computed, onMounted } from 'vue'
import AppHeader           from '@/components/ui/AppHeader.vue'
import BottomNav           from '@/components/ui/BottomNav.vue'
import { useAuthStore }    from '@/stores/auth.store'
import { useProfileStore } from '@/stores/profile.store'
import { useRankingStore } from '@/stores/ranking.store'
import { useRouter }       from 'vue-router'
import { staggerIn }       from '@/composables/useAnimations'
import { useNotifications } from '@/composables/useNotifications'

const auth    = useAuthStore()
const profile = useProfileStore()
const ranking = useRankingStore()
const router  = useRouter()
const rows    = ref([])

// ── Peso corporal ──────────────────────────────────────────────
const weightInput   = ref('')
const savingWeight  = ref(false)
const weightSaved   = ref(false)

// ── Notificaciones ──────────────────────────────────────────────
const notif = useNotifications()
const notifEnabled    = ref(false)
const reminderTime    = ref('08:00')
const savingNotif     = ref(false)
const notifSaved      = ref(false)
const requestingPerm  = ref(false)

// ── Logout confirm ─────────────────────────────────────────────
const showLogoutConfirm = ref(false)

// ── Temas ──────────────────────────────────────────────────────
const themes = [
  { id: 'lilac', label: 'Lila',  color: '#c4b5fd' },
  { id: 'cyan',  label: 'Cian',  color: '#67e8f9' },
  { id: 'amber', label: 'Ámbar', color: '#fbbf24' },
  { id: 'coral', label: 'Coral', color: '#fb7185' },
  { id: 'green', label: 'Verde', color: '#4ade80' },
]

const currentWeight = computed(() =>
  auth.profile?.biometrics?.weight_kg ?? null
)

onMounted(async () => {
  staggerIn(rows.value.filter(Boolean), { delay: 0.1, y: 14 })
  profile.initTheme()
  await ranking.load()
  if (currentWeight.value) weightInput.value = currentWeight.value
  // Load saved notification prefs
  notifEnabled.value  = auth.profile?.settings?.notifications_enabled ?? false
  reminderTime.value  = auth.profile?.settings?.reminder_time ?? '08:00'
})

async function selectTheme(themeId) {
  await profile.saveThemeColor(themeId)
}

async function handleSaveWeight() {
  const w = parseFloat(weightInput.value)
  if (isNaN(w) || w < 20 || w > 300) return
  savingWeight.value = true
  try {
    await profile.saveWeight(w)
    weightSaved.value = true
    setTimeout(() => { weightSaved.value = false }, 2500)
  } finally {
    savingWeight.value = false
  }
}

async function handleRequestPerm() {
  requestingPerm.value = true
  try {
    await notif.requestPermission()
  } finally {
    requestingPerm.value = false
  }
}

async function handleSaveNotif() {
  savingNotif.value = true
  try {
    await notif.saveNotificationPrefs(notifEnabled.value, reminderTime.value)
    notifSaved.value = true
    setTimeout(() => { notifSaved.value = false }, 2500)
  } finally {
    savingNotif.value = false
  }
}

function confirmLogout() {
  showLogoutConfirm.value = true
}

async function handleLogout() {
  showLogoutConfirm.value = false
  sessionStorage.removeItem('disciplina_splash_done')
  await auth.signOut()
  router.push('/login')
}
</script>

<template>
  <div>
    <AppHeader title="Perfil" />

    <main class="page-content">

      <!-- ── Hero del perfil ─────────────────────────────────── -->
      <div :ref="el => rows[0] = el" class="profile-hero">
        <div class="profile-avatar-lg">
          {{ auth.alias?.charAt(0)?.toUpperCase() || 'D' }}
        </div>
        <div class="profile-info">
          <h2 class="profile-name">{{ auth.alias }}</h2>
          <p class="profile-email">{{ auth.user?.email }}</p>
          <div class="rank-row">
            <span class="rank-dot" :style="{ background: ranking.currentLevel?.color ?? '#888' }" />
            <span class="rank-label" :style="{ color: ranking.currentLevel?.color ?? '#888' }">
              {{ ranking.currentLevel?.emoji }} {{ ranking.currentLevel?.name }}
            </span>
          </div>
        </div>
      </div>

      <!-- ── Stats rápidas ───────────────────────────────────── -->
      <div :ref="el => rows[1] = el" class="stats-grid card section-card">
        <div class="stat-item">
          <p class="stat-val">{{ ranking.xp }}</p>
          <p class="stat-lbl">XP Total</p>
        </div>
        <div class="stat-div" />
        <div class="stat-item">
          <p class="stat-val accent">{{ ranking.streak }}</p>
          <p class="stat-lbl">Racha actual</p>
        </div>
        <div class="stat-div" />
        <div class="stat-item">
          <p class="stat-val">{{ ranking.bests?.best_streak ?? 0 }}</p>
          <p class="stat-lbl">Mejor racha</p>
        </div>
      </div>

      <!-- ── Peso corporal ───────────────────────────────────── -->
      <div :ref="el => rows[2] = el" class="card section-card">
        <p class="section-title label-caps">Peso corporal</p>
        <div class="weight-row">
          <div class="weight-input-wrap input-with-icon">
            <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
            <input
              v-model="weightInput"
              class="input-field"
              type="number"
              inputmode="decimal"
              placeholder="kg"
              min="20"
              max="300"
              step="0.1"
            />
          </div>
          <button
            class="btn btn-secondary weight-save-btn"
            :disabled="savingWeight || !weightInput"
            @click="handleSaveWeight"
          >
            <template v-if="savingWeight"><div class="spinner" /></template>
            <template v-else-if="weightSaved">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Guardado
            </template>
            <template v-else>Guardar</template>
          </button>
        </div>
        <p v-if="currentWeight" class="weight-current">
          Último registro: <strong>{{ currentWeight }} kg</strong>
        </p>
      </div>

      <!-- ── Tema de color ───────────────────────────────────── -->
      <div :ref="el => rows[3] = el" class="card section-card">
        <p class="section-title label-caps">Tema de color</p>
        <div class="themes-row">
          <button
            v-for="t in themes"
            :key="t.id"
            class="theme-dot"
            :class="{ active: (auth.profile?.theme_color || 'lilac') === t.id }"
            :style="{ '--dot-color': t.color }"
            :title="t.label"
            @click="selectTheme(t.id)"
          />
        </div>
      </div>

      <!-- ── Notificaciones ─────────────────────────────────── -->
      <div :ref="el => rows[4] = el" class="card section-card">
        <p class="section-title label-caps">Recordatorios</p>

        <!-- Permission banner -->
        <div v-if="notif.permission.value !== 'granted'" class="perm-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          <p>Activa los permisos del sistema para recibir recordatorios.</p>
          <button class="btn btn-secondary btn-sm" :disabled="requestingPerm" @click="handleRequestPerm">
            <div v-if="requestingPerm" class="spinner" />
            <span v-else>Activar</span>
          </button>
        </div>

        <!-- Toggle + time picker -->
        <div class="notif-row">
          <div class="notif-toggle-wrap" @click="notifEnabled = !notifEnabled">
            <div class="toggle-track" :class="{ on: notifEnabled }">
              <div class="toggle-thumb" />
            </div>
            <span class="notif-label">Recordatorio diario</span>
          </div>
          <input
            v-model="reminderTime"
            type="time"
            class="input-field time-input"
            :disabled="!notifEnabled"
          />
        </div>

        <p class="notif-hint">Te avisaremos qué toca entrenar hoy con un mensaje personalizado.</p>

        <!-- Actions -->
        <div class="notif-actions">
          <button
            class="btn btn-secondary notif-save-btn"
            :disabled="savingNotif"
            @click="handleSaveNotif"
          >
            <div v-if="savingNotif" class="spinner" />
            <template v-else-if="notifSaved">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Guardado
            </template>
            <template v-else>Guardar</template>
          </button>
          <button
            v-if="notif.permission.value === 'granted'"
            class="btn btn-ghost notif-test-btn"
            @click="notif.sendTestNotification()"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            Probar
          </button>
        </div>
      </div>

      <!-- ── Coming soon ─────────────────────────────────────── -->
      <div :ref="el => rows[5] = el" class="card section-card coming-card">
        <div class="coming-icon-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg>
        </div>
        <div>
          <p class="coming-title">Perfil musical y Spotify</p>
          <p class="coming-sub">Conecta Spotify para playlist personalizadas según tu entrenamiento.</p>
        </div>
      </div>

      <!-- ── Logout ──────────────────────────────────────────── -->
      <div :ref="el => rows[6] = el" class="logout-section">
        <button class="btn btn-danger btn-full" @click="confirmLogout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Cerrar sesión
        </button>
      </div>

    </main>
    <BottomNav />

    <!-- ── Modal de confirmación de logout ────────────────── -->
    <Teleport to="body">
      <div v-if="showLogoutConfirm" class="confirm-overlay" @click.self="showLogoutConfirm = false">
        <div class="confirm-card">
          <div class="confirm-icon">🚪</div>
          <h3 class="confirm-title">¿Cerrar sesión?</h3>
          <p class="confirm-body">Podrás volver a entrar con tu correo y contraseña.</p>
          <div class="confirm-actions">
            <button class="btn btn-ghost" @click="showLogoutConfirm = false">Cancelar</button>
            <button class="btn btn-danger" @click="handleLogout">Salir</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ── Hero ───────────────────────────────────────────────── */
.profile-hero {
  display: flex; align-items: center; gap: var(--space-4);
  margin-bottom: var(--space-4);
  padding: var(--space-5);
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.profile-avatar-lg {
  width: 64px; height: 64px;
  border-radius: var(--radius);
  background: var(--gradient-accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 700; color: #fff;
  box-shadow: var(--shadow-accent);
  flex-shrink: 0;
}
.profile-name  { font-size: var(--text-lg); font-weight: 700; }
.profile-email { color: var(--muted); font-size: var(--text-sm); margin-top: 2px; }
.rank-row { display: flex; align-items: center; gap: var(--space-2); margin-top: var(--space-2); }
.rank-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.rank-label { font-size: var(--text-xs); font-weight: 700; }

/* ── Stats ──────────────────────────────────────────────── */
.stats-grid {
  display: flex; align-items: center;
  padding: var(--space-4) var(--space-5);
}
.stat-item { flex: 1; text-align: center; }
.stat-div  { width: 1px; height: 32px; background: var(--border); flex-shrink: 0; }
.stat-val  {
  font-family: var(--font-mono); font-size: var(--text-xl);
  font-weight: 800; color: var(--text); line-height: 1;
}
.stat-val.accent { color: var(--accent); }
.stat-lbl { font-size: 10px; color: var(--muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.08em; }

/* ── Sections ───────────────────────────────────────────── */
.section-card { margin-bottom: var(--space-3); }
.section-title { margin-bottom: var(--space-4); }

/* ── Peso ───────────────────────────────────────────────── */
.weight-row { display: flex; gap: var(--space-3); align-items: center; }
.weight-input-wrap { flex: 1; }
.weight-save-btn { flex-shrink: 0; min-width: 100px; gap: var(--space-2); }
.weight-current { font-size: var(--text-sm); color: var(--muted); margin-top: var(--space-2); }

/* ── Temas ──────────────────────────────────────────────── */
.themes-row { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.theme-dot {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: var(--dot-color);
  border: 2px solid transparent;
  transition: var(--transition);
}
.theme-dot.active {
  border-color: var(--text);
  box-shadow: 0 0 0 3px var(--bg), 0 0 0 5px var(--dot-color);
}

/* ── Coming soon ────────────────────────────────────────── */
.coming-card {
  display: flex; align-items: flex-start; gap: var(--space-3);
  background: var(--faint-2); border-color: var(--border);
  margin-bottom: var(--space-3);
}
.coming-icon-sm {
  width: 30px; height: 30px;
  background: var(--accent-dim); border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  color: var(--accent); flex-shrink: 0;
}
.coming-title { font-size: var(--text-sm); font-weight: 600; color: var(--text); margin-bottom: 2px; }
.coming-sub   { font-size: var(--text-sm); color: var(--muted); }

/* ── Notificaciones ──────────────────────────────────────── */
.perm-banner {
  display: flex; align-items: center; gap: var(--space-3);
  background: var(--accent-dim); border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm); color: var(--accent);
}
.perm-banner p { flex: 1; font-weight: 600; line-height: 1.4; }
.perm-banner svg { flex-shrink: 0; color: var(--accent); }
.btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--text-xs); min-height: 30px; }

.notif-row {
  display: flex; align-items: center; gap: var(--space-4);
  margin-bottom: var(--space-3);
}
.notif-toggle-wrap {
  display: flex; align-items: center; gap: var(--space-3);
  cursor: pointer; user-select: none; flex: 1;
}
.toggle-track {
  width: 40px; height: 22px; border-radius: 11px;
  background: var(--border-hi);
  position: relative; transition: background 0.22s;
  flex-shrink: 0;
}
.toggle-track.on { background: var(--accent); }
.toggle-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #fff;
  transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
  box-shadow: 0 1px 4px rgba(0,0,0,0.25);
}
.toggle-track.on .toggle-thumb { transform: translateX(18px); }
.notif-label { font-size: var(--text-sm); font-weight: 600; color: var(--text); }

.time-input {
  width: 110px; flex-shrink: 0;
  text-align: center; font-family: var(--font-mono);
  padding: var(--space-2) var(--space-3);
}
.time-input:disabled { opacity: 0.4; }

.notif-hint { font-size: var(--text-xs); color: var(--muted); line-height: 1.5; margin-bottom: var(--space-4); }

.notif-actions { display: flex; gap: var(--space-3); }
.notif-save-btn { min-width: 100px; gap: var(--space-2); }
.notif-test-btn { gap: var(--space-2); }

/* ── Logout ─────────────────────────────────────────────── */
.logout-section { margin-bottom: var(--space-3); }

/* ── Confirm modal ──────────────────────────────────────── */
.confirm-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-5);
}
.confirm-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--radius-xl); padding: var(--space-8) var(--space-6);
  max-width: 340px; width: 100%;
  display: flex; flex-direction: column; align-items: center;
  gap: var(--space-3); text-align: center;
  box-shadow: var(--shadow-lg);
}
.confirm-icon  { font-size: 40px; }
.confirm-title { font-family: var(--font-display); font-size: var(--text-xl); font-weight: 700; }
.confirm-body  { font-size: var(--text-sm); color: var(--muted); line-height: 1.5; }
.confirm-actions { display: flex; gap: var(--space-3); width: 100%; margin-top: var(--space-2); }
.confirm-actions .btn { flex: 1; }
</style>
