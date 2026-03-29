<script setup>
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="toast-wrap" aria-live="polite" aria-atomic="false">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast"
          :class="t.type"
          role="alert"
          @click="dismiss(t.id)"
        >
          <span v-if="t.icon" class="toast-icon">{{ t.icon }}</span>
          <span class="toast-msg">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-wrap {
  position: fixed;
  top: calc(var(--header-height, 56px) + var(--safe-top, 0px) + 12px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: calc(min(100vw, 480px) - 32px);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius);
  font-size: var(--text-sm);
  font-weight: 600;
  box-shadow: var(--shadow-lg);
  pointer-events: all;
  cursor: pointer;
  backdrop-filter: blur(12px);
  border: 1px solid transparent;
  line-height: 1.4;
}

.toast.success {
  background: color-mix(in srgb, var(--success) 15%, var(--card));
  color: var(--success);
  border-color: color-mix(in srgb, var(--success) 30%, transparent);
}
.toast.error {
  background: color-mix(in srgb, var(--danger) 15%, var(--card));
  color: var(--danger);
  border-color: color-mix(in srgb, var(--danger) 30%, transparent);
}
.toast.warning {
  background: color-mix(in srgb, var(--warning) 15%, var(--card));
  color: var(--warning);
  border-color: color-mix(in srgb, var(--warning) 30%, transparent);
}
.toast.info {
  background: color-mix(in srgb, var(--accent) 12%, var(--card));
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 25%, transparent);
}

.toast-icon { font-size: 15px; flex-shrink: 0; }
.toast-msg  { flex: 1; }

/* Animaciones */
.toast-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from   { opacity: 0; transform: translateY(-12px) scale(0.96); }
.toast-leave-to     { opacity: 0; transform: translateY(-8px) scale(0.95); }
.toast-move         { transition: transform 0.25s ease; }
</style>
