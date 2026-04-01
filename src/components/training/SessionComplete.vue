<script setup>
import { ref, onMounted } from 'vue'
import { gsap } from 'gsap'
import { successPop, staggerIn } from '@/composables/useAnimations'
import { useShareCard }   from '@/composables/useShareCard'
import { useRankingStore } from '@/stores/ranking.store'
import { formatDuration }  from '@/utils/formatters'

const props = defineProps({
  session:     { type: Object, required: true },
  suggestions: { type: Array, default: () => [] },
})
const emit = defineEmits(['close'])

const ranking   = useRankingStore()
const { shareWorkout } = useShareCard()

const overlay   = ref(null)
const card      = ref(null)
const stars     = ref([])
const statsGrid = ref(null)
const sharing   = ref(false)

onMounted(() => {
  gsap.from(overlay.value, { opacity: 0, duration: 0.3 })
  gsap.from(card.value, { y: 60, opacity: 0, duration: 0.5, ease: 'back.out(1.4)', delay: 0.15 })
  stars.value.forEach((el, i) => {
    if (!el) return
    gsap.from(el, { scale: 0, opacity: 0, duration: 0.4, delay: 0.5 + i * 0.07, ease: 'back.out(2)' })
  })
  // Usar querySelectorAll dentro del contenedor para no agarrar elementos externos
  staggerIn(statsGrid.value?.querySelectorAll('.stat-item'), { delay: 0.6 })
  navigator.vibrate?.([80, 40, 80, 40, 120])
})

async function handleShare() {
  if (sharing.value) return
  sharing.value = true
  try {
    await shareWorkout({
      session: props.session,
      ranking,
      streak:  ranking.streak,
    })
  } finally {
    sharing.value = false
  }
}

function levelProgressWidth() {
  return Math.max(4, ranking.levelProgress) + '%'
}
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
      <div class="stats-grid" ref="statsGrid">
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

      <!-- XP + Level progress -->
      <div v-if="session.pointsEarned" class="sc-xp-block">
        <div class="sc-xp-row">
          <span class="sc-xp-icon">⚡</span>
          <span class="sc-xp-label">+{{ session.pointsEarned }} XP ganado</span>
          <span class="sc-level-badge" :style="{ color: ranking.currentLevel.color, borderColor: ranking.currentLevel.color + '44' }">
            {{ ranking.currentLevel.emoji }} {{ ranking.currentLevel.name }}
          </span>
        </div>
        <!-- Progress bar toward next level -->
        <div v-if="ranking.nextLevel" class="sc-level-progress">
          <div class="sc-level-track">
            <div
              class="sc-level-fill"
              :style="{ width: levelProgressWidth(), background: ranking.currentLevel.color }"
            />
          </div>
          <p class="sc-level-hint">
            {{ ranking.levelProgress }}% → {{ ranking.nextLevel.name }}
            <span class="sc-pts-to-next">{{ ranking.pointsToNext.toLocaleString() }} XP restantes</span>
          </p>
        </div>
      </div>

      <!-- Progression suggestions -->
      <div v-if="suggestions.length" class="sc-suggestions">
        <p class="sc-section-label label-caps">Sugerencias de progresión</p>
        <div v-for="s in suggestions" :key="s.exercise" class="suggestion-row">
          <div class="sug-dot" />
          <div>
            <p class="sug-name">{{ s.exercise }}</p>
            <p class="sug-text">{{ s.reason }}</p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="sc-actions">
        <button class="btn btn-primary sc-btn" @click="emit('close')">
          Continuar
        </button>
        <button
          class="btn sc-share-btn"
          :disabled="sharing"
          @click="handleShare"
          title="Compartir sesión"
        >
          <svg v-if="!sharing" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          <span v-if="sharing" class="spinner-xs" />
        </button>
      </div>

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
.sc-star:nth-child(2) { left: 22%; color: var(--warning, #f59e0b); top: 20px; }
.sc-star:nth-child(3) { left: 42%; color: var(--accent); top: 8px; }
.sc-star:nth-child(4) { left: 60%; color: var(--success); top: 24px; }
.sc-star:nth-child(5) { left: 76%; color: var(--accent); top: 14px; }
.sc-star:nth-child(6) { left: 90%; color: var(--warning, #f59e0b); top: 6px; }

.sc-title-block { text-align: center; margin-bottom: var(--space-5); }
.sc-icon {
  width: 64px; height: 64px; border-radius: 50%;
  background: var(--gradient-accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; color: #fff; font-weight: 800;
  margin: 0 auto var(--space-3);
  box-shadow: var(--shadow-accent);
}
.sc-title { font-size: var(--text-xl); font-weight: 800; }
.sc-sub { color: var(--muted); margin-top: var(--space-1); font-size: var(--text-sm); }

/* Stats */
.stats-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: var(--space-3); margin-bottom: var(--space-4);
}
.stat-item {
  background: var(--surface); border-radius: var(--radius);
  padding: var(--space-4); text-align: center;
}
.stat-val {
  display: block; font-size: var(--text-2xl); font-weight: 800;
  color: var(--accent); font-family: var(--font-mono);
}
.stat-lbl {
  font-size: var(--text-xs); color: var(--muted); margin-top: var(--space-1);
  text-transform: uppercase; letter-spacing: 0.06em;
}

/* XP block */
.sc-xp-block {
  background: var(--accent-dim);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
}
.sc-xp-row {
  display: flex; align-items: center; gap: var(--space-2);
  margin-bottom: var(--space-2);
}
.sc-xp-icon { font-size: 18px; }
.sc-xp-label {
  font-weight: 700; font-size: var(--text-sm); color: var(--accent); flex: 1;
}
.sc-level-badge {
  font-size: var(--text-xs); font-weight: 700;
  border: 1px solid; border-radius: var(--radius-full);
  padding: 2px 8px; white-space: nowrap;
}
.sc-level-progress { }
.sc-level-track {
  height: 5px; background: var(--faint); border-radius: 3px; overflow: hidden;
  margin-bottom: var(--space-1);
}
.sc-level-fill {
  height: 100%; border-radius: 3px; transition: width 0.8s ease;
}
.sc-level-hint {
  font-size: var(--text-xs); color: var(--muted);
  display: flex; justify-content: space-between; align-items: center;
}
.sc-pts-to-next { color: var(--accent); font-weight: 600; }

/* Suggestions */
.sc-section-label { color: var(--muted); margin-bottom: var(--space-3); }
.sc-suggestions { margin-bottom: var(--space-4); }
.suggestion-row { display: flex; gap: var(--space-3); align-items: flex-start; margin-bottom: var(--space-3); }
.sug-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); margin-top: 5px; flex-shrink: 0; }
.sug-name { font-size: var(--text-sm); font-weight: 700; }
.sug-text { font-size: var(--text-sm); color: var(--muted); margin-top: 2px; }

/* Actions */
.sc-actions {
  display: flex; gap: var(--space-3);
}
.sc-btn { flex: 1; }
.sc-share-btn {
  width: 48px; height: 48px; flex-shrink: 0;
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: var(--radius-lg);
  display: flex; align-items: center; justify-content: center;
  color: var(--muted); cursor: pointer; transition: var(--transition);
}
.sc-share-btn:hover { border-color: var(--accent); color: var(--accent); }
.sc-share-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.spinner-xs {
  width: 14px; height: 14px;
  border: 2px solid var(--border); border-top-color: var(--accent);
  border-radius: 50%; animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
