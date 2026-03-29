import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

/**
 * useToast — sistema de notificaciones global
 *
 * Tipos: 'success' | 'error' | 'warning' | 'info'
 * Uso:
 *   const { toast } = useToast()
 *   toast.success('¡Guardado!')
 *   toast.error('Error al guardar')
 *   toast.show({ message: '...', type: 'success', duration: 3000 })
 */
export function useToast() {
  function show({ message, type = 'info', duration = 3200, icon = null }) {
    const id = ++nextId
    toasts.value.push({ id, message, type, icon })
    setTimeout(() => dismiss(id), duration)
    return id
  }

  function dismiss(id) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  const toast = {
    show,
    success: (message, opts = {}) => show({ message, type: 'success', icon: '✓', ...opts }),
    error:   (message, opts = {}) => show({ message, type: 'error',   icon: '✕', ...opts }),
    warning: (message, opts = {}) => show({ message, type: 'warning', icon: '⚠', ...opts }),
    info:    (message, opts = {}) => show({ message, type: 'info',    icon: 'ℹ', ...opts }),
    pr:      (exerciseName)       => show({ message: `¡Nuevo PR! ${exerciseName} 🏆`, type: 'success', icon: '🏆', duration: 4000 }),
  }

  return { toasts, toast, dismiss }
}
