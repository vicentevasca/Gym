import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { doc, getDoc, setDoc, updateDoc, getDocs, addDoc, deleteDoc, collection, serverTimestamp, query, where, documentId, orderBy, increment } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth.store'
import { calcNutritionPlan } from '@/utils/tdee'
import { toDateKey } from '@/utils/formatters'
import { pct } from '@/utils/formatters'
import { useToast } from '@/composables/useToast'

export const useNutritionStore = defineStore('nutrition', () => {
  const auth = useAuthStore()

  const dayLog      = ref(null)
  const plan        = ref(null)
  const loading     = ref(false)
  const dietPlan    = ref(null)
  const history     = ref([])
  const customFoods = ref([])
  let _dayKey             = null
  let _dietLoaded         = false
  let _customFoodsLoaded  = false

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
    const dateKey = toDateKey()
    // Ya cargado hoy — no releer Firestore al cambiar de tab
    if (_dayKey === dateKey && dayLog.value) return
    loading.value = true
    try {
      // Calcular plan nutricional desde el perfil
      plan.value = calcNutritionPlan(auth.profile || {})

      const logRef  = doc(db, 'users', auth.uid, 'nutrition_logs', dateKey)
      const snap    = await getDoc(logRef)

      if (snap.exists()) {
        dayLog.value = snap.data()
        _dayKey = dateKey
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
        _dayKey = dateKey
      }

      // Cargar plan de dieta, historial y alimentos personalizados en paralelo
      await Promise.all([loadDietPlan(), loadHistory(), loadCustomFoods()])
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
    if (!auth.uid || _dietLoaded) return
    try {
      const planRef = doc(db, 'users', auth.uid, 'nutrition_logs', 'diet_profile')
      const snap    = await getDoc(planRef)
      if (snap.exists()) dietPlan.value = snap.data()
      _dietLoaded = true
    } catch (e) {
      console.warn('[nutrition] No se pudo cargar el plan de dieta:', e)
    }
  }

  // ── Historial de 7 días ────────────────────────────────

  async function loadHistory() {
    if (!auth.uid) return
    try {
      const today      = new Date()
      const targetKcal = plan.value?.targetKcal ?? 2000
      const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

      // Construir array de los últimos 7 días
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        days.push(fmt(d))
      }
      const startKey = days[0]
      const endKey   = days[days.length - 1]

      // Una sola query de rango en vez de 7 lecturas individuales
      const snap = await getDocs(
        query(
          collection(db, 'users', auth.uid, 'nutrition_logs'),
          where(documentId(), '>=', startKey),
          where(documentId(), '<=', endKey)
        )
      )
      const docsMap = {}
      snap.docs.forEach(d => { docsMap[d.id] = d.data() })

      history.value = days.map(dateKey => {
        const data = docsMap[dateKey]
        if (!data) return { date: dateKey, kcal: 0, target_kcal: targetKcal, protein: 0, carbs: 0, fat: 0, meals: [], empty: true }
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
      const yKey   = toDateKey(yesterday)
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

  // ── Alimentos personalizados (biblioteca) ─────────────

  async function loadCustomFoods() {
    if (!auth.uid || _customFoodsLoaded) return
    try {
      const snap = await getDocs(
        query(
          collection(db, 'users', auth.uid, 'custom_foods'),
          orderBy('usage_count', 'desc'),
        )
      )
      customFoods.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      _customFoodsLoaded = true
    } catch (e) {
      console.warn('[nutrition] No se pudo cargar alimentos personalizados:', e)
    }
  }

  async function saveCustomFood(food) {
    if (!auth.uid) return null
    const data = {
      name:          food.name,
      kcal:          Math.round(food.kcal    ?? 0),
      protein:       Math.round((food.protein ?? 0) * 10) / 10,
      carbs:         Math.round((food.carbs   ?? 0) * 10) / 10,
      fat:           Math.round((food.fat     ?? 0) * 10) / 10,
      serving_grams: food.serving_grams ?? null,
      serving_label: food.serving_label ?? null,
      source:        food.source ?? 'manual',
      usage_count:   food.usage_count ?? 0,
      updated_at:    serverTimestamp(),
    }
    if (food.id) {
      const ref = doc(db, 'users', auth.uid, 'custom_foods', food.id)
      await setDoc(ref, { ...data, created_at: food.created_at ?? serverTimestamp() }, { merge: true })
      const idx = customFoods.value.findIndex(f => f.id === food.id)
      const updated = { ...food, ...data }
      if (idx >= 0) customFoods.value[idx] = updated
      else customFoods.value.unshift(updated)
      return { id: food.id, ...updated }
    } else {
      const ref = await addDoc(collection(db, 'users', auth.uid, 'custom_foods'), {
        ...data,
        created_at: serverTimestamp(),
      })
      const newFood = { id: ref.id, ...data }
      customFoods.value.unshift(newFood)
      return newFood
    }
  }

  async function deleteCustomFood(foodId) {
    if (!auth.uid) return
    await deleteDoc(doc(db, 'users', auth.uid, 'custom_foods', foodId))
    customFoods.value = customFoods.value.filter(f => f.id !== foodId)
  }

  async function incrementCustomFoodUsage(foodId) {
    if (!auth.uid || !foodId) return
    if (!customFoods.value.find(f => f.id === foodId)) return
    try {
      await updateDoc(doc(db, 'users', auth.uid, 'custom_foods', foodId), {
        usage_count: increment(1),
      })
      const idx = customFoods.value.findIndex(f => f.id === foodId)
      if (idx >= 0) {
        customFoods.value[idx] = {
          ...customFoods.value[idx],
          usage_count: (customFoods.value[idx].usage_count || 0) + 1,
        }
      }
    } catch { /* ignore */ }
  }

  function clearState() {
    dayLog.value   = null
    plan.value     = null
    loading.value  = false
    dietPlan.value = null
    history.value  = []
    _dayKey             = null
    _dietLoaded         = false
    customFoods.value   = []
    _customFoodsLoaded  = false
  }

  return {
    dayLog, plan, targets, loading, consumed, percentages,
    dietPlan, history, customFoods,
    loadDayLog, addFood, removeFood, logWater,
    saveDietPlan, loadDietPlan, loadHistory, copyFromYesterday,
    loadCustomFoods, saveCustomFood, deleteCustomFood, incrementCustomFoodUsage,
    clearState,
  }
})
