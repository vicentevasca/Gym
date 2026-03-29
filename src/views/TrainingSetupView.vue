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

// ── Estado del wizard ───────────────────────────────────────────

const currentStep        = ref(1)
const totalSteps         = 5
const generating         = ref(false)
const showPreview        = ref(false)
const editingRoutine     = ref(false)   // FIX: controla si mostrar el wizard al editar

// Selecciones del wizard
const selectedStyle        = ref('')
const selectedGoal         = ref('')
const selectedTrainingDays = ref([1, 3, 5])  // índices de días activos (0=Dom…6=Sáb)
const selectedDuration     = ref(60)
const customDuration       = ref('')          // entrada libre de duración
const selectedExperience   = ref('')
const selectedSpecial      = ref([])

// Computed: días por semana para el generador
const selectedDays = computed(() => selectedTrainingDays.value.length)

const WEEK_DAYS = [
  { id: 0, short: 'Dom', full: 'Domingo' },
  { id: 1, short: 'Lun', full: 'Lunes' },
  { id: 2, short: 'Mar', full: 'Martes' },
  { id: 3, short: 'Mié', full: 'Miércoles' },
  { id: 4, short: 'Jue', full: 'Jueves' },
  { id: 5, short: 'Vie', full: 'Viernes' },
  { id: 6, short: 'Sáb', full: 'Sábado' },
]

function toggleDay(dayId) {
  const idx = selectedTrainingDays.value.indexOf(dayId)
  if (idx >= 0) {
    if (selectedTrainingDays.value.length > 1) {
      selectedTrainingDays.value.splice(idx, 1)
    }
  } else {
    selectedTrainingDays.value.push(dayId)
    selectedTrainingDays.value.sort((a, b) => a - b)
  }
}

const effectiveDuration = computed(() => {
  if (customDuration.value && Number(customDuration.value) >= 15) {
    return Number(customDuration.value)
  }
  return selectedDuration.value
})

// ── Carga inicial ───────────────────────────────────────────────

onMounted(async () => {
  await training.loadRoutine()
})

// ── Computed ────────────────────────────────────────────────────

// FIX: mostrar wizard si no hay rutina O si está editando
const showWizard = computed(() => !training.routine || editingRoutine.value)

const canProceedStep = computed(() => {
  if (currentStep.value === 1) return !!selectedStyle.value
  if (currentStep.value === 2) return !!selectedGoal.value
  if (currentStep.value === 3) return selectedDays.value >= 2 && effectiveDuration.value >= 15
  if (currentStep.value === 4) return !!selectedExperience.value
  if (currentStep.value === 5) return true
  return false
})

const weekDayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const routineWeekDays = computed(() => {
  if (!training.routine?.weekly_plan) return []
  return training.routine.weekly_plan.map((day, i) => ({
    label: weekDayLabels[i],
    session: day,
    isToday: i === new Date().getDay(),
  }))
})

const DURATIONS = [30, 45, 60, 75, 90]

const EXPERIENCE_OPTIONS = [
  { id: 'principiante', label: 'Principiante', icon: '🌱', description: 'Menos de 6 meses entrenando' },
  { id: 'intermedio',   label: 'Intermedio',   icon: '🔥', description: 'Entre 6 meses y 2 años' },
  { id: 'avanzado',     label: 'Avanzado',     icon: '⚡', description: 'Más de 2 años entrenando' },
]

// ── Navegación del wizard ───────────────────────────────────────
// FIX: cambiar step PRIMERO, esperar nextTick para que Vue re-renderice,
// LUEGO animar el nuevo contenido. Nunca animar antes del re-render.

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
  const xFrom = direction === 'next' ? 30 : -30
  // Asegura estado inicial antes de animar
  gsap.set(el, { opacity: 0, x: xFrom })
  gsap.to(el, { opacity: 1, x: 0, duration: 0.28, ease: 'power2.out', clearProps: 'all' })
}

function toggleSpecial(id) {
  const idx = selectedSpecial.value.indexOf(id)
  if (idx >= 0) selectedSpecial.value.splice(idx, 1)
  else selectedSpecial.value.push(id)
}

// ── Generar rutina ──────────────────────────────────────────────

async function handleGenerate() {
  generating.value = true
  try {
    const params = {
      style:            selectedStyle.value,
      goal:             selectedGoal.value,
      days_per_week:    selectedDays.value,
      training_days:    [...selectedTrainingDays.value].sort((a, b) => a - b),
      duration_min:     effectiveDuration.value,
      experience:       selectedExperience.value,
      special_programs: selectedSpecial.value,
    }
    await training.createAutoRoutine(params)
    editingRoutine.value = false
    showPreview.value    = true

    await nextTick()
    gsap.from('.routine-preview', { y: 24, opacity: 0, duration: 0.4, ease: 'power2.out', clearProps: 'all' })
  } finally {
    generating.value = false
  }
}

function goToTraining() {
  router.push('/training')
}

// FIX: al editar, solo activar el flag; no borrar training.routine hasta generar nueva
function startEditRoutine() {
  showPreview.value    = false
  editingRoutine.value = true
  currentStep.value    = 1
  selectedStyle.value        = training.routine?.style           || ''
  selectedGoal.value         = training.routine?.goal            || ''
  selectedTrainingDays.value = [...(training.routine?.training_days || [1, 3, 5])]
  selectedDuration.value     = training.routine?.duration_min    || 60
  customDuration.value       = ''
  selectedExperience.value   = training.routine?.experience      || ''
  selectedSpecial.value      = [...(training.routine?.special_programs || [])]
}

function cancelEdit() {
  editingRoutine.value = false
  showPreview.value    = false
  currentStep.value    = 1
}
</script>

<template>
  <div class="setup-view">
    <AppHeader title="Mi Rutina" />

    <main class="page-content page-pad">

      <!-- ── Si ya existe rutina: mostrar resumen ── -->
      <template v-if="training.routine && !showPreview && !editingRoutine">
        <div class="routine-header">
          <div>
            <p class="label-caps routine-label">Tu plan activo</p>
            <h2 class="routine-title">{{ training.routine.name }}</h2>
          </div>
          <span class="style-badge">{{ training.routine.style }}</span>
        </div>

        <!-- Week strip -->
        <div class="week-strip-full">
          <div
            v-for="(day, i) in routineWeekDays"
            :key="i"
            class="week-day-card"
            :class="{ today: day.isToday, active: !!day.session, rest: !day.session }"
          >
            <span class="wd-label">{{ day.label }}</span>
            <div class="wd-body">
              <span v-if="day.session" class="wd-session-label">{{ day.session.label }}</span>
              <span v-else class="wd-rest">—</span>
              <p class="wd-name">{{ day.session ? day.session.name : 'Descanso' }}</p>
            </div>
          </div>
        </div>

        <!-- Info de la rutina -->
        <div class="routine-meta card">
          <div class="meta-item">
            <span class="meta-value num-sm">{{ training.routine.days_per_week }}</span>
            <span class="meta-label">días/semana</span>
          </div>
          <div class="meta-item">
            <span class="meta-value num-sm">{{ training.routine.duration_min }}</span>
            <span class="meta-label">min/sesión</span>
          </div>
          <div class="meta-item">
            <span class="meta-value num-sm">{{ training.routine.experience }}</span>
            <span class="meta-label">nivel</span>
          </div>
        </div>

        <!-- CTAs -->
        <div class="routine-actions">
          <button class="btn btn-primary" @click="goToTraining">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Ver sesión de hoy
          </button>
          <button class="btn btn-ghost" @click="startEditRoutine">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar rutina
          </button>
        </div>
      </template>

      <!-- ── Preview de rutina recién generada ── -->
      <template v-else-if="showPreview">
        <div class="routine-preview">
          <div class="preview-header">
            <div class="preview-icon">✅</div>
            <h2 class="preview-title">¡Rutina generada!</h2>
            <p class="preview-sub">Tu plan personalizado está listo.</p>
          </div>

          <div class="week-strip-full">
            <div
              v-for="(day, i) in routineWeekDays"
              :key="i"
              class="week-day-card"
              :class="{ today: day.isToday, active: !!day.session, rest: !day.session }"
            >
              <span class="wd-label">{{ day.label }}</span>
              <div class="wd-body">
                <span v-if="day.session" class="wd-session-label">{{ day.session.label }}</span>
                <span v-else class="wd-rest">—</span>
                <p class="wd-name">{{ day.session ? day.session.name : 'Descanso' }}</p>
                <span v-if="day.session" class="wd-count">
                  {{ day.session.exercises_def?.length || '—' }} ejercicios
                </span>
              </div>
            </div>
          </div>

          <button class="btn btn-primary start-btn" @click="goToTraining">
            Empezar a entrenar
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </template>

      <!-- ── Wizard (sin rutina o editando) ── -->
      <template v-else-if="showWizard">
        <!-- Introducción si es la primera vez -->
        <div v-if="currentStep === 1 && !selectedStyle" class="wizard-intro">
          <div class="intro-icon">💪</div>
          <h2 class="intro-title display-sm">Crea tu rutina</h2>
          <p class="intro-sub">Responde unas preguntas y generaremos un plan de entrenamiento personalizado para ti.</p>
        </div>

        <!-- Banner al editar rutina existente -->
        <div v-if="editingRoutine" class="edit-banner">
          <span>Editando tu rutina actual</span>
          <button type="button" class="cancel-edit-btn" @click="cancelEdit">✕ Cancelar</button>
        </div>

        <!-- Indicador de pasos -->
        <div class="step-dots">
          <span
            v-for="n in totalSteps"
            :key="n"
            class="step-dot"
            :class="{ active: n === currentStep, done: n < currentStep }"
          />
        </div>

        <!-- Contenido del paso actual -->
        <div class="wizard-step-content">

          <!-- PASO 1: Estilo -->
          <template v-if="currentStep === 1">
            <h3 class="step-title">¿Qué estilo de entrenamiento prefieres?</h3>
            <div class="style-grid">
              <button
                v-for="s in STYLES"
                :key="s.id"
                type="button"
                class="style-card"
                :class="{ selected: selectedStyle === s.id }"
                @click="selectedStyle = s.id"
              >
                <span class="style-icon">{{ s.icon }}</span>
                <span class="style-name">{{ s.label }}</span>
                <span class="style-desc">{{ s.description }}</span>
              </button>
            </div>
          </template>

          <!-- PASO 2: Objetivo -->
          <template v-else-if="currentStep === 2">
            <h3 class="step-title">¿Cuál es tu objetivo principal?</h3>
            <div class="goal-grid">
              <button
                v-for="g in GOALS"
                :key="g.id"
                type="button"
                class="goal-card"
                :class="{ selected: selectedGoal === g.id }"
                @click="selectedGoal = g.id"
              >
                <span class="goal-icon">{{ g.icon }}</span>
                <span class="goal-label">{{ g.label }}</span>
              </button>
            </div>
          </template>

          <!-- PASO 3: Días y duración -->
          <template v-else-if="currentStep === 3">
            <h3 class="step-title">¿Qué días entrenas?</h3>

            <p class="step-sub">Selecciona tus días de entrenamiento</p>
            <div class="day-picker">
              <button
                v-for="d in WEEK_DAYS"
                :key="d.id"
                type="button"
                class="day-pill"
                :class="{ selected: selectedTrainingDays.includes(d.id) }"
                @click="toggleDay(d.id)"
              >
                <span class="day-pill-short">{{ d.short }}</span>
                <span class="day-pill-count" v-if="selectedTrainingDays.includes(d.id)">✓</span>
              </button>
            </div>
            <p class="days-selected-label">
              {{ selectedDays }} día{{ selectedDays !== 1 ? 's' : '' }} seleccionado{{ selectedDays !== 1 ? 's' : '' }}
            </p>

            <p class="step-sub">Duración de cada sesión</p>
            <div class="duration-row">
              <button
                v-for="min in DURATIONS"
                :key="min"
                type="button"
                class="duration-btn"
                :class="{ selected: selectedDuration === min && !customDuration }"
                @click="() => { selectedDuration = min; customDuration = '' }"
              >{{ min }} min</button>
            </div>
            <div class="custom-duration-row">
              <input
                v-model="customDuration"
                type="number"
                inputmode="numeric"
                class="custom-duration-input"
                placeholder="Otro (min)"
                min="15"
                max="240"
              />
              <span v-if="customDuration && Number(customDuration) >= 15" class="custom-duration-ok">✓ {{ customDuration }} min</span>
            </div>
          </template>

          <!-- PASO 4: Nivel -->
          <template v-else-if="currentStep === 4">
            <h3 class="step-title">¿Cuál es tu nivel de experiencia?</h3>
            <div class="exp-grid">
              <button
                v-for="e in EXPERIENCE_OPTIONS"
                :key="e.id"
                type="button"
                class="exp-card"
                :class="{ selected: selectedExperience === e.id }"
                @click="selectedExperience = e.id"
              >
                <span class="exp-icon">{{ e.icon }}</span>
                <div>
                  <p class="exp-name">{{ e.label }}</p>
                  <p class="exp-desc">{{ e.description }}</p>
                </div>
              </button>
            </div>
          </template>

          <!-- PASO 5: Programas especiales -->
          <template v-else-if="currentStep === 5">
            <h3 class="step-title">¿Tienes alguna necesidad especial?</h3>
            <p class="step-sub">Opcional — podemos añadir ejercicios terapéuticos a tu rutina</p>
            <div class="special-grid">
              <button
                v-for="p in SPECIAL_PROGRAMS"
                :key="p.id"
                type="button"
                class="special-card"
                :class="{ selected: selectedSpecial.includes(p.id) }"
                @click="toggleSpecial(p.id)"
              >
                <span class="special-icon">{{ p.icon }}</span>
                <div>
                  <p class="special-name">{{ p.label }}</p>
                  <p class="special-desc">{{ p.description }}</p>
                </div>
                <span v-if="selectedSpecial.includes(p.id)" class="special-check">✓</span>
              </button>
            </div>
          </template>

        </div>

        <!-- Controles de navegación -->
        <div class="wizard-nav">
          <button v-if="currentStep > 1" class="btn btn-ghost" @click="prevStep">
            ← Atrás
          </button>
          <div class="nav-spacer" v-else />

          <!-- En el último paso: botón generar -->
          <button
            v-if="currentStep === totalSteps"
            class="btn btn-primary generate-btn"
            :disabled="generating"
            @click="handleGenerate"
          >
            <span v-if="generating" class="spinner-sm" />
            <span v-else>GENERAR MI RUTINA</span>
          </button>

          <!-- En otros pasos: siguiente -->
          <button
            v-else
            class="btn btn-primary"
            :disabled="!canProceedStep"
            @click="nextStep"
          >
            Siguiente →
          </button>
        </div>

        <!-- Skip en el paso 5 -->
        <div v-if="currentStep === totalSteps" class="skip-row">
          <button class="skip-btn" @click="handleGenerate">Saltar este paso y generar</button>
        </div>

      </template>

    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.setup-view { min-height: 100vh; background: var(--surface); }
/* FIX: --space-14 no existe, usar --space-12 */
.page-pad { padding-left: var(--space-4); padding-right: var(--space-4); }

/* ── Rutina existente ──────────────────────────────────── */
.routine-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: var(--space-5);
}
.routine-label { color: var(--accent); font-size: var(--text-xs); margin-bottom: var(--space-1); }
.routine-title { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 800; }
.style-badge {
  background: var(--accent-dim); color: var(--accent);
  border-radius: var(--radius-full); padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs); font-weight: 700; text-transform: capitalize; white-space: nowrap;
}

/* ── Week strip ────────────────────────────────────────── */
.week-strip-full {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}
.week-day-card {
  border-radius: var(--radius-md);
  border: 1.5px solid var(--border);
  background: var(--card);
  padding: var(--space-2) var(--space-1);
  display: flex; flex-direction: column; align-items: center;
  gap: var(--space-1);
  min-height: 80px;
  transition: var(--transition);
}
.week-day-card.today {
  border-color: var(--accent);
  background: var(--accent-dim);
}
.week-day-card.rest { opacity: 0.5; }
.wd-label {
  font-size: var(--text-xs); font-weight: 700; text-transform: uppercase;
  color: var(--muted); letter-spacing: 0.06em;
}
.week-day-card.today .wd-label { color: var(--accent); }
.wd-body { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.wd-session-label {
  font-size: 9px; font-weight: 800; color: var(--accent);
  text-transform: uppercase; letter-spacing: 0.08em;
}
.wd-rest { font-size: var(--text-sm); color: var(--faint); }
.wd-name {
  font-size: 9px; color: var(--muted); text-align: center; line-height: 1.3;
}
.wd-count {
  font-size: 8px; color: var(--muted); font-family: var(--font-mono);
}

/* ── Routine meta ──────────────────────────────────────── */
.routine-meta {
  display: flex; gap: var(--space-4); justify-content: center;
  padding: var(--space-4); margin-bottom: var(--space-5);
}
.meta-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.meta-value { font-family: var(--font-mono); font-size: var(--text-xl); font-weight: 700; color: var(--text); text-transform: capitalize; }
.meta-label { font-size: var(--text-xs); color: var(--muted); }

/* ── Routine actions ───────────────────────────────────── */
.routine-actions {
  display: flex; flex-direction: column; gap: var(--space-3);
}
.routine-actions .btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: var(--space-2);
}

/* ── Preview ───────────────────────────────────────────── */
.routine-preview { display: flex; flex-direction: column; gap: var(--space-5); }
.preview-header { text-align: center; }
.preview-icon { font-size: 48px; margin-bottom: var(--space-2); }
.preview-title { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 800; }
.preview-sub { color: var(--muted); margin-top: var(--space-1); }
.start-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: var(--space-2);
}

/* ── Wizard intro ──────────────────────────────────────── */
.wizard-intro {
  text-align: center; padding: var(--space-6) 0 var(--space-4);
}
.intro-icon { font-size: 56px; margin-bottom: var(--space-3); }
.intro-title { margin-bottom: var(--space-2); }
.intro-sub { color: var(--muted); font-size: var(--text-base); line-height: var(--leading-relaxed); }

/* ── Step dots ─────────────────────────────────────────── */
.step-dots {
  display: flex; justify-content: center; gap: var(--space-2);
  margin-bottom: var(--space-5);
}
.step-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--faint); transition: var(--transition);
}
.step-dot.done { background: var(--accent); opacity: 0.5; }
.step-dot.active { background: var(--accent); width: 24px; border-radius: 4px; }

/* ── Edit banner ───────────────────────────────────────── */
.edit-banner {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--accent-dim); border: 1px solid var(--accent);
  border-radius: var(--radius-lg); padding: var(--space-2) var(--space-4);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm); color: var(--accent); font-weight: 600;
}
.cancel-edit-btn {
  background: none; border: none; color: var(--accent);
  font-size: var(--text-xs); font-weight: 700; cursor: pointer; padding: 0;
}

/* ── Step content ──────────────────────────────────────── */
/* FIX: garantizar opacity 1 por defecto para que si GSAP no corre, sea visible */
.wizard-step-content { opacity: 1; }

.step-title {
  font-family: var(--font-display); font-size: var(--text-xl); font-weight: 700;
  color: var(--text);
  margin-bottom: var(--space-4);
}
.step-sub {
  font-size: var(--text-sm); color: var(--muted);
  margin-bottom: var(--space-3); margin-top: var(--space-4);
}

/* ── Style grid ────────────────────────────────────────── */
.style-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3);
}
.style-card {
  display: flex; flex-direction: column; align-items: center;
  gap: var(--space-1); padding: var(--space-4) var(--space-3);
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-lg); cursor: pointer;
  transition: var(--transition); text-align: center;
  color: var(--text); /* FIX: color explícito */
}
.style-card.selected {
  border-color: var(--accent); background: var(--accent-dim);
}
.style-icon { font-size: 28px; }
.style-name { font-weight: 700; font-size: var(--text-sm); }
.style-desc { font-size: var(--text-xs); color: var(--muted); line-height: 1.4; }

/* ── Goal grid ─────────────────────────────────────────── */
.goal-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3);
}
.goal-card {
  display: flex; flex-direction: column; align-items: center;
  gap: var(--space-2); padding: var(--space-4);
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-lg); cursor: pointer;
  transition: var(--transition); text-align: center;
  color: var(--text); /* FIX */
}
.goal-card.selected {
  border-color: var(--accent); background: var(--accent-dim);
}
.goal-icon { font-size: 28px; }
.goal-label { font-size: var(--text-sm); font-weight: 700; }

/* ── Day picker ────────────────────────────────────────── */
.day-picker {
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: var(--space-2); margin-bottom: var(--space-2);
}
.day-pill {
  display: flex; flex-direction: column; align-items: center;
  gap: 3px; padding: var(--space-3) var(--space-1);
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-md); cursor: pointer;
  transition: var(--transition); color: var(--muted);
}
.day-pill.selected {
  border-color: var(--accent); background: var(--accent-dim); color: var(--accent);
}
.day-pill-short {
  font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
}
.day-pill-count { font-size: 10px; font-weight: 700; }

.days-selected-label {
  font-size: var(--text-xs); color: var(--muted); margin-bottom: var(--space-2);
  text-align: center;
}

/* ── Duration ──────────────────────────────────────────── */
.duration-row {
  display: flex; gap: var(--space-2); flex-wrap: wrap;
  margin-bottom: var(--space-3);
}
.duration-btn {
  padding: var(--space-2) var(--space-4);
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-lg); font-size: var(--text-sm);
  font-weight: 700; cursor: pointer; transition: var(--transition);
  font-family: var(--font-mono); color: var(--text);
}
.duration-btn.selected {
  border-color: var(--accent); background: var(--accent-dim); color: var(--accent);
}
.custom-duration-row {
  display: flex; align-items: center; gap: var(--space-3);
  margin-bottom: var(--space-2);
}
.custom-duration-input {
  width: 120px; height: 40px;
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: var(--radius-sm); text-align: center;
  font-family: var(--font-mono); font-size: var(--text-base); font-weight: 700;
  color: var(--text); transition: var(--transition);
  padding: 0 var(--space-3);
}
.custom-duration-input:focus { border-color: var(--accent); outline: none; }
.custom-duration-ok {
  font-size: var(--text-sm); color: var(--success); font-weight: 700;
}

/* ── Experience grid ───────────────────────────────────── */
.exp-grid {
  display: flex; flex-direction: column; gap: var(--space-3);
}
.exp-card {
  display: flex; align-items: center; gap: var(--space-4);
  padding: var(--space-4); background: var(--card);
  border: 1.5px solid var(--border); border-radius: var(--radius-lg);
  cursor: pointer; transition: var(--transition); text-align: left;
  color: var(--text); /* FIX */
}
.exp-card.selected {
  border-color: var(--accent); background: var(--accent-dim);
}
.exp-icon { font-size: 28px; flex-shrink: 0; }
.exp-name { font-weight: 700; font-size: var(--text-base); }
.exp-desc { font-size: var(--text-xs); color: var(--muted); margin-top: 2px; }

/* ── Special programs ──────────────────────────────────── */
.special-grid {
  display: flex; flex-direction: column; gap: var(--space-3);
}
.special-card {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-lg); cursor: pointer;
  transition: var(--transition); text-align: left; position: relative;
  color: var(--text); /* FIX */
}
.special-card.selected {
  border-color: var(--accent); background: var(--accent-dim);
}
.special-icon { font-size: 22px; flex-shrink: 0; }
.special-name { font-size: var(--text-sm); font-weight: 700; }
.special-desc { font-size: var(--text-xs); color: var(--muted); margin-top: 1px; }
.special-check {
  margin-left: auto; color: var(--accent); font-size: var(--text-base); font-weight: 800;
}

/* ── Wizard nav ────────────────────────────────────────── */
.wizard-nav {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: var(--space-6); gap: var(--space-3);
}
.nav-spacer { flex: 1; }
.wizard-nav .btn {
  flex: 1;
}
.generate-btn {
  display: flex; align-items: center; justify-content: center; gap: var(--space-2);
}
.spinner-sm {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.8s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.skip-row {
  text-align: center; margin-top: var(--space-3);
}
.skip-btn {
  background: none; border: none; color: var(--muted);
  font-size: var(--text-sm); cursor: pointer; text-decoration: underline;
}
</style>
