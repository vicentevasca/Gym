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
const emit = defineEmits(['serie-complete', 'request-rest', 'start-timer'])

const training  = useTrainingStore()
const localSets = ref(props.exercise.sets.map(s => ({ ...s })))
const btnRefs   = ref([])

// ── Tipo de ejercicio ────────────────────────────────────────────
const isTimeBased = computed(() => {
  const t = props.exercise.exercise_type
  return t === 'duration' || t === 'hold' || t === 'breathing'
})

// ── Estado ──────────────────────────────────────────────────────
const allDone = computed(() => localSets.value.every(s => s.completed))

const nextSetIndex = computed(() => localSets.value.findIndex(s => !s.completed))

const showPR = computed(() =>
  training.newRecord?.exerciseId === props.exercise.exercise_id
)

// ── Dificultad ──────────────────────────────────────────────────
const difficultyColor = computed(() => {
  const map = { principiante: '#22c55e', intermedio: '#f59e0b', avanzado: '#ef4444' }
  return map[props.exercise.difficulty] || 'var(--muted)'
})

const difficultyLabel = computed(() => {
  const map = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' }
  return map[props.exercise.difficulty] || props.exercise.difficulty || ''
})

// ── Completar serie (interno — llamado desde TrainingView via expose) ──
async function _doComplete(setIndex, weight, reps) {
  if (localSets.value[setIndex]?.completed) return
  await training.completeSerie(props.exerciseIndex, setIndex, weight, reps)
  localSets.value[setIndex] = { ...localSets.value[setIndex], completed: true }
  emit('serie-complete', { setIndex, weight, reps })
}

// ── Check manual (tap directo en el botón ✓) ────────────────────
async function handleCheck(setIndex) {
  const s = localSets.value[setIndex]
  if (s.completed) return
  pressBtn(btnRefs.value[setIndex])
  await _doComplete(setIndex, s.weight_kg, s.reps)
  if (!allDone.value) emit('request-rest')
}

// ── Iniciar serie (abre WorkoutTimer) ───────────────────────────
function handleIniciar() {
  const idx = nextSetIndex.value
  if (idx === -1) return
  emit('start-timer', {
    exerciseIndex: props.exerciseIndex,
    setIndex:      idx,
    exercise:      props.exercise,
  })
}

// ── Expuesto para que TrainingView pueda marcar serie completa ───
async function completeSet(setIndex) {
  const s = localSets.value[setIndex]
  if (!s || s.completed) return
  await _doComplete(setIndex, s.weight_kg, s.reps || 0)
}

defineExpose({ completeSet })
</script>

<template>
  <div class="exercise-card" :class="{ active: isActive }">

    <!-- Header -->
    <div class="ex-header">
      <div class="ex-title-block">
        <h3 class="ex-name">{{ exercise.name }}</h3>
        <p class="ex-muscle label-caps">{{ exercise.muscle_group }}</p>
      </div>
      <div class="ex-badges">
        <PRBadge v-if="showPR" :exercise="exercise.name" />
        <span class="pts-badge">+{{ exercise.pts_per_set || 5 }} pts/serie</span>
      </div>
    </div>

    <!-- Dificultad -->
    <div v-if="difficultyLabel" class="difficulty-row">
      <span class="diff-dot" :style="{ background: difficultyColor }" />
      <span class="diff-label" :style="{ color: difficultyColor }">{{ difficultyLabel }}</span>
      <span v-if="exercise.exercise_type !== 'reps'" class="type-tag">
        {{ exercise.exercise_type === 'breathing' ? 'respiración' : exercise.exercise_type }}
      </span>
    </div>

    <!-- Tip -->
    <div class="ex-tip">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
      <span>{{ exercise.cue || exercise.tip }}</span>
    </div>

    <!-- ── Series por REPS ── -->
    <template v-if="!isTimeBased">
      <div class="series-table">
        <div class="series-header">
          <span>#</span>
          <span>Kg</span>
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
            type="number" inputmode="decimal" step="0.5"
            class="set-input"
            :disabled="s.completed"
          />
          <input
            v-model.number="localSets[i].reps"
            type="number" inputmode="numeric"
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

      <!-- Iniciar botón (reps) -->
      <button v-if="!allDone" class="iniciar-btn" @click="handleIniciar">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Iniciar serie {{ nextSetIndex + 1 }}
      </button>
    </template>

    <!-- ── Series de TIEMPO / HOLD / BREATHING ── -->
    <template v-else>
      <div class="timed-sets">
        <div
          v-for="(s, i) in localSets"
          :key="i"
          class="timed-row"
          :class="{ done: s.completed }"
        >
          <span class="set-num">{{ s.set }}</span>
          <div class="timed-dur">
            <input
              v-model.number="localSets[i].duration_sec"
              type="number" inputmode="numeric"
              class="set-input dur-input"
              :disabled="s.completed"
              :placeholder="exercise.default_duration_sec"
            />
            <span class="dur-unit">seg</span>
          </div>
          <span v-if="s.completed" class="done-check">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
        </div>
      </div>

      <!-- Iniciar botón (timed) -->
      <button v-if="!allDone" class="iniciar-btn" @click="handleIniciar">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Iniciar serie {{ nextSetIndex + 1 }}
      </button>
    </template>

    <!-- Progreso -->
    <div class="ex-progress">
      <div class="ex-progress-fill" :style="{ width: (localSets.length ? (localSets.filter(s=>s.completed).length / localSets.length * 100) : 0) + '%' }" />
    </div>

    <!-- Regression / Progression -->
    <div v-if="exercise.regression || exercise.progression" class="ex-links">
      <span v-if="exercise.regression" class="ex-link-item">
        <span class="ex-link-label">Más fácil:</span>
        <span class="ex-link-id">{{ exercise.regression }}</span>
      </span>
      <span v-if="exercise.progression" class="ex-link-item">
        <span class="ex-link-label">Más difícil:</span>
        <span class="ex-link-id">{{ exercise.progression }}</span>
      </span>
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

/* ── Header ─────────────────────────────────────────── */
.ex-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: var(--space-2);
}
.ex-title-block { flex: 1; min-width: 0; }
.ex-name {
  font-family: var(--font-display);
  font-size: var(--text-md); font-weight: 700;
  letter-spacing: var(--tracking-snug); line-height: var(--leading-snug);
}
.ex-muscle {
  color: var(--accent); font-size: var(--text-xs); font-weight: 700;
  letter-spacing: var(--tracking-caps); text-transform: uppercase; margin-top: 3px;
}
.ex-badges {
  display: flex; flex-direction: column; align-items: flex-end;
  gap: var(--space-1); margin-left: var(--space-2); flex-shrink: 0;
}
.pts-badge {
  background: var(--accent-dim); color: var(--accent);
  border-radius: var(--radius-full); padding: 2px 8px;
  font-size: var(--text-xs); font-weight: 700; font-family: var(--font-mono);
  white-space: nowrap;
}

/* ── Difficulty ─────────────────────────────────────── */
.difficulty-row {
  display: flex; align-items: center; gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.diff-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.diff-label { font-size: var(--text-xs); font-weight: 700; letter-spacing: 0.04em; }
.type-tag {
  margin-left: auto; background: var(--faint); color: var(--muted);
  border-radius: var(--radius-full); padding: 1px 8px;
  font-size: 10px; font-weight: 700; text-transform: capitalize;
}

/* ── Tip ────────────────────────────────────────────── */
.ex-tip {
  display: flex; align-items: flex-start; gap: var(--space-2);
  background: var(--faint-2); border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  color: var(--muted); font-size: var(--text-sm); line-height: 1.5;
  margin-bottom: var(--space-4);
}
.ex-tip svg { flex-shrink: 0; margin-top: 1px; color: var(--accent); }

/* ── Reps table ─────────────────────────────────────── */
.series-table { display: flex; flex-direction: column; gap: var(--space-2); }
.series-header {
  display: grid; grid-template-columns: 28px 1fr 1fr 44px;
  padding: 0 var(--space-1);
  font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--muted);
  gap: var(--space-2);
}
.series-row {
  display: grid; grid-template-columns: 28px 1fr 1fr 44px;
  align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-1);
  border-radius: var(--radius-sm); transition: background 0.2s;
}
.series-row.done { background: var(--success-dim); }
.set-num { font-size: var(--text-sm); font-weight: 600; color: var(--muted); }
.set-input {
  height: 40px; min-width: 0; width: 100%;
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: var(--radius-sm); text-align: center;
  font-family: var(--font-mono); font-size: var(--text-base); font-weight: 700;
  color: var(--text); transition: var(--transition);
}
.set-input:focus { border-color: var(--border-focus); outline: none; }
.set-input:disabled { opacity: 0.5; }
/* Hide number spinners on mobile */
.set-input::-webkit-outer-spin-button,
.set-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.set-input[type="number"] { -moz-appearance: textfield; }
.check-btn {
  width: 44px; height: 40px; border-radius: var(--radius-sm);
  border: 2px solid var(--border-hi);
  background: transparent;
  display: flex; align-items: center; justify-content: center;
  transition: var(--transition); flex-shrink: 0;
}
.check-btn.checked { background: var(--success); border-color: var(--success); color: #fff; }
.check-btn:not(.checked):not(:disabled):hover { border-color: var(--accent); background: var(--accent-dim); }
.check-empty { width: 8px; height: 8px; border-radius: 50%; background: var(--muted); display: block; }

/* ── Iniciar button ─────────────────────────────────── */
.iniciar-btn {
  display: flex; align-items: center; justify-content: center;
  gap: var(--space-2); width: 100%;
  margin-top: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--accent-dim); color: var(--accent);
  border: 1.5px solid var(--accent);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm); font-weight: 700;
  cursor: pointer; transition: var(--transition);
}
.iniciar-btn:hover { background: var(--accent); color: #fff; }
.iniciar-btn:active { transform: scale(0.98); }

/* ── Timed sets ─────────────────────────────────────── */
.timed-sets { display: flex; flex-direction: column; gap: var(--space-2); }
.timed-row {
  display: grid; grid-template-columns: 28px 1fr auto;
  align-items: center; gap: var(--space-3);
  padding: var(--space-2) var(--space-1);
  border-radius: var(--radius-sm); transition: background 0.2s;
}
.timed-row.done { background: var(--success-dim); }
.timed-dur { display: flex; align-items: center; gap: 4px; }
.dur-input  { max-width: 72px; height: 38px; font-size: var(--text-sm); }
.dur-unit   { font-size: var(--text-xs); color: var(--muted); white-space: nowrap; }
.done-check { color: var(--success); display: flex; align-items: center; }

/* ── Progress bar ───────────────────────────────────── */
.ex-progress {
  height: 3px; background: var(--faint); border-radius: 2px;
  margin-top: var(--space-4); overflow: hidden;
}
.ex-progress-fill {
  height: 100%; background: var(--gradient-accent); border-radius: 2px;
  transition: width 0.4s ease;
}

/* ── Links ──────────────────────────────────────────── */
.ex-links {
  display: flex; gap: var(--space-4); margin-top: var(--space-3);
  padding-top: var(--space-3); border-top: 1px solid var(--faint);
}
.ex-link-item { display: flex; gap: 4px; font-size: var(--text-xs); align-items: center; }
.ex-link-label { color: var(--muted); }
.ex-link-id { color: var(--accent); font-weight: 600; font-family: var(--font-mono); font-size: 10px; }
</style>
