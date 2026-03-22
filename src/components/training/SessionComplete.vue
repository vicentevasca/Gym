<script setup>
import { ref, onMounted } from 'vue'
import { gsap } from 'gsap'
import { successPop, staggerIn } from '@/composables/useAnimations'
import { formatDuration } from '@/utils/formatters'

const props = defineProps({
  session: { type: Object, required: true },
  suggestions: { type: Array, default: () => [] },
})
const emit = defineEmits(['close'])

const overlay = ref(null)
const card    = ref(null)
const stars   = ref([])

onMounted(() => {
  gsap.from(overlay.value, { opacity: 0, duration: 0.3 })
  gsap.from(card.value, { y: 60, opacity: 0, duration: 0.5, ease: 'back.out(1.4)', delay: 0.15 })
  // Confetti-like stars burst
  stars.value.forEach((el, i) => {
    if (!el) return
    gsap.from(el, {
      scale: 0, opacity: 0, duration: 0.4,
      delay: 0.5 + i * 0.07, ease: 'back.out(2)',
    })
  })
  staggerIn('.stat-item', { delay: 0.6 })
  navigator.vibrate?.([80, 40, 80, 40, 120])
})
</script>

<template>
  <div class="sc-overlay" ref="overlay">
    <div class="sc-card" ref="card">
      <!-- Stars decoration -->
      <div class="sc-stars" aria-hidden="true">
        <svg v-for="n in 6" :key="n" :ref="el => stars[n-1] = el"
          class="sc-star" :style="`--i:${n}`"
          width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
        </svg>
      </div>

      <!-- Title -->
      <div class="sc-title-block">
        <div class="sc-icon">✓</div>
        <h2 class="sc-title">¡Sesión completada!</h2>
        <p class="sc-sub">{{ session.name }}</p>
      </div>

      <!-- Stats grid -->
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-val">{{ session.exercises?.length ?? 0 }}</span>
          <span class="stat-lbl">Ejercicios</span>
        </div>
        <div class="stat-item">
          <span class="stat-val">{{ session.exercises?.reduce((a,e)=>a+e.sets.length,0) ?? 0 }}</span>
          <span class="stat-lbl">Series totales</span>
        </div>
        <div class="stat-item">
          <span class="stat-val">{{ (session.volume_total_kg ?? 0).toLocaleString() }}</span>
          <span class="stat-lbl">Volumen (kg)</span>
        </div>
        <div class="stat-item">
          <span class="stat-val">{{ formatDuration((session.duration_min ?? 0) * 60) }}</span>
          <span class="stat-lbl">Duración</span>
        </div>
      </div>

      <!-- Progression suggestions -->
      <div v-if="suggestions.length" class="sc-suggestions">
        <p class="sc-section-label label-caps">Sugerencias de progresión</p>
        <div v-for="s in suggestions" :key="s.exerciseId" class="suggestion-row">
          <div class="sug-dot" />
          <div>
            <p class="sug-name">{{ s.exerciseName }}</p>
            <p class="sug-text">{{ s.message }}</p>
          </div>
        </div>
      </div>

      <!-- Points earned -->
      <div v-if="session.pointsEarned" class="sc-points">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
        <span>+{{ session.pointsEarned }} puntos ganados</span>
      </div>

      <button class="btn btn-primary sc-btn" @click="emit('close')">
        Continuar
      </button>
    </div>
  </div>
</template>

<style scoped>
.sc-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: var(--overlay);
  display: flex; align-items: flex-end; justify-content: center;
  padding: var(--space-4);
  backdrop-filter: blur(6px);
}
.sc-card {
  width: 100%; max-width: 480px;
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-7) var(--space-6) var(--space-6);
  position: relative; overflow: hidden;
}
.sc-stars {
  position: absolute; top: 0; left: 0; right: 0;
  height: 80px; pointer-events: none;
}
.sc-star {
  position: absolute; color: var(--accent);
  top: calc(10px + var(--i) * 5px);
}
.sc-star:nth-child(1) { left: 8%;  color: var(--accent); }
.sc-star:nth-child(2) { left: 22%; color: var(--warning); top: 20px; }
.sc-star:nth-child(3) { left: 42%; color: var(--accent); top: 8px; }
.sc-star:nth-child(4) { left: 60%; color: var(--success); top: 24px; }
.sc-star:nth-child(5) { left: 76%; color: var(--accent); top: 14px; }
.sc-star:nth-child(6) { left: 90%; color: var(--warning); top: 6px; }

.sc-title-block { text-align: center; margin-bottom: var(--space-6); }
.sc-icon {
  width: 64px; height: 64px; border-radius: 50%;
  background: var(--gradient-accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; color: #fff; font-weight: 800;
  margin: 0 auto var(--space-3);
  box-shadow: var(--shadow-accent);
}
.sc-title { font-size: var(--text-xl); font-weight: 800; }
.sc-sub { color: var(--muted); margin-top: var(--space-1); }

.stats-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: var(--space-3); margin-bottom: var(--space-5);
}
.stat-item {
  background: var(--surface); border-radius: var(--radius);
  padding: var(--space-4); text-align: center;
}
.stat-val { display: block; font-size: var(--text-2xl); font-weight: 800; color: var(--accent); font-family: var(--font-mono); }
.stat-lbl { font-size: var(--text-xs); color: var(--muted); margin-top: var(--space-1); text-transform: uppercase; letter-spacing: 0.06em; }

.sc-section-label { color: var(--muted); margin-bottom: var(--space-3); }
.sc-suggestions { margin-bottom: var(--space-5); }
.suggestion-row { display: flex; gap: var(--space-3); align-items: flex-start; margin-bottom: var(--space-3); }
.sug-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); margin-top: 5px; flex-shrink: 0; }
.sug-name { font-size: var(--text-sm); font-weight: 700; }
.sug-text { font-size: var(--text-sm); color: var(--muted); margin-top: 2px; }

.sc-points {
  display: flex; align-items: center; justify-content: center; gap: var(--space-2);
  background: var(--accent-dim); border-radius: var(--radius);
  padding: var(--space-3); margin-bottom: var(--space-5);
  color: var(--accent); font-weight: 700; font-size: var(--text-sm);
}

.sc-btn { width: 100%; }
</style>
