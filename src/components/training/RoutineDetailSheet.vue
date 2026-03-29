<script setup>
import { ref, computed, onMounted } from 'vue'
import { gsap }                     from 'gsap'
import { useTrainingStore }         from '@/stores/training.store'
import { usePointsStore }           from '@/stores/points.store'
import ExerciseDetailModal          from './ExerciseDetailModal.vue'

const props = defineProps({
  routine: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const overlayEl = ref(null)
const sheetEl   = ref(null)

const training = useTrainingStore()
const points   = usePointsStore()

const expandedDay      = ref(null)
const selectedExercise = ref(null)
const completedExIds   = ref(new Set())  // local session state

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const todayIdx  = new Date().getDay()

const days = computed(() => {
  const plan = props.routine.weekly_plan || []
  return plan.map((day, i) => ({
    index:    i,
    name:     DAY_NAMES[i],
    isToday:  i === todayIdx,
    isRest:   !day,
    session:  day,
    label:    day?.label || (day ? 'Entrenamiento' : 'Descanso'),
    exercises: day?.exercises_def || [],
  }))
})

function toggleDay(idx) {
  expandedDay.value = expandedDay.value === idx ? null : idx
}

function showInfo(ex) {
  selectedExercise.value = ex
}

async function markComplete(ex) {
  const key = ex.exercise_id || ex.id
  if (completedExIds.value.has(key)) return

  completedExIds.value = new Set([...completedExIds.value, key])
  await points.earnExercise?.()
  navigator.vibrate?.(30)
}

function isCompleted(ex) {
  return completedExIds.value.has(ex.exercise_id || ex.id)
}

// Para el día de HOY: si hay sesión activa, usar sus ejercicios completos
function dayExercises(day) {
  if (day.isToday && training.todaySession?.exercises?.length) {
    return training.todaySession.exercises
  }
  return day.exercises
}

function exVolumeLabel(ex) {
  if (!ex) return ''
  const type = ex.exercise_type || 'reps'
  const sets = ex.sets?.length || ex.default_sets || 3

  if (type === 'reps') {
    const reps = ex.sets?.[0]?.reps || ex.default_reps || 10
    const w = ex.sets?.[0]?.weight_kg || ex.default_weight || 0
    return w > 0 ? `${sets}×${reps} · ${w}kg` : `${sets}×${reps} reps`
  }
  if (type === 'duration' || type === 'hold') {
    const dur = ex.sets?.[0]?.duration_sec || ex.default_duration_sec || 30
    return `${sets}×${dur}s`
  }
  if (type === 'breathing') {
    return `${sets} series`
  }
  return `${sets} series`
}

function restLabel(ex) {
  const sec = ex.rest_sec
  if (!sec) return null
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s ? `${m}:${s.toString().padStart(2,'0')}` : `${m}min`
}

const styleLabel = computed(() => {
  const map = {
    hipertrofia: 'Hipertrofia', fuerza: 'Fuerza', calistenia: 'Calistenia',
    yoga: 'Yoga', pilates: 'Pilates', cardio: 'Cardio',
    hiit: 'HIIT', híbrido: 'Híbrido', terapéutico: 'Terapéutico',
  }
  return map[props.routine.style] || props.routine.style || 'Mi rutina'
})

onMounted(() => {
  gsap.from(overlayEl.value, { opacity: 0, duration: 0.22, ease: 'power2.out' })
  gsap.from(sheetEl.value,   { y: 90, opacity: 0, duration: 0.32, ease: 'power3.out', delay: 0.04 })
})

function close() {
  const tl = gsap.timeline({ onComplete: () => emit('close') })
  tl.to(sheetEl.value,   { y: 70, opacity: 0, duration: 0.18, ease: 'power2.in' })
  tl.to(overlayEl.value, { opacity: 0, duration: 0.14, ease: 'power2.in' }, '-=0.10')
}
</script>

<template>
  <Teleport to="body">
    <div ref="overlayEl" class="sheet-overlay" @click.self="close">
      <div ref="sheetEl" class="routine-sheet">

        <!-- Handle -->
        <div class="sheet-handle" />

        <!-- Header -->
        <div class="sheet-header">
          <div>
            <h2 class="sheet-title">Mi Rutina</h2>
            <p class="sheet-sub label-caps">{{ styleLabel }} · {{ routine.days_per_week || routine.training_days || '?' }} días/sem</p>
          </div>
          <button type="button" class="close-btn" @click="close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Day list -->
        <div class="sheet-scroll">
          <div
            v-for="day in days"
            :key="day.index"
            class="day-block"
            :class="{ today: day.isToday, rest: day.isRest, expanded: expandedDay === day.index }"
          >
            <!-- Day header row -->
            <button
              type="button"
              class="day-header"
              :disabled="day.isRest"
              @click="!day.isRest && toggleDay(day.index)"
            >
              <div class="day-left">
                <span class="day-dot" :class="{ active: !day.isRest, today: day.isToday }" />
                <div>
                  <p class="day-name">{{ day.name }}</p>
                  <p class="day-label">{{ day.label }}</p>
                </div>
              </div>
              <div class="day-right">
                <span v-if="day.isToday" class="today-badge">Hoy</span>
                <span v-if="!day.isRest" class="ex-count">{{ dayExercises(day).length }} ejercicios</span>
                <svg
                  v-if="!day.isRest"
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                  class="chevron"
                  :class="{ rotated: expandedDay === day.index }"
                ><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </button>

            <!-- Expanded exercises -->
            <div v-if="expandedDay === day.index" class="ex-list">
              <div
                v-for="(ex, i) in dayExercises(day)"
                :key="ex.exercise_id || ex.id || i"
                class="ex-row"
                :class="{ done: isCompleted(ex) || ex.completed }"
              >
                <div class="ex-info">
                  <p class="ex-name">{{ ex.name }}</p>
                  <div class="ex-meta">
                    <span class="meta-chip">{{ exVolumeLabel(ex) }}</span>
                    <span v-if="restLabel(ex)" class="meta-chip rest-chip">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {{ restLabel(ex) }}
                    </span>
                    <span v-if="ex.pts_per_set" class="meta-chip pts-chip">+{{ ex.pts_per_set }}pts/serie</span>
                  </div>
                </div>
                <div class="ex-actions">
                  <button
                    type="button"
                    class="btn-info"
                    @click="showInfo(ex)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                    Info
                  </button>
                  <button
                    type="button"
                    class="btn-done"
                    :class="{ checked: isCompleted(ex) || ex.completed }"
                    :disabled="isCompleted(ex) || ex.completed"
                    @click="markComplete(ex)"
                  >
                    <svg v-if="isCompleted(ex) || ex.completed" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span v-else>Listo</span>
                  </button>
                </div>
              </div>

              <p v-if="!dayExercises(day).length" class="no-ex">
                Sin ejercicios asignados
              </p>
            </div>

          </div>
        </div><!-- /scroll -->

      </div>
    </div>

    <!-- Exercise detail modal -->
    <ExerciseDetailModal
      v-if="selectedExercise"
      :exercise="selectedExercise"
      @close="selectedExercise = null"
    />
  </Teleport>
</template>

<style scoped>
.sheet-overlay {
  position: fixed; inset: 0; z-index: 150;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: flex-end;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

.routine-sheet {
  width: 100%; max-width: 480px; margin: 0 auto;
  background: var(--surface);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  max-height: 92vh;
  display: flex; flex-direction: column;
  animation: slideUp 0.3s cubic-bezier(0.32,0.72,0,1);
}
@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }

.sheet-handle {
  width: 40px; height: 4px; background: var(--border-hi);
  border-radius: 2px; margin: var(--space-3) auto var(--space-1);
  flex-shrink: 0;
}

.sheet-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: var(--space-3) var(--space-5) var(--space-4);
  flex-shrink: 0; border-bottom: 1px solid var(--faint);
}
.sheet-title { font-family: var(--font-display); font-size: var(--text-xl); font-weight: 800; }
.sheet-sub { color: var(--accent); margin-top: 3px; }
.close-btn {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--faint); border: none;
  display: flex; align-items: center; justify-content: center;
  color: var(--muted); cursor: pointer;
  transition: var(--transition);
}
.close-btn:hover { background: var(--border); color: var(--text); }

.sheet-scroll {
  flex: 1; overflow-y: auto; padding: var(--space-3) var(--space-4) var(--space-6);
  scrollbar-width: none;
}
.sheet-scroll::-webkit-scrollbar { display: none; }

/* ── Day block ─────────────────────────────────────────── */
.day-block {
  border: 1.5px solid var(--border); border-radius: var(--radius-lg);
  margin-bottom: var(--space-3); overflow: hidden;
  transition: border-color 0.2s;
}
.day-block.today { border-color: var(--accent); }
.day-block.rest  { opacity: 0.5; }
.day-block.expanded { border-color: var(--accent); }

.day-header {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-3) var(--space-4); background: transparent;
  border: none; color: var(--text); cursor: pointer; text-align: left;
  transition: background 0.15s;
}
.day-header:not(:disabled):hover { background: var(--faint); }
.day-header:disabled { cursor: default; }

.day-left { display: flex; align-items: center; gap: var(--space-3); }
.day-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--border-hi); flex-shrink: 0;
  transition: background 0.2s;
}
.day-dot.active { background: var(--muted); }
.day-dot.today  { background: var(--accent); }

.day-name { font-size: var(--text-base); font-weight: 700; color: var(--text); }
.day-label { font-size: var(--text-xs); color: var(--muted); margin-top: 1px; }

.day-right { display: flex; align-items: center; gap: var(--space-2); }
.today-badge {
  background: var(--accent); color: #fff;
  border-radius: var(--radius-full); padding: 2px 8px;
  font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;
}
.ex-count { font-size: var(--text-xs); color: var(--muted); }
.chevron { color: var(--muted); transition: transform 0.2s; }
.chevron.rotated { transform: rotate(180deg); }

/* ── Exercise list ─────────────────────────────────────── */
.ex-list {
  border-top: 1px solid var(--faint);
  padding: var(--space-2) var(--space-4) var(--space-3);
  display: flex; flex-direction: column; gap: var(--space-2);
}

.ex-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: var(--space-3); padding: var(--space-3);
  background: var(--card); border-radius: var(--radius-md);
  border: 1px solid var(--faint);
  transition: background 0.2s;
}
.ex-row.done { background: var(--success-dim); border-color: transparent; }

.ex-info { flex: 1; min-width: 0; }
.ex-name { font-size: var(--text-sm); font-weight: 700; color: var(--text); }
.ex-meta { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px; }
.meta-chip {
  background: var(--faint); color: var(--muted);
  border-radius: var(--radius-full); padding: 2px 8px;
  font-size: 10px; font-weight: 700; font-family: var(--font-mono);
  display: flex; align-items: center; gap: 3px;
}
.rest-chip { color: var(--text); }
.pts-chip { background: var(--accent-dim); color: var(--accent); }

.ex-actions { display: flex; gap: var(--space-2); flex-shrink: 0; }

.btn-info {
  display: flex; align-items: center; gap: 4px;
  background: var(--faint); border: 1px solid var(--border);
  border-radius: var(--radius-full); padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs); font-weight: 700; color: var(--text);
  cursor: pointer; transition: var(--transition); white-space: nowrap;
}
.btn-info:hover { border-color: var(--accent); color: var(--accent); }
.btn-info svg { color: var(--accent); }

.btn-done {
  width: 36px; height: 36px; border-radius: 50%;
  border: 2px solid var(--border-hi);
  background: transparent; color: var(--text);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-xs); font-weight: 700;
  cursor: pointer; transition: var(--transition);
  flex-shrink: 0;
}
.btn-done:not(.checked):not(:disabled):hover { border-color: var(--accent); background: var(--accent-dim); }
.btn-done.checked { background: var(--success); border-color: var(--success); color: #fff; }
.btn-done:disabled { cursor: default; }

.no-ex { font-size: var(--text-sm); color: var(--muted); text-align: center; padding: var(--space-3) 0; }
</style>
