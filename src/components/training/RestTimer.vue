<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'
import { timerIn } from '@/composables/useAnimations'

const props = defineProps({ seconds: { type: Number, default: 90 } })
const emit  = defineEmits(['complete', 'skip'])

const remaining = ref(props.seconds)
const el        = ref(null)
const total     = props.seconds
let interval    = null

const dashOffset = computed(() => {
  const CIRCUMFERENCE = 2 * Math.PI * 45 // r=45
  return CIRCUMFERENCE * (1 - remaining.value / total)
})

const colorClass = computed(() => {
  const ratio = remaining.value / total
  if (ratio > 0.6) return 'green'
  if (ratio > 0.3) return 'amber'
  return 'red'
})

onMounted(() => {
  timerIn(el.value)
  navigator.vibrate?.(40)

  interval = setInterval(() => {
    remaining.value--
    if (remaining.value <= 0) {
      clearInterval(interval)
      navigator.vibrate?.([50, 30, 50])
      // Pequeño flash GSAP al terminar
      gsap.to(el.value, { scale: 1.05, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.inOut',
        onComplete: () => emit('complete')
      })
    }
  }, 1000)
})

onUnmounted(() => clearInterval(interval))

function skip() {
  clearInterval(interval)
  emit('skip')
}
</script>

<template>
  <div class="rest-overlay" @click="skip">
    <div class="rest-content" ref="el">
      <svg class="ring-svg" viewBox="0 0 100 100">
        <circle class="ring-track" cx="50" cy="50" r="45" fill="none" stroke-width="6"/>
        <circle
          class="ring-fill"
          :class="colorClass"
          cx="50" cy="50" r="45"
          fill="none" stroke-width="6"
          stroke-dasharray="282.74"
          :stroke-dashoffset="dashOffset"
          stroke-linecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div class="ring-center">
        <span class="time-num">{{ remaining }}</span>
        <span class="time-label">seg</span>
      </div>
    </div>
    <p class="rest-hint">Toca para saltar</p>
  </div>
</template>

<style scoped>
.rest-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: var(--overlay);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--space-5);
  backdrop-filter: blur(8px);
}
.rest-content { position: relative; width: 160px; height: 160px; }
.ring-svg { width: 100%; height: 100%; }
.ring-track { stroke: var(--faint); }
.ring-fill { transition: stroke-dashoffset 1s linear, stroke 0.5s; }
.ring-fill.green { stroke: var(--success); }
.ring-fill.amber { stroke: var(--warning); }
.ring-fill.red   { stroke: var(--danger); }
.ring-center {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.time-num {
  font-size: 48px; font-weight: 800; font-family: var(--font-mono);
  color: var(--text); line-height: 1;
}
.time-label { font-size: var(--text-sm); color: var(--muted); margin-top: 2px; }
.rest-hint { color: var(--muted); font-size: var(--text-sm); letter-spacing: 0.05em; }
</style>
