<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { gsap } from 'gsap'
import { useTrainingStore } from '@/stores/training.store'
import { useAuthStore }     from '@/stores/auth.store'
import AppHeader from '@/components/ui/AppHeader.vue'
import BottomNav from '@/components/ui/BottomNav.vue'
import {
  GOALS, SPECIAL_PROGRAMS,
  BODY_FOCUS, EQUIPMENT_OPTIONS, CARDIO_LEVELS, STYLE_PREFERENCES,
  DAY_ASSIGNMENT_SCIENCE,
  assignOptimalDays, getStyleFromMedidaParams,
  mapExperienceLevel, mapHealthToPrograms,
} from '@/utils/routineGenerator'

const router   = useRouter()
const training = useTrainingStore()
const auth     = useAuthStore()

// ─── Estado wizard ────────────────────────────────────────────────
const TOTAL_STEPS = 7
const step        = ref(1)
const generating  = ref(false)
const showPreview = ref(false)
const showScience = ref(false)

// Step 1 — Screening de salud
const screening = ref({
  cardiac:      false,
  chest_pain:   false,
  chest_rest:   false,
  back_pain:    false,
  joint_injury: false,
  respiratory:  false,
  medication:   false,
})
const hasHealthFlag = computed(() => Object.values(screening.value).some(v => v))

// Step 2 — Nivel de experiencia
const experienceLevel = ref('')

const EXPERIENCE_LEVELS = [
  { id: 'novato',       icon: '🌱', label: 'Nunca he entrenado',   desc: 'Estoy empezando desde cero',              note: 'Volumen mínimo, enfoque en técnica y adaptación' },
  { id: 'principiante', icon: '🔰', label: 'Menos de 1 año',       desc: 'Entreno pero sigo aprendiendo técnica',    note: 'Progresión gradual, compuestos prioritarios' },
  { id: 'intermedio',   icon: '🔥', label: 'Entre 1 y 3 años',     desc: 'Tengo rutinas y técnica consistente',      note: 'Mayor volumen e intensidad, periodización' },
  { id: 'avanzado',     icon: '⚡', label: 'Más de 3 años',        desc: 'Entreno con intensidad y consistencia alta', note: 'Programas especializados, carga elevada' },
]

// Step 3 — Equipamiento
const equipment = ref('')

// Step 4 — Objetivo y enfoque
const goal      = ref('')
const bodyFocus = ref('')

// Step 5 — Condición actual
const cardioLevel  = ref('')
const sleepQuality = ref('')  // 'bueno' | 'regular' | 'malo'
const stressLevel  = ref('')  // 'bajo' | 'medio' | 'alto'

const SLEEP_OPTIONS  = [
  { id: 'bueno',   label: '+7 horas regulares',  icon: '😴' },
  { id: 'regular', label: '6–7 horas',            icon: '🥱' },
  { id: 'malo',    label: 'Menos de 6 horas',     icon: '😓' },
]
const STRESS_OPTIONS = [
  { id: 'bajo',  label: 'Bajo — me siento tranquilo/a', icon: '😌' },
  { id: 'medio', label: 'Moderado — algo de tensión',   icon: '😐' },
  { id: 'alto',  label: 'Alto — estrés frecuente',      icon: '😰' },
]

// Step 6 — Disponibilidad
const daysPerWeek     = ref(3)
const durationMin     = ref(60)
const stylePreference = ref('auto')

const DURATION_OPTIONS = [20, 30, 45, 60, 75, 90]

// Step 7 — Asignación de días
const dayMode            = ref('auto')   // 'auto' | 'manual'
const selectedDaysManual = ref([])

const WEEK_DAYS = [
  { id: 0, short: 'Dom' }, { id: 1, short: 'Lun' }, { id: 2, short: 'Mar' },
  { id: 3, short: 'Mié' }, { id: 4, short: 'Jue' }, { id: 5, short: 'Vie' },
  { id: 6, short: 'Sáb' },
]
const ALL_DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// Computed: ciencia para los días actuales
const scienceForDays = computed(() => DAY_ASSIGNMENT_SCIENCE[daysPerWeek.value] || DAY_ASSIGNMENT_SCIENCE[3])
const autoDays       = computed(() => assignOptimalDays(daysPerWeek.value))

function toggleManualDay(id) {
  const idx = selectedDaysManual.value.indexOf(id)
  if (idx >= 0) {
    if (selectedDaysManual.value.length > 1) selectedDaysManual.value.splice(idx, 1)
  } else {
    selectedDaysManual.value.push(id)
    selectedDaysManual.value.sort((a, b) => a - b)
  }
}

// Validación por paso
const canProceed = computed(() => {
  if (step.value === 1) return true                // screening nunca bloquea
  if (step.value === 2) return !!experienceLevel.value
  if (step.value === 3) return !!equipment.value
  if (step.value === 4) return !!goal.value && !!bodyFocus.value
  if (step.value === 5) return !!cardioLevel.value && !!sleepQuality.value && !!stressLevel.value
  if (step.value === 6) return daysPerWeek.value >= 2 && durationMin.value >= 20
  if (step.value === 7) return dayMode.value === 'auto' || selectedDaysManual.value.length >= 2
  return false
})

// ─── Navegación wizard ────────────────────────────────────────────
async function nextStep() {
  if (!canProceed.value) return
  if (step.value < TOTAL_STEPS) {
    step.value++
    // Inicializar días manuales con los automáticos si están vacíos
    if (step.value === 7 && selectedDaysManual.value.length === 0) {
      selectedDaysManual.value = [...autoDays.value]
    }
    await nextTick()
    animateIn('next')
  }
}

async function prevStep() {
  if (step.value > 1) {
    step.value--
    await nextTick()
    animateIn('prev')
  }
}

function animateIn(direction) {
  const el = document.querySelector('.medida-step-content')
  if (!el) return
  gsap.set(el, { opacity: 0, x: direction === 'next' ? 30 : -30 })
  gsap.to(el, { opacity: 1, x: 0, duration: 0.28, ease: 'power2.out', clearProps: 'all' })
}

// ─── Generar rutina ───────────────────────────────────────────────
async function handleGenerate() {
  generating.value = true
  try {
    const finalExperience = mapExperienceLevel(experienceLevel.value)
    const finalStyle      = getStyleFromMedidaParams({ equipment: equipment.value, goal: goal.value, style_preference: stylePreference.value })
    const finalDays       = dayMode.value === 'auto' ? autoDays.value : [...selectedDaysManual.value].sort((a, b) => a - b)

    // Construir programas especiales desde screening + estado
    const healthPrograms  = mapHealthToPrograms(screening.value)
    const conditionProgs  = [
      ...(stressLevel.value === 'alto' ? ['estres'] : []),
      ...(sleepQuality.value === 'malo' ? ['sueño'] : []),
    ]
    const specialPrograms = [...new Set([...healthPrograms, ...conditionProgs])]

    await training.createAutoRoutine({
      style:            finalStyle,
      goal:             goal.value,
      days_per_week:    finalDays.length,
      training_days:    finalDays,
      duration_min:     durationMin.value,
      experience:       finalExperience,
      special_programs: specialPrograms,
      body_focus:       bodyFocus.value,
    })

    showPreview.value = true
    await nextTick()
    gsap.from('.medida-preview', { y: 24, opacity: 0, duration: 0.4, ease: 'power2.out', clearProps: 'all' })
  } finally {
    generating.value = false
  }
}

// ─── Preview ──────────────────────────────────────────────────────
const routineWeekDays = computed(() => {
  if (!training.routine?.weekly_plan) return []
  return training.routine.weekly_plan.map((day, i) => ({
    label: ALL_DAY_LABELS[i],
    session: day,
    isToday: i === new Date().getDay(),
  }))
})

onMounted(async () => {
  await training.loadRoutine()
  // Pre-fill goal desde onboarding si existe
  const profileGoal = auth.profile?.goals?.primary_goal
  if (profileGoal && !goal.value) goal.value = profileGoal
})
</script>

<template>
  <div class="medida-view">
    <AppHeader title="A tu medida" />

    <main class="page-content page-pad">

      <!-- ── Preview post-generación ── -->
      <template v-if="showPreview">
        <div class="medida-preview">
          <div class="preview-header">
            <div class="preview-icon">🎯</div>
            <h2 class="preview-title display-sm">¡Rutina personalizada lista!</h2>
            <p class="preview-sub">Generada en base a tu evaluación completa.</p>
          </div>
          <div class="week-strip">
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
                <span v-if="day.session" class="wd-count">{{ day.session.exercises_def?.length }} ejerc.</span>
              </div>
            </div>
          </div>
          <button class="btn btn-primary start-btn" @click="router.push('/training')">
            Empezar a entrenar
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </template>

      <!-- ── Wizard ── -->
      <template v-else>

        <!-- Intro -->
        <div v-if="step === 1" class="medida-intro">
          <div class="intro-icon">🎯</div>
          <h2 class="intro-title display-sm">A tu medida</h2>
          <p class="intro-sub">En 7 pasos creamos tu rutina con base en tu estado de salud, condición física y metas reales.</p>
        </div>

        <!-- Step dots -->
        <div class="step-dots">
          <span
            v-for="n in TOTAL_STEPS"
            :key="n"
            class="step-dot"
            :class="{ active: n === step, done: n < step }"
          />
        </div>

        <!-- Barra de progreso -->
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: ((step - 1) / (TOTAL_STEPS - 1) * 100) + '%' }" />
        </div>

        <!-- Contenido del paso -->
        <div class="medida-step-content">

          <!-- PASO 1: Screening de salud -->
          <template v-if="step === 1">
            <h3 class="step-title">Screening de salud</h3>
            <p class="step-sub">Marca todo lo que aplique. Esta información adapta tu programa para que sea seguro.</p>

            <div class="screening-list">
              <label
                v-for="(item, key) in {
                  cardiac:      '¿Algún médico te ha dicho que tienes una condición cardíaca?',
                  chest_pain:   '¿Sientes dolor o presión en el pecho al hacer esfuerzo físico?',
                  chest_rest:   '¿Has sentido dolor en el pecho en el último mes estando en reposo?',
                  back_pain:    '¿Tienes dolor de espalda frecuente o lumbalgia?',
                  joint_injury: '¿Tienes alguna lesión articular o muscular activa?',
                  respiratory:  '¿Padeces asma u otro problema respiratorio?',
                  medication:   '¿Tomas medicamentos para la presión arterial o el corazón?',
                }"
                :key="key"
                class="screening-item"
                :class="{ checked: screening[key] }"
              >
                <input type="checkbox" v-model="screening[key]" class="screening-check" />
                <span class="screening-text">{{ item }}</span>
              </label>
            </div>

            <div v-if="hasHealthFlag" class="health-alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p>Recomendamos que consultes a tu médico antes de iniciar. Puedes continuar, pero adaptaremos el programa para ser más conservador.</p>
            </div>
          </template>

          <!-- PASO 2: Nivel de experiencia -->
          <template v-else-if="step === 2">
            <h3 class="step-title">¿Cuánto tiempo llevas entrenando?</h3>
            <p class="step-sub">Sé honesto — esto define el volumen e intensidad de tu programa.</p>
            <div class="exp-grid">
              <button
                v-for="lvl in EXPERIENCE_LEVELS"
                :key="lvl.id"
                type="button"
                class="exp-card"
                :class="{ selected: experienceLevel === lvl.id }"
                @click="experienceLevel = lvl.id"
              >
                <span class="exp-icon">{{ lvl.icon }}</span>
                <div>
                  <p class="exp-name">{{ lvl.label }}</p>
                  <p class="exp-desc">{{ lvl.desc }}</p>
                  <p v-if="experienceLevel === lvl.id" class="exp-note">{{ lvl.note }}</p>
                </div>
              </button>
            </div>
          </template>

          <!-- PASO 3: Equipamiento disponible -->
          <template v-else-if="step === 3">
            <h3 class="step-title">¿Con qué equipamiento cuentas?</h3>
            <p class="step-sub">Elegiremos ejercicios que puedas hacer con lo que tienes disponible.</p>
            <div class="equip-grid">
              <button
                v-for="eq in EQUIPMENT_OPTIONS"
                :key="eq.id"
                type="button"
                class="equip-card"
                :class="{ selected: equipment === eq.id }"
                @click="equipment = eq.id"
              >
                <span class="equip-icon">{{ eq.icon }}</span>
                <div>
                  <p class="equip-name">{{ eq.label }}</p>
                  <p class="equip-desc">{{ eq.description }}</p>
                </div>
                <span v-if="equipment === eq.id" class="equip-check">✓</span>
              </button>
            </div>
          </template>

          <!-- PASO 4: Objetivo y enfoque corporal -->
          <template v-else-if="step === 4">
            <h3 class="step-title">¿Cuál es tu objetivo?</h3>
            <div class="goal-grid">
              <button
                v-for="g in GOALS"
                :key="g.id"
                type="button"
                class="goal-card"
                :class="{ selected: goal === g.id }"
                @click="goal = g.id"
              >
                <span class="goal-icon">{{ g.icon }}</span>
                <span class="goal-label">{{ g.label }}</span>
              </button>
            </div>

            <h3 class="step-title step-title--mt">¿En qué zona quieres enfocarte?</h3>
            <div class="focus-grid">
              <button
                v-for="f in BODY_FOCUS"
                :key="f.id"
                type="button"
                class="focus-card"
                :class="{ selected: bodyFocus === f.id }"
                @click="bodyFocus = f.id"
              >
                <span class="focus-icon">{{ f.icon }}</span>
                <div>
                  <p class="focus-name">{{ f.label }}</p>
                  <p class="focus-desc">{{ f.description }}</p>
                </div>
                <span v-if="bodyFocus === f.id" class="focus-check">✓</span>
              </button>
            </div>
          </template>

          <!-- PASO 5: Condición actual -->
          <template v-else-if="step === 5">
            <h3 class="step-title">Tu condición actual</h3>
            <p class="step-sub">Esto ajusta la intensidad y el tiempo de recuperación de tu programa.</p>

            <p class="condition-label label-caps">Nivel cardiovascular</p>
            <div class="condition-grid">
              <button
                v-for="c in CARDIO_LEVELS"
                :key="c.id"
                type="button"
                class="condition-btn"
                :class="{ selected: cardioLevel === c.id }"
                @click="cardioLevel = c.id"
              >
                <span>{{ c.icon }}</span>
                <span>{{ c.label }}</span>
              </button>
            </div>

            <p class="condition-label label-caps">Calidad del sueño</p>
            <div class="condition-grid">
              <button
                v-for="s in SLEEP_OPTIONS"
                :key="s.id"
                type="button"
                class="condition-btn"
                :class="{ selected: sleepQuality === s.id }"
                @click="sleepQuality = s.id"
              >
                <span>{{ s.icon }}</span>
                <span>{{ s.label }}</span>
              </button>
            </div>

            <p class="condition-label label-caps">Nivel de estrés</p>
            <div class="condition-grid">
              <button
                v-for="st in STRESS_OPTIONS"
                :key="st.id"
                type="button"
                class="condition-btn"
                :class="{ selected: stressLevel === st.id }"
                @click="stressLevel = st.id"
              >
                <span>{{ st.icon }}</span>
                <span>{{ st.label }}</span>
              </button>
            </div>

            <div v-if="sleepQuality === 'malo' || stressLevel === 'alto'" class="condition-alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Añadiremos módulos de manejo del estrés y mejora del sueño a tu programa.
            </div>
          </template>

          <!-- PASO 6: Disponibilidad y estilo -->
          <template v-else-if="step === 6">
            <h3 class="step-title">Tu disponibilidad</h3>

            <p class="step-sub">¿Cuántos días por semana puedes entrenar?</p>
            <div class="days-row">
              <button
                v-for="n in [2, 3, 4, 5, 6]"
                :key="n"
                type="button"
                class="days-btn"
                :class="{ selected: daysPerWeek === n }"
                @click="daysPerWeek = n"
              >
                {{ n }}
                <span class="days-btn-sub">días</span>
              </button>
            </div>

            <p class="step-sub">Duración de cada sesión</p>
            <div class="duration-row">
              <button
                v-for="min in DURATION_OPTIONS"
                :key="min"
                type="button"
                class="duration-btn"
                :class="{ selected: durationMin === min }"
                @click="durationMin = min"
              >{{ min }} min</button>
            </div>

            <p class="step-sub">Preferencia de estilo</p>
            <div class="style-pref-list">
              <button
                v-for="sp in STYLE_PREFERENCES"
                :key="sp.id"
                type="button"
                class="style-pref-card"
                :class="{ selected: stylePreference === sp.id }"
                @click="stylePreference = sp.id"
              >
                <span class="sp-icon">{{ sp.icon }}</span>
                <div>
                  <p class="sp-name">{{ sp.label }}</p>
                  <p class="sp-desc">{{ sp.description }}</p>
                </div>
                <span v-if="stylePreference === sp.id" class="sp-check">✓</span>
              </button>
            </div>
          </template>

          <!-- PASO 7: Asignación de días -->
          <template v-else-if="step === 7">
            <h3 class="step-title">Asignación de días</h3>

            <div class="day-mode-tabs">
              <button
                type="button"
                class="day-mode-tab"
                :class="{ active: dayMode === 'auto' }"
                @click="dayMode = 'auto'"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Automático
              </button>
              <button
                type="button"
                class="day-mode-tab"
                :class="{ active: dayMode === 'manual' }"
                @click="dayMode = 'manual'"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Manual
              </button>
            </div>

            <!-- MODO AUTOMÁTICO -->
            <template v-if="dayMode === 'auto'">
              <p class="step-sub">Días propuestos para {{ daysPerWeek }} días/semana:</p>
              <div class="auto-days-strip">
                <div
                  v-for="(d, i) in ALL_DAY_LABELS"
                  :key="i"
                  class="auto-day-chip"
                  :class="{ selected: autoDays.includes(i) }"
                >
                  {{ d }}
                </div>
              </div>

              <!-- Panel de ciencia -->
              <button type="button" class="science-toggle" @click="showScience = !showScience">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                {{ showScience ? 'Ocultar' : 'Ver' }} justificación científica
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" :style="{ transform: showScience ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }"><path d="m6 9 6 6 6-6"/></svg>
              </button>

              <Transition name="science">
                <div v-if="showScience" class="science-panel">
                  <p class="science-text">{{ scienceForDays.justification }}</p>
                  <div class="science-sources">
                    <p class="label-caps sources-title">Fuentes</p>
                    <ul class="sources-list">
                      <li v-for="(src, i) in scienceForDays.sources" :key="i" class="source-item">
                        <span class="source-ref">{{ src.ref }}</span>
                        <span class="source-detail">{{ src.detail }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Transition>
            </template>

            <!-- MODO MANUAL -->
            <template v-else>
              <p class="step-sub">Selecciona tus días de entrenamiento</p>
              <div class="day-picker">
                <button
                  v-for="d in WEEK_DAYS"
                  :key="d.id"
                  type="button"
                  class="day-pill"
                  :class="{ selected: selectedDaysManual.includes(d.id) }"
                  @click="toggleManualDay(d.id)"
                >
                  <span class="day-pill-short">{{ d.short }}</span>
                  <span v-if="selectedDaysManual.includes(d.id)" class="day-pill-check">✓</span>
                </button>
              </div>
              <p class="days-count-label">{{ selectedDaysManual.length }} día{{ selectedDaysManual.length !== 1 ? 's' : '' }} seleccionado{{ selectedDaysManual.length !== 1 ? 's' : '' }}</p>
            </template>

          </template>

        </div><!-- /step-content -->

        <!-- Navegación -->
        <div class="wizard-nav">
          <button v-if="step > 1" class="btn btn-ghost" @click="prevStep">← Atrás</button>
          <div v-else class="nav-spacer" />

          <button
            v-if="step < TOTAL_STEPS"
            class="btn btn-primary"
            :disabled="!canProceed"
            @click="nextStep"
          >
            Siguiente →
          </button>
          <button
            v-else
            class="btn btn-primary generate-btn"
            :disabled="!canProceed || generating"
            @click="handleGenerate"
          >
            <span v-if="generating" class="spinner-sm" />
            <span v-else>GENERAR MI RUTINA</span>
          </button>
        </div>

      </template>
    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.medida-view { min-height: 100vh; background: var(--surface); }
.page-pad { padding-left: var(--space-4); padding-right: var(--space-4); }

/* ── Intro ──────────────────────────────────────────────── */
.medida-intro { text-align: center; padding: var(--space-6) 0 var(--space-3); }
.intro-icon  { font-size: 52px; margin-bottom: var(--space-3); }
.intro-title { margin-bottom: var(--space-2); }
.intro-sub   { font-size: var(--text-sm); color: var(--muted); line-height: var(--leading-relaxed); }

/* ── Step dots ──────────────────────────────────────────── */
.step-dots {
  display: flex; justify-content: center; gap: 6px;
  margin-bottom: var(--space-2);
}
.step-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--faint); transition: var(--transition);
}
.step-dot.done   { background: var(--accent); opacity: 0.45; }
.step-dot.active { background: var(--accent); width: 22px; border-radius: 4px; }

/* ── Progress bar ───────────────────────────────────────── */
.progress-track {
  height: 3px; background: var(--faint);
  border-radius: 2px; margin-bottom: var(--space-5);
  overflow: hidden;
}
.progress-fill {
  height: 100%; background: var(--gradient-accent);
  border-radius: 2px; transition: width 0.35s ease;
}

/* ── Step content ───────────────────────────────────────── */
.medida-step-content { opacity: 1; }

.step-title {
  font-family: var(--font-display); font-size: var(--text-xl); font-weight: 700;
  color: var(--text); margin-bottom: var(--space-4);
}
.step-title--mt { margin-top: var(--space-5); }
.step-sub {
  font-size: var(--text-sm); color: var(--muted);
  margin-bottom: var(--space-3); line-height: var(--leading-relaxed);
}

/* ── Screening ──────────────────────────────────────────── */
.screening-list { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4); }
.screening-item {
  display: flex; align-items: flex-start; gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-lg); cursor: pointer; transition: var(--transition);
}
.screening-item.checked { border-color: var(--accent); background: var(--accent-dim); }
.screening-check { width: 18px; height: 18px; accent-color: var(--accent); flex-shrink: 0; margin-top: 2px; cursor: pointer; }
.screening-text  { font-size: var(--text-sm); color: var(--text); line-height: var(--leading-relaxed); }

.health-alert {
  display: flex; align-items: flex-start; gap: var(--space-2);
  background: var(--warning-dim, #fef3c7); border: 1px solid var(--warning, #f59e0b);
  border-radius: var(--radius-lg); padding: var(--space-3) var(--space-4);
  font-size: var(--text-xs); color: var(--text); line-height: var(--leading-relaxed);
}
.health-alert svg { flex-shrink: 0; color: var(--warning, #f59e0b); margin-top: 1px; }

/* ── Experience ─────────────────────────────────────────── */
.exp-grid { display: flex; flex-direction: column; gap: var(--space-3); }
.exp-card {
  display: flex; align-items: flex-start; gap: var(--space-3);
  padding: var(--space-4); background: var(--card);
  border: 1.5px solid var(--border); border-radius: var(--radius-lg);
  cursor: pointer; transition: var(--transition); text-align: left; color: var(--text);
}
.exp-card.selected { border-color: var(--accent); background: var(--accent-dim); }
.exp-icon { font-size: 26px; flex-shrink: 0; margin-top: 2px; }
.exp-name { font-weight: 700; font-size: var(--text-base); margin-bottom: 2px; }
.exp-desc { font-size: var(--text-xs); color: var(--muted); }
.exp-note { font-size: var(--text-xs); color: var(--accent); font-weight: 600; margin-top: 4px; }

/* ── Equipment ──────────────────────────────────────────── */
.equip-grid { display: flex; flex-direction: column; gap: var(--space-3); }
.equip-card {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-4); background: var(--card);
  border: 1.5px solid var(--border); border-radius: var(--radius-lg);
  cursor: pointer; transition: var(--transition); text-align: left; color: var(--text);
}
.equip-card.selected { border-color: var(--accent); background: var(--accent-dim); }
.equip-icon { font-size: 24px; flex-shrink: 0; }
.equip-name { font-weight: 700; font-size: var(--text-sm); margin-bottom: 1px; }
.equip-desc { font-size: var(--text-xs); color: var(--muted); }
.equip-check { margin-left: auto; color: var(--accent); font-weight: 800; font-size: var(--text-base); }

/* ── Goal grid ──────────────────────────────────────────── */
.goal-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3);
  margin-bottom: var(--space-2);
}
.goal-card {
  display: flex; flex-direction: column; align-items: center;
  gap: var(--space-2); padding: var(--space-4);
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-lg); cursor: pointer;
  transition: var(--transition); text-align: center; color: var(--text);
}
.goal-card.selected { border-color: var(--accent); background: var(--accent-dim); }
.goal-icon  { font-size: 26px; }
.goal-label { font-size: var(--text-sm); font-weight: 700; }

/* ── Body focus ─────────────────────────────────────────── */
.focus-grid { display: flex; flex-direction: column; gap: var(--space-3); }
.focus-card {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4); background: var(--card);
  border: 1.5px solid var(--border); border-radius: var(--radius-lg);
  cursor: pointer; transition: var(--transition); text-align: left; color: var(--text);
}
.focus-card.selected { border-color: var(--accent); background: var(--accent-dim); }
.focus-icon  { font-size: 22px; flex-shrink: 0; }
.focus-name  { font-weight: 700; font-size: var(--text-sm); margin-bottom: 1px; }
.focus-desc  { font-size: var(--text-xs); color: var(--muted); }
.focus-check { margin-left: auto; color: var(--accent); font-weight: 800; }

/* ── Condición actual ───────────────────────────────────── */
.condition-label { font-size: 10px; letter-spacing: 0.08em; color: var(--muted); margin-top: var(--space-4); margin-bottom: var(--space-2); }
.condition-grid  { display: flex; flex-direction: column; gap: var(--space-2); }
.condition-btn {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4); background: var(--card);
  border: 1.5px solid var(--border); border-radius: var(--radius-lg);
  cursor: pointer; transition: var(--transition); text-align: left; color: var(--text);
  font-size: var(--text-sm); font-weight: 500;
}
.condition-btn.selected { border-color: var(--accent); background: var(--accent-dim); font-weight: 700; }
.condition-btn span:first-child { font-size: 18px; }

.condition-alert {
  display: flex; align-items: flex-start; gap: var(--space-2);
  background: var(--accent-dim); border: 1px solid var(--accent);
  border-radius: var(--radius-lg); padding: var(--space-3) var(--space-4);
  font-size: var(--text-xs); color: var(--accent); line-height: var(--leading-relaxed);
  margin-top: var(--space-4);
}
.condition-alert svg { flex-shrink: 0; margin-top: 1px; }

/* ── Disponibilidad ─────────────────────────────────────── */
.days-row { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); }
.days-btn {
  display: flex; flex-direction: column; align-items: center;
  gap: 2px; padding: var(--space-3) var(--space-4);
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-lg); cursor: pointer; transition: var(--transition);
  font-size: var(--text-xl); font-weight: 800; font-family: var(--font-mono); color: var(--text);
  flex: 1;
}
.days-btn.selected { border-color: var(--accent); background: var(--accent-dim); color: var(--accent); }
.days-btn-sub { font-size: 10px; font-family: var(--font-ui); font-weight: 600; color: var(--muted); }
.days-btn.selected .days-btn-sub { color: var(--accent); }

.duration-row { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-4); }
.duration-btn {
  padding: var(--space-2) var(--space-3); background: var(--card);
  border: 1.5px solid var(--border); border-radius: var(--radius-lg);
  font-size: var(--text-sm); font-weight: 700; cursor: pointer;
  transition: var(--transition); font-family: var(--font-mono); color: var(--text);
}
.duration-btn.selected { border-color: var(--accent); background: var(--accent-dim); color: var(--accent); }

.style-pref-list { display: flex; flex-direction: column; gap: var(--space-2); }
.style-pref-card {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4); background: var(--card);
  border: 1.5px solid var(--border); border-radius: var(--radius-md);
  cursor: pointer; transition: var(--transition); text-align: left; color: var(--text);
}
.style-pref-card.selected { border-color: var(--accent); background: var(--accent-dim); }
.sp-icon  { font-size: 20px; flex-shrink: 0; }
.sp-name  { font-size: var(--text-sm); font-weight: 700; }
.sp-desc  { font-size: var(--text-xs); color: var(--muted); margin-top: 1px; }
.sp-check { margin-left: auto; color: var(--accent); font-weight: 800; }

/* ── Asignación de días ─────────────────────────────────── */
.day-mode-tabs {
  display: flex; gap: var(--space-2); margin-bottom: var(--space-4);
  background: var(--faint); border-radius: var(--radius-lg); padding: 4px;
}
.day-mode-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: transparent; border: none; border-radius: calc(var(--radius-lg) - 4px);
  font-size: var(--text-sm); font-weight: 600; cursor: pointer;
  transition: var(--transition); color: var(--muted);
}
.day-mode-tab.active {
  background: var(--card); color: var(--accent);
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
}

.auto-days-strip {
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: var(--space-2); margin-bottom: var(--space-4);
}
.auto-day-chip {
  padding: var(--space-2) var(--space-1); border-radius: var(--radius-md);
  border: 1.5px solid var(--border); background: var(--card);
  font-size: 11px; font-weight: 700; text-align: center;
  color: var(--muted); opacity: 0.4; transition: var(--transition);
}
.auto-day-chip.selected {
  border-color: var(--accent); background: var(--accent-dim);
  color: var(--accent); opacity: 1;
}

.science-toggle {
  display: flex; align-items: center; gap: var(--space-2);
  background: none; border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: var(--space-2) var(--space-4);
  font-size: var(--text-xs); font-weight: 600; color: var(--muted);
  cursor: pointer; transition: var(--transition); margin-bottom: var(--space-3);
}
.science-toggle:hover { border-color: var(--accent); color: var(--accent); }

.science-panel {
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-lg); padding: var(--space-4);
  margin-bottom: var(--space-3);
}
.science-text {
  font-size: var(--text-sm); color: var(--text);
  line-height: var(--leading-relaxed); margin-bottom: var(--space-4);
}
.sources-title { color: var(--accent); margin-bottom: var(--space-2); }
.sources-list  { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-3); }
.source-item   { display: flex; flex-direction: column; gap: 2px; }
.source-ref    { font-size: var(--text-xs); font-weight: 800; color: var(--text); }
.source-detail { font-size: var(--text-xs); color: var(--muted); line-height: var(--leading-relaxed); }

.day-picker {
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: var(--space-2); margin-bottom: var(--space-2);
}
.day-pill {
  display: flex; flex-direction: column; align-items: center;
  gap: 2px; padding: var(--space-3) var(--space-1);
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-md); cursor: pointer;
  transition: var(--transition); color: var(--muted);
}
.day-pill.selected { border-color: var(--accent); background: var(--accent-dim); color: var(--accent); }
.day-pill-short { font-size: 11px; font-weight: 800; text-transform: uppercase; }
.day-pill-check { font-size: 10px; font-weight: 700; }
.days-count-label { font-size: var(--text-xs); color: var(--muted); text-align: center; }

/* ── Preview ────────────────────────────────────────────── */
.medida-preview { display: flex; flex-direction: column; gap: var(--space-5); }
.preview-header { text-align: center; }
.preview-icon   { font-size: 52px; margin-bottom: var(--space-2); }
.preview-title  { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 800; }
.preview-sub    { color: var(--muted); margin-top: var(--space-1); }
.start-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: var(--space-2);
}

/* ── Week strip ─────────────────────────────────────────── */
.week-strip {
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: var(--space-2);
}
.week-day-card {
  border-radius: var(--radius-md); border: 1.5px solid var(--border);
  background: var(--card); padding: var(--space-2) var(--space-1);
  display: flex; flex-direction: column; align-items: center;
  gap: var(--space-1); min-height: 80px; transition: var(--transition);
}
.week-day-card.today  { border-color: var(--accent); background: var(--accent-dim); }
.week-day-card.rest   { opacity: 0.45; }
.wd-label       { font-size: var(--text-xs); font-weight: 700; text-transform: uppercase; color: var(--muted); letter-spacing: 0.06em; }
.week-day-card.today .wd-label { color: var(--accent); }
.wd-body        { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.wd-session-label { font-size: 9px; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: 0.08em; }
.wd-rest        { font-size: var(--text-sm); color: var(--faint); }
.wd-name        { font-size: 9px; color: var(--muted); text-align: center; line-height: 1.3; }
.wd-count       { font-size: 8px; color: var(--muted); font-family: var(--font-mono); }

/* ── Nav ────────────────────────────────────────────────── */
.wizard-nav {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: var(--space-6); gap: var(--space-3);
}
.nav-spacer { flex: 1; }
.wizard-nav .btn { flex: 1; }
.generate-btn { display: flex; align-items: center; justify-content: center; gap: var(--space-2); }

.spinner-sm {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.8s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Transitions ────────────────────────────────────────── */
.science-enter-active,
.science-leave-active { transition: opacity 0.2s, transform 0.2s; }
.science-enter-from,
.science-leave-to     { opacity: 0; transform: translateY(-8px); }
</style>
