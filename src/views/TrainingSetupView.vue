<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { gsap } from 'gsap'
import { useTrainingStore } from '@/stores/training.store'
import AppHeader from '@/components/ui/AppHeader.vue'
import BottomNav from '@/components/ui/BottomNav.vue'
import { STYLES, GOALS, SPECIAL_PROGRAMS } from '@/utils/routineGenerator'

const router   = useRouter()
const training = useTrainingStore()

// ── Estado del editor inline ─────────────────────────────────────
const editingRoutine     = ref(false)
const generating         = ref(false)
const showEditPreview    = ref(false)
const confirmDeleteId    = ref(null)   // id de la rutina a eliminar (modal confirm)

const currentStep        = ref(1)
const totalSteps         = 5

const selectedStyle        = ref('')
const selectedGoal         = ref('')
const selectedTrainingDays = ref([1, 3, 5])
const selectedDuration     = ref(60)
const customDuration       = ref('')
const selectedExperience   = ref('')
const selectedSpecial      = ref([])

const selectedDays = computed(() => selectedTrainingDays.value.length)

const WEEK_DAYS = [
  { id: 0, short: 'Dom' }, { id: 1, short: 'Lun' }, { id: 2, short: 'Mar' },
  { id: 3, short: 'Mié' }, { id: 4, short: 'Jue' }, { id: 5, short: 'Vie' },
  { id: 6, short: 'Sáb' },
]

function toggleDay(dayId) {
  const idx = selectedTrainingDays.value.indexOf(dayId)
  if (idx >= 0) {
    if (selectedTrainingDays.value.length > 1) selectedTrainingDays.value.splice(idx, 1)
  } else {
    selectedTrainingDays.value.push(dayId)
    selectedTrainingDays.value.sort((a, b) => a - b)
  }
}

const effectiveDuration = computed(() => {
  if (customDuration.value && Number(customDuration.value) >= 15) return Number(customDuration.value)
  return selectedDuration.value
})

const DURATIONS = [30, 45, 60, 75, 90]

const EXPERIENCE_OPTIONS = [
  { id: 'principiante', label: 'Principiante', icon: '🌱', description: 'Menos de 6 meses entrenando' },
  { id: 'intermedio',   label: 'Intermedio',   icon: '🔥', description: 'Entre 6 meses y 2 años' },
  { id: 'avanzado',     label: 'Avanzado',     icon: '⚡', description: 'Más de 2 años entrenando' },
]

const canProceedStep = computed(() => {
  if (currentStep.value === 1) return !!selectedStyle.value
  if (currentStep.value === 2) return !!selectedGoal.value
  if (currentStep.value === 3) return selectedDays.value >= 2 && effectiveDuration.value >= 15
  if (currentStep.value === 4) return !!selectedExperience.value
  return true
})

// ── Semana visual ────────────────────────────────────────────────
const weekDayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
function buildWeekDays(routine) {
  if (!routine?.weekly_plan) return []
  return routine.weekly_plan.map((day, i) => ({
    label: weekDayLabels[i],
    session: day,
    isToday: i === new Date().getDay(),
  }))
}
const routineWeekDays = computed(() => buildWeekDays(training.routine))

// Rutinas de la biblioteca que NO son la activa
const otherRoutines = computed(() =>
  training.routineLibrary.filter(r => r.id !== training.routine?.id)
)

// ── Carga inicial ────────────────────────────────────────────────
onMounted(async () => {
  await training.loadRoutine()
  await training.loadRoutineLibrary()
})

// ── Editor de rutina activa ──────────────────────────────────────
function startEdit() {
  const r = training.routine
  selectedStyle.value        = r?.style           || ''
  selectedGoal.value         = r?.goal            || ''
  selectedTrainingDays.value = [...(r?.training_days || [1, 3, 5])]
  selectedDuration.value     = r?.duration_min    || 60
  customDuration.value       = ''
  selectedExperience.value   = r?.experience      || ''
  selectedSpecial.value      = [...(r?.special_programs || [])]
  currentStep.value          = 1
  showEditPreview.value      = false
  editingRoutine.value       = true
  nextTick(() => gsap.from('.edit-wizard', { y: 20, opacity: 0, duration: 0.35, ease: 'power2.out', clearProps: 'all' }))
}

function cancelEdit() {
  editingRoutine.value  = false
  showEditPreview.value = false
  currentStep.value     = 1
}

async function nextStep() {
  if (!canProceedStep.value) return
  if (currentStep.value < totalSteps) {
    currentStep.value++
    await nextTick()
    animateStepIn('next')
  }
}

async function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
    await nextTick()
    animateStepIn('prev')
  }
}

function animateStepIn(direction) {
  const el = document.querySelector('.wizard-step-content')
  if (!el) return
  gsap.set(el, { opacity: 0, x: direction === 'next' ? 30 : -30 })
  gsap.to(el, { opacity: 1, x: 0, duration: 0.28, ease: 'power2.out', clearProps: 'all' })
}

function toggleSpecial(id) {
  const idx = selectedSpecial.value.indexOf(id)
  if (idx >= 0) selectedSpecial.value.splice(idx, 1)
  else selectedSpecial.value.push(id)
}

async function handleUpdate() {
  generating.value = true
  try {
    await training.updateActiveRoutine({
      style:            selectedStyle.value,
      goal:             selectedGoal.value,
      days_per_week:    selectedDays.value,
      training_days:    [...selectedTrainingDays.value].sort((a, b) => a - b),
      duration_min:     effectiveDuration.value,
      experience:       selectedExperience.value,
      special_programs: selectedSpecial.value,
    })
    editingRoutine.value  = false
    showEditPreview.value = true
    await nextTick()
    gsap.from('.edit-preview-banner', { y: 16, opacity: 0, duration: 0.35, ease: 'power2.out', clearProps: 'all' })
  } finally {
    generating.value = false
  }
}

// ── Activar rutina de biblioteca ─────────────────────────────────
async function handleActivate(item) {
  await training.activateRoutine(item)
  await nextTick()
  gsap.from('.active-card', { scale: 0.97, opacity: 0.6, duration: 0.3, ease: 'power2.out', clearProps: 'all' })
}

// ── Eliminar rutina ──────────────────────────────────────────────
async function confirmDelete() {
  if (!confirmDeleteId.value) return
  await training.deleteRoutineFromLibrary(confirmDeleteId.value)
  confirmDeleteId.value = null
}
</script>

<template>
  <div class="setup-view">
    <AppHeader title="Mis rutinas" />

    <main class="page-content page-pad">

      <!-- ── ESTADO VACÍO (nuevo usuario) ── -->
      <template v-if="!training.routine && training.routineLibrary.length === 0">
        <div class="empty-state">
          <div class="empty-icon">🏋️</div>
          <h2 class="empty-title display-sm">Sin rutinas aún</h2>
          <p class="empty-sub">Crea tu primera rutina para empezar a entrenar con un plan personalizado.</p>
          <button class="btn btn-primary empty-cta" @click="router.push('/training/choice')">
            Crear mi primera rutina
          </button>
        </div>
      </template>

      <!-- ── CON RUTINAS ── -->
      <template v-else>

        <!-- Banner de confirmación tras editar -->
        <div v-if="showEditPreview" class="edit-preview-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          Rutina actualizada correctamente.
          <button type="button" class="banner-close" @click="showEditPreview = false">✕</button>
        </div>

        <!-- ── RUTINA ACTIVA ── -->
        <section v-if="training.routine" class="active-section">
          <p class="section-label label-caps">Rutina activa</p>

          <template v-if="!editingRoutine">
            <div class="active-card">
              <div class="active-card-header">
                <div>
                  <h2 class="active-name">{{ training.routine.name }}</h2>
                  <p class="active-meta">
                    {{ training.routine.days_per_week }} días/sem · {{ training.routine.duration_min }} min · {{ training.routine.experience }}
                  </p>
                </div>
                <span class="style-badge">{{ training.routine.style }}</span>
              </div>

              <!-- Week strip -->
              <div class="week-strip">
                <div
                  v-for="(day, i) in routineWeekDays"
                  :key="i"
                  class="week-day-card"
                  :class="{ today: day.isToday, active: !!day.session, rest: !day.session }"
                >
                  <span class="wd-label">{{ day.label }}</span>
                  <div class="wd-body">
                    <span v-if="day.session" class="wd-sl">{{ day.session.label }}</span>
                    <span v-else class="wd-rest">—</span>
                    <p class="wd-name">{{ day.session ? day.session.name : 'Desc.' }}</p>
                  </div>
                </div>
              </div>

              <div class="active-actions">
                <button class="btn btn-primary" @click="router.push('/training')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Sesión de hoy
                </button>
                <button class="btn btn-ghost" @click="startEdit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Editar
                </button>
              </div>
            </div>
          </template>

          <!-- ── EDITOR INLINE ── -->
          <template v-else>
            <div class="edit-wizard">
              <div class="edit-banner">
                <span>Editando rutina activa</span>
                <button type="button" class="cancel-edit-btn" @click="cancelEdit">✕ Cancelar</button>
              </div>

              <div class="step-dots">
                <span v-for="n in totalSteps" :key="n" class="step-dot" :class="{ active: n === currentStep, done: n < currentStep }" />
              </div>

              <div class="wizard-step-content">
                <template v-if="currentStep === 1">
                  <h3 class="step-title">¿Qué estilo prefieres?</h3>
                  <div class="style-grid">
                    <button v-for="s in STYLES" :key="s.id" type="button" class="style-card" :class="{ selected: selectedStyle === s.id }" @click="selectedStyle = s.id">
                      <span class="style-icon">{{ s.icon }}</span>
                      <span class="style-name">{{ s.label }}</span>
                      <span class="style-desc">{{ s.description }}</span>
                    </button>
                  </div>
                </template>

                <template v-else-if="currentStep === 2">
                  <h3 class="step-title">¿Cuál es tu objetivo?</h3>
                  <div class="goal-grid">
                    <button v-for="g in GOALS" :key="g.id" type="button" class="goal-card" :class="{ selected: selectedGoal === g.id }" @click="selectedGoal = g.id">
                      <span class="goal-icon">{{ g.icon }}</span>
                      <span class="goal-label">{{ g.label }}</span>
                    </button>
                  </div>
                </template>

                <template v-else-if="currentStep === 3">
                  <h3 class="step-title">¿Qué días entrenas?</h3>
                  <div class="day-picker">
                    <button v-for="d in WEEK_DAYS" :key="d.id" type="button" class="day-pill" :class="{ selected: selectedTrainingDays.includes(d.id) }" @click="toggleDay(d.id)">
                      <span class="day-pill-short">{{ d.short }}</span>
                      <span v-if="selectedTrainingDays.includes(d.id)" class="day-pill-count">✓</span>
                    </button>
                  </div>
                  <p class="days-selected-label">{{ selectedDays }} días seleccionados</p>
                  <p class="step-sub">Duración de cada sesión</p>
                  <div class="duration-row">
                    <button v-for="min in DURATIONS" :key="min" type="button" class="duration-btn" :class="{ selected: selectedDuration === min && !customDuration }" @click="() => { selectedDuration = min; customDuration = '' }">{{ min }} min</button>
                  </div>
                  <div class="custom-duration-row">
                    <input v-model="customDuration" type="number" inputmode="numeric" class="custom-duration-input" placeholder="Otro (min)" min="15" max="240" />
                    <span v-if="customDuration && Number(customDuration) >= 15" class="custom-duration-ok">✓ {{ customDuration }} min</span>
                  </div>
                </template>

                <template v-else-if="currentStep === 4">
                  <h3 class="step-title">¿Cuál es tu nivel?</h3>
                  <div class="exp-grid">
                    <button v-for="e in EXPERIENCE_OPTIONS" :key="e.id" type="button" class="exp-card" :class="{ selected: selectedExperience === e.id }" @click="selectedExperience = e.id">
                      <span class="exp-icon">{{ e.icon }}</span>
                      <div><p class="exp-name">{{ e.label }}</p><p class="exp-desc">{{ e.description }}</p></div>
                    </button>
                  </div>
                </template>

                <template v-else-if="currentStep === 5">
                  <h3 class="step-title">¿Alguna necesidad especial?</h3>
                  <p class="step-sub">Opcional</p>
                  <div class="special-grid">
                    <button v-for="p in SPECIAL_PROGRAMS" :key="p.id" type="button" class="special-card" :class="{ selected: selectedSpecial.includes(p.id) }" @click="toggleSpecial(p.id)">
                      <span class="special-icon">{{ p.icon }}</span>
                      <div><p class="special-name">{{ p.label }}</p><p class="special-desc">{{ p.description }}</p></div>
                      <span v-if="selectedSpecial.includes(p.id)" class="special-check">✓</span>
                    </button>
                  </div>
                </template>
              </div>

              <div class="wizard-nav">
                <button v-if="currentStep > 1" class="btn btn-ghost" @click="prevStep">← Atrás</button>
                <div v-else class="nav-spacer" />
                <button v-if="currentStep === totalSteps" class="btn btn-primary" :disabled="generating" @click="handleUpdate">
                  <span v-if="generating" class="spinner-sm" />
                  <span v-else>ACTUALIZAR RUTINA</span>
                </button>
                <button v-else class="btn btn-primary" :disabled="!canProceedStep" @click="nextStep">Siguiente →</button>
              </div>
              <div v-if="currentStep === totalSteps" class="skip-row">
                <button class="skip-btn" @click="handleUpdate">Saltar y actualizar</button>
              </div>
            </div>
          </template>
        </section>

        <!-- ── OTRAS RUTINAS ── -->
        <section v-if="otherRoutines.length > 0" class="library-section">
          <p class="section-label label-caps">Otras rutinas guardadas</p>
          <div class="library-list">
            <div v-for="item in otherRoutines" :key="item.id" class="library-card">
              <div class="library-card-info">
                <div class="library-card-top">
                  <span class="lib-name">{{ item.name }}</span>
                  <span class="lib-badge">{{ item.style }}</span>
                </div>
                <p class="lib-meta">{{ item.days_per_week }} días/sem · {{ item.duration_min }} min · {{ item.experience }}</p>
              </div>
              <div class="library-card-actions">
                <button type="button" class="lib-activate-btn" @click="handleActivate(item)">Activar</button>
                <button type="button" class="lib-delete-btn" @click="confirmDeleteId = item.id" aria-label="Eliminar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- ── CREAR NUEVA ── -->
        <div class="create-new-row">
          <button class="btn btn-ghost create-btn" @click="router.push('/training/choice')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Crear nueva rutina
          </button>
        </div>

      </template>

    </main>

    <!-- ── Modal confirmar eliminar ── -->
    <Transition name="modal">
      <div v-if="confirmDeleteId" class="modal-overlay" @click.self="confirmDeleteId = null">
        <div class="modal-box">
          <p class="modal-title">¿Eliminar esta rutina?</p>
          <p class="modal-sub">Esta acción no se puede deshacer.</p>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="confirmDeleteId = null">Cancelar</button>
            <button class="btn btn-danger" @click="confirmDelete">Eliminar</button>
          </div>
        </div>
      </div>
    </Transition>

    <BottomNav />
  </div>
</template>

<style scoped>
.setup-view { min-height: 100vh; background: var(--surface); }
.page-pad { padding-left: var(--space-4); padding-right: var(--space-4); }

/* ── Empty state ─────────────────────────────────────────── */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: var(--space-12) var(--space-4) var(--space-6);
  gap: var(--space-3);
}
.empty-icon  { font-size: 64px; }
.empty-title { }
.empty-sub   { color: var(--muted); font-size: var(--text-sm); line-height: var(--leading-relaxed); max-width: 280px; }
.empty-cta   { margin-top: var(--space-2); width: 100%; max-width: 280px; }

/* ── Sections ────────────────────────────────────────────── */
.section-label { font-size: 10px; letter-spacing: 0.1em; color: var(--accent); margin-bottom: var(--space-3); }
.active-section  { margin-bottom: var(--space-6); }
.library-section { margin-bottom: var(--space-5); }

/* ── Active card ─────────────────────────────────────────── */
.active-card {
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-lg); padding: var(--space-5);
}
.active-card-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: var(--space-3); margin-bottom: var(--space-4);
}
.active-name { font-family: var(--font-display); font-size: var(--text-xl); font-weight: 800; }
.active-meta { font-size: var(--text-xs); color: var(--muted); margin-top: 2px; text-transform: capitalize; }
.style-badge {
  background: var(--accent-dim); color: var(--accent);
  border-radius: var(--radius-full); padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs); font-weight: 700; white-space: nowrap; flex-shrink: 0;
}
.active-actions { display: flex; gap: var(--space-3); margin-top: var(--space-4); }
.active-actions .btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: var(--space-2); }

/* ── Week strip ──────────────────────────────────────────── */
.week-strip { display: grid; grid-template-columns: repeat(7, 1fr); gap: var(--space-2); }
.week-day-card {
  border-radius: var(--radius-md); border: 1.5px solid var(--border); background: var(--surface);
  padding: var(--space-2) var(--space-1); display: flex; flex-direction: column;
  align-items: center; gap: 2px; min-height: 72px; transition: var(--transition);
}
.week-day-card.today { border-color: var(--accent); background: var(--accent-dim); }
.week-day-card.rest  { opacity: 0.4; }
.wd-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--muted); letter-spacing: 0.05em; }
.week-day-card.today .wd-label { color: var(--accent); }
.wd-body  { display: flex; flex-direction: column; align-items: center; gap: 1px; width: 100%; }
.wd-sl    { font-size: 8px; font-weight: 800; color: var(--accent); text-transform: uppercase; }
.wd-rest  { font-size: 12px; color: var(--faint); }
.wd-name  { font-size: 8px; color: var(--muted); text-align: center; line-height: 1.3; }

/* ── Library list ────────────────────────────────────────── */
.library-list { display: flex; flex-direction: column; gap: var(--space-3); }
.library-card {
  display: flex; align-items: center; gap: var(--space-3);
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-lg); padding: var(--space-3) var(--space-4);
}
.library-card-info { flex: 1; min-width: 0; }
.library-card-top  { display: flex; align-items: center; gap: var(--space-2); margin-bottom: 2px; }
.lib-name  { font-size: var(--text-sm); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lib-badge {
  background: var(--faint); color: var(--muted);
  border-radius: var(--radius-full); padding: 1px 8px;
  font-size: 10px; font-weight: 700; white-space: nowrap; flex-shrink: 0;
}
.lib-meta  { font-size: var(--text-xs); color: var(--muted); text-transform: capitalize; }
.library-card-actions { display: flex; align-items: center; gap: var(--space-2); flex-shrink: 0; }
.lib-activate-btn {
  padding: var(--space-1) var(--space-3); background: var(--accent-dim);
  border: 1px solid var(--accent); border-radius: var(--radius-full);
  color: var(--accent); font-size: var(--text-xs); font-weight: 700; cursor: pointer;
  transition: var(--transition); white-space: nowrap;
}
.lib-activate-btn:hover { background: var(--accent); color: #fff; }
.lib-delete-btn {
  width: 30px; height: 30px; background: none; border: 1.5px solid var(--border);
  border-radius: var(--radius-md); color: var(--muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: var(--transition);
}
.lib-delete-btn:hover { border-color: var(--error, #ef4444); color: var(--error, #ef4444); }

/* ── Create new ──────────────────────────────────────────── */
.create-new-row { padding: var(--space-2) 0 var(--space-6); }
.create-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: var(--space-2);
}

/* ── Edit banner ─────────────────────────────────────────── */
.edit-preview-banner {
  display: flex; align-items: center; gap: var(--space-2);
  background: var(--success-dim, #dcfce7); border: 1px solid var(--success, #22c55e);
  border-radius: var(--radius-lg); padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm); color: var(--success, #22c55e); font-weight: 600;
  margin-bottom: var(--space-4);
}
.edit-preview-banner svg { flex-shrink: 0; }
.banner-close { margin-left: auto; background: none; border: none; color: var(--success, #22c55e); cursor: pointer; font-size: 14px; }

/* ── Edit wizard ─────────────────────────────────────────── */
.edit-wizard {
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-lg); padding: var(--space-5);
}
.edit-banner {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--accent-dim); border: 1px solid var(--accent);
  border-radius: var(--radius-lg); padding: var(--space-2) var(--space-4);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm); color: var(--accent); font-weight: 600;
}
.cancel-edit-btn { background: none; border: none; color: var(--accent); font-size: var(--text-xs); font-weight: 700; cursor: pointer; }

.step-dots { display: flex; justify-content: center; gap: var(--space-2); margin-bottom: var(--space-4); }
.step-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--faint); transition: var(--transition); }
.step-dot.done   { background: var(--accent); opacity: 0.45; }
.step-dot.active { background: var(--accent); width: 22px; border-radius: 4px; }

.wizard-step-content { opacity: 1; }
.step-title { font-family: var(--font-display); font-size: var(--text-xl); font-weight: 700; color: var(--text); margin-bottom: var(--space-4); }
.step-sub   { font-size: var(--text-sm); color: var(--muted); margin-bottom: var(--space-3); margin-top: var(--space-4); }

.style-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
.style-card {
  display: flex; flex-direction: column; align-items: center; gap: var(--space-1);
  padding: var(--space-4) var(--space-3); background: var(--surface);
  border: 1.5px solid var(--border); border-radius: var(--radius-lg);
  cursor: pointer; transition: var(--transition); text-align: center; color: var(--text);
}
.style-card.selected { border-color: var(--accent); background: var(--accent-dim); }
.style-icon { font-size: 26px; }
.style-name { font-weight: 700; font-size: var(--text-sm); }
.style-desc { font-size: var(--text-xs); color: var(--muted); line-height: 1.4; }

.goal-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
.goal-card {
  display: flex; flex-direction: column; align-items: center; gap: var(--space-2); padding: var(--space-4);
  background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius-lg);
  cursor: pointer; transition: var(--transition); text-align: center; color: var(--text);
}
.goal-card.selected { border-color: var(--accent); background: var(--accent-dim); }
.goal-icon  { font-size: 26px; }
.goal-label { font-size: var(--text-sm); font-weight: 700; }

.day-picker { display: grid; grid-template-columns: repeat(7, 1fr); gap: var(--space-2); margin-bottom: var(--space-2); }
.day-pill {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: var(--space-3) var(--space-1); background: var(--surface);
  border: 1.5px solid var(--border); border-radius: var(--radius-md);
  cursor: pointer; transition: var(--transition); color: var(--muted);
}
.day-pill.selected { border-color: var(--accent); background: var(--accent-dim); color: var(--accent); }
.day-pill-short { font-size: 11px; font-weight: 800; text-transform: uppercase; }
.day-pill-count { font-size: 10px; font-weight: 700; }
.days-selected-label { font-size: var(--text-xs); color: var(--muted); text-align: center; margin-bottom: var(--space-2); }

.duration-row { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-3); }
.duration-btn {
  padding: var(--space-2) var(--space-4); background: var(--surface);
  border: 1.5px solid var(--border); border-radius: var(--radius-lg);
  font-size: var(--text-sm); font-weight: 700; cursor: pointer;
  transition: var(--transition); font-family: var(--font-mono); color: var(--text);
}
.duration-btn.selected { border-color: var(--accent); background: var(--accent-dim); color: var(--accent); }
.custom-duration-row { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-2); }
.custom-duration-input {
  width: 110px; height: 38px; background: var(--surface);
  border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  text-align: center; font-family: var(--font-mono); font-size: var(--text-base);
  font-weight: 700; color: var(--text); transition: var(--transition); padding: 0 var(--space-3);
}
.custom-duration-input:focus { border-color: var(--accent); outline: none; }
.custom-duration-ok { font-size: var(--text-sm); color: var(--success); font-weight: 700; }

.exp-grid { display: flex; flex-direction: column; gap: var(--space-3); }
.exp-card {
  display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4);
  background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius-lg);
  cursor: pointer; transition: var(--transition); text-align: left; color: var(--text);
}
.exp-card.selected { border-color: var(--accent); background: var(--accent-dim); }
.exp-icon { font-size: 26px; flex-shrink: 0; }
.exp-name { font-weight: 700; font-size: var(--text-sm); }
.exp-desc { font-size: var(--text-xs); color: var(--muted); margin-top: 1px; }

.special-grid { display: flex; flex-direction: column; gap: var(--space-3); }
.special-card {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4); background: var(--surface);
  border: 1.5px solid var(--border); border-radius: var(--radius-lg);
  cursor: pointer; transition: var(--transition); text-align: left; position: relative; color: var(--text);
}
.special-card.selected { border-color: var(--accent); background: var(--accent-dim); }
.special-icon  { font-size: 20px; flex-shrink: 0; }
.special-name  { font-size: var(--text-sm); font-weight: 700; }
.special-desc  { font-size: var(--text-xs); color: var(--muted); margin-top: 1px; }
.special-check { margin-left: auto; color: var(--accent); font-size: var(--text-base); font-weight: 800; }

.wizard-nav { display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-5); gap: var(--space-3); }
.nav-spacer { flex: 1; }
.wizard-nav .btn { flex: 1; }
.skip-row { text-align: center; margin-top: var(--space-2); }
.skip-btn { background: none; border: none; color: var(--muted); font-size: var(--text-sm); cursor: pointer; text-decoration: underline; }

.spinner-sm {
  width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.8s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Modal ───────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: var(--space-4);
}
.modal-box {
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-lg); padding: var(--space-6);
  width: 100%; max-width: 320px; text-align: center;
}
.modal-title { font-weight: 800; font-size: var(--text-base); margin-bottom: var(--space-2); }
.modal-sub   { font-size: var(--text-sm); color: var(--muted); margin-bottom: var(--space-5); }
.modal-actions { display: flex; gap: var(--space-3); }
.modal-actions .btn { flex: 1; }
.btn-danger {
  background: var(--error, #ef4444); color: #fff; border: none;
  border-radius: var(--radius-lg); padding: var(--space-3) var(--space-4);
  font-weight: 700; font-size: var(--text-sm); cursor: pointer; transition: var(--transition);
}
.btn-danger:hover { opacity: 0.85; }

/* ── Transitions ─────────────────────────────────────────── */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
