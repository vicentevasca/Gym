<script setup>
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
const logo = ref(null)
onMounted(() => {
  gsap.from(logo.value, { opacity: 0, scale: 0.8, duration: 0.6, ease: 'back.out(1.4)' })
})
</script>

<template>
  <div class="loading-screen">
    <div ref="logo" class="loading-logo">
      <div class="logo-mark">D</div>
      <span class="font-display">DISCIPLINA</span>
    </div>
    <div class="loading-dots">
      <span /><span /><span />
    </div>
  </div>
</template>

<style scoped>
.loading-screen {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  background: var(--bg);
}
.loading-logo {
  display: flex; align-items: center; gap: var(--space-3);
}
.logo-mark {
  width: 48px; height: 48px;
  border-radius: var(--radius);
  background: var(--gradient-accent);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: 24px; color: #fff;
  box-shadow: var(--shadow-accent);
}
.loading-logo span {
  font-size: var(--text-2xl);
  font-weight: 300;
  letter-spacing: 0.18em;
  color: var(--text);
}
.loading-dots {
  display: flex; gap: var(--space-2);
}
.loading-dots span {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 1.2s ease-in-out infinite;
}
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes pulse {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}
</style>
