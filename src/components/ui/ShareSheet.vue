<script setup>
import { ref, onMounted } from 'vue'
import { gsap }            from 'gsap'
import { useShareCard }    from '@/composables/useShareCard'

/**
 * ShareSheet — bottom sheet para elegir qué compartir.
 *
 * Props:
 *  - options: Array<{ id, icon, label, fn: async () => void }>
 *
 * Emits:
 *  - close
 */
const props = defineProps({
  options: { type: Array, required: true },
})
const emit = defineEmits(['close'])

const overlayEl = ref(null)
const sheetEl   = ref(null)
const loadingId = ref(null)

onMounted(() => {
  gsap.from(overlayEl.value, { opacity: 0, duration: 0.2, ease: 'power2.out' })
  gsap.from(sheetEl.value,   { y: 80, opacity: 0, duration: 0.28, ease: 'power3.out', delay: 0.04 })
})

function close() {
  const tl = gsap.timeline({ onComplete: () => emit('close') })
  tl.to(sheetEl.value,   { y: 60, opacity: 0, duration: 0.16, ease: 'power2.in' })
  tl.to(overlayEl.value, { opacity: 0, duration: 0.12, ease: 'power2.in' }, '-=0.08')
}

async function handleOption(opt) {
  if (loadingId.value) return
  loadingId.value = opt.id
  try {
    await opt.fn()
  } finally {
    loadingId.value = null
    close()
  }
}
</script>

<template>
  <Teleport to="body">
    <div ref="overlayEl" class="share-overlay" @click.self="close">
      <div ref="sheetEl" class="share-sheet">

        <div class="share-handle" />

        <div class="share-header">
          <p class="share-title label-caps">Compartir</p>
          <button type="button" class="share-close" @click="close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="share-options">
          <button
            v-for="opt in options"
            :key="opt.id"
            type="button"
            class="share-opt"
            :disabled="!!loadingId"
            @click="handleOption(opt)"
          >
            <div class="share-opt-icon">
              <span v-if="loadingId !== opt.id">{{ opt.icon }}</span>
              <div v-else class="spinner-sm" />
            </div>
            <span class="share-opt-label">{{ opt.label }}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="share-arrow">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
        </div>

        <p class="share-hint">Genera una imagen para compartir en redes sociales</p>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.share-overlay {
  position: fixed; inset: 0; z-index: 250;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: flex-end;
}
.share-sheet {
  width: 100%; max-width: 480px; margin: 0 auto;
  background: var(--surface);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding-bottom: calc(var(--safe-bottom) + var(--space-4));
  overflow: hidden;
}
.share-handle {
  width: 40px; height: 4px; background: var(--border-hi);
  border-radius: 2px; margin: var(--space-3) auto var(--space-1);
}
.share-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-2) var(--space-5) var(--space-4);
  border-bottom: 1px solid var(--faint);
}
.share-title { color: var(--accent); }
.share-close {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--faint); border: none; color: var(--muted);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: var(--transition);
}
.share-close:hover { background: var(--border); color: var(--text); }

.share-options {
  display: flex; flex-direction: column;
  padding: var(--space-3) var(--space-4);
  gap: var(--space-2);
}
.share-opt {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-4) var(--space-3);
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); cursor: pointer;
  transition: var(--transition); text-align: left;
  color: var(--text);
}
.share-opt:not(:disabled):hover { border-color: var(--accent); }
.share-opt:disabled { opacity: 0.6; cursor: not-allowed; }
.share-opt-icon {
  width: 40px; height: 40px; border-radius: var(--radius-md);
  background: var(--accent-dim);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; flex-shrink: 0;
}
.share-opt-label {
  flex: 1; font-size: var(--text-sm); font-weight: 700; color: var(--text);
}
.share-arrow { color: var(--muted); flex-shrink: 0; }

.share-hint {
  font-size: var(--text-xs); color: var(--muted);
  text-align: center; padding: 0 var(--space-5) var(--space-2);
}

.spinner-sm {
  width: 20px; height: 20px;
  border: 2px solid var(--border); border-top-color: var(--accent);
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
