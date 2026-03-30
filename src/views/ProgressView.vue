<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db }               from '@/firebase/config'
import { useAuthStore }     from '@/stores/auth.store'
import { usePointsStore }   from '@/stores/points.store'
import { useRankingStore }  from '@/stores/ranking.store'
import { staggerIn }        from '@/composables/useAnimations'
import { useShareCard }     from '@/composables/useShareCard'
import AppHeader            from '@/components/ui/AppHeader.vue'
import BottomNav            from '@/components/ui/BottomNav.vue'
import ShareSheet           from '@/components/ui/ShareSheet.vue'
import ProgressChart        from '@/components/progress/ProgressChart.vue'
import DailyClose           from '@/components/progress/DailyClose.vue'
import VerseLibrary         from '@/components/verse/VerseLibrary.vue'
import DailyPulse           from '@/components/home/DailyPulse.vue'

const auth    = useAuthStore()
const points  = usePointsStore()
const ranking = useRankingStore()
const { shareProgress } = useShareCard()

const activeTab       = ref('progress')
const volumeData      = ref([])
const weightData      = ref([])
const sessionHistory  = ref([])
const loading         = ref(true)
const historyExpanded = ref({})
const showShareSheet  = ref(false)
const heatmapDays     = ref([])   // últimos 90 días con estado de entrenamiento

const tabs = [
  { id: 'progress',  label: 'Progreso' },
  { id: 'historial', label: 'Historial' },
  { id: 'close',     label: 'Cierre' },
  { id: 'daily',     label: 'Daily' },
]

// Mapa de traducción de razones de puntos
const REASON_LABELS = {
  set_complete:       'Serie completada',
  exercise_complete:  'Ejercicio completo',
  session_complete:   'Sesión terminada',
  session_full_bonus: '¡Multiplicador ×1.5!',
  nutrition_logged:   'Nutrición registrada',
  water_goal:         'Meta de agua',
  daily_close:        'Cierre del día',
  new_record:         'Récord personal 🎉',
  streak_7:           'Racha de 7 días 🔥',
  streak_30:          'Racha de 30 días 🔥',
  challenge_complete: 'Reto completado',
  días_sin_entrenar:  'Decaimiento (inactividad)',
}
function reasonLabel(r) { return REASON_LABELS[r] || r }

onMounted(async () => {
  await Promise.all([
    loadVolumeHistory(),
    loadWeightHistory(),
    loadSessionHistory(),
    points.subscribe(),
    ranking.load(),
  ])
  buildHeatmap()
  loading.value = false
  staggerIn('.prog-section', { delay: 0.15 })
})

function buildHeatmap() {
  // Construir set de fechas con sesiones completadas
  const trainedDates = new Set(
    sessionHistory.value.map(s => s.date || s.id)
  )
  const days = []
  const today = new Date()
  for (let i = 89; i >= 0; i--) {
    const d    = new Date(today)
    d.setDate(today.getDate() - i)
    const key  = d.toISOString().slice(0, 10)
    days.push({ key, trained: trainedDates.has(key), isToday: i === 0 })
  }
  heatmapDays.value = days
}

const progressShareOptions = computed(() => [
  {
    id:    'progress',
    icon:  ranking.currentLevel?.emoji || '🌱',
    label: `Compartir mi progreso — ${ranking.currentLevel?.name || 'Iniciado'}`,
    fn:    () => shareProgress({
      ranking,
      streak:        ranking.streak,
      sessionsCount: sessionHistory.value.length,
      volumeTotal:   volumeData.value.reduce((acc, d) => acc + d.value, 0),
    }),
  },
])

// Ruta corregida: training_logs (no 'sessions')
async function loadVolumeHistory() {
  if (!auth.uid) return
  try {
    const q    = query(
      collection(db, 'users', auth.uid, 'training_logs'),
      orderBy('date', 'desc'),
      limit(14)
    )
    const snap = await getDocs(q)
    const raw  = snap.docs
      .map(d => ({ date: d.id, value: d.data().volume_total_kg ?? 0 }))
      .reverse()
    volumeData.value = raw.filter(d => d.value > 0)
  } catch (e) {
    console.warn('[progress] No se pudo cargar historial de volumen:', e)
  }
}

async function loadWeightHistory() {
  if (!auth.uid) return
  try {
    const q    = query(
      collection(db, 'users', auth.uid, 'weight_logs'),
      orderBy('date', 'asc'),
      limit(30)
    )
    const snap = await getDocs(q)
    weightData.value = snap.docs.map(d => ({
      date:  d.id,
      value: d.data().weight_kg ?? 0,
    })).filter(d => d.value > 0)
  } catch (e) {
    console.warn('[progress] No se pudo cargar historial de peso:', e)
  }
}

async function loadSessionHistory() {
  if (!auth.uid) return
  try {
    const q    = query(
      collection(db, 'users', auth.uid, 'training_logs'),
      orderBy('date', 'desc'),
      limit(30)
    )
    const snap = await getDocs(q)
    sessionHistory.value = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(s => s.status === 'completed')
  } catch (e) {
    console.warn('[progress] No se pudo cargar historial de sesiones:', e)
  }
}

function toggleSession(id) {
  historyExpanded.value[id] = !historyExpanded.value[id]
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
}

const hasProgressData = computed(() => volumeData.value.length > 0 || weightData.value.length > 0)
</script>

<template>
  <div>
    <AppHeader title="PROGRESO" />
    <main class="page-content page-pad">

      <!-- Tab bar -->
      <div class="tab-bar">
        <button
          v-for="t in tabs"
          :key="t.id"
          class="tab-btn"
          :class="{ active: activeTab === t.id }"
          @click="activeTab = t.id"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- ═══ TAB: PROGRESO ═══════════════════════════════════════ -->
      <div v-if="activeTab === 'progress'">
        <div v-if="loading" class="loading-state">
          <div class="spinner" /> <p>Cargando…</p>
        </div>
        <template v-else>

          <!-- Stats rápidas -->
          <section class="stats-row prog-section">
            <div class="stat-item card-sm">
              <p class="stat-val accent">{{ ranking.streak }}</p>
              <p class="stat-lbl">Racha</p>
            </div>
            <div class="stat-item card-sm">
              <p class="stat-val">{{ ranking.xp }}</p>
              <p class="stat-lbl">XP total</p>
            </div>
            <div class="stat-item card-sm">
              <p class="stat-val accent">{{ points.balance }}</p>
              <p class="stat-lbl">Puntos</p>
            </div>
          </section>

          <!-- Volume chart -->
          <section v-if="volumeData.length" class="card prog-section">
            <ProgressChart
              :data="volumeData"
              label="Volumen semanal"
              unit=" kg"
              color="var(--accent)"
            />
          </section>

          <!-- Weight chart -->
          <section v-if="weightData.length" class="card prog-section">
            <ProgressChart
              :data="weightData"
              label="Peso corporal"
              unit=" kg"
              color="var(--success)"
            />
          </section>

          <!-- Empty state -->
          <div v-if="!hasProgressData" class="empty-state prog-section">
            <div class="empty-icon">📊</div>
            <p class="empty-title">Sin datos de progreso aún</p>
            <p class="empty-sub">Completa sesiones de entrenamiento y registra tu peso para ver tus gráficas aquí.</p>
          </div>

          <!-- Actividad: mapa de calor 90 días -->
          <section class="card prog-section heatmap-card">
            <div class="heatmap-header">
              <p class="label-caps">Actividad — últimos 90 días</p>
              <span class="heatmap-legend">
                <span class="hm-dot rest" /> descanso
                <span class="hm-dot trained" /> entrenado
                <span class="hm-dot today" /> hoy
              </span>
            </div>
            <div class="heatmap-grid">
              <span
                v-for="day in heatmapDays"
                :key="day.key"
                class="hm-cell"
                :class="{
                  'hm-trained': day.trained,
                  'hm-today':   day.isToday,
                }"
                :title="day.key"
              />
            </div>
            <p class="heatmap-count label-caps">
              {{ heatmapDays.filter(d => d.trained).length }} sesiones en 90 días
            </p>
          </section>

          <!-- Puntos recientes -->
          <section v-if="points.log?.length" class="card prog-section points-card">
            <p class="label-caps" style="margin-bottom: var(--space-3)">Puntos recientes</p>
            <div class="tx-list">
              <div v-for="tx in points.log.slice(0, 6)" :key="tx.id" class="tx-row">
                <div class="tx-icon" :class="tx.amount > 0 ? 'earn' : 'lose'">
                  {{ tx.amount > 0 ? '▲' : '▼' }}
                </div>
                <span class="tx-reason">{{ reasonLabel(tx.reason) }}</span>
                <span class="tx-amount" :class="tx.amount > 0 ? 'pos' : 'neg'">
                  {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount }}
                </span>
              </div>
            </div>
          </section>

          <!-- Botón compartir progreso -->
          <button class="btn btn-ghost prog-share-btn prog-section" @click="showShareSheet = true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Compartir mi progreso
          </button>

        </template>
      </div>

      <!-- ═══ TAB: HISTORIAL ══════════════════════════════════════ -->
      <div v-else-if="activeTab === 'historial'">
        <div v-if="loading" class="loading-state">
          <div class="spinner" /> <p>Cargando historial…</p>
        </div>
        <template v-else>

          <div v-if="sessionHistory.length === 0" class="empty-state">
            <div class="empty-icon">🏋️</div>
            <p class="empty-title">Sin sesiones completadas</p>
            <p class="empty-sub">Aquí verás el historial de cada entrenamiento que completes.</p>
          </div>

          <div v-else class="history-list">
            <div
              v-for="session in sessionHistory"
              :key="session.id"
              class="session-item card-sm"
            >
              <!-- Header de sesión -->
              <button class="session-row" @click="toggleSession(session.id)">
                <div class="session-main">
                  <p class="session-date">{{ formatDate(session.date || session.id) }}</p>
                  <p class="session-name">{{ session.name || session.label || 'Sesión' }}</p>
                </div>
                <div class="session-badges">
                  <span v-if="session.volume_total_kg" class="badge-sm vol">
                    {{ session.volume_total_kg }} kg
                  </span>
                  <span v-if="session.duration_min" class="badge-sm dur">
                    {{ session.duration_min }} min
                  </span>
                  <span class="session-chevron" :class="{ open: historyExpanded[session.id] }">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
                  </span>
                </div>
              </button>

              <!-- Detalle expandido -->
              <div v-if="historyExpanded[session.id]" class="session-detail">
                <div
                  v-for="ex in (session.exercises || [])"
                  :key="ex.exercise_id"
                  class="ex-row"
                  :class="{ completed: ex.completed }"
                >
                  <span class="ex-check">{{ ex.completed ? '✓' : '○' }}</span>
                  <span class="ex-name">{{ ex.name }}</span>
                  <span v-if="ex.completed && ex.sets?.length" class="ex-sets">
                    {{ ex.sets.filter(s => s.completed).length }}/{{ ex.sets.length }} series
                  </span>
                  <span v-if="session.new_records?.includes(ex.exercise_id)" class="pr-flag">PR</span>
                </div>
              </div>
            </div>
          </div>

        </template>
      </div>

      <!-- ═══ TAB: CIERRE ═════════════════════════════════════════ -->
      <div v-else-if="activeTab === 'close'">
        <DailyClose class="prog-section" @done="activeTab = 'progress'" />
      </div>

      <!-- ═══ TAB: DAILY ═══════════════════════════════════════════ -->
      <div v-else-if="activeTab === 'daily'">
        <DailyPulse class="prog-section" />

        <div class="daily-divider prog-section">
          <span class="label-caps">Versos guardados</span>
        </div>
        <VerseLibrary />
      </div>

    </main>
    <BottomNav />

    <ShareSheet
      v-if="showShareSheet"
      :options="progressShareOptions"
      @close="showShareSheet = false"
    />
  </div>
</template>

<style scoped>
.page-pad { padding-left: var(--space-4); padding-right: var(--space-4); }

/* ── Tab bar ────────────────────────────────────────────── */
.tab-bar {
  display: flex;
  background: var(--faint);
  border-radius: var(--radius-lg);
  padding: 3px;
  margin-bottom: var(--space-5);
  gap: 2px;
  overflow: hidden;
}
.tab-btn {
  flex: 1; padding: var(--space-2) 4px;
  border-radius: var(--radius);
  border: none;
  background: transparent; color: var(--muted);
  font-size: var(--text-xs); font-weight: 600;
  cursor: pointer; transition: var(--transition);
  white-space: nowrap;
}
.tab-btn.active { background: var(--card); color: var(--text); box-shadow: var(--shadow-sm); }

/* ── Loading / empty ────────────────────────────────────── */
.loading-state {
  display: flex; align-items: center; justify-content: center;
  min-height: 40vh; gap: var(--space-4); color: var(--muted);
}
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: var(--space-10) var(--space-4); gap: var(--space-3);
}
.empty-icon { font-size: 48px; line-height: 1; }
.empty-title { font-size: var(--text-lg); font-weight: 700; color: var(--text); }
.empty-sub { font-size: var(--text-sm); color: var(--muted); line-height: 1.6; max-width: 280px; }

/* ── Sección general ────────────────────────────────────── */
.prog-section { margin-bottom: var(--space-4); }

/* ── Stats row ──────────────────────────────────────────── */
.stats-row {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3); margin-bottom: var(--space-4);
}
.stat-item { text-align: center; padding: var(--space-4) var(--space-2); }
.stat-val {
  font-family: var(--font-mono); font-size: var(--text-xl);
  font-weight: 800; color: var(--text); line-height: 1;
}
.stat-val.accent { color: var(--accent); }
.stat-lbl { font-size: 10px; color: var(--muted); margin-top: var(--space-1); text-transform: uppercase; letter-spacing: 0.08em; }

/* ── Points card ────────────────────────────────────────── */
.points-card { padding: var(--space-5); }
.tx-list { display: flex; flex-direction: column; gap: 1px; }
.tx-row {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--faint);
}
.tx-row:last-child { border-bottom: none; }
.tx-icon {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; flex-shrink: 0;
}
.tx-icon.earn { background: color-mix(in srgb, var(--success) 15%, transparent); color: var(--success); }
.tx-icon.lose { background: color-mix(in srgb, var(--danger) 15%, transparent); color: var(--danger); }
.tx-reason { flex: 1; font-size: var(--text-sm); color: var(--text); }
.tx-amount { font-size: var(--text-sm); font-weight: 700; font-family: var(--font-mono); flex-shrink: 0; }
.tx-amount.pos { color: var(--success); }
.tx-amount.neg { color: var(--danger); }

/* ── Session history ────────────────────────────────────── */
.history-list { display: flex; flex-direction: column; gap: var(--space-3); }
.session-item { overflow: hidden; }
.session-row {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; background: none; border: none; color: var(--text);
  padding: var(--space-3) var(--space-4); cursor: pointer; text-align: left;
  gap: var(--space-3);
}
.session-main { flex: 1; min-width: 0; }
.session-date { font-size: var(--text-xs); color: var(--muted); text-transform: capitalize; }
.session-name { font-size: var(--text-sm); font-weight: 700; margin-top: 2px; }
.session-badges { display: flex; align-items: center; gap: var(--space-2); flex-shrink: 0; }
.badge-sm {
  font-size: 11px; font-weight: 700; font-family: var(--font-mono);
  padding: 2px 8px; border-radius: var(--radius-full);
}
.badge-sm.vol { background: var(--accent-dim); color: var(--accent); }
.badge-sm.dur { background: var(--faint); color: var(--muted); }
.session-chevron { color: var(--muted); transition: transform 0.2s; display: flex; }
.session-chevron.open { transform: rotate(180deg); }

.session-detail {
  padding: var(--space-2) var(--space-4) var(--space-3);
  border-top: 1px solid var(--faint);
  display: flex; flex-direction: column; gap: var(--space-1);
}
.ex-row {
  display: flex; align-items: center; gap: var(--space-2);
  padding: 4px 0; opacity: 0.5;
}
.ex-row.completed { opacity: 1; }
.ex-check { font-size: 11px; color: var(--muted); width: 14px; flex-shrink: 0; }
.ex-row.completed .ex-check { color: var(--success); }
.ex-name { flex: 1; font-size: var(--text-sm); }
.ex-sets { font-size: 11px; color: var(--muted); font-family: var(--font-mono); }
.pr-flag {
  font-size: 10px; font-weight: 800; background: var(--warning-dim);
  color: var(--warning); padding: 1px 6px; border-radius: var(--radius-full);
  letter-spacing: 0.05em;
}

/* ── Heatmap ────────────────────────────────────────────── */
.heatmap-card { padding: var(--space-4) var(--space-5); }
.heatmap-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: var(--space-3);
}
.heatmap-legend {
  display: flex; align-items: center; gap: var(--space-2);
  font-size: 10px; color: var(--muted);
}
.hm-dot {
  display: inline-block; width: 8px; height: 8px; border-radius: 2px;
}
.hm-dot.rest    { background: var(--faint); border: 1px solid var(--border); }
.hm-dot.trained { background: var(--accent); }
.hm-dot.today   { background: var(--accent); outline: 2px solid var(--accent); outline-offset: 1px; }

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(18, 1fr);
  gap: 3px;
}
.hm-cell {
  aspect-ratio: 1;
  border-radius: 2px;
  background: var(--faint);
  border: 1px solid var(--border);
  transition: transform 0.15s;
}
.hm-cell.hm-trained {
  background: var(--accent);
  border-color: var(--accent);
}
.hm-cell.hm-today {
  background: var(--accent);
  border-color: var(--accent);
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
.heatmap-count {
  margin-top: var(--space-3);
  text-align: right;
  color: var(--muted);
}

/* ── Share button ───────────────────────────────────────── */
.prog-share-btn {
  width: 100%;
  display: flex; align-items: center; justify-content: center;
  gap: var(--space-2);
}

/* ── Daily tab divider ──────────────────────────────────── */
.daily-divider {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--muted);
  margin-top: var(--space-2);
}
.daily-divider::before,
.daily-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}
</style>
