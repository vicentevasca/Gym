<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { gsap } from 'gsap'
import { useTrainingStore } from '@/stores/training.store'
import AppHeader from '@/components/ui/AppHeader.vue'
import BottomNav from '@/components/ui/BottomNav.vue'
import { STYLES, GOALS, SPECIAL_PROGRAMS } from '@/utils/routineGenerator'

const router   = useRouter()
const training = useTrainingStore()

const currentStep        = ref(1)
const totalSteps         = 5
const generating         = ref(false)
const showPreview        = ref(false)

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

async function handleGenerate() {
  generating.value = true
  try {
    await training.createAutoRoutine({
      style:            selectedStyle.value,
      goal:             selectedGoal.value,
      days_per_week:    selectedDays.value,
      training_days:    [...selectedTrainingDays.value].sort((a, b) => a - b),
      duration_min:     effectiveDuration.value,
      experience:       selectedExperience.value,
      special_programs: selectedSpecial.value,
    })
    showPreview.value = true
    await nextTick()
    gsap.from('.routine-preview', { y: 24, opacity: 0, duration: 0.4, ease: 'power2.out', clearProps: 'all' })
  } finally {
    generating.value = false
  }
}
</script>

<template>
  <div class="setup-view">
    <AppHeader title="Nueva rutina" />

    <main class="page-content page-pad">

      <!-- Preview post-generación -->
      <template v-if="showPreview">
        <div class="routine-preview">
          <div class="preview-header">
            <div class="preview-icon">✅</div>
            <h2 class="preview-title">¡Rutina creada!</h2>
            <p class="preview-sub">Tu plan está listo y activo.</p>
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
                <span v-if="day.session" class="wd-count">{{ day.session.exercises_def?.length || '—' }} ejerc.</span>
              </div>
            </div>
          </div>
          <div class="preview-actions">
            <button class="btn btn-primary start-btn" @click="router.push('/training')">
              Empezar a entrenar
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            <button class="btn btn-ghost" @click="router.push('/training/setup')">
              Ver mis rutinas
            </button>
          </div>
        </div>
      </template>

      <!-- Wizard -->
      <template v-else>
        <div class="wizard-intro">
          <div class="intro-icon">💪</div>
          <h2 class="intro-title display-sm">Crea tu rutina</h2>
          <p class="intro-sub">Responde unas preguntas y generamos tu plan en segundos.</p>
        </div>

        <div class="step-dots">
          <span v-for="n in totalSteps" :key="n" class="step-dot" :class="{ active: n === currentStep, done: n < currentStep }" />
        </div>

        <div class="wizard-step-content">

          <!-- PASO 1: Estilo -->
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

          <!-- PASO 2: Objetivo -->
          <template v-else-if="currentStep === 2">
            <h3 class="step-title">¿Cuál es tu objetivo?</h3>
            <div class="goal-grid">
              <button v-for="g in GOALS" :key="g.id" type="button" class="goal-card" :class="{ selected: selectedGoal === g.id }" @click="selectedGoal = g.id">
                <span class="goal-icon">{{ g.icon }}</span>
                <span class="goal-label">{{ g.label }}</span>
              </button>
            </div>
          </template>

          <!-- PASO 3: Días y duración -->
          <template v-else-if="currentStep === 3">
            <h3 class="step-title">¿Qué días entrenas?</h3>
            <div class="day-picker">
              <button v-for="d in WEEK_DAYS" :key="d.id" type="button" class="day-pill" :class="{ selected: selectedTrainingDays.includes(d.id) }" @click="toggleDay(d.id)">
                <span class="day-pill-short">{{ d.short }}</span>
                <span v-if="selectedTrainingDays.includes(d.id)" class="day-pill-count">✓</span>
              </button>
            </div>
            <p class="days-selected-label">{{ selectedDays }} día{{ selectedDays !== 1 ? 's' : '' }} seleccionado{{ selectedDays !== 1 ? 's' : '' }}</p>

            <p class="step-sub">Duración de cada sesión</p>
            <div class="duration-row">
              <button v-for="min in DURATIONS" :key="min" type="button" class="duration-btn" :class="{ selected: selectedDuration === min && !customDuration }" @click="() => { selectedDuration = min; customDuration = '' }">{{ min }} min</button>
            </div>
            <div class="custom-duration-row">
              <input v-model="customDuration" type="number" inputmode="numeric" class="custom-duration-input" placeholder="Otro (min)" min="15" max="240" />
              <span v-if="customDuration && Number(customDuration) >= 15" class="custom-duration-ok">✓ {{ customDuration }} min</span>
            </div>
          </template>

          <!-- PASO 4: Nivel -->
          <template v-else-if="currentStep === 4">
            <h3 class="step-title">¿Cuál es tu nivel?</h3>
            <div class="exp-grid">
              <button v-for="e in EXPERIENCE_OPTIONS" :key="e.id" type="button" class="exp-card" :class="{ selected: selectedExperience === e.id }" @click="selectedExperience = e.id">
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
            <h3 class="step-title">¿Alguna necesidad especial?</h3>
            <p class="step-sub">Opcional — añadimos ejercicios terapéuticos a tu rutina</p>
            <div class="special-grid">
              <button v-for="p in SPECIAL_PROGRAMS" :key="p.id" type="button" class="special-card" :class="{ selected: selectedSpecial.includes(p.id) }" @click="toggleSpecial(p.id)">
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

        <div class="wizard-nav">
          <button v-if="currentStep > 1" class="btn btn-ghost" @click="prevStep">← Atrás</button>
          <div class="nav-spacer" v-else />

          <button v-if="currentStep === totalSteps" class="btn btn-primary generate-btn" :disabled="generating" @click="handleGenerate">
            <span v-if="generating" class="spinner-sm" />
            <span v-else>GENERAR MI RUTINA</span>
          </button>
          <button v-else class="btn btn-primary" :disabled="!canProceedStep" @click="nextStep">Siguiente →</button>
        </div>

        <div v-if="currentStep === totalSteps" class="skip-row">
          <button class="skip-btn" @click="handleGenerate">Saltar y generar</button>
        </div>
      </template>

    </main>
    <BottomNav />
  </div>
</template>

<style scoped>
.setup-view { min-height: 100vh; background: var(--surface); }
.page-pad { padding-left: var(--space-4); padding-right: var(--space-4); }

.wizard-intro { text-align: center; padding: var(--space-6) 0 var(--space-3); }
.intro-icon  { font-size: 52px; margin-bottom: var(--space-3); }
.intro-title { margin-bottom: var(--space-2); }
.intro-sub   { color: var(--muted); font-size: var(--text-sm); line-height: var(--leading-relaxed); }

.step-dots { display: flex; justify-content: center; gap: var(--space-2); margin-bottom: var(--space-5); }
.step-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--faint); transition: var(--transition); }
.step-dot.done   { background: var(--accent); opacity: 0.45; }
.step-dot.active { background: var(--accent); width: 22px; border-radius: 4px; }

.wizard-step-content { opacity: 1; }
.step-title { font-family: var(--font-display); font-size: var(--text-xl); font-weight: 700; color: var(--text); margin-bottom: var(--space-4); }
.step-sub   { font-size: var(--text-sm); color: var(--muted); margin-bottom: var(--space-3); margin-top: var(--space-4); }

.style-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
.style-card {
  display: flex; flex-direction: column; align-items: center; gap: var(--space-1);
  padding: var(--space-4) var(--space-3); background: var(--card);
  border: 1.5px solid var(--border); border-radius: var(--radius-lg);
  cursor: pointer; transition: var(--transition); text-align: center; color: var(--text);
}
.style-card.selected { border-color: var(--accent); background: var(--accent-dim); }
.style-icon { font-size: 28px; }
.style-name { font-weight: 700; font-size: var(--text-sm); }
.style-desc { font-size: var(--text-xs); color: var(--muted); line-height: 1.4; }

.goal-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
.goal-card {
  display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
  padding: var(--space-4); background: var(--card);
  border: 1.5px solid var(--border); border-radius: var(--radius-lg);
  cursor: pointer; transition: var(--transition); text-align: center; color: var(--text);
}
.goal-card.selected { border-color: var(--accent); background: var(--accent-dim); }
.goal-icon  { font-size: 28px; }
.goal-label { font-size: var(--text-sm); font-weight: 700; }

.day-picker { display: grid; grid-template-columns: repeat(7, 1fr); gap: var(--space-2); margin-bottom: var(--space-2); }
.day-pill {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: var(--space-3) var(--space-1); background: var(--card);
  border: 1.5px solid var(--border); border-radius: var(--radius-md);
  cursor: pointer; transition: var(--transition); color: var(--muted);
}
.day-pill.selected { border-color: var(--accent); background: var(--accent-dim); color: var(--accent); }
.day-pill-short { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
.day-pill-count { font-size: 10px; font-weight: 700; }
.days-selected-label { font-size: var(--text-xs); color: var(--muted); text-align: center; margin-bottom: var(--space-2); }

.duration-row { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-3); }
.duration-btn {
  padding: var(--space-2) var(--space-4); background: var(--card);
  border: 1.5px solid var(--border); border-radius: var(--radius-lg);
  font-size: var(--text-sm); font-weight: 700; cursor: pointer;
  transition: var(--transition); font-family: var(--font-mono); color: var(--text);
}
.duration-btn.selected { border-color: var(--accent); background: var(--accent-dim); color: var(--accent); }
.custom-duration-row { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-2); }
.custom-duration-input {
  width: 120px; height: 40px; background: var(--surface);
  border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  text-align: center; font-family: var(--font-mono); font-size: var(--text-base);
  font-weight: 700; color: var(--text); transition: var(--transition); padding: 0 var(--space-3);
}
.custom-duration-input:focus { border-color: var(--accent); outline: none; }
.custom-duration-ok { font-size: var(--text-sm); color: var(--success); font-weight: 700; }

.exp-grid { display: flex; flex-direction: column; gap: var(--space-3); }
.exp-card {
  display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4);
  background: var(--card); border: 1.5px solid var(--border); border-radius: var(--radius-lg);
  cursor: pointer; transition: var(--transition); text-align: left; color: var(--text);
}
.exp-card.selected { border-color: var(--accent); background: var(--accent-dim); }
.exp-icon { font-size: 28px; flex-shrink: 0; }
.exp-name { font-weight: 700; font-size: var(--text-base); }
.exp-desc { font-size: var(--text-xs); color: var(--muted); margin-top: 2px; }

.special-grid { display: flex; flex-direction: column; gap: var(--space-3); }
.special-card {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4); background: var(--card);
  border: 1.5px solid var(--border); border-radius: var(--radius-lg);
  cursor: pointer; transition: var(--transition); text-align: left; position: relative; color: var(--text);
}
.special-card.selected { border-color: var(--accent); background: var(--accent-dim); }
.special-icon { font-size: 22px; flex-shrink: 0; }
.special-name { font-size: var(--text-sm); font-weight: 700; }
.special-desc { font-size: var(--text-xs); color: var(--muted); margin-top: 1px; }
.special-check { margin-left: auto; color: var(--accent); font-size: var(--text-base); font-weight: 800; }

.wizard-nav { display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-6); gap: var(--space-3); }
.nav-spacer { flex: 1; }
.wizard-nav .btn { flex: 1; }
.generate-btn { display: flex; align-items: center; justify-content: center; gap: var(--space-2); }

.skip-row { text-align: center; margin-top: var(--space-3); }
.skip-btn { background: none; border: none; color: var(--muted); font-size: var(--text-sm); cursor: pointer; text-decoration: underline; }

.spinner-sm {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.8s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Preview */
.routine-preview { display: flex; flex-direction: column; gap: var(--space-5); }
.preview-header  { text-align: center; }
.preview-icon    { font-size: 52px; margin-bottom: var(--space-2); }
.preview-title   { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 800; }
.preview-sub     { color: var(--muted); margin-top: var(--space-1); }
.preview-actions { display: flex; flex-direction: column; gap: var(--space-3); }
.start-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: var(--space-2); }

.week-strip-full { display: grid; grid-template-columns: repeat(7, 1fr); gap: var(--space-2); }
.week-day-card {
  border-radius: var(--radius-md); border: 1.5px solid var(--border); background: var(--card);
  padding: var(--space-2) var(--space-1); display: flex; flex-direction: column;
  align-items: center; gap: var(--space-1); min-height: 80px; transition: var(--transition);
}
.week-day-card.today { border-color: var(--accent); background: var(--accent-dim); }
.week-day-card.rest  { opacity: 0.45; }
.wd-label        { font-size: var(--text-xs); font-weight: 700; text-transform: uppercase; color: var(--muted); letter-spacing: 0.06em; }
.week-day-card.today .wd-label { color: var(--accent); }
.wd-body         { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.wd-session-label { font-size: 9px; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: 0.08em; }
.wd-rest         { font-size: var(--text-sm); color: var(--faint); }
.wd-name         { font-size: 9px; color: var(--muted); text-align: center; line-height: 1.3; }
.wd-count        { font-size: 8px; color: var(--muted); font-family: var(--font-mono); }
</style>
