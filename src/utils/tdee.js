/**
 * DISCIPLINA — Cálculo TDEE + Macros
 * Fórmula: Mifflin-St Jeor (más precisa que Harris-Benedict)
 */

const ACTIVITY_MULTIPLIERS = {
  sedentario:  1.2,
  ligero:      1.375,
  moderado:    1.55,
  muy_activo:  1.725,
}

// Días de gym ajustan ligeramente el multiplicador
const GYM_BONUS = { 2: 0, 3: 0.025, 4: 0.05, 5: 0.075, 6: 0.1 }

/**
 * Calcula BMR usando Mifflin-St Jeor
 */
export function calcBMR(weightKg, heightCm, ageYears, sex) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears
  return sex === 'masculino' ? base + 5 : base - 161
}

/**
 * Calcula edad en años desde fecha de nacimiento (YYYY-MM-DD)
 */
export function calcAge(dob) {
  if (!dob) return 25
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return Math.max(age, 15)
}

/**
 * Calcula TDEE completo
 */
export function calcTDEE(profile) {
  const { weight_kg, height_cm, dob, sex } = profile.biometrics || {}
  const activityLevel  = profile.activity_level || 'moderado'
  const gymDays        = profile.training_prefs?.gym_days_per_week || 3

  if (!weight_kg || !height_cm) return 2000

  const age        = calcAge(dob)
  const bmr        = calcBMR(Number(weight_kg), Number(height_cm), age, sex)
  const multiplier = (ACTIVITY_MULTIPLIERS[activityLevel] || 1.55) + (GYM_BONUS[gymDays] || 0)

  return Math.round(bmr * multiplier)
}

/**
 * Calcula objetivo calórico según meta
 */
export function calcTargetKcal(tdee, goal) {
  const adjustments = {
    perder_grasa:  -400,
    ganar_musculo: +300,
    recomposicion: -100,
    mantener:       0,
    rendimiento:  +200,
  }
  return Math.max(1200, tdee + (adjustments[goal] || 0))
}

/**
 * Distribuye macros en gramos según objetivo
 * Retorna { protein_g, carbs_g, fat_g }
 */
export function calcMacros(targetKcal, weightKg, goal) {
  const w = Number(weightKg) || 75

  // Proteína base por objetivo (g/kg)
  const proteinPerKg = {
    perder_grasa:  2.2,
    ganar_musculo: 2.0,
    recomposicion: 2.4,
    mantener:      1.8,
    rendimiento:   2.0,
  }

  const protein_g = Math.round(w * (proteinPerKg[goal] || 2.0))
  const proteinKcal = protein_g * 4

  // Grasa: 25% de calorías totales
  const fat_g = Math.round((targetKcal * 0.25) / 9)
  const fatKcal = fat_g * 9

  // Carbos: el resto
  const carbs_g = Math.round((targetKcal - proteinKcal - fatKcal) / 4)

  return {
    protein_g: Math.max(protein_g, 50),
    carbs_g:   Math.max(carbs_g, 20),
    fat_g:     Math.max(fat_g, 30),
  }
}

/**
 * Calcula todo de una vez desde el perfil
 */
export function calcNutritionPlan(profile) {
  const goal      = profile.goals?.primary_goal || 'mantener'
  const weightKg  = profile.biometrics?.weight_kg || 75
  const tdee      = calcTDEE(profile)
  const targetKcal = calcTargetKcal(tdee, goal)
  const macros    = calcMacros(targetKcal, weightKg, goal)

  return { tdee, targetKcal, goal, ...macros, water_ml: Math.round(weightKg * 35) }
}
