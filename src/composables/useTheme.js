import { ref, watch, onMounted } from 'vue'

const mode = ref('dark') // 'dark' | 'light'

function applyMode(value) {
  const root = document.documentElement
  if (value === 'light') {
    root.setAttribute('data-mode', 'light')
  } else {
    root.removeAttribute('data-mode')
  }
}

export function useTheme() {
  onMounted(() => {
    const saved = localStorage.getItem('disciplina-mode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    mode.value = saved || (prefersDark ? 'dark' : 'light')
    applyMode(mode.value)
  })

  watch(mode, async (val) => {
    applyMode(val)
    localStorage.setItem('disciplina-mode', val)
    // Persist to Firestore if user is authenticated
    try {
      const { useProfileStore } = await import('@/stores/profile.store')
      const profileStore = useProfileStore()
      await profileStore.saveMode(val)
    } catch (_) { /* not critical — localStorage is already updated */ }
  })

  function toggle() {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
  }

  // Called from App.vue after profile loads to apply the user's stored preference
  function applyFromProfile(profileMode) {
    if (profileMode && profileMode !== mode.value) {
      mode.value = profileMode
      applyMode(profileMode)
      localStorage.setItem('disciplina-mode', profileMode)
    }
  }

  const isDark = () => mode.value === 'dark'

  return { mode, toggle, isDark, applyFromProfile }
}
