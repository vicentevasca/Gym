<script setup>
import { computed } from 'vue'
import { usePointsStore } from '@/stores/points.store'

const props = defineProps({
  reward: { type: Object, required: true },
})
const emit = defineEmits(['start', 'complete'])

const points = usePointsStore()

const canAfford = computed(() => points.balance >= props.reward.cost)

const statusLabel = computed(() => {
  if (props.reward.isCompleted) return 'Completado ✓'
  if (props.reward.isActive)    return 'En curso…'
  return null
})

// Días restantes del reto activo
const daysLeft = computed(() => {
  if (!props.reward.isActive || !props.reward.activeChallenge) return null
  const end  = new Date(props.reward.activeChallenge.end_date)
  const now  = new Date()
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  return Math.max(diff, 0)
})

// Dificultad visual
const difficultyDots = computed(() => props.reward.difficulty_score || 3)

// Progreso del reto activo: días transcurridos / total
const challengeProgress = computed(() => {
  if (!props.reward.isActive || !props.reward.activeChallenge) return null
  const challenge  = props.reward.activeChallenge
  const total      = challenge.days ?? props.reward.days ?? 1
  const elapsed    = total - (daysLeft.value ?? 0)
  const pct        = Math.min(Math.round((elapsed / total) * 100), 100)
  return { elapsed: Math.max(elapsed, 0), total, pct }
})
</script>

<template>
  <div
    class="reward-card"
    :class="{
      'is-active':    reward.isActive,
      'is-completed': reward.isCompleted,
    }"
    :style="{ '--cat-color': reward.category_color }"
  >
    <!-- Header de la tarjeta -->
    <div class="rc-header">
      <div class="rc-left">
        <span class="rc-emoji">{{ reward.category_emoji }}</span>
        <div>
          <p class="rc-title">{{ reward.title }}</p>
          <p class="rc-days label-caps">{{ reward.days }} {{ reward.days === 1 ? 'día' : 'días' }}</p>
        </div>
      </div>
      <div class="rc-cost">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
        <span>{{ reward.cost }}</span>
      </div>
    </div>

    <!-- Motivación -->
    <p class="rc-motivacion">{{ reward.motivacion }}</p>

    <!-- Indicador de dificultad personal -->
    <div class="rc-difficulty">
      <span class="rc-diff-label label-caps">Tu dificultad</span>
      <div class="rc-diff-dots">
        <span
          v-for="n in 6"
          :key="n"
          class="rc-dot"
          :class="{ filled: n <= difficultyDots }"
        />
      </div>
    </div>

    <!-- Estado: activo con días restantes + barra de progreso -->
    <div v-if="reward.isActive" class="rc-active-block">
      <div class="rc-active-bar">
        <div class="rc-active-info">
          <div class="rc-active-pulse" />
          <span>Reto en curso</span>
        </div>
        <span v-if="daysLeft !== null" class="rc-days-left">
          {{ daysLeft }} {{ daysLeft === 1 ? 'día' : 'días' }} restantes
        </span>
      </div>
      <!-- Barra de progreso de días -->
      <div v-if="challengeProgress" class="rc-progress-wrap">
        <div class="rc-progress-track">
          <div
            class="rc-progress-fill"
            :style="{ width: challengeProgress.pct + '%' }"
          />
        </div>
        <span class="rc-progress-label">
          Día {{ challengeProgress.elapsed }} de {{ challengeProgress.total }} · {{ challengeProgress.pct }}%
        </span>
      </div>
    </div>

    <!-- Estado: completado -->
    <div v-else-if="reward.isCompleted" class="rc-completed-bar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      <span>¡Reto completado! +{{ reward.cost }} pts ganados</span>
    </div>

    <!-- Acciones -->
    <div v-else class="rc-actions">
      <button
        class="btn btn-primary rc-start-btn"
        :disabled="!canAfford && false"
        @click="emit('start', reward)"
      >
        Empezar reto
      </button>
    </div>

    <!-- Botón completar (solo cuando está activo) -->
    <div v-if="reward.isActive" class="rc-complete-area">
      <button
        class="btn btn-ghost rc-complete-btn"
        @click="emit('complete', reward.activeChallenge)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        Marcar como completado
      </button>
    </div>
  </div>
</template>

<style scoped>
.reward-card {
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

/* Acento de categoría en el borde izquierdo */
.reward-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--cat-color, var(--accent));
  border-radius: 3px 0 0 3px;
}

.reward-card.is-active {
  border-color: var(--accent);
  background: var(--faint-2);
}
.reward-card.is-completed {
  border-color: var(--success-dim);
  opacity: 0.75;
}

.rc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
}
.rc-left {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
}
.rc-emoji { font-size: 22px; flex-shrink: 0; }
.rc-title {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: 700;
  letter-spacing: var(--tracking-snug);
  line-height: var(--leading-snug);
  color: var(--text);
}
.rc-days { color: var(--muted); margin-top: 2px; }

.rc-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--accent-dim);
  color: var(--accent);
  border-radius: var(--radius-full);
  padding: var(--space-1) var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 800;
  font-feature-settings: "tnum" 1;
  flex-shrink: 0;
}

.rc-motivacion {
  font-family: var(--font-verse);
  font-style: italic;
  font-size: var(--text-sm);
  color: var(--muted);
  line-height: var(--leading-relaxed);
}

/* Dificultad personal */
.rc-difficulty {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.rc-diff-label { flex-shrink: 0; }
.rc-diff-dots {
  display: flex;
  gap: 5px;
  align-items: center;
}
.rc-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--faint); border: 1.5px solid var(--border-hi);
  transition: background 0.2s;
}
.rc-dot.filled {
  background: var(--cat-color, var(--accent));
  border-color: var(--cat-color, var(--accent));
}

/* Estado activo */
.rc-active-block { display: flex; flex-direction: column; gap: var(--space-2); }
.rc-active-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--accent-dim);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  color: var(--accent);
  font-weight: 600;
}
.rc-active-info { display: flex; align-items: center; gap: var(--space-2); }
.rc-progress-wrap { display: flex; flex-direction: column; gap: 4px; }
.rc-progress-track {
  height: 6px; background: var(--faint); border-radius: 3px; overflow: hidden;
}
.rc-progress-fill {
  height: 100%; background: var(--cat-color, var(--accent));
  border-radius: 3px; transition: width 0.5s ease;
  min-width: 6px;
}
.rc-progress-label {
  font-size: 10px; color: var(--muted); font-family: var(--font-mono);
  text-align: right;
}
.rc-active-pulse {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--accent);
  animation: pulse-dot 1.5s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 0.4; transform: scale(0.85); }
  50%       { opacity: 1;   transform: scale(1.2); }
}
.rc-days-left {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-feature-settings: "tnum" 1;
}

/* Estado completado */
.rc-completed-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--success-dim);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  color: var(--success);
  font-weight: 600;
}

/* Acciones */
.rc-start-btn { width: 100%; }
.rc-complete-area { padding-top: var(--space-1); }
.rc-complete-btn {
  width: 100%;
  font-size: var(--text-sm);
  color: var(--success);
  border-color: var(--success-dim);
}
.rc-complete-btn:hover {
  background: var(--success-dim);
  border-color: var(--success);
}
</style>
