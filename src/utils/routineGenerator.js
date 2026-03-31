/**
 * DISCIPLINA — Generador de rutinas inteligente
 * Crea planes semanales personalizados según el perfil del usuario.
 */

import { EXERCISES, EXERCISES_BY_ID, getByCategory, getBySpecialTag } from '@/data/exercises'

// ─────────────────────────────────────────────────────────────────
// CONSTANTES EXPORTADAS PARA LA UI DEL WIZARD
// ─────────────────────────────────────────────────────────────────

export const STYLES = [
  { id: 'hipertrofia', label: 'Hipertrofia', icon: '💪', description: 'Pesas y máquinas para ganar músculo' },
  { id: 'fuerza',      label: 'Fuerza',      icon: '🏋️', description: 'Levantamiento olímpico y powerlifting' },
  { id: 'calistenia',  label: 'Calistenia',  icon: '🤸', description: 'Movimientos con tu propio peso' },
  { id: 'yoga',        label: 'Yoga',        icon: '🧘', description: 'Flexibilidad, respiración y mindfulness' },
  { id: 'pilates',     label: 'Pilates',     icon: '🩺', description: 'Core y corrección postural' },
  { id: 'cardio',      label: 'Cardio',      icon: '🏃', description: 'Resistencia y salud cardiovascular' },
  { id: 'hiit',        label: 'HIIT',        icon: '⚡', description: 'Intervalos de alta intensidad' },
  { id: 'híbrido',     label: 'Híbrido',     icon: '🔀', description: 'Combina varios estilos' },
  { id: 'terapéutico', label: 'Terapéutico', icon: '🩹', description: 'Programas de salud especializados' },
]

export const GOALS = [
  { id: 'perder_grasa',    label: 'Perder grasa',           icon: '🔥' },
  { id: 'ganar_musculo',   label: 'Ganar músculo',          icon: '💪' },
  { id: 'mejorar_condicion', label: 'Mejorar condición',    icon: '⚡' },
  { id: 'flexibilidad',    label: 'Flexibilidad y movilidad', icon: '🤸' },
  { id: 'salud_general',   label: 'Salud general',          icon: '❤️' },
  { id: 'fuerza_maxima',   label: 'Fuerza máxima',          icon: '🏆' },
]

export const SPECIAL_PROGRAMS = [
  { id: 'salud_pulmonar', label: 'Salud pulmonar',    icon: '🫁', description: 'Para fumadores o con problemas respiratorios' },
  { id: 'salud_sexual',   label: 'Mejorar vida sexual', icon: '❤️', description: 'Suelo pélvico, circulación y vitalidad' },
  { id: 'dolor_espalda',  label: 'Dolor de espalda',  icon: '🦴', description: 'Protocolo McKenzie y core estabilizador' },
  { id: 'postura',        label: 'Corrección postural', icon: '🪑', description: 'Corrección de síndrome cruzado superior' },
  { id: 'estres',         label: 'Manejo del estrés',  icon: '🧠', description: 'Respiración y técnicas de relajación' },
  { id: 'sueño',          label: 'Mejorar sueño',      icon: '😴', description: 'Rutina pre-sueño y yoga nidra' },
  { id: 'movilidad',      label: 'Movilidad articular', icon: '🦵', description: 'CAR y estiramientos funcionales' },
]

// ─────────────────────────────────────────────────────────────────
// CONFIGURACIONES POR EXPERIENCIA
// ─────────────────────────────────────────────────────────────────

const EXPERIENCE_CONFIG = {
  principiante: {
    sets_multiplier: 0.75,  // 2-3 sets
    min_sets: 2,
    max_sets: 3,
    exercises_per_session: 4,
    rest_multiplier: 1.25,
    weight_multiplier: 0.7,
  },
  intermedio: {
    sets_multiplier: 1.0,
    min_sets: 3,
    max_sets: 4,
    exercises_per_session: 6,
    rest_multiplier: 1.0,
    weight_multiplier: 1.0,
  },
  avanzado: {
    sets_multiplier: 1.25,
    min_sets: 4,
    max_sets: 5,
    exercises_per_session: 8,
    rest_multiplier: 0.85,
    weight_multiplier: 1.2,
  },
}

// ─────────────────────────────────────────────────────────────────
// SPLITS POR ESTILO Y DÍAS/SEMANA
// ─────────────────────────────────────────────────────────────────

function getWeeklyPlan(style, days_per_week) {
  // Retorna array[7] con descripciones de sesiones (null = descanso)
  // Índice 0=Domingo, 1=Lunes ... 6=Sábado

  const plans = {
    hipertrofia: {
      3: [null, { key:'push', label:'PUSH', name:'Empuje — Pecho y Tríceps', muscles:'Pecho, Hombros, Tríceps', subcats:['empuje'] },
              null, { key:'pull', label:'PULL', name:'Tirón — Espalda y Bíceps', muscles:'Espalda, Bíceps', subcats:['tiron'] },
              null, { key:'legs', label:'LEGS', name:'Piernas y Glúteos', muscles:'Cuádriceps, Isquios, Glúteos', subcats:['piernas'] },
              null],
      4: [null, { key:'upper', label:'UPPER', name:'Superior A', muscles:'Pecho, Espalda, Hombros', subcats:['empuje','tiron'] },
              { key:'lower', label:'LOWER', name:'Inferior A', muscles:'Cuádriceps, Isquios, Glúteos', subcats:['piernas'] },
              null,
              { key:'upper2', label:'UPPER', name:'Superior B', muscles:'Pecho, Espalda, Brazos', subcats:['empuje','tiron'] },
              { key:'lower2', label:'LOWER', name:'Inferior B', muscles:'Piernas, Pantorrillas, Core', subcats:['piernas'] },
              null],
      5: [null, { key:'push', label:'PUSH', name:'Empuje A', muscles:'Pecho, Hombros, Tríceps', subcats:['empuje'] },
              { key:'pull', label:'PULL', name:'Tirón A', muscles:'Espalda, Bíceps', subcats:['tiron'] },
              { key:'legs', label:'LEGS', name:'Piernas', muscles:'Cuádriceps, Isquios, Glúteos', subcats:['piernas'] },
              { key:'push2', label:'PUSH', name:'Empuje B', muscles:'Pecho, Hombros, Tríceps', subcats:['empuje'] },
              { key:'pull2', label:'PULL', name:'Tirón B', muscles:'Espalda, Bíceps, Core', subcats:['tiron'] },
              null],
      6: [null, { key:'push', label:'PUSH', name:'Empuje A', muscles:'Pecho, Hombros, Tríceps', subcats:['empuje'] },
              { key:'pull', label:'PULL', name:'Tirón A', muscles:'Espalda, Bíceps', subcats:['tiron'] },
              { key:'legs', label:'LEGS', name:'Piernas A', muscles:'Cuádriceps, Glúteos', subcats:['piernas'] },
              { key:'push2', label:'PUSH', name:'Empuje B', muscles:'Pecho inclinado, Hombros', subcats:['empuje'] },
              { key:'pull2', label:'PULL', name:'Tirón B', muscles:'Espalda, Brazos', subcats:['tiron'] },
              { key:'legs2', label:'LEGS', name:'Piernas B', muscles:'Isquios, Glúteos, Pantorrillas', subcats:['piernas'] }],
      2: [null, { key:'full', label:'FULL', name:'Full Body A', muscles:'Todo el cuerpo', subcats:['empuje','tiron','piernas'] },
              null, null,
              { key:'full2', label:'FULL', name:'Full Body B', muscles:'Todo el cuerpo', subcats:['empuje','tiron','piernas'] },
              null, null],
    },
    fuerza: {
      3: [null, { key:'squat', label:'SQUAT', name:'Sentadilla + Accesorios', muscles:'Piernas, Core', subcats:['piernas'] },
              null, { key:'bench', label:'BENCH', name:'Press de Banca + Accesorios', muscles:'Pecho, Tríceps', subcats:['empuje'] },
              null, { key:'dead', label:'DEAD', name:'Peso Muerto + Accesorios', muscles:'Espalda, Isquios', subcats:['piernas','tiron'] },
              null],
      4: [null, { key:'squat', label:'SQUAT', name:'Sentadilla', muscles:'Piernas', subcats:['piernas'] },
              { key:'press', label:'PRESS', name:'Press Militar', muscles:'Hombros, Tríceps', subcats:['empuje'] },
              null,
              { key:'dead', label:'DEAD', name:'Peso Muerto', muscles:'Espalda, Isquios', subcats:['piernas','tiron'] },
              { key:'bench', label:'BENCH', name:'Press de Banca', muscles:'Pecho, Tríceps', subcats:['empuje'] },
              null],
      5: [null, { key:'squat', label:'SQUAT', name:'Sentadilla A', muscles:'Piernas', subcats:['piernas'] },
              { key:'bench', label:'BENCH', name:'Press de Banca A', muscles:'Pecho', subcats:['empuje'] },
              { key:'dead', label:'DEAD', name:'Peso Muerto', muscles:'Espalda', subcats:['piernas'] },
              { key:'press', label:'OHP', name:'Press Militar', muscles:'Hombros', subcats:['empuje'] },
              { key:'squat2', label:'SQUAT', name:'Sentadilla B', muscles:'Piernas', subcats:['piernas'] },
              null],
      2: [null, { key:'sq_bench', label:'A', name:'Sentadilla + Banca', muscles:'Piernas, Pecho', subcats:['piernas','empuje'] },
              null, null,
              { key:'dead_press', label:'B', name:'Peso Muerto + Press Militar', muscles:'Espalda, Hombros', subcats:['piernas','empuje'] },
              null, null],
    },
    calistenia: {
      3: [null, { key:'push', label:'PUSH', name:'Empuje Calistenia', muscles:'Pecho, Tríceps', subcats:['empuje'] },
              null, { key:'pull', label:'PULL', name:'Tirón Calistenia', muscles:'Espalda, Bíceps', subcats:['tiron'] },
              null, { key:'legs_skills', label:'LEGS', name:'Piernas y Habilidades', muscles:'Piernas, Core', subcats:['piernas','core'] },
              null],
      4: [null, { key:'push', label:'PUSH', name:'Empuje', muscles:'Pecho, Tríceps, Hombros', subcats:['empuje'] },
              { key:'pull', label:'PULL', name:'Tirón', muscles:'Espalda, Bíceps', subcats:['tiron'] },
              null,
              { key:'legs', label:'LEGS', name:'Piernas', muscles:'Cuádriceps, Glúteos', subcats:['piernas'] },
              { key:'skills', label:'SKILL', name:'Skills y Core', muscles:'Core, Full Body', subcats:['core'] },
              null],
      5: [null, { key:'push', label:'PUSH', name:'Empuje A', muscles:'Pecho, Tríceps', subcats:['empuje'] },
              { key:'pull', label:'PULL', name:'Tirón A', muscles:'Espalda, Bíceps', subcats:['tiron'] },
              { key:'legs', label:'LEGS', name:'Piernas', muscles:'Cuádriceps, Glúteos', subcats:['piernas'] },
              { key:'push2', label:'PUSH', name:'Empuje B', muscles:'Hombros, Tríceps', subcats:['empuje'] },
              { key:'pull2', label:'PULL', name:'Tirón B + Skills', muscles:'Espalda, Core', subcats:['tiron','core'] },
              null],
      6: [null, { key:'push', label:'PUSH', name:'Empuje A', muscles:'Pecho, Tríceps', subcats:['empuje'] },
              { key:'pull', label:'PULL', name:'Tirón A', muscles:'Espalda', subcats:['tiron'] },
              { key:'legs', label:'LEGS', name:'Piernas A', muscles:'Cuádriceps', subcats:['piernas'] },
              { key:'push2', label:'PUSH', name:'Empuje B', muscles:'Hombros', subcats:['empuje'] },
              { key:'pull2', label:'PULL', name:'Tirón B', muscles:'Bíceps', subcats:['tiron'] },
              { key:'legs2', label:'LEGS', name:'Piernas B + Skills', muscles:'Glúteos, Core', subcats:['piernas','core'] }],
      2: [null, { key:'upper', label:'UPPER', name:'Superior Calistenia', muscles:'Pecho, Espalda', subcats:['empuje','tiron'] },
              null, null,
              { key:'lower', label:'LOWER', name:'Inferior + Core', muscles:'Piernas, Core', subcats:['piernas','core'] },
              null, null],
    },
    yoga: {
      3: [null, { key:'fuerza', label:'FUERZA', name:'Yoga de Fuerza', muscles:'Cuerpo completo', subcats:['movilidad'] },
              null, { key:'flexibilidad', label:'FLEX', name:'Flexibilidad Profunda', muscles:'Caderas, Espalda', subcats:['movilidad'] },
              null, { key:'restaurativo', label:'REST', name:'Yoga Restaurativo', muscles:'Recuperación', subcats:['movilidad','respiracion'] },
              null],
      4: [null, { key:'fuerza', label:'FUERZA', name:'Yoga de Fuerza', muscles:'Core, Piernas', subcats:['movilidad'] },
              { key:'respiracion', label:'BREATH', name:'Pranayama y Respiración', muscles:'Sistema respiratorio', subcats:['respiracion'] },
              null,
              { key:'flexibilidad', label:'FLEX', name:'Flexibilidad de Caderas', muscles:'Caderas, Isquios', subcats:['movilidad'] },
              { key:'restaurativo', label:'REST', name:'Yoga Restaurativo', muscles:'Sistema nervioso', subcats:['movilidad','respiracion'] },
              null],
      5: [null, { key:'fuerza', label:'FUERZA', name:'Yoga de Fuerza A', muscles:'Piernas, Core', subcats:['movilidad'] },
              { key:'respiracion', label:'BREATH', name:'Pranayama', muscles:'Sistema nervioso', subcats:['respiracion'] },
              { key:'apertura', label:'CADERA', name:'Apertura de Caderas', muscles:'Caderas, Glúteos', subcats:['movilidad'] },
              { key:'equilibrio', label:'EQUIL', name:'Equilibrio y Foco', muscles:'Core, Tobillo', subcats:['movilidad'] },
              { key:'restaurativo', label:'REST', name:'Yoga Nidra', muscles:'Sistema nervioso', subcats:['respiracion'] },
              null],
      6: [null, { key:'fuerza', label:'FUERZA', name:'Yoga Vinyasa', muscles:'Cuerpo completo', subcats:['movilidad'] },
              { key:'mañana', label:'MAÑANA', name:'Yoga Mañanero', muscles:'Despertar', subcats:['movilidad'] },
              { key:'cadera', label:'CADERA', name:'Caderas y Suelo', muscles:'Caderas', subcats:['movilidad'] },
              { key:'espalda', label:'ESPALDA', name:'Alivio de Espalda', muscles:'Columna', subcats:['movilidad'] },
              { key:'respiracion', label:'BREATH', name:'Pranayama Profundo', muscles:'Pulmones', subcats:['respiracion'] },
              { key:'restaurativo', label:'NIDRA', name:'Yoga Nidra', muscles:'Sistema nervioso', subcats:['respiracion'] }],
      2: [null, { key:'activo', label:'ACTIVO', name:'Yoga Activo', muscles:'Cuerpo completo', subcats:['movilidad'] },
              null, null,
              { key:'restaurativo', label:'REST', name:'Yoga Restaurativo', muscles:'Recuperación', subcats:['movilidad','respiracion'] },
              null, null],
    },
    pilates: {
      3: [null, { key:'core', label:'CORE', name:'Pilates Core', muscles:'Core, Espalda', subcats:['core'] },
              null, { key:'postural', label:'POST', name:'Pilates Postural', muscles:'Columna, Glúteos', subcats:['core'] },
              null, { key:'flujo', label:'FLOW', name:'Pilates Flujo Completo', muscles:'Cuerpo completo', subcats:['core'] },
              null],
      4: [null, { key:'core', label:'CORE A', name:'Core e Isquios', muscles:'Core, Isquios', subcats:['core'] },
              { key:'lateral', label:'LATERAL', name:'Trabajo Lateral', muscles:'Oblicuos, Aductores', subcats:['core'] },
              null,
              { key:'postural', label:'POST', name:'Corrección Postural', muscles:'Espalda, Hombros', subcats:['core'] },
              { key:'flujo', label:'FLOW', name:'Pilates Completo', muscles:'Todo el cuerpo', subcats:['core'] },
              null],
      5: [null, { key:'core', label:'CORE', name:'Core Profundo', muscles:'Transverso, Core', subcats:['core'] },
              { key:'piernas', label:'PIERNAS', name:'Piernas Pilates', muscles:'Glúteos, Aductores', subcats:['core'] },
              { key:'espalda', label:'ESPALDA', name:'Espalda Pilates', muscles:'Erector espinal', subcats:['core'] },
              { key:'postural', label:'POST', name:'Postural + Hombros', muscles:'Columna, Hombros', subcats:['core'] },
              { key:'flujo', label:'FLOW', name:'Flujo Completo', muscles:'Cuerpo completo', subcats:['core'] },
              null],
      2: [null, { key:'core', label:'CORE', name:'Core Pilates', muscles:'Core', subcats:['core'] },
              null, null,
              { key:'flujo', label:'FLOW', name:'Pilates Flujo', muscles:'Cuerpo completo', subcats:['core'] },
              null, null],
    },
    cardio: {
      3: [null, { key:'cardio_mod', label:'CARDIO', name:'Cardio Moderado', muscles:'Sistema cardiovascular', subcats:['full'] },
              null, { key:'cardio_inter', label:'CARDIO', name:'Intervalo de Cardio', muscles:'Resistencia', subcats:['full'] },
              null, { key:'cardio_largo', label:'LARGO', name:'Cardio de Larga Duración', muscles:'Resistencia', subcats:['full'] },
              null],
      4: [null, { key:'cardio_mod', label:'CARDIO', name:'Cardio Moderado', muscles:'Sistema cardiovascular', subcats:['full'] },
              { key:'fuerza', label:'FUERZA', name:'Cardio + Fuerza', muscles:'Full Body', subcats:['full'] },
              null,
              { key:'cardio_inter', label:'INTER', name:'Intervalo Medio', muscles:'Resistencia', subcats:['full'] },
              { key:'cardio_largo', label:'LARGO', name:'Cardio Largo', muscles:'Resistencia aeróbica', subcats:['full'] },
              null],
      5: [null, { key:'c1', label:'CARDIO', name:'Cardio A', muscles:'Cardiovascular', subcats:['full'] },
              { key:'c2', label:'FUERZA', name:'Cardio + Fuerza', muscles:'Full Body', subcats:['full'] },
              { key:'c3', label:'INTER', name:'Intervalo', muscles:'Resistencia', subcats:['full'] },
              { key:'c4', label:'CARDIO', name:'Cardio B', muscles:'Cardiovascular', subcats:['full'] },
              { key:'c5', label:'LARGO', name:'Largo + Stretching', muscles:'Resistencia', subcats:['full'] },
              null],
      2: [null, { key:'c1', label:'CARDIO', name:'Cardio Moderado', muscles:'Cardiovascular', subcats:['full'] },
              null, null,
              { key:'c2', label:'LARGO', name:'Cardio Largo', muscles:'Resistencia', subcats:['full'] },
              null, null],
    },
    hiit: {
      3: [null, { key:'hiit1', label:'HIIT', name:'HIIT — Full Body', muscles:'Cuerpo completo', subcats:['full','core'] },
              null, { key:'hiit2', label:'HIIT', name:'HIIT — Tren Inferior', muscles:'Piernas, Glúteos', subcats:['piernas','full'] },
              null, { key:'hiit3', label:'HIIT', name:'HIIT — Cardio Intenso', muscles:'Cardiovascular', subcats:['full'] },
              null],
      4: [null, { key:'hiit1', label:'HIIT A', name:'HIIT Full Body', muscles:'Cuerpo completo', subcats:['full'] },
              { key:'rec1', label:'RECUP', name:'Cardio Suave Recuperación', muscles:'Sistema cardiovascular', subcats:['full'] },
              null,
              { key:'hiit2', label:'HIIT B', name:'HIIT Inferior', muscles:'Piernas', subcats:['piernas','full'] },
              { key:'rec2', label:'RECUP', name:'Core y Movilidad', muscles:'Core', subcats:['core'] },
              null],
      5: [null, { key:'h1', label:'HIIT', name:'HIIT Full Body', muscles:'Cuerpo completo', subcats:['full'] },
              { key:'c1', label:'CARDIO', name:'Cardio Recuperación', muscles:'Cardiovascular', subcats:['full'] },
              { key:'h2', label:'HIIT', name:'HIIT Piernas', muscles:'Piernas', subcats:['piernas','full'] },
              { key:'c2', label:'CARDIO', name:'Cardio Moderado', muscles:'Resistencia', subcats:['full'] },
              { key:'h3', label:'HIIT', name:'HIIT Core', muscles:'Core, Full Body', subcats:['core','full'] },
              null],
      2: [null, { key:'h1', label:'HIIT', name:'HIIT Full Body', muscles:'Cuerpo completo', subcats:['full'] },
              null, null,
              { key:'h2', label:'HIIT', name:'HIIT Intenso', muscles:'Cuerpo completo', subcats:['full'] },
              null, null],
    },
    híbrido: {
      3: [null, { key:'gym', label:'GYM', name:'Gym — Hipertrofia', muscles:'Pecho, Espalda', subcats:['empuje','tiron'] },
              null, { key:'yoga', label:'YOGA', name:'Yoga + Movilidad', muscles:'Flexibilidad', subcats:['movilidad'] },
              null, { key:'legs', label:'LEGS', name:'Piernas + Core', muscles:'Piernas, Core', subcats:['piernas','core'] },
              null],
      4: [null, { key:'push', label:'PUSH', name:'Gym Empuje', muscles:'Pecho, Hombros', subcats:['empuje'] },
              { key:'yoga', label:'YOGA', name:'Yoga Activo', muscles:'Flexibilidad, Core', subcats:['movilidad'] },
              null,
              { key:'pull_legs', label:'PULL+', name:'Gym Tirón + Piernas', muscles:'Espalda, Piernas', subcats:['tiron','piernas'] },
              { key:'pilates', label:'PILATES', name:'Pilates Core', muscles:'Core', subcats:['core'] },
              null],
      5: [null, { key:'push', label:'PUSH', name:'Gym Empuje', muscles:'Pecho, Hombros', subcats:['empuje'] },
              { key:'yoga', label:'YOGA', name:'Yoga Mañana', muscles:'Flexibilidad', subcats:['movilidad'] },
              { key:'pull', label:'PULL', name:'Gym Tirón', muscles:'Espalda, Bíceps', subcats:['tiron'] },
              { key:'legs', label:'LEGS', name:'Piernas', muscles:'Piernas, Glúteos', subcats:['piernas'] },
              { key:'mob', label:'MOV', name:'Movilidad + Pilates', muscles:'Core, Flexibilidad', subcats:['core','movilidad'] },
              null],
      6: [null, { key:'push', label:'PUSH', name:'Gym Empuje', muscles:'Pecho', subcats:['empuje'] },
              { key:'pull', label:'PULL', name:'Gym Tirón', muscles:'Espalda', subcats:['tiron'] },
              { key:'yoga', label:'YOGA', name:'Yoga Apertura', muscles:'Caderas', subcats:['movilidad'] },
              { key:'legs', label:'LEGS', name:'Piernas Gym', muscles:'Piernas', subcats:['piernas'] },
              { key:'pilates', label:'PILATES', name:'Pilates Core', muscles:'Core', subcats:['core'] },
              { key:'mob', label:'MOV', name:'Movilidad Completa', muscles:'Full Body', subcats:['movilidad'] }],
      2: [null, { key:'gym', label:'GYM', name:'Gym Full Body', muscles:'Cuerpo completo', subcats:['empuje','tiron','piernas'] },
              null, null,
              { key:'mob', label:'MOV', name:'Yoga + Movilidad', muscles:'Flexibilidad', subcats:['movilidad','respiracion'] },
              null, null],
    },
    terapéutico: {
      3: [null, { key:'terapia1', label:'PROG', name:'Programa Terapéutico A', muscles:'Terapéutico', subcats:['terapéutico'] },
              null, { key:'terapia2', label:'PROG', name:'Programa Terapéutico B', muscles:'Terapéutico', subcats:['terapéutico'] },
              null, { key:'terapia3', label:'PROG', name:'Programa Terapéutico C', muscles:'Terapéutico', subcats:['terapéutico'] },
              null],
      2: [null, { key:'terapia1', label:'PROG', name:'Programa Terapéutico A', muscles:'Terapéutico', subcats:['terapéutico'] },
              null, null,
              { key:'terapia2', label:'PROG', name:'Programa Terapéutico B', muscles:'Terapéutico', subcats:['terapéutico'] },
              null, null],
      4: [null, { key:'t1', label:'PROG A', name:'Programa A', muscles:'Terapéutico', subcats:['terapéutico'] },
              { key:'t2', label:'PROG B', name:'Programa B', muscles:'Terapéutico', subcats:['terapéutico'] },
              null,
              { key:'t3', label:'PROG C', name:'Programa C', muscles:'Terapéutico', subcats:['terapéutico'] },
              { key:'t4', label:'PROG D', name:'Programa D', muscles:'Terapéutico', subcats:['terapéutico'] },
              null],
    },
  }

  const stylePlan = plans[style] || plans.hipertrofia
  const daysKey = days_per_week.toString()
  // Encuentra el plan más cercano
  const availableKeys = Object.keys(stylePlan).map(Number).sort((a, b) => a - b)
  const closest = availableKeys.reduce((prev, curr) =>
    Math.abs(curr - days_per_week) < Math.abs(prev - days_per_week) ? curr : prev
  )
  return stylePlan[closest] || stylePlan[availableKeys[0]]
}

// ─────────────────────────────────────────────────────────────────
// SELECCIÓN DE EJERCICIOS PARA CADA SESIÓN
// ─────────────────────────────────────────────────────────────────

function getExercisesForSession(sessionDef, params, records) {
  const { style, experience, special_programs = [], duration_min } = params
  const expConfig = EXPERIENCE_CONFIG[experience] || EXPERIENCE_CONFIG.intermedio
  const { exercises_per_session } = expConfig

  let pool = []
  const { subcats } = sessionDef

  // Pool principal según subcategorías de la sesión y categorías del estilo
  const primaryCategories = getCategoriesForStyle(style)

  for (const subcat of subcats) {
    if (subcat === 'terapéutico') {
      // Para sesiones terapéuticas, mezclar con los programas especiales seleccionados
      for (const prog of special_programs) {
        const tagged = getBySpecialTag(prog)
        pool.push(...tagged)
      }
      if (pool.length === 0) {
        pool.push(...getByCategory('terapéutico'))
      }
    } else {
      // Filtrar por categoría primaria y subcategoría
      const filtered = EXERCISES.filter(e =>
        primaryCategories.includes(e.category) &&
        e.subcategory === subcat
      )
      pool.push(...filtered)
    }
  }

  // Si el pool está vacío, usar toda la categoría
  if (pool.length === 0) {
    for (const cat of primaryCategories) {
      pool.push(...getByCategory(cat))
    }
  }

  // Eliminar duplicados
  pool = [...new Map(pool.map(e => [e.id, e])).values()]

  // Filtrar por dificultad adecuada
  pool = filterByExperience(pool, experience)

  // Añadir programas especiales como ejercicios extra al final si hay
  let specialExercises = []
  if (special_programs.length > 0) {
    for (const prog of special_programs) {
      const tagged = getBySpecialTag(prog)
        .filter(e => !pool.find(p => p.id === e.id))
        .slice(0, 2)
      specialExercises.push(...tagged)
    }
    specialExercises = [...new Map(specialExercises.map(e => [e.id, e])).values()]
  }

  // Calcular cuántos ejercicios caben en el tiempo disponible
  const maxExercises = calculateMaxExercises(pool, expConfig, duration_min)
  const targetCount = Math.min(exercises_per_session, maxExercises, pool.length)

  // Seleccionar ejercicios prioritizando los que tienen records (variedad y progresión)
  const selected = selectExercises(pool, targetCount, records)

  // Añadir hasta 2 ejercicios especiales si hay espacio
  const totalBudget = calculateMaxExercises(
    [...selected, ...specialExercises], expConfig, duration_min
  )
  const canAddSpecial = Math.max(0, totalBudget - selected.length)
  const extras = specialExercises.slice(0, Math.min(2, canAddSpecial))

  return [...selected, ...extras]
}

function getCategoriesForStyle(style) {
  const map = {
    hipertrofia: ['hipertrofia'],
    fuerza:      ['fuerza', 'hipertrofia'],
    calistenia:  ['calistenia'],
    yoga:        ['yoga'],
    pilates:     ['pilates'],
    cardio:      ['cardio'],
    hiit:        ['hiit', 'cardio'],
    híbrido:     ['hipertrofia', 'calistenia', 'yoga', 'pilates'],
    terapéutico: ['terapéutico', 'yoga', 'pilates'],
  }
  return map[style] || ['hipertrofia']
}

function filterByExperience(pool, experience) {
  const allowed = {
    principiante: ['principiante'],
    intermedio:   ['principiante', 'intermedio'],
    avanzado:     ['principiante', 'intermedio', 'avanzado'],
  }
  const levels = allowed[experience] || allowed.intermedio
  const filtered = pool.filter(e => levels.includes(e.difficulty))
  // Si no hay suficientes, incluir el nivel siguiente
  return filtered.length >= 3 ? filtered : pool
}

function calculateMaxExercises(pool, expConfig, duration_min) {
  const WARMUP_MIN = 5
  const COOLDOWN_MIN = 3
  const available = duration_min - WARMUP_MIN - COOLDOWN_MIN

  let totalMin = 0
  let count = 0

  for (const ex of pool) {
    const sets = Math.min(expConfig.max_sets, ex.default_sets)
    const restSec = ex.rest_sec * expConfig.rest_multiplier
    const setTime = ex.exercise_type === 'reps' ? 45 : (ex.default_duration_sec || 30)
    const exMin = (sets * (restSec + setTime)) / 60
    if (totalMin + exMin > available) break
    totalMin += exMin
    count++
  }

  return Math.max(count, 3) // mínimo 3 ejercicios
}

function selectExercises(pool, count, records) {
  // Priorizar ejercicios con historial (records existentes)
  const withRecord = pool.filter(e => records[e.id])
  const withoutRecord = pool.filter(e => !records[e.id])

  // Mezcla aleatoria con semilla basada en el día para consistencia
  const shuffleWithSeed = (arr) => {
    const seed = new Date().getDay()
    return [...arr].sort((a, b) => {
      const hashA = (a.id.charCodeAt(0) + seed) % 7
      const hashB = (b.id.charCodeAt(0) + seed) % 7
      return hashA - hashB
    })
  }

  const ordered = [...shuffleWithSeed(withRecord), ...shuffleWithSeed(withoutRecord)]
  return ordered.slice(0, count)
}

// ─────────────────────────────────────────────────────────────────
// GENERAR SETS PARA UN EJERCICIO
// ─────────────────────────────────────────────────────────────────

function buildExerciseSets(exercise, params, records) {
  const expConfig = EXPERIENCE_CONFIG[params.experience] || EXPERIENCE_CONFIG.intermedio
  const record = records[exercise.id]

  const numSets = Math.max(
    expConfig.min_sets,
    Math.min(expConfig.max_sets, exercise.default_sets)
  )

  let weight = 0
  let reps = exercise.default_reps || 10
  let duration_sec = exercise.default_duration_sec || 30

  if (exercise.exercise_type === 'reps') {
    // Usar récord si existe, ajustar por experiencia
    const baseWeight = record?.max_weight_kg || exercise.default_weight
    weight = Math.round(baseWeight * expConfig.weight_multiplier * 2) / 2
    reps = record?.target_reps || exercise.default_reps
  }

  return Array.from({ length: numSets }, (_, i) => ({
    set: i + 1,
    weight_kg: weight,
    reps: exercise.exercise_type === 'reps' ? reps : 0,
    duration_sec: exercise.exercise_type !== 'reps' ? duration_sec : 0,
    completed: false,
    timestamp: null,
  }))
}

// ─────────────────────────────────────────────────────────────────
// WARMUP POR SESIÓN
// ─────────────────────────────────────────────────────────────────

function getWarmupForSession(sessionDef) {
  const warmups = {
    push: [
      { name: 'Rotaciones de hombro', detail: '2×15 cada lado' },
      { name: 'Band pull-apart', detail: '2×15' },
      { name: 'Flexiones suaves', detail: '2×10 (al 40%)' },
    ],
    pull: [
      { name: 'Cat-Cow', detail: '2×10' },
      { name: 'Dislocaciones con banda', detail: '2×10' },
      { name: 'Dead hang', detail: '2×20 seg' },
    ],
    legs: [
      { name: 'Sentadilla sin peso', detail: '2×15' },
      { name: 'Hip hinge', detail: '2×10' },
      { name: 'Apertura de cadera', detail: '1×30 seg cada lado' },
    ],
    upper: [
      { name: 'Rotaciones de hombro', detail: '2×15' },
      { name: 'Flexiones de muñeca', detail: '1×10' },
      { name: 'Activación dorsal con banda', detail: '2×10' },
    ],
    lower: [
      { name: 'Sentadilla goblet', detail: '2×10' },
      { name: 'RDL sin peso', detail: '2×10' },
      { name: 'Apertura cadera lateral', detail: '1×30 seg' },
    ],
    core: [
      { name: 'Cat-Cow', detail: '2×10' },
      { name: 'Respiración diafragmática', detail: '1×60 seg' },
    ],
    full: [
      { name: 'Jumping jacks', detail: '1×30 seg' },
      { name: 'Movilidad articular completa', detail: '5 min' },
    ],
    movilidad: [
      { name: 'Respiración profunda', detail: '1 min' },
      { name: 'Movilidad cervical suave', detail: '10 círculos' },
    ],
    respiracion: [
      { name: 'Respiración diafragmática', detail: '2 min' },
    ],
    terapéutico: [
      { name: 'Caminata suave', detail: '5 min' },
      { name: 'Movilidad articular', detail: '3 min' },
    ],
  }

  // Detectar tipo de sesión
  const key = sessionDef.subcats?.[0] || 'full'
  return warmups[key] || warmups.full
}

// ─────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL — generateRoutine
// ─────────────────────────────────────────────────────────────────

/**
 * Genera una rutina semanal completa.
 * @param {Object} params - { style, goal, days_per_week, duration_min, experience, special_programs, equipment }
 * @param {Object} records - Récords del usuario { exercise_id: { max_weight_kg, ... } }
 * @returns {Object} Rutina con weekly_plan[0..6]
 */
/**
 * Remaps a generated weekly plan so sessions land on specific weekday indices.
 * @param {Array} plan - weekly_plan[0..6] from getWeeklyPlan
 * @param {number[]} trainingDays - sorted day indices the user wants (e.g. [1,3,5])
 * @returns {Array} remapped weekly_plan[0..6]
 */
function remapWeeklyPlan(plan, trainingDays) {
  const sessions = plan.filter(s => s !== null)
  const remapped = Array(7).fill(null)
  const sorted = [...trainingDays].sort((a, b) => a - b)
  sorted.forEach((dayIndex, i) => {
    if (i < sessions.length) {
      remapped[dayIndex] = { ...sessions[i], day_index: dayIndex }
    }
  })
  return remapped
}

export function generateRoutine(params, records = {}) {
  const {
    style = 'hipertrofia',
    goal = 'ganar_musculo',
    days_per_week = 3,
    training_days = null,   // optional: specific day indices [0-6]
    duration_min = 60,
    experience = 'intermedio',
    special_programs = [],
    equipment = [],
  } = params

  // Use training_days count if provided, otherwise days_per_week
  const effectiveDays = training_days?.length || days_per_week
  let weeklyPlan = getWeeklyPlan(style, effectiveDays)

  // If user picked specific days, remap sessions to those days
  if (training_days?.length >= 2) {
    weeklyPlan = remapWeeklyPlan(weeklyPlan, training_days)
  }

  // Generar sesiones para cada día activo
  const sessionsBuilt = weeklyPlan.map((dayDef, dayIndex) => {
    if (!dayDef) return null

    const exercises = getExercisesForSession(dayDef, params, records)

    return {
      day_index: dayIndex,
      key: dayDef.key,
      label: dayDef.label,
      name: dayDef.name,
      muscle_group: dayDef.muscles,
      style,
      exercises_def: exercises.map(ex => ({
        exercise_id: ex.id,
        name: ex.name,
        category: ex.category,
        difficulty: ex.difficulty,
        pts_per_set: ex.pts_per_set,
        exercise_type: ex.exercise_type,
        muscle_group: ex.muscles?.[0] || '',
        cue: ex.cue,
        regression: ex.regression,
        progression: ex.progression,
        default_sets: ex.default_sets,
        default_reps: ex.default_reps,
        default_weight: ex.default_weight,
        default_duration_sec: ex.default_duration_sec,
        rest_sec: ex.rest_sec,
      })),
      warmup: getWarmupForSession(dayDef),
    }
  })

  return {
    style,
    goal,
    days_per_week:  effectiveDays,
    training_days:  training_days || null,
    duration_min,
    experience,
    special_programs,
    weekly_plan: sessionsBuilt,
    created_at: new Date().toISOString(),
  }
}

// ─────────────────────────────────────────────────────────────────
// FUNCIÓN — getSessionForDate
// ─────────────────────────────────────────────────────────────────

/**
 * Obtiene la sesión del día a partir de la rutina.
 * @param {Object} routine - Rutina generada por generateRoutine
 * @param {string} date - Fecha YYYY-MM-DD
 * @param {Object} records - Récords del usuario
 * @returns {Object|null} Sesión compatible con training.store
 */
export function getSessionForDate(routine, date, records = {}) {
  if (!routine?.weekly_plan) return null

  // Ajustar para zona horaria local
  const d = new Date(date + 'T12:00:00')
  const dayOfWeek = d.getDay() // 0=Dom, 1=Lun...

  const dayDef = routine.weekly_plan[dayOfWeek]
  if (!dayDef) return null // Día de descanso

  const expConfig = EXPERIENCE_CONFIG[routine.experience] || EXPERIENCE_CONFIG.intermedio

  const exercises = (dayDef.exercises_def || []).map(exDef => {
    const record = records[exDef.exercise_id]
    const numSets = Math.max(
      expConfig.min_sets,
      Math.min(expConfig.max_sets, exDef.default_sets)
    )

    let weight = 0
    if (exDef.exercise_type === 'reps') {
      const base = record?.max_weight_kg || exDef.default_weight
      weight = Math.round(base * expConfig.weight_multiplier * 2) / 2
    }

    const sets = Array.from({ length: numSets }, (_, i) => ({
      set: i + 1,
      weight_kg: weight,
      reps: exDef.exercise_type === 'reps' ? (record?.target_reps || exDef.default_reps) : 0,
      duration_sec: exDef.exercise_type !== 'reps' ? exDef.default_duration_sec : 0,
      completed: false,
      timestamp: null,
    }))

    return {
      exercise_id: exDef.exercise_id,
      name: exDef.name,
      category: exDef.category,
      difficulty: exDef.difficulty,
      pts_per_set: exDef.pts_per_set,
      exercise_type: exDef.exercise_type,
      muscle_group: exDef.muscle_group,
      cue: exDef.cue,
      tip: exDef.cue, // backward compat
      regression: exDef.regression,
      progression: exDef.progression,
      sets,
      rest_sec: exDef.rest_sec,
      completed: false,
      skipped: false,
      notes: '',
    }
  })

  return {
    date,
    name: dayDef.name,
    dayName: formatDayName(date),
    label: dayDef.label,
    muscle_group: dayDef.muscle_group,
    style: dayDef.style || routine.style,
    status: 'pending',
    exercises,
    warmup: dayDef.warmup || [],
    exercises_completed: 0,
    exercises_total: exercises.length,
    started_at: null,
    completed_at: null,
    duration_min: 0,
    volume_total_kg: 0,
    new_records: [],
  }
}

// ─────────────────────────────────────────────────────────────────
// UTILS INTERNOS
// ─────────────────────────────────────────────────────────────────

function formatDayName(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
}

// ─────────────────────────────────────────────────────────────────
// EXPORTS PARA "A TU MEDIDA"
// ─────────────────────────────────────────────────────────────────

export const BODY_FOCUS = [
  { id: 'full_body',     label: 'Full body equilibrado', icon: '⚖️', description: 'Trabaja todo el cuerpo de forma balanceada' },
  { id: 'tren_superior', label: 'Tren superior',         icon: '💪', description: 'Pecho, espalda, hombros y brazos' },
  { id: 'tren_inferior', label: 'Tren inferior',         icon: '🦵', description: 'Cuádriceps, isquios, glúteos y pantorrillas' },
  { id: 'core',          label: 'Core y abdomen',        icon: '🎯', description: 'Estabilidad central y fuerza funcional' },
]

export const EQUIPMENT_OPTIONS = [
  { id: 'gym_completo',  label: 'Gimnasio completo',  icon: '🏋️', description: 'Máquinas, barras, mancuernas — acceso completo' },
  { id: 'mancuernas',    label: 'Pesas libres',        icon: '🏅', description: 'Mancuernas y barras en casa o gym básico' },
  { id: 'peso_corporal', label: 'Peso corporal',       icon: '🤸', description: 'Sin equipamiento adicional' },
  { id: 'bandas',        label: 'Bandas / TRX',        icon: '🎗️', description: 'Resistencia con bandas elásticas' },
]

export const CARDIO_LEVELS = [
  { id: 'bajo',     label: 'Me canso subiendo escaleras',  icon: '😮‍💨' },
  { id: 'basico',   label: 'Camino 30 min sin problemas',  icon: '🚶' },
  { id: 'moderado', label: 'Hago cardio regularmente',     icon: '🏃' },
  { id: 'alto',     label: 'Atleta / deporte frecuente',   icon: '⚡' },
]

export const STYLE_PREFERENCES = [
  { id: 'auto',        label: 'Recomiéndame',     icon: '✨', description: 'El sistema elige lo mejor para tu perfil' },
  { id: 'hipertrofia', label: 'Gym (pesas)',       icon: '💪', description: 'Máquinas y pesas libres' },
  { id: 'calistenia',  label: 'Calistenia',        icon: '🤸', description: 'Movimientos con tu propio peso' },
  { id: 'hiit',        label: 'HIIT',              icon: '⚡', description: 'Intervalos de alta intensidad' },
  { id: 'híbrido',     label: 'Híbrido',           icon: '🔀', description: 'Combina pesas, cardio y movilidad' },
  { id: 'yoga',        label: 'Yoga / Pilates',    icon: '🧘', description: 'Flexibilidad, respiración y core' },
]

/**
 * Asignación óptima de días basada en ACSM/NSCA/WHO.
 * Incluye justificación científica y fuentes para mostrar en la UI.
 */
export const DAY_ASSIGNMENT_SCIENCE = {
  2: {
    days: [1, 4],
    dayLabels: ['Lun', 'Jue'],
    justification: 'Lunes–Jueves proporciona 72 horas de recuperación entre sesiones, superando el mínimo recomendado (48 h) y optimizando la síntesis proteica muscular post-entrenamiento. Ideal para principiantes e intermedios con vida activa.',
    sources: [
      { ref: 'ACSM (2026)', detail: 'Resistance Training Guidelines Update — mínimo 48 h de recuperación por grupo muscular' },
      { ref: 'NSCA Foundations of Fitness Programming', detail: 'Cap. 17 — Principios de frecuencia para programas de 2 días/semana' },
    ],
  },
  3: {
    days: [1, 3, 5],
    dayLabels: ['Lun', 'Mié', 'Vie'],
    justification: 'Lunes–Miércoles–Viernes es el esquema de 3 días con mayor respaldo en la literatura. Garantiza 48 h de recuperación entre sesiones. La WHO (2020) recomienda ≥2 días/semana de fortalecimiento muscular; este protocolo lo supera con distribución simétrica óptima.',
    sources: [
      { ref: 'WHO Physical Activity Guidelines (2020)', detail: '≥2 días/semana de actividades de fortalecimiento muscular para adultos' },
      { ref: 'ACSM (2026)', detail: 'Frecuencia óptima para principiantes e intermedios: 3 días no consecutivos' },
      { ref: 'Schoenfeld et al. (2017) — JSCR', detail: 'Relación dosis–respuesta entre volumen semanal e incremento de masa muscular' },
    ],
  },
  4: {
    days: [1, 2, 4, 5],
    dayLabels: ['Lun', 'Mar', 'Jue', 'Vie'],
    justification: 'Esquema Upper/Lower en 4 días. Permite trabajar cada grupo muscular 2×/semana —la frecuencia óptima para hipertrofia según meta-análisis—. El miércoles actúa como descanso activo que divide la carga semanal y facilita la recuperación del sistema nervioso central.',
    sources: [
      { ref: 'Schoenfeld et al. (2016) — JSCR', detail: 'Meta-análisis: entrenar cada grupo muscular 2×/semana es superior a 1×/semana para hipertrofia' },
      { ref: 'NSCA-CSCS, Cap. 17', detail: 'Upper/Lower split como protocolo estándar para nivel intermedio' },
      { ref: 'ACSM (2026)', detail: 'Frecuencia 2×/semana por grupo como recomendación general de evidencia' },
    ],
  },
  5: {
    days: [1, 2, 3, 5, 6],
    dayLabels: ['Lun', 'Mar', 'Mié', 'Vie', 'Sáb'],
    justification: 'Esquema de 5 días con descanso estratégico jueves y domingo. El bloque Lun–Mié permite acumular volumen en la primera mitad de la semana; el descanso del jueves facilita la recuperación del SNC antes del bloque Vie–Sáb de alta intensidad.',
    sources: [
      { ref: 'NSCA Foundations of Fitness Programming', detail: 'Periodización para atletas intermedios-avanzados con bloques semanales' },
      { ref: 'Huberman Lab — Foundational Fitness Protocol (2023)', detail: 'Estructura semanal con 1 foco por día y descanso estratégico intermedio' },
      { ref: 'ACSM (2026)', detail: 'Manejo del volumen total semanal en programas de alta frecuencia' },
    ],
  },
  6: {
    days: [1, 2, 3, 4, 5, 6],
    dayLabels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    justification: 'PPL × 2: cada grupo muscular se trabaja 2×/semana con descanso dominical completo para recuperación sistémica. Protocolo avanzado que requiere buena capacidad de recuperación. No recomendado para principiantes ni con alto estrés o poco sueño.',
    sources: [
      { ref: 'ACSM (2026)', detail: 'Volumen y frecuencia en protocolos avanzados; descanso de 1 día completo obligatorio' },
      { ref: 'NSCA-CSCS', detail: 'PPL × 2 como esquema estándar para nivel avanzado' },
      { ref: 'Huberman Lab — Foundational Fitness Protocol (2023)', detail: 'Día de descanso completo semanal como pilar irremplazable de recuperación' },
    ],
  },
}

/**
 * Retorna los días de entrenamiento óptimos según días/semana.
 * Basado en guías ACSM/NSCA para recuperación muscular.
 * @param {number} daysPerWeek
 * @returns {number[]} Índices de días (0=Dom, 1=Lun, ..., 6=Sáb)
 */
export function assignOptimalDays(daysPerWeek) {
  const config = DAY_ASSIGNMENT_SCIENCE[daysPerWeek] || DAY_ASSIGNMENT_SCIENCE[3]
  return [...config.days]
}

/**
 * Determina el estilo de entrenamiento a partir de los parámetros de "a tu medida".
 */
export function getStyleFromMedidaParams({ equipment, goal, style_preference }) {
  if (style_preference && style_preference !== 'auto') return style_preference
  if (equipment === 'peso_corporal' || equipment === 'bandas') {
    if (goal === 'perder_grasa' || goal === 'mejorar_condicion') return 'hiit'
    return 'calistenia'
  }
  if (goal === 'fuerza_maxima') return 'fuerza'
  if (goal === 'flexibilidad')  return 'yoga'
  if (goal === 'perder_grasa')  return 'híbrido'
  return 'hipertrofia'
}

/**
 * Mapea el nivel de experiencia detallado al estándar del generador.
 */
export function mapExperienceLevel(level) {
  if (level === 'novato' || level === 'principiante') return 'principiante'
  if (level === 'avanzado') return 'avanzado'
  return 'intermedio'
}

/**
 * Mapea respuestas del screening de salud a programas especiales sugeridos.
 */
export function mapHealthToPrograms(screening) {
  const programs = []
  if (screening.back_pain)     programs.push('dolor_espalda')
  if (screening.joint_injury)  programs.push('movilidad')
  if (screening.respiratory)   programs.push('salud_pulmonar')
  return programs
}
