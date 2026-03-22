<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  mealId: { type: String, required: true },
})
const emit = defineEmits(['add-food', 'close'])

// Simple built-in food database — expanded via Firestore /foods later
const FOODS_DB = [
  { id: 'pollo-pecho',  name: 'Pechuga de pollo', kcal: 165, protein: 31, carbs: 0,  fat: 3.6,  unit: '100g' },
  { id: 'arroz-blanco', name: 'Arroz blanco cocido', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, unit: '100g' },
  { id: 'huevo-entero', name: 'Huevo entero',       kcal: 155, protein: 13,  carbs: 1.1, fat: 11,  unit: '100g' },
  { id: 'salmon',       name: 'Salmón',             kcal: 208, protein: 20,  carbs: 0,   fat: 13,  unit: '100g' },
  { id: 'avena',        name: 'Avena seca',         kcal: 389, protein: 17,  carbs: 66,  fat: 7,   unit: '100g' },
  { id: 'platano',      name: 'Plátano',            kcal: 89,  protein: 1.1, carbs: 23,  fat: 0.3, unit: '100g' },
  { id: 'leche-ent',    name: 'Leche entera',       kcal: 61,  protein: 3.2, carbs: 4.8, fat: 3.3, unit: '100ml' },
  { id: 'yogur-grec',   name: 'Yogur griego',       kcal: 97,  protein: 9,   carbs: 3.6, fat: 5,   unit: '100g' },
  { id: 'brocoli',      name: 'Brócoli',            kcal: 34,  protein: 2.8, carbs: 7,   fat: 0.4, unit: '100g' },
  { id: 'papa-cocida',  name: 'Papa cocida',        kcal: 87,  protein: 1.9, carbs: 20,  fat: 0.1, unit: '100g' },
  { id: 'pan-integral', name: 'Pan integral',       kcal: 247, protein: 13,  carbs: 41,  fat: 4,   unit: '100g' },
  { id: 'aceite-oliva', name: 'Aceite de oliva',    kcal: 884, protein: 0,   carbs: 0,   fat: 100, unit: '100ml' },
  { id: 'almendras',    name: 'Almendras',          kcal: 579, protein: 21,  carbs: 22,  fat: 50,  unit: '100g' },
  { id: 'atun-lata',    name: 'Atún en lata',       kcal: 116, protein: 26,  carbs: 0,   fat: 1,   unit: '100g' },
  { id: 'clara-huevo',  name: 'Clara de huevo',     kcal: 52,  protein: 11,  carbs: 0.7, fat: 0.2, unit: '100g' },
]

const query    = ref('')
const selected = ref(null)
const amount   = ref(100)

const results = computed(() => {
  const q = query.value.toLowerCase().trim()
  if (!q) return FOODS_DB.slice(0, 8)
  return FOODS_DB.filter(f => f.name.toLowerCase().includes(q)).slice(0, 8)
})

const preview = computed(() => {
  if (!selected.value) return null
  const f   = selected.value
  const mul = amount.value / 100
  return {
    kcal:    Math.round(f.kcal    * mul),
    protein: Math.round(f.protein * mul * 10) / 10,
    carbs:   Math.round(f.carbs   * mul * 10) / 10,
    fat:     Math.round(f.fat     * mul * 10) / 10,
  }
})

function selectFood(food) {
  selected.value = food
  amount.value   = 100
}

function addFood() {
  if (!selected.value || !preview.value) return
  emit('add-food', {
    food_id:  selected.value.id,
    name:     selected.value.name,
    amount_g: amount.value,
    ...preview.value,
  })
  selected.value = null
  query.value    = ''
  amount.value   = 100
}
</script>

<template>
  <div class="food-search card">
    <div class="fs-header">
      <h4 class="fs-title">Añadir alimento</h4>
      <button class="fs-close" @click="emit('close')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- Search input -->
    <div class="input-with-icon mb-3">
      <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input
        v-model="query"
        class="input-field"
        placeholder="Buscar alimento…"
        type="search"
        autocomplete="off"
      />
    </div>

    <!-- Results list -->
    <div v-if="!selected" class="fs-results">
      <button
        v-for="food in results"
        :key="food.id"
        class="food-row"
        @click="selectFood(food)"
      >
        <span class="food-name">{{ food.name }}</span>
        <span class="food-meta">{{ food.kcal }} kcal / {{ food.unit }}</span>
      </button>
    </div>

    <!-- Selected food — amount entry -->
    <div v-else class="fs-selected">
      <div class="selected-name">{{ selected.name }}</div>
      <div class="amount-row">
        <label class="amount-label">Cantidad (g / ml)</label>
        <input
          v-model.number="amount"
          class="input-field amount-input"
          type="number"
          inputmode="numeric"
          min="1"
          max="2000"
        />
      </div>

      <div v-if="preview" class="macro-preview">
        <div class="mp-item"><span class="mp-val">{{ preview.kcal }}</span><span class="mp-lbl">kcal</span></div>
        <div class="mp-item"><span class="mp-val">{{ preview.protein }}g</span><span class="mp-lbl">prot</span></div>
        <div class="mp-item"><span class="mp-val">{{ preview.carbs }}g</span><span class="mp-lbl">carbos</span></div>
        <div class="mp-item"><span class="mp-val">{{ preview.fat }}g</span><span class="mp-lbl">grasa</span></div>
      </div>

      <div class="fs-actions">
        <button class="btn btn-ghost" @click="selected = null">← Volver</button>
        <button class="btn btn-primary" @click="addFood">Añadir</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.food-search { padding: var(--space-5); }
.fs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
.fs-title  { font-size: var(--text-base); font-weight: 700; }
.fs-close  { background: none; border: none; color: var(--muted); cursor: pointer; padding: 4px; }
.fs-close:hover { color: var(--text); }

.mb-3 { margin-bottom: var(--space-3); }

.fs-results { display: flex; flex-direction: column; gap: var(--space-1); max-height: 280px; overflow-y: auto; }
.food-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--space-3) var(--space-3);
  border-radius: var(--radius-sm);
  background: transparent; border: none; cursor: pointer;
  transition: background 0.15s; text-align: left; width: 100%;
}
.food-row:hover { background: var(--faint-2); }
.food-name { font-size: var(--text-sm); font-weight: 600; color: var(--text); }
.food-meta { font-size: var(--text-xs); color: var(--muted); }

.selected-name { font-size: var(--text-base); font-weight: 700; margin-bottom: var(--space-4); }
.amount-row { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }
.amount-label { font-size: var(--text-xs); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em; }
.amount-input { text-align: center; font-size: var(--text-xl); font-weight: 800; max-width: 140px; }

.macro-preview {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2); margin-bottom: var(--space-5);
  background: var(--faint-2); border-radius: var(--radius); padding: var(--space-3);
}
.mp-item { text-align: center; }
.mp-val  { display: block; font-size: var(--text-base); font-weight: 800; font-family: var(--font-mono); color: var(--text); }
.mp-lbl  { display: block; font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 1px; }

.fs-actions { display: flex; gap: var(--space-3); }
.fs-actions .btn { flex: 1; }
</style>
