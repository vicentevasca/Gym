<script setup>
import { ref, onMounted } from 'vue'
import { gsap }           from 'gsap'
import { verseReveal }    from '@/composables/useAnimations'
import { useVerseStore }  from '@/stores/verse.store'

const emit  = defineEmits(['close'])
const store = useVerseStore()

const el        = ref(null)
const saved     = ref(store.verse?.saved ?? false)
const saving    = ref(false)

onMounted(() => {
  verseReveal(el.value)
  store.markShown()
})

async function save() {
  if (saving.value || saved.value) return
  saving.value = true
  await store.saveVerse()
  saved.value  = true
  saving.value = false
  // Pulse animation on save button
  gsap.to('.save-btn', { scale: 1.2, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.inOut' })
}

function close() {
  gsap.to(el.value, { opacity: 0, y: -20, duration: 0.3, onComplete: () => emit('close') })
}
</script>

<template>
  <div class="verse-overlay">
    <div class="verse-content" ref="el">
      <!-- Close -->
      <button class="verse-close" @click="close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      <!-- Label -->
      <p class="verse-eyebrow label-caps">Tu verso del día</p>

      <!-- Main verse text -->
      <div class="verse-text">
        <p v-for="(line, i) in store.verse?.verse_text?.split('\n')" :key="i" class="verse-line" :class="{ 'verse-blank': !line }">
          {{ line || '&nbsp;' }}
        </p>
      </div>

      <!-- Divider -->
      <div class="verse-divider" />

      <!-- Tao fragment -->
      <blockquote class="tao-fragment" v-if="store.verse?.tao_fragment">
        {{ store.verse.tao_fragment }}
        <cite class="tao-source">{{ store.verse.tao_source }}</cite>
      </blockquote>

      <!-- Actions -->
      <div class="verse-actions">
        <button
          class="btn save-btn"
          :class="saved ? 'btn-ghost saved' : 'btn-ghost'"
          :disabled="saved || saving"
          @click="save"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          {{ saved ? 'Guardado' : (saving ? '…' : 'Guardar') }}
        </button>
        <button class="btn btn-primary" @click="close">
          Comenzar el día
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.verse-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: var(--bg);
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-6) var(--space-5);
}
.verse-content {
  width: 100%; max-width: 480px;
  display: flex; flex-direction: column; gap: var(--space-5);
}

.verse-close {
  align-self: flex-end; background: none; border: none;
  color: var(--muted); cursor: pointer; padding: 4px;
}
.verse-close:hover { color: var(--text); }

.verse-eyebrow { color: var(--accent); }

.verse-text { display: flex; flex-direction: column; gap: var(--space-1); }
.verse-line {
  /* Lora: el cambio de fuente señala al cerebro que es momento de reflexión */
  font-family: var(--font-verse);
  font-size: var(--text-lg);
  font-weight: 400;
  line-height: var(--leading-loose);
  letter-spacing: 0.01em;
  color: var(--text);
}
.verse-blank { height: var(--space-3); }

.verse-divider { height: 1px; background: var(--border); }

.tao-fragment {
  font-family: var(--font-verse);
  font-size: var(--text-base);
  font-style: italic;
  font-weight: 400;
  color: var(--muted);
  line-height: var(--leading-relaxed);
  border-left: 3px solid var(--accent);
  padding-left: var(--space-4);
}
.tao-source {
  display: block;
  font-family: var(--font-ui);       /* vuelve a sans-serif: regresa al mundo */
  font-size: var(--text-xs);
  font-style: normal;
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  margin-top: var(--space-2);
  color: var(--muted);
}

.verse-actions { display: flex; gap: var(--space-3); }
.verse-actions .btn { flex: 1; }
.save-btn.saved { color: var(--success); border-color: var(--success); }
</style>
