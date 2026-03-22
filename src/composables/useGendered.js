/**
 * useGendered — adapta el lenguaje al género del usuario
 *
 * La app trata al usuario con su género elegido en todo momento.
 * Si no especificó género, usa formas neutras o masculinas por defecto.
 *
 * Uso:
 *   const { g, greeting, genderLabel } = useGendered()
 *   g('listo', 'lista')           → "listo" | "lista"
 *   g('cansado', 'cansada', '-e') → "-e" si prefiere_no_decir
 */
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

export function useGendered() {
  const auth   = useAuthStore()
  const gender = computed(() => auth.profile?.gender || 'masculino')

  /**
   * Retorna la forma correcta según el género.
   * @param {string} masc     forma masculina
   * @param {string} fem      forma femenina
   * @param {string} neutral  forma neutral (opcional — si no se da, usa masc)
   */
  function g(masc, fem, neutral = masc) {
    if (gender.value === 'femenino')         return fem
    if (gender.value === 'prefiero_no_decir') return neutral
    return masc
  }

  // Saludo por hora del día (invariante al género en español estándar)
  const greeting = computed(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  })

  // Bienvenida inicial
  const welcome = computed(() => g('Bienvenido', 'Bienvenida', 'Bienvenide'))

  // Textos específicos del entrenamiento
  const readyText    = computed(() => g('¡Listo para empezar!', '¡Lista para empezar!', '¡Listo/a para empezar!'))
  const doneText     = computed(() => g('¡Bien hecho!', '¡Bien hecha!', '¡Bien hecho!'))
  const motivText    = computed(() => g('Estás más fuerte que ayer.', 'Estás más fuerte que ayer.', 'Estás más fuerte que ayer.'))

  // Label del género para mostrar en perfil
  const genderLabel  = computed(() => ({
    masculino:        'Hombre',
    femenino:         'Mujer',
    prefiero_no_decir: 'Prefiero no decir',
  }[gender.value] || 'No especificado'))

  return { gender, g, greeting, welcome, readyText, doneText, motivText, genderLabel }
}
