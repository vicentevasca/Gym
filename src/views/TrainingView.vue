<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTrainingStore } from '@/stores/training.store'
import { usePointsStore }   from '@/stores/points.store'
import { staggerIn }        from '@/composables/useAnimations'
import AppHeader            from '@/components/ui/AppHeader.vue'
import BottomNav            from '@/components/ui/BottomNav.vue'
import ExerciseCard         from '@/components/training/ExerciseCard.vue'
import RestTimer            from '@/components/training/RestTimer.vue'
import WarmupBlock          from '@/components/training/WarmupBlock.vue'
import SessionComplete      from '@/components/training/SessionComplete.vue'

const training = useTrainingStore()
const points   = usePointsStore()

const resting           = ref(false)
const restSeconds       = ref(90)
const showComplete      = ref(false)
const activeExerciseIdx = ref(0)

onMounted(async () => {
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

function onRequestRest() {
  resting.value     = true
  restSeconds.value = 90
}
function onRestDone() { resting.value = false }

async function finishSession() {
  await training.completeSession()
  showComplete.value = true
}
</script>

<template>
  <div>
    <AppHeader title="GYM" />
    <main class="page-content page-pad">

      <!-- Loading -->
      <div v-if="training.loading" class="loading-state">
        <div class="spinner" />
        <p>Cargando sesión…</p>
      </div>

      <!-- No session today -->
      <div v-else-if="!session" class="empty-state">
        <div class="empty-icon">🎉</div>
        <h3>¡Descanso merecido!</h3>
        <p>No tienes entrenamiento programado hoy.<br>Aprovecha para recuperar.</p>
      </div>

      <!-- Active session -->
      <template v-else>
        <!-- Header -->
        <div class="session-header">
          <div>
            <p class="label-caps session-day">{{ session.dayName }}</p>
            <h2 class="session-name">{{ session.name }}</h2>
          </div>
          <div class="progress-chip">{{ progress }}%</div>
        </div>

        <!-- Global progress bar -->
        <div class="global-progress mb-5">
          <div class="global-fill" :style="{ width: progress + '%' }" />
        </div>

        <!-- Warmup -->
        <WarmupBlock :warmup="warmupItems" class="mb-5" />

        <!-- Exercise cards -->
        <div class="exercises-list">
          <ExerciseCard
            v-for="(ex, i) in session.exercises"
            :key="ex.exercise_id"
            :exercise="ex"
            :exercise-index="i"
            :is-active="i === activeExerciseIdx"
            @serie-complete="activeExerciseIdx = i"
            @request-rest="onRequestRest"
          />
        </div>

        <!-- Finish CTA -->
        <div v-if="progress === 100" class="finish-block">
          <button class="btn btn-primary finish-btn" @click="finishSession">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Finalizar sesión
          </button>
        </div>
      </template>
    </main>
    <BottomNav />

    <!-- Rest timer overlay -->
    <RestTimer
      v-if="resting"
      :seconds="restSeconds"
      @complete="onRestDone"
      @skip="onRestDone"
    />

    <!-- Session complete modal -->
    <SessionComplete
      v-if="showComplete"
      :session="session"
      :suggestions="suggestions"
      @close="showComplete = false"
    />
  </div>
</template>

<style scoped>
.page-pad { padding: var(--space-5) var(--space-4) var(--space-12); }

.loading-state, .empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 50vh; gap: var(--space-4); text-align: center; color: var(--muted);
}
.empty-icon { font-size: 48px; }
.empty-state h3 { font-size: var(--text-lg); font-weight: 700; color: var(--text); }
.empty-state p  { font-size: var(--text-sm); line-height: 1.6; }

.session-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: var(--space-3);
}
.session-day  { color: var(--accent); }
.session-name { font-size: var(--text-xl); font-weight: 800; margin-top: var(--space-1); }
.progress-chip {
  background: var(--accent-dim); color: var(--accent);
  border-radius: var(--radius-full); padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm); font-weight: 700; font-family: var(--font-mono);
  flex-shrink: 0; margin-top: 4px;
}

.global-progress {
  height: 4px; background: var(--faint); border-radius: 2px; overflow: hidden;
}
.global-fill {
  height: 100%; background: var(--gradient-accent); border-radius: 2px;
  transition: width 0.5s ease;
}
.mb-5 { margin-bottom: var(--space-5); }

.exercises-list { display: flex; flex-direction: column; gap: var(--space-4); }

.finish-block { margin-top: var(--space-6); }
.finish-btn {
  width: 100%; display: flex; align-items: center; justify-content: center;
  gap: var(--space-2);
}
</style>
