<script setup>
import { ref, computed } from 'vue'
import FoodSearch from './FoodSearch.vue'
import { useNutritionStore } from '@/stores/nutrition.store'

const props = defineProps({
  meal: { type: Object, required: true },
})

const nutrition  = useNutritionStore()
const searching  = ref(false)

const mealIcons = {
  breakfast: '🌅',
  lunch:     '☀️',
  snack:     '🍎',
  dinner:    '🌙',
}

async function handleAdd(food) {
  await nutrition.addFood(props.meal.id, food)
  searching.value = false
}

async function handleRemove(foodId) {
  await nutrition.removeFood(props.meal.id, foodId)
}

const mealKcal = computed(() => props.meal.foods?.reduce((a, f) => a + (f.kcal || 0), 0) ?? 0)
</script>

<template>
  <div class="meal-logger card-sm">
    <!-- Meal header -->
    <div class="meal-header">
      <div class="meal-info">
        <span class="meal-icon">{{ mealIcons[meal.id] ?? '🍽️' }}</span>
        <div>
          <p class="meal-name">{{ meal.name }}</p>
          <p class="meal-kcal">{{ mealKcal }} kcal</p>
        </div>
      </div>
      <button class="add-btn" @click="searching = !searching">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>

    <!-- Food items -->
    <div v-if="meal.foods?.length" class="food-list">
      <div v-for="food in meal.foods" :key="food.food_id" class="food-item">
        <div class="food-item-info">
          <span class="food-item-name">{{ food.name }}</span>
          <span class="food-item-amount">{{ food.amount_g }}g</span>
        </div>
        <div class="food-item-macros">
          <span class="food-macro kcal">{{ food.kcal }} kcal</span>
          <span class="food-macro">P {{ food.protein }}g</span>
          <span class="food-macro">C {{ food.carbs }}g</span>
          <span class="food-macro">G {{ food.fat }}g</span>
        </div>
        <button class="remove-btn" @click="handleRemove(food.food_id)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    <p v-else class="empty-meal">Sin alimentos registrados</p>

    <!-- Food search panel -->
    <div v-if="searching" class="search-panel">
      <FoodSearch :meal-id="meal.id" @add-food="handleAdd" @close="searching = false" />
    </div>
  </div>
</template>

<style scoped>
.meal-logger { padding: var(--space-4); }

.meal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
.meal-info   { display: flex; align-items: center; gap: var(--space-3); }
.meal-icon   { font-size: 22px; }
.meal-name   { font-size: var(--text-base); font-weight: 700; }
.meal-kcal   { font-size: var(--text-xs); color: var(--muted); font-family: var(--font-mono); margin-top: 1px; }

.add-btn {
  width: 44px; height: 44px; border-radius: 50%;
  border: 1.5px solid var(--accent); background: var(--accent-dim); color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: var(--transition);
}
.add-btn:hover { background: var(--accent); color: #fff; }

.food-list { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-3); }
.food-item {
  display: grid; grid-template-columns: 1fr auto;
  gap: var(--space-1); padding: var(--space-2) var(--space-2);
  background: var(--faint-2); border-radius: var(--radius-sm);
  align-items: center;
}
.food-item-info { display: flex; align-items: baseline; gap: var(--space-2); grid-column: 1; }
.food-item-name { font-size: var(--text-sm); font-weight: 600; }
.food-item-amount { font-size: var(--text-xs); color: var(--muted); }
.food-item-macros { display: flex; gap: var(--space-3); grid-column: 1; }
.food-macro { font-size: 11px; color: var(--muted); }
.food-macro.kcal { color: var(--accent); font-weight: 700; }
.remove-btn {
  grid-row: 1 / 3; grid-column: 2;
  background: none; border: none; color: var(--muted); cursor: pointer;
  padding: 4px; border-radius: 50%; transition: var(--transition);
}
.remove-btn:hover { color: var(--danger); background: var(--danger-dim, rgba(239,68,68,.1)); }

.empty-meal { font-size: var(--text-sm); color: var(--muted); text-align: center; padding: var(--space-3) 0; }

.search-panel { margin-top: var(--space-3); }
</style>
