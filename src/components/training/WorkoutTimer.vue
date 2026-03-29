<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  exercise:  { type: Object, required: true },
  setIndex:  { type: Number, required: true },  // 0-based index being started
  totalSets: { type: Number, required: true },
})

const emit = defineEmits(['set-done', 'rest-done', 'close'])

// ── Phase ───────────────────────────────────────────────────────
// 'active' → 'rest' → 'done'
const phase         = ref('active')
const seconds       = ref(0)
const totalSeconds  = ref(0)
const setsCompleted = ref(props.setIndex)  // sets done before this one

// ── Floating emojis ─────────────────────────────────────────────
const EMOJIS = ['💪', '🔥', '⚡', '🎯', '👊', '🏆', '✨', '💯']
const floatingEmojis = ref([])
let emojiId = 0

function burstEmojis() {
  const burst = Array.from({ length: 6 }, () => ({
    id: emojiId++,
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    x: 10 + Math.random() * 80,
    delay: Math.random() * 0.5,
  }))
  floatingEmojis.value.push(...burst)
  setTimeout(() => {
    const burstIds = new Set(burst.map(b => b.id))
    floatingEmojis.value = floatingEmojis.value.filter(e => !burstIds.has(e.id))
  }, 1600)
}

// ── Timer ────────────────────────────────────────────────────────
let timer = null

function startTimer(duration) {
  clearTimer()
  totalSeconds.value = duration
  seconds.value = duration
  timer = setInterval(() => {
    seconds.value--
    if (seconds.value <= 0) {
      clearTimer()
      if (phase.value === 'active') {
        onActiveEnd()
      } else {
        onRestEnd()
      }
    }
  }, 1000)
}

function clearTimer() {
  if (timer) { clearInterval(timer); timer = null }
}

function onActiveEnd() {
  setsCompleted.value = props.setIndex + 1
  burstEmojis()
  emit('set-done')
  navigator.vibrate?.([30, 20, 50])

  const restSec = props.exercise.rest_sec || 60
  if (restSec > 0) {
    phase.value = 'rest'
    startTimer(restSec)
  } else {
    onRestEnd()
  }
}

function onRestEnd() {
  phase.value = 'done'
  emit('rest-done')
  navigator.vibrate?.([20])
  setTimeout(() => emit('close'), 500)
}

function skipActive() {
  clearTimer()
  onActiveEnd()
}

function skipRest() {
  clearTimer()
  onRestEnd()
}

onMounted(() => {
  const isTimeBased = ['duration', 'hold', 'breathing'].includes(props.exercise.exercise_type)
  const activeDuration = isTimeBased
    ? (props.exercise.default_duration_sec || 30)
    : 30
  startTimer(activeDuration)
  navigator.vibrate?.([10])
})

onUnmounted(clearTimer)

// ── Ring SVG ─────────────────────────────────────────────────────
const RADIUS = 90
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const ringProgress = computed(() =>
  totalSeconds.value === 0 ? 0 : seconds.value / totalSeconds.value
)
const dashOffset = computed(() => CIRCUMFERENCE * (1 - ringProgress.value))

const ringColor = computed(() => {
  if (phase.value === 'rest') return '#f59e0b'
  if (seconds.value <= 5) return '#ef4444'
  return 'var(--accent)'
})

// ── Format ───────────────────────────────────────────────────────
function fmt(s) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return m > 0 ? `${m}:${r.toString().padStart(2, '0')}` : `${r}`
}
</script>

<template>
  <Teleport to="body">
    <div class="wt-bg">

      <!-- Floating emojis layer -->
      <div class="emoji-layer" aria-hidden="true">
        <span
          v-for="e in floatingEmojis"
          :key="e.id"
          class="float-emoji"
          :style="{ left: e.x + '%', animationDelay: e.delay + 's' }"
        >{{ e.emoji }}</span>
      </div>

      <div class="wt-inner">

        <!-- Phase label -->
        <p class="wt-phase label-caps" :class="phase">
          {{ phase === 'active' ? 'Serie activa' : phase === 'rest' ? 'Descanso' : '¡Listo!' }}
        </p>

        <!-- Exercise name -->
        <h2 class="wt-name">{{ exercise.name }}</h2>

        <!-- Ring -->
        <div class="ring-wrap">
          <svg viewBox="0 0 220 220" width="220" height="220" class="ring-svg">
            <circle cx="110" cy="110" :r="RADIUS" fill="none" stroke="var(--faint)" stroke-width="8" />
            <circle
              cx="110" cy="110" :r="RADIUS"
              fill="none"
              :stroke="ringColor"
              stroke-width="10"
              stroke-linecap="round"
              :stroke-dasharray="CIRCUMFERENCE"
              :stroke-dashoffset="dashOffset"
              transform="rotate(-90 110 110)"
              style="transition: stroke-dashoffset 1s linear, stroke 0.3s ease"
            />
          </svg>
          <div class="ring-center">
            <span class="wt-count" :class="{ warn: seconds <= 5 && seconds > 0, done: phase === 'done' }">
              {{ phase === 'done' ? '✓' : fmt(seconds) }}
            </span>
            <span class="wt-unit">
              {{ phase === 'active' ? 'seg' : phase === 'rest' ? 'descanso' : '' }}
            </span>
          </div>
        </div>

        <!-- Set counter dots -->
        <div class="sets-row">
          <span
            v-for="n in totalSets"
            :key="n"
            class="set-dot"
            :class="{
              done:    n <= setsCompleted,
              current: n === setsCompleted + 1,
            }"
          />
          <span class="sets-label">{{ setsCompleted }}/{{ totalSets }} series</span>
        </div>

        <!-- Skip -->
        <button
          v-if="phase !== 'done'"
          class="wt-skip"
          @click="phase === 'active' ? skipActive() : skipRest()"
        >
          {{ phase === 'active' ? 'Saltar → Descanso' : 'Saltar descanso' }}
        </button>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.wt-bg {
  position: fixed; inset: 0; z-index: 300;
  background: var(--surface);
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-8) var(--space-6);
  animation: fade-in 0.2s ease;
}
@keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }

/* ── Emojis ─────────────────────────────────────────── */
.emoji-layer {
  position: absolute; inset: 0; pointer-events: none; overflow: hidden;
}
.float-emoji {
  position: absolute; bottom: 35%;
  font-size: 30px; line-height: 1;
  animation: rise 1.5s ease-out forwards;
}
@keyframes rise {
  0%   { transform: translateY(0)    scale(0.4); opacity: 1; }
  55%  { transform: translateY(-150px) scale(1.3); opacity: 1; }
  100% { transform: translateY(-260px) scale(0.7); opacity: 0; }
}

/* ── Inner ──────────────────────────────────────────── */
.wt-inner {
  display: flex; flex-direction: column; align-items: center;
  gap: var(--space-4); width: 100%; max-width: 340px;
  text-align: center; position: relative; z-index: 1;
}

.wt-phase {
  letter-spacing: 0.14em; font-size: var(--text-xs);
  transition: color 0.3s;
}
.wt-phase.active  { color: var(--accent); }
.wt-phase.rest    { color: #f59e0b; }
.wt-phase.done    { color: var(--success); }

.wt-name {
  font-family: var(--font-display);
  font-size: var(--text-lg); font-weight: 700;
  color: var(--text); line-height: 1.3;
  max-width: 280px;
}

/* ── Ring ───────────────────────────────────────────── */
.ring-wrap {
  position: relative; width: 220px; height: 220px;
  display: flex; align-items: center; justify-content: center;
}
.ring-svg { position: absolute; inset: 0; }
.ring-center {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.wt-count {
  font-family: var(--font-mono);
  font-size: 68px; font-weight: 800;
  color: var(--text); line-height: 1;
  letter-spacing: -0.03em;
  transition: color 0.2s;
}
.wt-count.warn { color: #ef4444; }
.wt-count.done { color: var(--success); font-size: 56px; }
.wt-unit {
  font-size: 10px; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--muted); font-weight: 700;
}

/* ── Set dots ───────────────────────────────────────── */
.sets-row {
  display: flex; align-items: center; gap: var(--space-2);
  flex-wrap: wrap; justify-content: center;
}
.set-dot {
  width: 11px; height: 11px; border-radius: 50%;
  background: var(--faint); border: 1.5px solid var(--border);
  transition: all 0.35s ease;
  flex-shrink: 0;
}
.set-dot.done    { background: var(--accent); border-color: var(--accent); }
.set-dot.current {
  background: transparent; border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
  transform: scale(1.2);
}
.sets-label {
  font-family: var(--font-mono); font-size: var(--text-sm); font-weight: 700;
  color: var(--text); margin-left: var(--space-1);
}

/* ── Skip ───────────────────────────────────────────── */
.wt-skip {
  background: transparent;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-full);
  padding: var(--space-2) var(--space-6);
  color: var(--muted); font-size: var(--text-sm); font-weight: 600;
  cursor: pointer; transition: var(--transition);
  margin-top: var(--space-2);
}
.wt-skip:hover { border-color: var(--accent); color: var(--accent); }
</style>
