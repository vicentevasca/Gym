import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth.store'
import { calcNutritionPlan } from '@/utils/tdee'
import { toDateKey } from '@/utils/formatters'
import { pct } from '@/utils/formatters'

export const useNutritionStore = defineStore('nutrition', () => {
  const auth = useAuthStore()

  const dayLog  = ref(null)
  const plan    = ref(null)
  const loading = ref(false)

  const consumed = computed(() => {
    if (!dayLog.value) return { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    const meals = dayLog.value.meals || []
    return meals.reduce((acc, meal) => {
      ;(meal.foods || []).forEach(f => {
        acc.kcal    += f.kcal    || 0
        acc.protein += f.protein || 0
        acc.carbs   += f.carbs   || 0
        acc.fat     += f.fat     || 0
      })
      return acc
    }, { kcal: 0, protein: 0, carbs: 0, fat: 0 })
  })

  // Normalized plan with simple keys { kcal, protein, carbs, fat }
  const targets = computed(() => plan.value ? {
    kcal:    plan.value.targetKcal ?? 2000,
    protein: plan.value.protein_g  ?? 150,
    carbs:   plan.value.carbs_g    ?? 200,
    fat:     plan.value.fat_g      ?? 60,
  } : { kcal: 2000, protein: 150, carbs: 200, fat: 60 })

  const percentages = computed(() => ({
    kcal:    pct(consumed.value.kcal,    targets.value.kcal),
    protein: pct(consumed.value.protein, targets.value.protein),
    carbs:   pct(consumed.value.carbs,   targets.value.carbs),
    fat:     pct(consumed.value.fat,     targets.value.fat),
  }))

  // ── Cargar / crear log del día ─────────────────────────

  async function loadDayLog() {
    if (!auth.uid) return
    loading.value = true
    try {
      // Calcular plan nutricional desde el perfil
      plan.value = calcNutritionPlan(auth.profile || {})

      const dateKey = toDateKey()
      const logRef  = doc(db, 'users', auth.uid, 'nutrition_logs', dateKey)
      const snap    = await getDoc(logRef)

      if (snap.exists()) {
        dayLog.value = snap.data()
      } else {
        const initial = {
          date:       dateKey,
          target_kcal: plan.value.targetKcal,
          water_ml:   0,
          meals: [
            { id: 'desayuno',  name: 'Desayuno',   time: '08:00', foods: [] },
            { id: 'almuerzo',  name: 'Almuerzo',   time: '13:00', foods: [] },
            { id: 'cena',      name: 'Cena',        time: '20:00', foods: [] },
            { id: 'snacks',    name: 'Snacks',      time: '',       foods: [] },
          ],
          created_at: serverTimestamp(),
        }
        await setDoc(logRef, initial)
        dayLog.value = initial
      }
    } finally {
      loading.value = false
    }
  }

  // ── Agregar alimento ───────────────────────────────────

  // food: { food_id, name, amount_g, kcal, protein, carbs, fat } (pre-calculated by FoodSearch)
  async function addFood(mealId, food) {
    if (!auth.uid || !dayLog.value) return
    const dateKey = toDateKey()
    const logRef  = doc(db, 'users', auth.uid, 'nutrition_logs', dateKey)
    const entry   = {
      food_id:   food.food_id || Date.now().toString(),
      name:      food.name,
      amount_g:  food.amount_g ?? 100,
      kcal:      food.kcal    ?? 0,
      protein:   food.protein ?? 0,
      carbs:     food.carbs   ?? 0,
      fat:       food.fat     ?? 0,
    }
    const meals = dayLog.value.meals.map(m => {
      if (m.id !== mealId) return m
      return { ...m, foods: [...(m.foods || []), entry] }
    })
    await updateDoc(logRef, { meals })
    dayLog.value = { ...dayLog.value, meals }
  }

  // ── Eliminar alimento ──────────────────────────────────

  async function removeFood(mealId, foodId) {
    if (!auth.uid || !dayLog.value) return
    const dateKey = toDateKey()
    const logRef  = doc(db, 'users', auth.uid, 'nutrition_logs', dateKey)
    const meals   = dayLog.value.meals.map(m => {
      if (m.id !== mealId) return m
      return { ...m, foods: m.foods.filter(f => f.food_id !== foodId) }
    })
    await updateDoc(logRef, { meals })
    dayLog.value = { ...dayLog.value, meals }
  }

  // ── Registrar agua ─────────────────────────────────────

  async function logWater(mlToAdd) {
    if (!auth.uid || !dayLog.value) return
    const dateKey  = toDateKey()
    const logRef   = doc(db, 'users', auth.uid, 'nutrition_logs', dateKey)
    const newTotal = (dayLog.value.water_ml || 0) + mlToAdd
    await updateDoc(logRef, { water_ml: newTotal })
    dayLog.value = { ...dayLog.value, water_ml: newTotal }
  }

  return {
    dayLog, plan, targets, loading, consumed, percentages,
    loadDayLog, addFood, removeFood, logWater,
  }
})
