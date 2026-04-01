<script setup>
import { ref, computed } from 'vue'
import { useNutritionStore } from '@/stores/nutrition.store'
import { useToast } from '@/composables/useToast'

const emit = defineEmits(['saved', 'cancel'])

const nutrition = useNutritionStore()
const { toast }  = useToast()

// ── Local food DB for ingredient search ─────────────────────────
const LOCAL_DB = [
  { id: 'pollo-pecho',  name: 'Pechuga de pollo',   kcal: 165, protein: 31,  carbs: 0,   fat: 3.6 },
  { id: 'arroz-blanco', name: 'Arroz blanco cocido', kcal: 130, protein: 2.7, carbs: 28,  fat: 0.3 },
  { id: 'huevo-entero', name: 'Huevo entero',        kcal: 155, protein: 13,  carbs: 1.1, fat: 11  },
  { id: 'salmon',       name: 'Salmón',              kcal: 208, protein: 20,  carbs: 0,   fat: 13  },
  { id: 'avena',        name: 'Avena seca',          kcal: 389, protein: 17,  carbs: 66,  fat: 7   },
  { id: 'platano',      name: 'Plátano',             kcal: 89,  protein: 1.1, carbs: 23,  fat: 0.3 },
  { id: 'leche-ent',    name: 'Leche entera',        kcal: 61,  protein: 3.2, carbs: 4.8, fat: 3.3 },
  { id: 'yogur-grec',   name: 'Yogur griego',        kcal: 97,  protein: 9,   carbs: 3.6, fat: 5   },
  { id: 'brocoli',      name: 'Brócoli',             kcal: 34,  protein: 2.8, carbs: 7,   fat: 0.4 },
  { id: 'papa-cocida',  name: 'Papa cocida',         kcal: 87,  protein: 1.9, carbs: 20,  fat: 0.1 },
  { id: 'pan-integral', name: 'Pan integral',        kcal: 247, protein: 13,  carbs: 41,  fat: 4   },
  { id: 'aceite-oliva', name: 'Aceite de oliva',     kcal: 884, protein: 0,   carbs: 0,   fat: 100 },
  { id: 'almendras',    name: 'Almendras',           kcal: 579, protein: 21,  carbs: 22,  fat: 50  },
  { id: 'atun-lata',    name: 'Atún en lata',        kcal: 116, protein: 26,  carbs: 0,   fat: 1   },
  { id: 'clara-huevo',  name: 'Clara de huevo',      kcal: 52,  protein: 11,  carbs: 0.7, fat: 0.2 },
  { id: 'pechuga-pavo', name: 'Pechuga de pavo',     kcal: 135, protein: 29,  carbs: 0,   fat: 1.5 },
  { id: 'lentejas',     name: 'Lentejas cocidas',    kcal: 116, protein: 9,   carbs: 20,  fat: 0.4 },
  { id: 'queso-cottage',name: 'Queso cottage',       kcal: 98,  protein: 11,  carbs: 3.4, fat: 4.3 },
  { id: 'manzana',      name: 'Manzana',             kcal: 52,  protein: 0.3, carbs: 14,  fat: 0.2 },
  { id: 'batata',       name: 'Batata / camote',     kcal: 86,  protein: 1.6, carbs: 20,  fat: 0.1 },
]

// ── State ────────────────────────────────────────────────────────
const step        = ref('ingredients') // 'ingredients' | 'details'
const ingredients = ref([])            // [{ food, grams }]
const recipeName  = ref('')
const servings    = ref(1)
const servingLabel= ref('')
const ingQuery    = ref('')
const saving      = ref(false)

// ── Search results for adding ingredients ───────────────────────
const ingResults = computed(() => {
  const q = ingQuery.value.toLowerCase().trim()
  const pool = [
    ...nutrition.customFoods.map(f => ({ ...f, isCustom: true })),
    ...LOCAL_DB,
  ]
  if (!q) return pool.slice(0, 8)
  return pool.filter(f => f.name.toLowerCase().includes(q)).slice(0, 10)
})

function addIngredient(food) {
  ingredients.value.push({ food: { ...food }, grams: food.serving_grams || 100 })
  ingQuery.value = ''
}

function removeIngredient(idx) {
  ingredients.value.splice(idx, 1)
}

// ── Nutrition calculations ───────────────────────────────────────
const total = computed(() => {
  return ingredients.value.reduce((acc, ing) => {
    const mul = ing.grams / 100
    acc.kcal    += (ing.food.kcal    || 0) * mul
    acc.protein += (ing.food.protein || 0) * mul
    acc.carbs   += (ing.food.carbs   || 0) * mul
    acc.fat     += (ing.food.fat     || 0) * mul
    return acc
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0 })
})

const totalGrams = computed(() =>
  ingredients.value.reduce((a, i) => a + (Number(i.grams) || 0), 0)
)

const perServing = computed(() => {
  const s = Math.max(1, Number(servings.value) || 1)
  return {
    kcal:    Math.round(total.value.kcal    / s),
    protein: Math.round(total.value.protein / s * 10) / 10,
    carbs:   Math.round(total.value.carbs   / s * 10) / 10,
    fat:     Math.round(total.value.fat     / s * 10) / 10,
  }
})

const gramsPerServing = computed(() => totalGrams.value / Math.max(1, Number(servings.value) || 1))

const per100g = computed(() => {
  const gpS = gramsPerServing.value
  if (gpS <= 0) return { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  const mul = 100 / gpS
  return {
    kcal:    Math.round(perServing.value.kcal    * mul),
    protein: Math.round(perServing.value.protein * mul * 10) / 10,
    carbs:   Math.round(perServing.value.carbs   * mul * 10) / 10,
    fat:     Math.round(perServing.value.fat     * mul * 10) / 10,
  }
})

const canSave = computed(() =>
  recipeName.value.trim().length >= 2 &&
  ingredients.value.length >= 1 &&
  gramsPerServing.value > 0
)

async function save() {
  if (!canSave.value || saving.value) return
  saving.value = true
  try {
    const gpS = Math.round(gramsPerServing.value)
    const food = await nutrition.saveCustomFood({
      name:          recipeName.value.trim(),
      kcal:          per100g.value.kcal,
      protein:       per100g.value.protein,
      carbs:         per100g.value.carbs,
      fat:           per100g.value.fat,
      serving_grams: gpS,
      serving_label: servingLabel.value.trim() || `1 porción (${gpS}g)`,
      source:        'recipe',
    })
    toast.success(`Receta "${food.name}" guardada`)
    emit('saved', food)
  } catch {
    toast.error('No se pudo guardar la receta')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="rb">

    <!-- ── Step: ingredients ──────────────────────────────── -->
    <template v-if="step === 'ingredients'">
      <p class="rb-title">Crear receta</p>

      <!-- Ingredient search -->
      <div class="rb-search mb-3">
        <input
          v-model="ingQuery"
          class="input-field"
          placeholder="Buscar ingrediente…"
          autocomplete="off"
        />
      </div>

      <!-- Results -->
      <div v-if="ingQuery" class="rb-results mb-3">
        <div v-if="!ingResults.length" class="rb-empty">Sin resultados</div>
        <button
          v-for="food in ingResults"
          :key="food.id"
          class="rb-food-row"
          @click="addIngredient(food)"
        >
          <span class="rb-food-name">{{ food.name }}</span>
          <span v-if="food.isCustom" class="badge-tuyo">Tuyo</span>
          <span class="rb-food-kcal">{{ food.kcal }} kcal/100g</span>
        </button>
      </div>

      <!-- Ingredients list -->
      <div v-if="ingredients.length" class="rb-ing-list mb-4">
        <p class="rb-section-label">Ingredientes</p>
        <div v-for="(ing, idx) in ingredients" :key="idx" class="rb-ing-row">
          <span class="rb-ing-name">{{ ing.food.name }}</span>
          <div class="rb-ing-grams">
            <input
              v-model.number="ing.grams"
              class="input-field rb-grams-input"
              type="number"
              inputmode="decimal"
              min="1"
              max="5000"
            />
            <span class="rb-grams-unit">g</span>
          </div>
          <button class="rb-remove" @click="removeIngredient(idx)">×</button>
        </div>
      </div>

      <!-- Totals preview -->
      <div v-if="ingredients.length" class="rb-totals mb-4">
        <div class="rb-totals-row">
          <span class="rb-totals-lbl">Total receta</span>
          <span class="rb-totals-val">{{ Math.round(total.kcal) }} kcal · {{ totalGrams }}g</span>
        </div>
        <div class="rb-totals-row">
          <span class="rb-totals-lbl">P {{ total.protein.toFixed(1) }}g</span>
          <span class="rb-totals-lbl">C {{ total.carbs.toFixed(1) }}g</span>
          <span class="rb-totals-lbl">G {{ total.fat.toFixed(1) }}g</span>
        </div>
      </div>

      <div class="rb-actions">
        <button class="btn btn-ghost" @click="emit('cancel')">Cancelar</button>
        <button
          class="btn btn-primary"
          :disabled="!ingredients.length"
          @click="step = 'details'"
        >
          Continuar →
        </button>
      </div>
    </template>

    <!-- ── Step: details ──────────────────────────────────── -->
    <template v-else>
      <button class="rb-back" @click="step = 'ingredients'">← Volver</button>
      <p class="rb-title mb-3">Detalles de la receta</p>

      <div class="field-group mb-3">
        <label class="field-label">Nombre de la receta *</label>
        <input
          v-model="recipeName"
          class="input-field"
          placeholder="Ej: Bowl de pollo y arroz"
          maxlength="80"
          autofocus
        />
      </div>

      <div class="servings-row mb-3">
        <div class="field-group">
          <label class="field-label">Porciones</label>
          <input
            v-model.number="servings"
            class="input-field"
            type="number"
            inputmode="numeric"
            min="1"
            max="50"
          />
        </div>
        <div class="field-group">
          <label class="field-label">Etiqueta porción</label>
          <input
            v-model="servingLabel"
            class="input-field"
            placeholder='Ej: "1 bowl"'
            maxlength="40"
          />
        </div>
      </div>

      <!-- Per serving preview -->
      <div class="rb-per-serving mb-4">
        <p class="rb-section-label">Por porción ({{ Math.round(gramsPerServing) }}g)</p>
        <div class="rb-macro-grid">
          <div class="rb-macro-item">
            <span class="rb-macro-val accent">{{ perServing.kcal }}</span>
            <span class="rb-macro-lbl">kcal</span>
          </div>
          <div class="rb-macro-item">
            <span class="rb-macro-val">{{ perServing.protein }}g</span>
            <span class="rb-macro-lbl">prot</span>
          </div>
          <div class="rb-macro-item">
            <span class="rb-macro-val">{{ perServing.carbs }}g</span>
            <span class="rb-macro-lbl">carbos</span>
          </div>
          <div class="rb-macro-item">
            <span class="rb-macro-val">{{ perServing.fat }}g</span>
            <span class="rb-macro-lbl">grasa</span>
          </div>
        </div>
      </div>

      <div class="rb-actions">
        <button class="btn btn-ghost" @click="emit('cancel')">Cancelar</button>
        <button class="btn btn-primary" :disabled="!canSave || saving" @click="save">
          <span v-if="saving" class="spinner-xs" />
          <span v-else>Guardar receta</span>
        </button>
      </div>
    </template>

  </div>
</template>

<style scoped>
.rb { padding: var(--space-1) 0; }
.rb-title { font-size: var(--text-base); font-weight: 700; margin-bottom: var(--space-3); }
.mb-3 { margin-bottom: var(--space-3); }
.mb-4 { margin-bottom: var(--space-4); }

.rb-back {
  background: none; border: none; color: var(--muted);
  font-size: var(--text-sm); cursor: pointer; padding: 0;
  margin-bottom: var(--space-3); display: block;
}
.rb-back:hover { color: var(--text); }

.field-group { display: flex; flex-direction: column; gap: var(--space-1); }
.field-label { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em; }

.rb-section-label {
  font-size: 10px; font-weight: 700; color: var(--muted);
  text-transform: uppercase; letter-spacing: 0.07em;
  margin-bottom: var(--space-2);
}

/* Search results */
.rb-results {
  max-height: 180px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 2px;
}
.rb-empty { font-size: var(--text-sm); color: var(--muted); padding: var(--space-2) 0; }
.rb-food-row {
  display: flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-2);
  border-radius: var(--radius-sm);
  background: none; border: none; cursor: pointer;
  text-align: left; width: 100%;
  transition: background 0.15s;
}
.rb-food-row:hover { background: var(--faint-2); }
.rb-food-name { font-size: var(--text-sm); font-weight: 600; flex: 1; }
.rb-food-kcal { font-size: var(--text-xs); color: var(--muted); font-family: var(--font-mono); }

.badge-tuyo {
  font-size: 9px; font-weight: 700;
  background: var(--accent-dim); color: var(--accent);
  border-radius: var(--radius-full); padding: 1px 6px;
  white-space: nowrap;
}

/* Ingredients */
.rb-ing-list { display: flex; flex-direction: column; gap: var(--space-2); }
.rb-ing-row {
  display: grid; grid-template-columns: 1fr auto auto;
  align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-2);
  background: var(--faint-2); border-radius: var(--radius-sm);
}
.rb-ing-name { font-size: var(--text-sm); font-weight: 600; }
.rb-ing-grams { display: flex; align-items: center; gap: var(--space-1); }
.rb-grams-input { width: 64px; text-align: center; padding: var(--space-1) var(--space-2); font-size: var(--text-sm); }
.rb-grams-unit { font-size: var(--text-xs); color: var(--muted); }
.rb-remove {
  background: none; border: none; color: var(--muted);
  font-size: 18px; cursor: pointer; padding: 0 4px;
  transition: color 0.15s; line-height: 1;
}
.rb-remove:hover { color: var(--danger); }

/* Totals */
.rb-totals {
  padding: var(--space-2) var(--space-3);
  background: var(--faint-2); border-radius: var(--radius-sm);
}
.rb-totals-row { display: flex; gap: var(--space-3); align-items: center; margin-bottom: 2px; }
.rb-totals-lbl { font-size: var(--text-xs); color: var(--muted); }
.rb-totals-val { font-size: var(--text-xs); font-weight: 700; color: var(--text); }

/* Servings row */
.servings-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }

/* Per serving macro grid */
.rb-per-serving {
  background: var(--accent-dim);
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
  border-radius: var(--radius); padding: var(--space-3) var(--space-4);
}
.rb-macro-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
}
.rb-macro-item { text-align: center; }
.rb-macro-val {
  display: block; font-size: var(--text-base); font-weight: 800;
  font-family: var(--font-mono); color: var(--text);
}
.rb-macro-val.accent { color: var(--accent); }
.rb-macro-lbl { display: block; font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 1px; }

.rb-actions { display: flex; gap: var(--space-3); }
.rb-actions .btn { flex: 1; }

.spinner-xs {
  width: 14px; height: 14px;
  border: 2px solid var(--border); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
