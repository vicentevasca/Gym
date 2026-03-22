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

  watch(mode, (val) => {
    applyMode(val)
    localStorage.setItem('disciplina-mode', val)
  })

  function toggle() {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
  }

  const isDark = () => mode.value === 'dark'

  return { mode, toggle, isDark }
}
