<script setup>
import { ref, onMounted } from 'vue'
import { gsap }           from 'gsap'
import { useRankingStore } from '@/stores/ranking.store'

const emit    = defineEmits(['close'])
const ranking = useRankingStore()
const modal   = ref(null)
const stars   = ref([])

onMounted(() => {
  // Burst de estrellas
  stars.value = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x:  Math.random() * 100,
    y:  Math.random() * 100,
    s:  0.5 + Math.random() * 1,
  }))

  const tl = gsap.timeline()
  tl.fromTo(modal.value,
    { opacity: 0, scale: 0.75, y: 40 },
    { opacity: 1, scale: 1,    y: 0,  duration: 0.55, ease: 'back.out(1.8)' }
  )
  tl.fromTo('.star-el',
    { opacity: 0, scale: 0 },
    { opacity: 1, scale: 1, duration: 0.4, stagger: 0.03, ease: 'back.out(2)' },
    '-=0.3'
  )
  tl.fromTo('.levelup-emoji',
    { scale: 0.5, rotation: -20 },
    { scale: 1.15, rotation: 5, duration: 0.5, ease: 'back.out(2)' },
    '-=0.4'
  )
  tl.to('.levelup-emoji', { scale: 1, rotation: 0, duration: 0.2 })
  tl.fromTo('.levelup-title',
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0,  duration: 0.4 },
    '-=0.2'
  )
  tl.fromTo('.levelup-body',
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.35 },
    '-=0.1'
  )
  tl.fromTo('.levelup-btn',
    { opacity: 0, scale: 0.9 },
    { opacity: 1, scale: 1,   duration: 0.3, ease: 'back.out(1.5)' },
    '-=0.1'
  )
})

function close() {
  gsap.to(modal.value, {
    opacity: 0, scale: 0.85, y: 20,
    duration: 0.3, ease: 'power2.in',
    onComplete: () => { ranking.clearLevelUp(); emit('close') },
  })
}
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @click.self="close">
      <div ref="modal" class="levelup-modal">

        <!-- Stars background -->
        <div class="stars-field" aria-hidden="true">
          <span
            v-for="star in stars"
            :key="star.id"
            class="star-el"
            :style="{
              left: star.x + '%',
              top:  star.y + '%',
              fontSize: star.s + 'rem',
            }"
          >✦</span>
        </div>

        <!-- Content -->
        <div class="levelup-inner">
          <p class="levelup-label label-caps">¡Subiste de nivel!</p>
          <div
            class="levelup-emoji"
            :style="{ color: ranking.justLeveledUp?.color }"
          >
            {{ ranking.justLeveledUp?.emoji }}
          </div>
          <h2
            class="levelup-title display-lg"
            :style="{ color: ranking.justLeveledUp?.color }"
          >
            {{ ranking.justLeveledUp?.name }}
          </h2>
          <p class="levelup-body">
            Tu disciplina te llevó al siguiente nivel. Sigue así.
          </p>
          <button class="btn levelup-btn" @click="close">
            ¡Seguir adelante!
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: var(--space-4);
}

.levelup-modal {
  position: relative;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-8) var(--space-6);
  width: 100%;
  max-width: 320px;
  overflow: hidden;
  text-align: center;
}

.stars-field {
  position: absolute; inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.star-el {
  position: absolute;
  opacity: 0.15;
  animation: twinkle 3s ease-in-out infinite alternate;
}
@keyframes twinkle {
  from { opacity: 0.10; transform: scale(0.9); }
  to   { opacity: 0.30; transform: scale(1.1); }
}

.levelup-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.levelup-label { color: var(--muted); }
.levelup-emoji {
  font-size: 72px;
  line-height: 1;
  filter: drop-shadow(0 0 20px currentColor);
}
.levelup-title { line-height: 1.1; margin: 0; }
.levelup-body {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--muted);
  line-height: var(--leading-relaxed);
  max-width: 240px;
}
.levelup-btn { margin-top: var(--space-2); width: 100%; }
</style>
