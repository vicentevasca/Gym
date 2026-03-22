<script setup>
import { ref, computed } from 'vue'
import PRBadge from '@/components/ui/PRBadge.vue'
import { pressBtn } from '@/composables/useAnimations'
import { useTrainingStore } from '@/stores/training.store'

const props = defineProps({
  exercise:      { type: Object, required: true },
  exerciseIndex: { type: Number, required: true },
  isActive:      { type: Boolean, default: false },
})
const emit = defineEmits(['serie-complete', 'request-rest'])

const training    = useTrainingStore()
const localSets   = ref(props.exercise.sets.map(s => ({ ...s })))
const btnRefs     = ref([])

const allDone     = computed(() => localSets.value.every(s => s.completed))
const showPR      = computed(() =>
  training.newRecord?.exerciseId === props.exercise.exercise_id
)

async function handleCheck(setIndex) {
  const s = localSets.value[setIndex]
  if (s.completed) return
  pressBtn(btnRefs.value[setIndex])
  await training.completeSerie(props.exerciseIndex, setIndex, s.weight_kg, s.reps)
  localSets.value[setIndex] = { ...localSets.value[setIndex], completed: true }
  emit('serie-complete', { setIndex, weight: s.weight_kg, reps: s.reps })
  // Pedir descanso excepto si es la última serie del último ejercicio
  if (!allDone.value) emit('request-rest')
}
</script>

<template>
  <div class="exercise-card" :class="{ active: isActive }">
    <!-- Header -->
    <div class="ex-header">
      <div>
        <h3 class="ex-name">{{ exercise.name }}</h3>
        <p class="ex-muscle label-caps">{{ exercise.muscle_group }}</p>
      </div>
      <PRBadge v-if="showPR" :exercise="exercise.name" />
    </div>

    <!-- Tip -->
    <div class="ex-tip">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
      <span>{{ exercise.tip }}</span>
    </div>

    <!-- Series -->
    <div class="series-table">
      <div class="series-header">
        <span>Serie</span>
        <span>Peso (kg)</span>
        <span>Reps</span>
        <span></span>
      </div>

      <div
        v-for="(s, i) in localSets"
        :key="i"
        class="series-row"
        :class="{ done: s.completed }"
      >
        <span class="set-num">{{ s.set }}</span>

        <input
          v-model.number="localSets[i].weight_kg"
          type="number"
          inputmode="decimal"
          step="0.5"
          class="set-input"
          :disabled="s.completed"
        />

        <input
          v-model.number="localSets[i].reps"
          type="number"
          inputmode="numeric"
          class="set-input"
          :disabled="s.completed"
        />

        <button
          :ref="el => btnRefs[i] = el"
          class="check-btn"
          :class="{ checked: s.completed }"
          :disabled="s.completed"
          @click="handleCheck(i)"
        >
          <svg v-if="s.completed" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span v-else class="check-empty" />
        </button>
      </div>
    </div>

    <!-- Progreso visual -->
    <div class="ex-progress">
      <div class="ex-progress-fill" :style="{ width: (localSets.filter(s=>s.completed).length / localSets.length * 100) + '%' }" />
    </div>
  </div>
</template>

<style scoped>
.exercise-card {
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  transition: var(--transition);
}
.exercise-card.active { border-color: var(--accent); }

.ex-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--space-3); }
.ex-name { font-size: var(--text-md); font-weight: 700; }
.ex-muscle { color: var(--accent); margin-top: 2px; }

.ex-tip {
  display: flex; align-items: flex-start; gap: var(--space-2);
  background: var(--faint-2); border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  color: var(--muted); font-size: var(--text-sm); line-height: 1.5;
  margin-bottom: var(--space-4);
}
.ex-tip svg { flex-shrink: 0; margin-top: 1px; color: var(--accent); }

.series-table { display: flex; flex-direction: column; gap: var(--space-2); }
.series-header {
  display: grid; grid-template-columns: 30px 1fr 1fr 44px;
  padding: 0 var(--space-1);
  font-size: var(--text-xs); font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--muted);
}
.series-row {
  display: grid; grid-template-columns: 30px 1fr 1fr 44px;
  align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-1);
  border-radius: var(--radius-sm);
  transition: background 0.2s;
}
.series-row.done { background: var(--success-dim); }
.set-num { font-size: var(--text-sm); font-weight: 600; color: var(--muted); }
.set-input {
  height: 42px; background: var(--surface); border: 1.5px solid var(--border);
  border-radius: var(--radius-sm); text-align: center;
  font-size: var(--text-base); font-weight: 700; color: var(--text);
  transition: var(--transition);
}
.set-input:focus { border-color: var(--border-focus); }
.set-input:disabled { opacity: 0.5; }
.check-btn {
  width: 42px; height: 42px; border-radius: 50%;
  border: 2px solid var(--border-hi);
  background: transparent;
  display: flex; align-items: center; justify-content: center;
  transition: var(--transition);
}
.check-btn.checked { background: var(--success); border-color: var(--success); color: #fff; }
.check-btn:not(.checked):not(:disabled):hover { border-color: var(--accent); background: var(--accent-dim); }
.check-empty { width: 8px; height: 8px; border-radius: 50%; background: var(--muted); display: block; }

.ex-progress { height: 3px; background: var(--faint); border-radius: 2px; margin-top: var(--space-4); overflow: hidden; }
.ex-progress-fill { height: 100%; background: var(--gradient-accent); border-radius: 2px; transition: width 0.4s ease; }
</style>
