/**
 * rewards.store.js — Sistema de recompensas personalizadas
 *
 * Arquitectura:
 * 1. El usuario responde un cuestionario de 7 categorías (0-6 por categoría)
 * 2. Por cada categoría con score > 0 se generan 3 recompensas progresivas
 * 3. El costo en puntos escala según la dificultad personal declarada
 * 4. Cuando el usuario completa un reto → gana descuento de puntos y marca como logro
 *
 * Psicología:
 * - Framing positivo: "elegí X días sin Y" (agencia) no "no consumí Y" (privación)
 * - Escalado gradual: reto corto → medio → largo (no abrumar)
 * - El costo alto = respeto al esfuerzo real que le costará a esa persona
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  doc, getDoc, setDoc, updateDoc,
  collection, addDoc, getDocs, query, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth.store'
import { toDateKey } from '@/utils/formatters'

// ── Multiplicador de dificultad por nivel (índice = score 0..6) ──────────
// Nivel 0 = categoría omitida
// Nivel 1-2 = hábito leve → recompensas económicas (accesibles)
// Nivel 5-6 = hábito fuerte → recompensas caras (respetan el esfuerzo real)
const DIFFICULTY = [0, 0.5, 0.7, 1.0, 1.4, 1.9, 2.6]

// ── Base de recompensas por categoría ────────────────────────────────────
// base = costo en puntos para alguien con nivel 3 (el punto medio)
const REWARD_CATALOG = {
  nicotina: {
    label:   'Nicotina',
    emoji:   '🚬',
    color:   '#94a3b8',
    rewards: [
      { id: 'nic_1', title: '24 horas sin nicotina',         motivacion: 'Un día es el primer dominio real.', base: 80,  days: 1  },
      { id: 'nic_2', title: '3 días sin nicotina',           motivacion: 'El cuerpo ya empieza a respirar diferente.', base: 220, days: 3  },
      { id: 'nic_3', title: 'Una semana entera sin nicotina', motivacion: 'Siete días. Tu cuerpo te lo agradece.', base: 550, days: 7  },
    ],
  },
  alcohol: {
    label:   'Alcohol',
    emoji:   '🍺',
    color:   '#f59e0b',
    rewards: [
      { id: 'alc_1', title: 'Una noche de salida sin beber',   motivacion: 'Disfrutar presente sin necesitar algo externo.', base: 60,  days: 1  },
      { id: 'alc_2', title: '5 días sin alcohol',              motivacion: 'El sueño y la energía ya lo notan.', base: 190, days: 5  },
      { id: 'alc_3', title: '2 semanas sin alcohol',           motivacion: 'Claridad mental en su versión más nítida.', base: 420, days: 14 },
    ],
  },
  contenido_erotico: {
    label:   'Contenido erótico',
    emoji:   '🔒',
    color:   '#f472b6',
    rewards: [
      { id: 'ero_1', title: '2 días sin contenido erótico',    motivacion: 'Tu atención vuelve a los momentos reales.', base: 70,  days: 2  },
      { id: 'ero_2', title: '5 días sin contenido erótico',    motivacion: 'La dopamina se resetea naturalmente.', base: 200, days: 5  },
      { id: 'ero_3', title: '10 días sin contenido erótico',   motivacion: 'Reconectas con lo que realmente te activa.', base: 450, days: 10 },
    ],
  },
  videojuegos: {
    label:   'Videojuegos',
    emoji:   '🎮',
    color:   '#818cf8',
    rewards: [
      { id: 'vg_1', title: '3 días sin videojuegos',           motivacion: 'Espacio para algo que siempre postergabas.', base: 50,  days: 3  },
      { id: 'vg_2', title: '1 semana sin videojuegos',         motivacion: '¿Qué hay fuera de la pantalla?', base: 160, days: 7  },
      { id: 'vg_3', title: '2 semanas (máx. 1h/día)',          motivacion: 'Disfrutar con intención, no por inercia.', base: 320, days: 14 },
    ],
  },
  sustancias: {
    label:   'Sustancias',
    emoji:   '🌿',
    color:   '#34d399',
    rewards: [
      { id: 'sus_1', title: '1 semana sin sustancias',         motivacion: 'Tu mente descansa en su estado base.', base: 160, days: 7  },
      { id: 'sus_2', title: '2 semanas sin sustancias',        motivacion: 'La claridad no tiene precio.', base: 420, days: 14 },
      { id: 'sus_3', title: '1 mes sin sustancias',            motivacion: 'Treinta días de presencia total.', base: 1100, days: 30 },
    ],
  },
  redes_sociales: {
    label:   'Redes sociales',
    emoji:   '📱',
    color:   '#60a5fa',
    rewards: [
      { id: 'rs_1', title: '1 día sin redes sociales',         motivacion: '24 horas de atención plena y real.', base: 40,  days: 1  },
      { id: 'rs_2', title: '3 días con máx. 15 min de redes',  motivacion: 'Consume con intención, no por ansiedad.', base: 110, days: 3  },
      { id: 'rs_3', title: '1 semana con límite de 30 min/día',motivacion: 'Tú controlas la app, no al revés.', base: 280, days: 7  },
    ],
  },
  alimentacion: {
    label:   'Alimentación impulsiva',
    emoji:   '🍬',
    color:   '#fb923c',
    rewards: [
      { id: 'ali_1', title: '3 días sin azúcar añadida',       motivacion: 'El primer paso hacia comer con conciencia.', base: 60,  days: 3  },
      { id: 'ali_2', title: '1 semana sin ultraprocesados',     motivacion: 'Tu digestión y energía lo agradecen.', base: 190, days: 7  },
      { id: 'ali_3', title: '2 semanas de alimentación limpia', motivacion: 'Disciplina en el plato, fuerza en el gym.', base: 420, days: 14 },
    ],
  },
}

// ── Preguntas del cuestionario ────────────────────────────────────────────
// normalizer: texto que reduce la vergüenza antes de la pregunta
// question_m / question_f: versión masculina y femenina
// labels: etiquetas de la escala (índice 0-5 = nivel 1-6)
export const QUESTIONNAIRE = [
  {
    id:          'nicotina',
    icon:        '🚬',
    title:       'Nicotina',
    normalizer:  'El tabaco y el vape son algunos de los hábitos más comunes hoy en día. Sin juicios, solo queremos entenderte mejor.',
    question_m:  '¿Con qué frecuencia consumes cigarrillos, vapeadores u otros productos con nicotina?',
    question_f:  '¿Con qué frecuencia consumes cigarrillos, vapeadores u otros productos con nicotina?',
    skip_label:  'No consumo nicotina',
    labels:      ['Casi nunca', 'Alguna vez', 'A veces', 'Bastante seguido', 'A diario', 'Varias veces al día'],
  },
  {
    id:          'alcohol',
    icon:        '🍺',
    title:       'Alcohol',
    normalizer:  'Tomar algo forma parte de muchos momentos sociales. Solo queremos entender tu relación personal con el alcohol.',
    question_m:  '¿Con qué frecuencia eliges beber alcohol en tu semana?',
    question_f:  '¿Con qué frecuencia eliges beber alcohol en tu semana?',
    skip_label:  'No bebo alcohol',
    labels:      ['Raramente', 'Una vez al mes', 'Algunos fines de semana', 'Casi todos los fines de semana', 'Varias veces por semana', 'Casi a diario'],
  },
  {
    id:          'contenido_erotico',
    icon:        '🔒',
    title:       'Contenido erótico',
    normalizer:  'El interés por el contenido erótico es completamente natural. Esta pregunta es solo para personalizar tu experiencia — nunca se comparte.',
    question_m:  '¿Con qué frecuencia e intensidad buscas contenido erótico en internet?',
    question_f:  '¿Con qué frecuencia consumes contenido erótico o sensual en internet?',
    skip_label:  'No aplica para mí',
    labels:      ['Raramente', 'De vez en cuando', 'Con cierta frecuencia', 'Bastante seguido', 'Con mucha frecuencia', 'Frecuente e intenso'],
  },
  {
    id:          'videojuegos',
    icon:        '🎮',
    title:       'Videojuegos',
    normalizer:  'Los juegos son una forma válida de desconectar. ¿Cuánto espacio ocupan en tu semana en este momento?',
    question_m:  '¿Cuántas veces a la semana juegas durante 2 o más horas seguidas?',
    question_f:  '¿Cuántas veces a la semana juegas durante 2 o más horas seguidas?',
    skip_label:  'No juego videojuegos',
    labels:      ['Casi nunca', 'Una vez al mes', '1-2 veces por semana', '3-4 veces por semana', '5-6 veces por semana', 'Todos los días'],
  },
  {
    id:          'sustancias',
    icon:        '🌿',
    title:       'Sustancias recreativas',
    normalizer:  'Esta pregunta es completamente privada y confidencial. Tus datos nunca se comparten con nadie. No hay respuestas incorrectas.',
    question_m:  '¿Con qué frecuencia consumes sustancias recreativas más allá del alcohol o tabaco?',
    question_f:  '¿Con qué frecuencia consumes sustancias recreativas más allá del alcohol o tabaco?',
    note:        'Cannabis, pastillas u otras sustancias — sin ningún tipo de juicio.',
    skip_label:  'No consumo sustancias',
    labels:      ['Nunca', 'Una o dos veces', 'Ocasionalmente', 'Algunos fines de semana', 'Varias veces por semana', 'Con mucha frecuencia'],
  },
  {
    id:          'redes_sociales',
    icon:        '📱',
    title:       'Redes sociales',
    normalizer:  'El scroll automático es uno de los hábitos más difíciles de notar porque es muy sutil. ¿Cómo te llevas con las redes?',
    question_m:  '¿Con qué frecuencia revisas redes sociales sin un propósito concreto?',
    question_f:  '¿Con qué frecuencia revisas redes sociales sin un propósito concreto?',
    skip_label:  'Las uso con moderación',
    labels:      ['Con control', 'Pocas veces al día', 'Varias veces al día', 'Bastante seguido', 'Con mucha frecuencia', 'Constantemente'],
  },
  {
    id:          'alimentacion',
    icon:        '🍬',
    title:       'Alimentación impulsiva',
    normalizer:  'El antojo de dulce o snacks es una respuesta biológica totalmente normal, especialmente bajo estrés. ¿Cómo es tu relación con esto?',
    question_m:  '¿Con qué frecuencia comes dulces, snacks o comida procesada aunque no tengas hambre real?',
    question_f:  '¿Con qué frecuencia comes dulces, snacks o comida procesada aunque no tengas hambre real?',
    skip_label:  'Casi no lo hago',
    labels:      ['Raramente', 'Alguna vez por semana', 'Algunas veces', 'Bastante seguido', 'La mayoría de días', 'Varias veces al día'],
  },
]

// ── Store ─────────────────────────────────────────────────────────────────

export const useRewardsStore = defineStore('rewards', () => {
  const auth = useAuthStore()

  const questionnaire       = ref(null)   // respuestas guardadas { categoryId: score }
  const personalizedRewards = ref([])     // recompensas generadas para este usuario
  const activeRewards       = ref([])     // retos en curso
  const completedRewards    = ref([])     // retos completados
  const loading             = ref(false)

  const questionnaireCompleted = computed(() => !!questionnaire.value)

  // ── Carga del perfil de recompensas ──────────────────────────────────

  async function loadRewardsProfile() {
    if (!auth.uid) return
    loading.value = true
    try {
      const snap = await getDoc(doc(db, 'users', auth.uid, 'rewards', 'profile'))
      if (snap.exists()) {
        const data = snap.data()
        questionnaire.value       = data.questionnaire ?? null
        personalizedRewards.value = data.personalized_rewards ?? []
      }
      await loadActiveRewards()
      await loadCompletedRewards()
    } finally {
      loading.value = false
    }
  }

  // ── Guardar cuestionario + generar recompensas ────────────────────────

  async function saveQuestionnaire(answers) {
    if (!auth.uid) return
    questionnaire.value = answers

    // Generar recompensas personalizadas
    const rewards = generatePersonalizedRewards(answers)
    personalizedRewards.value = rewards

    await setDoc(doc(db, 'users', auth.uid, 'rewards', 'profile'), {
      questionnaire:       answers,
      personalized_rewards: rewards,
      created_at:          serverTimestamp(),
    })
  }

  // ── Algoritmo de personalización ─────────────────────────────────────

  function generatePersonalizedRewards(answers) {
    const rewards = []
    for (const [categoryId, score] of Object.entries(answers)) {
      if (!score || score === 0) continue  // omitida
      const catalog = REWARD_CATALOG[categoryId]
      if (!catalog) continue
      const mult = DIFFICULTY[score] ?? 1.0
      catalog.rewards.forEach(r => {
        rewards.push({
          ...r,
          category_id:   categoryId,
          category_label: catalog.label,
          category_emoji: catalog.emoji,
          category_color: catalog.color,
          cost:           Math.round(r.base * mult),
          difficulty_score: score,
          status:         'available',   // available | active | completed
        })
      })
    }
    return rewards
  }

  // ── Iniciar un reto ───────────────────────────────────────────────────

  async function startChallenge(rewardId) {
    if (!auth.uid) return
    const reward = personalizedRewards.value.find(r => r.id === rewardId)
    if (!reward) return

    const startDate = toDateKey()
    const endDate   = new Date()
    endDate.setDate(endDate.getDate() + reward.days)
    const endDateKey = endDate.toISOString().slice(0, 10)

    const challenge = {
      reward_id:      rewardId,
      reward_title:   reward.title,
      category_id:    reward.category_id,
      category_emoji: reward.category_emoji,
      cost:           reward.cost,
      days:           reward.days,
      start_date:     startDate,
      end_date:       endDateKey,
      status:         'active',
      started_at:     serverTimestamp(),
    }

    await addDoc(collection(db, 'users', auth.uid, 'reward_challenges'), challenge)
    await loadActiveRewards()
  }

  // ── Completar un reto ─────────────────────────────────────────────────

  async function completeChallenge(challengeDocId, pointsStore) {
    if (!auth.uid) return
    const ref = doc(db, 'users', auth.uid, 'reward_challenges', challengeDocId)

    // Leer el costo directamente desde Firestore para garantizar que
    // los puntos se otorgan incluso si activeRewards no está en memoria
    const snap = await getDoc(ref)
    if (!snap.exists()) return
    const challengeData = snap.data()

    await updateDoc(ref, {
      status:       'completed',
      completed_at: serverTimestamp(),
    })

    if (pointsStore && challengeData.cost > 0) {
      await pointsStore.earnPoints('reward_completed', challengeData.cost)
    }

    await loadActiveRewards()
    await loadCompletedRewards()
  }

  // ── Carga de retos activos y completados ─────────────────────────────

  async function loadActiveRewards() {
    if (!auth.uid) return
    const q    = query(collection(db, 'users', auth.uid, 'reward_challenges'))
    const snap = await getDocs(q)
    const all  = snap.docs.map(d => ({ docId: d.id, ...d.data() }))
    activeRewards.value    = all.filter(c => c.status === 'active')
    completedRewards.value = all.filter(c => c.status === 'completed')
  }

  async function loadCompletedRewards() {
    // Ya se carga en loadActiveRewards — alias por claridad
  }

  // ── Reset del cuestionario (para re-hacer) ────────────────────────────

  async function resetQuestionnaire() {
    if (!auth.uid) return
    await setDoc(doc(db, 'users', auth.uid, 'rewards', 'profile'), {
      questionnaire: null, personalized_rewards: [], reset_at: serverTimestamp(),
    })
    questionnaire.value       = null
    personalizedRewards.value = []
  }

  // ── Agrupar recompensas por categoría ────────────────────────────────

  const rewardsByCategory = computed(() => {
    const groups = {}
    personalizedRewards.value.forEach(r => {
      if (!groups[r.category_id]) {
        groups[r.category_id] = {
          id:     r.category_id,
          label:  r.category_label,
          emoji:  r.category_emoji,
          color:  r.category_color,
          rewards: [],
        }
      }
      // Agregar estado actual (¿hay reto activo para este reward?)
      const isActive    = activeRewards.value.some(c => c.reward_id === r.id && c.status === 'active')
      const isCompleted = completedRewards.value.some(c => c.reward_id === r.id)
      groups[r.category_id].rewards.push({
        ...r,
        isActive,
        isCompleted,
        activeChallenge: activeRewards.value.find(c => c.reward_id === r.id),
      })
    })
    return Object.values(groups)
  })

  function clearState() {
    questionnaire.value       = null
    personalizedRewards.value = []
    activeRewards.value       = []
    completedRewards.value    = []
    loading.value             = false
  }

  return {
    questionnaire, questionnaireCompleted, personalizedRewards,
    activeRewards, completedRewards, rewardsByCategory, loading,
    loadRewardsProfile, saveQuestionnaire, startChallenge,
    completeChallenge, resetQuestionnaire, clearState,
  }
})
