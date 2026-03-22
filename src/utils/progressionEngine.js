/**
 * DISCIPLINA — Motor de Sobrecarga Progresiva
 * Analiza el historial de un ejercicio y sugiere el próximo peso/reps
 */

/**
 * Analiza el log de una sesión completada y determina si sugerir progresión
 * @param {Array} sets - Series completadas [{weight_kg, reps, completed}]
 * @param {Object} record - Récord actual {max_weight_kg, target_reps}
 * @returns {Object|null} - Sugerencia o null si no hay
 */
export function checkProgression(sets, record) {
  const completedSets = sets.filter(s => s.completed)
  if (completedSets.length < 2) return null

  const { weight_kg, reps } = completedSets[completedSets.length - 1]
  const targetReps = record?.target_reps || 10
  const allHitTarget = completedSets.every(s => s.reps >= targetReps)

  if (!allHitTarget) return null

  // Incremento según el peso actual
  const increment = weight_kg >= 60 ? 2.5 : 1.25

  return {
    suggested_weight: weight_kg + increment,
    reason: `Completaste todas las series con ${reps}+ reps. Sube ${increment}kg la próxima vez.`,
  }
}

/**
 * Genera la sesión del día según el split y el historial
 * @param {Object} trainingProfile - Perfil de entrenamiento del usuario
 * @param {String} date - Fecha YYYY-MM-DD
 * @param {Object} records - Récords personales del usuario
 * @returns {Object} - Sesión generada
 */
export function generateSession(trainingProfile, date, records = {}) {
  const dayOfWeek = new Date(date + 'T12:00:00').getDay() // 0=Dom, 1=Lun...
  const gymDays   = trainingProfile?.gym_days_per_week || 3
  const split     = getSplit(gymDays)
  const dayKey    = getDayKey(dayOfWeek, gymDays)
  const muscle    = split[dayKey]

  if (!muscle) return null // Día de descanso

  const exercises = getExercisesForMuscle(muscle, records)

  return {
    date,
    label:               muscle.toUpperCase(),
    muscle_group:        muscle,
    status:              'pending',
    exercises,
    warmup:              getWarmup(muscle),
    exercises_completed: 0,
    exercises_total:     exercises.length,
    started_at:          null,
    completed_at:        null,
    duration_min:        0,
    volume_total_kg:     0,
    new_records:         [],
  }
}

// ── Splits por días/semana ──────────────────────────────

function getSplit(gymDays) {
  const splits = {
    2: { 1: 'full body', 4: 'full body' },
    3: { 1: 'empuje', 3: 'tirón', 5: 'piernas' },
    4: { 1: 'superior', 2: 'inferior', 4: 'superior', 5: 'inferior' },
    5: { 1: 'empuje', 2: 'tirón', 3: 'piernas', 4: 'superior', 5: 'inferior' },
    6: { 1: 'empuje', 2: 'tirón', 3: 'piernas', 4: 'empuje', 5: 'tirón', 6: 'piernas' },
  }
  return splits[gymDays] || splits[3]
}

function getDayKey(dayOfWeek, gymDays) {
  // Mapea día de la semana al key del split
  // dayOfWeek: 0=Dom, 1=Lun, 2=Mar...
  // Los splits usan 1=Lun como base
  return dayOfWeek === 0 ? 7 : dayOfWeek
}

// ── Ejercicios por grupo muscular ──────────────────────

function getExercisesForMuscle(muscle, records) {
  const catalog = getExerciseCatalog()
  const list    = catalog[muscle] || catalog['full body']

  return list.map(ex => ({
    exercise_id: ex.id,
    name:        ex.name,
    muscle_group: ex.muscle,
    tip:         ex.tip,
    sets: generateSets(ex, records[ex.id]),
    completed: false,
    skipped:   false,
    notes:     '',
  }))
}

function generateSets(exercise, record) {
  const weight = record?.max_weight_kg || exercise.defaultWeight
  const reps   = exercise.defaultReps || 10
  const numSets = exercise.sets || 3

  return Array.from({ length: numSets }, (_, i) => ({
    set:       i + 1,
    weight_kg: weight,
    reps,
    completed: false,
    timestamp: null,
  }))
}

function getWarmup(muscle) {
  const warmups = {
    'empuje': [
      { name: 'Rotaciones de hombro', sets: 2, reps: '15 cada lado' },
      { name: 'Band pull-apart', sets: 2, reps: '15' },
    ],
    'tirón': [
      { name: 'Cat-cow', sets: 2, reps: '10' },
      { name: 'Dislocaciones con banda', sets: 2, reps: '10' },
    ],
    'piernas': [
      { name: 'Sentadilla sin peso', sets: 2, reps: '15' },
      { name: 'Hip hinge', sets: 2, reps: '10' },
    ],
    'superior': [
      { name: 'Rotaciones de hombro', sets: 2, reps: '15' },
      { name: 'Flexiones de muñeca', sets: 1, reps: '10' },
    ],
    'inferior': [
      { name: 'Sentadilla goblet', sets: 2, reps: '10' },
      { name: 'Peso muerto rumano sin peso', sets: 2, reps: '10' },
    ],
    'full body': [
      { name: 'Jumping jacks', sets: 1, reps: '30 seg' },
      { name: 'Sentadilla sin peso', sets: 2, reps: '10' },
    ],
  }
  return warmups[muscle] || warmups['full body']
}

// ── Catálogo base de ejercicios ────────────────────────

export function getExerciseCatalog() {
  return {
    'empuje': [
      { id: 'press-banca',     name: 'Press de Banca',     muscle: 'Pecho',   tip: 'Retrae las escápulas. Pies firmes en el suelo.', defaultWeight: 40, defaultReps: 8, sets: 4 },
      { id: 'press-inclinado', name: 'Press Inclinado',    muscle: 'Pecho',   tip: '30-45° de inclinación. No arquees la espalda.', defaultWeight: 30, defaultReps: 10, sets: 3 },
      { id: 'press-hombro',    name: 'Press de Hombro',    muscle: 'Hombros', tip: 'No bloquees los codos arriba. Muñecas neutras.', defaultWeight: 20, defaultReps: 10, sets: 3 },
      { id: 'elevaciones-lat', name: 'Elevaciones Laterales', muscle: 'Hombros', tip: 'Codos ligeramente doblados. Sube hasta la altura del hombro.', defaultWeight: 8, defaultReps: 12, sets: 3 },
      { id: 'tricep-polea',    name: 'Jalones de Trícep',  muscle: 'Tríceps', tip: 'Codos fijos al costado. Extiende completo.', defaultWeight: 15, defaultReps: 12, sets: 3 },
    ],
    'tirón': [
      { id: 'jalon-polea',     name: 'Jalón al Pecho',     muscle: 'Espalda', tip: 'Inclínate ligeramente. Jala a la clavícula.', defaultWeight: 50, defaultReps: 10, sets: 4 },
      { id: 'remo-barra',      name: 'Remo con Barra',     muscle: 'Espalda', tip: 'Espalda paralela al suelo. Jala al ombligo.', defaultWeight: 40, defaultReps: 8, sets: 4 },
      { id: 'remo-mancuerna',  name: 'Remo con Mancuerna', muscle: 'Espalda', tip: 'Rodilla y mano de apoyo en el banco. Codo arriba.', defaultWeight: 20, defaultReps: 10, sets: 3 },
      { id: 'curl-bicep',      name: 'Curl de Bícep',      muscle: 'Bíceps',  tip: 'No balancees el torso. Supina la muñeca al subir.', defaultWeight: 12, defaultReps: 12, sets: 3 },
      { id: 'curl-martillo',   name: 'Curl Martillo',      muscle: 'Bíceps',  tip: 'Agarre neutro. Codos fijos.', defaultWeight: 12, defaultReps: 12, sets: 3 },
    ],
    'piernas': [
      { id: 'sentadilla',      name: 'Sentadilla',         muscle: 'Cuádriceps', tip: 'Rodillas alineadas con los pies. Pecho arriba.', defaultWeight: 60, defaultReps: 8, sets: 4 },
      { id: 'peso-muerto',     name: 'Peso Muerto',        muscle: 'Isquios',    tip: 'Barra cerca del cuerpo. Empuja el suelo, no jales.', defaultWeight: 70, defaultReps: 6, sets: 4 },
      { id: 'prensa',          name: 'Prensa de Piernas',  muscle: 'Cuádriceps', tip: 'No bloquees las rodillas. Espalda baja pegada al respaldo.', defaultWeight: 100, defaultReps: 10, sets: 3 },
      { id: 'extension-cuad',  name: 'Extensión de Cuádriceps', muscle: 'Cuádriceps', tip: 'Contrae arriba, baja controlado.', defaultWeight: 30, defaultReps: 12, sets: 3 },
      { id: 'curl-femoral',    name: 'Curl Femoral',       muscle: 'Isquios',    tip: 'Caderas pegadas al banco. Baja sin rebote.', defaultWeight: 25, defaultReps: 12, sets: 3 },
    ],
    'superior': [
      { id: 'press-banca',     name: 'Press de Banca',     muscle: 'Pecho',   tip: 'Retrae las escápulas.', defaultWeight: 40, defaultReps: 8, sets: 4 },
      { id: 'jalon-polea',     name: 'Jalón al Pecho',     muscle: 'Espalda', tip: 'Jala a la clavícula.', defaultWeight: 50, defaultReps: 10, sets: 4 },
      { id: 'press-hombro',    name: 'Press de Hombro',    muscle: 'Hombros', tip: 'Muñecas neutras.', defaultWeight: 20, defaultReps: 10, sets: 3 },
      { id: 'remo-mancuerna',  name: 'Remo con Mancuerna', muscle: 'Espalda', tip: 'Codo arriba.', defaultWeight: 20, defaultReps: 10, sets: 3 },
      { id: 'curl-bicep',      name: 'Curl de Bícep',      muscle: 'Bíceps',  tip: 'Codos fijos.', defaultWeight: 12, defaultReps: 12, sets: 3 },
    ],
    'inferior': [
      { id: 'sentadilla',      name: 'Sentadilla',         muscle: 'Cuádriceps', tip: 'Pecho arriba.', defaultWeight: 60, defaultReps: 8, sets: 4 },
      { id: 'peso-muerto',     name: 'Peso Muerto',        muscle: 'Isquios',    tip: 'Empuja el suelo.', defaultWeight: 70, defaultReps: 6, sets: 4 },
      { id: 'prensa',          name: 'Prensa de Piernas',  muscle: 'Cuádriceps', tip: 'No bloquees rodillas.', defaultWeight: 100, defaultReps: 10, sets: 3 },
      { id: 'curl-femoral',    name: 'Curl Femoral',       muscle: 'Isquios',    tip: 'Baja controlado.', defaultWeight: 25, defaultReps: 12, sets: 3 },
      { id: 'pantorrilla',     name: 'Elevación de Pantorrilla', muscle: 'Pantorrillas', tip: 'Rango completo de movimiento.', defaultWeight: 50, defaultReps: 15, sets: 4 },
    ],
    'full body': [
      { id: 'sentadilla',      name: 'Sentadilla',         muscle: 'Cuádriceps', tip: 'Pecho arriba.', defaultWeight: 60, defaultReps: 8, sets: 3 },
      { id: 'press-banca',     name: 'Press de Banca',     muscle: 'Pecho',   tip: 'Retrae escápulas.', defaultWeight: 40, defaultReps: 8, sets: 3 },
      { id: 'remo-barra',      name: 'Remo con Barra',     muscle: 'Espalda', tip: 'Espalda paralela.', defaultWeight: 40, defaultReps: 8, sets: 3 },
      { id: 'press-hombro',    name: 'Press de Hombro',    muscle: 'Hombros', tip: 'Muñecas neutras.', defaultWeight: 20, defaultReps: 10, sets: 3 },
    ],
  }
}
