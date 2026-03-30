<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTrainingStore } from '@/stores/training.store'
import { usePointsStore }   from '@/stores/points.store'
import { staggerIn }        from '@/composables/useAnimations'
import AppHeader            from '@/components/ui/AppHeader.vue'
import BottomNav            from '@/components/ui/BottomNav.vue'
import ExerciseCard         from '@/components/training/ExerciseCard.vue'
import RestTimer            from '@/components/training/RestTimer.vue'
import WorkoutTimer        from '@/components/training/WorkoutTimer.vue'
import WarmupBlock          from '@/components/training/WarmupBlock.vue'
import SessionComplete      from '@/components/training/SessionComplete.vue'
import RoutineDetailSheet   from '@/components/training/RoutineDetailSheet.vue'

const router   = useRouter()
const training = useTrainingStore()
const points   = usePointsStore()

const resting            = ref(false)
const restSeconds        = ref(90)
const showComplete       = ref(false)
const showRoutineSheet   = ref(false)
const activeExerciseIdx  = ref(0)

// ── WorkoutTimer state ──────────────────────────────────────────
const exerciseCardRefs = ref([])
const activeTimer      = ref(null)   // { exerciseIndex, setIndex, exercise }

function onStartTimer({ exerciseIndex, setIndex, exercise }) {
  activeTimer.value = { exerciseIndex, setIndex, exercise }
}

async function onTimerSetDone() {
  if (!activeTimer.value) return
  const { exerciseIndex, setIndex } = activeTimer.value
  const card = exerciseCardRefs.value[exerciseIndex]
  if (card) await card.completeSet(setIndex)
  activeExerciseIdx.value = exerciseIndex
}

function onTimerRestDone() {
  // rest handled by WorkoutTimer itself; nothing extra needed
}

function onTimerClose() {
  activeTimer.value = null
}

onMounted(async () => {
  await training.loadRoutine()
  await training.loadTodaySession()
  staggerIn('.exercise-card', { delay: 0.2 })
  points.subscribe()
})

const session     = computed(() => training.todaySession)
const suggestions = computed(() => training.progressionSuggestions)

const progress = computed(() => {
  if (!session.value?.exercises?.length) return 0
  const total     = session.value.exercises.reduce((a, e) => a + e.sets.length, 0)
  const completed = session.value.exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0)
  return total ? Math.round((completed / total) * 100) : 0
})

const warmupItems = [
  { name: 'Movilidad articular', detail: '5 min — hombros, caderas, muñecas' },
  { name: 'Cardio suave', detail: '3 min — bici estática o saltos suaves' },
  { name: 'Activación muscular', detail: '2 series ligeras del primer ejercicio' },
]

function onRequestRest(restSec) {
  resting.value     = true
  restSeconds.value = restSec
    ?? session.value?.exercises?.[activeExerciseIdx.value]?.rest_sec
    ?? 90
}
function onRestDone() { resting.value = false }

// Arranca el descanso automáticamente al completar una serie
// (solo si no hay timer de ejercicio activo y el ejercicio tiene rest_sec)
function onSerieComplete(exerciseIndex) {
  activeExerciseIdx.value = exerciseIndex
  if (activeTimer.value) return   // timer de ejercicio tiene su propio descanso
  const ex      = session.value?.exercises?.[exerciseIndex]
  const restSec = ex?.rest_sec ?? 0
  if (restSec >= 10) {
    resting.value     = true
    restSeconds.value = restSec
  }
}

async function finishSession() {
  await training.completeSession()
  showComplete.value = true
}

// ── Routine overview card ────────────────────────────────────────

const routineStyleLabel = computed(() => {
  const map = {
    hipertrofia: 'Hipertrofia', fuerza: 'Fuerza', calistenia: 'Calistenia',
    yoga: 'Yoga', pilates: 'Pilates', cardio: 'Cardio',
    hiit: 'HIIT', híbrido: 'Híbrido', terapéutico: 'Terapéutico',
  }
  return map[training.routine?.style] || training.routine?.style || ''
})

const routineStyleIcon = computed(() => {
  const map = {
    hipertrofia: '💪', fuerza: '🏋️', calistenia: '🤸', yoga: '🧘',
    pilates: '🩺', cardio: '🏃', hiit: '⚡', híbrido: '🔀', terapéutico: '🩹',
  }
  return map[training.routine?.style] || '📋'
})

// Week strip for the overview card (compact)
const DAY_INITIALS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
const todayIdx = new Date().getDay()

const weekSummary = computed(() => {
  if (!training.routine?.weekly_plan) return []
  return training.routine.weekly_plan.map((day, i) => ({
    letter:  DAY_INITIALS[i],
    isToday: i === todayIdx,
    active:  !!day,
    label:   day?.label || null,
  }))
})
</script>

<template>
  <div>
    <AppHeader title="GYM" />

    <!-- Botón flotante de configuración -->
    <button type="button" class="setup-fab" @click="router.push('/training/setup')" title="Configurar rutina">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 9 15a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 12 9c.4 0 .78.17 1.06.45"/></svg>
    </button>

    <main class="page-content page-pad">

      <!-- ══ LOADING ══════════════════════════════════════════ -->
      <div v-if="training.loading" class="loading-state">
        <div class="spinner" />
        <p>Cargando sesión…</p>
      </div>

      <template v-else>

        <!-- ══ SECCIÓN A: SESIÓN DE HOY ═════════════════════════ -->
        <section class="section-today">

          <!-- No session today -->
          <div v-if="!session" class="today-empty">
            <div class="today-empty-inner">
              <p class="today-label label-caps">Hoy</p>
              <div class="rest-icon">🎉</div>
              <h3 class="rest-title">¡Descanso merecido!</h3>
              <p class="rest-sub">No tienes entrenamiento programado.<br>Aprovecha para recuperar.</p>
            </div>
          </div>

          <!-- Active session -->
          <template v-else>

            <!-- Session header -->
            <div class="session-header">
              <div>
                <p class="label-caps session-day">{{ session.dayName }} · Hoy</p>
                <h2 class="session-name">{{ session.name }}</h2>
              </div>
              <div class="progress-chip">{{ progress }}%</div>
            </div>

            <!-- Global progress bar -->
            <div class="global-progress">
              <div class="global-fill" :style="{ width: progress + '%' }" />
            </div>

            <!-- Warmup -->
            <WarmupBlock :warmup="warmupItems" class="mt-4" />

            <!-- Exercise cards -->
            <div class="exercises-list">
              <ExerciseCard
                v-for="(ex, i) in session.exercises"
                :key="ex.exercise_id"
                :ref="el => exerciseCardRefs[i] = el"
                :exercise="ex"
                :exercise-index="i"
                :is-active="i === activeExerciseIdx"
                @serie-complete="onSerieComplete(i)"
                @request-rest="onRequestRest"
                @start-timer="onStartTimer"
              />
            </div>

            <!-- Finish CTA -->
            <div v-if="progress === 100" class="finish-block">
              <button type="button" class="btn btn-primary finish-btn" @click="finishSession">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                Finalizar sesión
              </button>
            </div>
          </template>
        </section>

        <!-- ══ SECCIÓN B: RUTINA GENERAL ════════════════════════ -->
        <section class="section-routine">
          <p class="section-title label-caps">Mi rutina</p>

          <!-- No routine yet -->
          <div v-if="!training.routine" class="setup-cta card" @click="router.push('/training/setup')">
            <span class="setup-cta-icon">⚙️</span>
            <div class="setup-cta-text">
              <p class="setup-cta-title">Configura tu rutina</p>
              <p class="setup-cta-sub">Genera o crea tu plan personalizado</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>

          <!-- Routine overview card -->
          <div v-else class="routine-card card" @click="showRoutineSheet = true">
            <div class="routine-card-header">
              <span class="routine-icon">{{ routineStyleIcon }}</span>
              <div class="routine-card-info">
                <p class="routine-card-name">{{ training.routine.name || 'Mi Rutina' }}</p>
                <p class="routine-card-sub">{{ routineStyleLabel }} · {{ training.routine.days_per_week || training.routine.training_days || '?' }} días/sem</p>
              </div>
              <svg class="routine-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>

            <!-- Mini week strip -->
            <div class="mini-week">
              <div
                v-for="(d, i) in weekSummary"
                :key="i"
                class="mini-day"
                :class="{ active: d.active, today: d.isToday }"
              >
                <span class="mini-letter">{{ d.letter }}</span>
                <span class="mini-dot" />
              </div>
            </div>

            <p class="routine-card-tap">Toca para ver todos los días →</p>
          </div>

          <!-- Nueva rutina button -->
          <button
            type="button"
            class="btn-new-routine"
            @click="router.push('/training/setup')"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Crear nueva rutina
          </button>
        </section>

      </template>
    </main>

    <BottomNav />

    <!-- Rest timer overlay -->
    <Transition name="overlay">
      <RestTimer
        v-if="resting && !activeTimer"
        :seconds="restSeconds"
        @complete="onRestDone"
        @skip="onRestDone"
      />
    </Transition>

    <!-- Workout timer (active set + rest) -->
    <Transition name="overlay">
      <WorkoutTimer
        v-if="activeTimer"
        :exercise="activeTimer.exercise"
        :set-index="activeTimer.setIndex"
        :total-sets="activeTimer.exercise.sets.length"
        @set-done="onTimerSetDone"
        @rest-done="onTimerRestDone"
        @close="onTimerClose"
      />
    </Transition>

    <!-- Session complete -->
    <Transition name="sheet">
      <SessionComplete
        v-if="showComplete"
        :session="session"
        :suggestions="suggestions"
        @close="showComplete = false"
      />
    </Transition>

    <!-- Routine detail sheet -->
    <Transition name="sheet">
      <RoutineDetailSheet
        v-if="showRoutineSheet && training.routine"
        :routine="training.routine"
        @close="showRoutineSheet = false"
      />
    </Transition>
  </div>
</template>

<style scoped>
.page-pad { padding-left: var(--space-4); padding-right: var(--space-4); }

.loading-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 50vh; gap: var(--space-4); text-align: center; color: var(--muted);
}

/* ══ Setup FAB ══════════════════════════════════════════════════ */
.setup-fab {
  position: fixed;
  top: calc(var(--header-height) + var(--safe-top) + var(--space-2));
  right: var(--space-4);
  width: 36px; height: 36px;
  border-radius: var(--radius-full);
  background: var(--surface);
  border: 1.5px solid var(--border);
  color: var(--muted);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 95;
  transition: var(--transition);
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}
.setup-fab:hover { border-color: var(--accent); color: var(--accent); }

/* ══ Section A — Today ══════════════════════════════════════════ */
.section-today {
  margin-bottom: var(--space-6);
}

.today-empty {
  border: 1.5px dashed var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-7) var(--space-5);
  margin-bottom: var(--space-5);
}
.today-empty-inner {
  display: flex; flex-direction: column; align-items: center;
  gap: var(--space-2); text-align: center;
}
.today-label { color: var(--accent); margin-bottom: var(--space-1); }
.rest-icon { font-size: 40px; }
.rest-title { font-size: var(--text-lg); font-weight: 800; color: var(--text); }
.rest-sub { font-size: var(--text-sm); color: var(--muted); line-height: 1.6; }

/* Session header */
.session-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: var(--space-3);
}
.session-day { color: var(--accent); }
.session-name { font-size: var(--text-xl); font-weight: 800; margin-top: var(--space-1); }
.progress-chip {
  background: var(--accent-dim); color: var(--accent);
  border-radius: var(--radius-full); padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm); font-weight: 700; font-family: var(--font-mono);
  flex-shrink: 0; margin-top: 4px;
}

.global-progress {
  height: 4px; background: var(--faint); border-radius: 2px; overflow: hidden;
  margin-bottom: var(--space-4);
}
.global-fill {
  height: 100%; background: var(--gradient-accent); border-radius: 2px;
  transition: width 0.5s ease;
}
.mt-4 { margin-top: var(--space-4); }

.exercises-list { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-4); }

.finish-block { margin-top: var(--space-6); }
.finish-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: var(--space-2); }

/* ══ Section B — Routine ════════════════════════════════════════ */
.section-routine {}

.section-title {
  color: var(--muted); margin-bottom: var(--space-3);
}

/* Setup CTA */
.setup-cta {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-4); margin-bottom: var(--space-3);
  cursor: pointer; transition: var(--transition); color: var(--text);
}
.setup-cta:hover { border-color: var(--accent); }
.setup-cta-icon { font-size: 24px; flex-shrink: 0; }
.setup-cta-text { flex: 1; }
.setup-cta-title { font-weight: 700; font-size: var(--text-base); }
.setup-cta-sub { font-size: var(--text-sm); color: var(--muted); margin-top: 2px; }
.setup-cta svg { color: var(--muted); flex-shrink: 0; }

/* Routine overview card */
.routine-card {
  padding: var(--space-4); cursor: pointer; transition: var(--transition);
  margin-bottom: var(--space-3);
}
.routine-card:hover { border-color: var(--accent); }

.routine-card-header {
  display: flex; align-items: center; gap: var(--space-3);
  margin-bottom: var(--space-3);
}
.routine-icon { font-size: 28px; flex-shrink: 0; }
.routine-card-info { flex: 1; min-width: 0; }
.routine-card-name { font-weight: 800; font-size: var(--text-base); color: var(--text); }
.routine-card-sub { font-size: var(--text-xs); color: var(--muted); margin-top: 2px; }
.routine-card-arrow { color: var(--muted); flex-shrink: 0; }

/* Mini week strip */
.mini-week {
  display: flex; gap: var(--space-2); justify-content: space-between;
  margin-bottom: var(--space-3);
}
.mini-day {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
  opacity: 0.35;
}
.mini-day.active { opacity: 0.7; }
.mini-day.today  { opacity: 1; }
.mini-letter {
  font-size: 10px; font-weight: 800; text-transform: uppercase;
  color: var(--muted); letter-spacing: 0.05em;
}
.mini-day.today .mini-letter { color: var(--accent); }
.mini-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--border-hi);
}
.mini-day.active .mini-dot { background: var(--muted); }
.mini-day.today  .mini-dot { background: var(--accent); }

.routine-card-tap {
  font-size: var(--text-xs); color: var(--accent); font-weight: 600;
  text-align: right;
}

/* New routine button */
.btn-new-routine {
  width: 100%; display: flex; align-items: center; justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: transparent; border: 1.5px dashed var(--border);
  border-radius: var(--radius-lg); color: var(--muted);
  font-size: var(--text-sm); font-weight: 700;
  cursor: pointer; transition: var(--transition);
}
.btn-new-routine:hover { border-color: var(--accent); color: var(--accent); }
</style>
