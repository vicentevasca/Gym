<script setup>
import { ref, computed, onMounted } from 'vue'
import { gsap }             from 'gsap'
import { usePointsStore }   from '@/stores/points.store'
import { useNutritionStore } from '@/stores/nutrition.store'
import { useTrainingStore }  from '@/stores/training.store'

const emit = defineEmits(['done'])

const points   = usePointsStore()
const nutrition= useNutritionStore()
const training = useTrainingStore()

const mood    = ref(null)
const note    = ref('')
const saving  = ref(false)
const done    = ref(false)

const el = ref(null)
onMounted(() => gsap.from(el.value, { y: 40, opacity: 0, duration: 0.4, ease: 'back.out(1.4)' }))

const moods = [
  { id: 'great',  emoji: '🔥', label: 'Excelente' },
  { id: 'good',   emoji: '💪', label: 'Bien' },
  { id: 'ok',     emoji: '😐', label: 'Regular' },
  { id: 'tired',  emoji: '😴', label: 'Cansado' },
]

const sessionDone = computed(() => training.todaySession?.completed ?? false)
const kcalTarget  = computed(() => nutrition.consumed.kcal > 0)

async function submit() {
  if (!mood.value) return
  saving.value = true
  // Award points for closing the day
  await points.earnPoints('daily_close')
  if (sessionDone.value) await points.earnPoints('session_complete')

  done.value   = true
  saving.value = false
  gsap.to(el.value, { scale: 1.03, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.inOut',
    onComplete: () => setTimeout(() => emit('done'), 400)
  })
}
</script>

<template>
  <div class="daily-close card" ref="el">
    <div v-if="!done">
      <p class="dc-title">Cierre del día</p>
      <p class="dc-sub">¿Cómo te sentiste hoy?</p>

      <!-- Mood selector -->
      <div class="mood-grid">
        <button
          v-for="m in moods"
          :key="m.id"
          class="mood-btn"
          :class="{ selected: mood === m.id }"
          @click="mood = m.id"
        >
          <span class="mood-emoji">{{ m.emoji }}</span>
          <span class="mood-label">{{ m.label }}</span>
        </button>
      </div>

      <!-- Optional note -->
      <textarea
        v-model="note"
        class="input-field dc-note"
        placeholder="Nota del día (opcional)…"
        rows="2"
      />

      <!-- Summary chips -->
      <div class="dc-summary">
        <span class="dc-chip" :class="{ ok: sessionDone }">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          {{ sessionDone ? 'Entrenamiento' : 'Sin entreno' }}
        </span>
        <span class="dc-chip" :class="{ ok: kcalTarget }">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          {{ kcalTarget ? 'Nutrición' : 'Sin registro' }}
        </span>
      </div>

      <button
        class="btn btn-primary dc-btn"
        :disabled="!mood || saving"
        @click="submit"
      >
        {{ saving ? 'Guardando…' : 'Cerrar día' }}
      </button>
    </div>

    <div v-else class="dc-done">
      <div class="done-icon">✓</div>
      <p class="done-text">¡Día cerrado!</p>
      <p class="done-points">+{{ points.lastEarned }} puntos</p>
    </div>
  </div>
</template>

<style scoped>
.daily-close { padding: var(--space-5); }
.dc-title { font-size: var(--text-lg); font-weight: 800; margin-bottom: var(--space-1); }
.dc-sub   { font-size: var(--text-sm); color: var(--muted); margin-bottom: var(--space-5); }

.mood-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-2); margin-bottom: var(--space-4); }
.mood-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: var(--space-3) var(--space-2);
  border-radius: var(--radius); border: 1.5px solid var(--border);
  background: transparent; cursor: pointer; transition: var(--transition);
}
.mood-btn.selected { border-color: var(--accent); background: var(--accent-dim); }
.mood-emoji { font-size: 22px; }
.mood-label { font-size: 10px; color: var(--muted); font-weight: 600; }

.dc-note { width: 100%; resize: none; margin-bottom: var(--space-4); font-size: var(--text-sm); }

.dc-summary { display: flex; gap: var(--space-2); margin-bottom: var(--space-5); }
.dc-chip {
  display: flex; align-items: center; gap: 5px;
  font-size: var(--text-xs); font-weight: 600;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  background: var(--faint-2); color: var(--muted);
}
.dc-chip.ok { background: var(--success-dim, rgba(34,197,94,.15)); color: var(--success); }

.dc-btn { width: 100%; }

.dc-done { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-4) 0; }
.done-icon { width: 56px; height: 56px; border-radius: 50%; background: var(--success); display: flex; align-items: center; justify-content: center; font-size: 24px; color: #fff; font-weight: 800; }
.done-text { font-size: var(--text-lg); font-weight: 800; }
.done-points { color: var(--accent); font-weight: 700; font-size: var(--text-base); }
</style>
