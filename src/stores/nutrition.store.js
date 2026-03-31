import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { doc, getDoc, setDoc, updateDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth.store'
import { calcNutritionPlan } from '@/utils/tdee'
import { toDateKey } from '@/utils/formatters'
import { pct } from '@/utils/formatters'
import { useToast } from '@/composables/useToast'

export const useNutritionStore = defineStore('nutrition', () => {
  const auth = useAuthStore()

  const dayLog   = ref(null)
  const plan     = ref(null)
  const loading  = ref(false)
  const dietPlan = ref(null)
  const history  = ref([])

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
          date:        dateKey,
          target_kcal: plan.value.targetKcal,
          water_ml:    0,
          meals: [
            { id: 'desayuno', name: 'Desayuno', time: '08:00', foods: [] },
            { id: 'almuerzo', name: 'Almuerzo', time: '13:00', foods: [] },
            { id: 'cena',     name: 'Cena',     time: '20:00', foods: [] },
            { id: 'snacks',   name: 'Snacks',   time: '',       foods: [] },
          ],
          created_at: serverTimestamp(),
        }
        await setDoc(logRef, initial)
        dayLog.value = initial
      }

      // Cargar plan de dieta e historial en paralelo
      await Promise.all([loadDietPlan(), loadHistory()])
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
      food_id:  food.food_id || Date.now().toString(),
      name:     food.name,
      amount_g: food.amount_g ?? 100,
      kcal:     food.kcal    ?? 0,
      protein:  food.protein ?? 0,
      carbs:    food.carbs   ?? 0,
      fat:      food.fat     ?? 0,
    }
    const meals = dayLog.value.meals.map(m => {
      if (m.id !== mealId) return m
      return { ...m, foods: [...(m.foods || []), entry] }
    })
    await updateDoc(logRef, { meals })
    dayLog.value = { ...dayLog.value, meals }
    const { toast } = useToast()
    toast.success(`${food.name} añadido — ${food.kcal} kcal`)
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

  // ── Plan de dieta ──────────────────────────────────────

  async function saveDietPlan(planData) {
    if (!auth.uid) return
    const planRef = doc(db, 'users', auth.uid, 'nutrition_logs', 'diet_profile')
    const toSave  = {
      ...planData,
      saved_at: serverTimestamp(),
    }
    await setDoc(planRef, toSave)
    dietPlan.value = planData
  }

  async function loadDietPlan() {
    if (!auth.uid) return
    try {
      const planRef = doc(db, 'users', auth.uid, 'nutrition_logs', 'diet_profile')
      const snap    = await getDoc(planRef)
      if (snap.exists()) {
        dietPlan.value = snap.data()
      }
    } catch (e) {
      console.warn('[nutrition] No se pudo cargar el plan de dieta:', e)
    }
  }

  // ── Historial de 7 días ────────────────────────────────

  async function loadHistory() {
    if (!auth.uid) return
    try {
      const today     = new Date()
      const days      = []
      const targetKcal = plan.value?.targetKcal ?? 2000

      // Generar los últimos 7 días (incluyendo hoy)
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        const year  = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day   = String(d.getDate()).padStart(2, '0')
        days.push(`${year}-${month}-${day}`)
      }

      const snapshots = await Promise.all(
        days.map(dateKey => getDoc(doc(db, 'users', auth.uid, 'nutrition_logs', dateKey)))
      )

      history.value = days.map((dateKey, idx) => {
        const snap = snapshots[idx]
        if (!snap.exists()) {
          return { date: dateKey, kcal: 0, target_kcal: targetKcal, protein: 0, carbs: 0, fat: 0, meals: [], empty: true }
        }
        const data  = snap.data()
        const meals = data.meals || []
        let kcal = 0, protein = 0, carbs = 0, fat = 0
        meals.forEach(meal => {
          ;(meal.foods || []).forEach(f => {
            kcal    += f.kcal    || 0
            protein += f.protein || 0
            carbs   += f.carbs   || 0
            fat     += f.fat     || 0
          })
        })
        return {
          date:        dateKey,
          kcal:        Math.round(kcal),
          target_kcal: data.target_kcal ?? targetKcal,
          protein:     Math.round(protein),
          carbs:       Math.round(carbs),
          fat:         Math.round(fat),
          water_ml:    data.water_ml ?? 0,
          meals,
          empty:       false,
        }
      })
    } catch (e) {
      console.warn('[nutrition] No se pudo cargar el historial:', e)
    }
  }

  // ── Copiar comidas de ayer ─────────────────────────────

  async function copyFromYesterday() {
    if (!auth.uid || !dayLog.value) return
    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yKey   = yesterday.toISOString().slice(0, 10)
      const yRef   = doc(db, 'users', auth.uid, 'nutrition_logs', yKey)
      const ySnap  = await getDoc(yRef)
      if (!ySnap.exists()) return false

      const yData  = ySnap.data()
      const yMeals = yData.meals || []

      // Merge: añadir los foods de ayer a las comidas de hoy (misma meal id)
      const todayKey = toDateKey()
      const logRef   = doc(db, 'users', auth.uid, 'nutrition_logs', todayKey)

      const merged = dayLog.value.meals.map(meal => {
        const yMeal = yMeals.find(m => m.id === meal.id)
        if (!yMeal || !yMeal.foods?.length) return meal
        // Re-stamp food_id to avoid duplicates on repeated copies
        const newFoods = yMeal.foods.map(f => ({
          ...f,
          food_id: `copy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        }))
        return { ...meal, foods: [...(meal.foods || []), ...newFoods] }
      })

      await updateDoc(logRef, { meals: merged })
      dayLog.value = { ...dayLog.value, meals: merged }
      return true
    } catch (e) {
      console.warn('[nutrition] copyFromYesterday error:', e)
      return false
    }
  }

  function clearState() {
    dayLog.value   = null
    plan.value     = null
    loading.value  = false
    dietPlan.value = null
    history.value  = []
  }

  return {
    dayLog, plan, targets, loading, consumed, percentages,
    dietPlan, history,
    loadDayLog, addFood, removeFood, logWater,
    saveDietPlan, loadDietPlan, loadHistory, copyFromYesterday,
    clearState,
  }
})
