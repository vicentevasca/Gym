<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { gsap }                                      from 'gsap'
import { useRankingStore, LEVELS }                   from '@/stores/ranking.store'
import { usePointsStore }                            from '@/stores/points.store'
import { useShareCard }                              from '@/composables/useShareCard'

const ranking = useRankingStore()
const points  = usePointsStore()
const { shareRank } = useShareCard()

const sharing    = ref(false)
const ringArcEl  = ref(null)
const xpFillEl   = ref(null)

// SVG ring params
const R      = 44
const CIRCUM = 2 * Math.PI * R

const dashOffset = computed(() =>
  CIRCUM - (CIRCUM * ranking.levelProgress) / 100
)

function formatNum(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// ── GSAP: animar ring y barra al montar ───────────────────────
onMounted(() => {
  nextTick(() => {
    const arc  = ringArcEl.value
    const fill = xpFillEl.value
    if (!arc || !fill) return

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    // Ring: stroke-dashoffset desde CIRCUM (0%) hasta el valor real
    tl.fromTo(arc,
      { strokeDashoffset: CIRCUM },
      { strokeDashoffset: dashOffset.value, duration: 1.3, delay: 0.15 }
    )

    // Barra XP: desde 0 hasta el porcentaje real
    tl.fromTo(fill,
      { width: '0%' },
      { width: Math.max(ranking.levelProgress, 0) + '%', duration: 1.1 },
      '-=1.0'
    )

    // Pulse de ondeo continuo en el arco
    gsap.to(arc, {
      opacity: 0.72,
      duration: 2.2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: 1.5,
    })
  })
})

// ── GSAP: reanimar cuando cambia el progreso (XP ganado en vivo) ─
watch(() => ranking.levelProgress, (newVal) => {
  if (ringArcEl.value) {
    gsap.to(ringArcEl.value, {
      strokeDashoffset: dashOffset.value,
      duration: 0.9,
      ease: 'power2.out',
    })
  }
  if (xpFillEl.value) {
    gsap.to(xpFillEl.value, {
      width: Math.max(newVal, 0) + '%',
      duration: 0.9,
      ease: 'power2.out',
    })
  }
})

async function handleShareRank() {
  if (sharing.value) return
  sharing.value = true
  try {
    await shareRank({ ranking, streak: ranking.streak })
  } finally {
    sharing.value = false
  }
}
</script>

<template>
  <div class="rank-card card">

    <!-- Top row: ring + info -->
    <div class="rank-top">

      <!-- SVG ring de progreso -->
      <div class="ring-wrap">
        <svg class="ring-svg" viewBox="0 0 100 100">
          <!-- Track -->
          <circle
            cx="50" cy="50" :r="R"
            fill="none"
            stroke="var(--faint)"
            stroke-width="7"
          />
          <!-- Progress arc — GSAP controla stroke-dashoffset -->
          <circle
            ref="ringArcEl"
            cx="50" cy="50" :r="R"
            fill="none"
            :stroke="ranking.currentLevel.color"
            stroke-width="7"
            stroke-linecap="round"
            :stroke-dasharray="CIRCUM"
            :stroke-dashoffset="CIRCUM"
            transform="rotate(-90 50 50)"
            class="ring-arc"
          />
        </svg>

        <div class="ring-center">
          <span class="rank-emoji">{{ ranking.currentLevel.emoji }}</span>
          <span class="rank-pct num-sm" :style="{ color: ranking.currentLevel.color }">
            {{ ranking.levelProgress }}%
          </span>
        </div>
      </div>

      <!-- Nombre y datos -->
      <div class="rank-info">
        <p class="rank-label label-caps">Tu rango</p>
        <h3 class="rank-name display-sm" :style="{ color: ranking.currentLevel.color }">
          {{ ranking.currentLevel.name }}
        </h3>
        <p v-if="ranking.nextLevel" class="rank-next">
          Siguiente: {{ ranking.nextLevel.name }}
        </p>
        <p v-else class="rank-next rank-max">¡Rango máximo alcanzado!</p>
      </div>
    </div>

    <!-- XP bar -->
    <div class="xp-row">
      <span class="xp-label label-caps">XP Total</span>
      <span class="xp-val num-sm" :style="{ color: ranking.currentLevel.color }">
        {{ formatNum(ranking.xp) }}
      </span>
      <span v-if="ranking.nextLevel" class="xp-next">
        / {{ formatNum(ranking.nextLevel.min) }}
      </span>
    </div>

    <!-- Barra con shimmer wave -->
    <div class="xp-track">
      <div
        ref="xpFillEl"
        class="xp-fill"
        :style="{ background: ranking.currentLevel.color }"
      />
    </div>

    <p v-if="ranking.pointsToNext > 0" class="xp-hint">
      Faltan <strong>{{ formatNum(ranking.pointsToNext) }} XP</strong> para {{ ranking.nextLevel?.name }}
    </p>

    <!-- Stats row -->
    <div class="stats-row">
      <div class="stat-item">
        <p class="stat-val num-sm">{{ ranking.streak }}</p>
        <p class="stat-label">Racha días</p>
      </div>
      <div class="stat-divider" />
      <div class="stat-item">
        <p class="stat-val num-sm accent">{{ points.balance }}</p>
        <p class="stat-label">Puntos</p>
      </div>
      <div class="stat-divider" />
      <div class="stat-item">
        <p class="stat-val num-sm">{{ ranking.bests.best_streak ?? 0 }}</p>
        <p class="stat-label">Mejor racha</p>
      </div>
    </div>

    <!-- Niveles mini-map -->
    <div class="levels-row">
      <div
        v-for="lvl in LEVELS"
        :key="lvl.index"
        class="lvl-dot"
        :class="{
          'lvl-done':    ranking.xp >= lvl.min,
          'lvl-current': lvl.index === ranking.currentLevel.index,
        }"
        :style="{ '--lvl-color': lvl.color }"
        :title="lvl.name"
      >
        <span v-if="lvl.index === ranking.currentLevel.index" class="lvl-pulse" />
      </div>
    </div>

    <!-- Level labels -->
    <div class="lvl-labels">
      <span class="lvl-label-cur" :style="{ color: ranking.currentLevel.color }">
        {{ ranking.currentLevel.name }}
      </span>
      <span v-if="ranking.nextLevel" class="lvl-label-next">
        → {{ ranking.nextLevel.name }}
      </span>
    </div>

    <!-- Share button -->
    <button class="share-rank-btn" :disabled="sharing" @click="handleShareRank">
      <svg v-if="!sharing" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
      <span v-if="sharing" class="spinner-xs" />
      {{ sharing ? 'Generando…' : 'Compartir mi rango' }}
    </button>

  </div>
</template>

<style scoped>
.rank-card { padding: var(--space-5); }

/* Top */
.rank-top {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  margin-bottom: var(--space-4);
}

/* Ring */
.ring-wrap {
  position: relative;
  width: 92px; height: 92px;
  flex-shrink: 0;
}
.ring-svg { width: 100%; height: 100%; }
/* Sin CSS transition en ring-arc — GSAP lo controla */
.ring-arc { will-change: stroke-dashoffset, opacity; }
.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
}
.rank-emoji { font-size: 22px; line-height: 1; }

/* Info */
.rank-label { margin-bottom: 2px; }
.rank-name {
  line-height: 1.1;
  margin-bottom: var(--space-1);
}
.rank-next {
  font-size: var(--text-xs);
  color: var(--muted);
  font-family: var(--font-ui);
}
.rank-max { color: var(--accent) !important; font-weight: 700; }

/* XP bar */
.xp-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: var(--space-2);
}
.xp-label { flex: 1; }
.xp-val { font-weight: 700; }
.xp-next { font-size: var(--text-xs); color: var(--muted); }

.xp-track {
  height: 8px;
  background: var(--faint);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: var(--space-2);
  position: relative;
}

/* Fill — GSAP controla width */
.xp-fill {
  height: 100%;
  border-radius: 4px;
  width: 0%;               /* valor inicial; GSAP lo anima */
  min-width: 0;
  position: relative;
  overflow: hidden;
  will-change: width;
}

/* Shimmer wave sobre el fill */
.xp-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent        0%,
    rgba(255,255,255,0.30) 45%,
    rgba(255,255,255,0.08) 65%,
    transparent        100%
  );
  transform: translateX(-100%);
  animation: xp-shimmer 2.6s ease-in-out infinite;
}
@keyframes xp-shimmer {
  0%   { transform: translateX(-100%); }
  55%  { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}

.xp-hint {
  font-size: var(--text-xs);
  color: var(--muted);
  margin-bottom: var(--space-4);
  font-family: var(--font-ui);
}

/* Stats */
.stats-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--space-4);
}
.stat-item { flex: 1; text-align: center; }
.stat-val { color: var(--text); }
.stat-val.accent { color: var(--accent); }
.stat-label { font-size: 10px; color: var(--muted); margin-top: 2px; font-family: var(--font-ui); }
.stat-divider { width: 1px; height: 32px; background: var(--border); flex-shrink: 0; }

/* Levels map */
.levels-row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: var(--space-2);
}
.lvl-dot {
  position: relative;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--faint);
  border: 1.5px solid var(--border);
  transition: all 0.3s;
  flex-shrink: 0;
}
.lvl-dot.lvl-done {
  background: var(--lvl-color);
  border-color: var(--lvl-color);
}
.lvl-dot.lvl-current {
  width: 14px; height: 14px;
  background: var(--lvl-color);
  border-color: var(--lvl-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--lvl-color) 25%, transparent);
}
.lvl-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid var(--lvl-color);
  animation: pulse-ring 2s ease-out infinite;
}
@keyframes pulse-ring {
  0%   { opacity: 0.8; transform: scale(0.85); }
  100% { opacity: 0;   transform: scale(1.6); }
}

.lvl-labels {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 11px;
  margin-bottom: var(--space-4);
}
.lvl-label-cur  { font-weight: 700; font-family: var(--font-display); }
.lvl-label-next { color: var(--muted); font-family: var(--font-ui); }

/* Share button */
.share-rank-btn {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--faint); border: 1.5px solid var(--border);
  border-radius: var(--radius-lg); color: var(--muted);
  font-size: var(--text-sm); font-weight: 700;
  cursor: pointer; transition: var(--transition);
}
.share-rank-btn:hover { border-color: var(--accent); color: var(--accent); }
.share-rank-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.spinner-xs {
  width: 13px; height: 13px;
  border: 2px solid var(--border); border-top-color: var(--accent);
  border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
