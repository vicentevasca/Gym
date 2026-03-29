<script setup>
import { computed } from 'vue'
import { EXERCISES_BY_ID } from '@/data/exercises'

const props = defineProps({
  exercise: { type: Object, required: true },
})
const emit = defineEmits(['close'])

// Look up full exercise data from catalogue if available
const full = computed(() => EXERCISES_BY_ID?.[props.exercise.exercise_id || props.exercise.id] || props.exercise)

const difficultyColor = computed(() => {
  const map = { principiante: '#22c55e', intermedio: '#f59e0b', avanzado: '#ef4444' }
  return map[full.value.difficulty] || 'var(--muted)'
})

const difficultyLabel = computed(() => {
  const map = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' }
  return map[full.value.difficulty] || full.value.difficulty || ''
})

const categoryLabel = computed(() => {
  const map = {
    hipertrofia: 'Hipertrofia', fuerza: 'Fuerza', calistenia: 'Calistenia',
    yoga: 'Yoga', pilates: 'Pilates', cardio: 'Cardio',
    hiit: 'HIIT', terapéutico: 'Terapéutico',
  }
  return map[full.value.category] || full.value.category || ''
})

const volumeLabel = computed(() => {
  const ex = full.value
  if (ex.exercise_type === 'reps') {
    const sets = ex.default_sets || props.exercise.sets?.length || 3
    const reps = ex.default_reps || props.exercise.sets?.[0]?.reps || 10
    const weight = ex.default_weight || 0
    return weight > 0
      ? `${sets} series × ${reps} reps · ${weight} kg`
      : `${sets} series × ${reps} reps`
  }
  if (ex.exercise_type === 'duration' || ex.exercise_type === 'hold') {
    const sets = ex.default_sets || props.exercise.sets?.length || 3
    const dur = ex.default_duration_sec || props.exercise.sets?.[0]?.duration_sec || 30
    return `${sets} series × ${dur} segundos`
  }
  if (ex.exercise_type === 'breathing') {
    const sets = ex.default_sets || 3
    return `${sets} series de respiración`
  }
  return ''
})

const restLabel = computed(() => {
  const sec = full.value.rest_sec || props.exercise.rest_sec
  if (!sec) return ''
  if (sec < 60) return `${sec} seg`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s ? `${m}:${s.toString().padStart(2, '0')} min` : `${m} min`
})
</script>

<template>
  <Teleport to="body">
    <div class="detail-overlay" @click.self="emit('close')">
      <div class="detail-sheet">

        <!-- Handle -->
        <div class="sheet-handle" />

        <!-- Header -->
        <div class="detail-header">
          <div class="detail-title-block">
            <h2 class="detail-name">{{ full.name }}</h2>
            <p class="detail-category label-caps">{{ categoryLabel }}</p>
          </div>
          <button type="button" class="close-btn" @click="emit('close')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="detail-scroll">

          <!-- Difficulty + type tags -->
          <div class="tag-row">
            <span class="diff-tag" :style="{ color: difficultyColor, borderColor: difficultyColor, background: difficultyColor + '18' }">
              <span class="diff-dot" :style="{ background: difficultyColor }" />
              {{ difficultyLabel }}
            </span>
            <span v-if="full.exercise_type && full.exercise_type !== 'reps'" class="type-tag">
              {{ full.exercise_type === 'breathing' ? 'Respiración' : full.exercise_type === 'hold' ? 'Isométrico' : 'Duración' }}
            </span>
            <span v-if="full.pts_per_set" class="pts-tag">
              +{{ full.pts_per_set }} pts/serie
            </span>
          </div>

          <!-- Volume + rest -->
          <div class="info-pills">
            <div v-if="volumeLabel" class="info-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
              {{ volumeLabel }}
            </div>
            <div v-if="restLabel" class="info-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Descanso: {{ restLabel }}
            </div>
          </div>

          <!-- Muscles -->
          <div v-if="full.muscles?.length" class="section">
            <p class="section-label">Músculos trabajados</p>
            <div class="muscle-chips">
              <span v-for="m in full.muscles" :key="m" class="muscle-chip">{{ m }}</span>
            </div>
          </div>

          <!-- Equipment -->
          <div v-if="full.equipment?.length" class="section">
            <p class="section-label">Equipamiento</p>
            <div class="muscle-chips">
              <span v-for="e in full.equipment" :key="e" class="equip-chip">{{ e }}</span>
            </div>
          </div>

          <!-- How to perform (cue) -->
          <div v-if="full.cue" class="section">
            <p class="section-label">Cómo ejecutarlo</p>
            <div class="how-to-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              <p>{{ full.cue }}</p>
            </div>
          </div>

          <!-- Regression / Progression -->
          <div v-if="full.regression || full.progression" class="section">
            <p class="section-label">Progresión</p>
            <div class="progression-row">
              <div v-if="full.regression" class="prog-item easier">
                <span class="prog-icon">↓</span>
                <div>
                  <p class="prog-label">Más fácil</p>
                  <p class="prog-id">{{ full.regression }}</p>
                </div>
              </div>
              <div v-if="full.progression" class="prog-item harder">
                <span class="prog-icon">↑</span>
                <div>
                  <p class="prog-label">Más difícil</p>
                  <p class="prog-id">{{ full.progression }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Special tags -->
          <div v-if="full.special_tags?.filter(t => t !== 'funcional').length" class="section">
            <p class="section-label">Programas especiales</p>
            <div class="muscle-chips">
              <span v-for="tag in full.special_tags.filter(t => t !== 'funcional')" :key="tag" class="special-chip">
                {{ tag.replace(/_/g, ' ') }}
              </span>
            </div>
          </div>

        </div><!-- /scroll -->

        <button type="button" class="btn btn-primary close-primary-btn" @click="emit('close')">
          Entendido
        </button>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.detail-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: flex-end;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

.detail-sheet {
  width: 100%; max-width: 480px; margin: 0 auto;
  background: var(--surface);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  max-height: 88vh;
  display: flex; flex-direction: column;
  animation: slideUp 0.3s cubic-bezier(0.32,0.72,0,1);
}

@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }

.sheet-handle {
  width: 40px; height: 4px; background: var(--border-hi);
  border-radius: 2px; margin: var(--space-3) auto var(--space-1);
  flex-shrink: 0;
}

.detail-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: var(--space-3) var(--space-5) var(--space-4);
  flex-shrink: 0;
}
.detail-title-block { flex: 1; min-width: 0; }
.detail-name {
  font-family: var(--font-display); font-size: var(--text-xl); font-weight: 800;
  letter-spacing: var(--tracking-snug); line-height: 1.2;
}
.detail-category {
  color: var(--accent); font-size: var(--text-xs); font-weight: 700;
  text-transform: uppercase; letter-spacing: var(--tracking-caps);
  margin-top: 4px;
}
.close-btn {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--faint); border: none;
  display: flex; align-items: center; justify-content: center;
  color: var(--muted); cursor: pointer; flex-shrink: 0;
  transition: var(--transition);
}
.close-btn:hover { background: var(--border); color: var(--text); }

.detail-scroll {
  flex: 1; overflow-y: auto; padding: 0 var(--space-5) var(--space-4);
  scrollbar-width: none;
}
.detail-scroll::-webkit-scrollbar { display: none; }

/* Tags row */
.tag-row {
  display: flex; flex-wrap: wrap; gap: var(--space-2);
  margin-bottom: var(--space-4);
}
.diff-tag {
  display: flex; align-items: center; gap: 5px;
  border: 1.5px solid; border-radius: var(--radius-full);
  padding: 3px 10px; font-size: var(--text-xs); font-weight: 700;
}
.diff-dot { width: 7px; height: 7px; border-radius: 50%; }
.type-tag {
  background: var(--faint); color: var(--muted); border-radius: var(--radius-full);
  padding: 3px 10px; font-size: var(--text-xs); font-weight: 700;
  text-transform: capitalize;
}
.pts-tag {
  background: var(--accent-dim); color: var(--accent);
  border-radius: var(--radius-full); padding: 3px 10px;
  font-size: var(--text-xs); font-weight: 700; font-family: var(--font-mono);
}

/* Info pills */
.info-pills {
  display: flex; flex-direction: column; gap: var(--space-2);
  margin-bottom: var(--space-5);
}
.info-pill {
  display: flex; align-items: center; gap: var(--space-2);
  background: var(--faint); border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm); font-weight: 600; color: var(--text);
}
.info-pill svg { color: var(--accent); flex-shrink: 0; }

/* Sections */
.section { margin-bottom: var(--space-5); }
.section-label {
  font-size: var(--text-xs); font-weight: 800; text-transform: uppercase;
  letter-spacing: var(--tracking-caps); color: var(--muted);
  margin-bottom: var(--space-2);
}

/* Muscle chips */
.muscle-chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.muscle-chip {
  background: var(--accent-dim); color: var(--accent);
  border-radius: var(--radius-full); padding: 4px 12px;
  font-size: var(--text-xs); font-weight: 700;
}
.equip-chip {
  background: var(--faint); color: var(--muted);
  border-radius: var(--radius-full); padding: 4px 12px;
  font-size: var(--text-xs); font-weight: 700; text-transform: capitalize;
}
.special-chip {
  background: var(--faint-2); color: var(--text);
  border-radius: var(--radius-full); padding: 4px 12px;
  font-size: var(--text-xs); font-weight: 700; text-transform: capitalize;
}

/* How to box */
.how-to-box {
  display: flex; gap: var(--space-3);
  background: var(--faint-2); border-radius: var(--radius-md);
  padding: var(--space-4);
  font-size: var(--text-sm); color: var(--text); line-height: 1.6;
}
.how-to-box svg { color: var(--accent); flex-shrink: 0; margin-top: 2px; }
.how-to-box p { flex: 1; }

/* Progression */
.progression-row { display: flex; gap: var(--space-3); }
.prog-item {
  flex: 1; display: flex; align-items: center; gap: var(--space-2);
  background: var(--faint); border-radius: var(--radius-md);
  padding: var(--space-3);
}
.prog-icon {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: var(--text-base); flex-shrink: 0;
}
.prog-item.easier .prog-icon { background: #22c55e18; color: #22c55e; }
.prog-item.harder .prog-icon { background: #ef444418; color: #ef4444; }
.prog-label { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; }
.prog-id { font-size: var(--text-xs); font-weight: 600; color: var(--text); font-family: var(--font-mono); }

/* Close button */
.close-primary-btn {
  margin: var(--space-4) var(--space-5) var(--space-6);
  flex-shrink: 0;
}
</style>
