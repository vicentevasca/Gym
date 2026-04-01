<script setup>
import { ref, computed, watch } from 'vue'
import { useNutritionStore } from '@/stores/nutrition.store'
import QuickFoodEntry from './QuickFoodEntry.vue'
import RecipeBuilder  from './RecipeBuilder.vue'
import { translateUSDAFoods } from '@/composables/useFoodTranslation'

const props = defineProps({
  mealId: { type: String, required: true },
})
const emit = defineEmits(['add-food', 'close'])

const nutrition = useNutritionStore()

// ── Modes: search | amount | create-food | create-recipe ────────
const mode     = ref('search')
const selected = ref(null)
const amount   = ref(100)

// ── Search state ─────────────────────────────────────────────────
const searchQuery = ref('')
const apiResults  = ref([])
const searching   = ref(false)
const apiError    = ref(false)
const apiSource   = ref(null)   // 'usda' | 'off' | null

// ── USDA key (from .env) ─────────────────────────────────────────
const USDA_KEY = import.meta.env.VITE_USDA_API_KEY

// ── Local fallback food DB ───────────────────────────────────────
const LOCAL_DB = [
  { id: 'pollo-pecho',  name: 'Pechuga de pollo',   kcal: 165, protein: 31,  carbs: 0,   fat: 3.6, unit: '100g' },
  { id: 'arroz-blanco', name: 'Arroz blanco cocido', kcal: 130, protein: 2.7, carbs: 28,  fat: 0.3, unit: '100g' },
  { id: 'huevo-entero', name: 'Huevo entero',        kcal: 155, protein: 13,  carbs: 1.1, fat: 11,  unit: '100g' },
  { id: 'salmon',       name: 'Salmón',              kcal: 208, protein: 20,  carbs: 0,   fat: 13,  unit: '100g' },
  { id: 'avena',        name: 'Avena seca',          kcal: 389, protein: 17,  carbs: 66,  fat: 7,   unit: '100g' },
  { id: 'platano',      name: 'Plátano',             kcal: 89,  protein: 1.1, carbs: 23,  fat: 0.3, unit: '100g' },
  { id: 'leche-ent',    name: 'Leche entera',        kcal: 61,  protein: 3.2, carbs: 4.8, fat: 3.3, unit: '100ml' },
  { id: 'yogur-grec',   name: 'Yogur griego',        kcal: 97,  protein: 9,   carbs: 3.6, fat: 5,   unit: '100g' },
  { id: 'brocoli',      name: 'Brócoli',             kcal: 34,  protein: 2.8, carbs: 7,   fat: 0.4, unit: '100g' },
  { id: 'papa-cocida',  name: 'Papa cocida',         kcal: 87,  protein: 1.9, carbs: 20,  fat: 0.1, unit: '100g' },
  { id: 'pan-integral', name: 'Pan integral',        kcal: 247, protein: 13,  carbs: 41,  fat: 4,   unit: '100g' },
  { id: 'aceite-oliva', name: 'Aceite de oliva',     kcal: 884, protein: 0,   carbs: 0,   fat: 100, unit: '100ml' },
  { id: 'almendras',    name: 'Almendras',           kcal: 579, protein: 21,  carbs: 22,  fat: 50,  unit: '100g' },
  { id: 'atun-lata',    name: 'Atún en lata',        kcal: 116, protein: 26,  carbs: 0,   fat: 1,   unit: '100g' },
  { id: 'clara-huevo',  name: 'Clara de huevo',      kcal: 52,  protein: 11,  carbs: 0.7, fat: 0.2, unit: '100g' },
  { id: 'pechuga-pavo', name: 'Pechuga de pavo',     kcal: 135, protein: 29,  carbs: 0,   fat: 1.5, unit: '100g' },
  { id: 'lentejas',     name: 'Lentejas cocidas',    kcal: 116, protein: 9,   carbs: 20,  fat: 0.4, unit: '100g' },
  { id: 'queso-cottage',name: 'Queso cottage',       kcal: 98,  protein: 11,  carbs: 3.4, fat: 4.3, unit: '100g' },
  { id: 'manzana',      name: 'Manzana',             kcal: 52,  protein: 0.3, carbs: 14,  fat: 0.2, unit: '100g' },
  { id: 'batata',       name: 'Batata / camote',     kcal: 86,  protein: 1.6, carbs: 20,  fat: 0.1, unit: '100g' },
]

// ── Spanish → English translation map for USDA ──────────────────
const ES_EN_MAP = {
  'pechuga de pollo': 'chicken breast',
  'pechuga de pavo':  'turkey breast',
  'pechuga':          'chicken breast',
  'arroz blanco':     'white rice',
  'arroz':            'rice',
  'huevos':           'eggs',
  'huevo':            'egg',
  'claras':           'egg whites',
  'clara de huevo':   'egg white',
  'salmón':           'salmon',
  'avena':            'oatmeal oats',
  'plátano':          'banana',
  'banana':           'banana',
  'leche':            'milk',
  'yogur':            'yogurt',
  'brócoli':          'broccoli',
  'papas':            'potatoes',
  'papa':             'potato',
  'pan integral':     'whole wheat bread',
  'pan':              'bread',
  'aceite de oliva':  'olive oil',
  'aceite':           'oil',
  'almendras':        'almonds',
  'atún':             'tuna',
  'pavo':             'turkey',
  'lentejas':         'lentils',
  'queso cottage':    'cottage cheese',
  'queso':            'cheese',
  'manzana':          'apple',
  'batata':           'sweet potato',
  'camote':           'sweet potato',
  'pollo':            'chicken',
  'carne molida':     'ground beef',
  'carne':            'beef',
  'pescado':          'fish',
  'cerdo':            'pork',
  'frijoles':         'beans',
  'porotos':          'beans',
  'espinacas':        'spinach',
  'espinaca':         'spinach',
  'tomate':           'tomato',
  'zanahoria':        'carrot',
  'pepino':           'cucumber',
  'lechuga':          'lettuce',
  'naranja':          'orange',
  'fresa':            'strawberry',
  'uva':              'grape',
  'sandía':           'watermelon',
  'piña':             'pineapple',
  'nueces':           'walnuts',
  'maní':             'peanut',
  'mantequilla':      'butter',
  'manteca':          'butter',
  'pasta':            'pasta',
  'fideos':           'noodles',
  'quinoa':           'quinoa',
  'maíz':             'corn',
  'chía':             'chia seeds',
  'linaza':           'flaxseed',
  'proteína':         'whey protein',
  'proteina':         'protein powder',
  'whey':             'whey protein',
  'lomo':             'beef loin',
  'jamón':            'ham',
  'tocino':           'bacon',
  'aguacate':         'avocado',
  'palta':            'avocado',
  'camarones':        'shrimp',
  'camarón':          'shrimp',
  'coliflor':         'cauliflower',
  'cebolla':          'onion',
  'ajo':              'garlic',
  'limón':            'lemon',
  'miel':             'honey',
  'azúcar':           'sugar',
  'chocolate':        'chocolate',
  'cacao':            'cocoa',
}

function translateForUSDA(q) {
  const lower = q.toLowerCase().trim()
  // Try longer phrases first
  const entries = Object.entries(ES_EN_MAP).sort((a, b) => b[0].length - a[0].length)
  for (const [es, en] of entries) {
    if (lower.includes(es)) return lower.replace(es, en)
  }
  return lower
}

// ── Recientes (localStorage) ─────────────────────────────────────
const RECENT_KEY   = 'disciplina_recent_foods'
const RECENT_LIMIT = 12

function loadRecentFoods() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') }
  catch { return [] }
}

function saveToRecent(food) {
  try {
    const existing = loadRecentFoods()
    const filtered = existing.filter(f => f.id !== food.id)
    const updated  = [{ ...food }, ...filtered].slice(0, RECENT_LIMIT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
    recentFoods.value = updated
  } catch { /* ignore */ }
}

const recentFoods = ref(loadRecentFoods())

// ── Custom foods local filter ─────────────────────────────────────
const customFiltered = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return nutrition.customFoods.slice(0, 4)
  return nutrition.customFoods
    .filter(f => f.name.toLowerCase().includes(q))
    .slice(0, 4)
})

// ── Local fallback filter ─────────────────────────────────────────
const localFiltered = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return LOCAL_DB.slice(0, 6)
  return LOCAL_DB.filter(f => f.name.toLowerCase().includes(q)).slice(0, 6)
})

// ── Full results list: custom → API → local ───────────────────────
const displayResults = computed(() => {
  const q = searchQuery.value.trim()
  if (!q) {
    // No query: custom foods first, then local
    return [
      ...customFiltered.value.map(f => ({ ...f, _type: 'custom', unit: 'por 100g' })),
      ...localFiltered.value.map(f => ({ ...f, _type: 'local' })),
    ]
  }
  if (apiResults.value.length > 0) {
    return [
      ...customFiltered.value.map(f => ({ ...f, _type: 'custom', unit: 'por 100g' })),
      ...apiResults.value.map(f => ({ ...f, _type: 'api' })),
    ]
  }
  // Fallback: local + custom
  return [
    ...customFiltered.value.map(f => ({ ...f, _type: 'custom', unit: 'por 100g' })),
    ...localFiltered.value.map(f => ({ ...f, _type: 'local' })),
  ]
})

// ── Debounced API search ──────────────────────────────────────────
let debounceTimer = null

watch(searchQuery, (val) => {
  clearTimeout(debounceTimer)
  apiError.value = false
  apiSource.value = null

  if (!val.trim() || val.trim().length < 2) {
    apiResults.value = []
    searching.value  = false
    return
  }

  searching.value = true
  debounceTimer = setTimeout(() => {
    fetchFoods(val.trim())
  }, 420)
})

async function fetchFoods(q) {
  // 1. Try USDA (if key available)
  if (USDA_KEY) {
    const ok = await fetchUSDA(q)
    if (ok) return
  }
  // 2. Fallback to Open Food Facts
  await fetchOFF(q)
}

async function fetchUSDA(q) {
  try {
    const translated = translateForUSDA(q)
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(translated)}&api_key=${USDA_KEY}&dataType=Foundation,SR%20Legacy&pageSize=10`
    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), 5000)
    const res  = await fetch(url, { signal: controller.signal })
    clearTimeout(tid)
    if (!res.ok) return false
    const data = await res.json()
    const foods = (data.foods || [])
      .map(f => {
        const nutrients = f.foodNutrients || []
        const get = (id) => nutrients.find(n => n.nutrientId === id)?.value ?? 0
        const kcal = Math.round(get(1008))
        if (!kcal) return null
        return {
          id:      `usda-${f.fdcId}`,
          name:    capitalizeWords(f.description || f.lowercaseDescription || ''),
          kcal,
          protein: Math.round(get(1003) * 10) / 10,
          carbs:   Math.round(get(1005) * 10) / 10,
          fat:     Math.round(get(1004) * 10) / 10,
          unit:    '100g',
          source:  'usda',
        }
      })
      .filter(Boolean)
      .slice(0, 10)

    if (!foods.length) return false

    // Mostrar resultados en inglés de inmediato (sin esperar traducción)
    apiResults.value = foods
    apiSource.value  = 'usda'
    searching.value  = false

    // Traducir nombres USDA a español en segundo plano
    translateUSDAFoods(foods).then(translations => {
      apiResults.value = apiResults.value.map(f => ({
        ...f,
        name: translations[f.id] ?? f.name,
      }))
    })

    return true
  } catch {
    return false
  } finally {
    searching.value = false
  }
}

async function fetchOFF(q) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&fields=product_name,product_name_es,nutriments&page_size=15&lc=es`
    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), 5000)
    const res  = await fetch(url, { signal: controller.signal })
    clearTimeout(tid)
    if (!res.ok) throw new Error()
    const data     = await res.json()
    const products = (data.products || [])
      .filter(p => {
        const name = p.product_name_es || p.product_name
        const n    = p.nutriments
        return name && n && (n['energy-kcal_100g'] || n['energy-kcal'] || 0) > 0
      })
      .slice(0, 10)
      .map(p => {
        const name = (p.product_name_es || p.product_name || '').trim()
        const n    = p.nutriments
        return {
          id:      `off-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          name,
          kcal:    Math.round(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0),
          protein: Math.round((n['proteins_100g']      ?? 0) * 10) / 10,
          carbs:   Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
          fat:     Math.round((n['fat_100g']           ?? 0) * 10) / 10,
          unit:    '100g',
          source:  'off',
        }
      })
      .filter(p => p.name.length > 1 && p.kcal > 0)

    apiResults.value = products
    apiSource.value  = products.length ? 'off' : null
    if (!products.length) apiError.value = true
  } catch {
    apiError.value   = true
    apiResults.value = []
    apiSource.value  = null
  } finally {
    searching.value = false
  }
}

function capitalizeWords(str) {
  return str.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase()).slice(0, 60)
}

// ── Select food ───────────────────────────────────────────────────
function selectFood(food) {
  selected.value = food
  // Pre-fill default serving amount if available
  amount.value = food.serving_grams ?? 100
  mode.value = 'amount'
}

// ── Preview macros for current amount ────────────────────────────
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

// ── Confirm add ───────────────────────────────────────────────────
async function confirmAdd() {
  if (!selected.value || !preview.value) return
  const entry = {
    food_id:  selected.value.id,
    name:     selected.value.name,
    amount_g: amount.value,
    ...preview.value,
  }
  saveToRecent({ ...selected.value })
  // Bump usage count for custom foods
  if (selected.value._type === 'custom') {
    nutrition.incrementCustomFoodUsage(selected.value.id)
  }
  emit('add-food', entry)
  reset()
}

function reset() {
  mode.value        = 'search'
  selected.value    = null
  searchQuery.value = ''
  amount.value      = 100
  apiResults.value  = []
  apiError.value    = false
  apiSource.value   = null
}

// ── Handle QuickFoodEntry / RecipeBuilder saved ───────────────────
function onCustomSaved(food) {
  // After saving, jump to amount selection with the new food
  selectFood({ ...food, _type: 'custom', unit: 'por 100g' })
}

// ── Delete custom food ────────────────────────────────────────────
async function deleteCustomFood(food, e) {
  e.stopPropagation()
  if (!confirm(`¿Eliminar "${food.name}" de tu biblioteca?`)) return
  await nutrition.deleteCustomFood(food.id)
}
</script>

<template>
  <div class="food-search card">

    <!-- Header -->
    <div class="fs-header">
      <h4 class="fs-title">
        <span v-if="mode === 'search'">Añadir alimento</span>
        <span v-else-if="mode === 'amount'">Cantidad</span>
        <span v-else-if="mode === 'create-food'">Crear alimento</span>
        <span v-else>Crear receta</span>
      </h4>
      <button class="fs-close" @click="emit('close')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- ══ SEARCH MODE ══════════════════════════════════════════ -->
    <template v-if="mode === 'search'">

      <!-- Search input -->
      <div class="input-with-icon mb-3">
        <svg v-if="!searching" class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <div v-else class="input-icon spinner-sm" />
        <input
          v-model="searchQuery"
          class="input-field"
          placeholder="Buscar alimento…"
          type="search"
          autocomplete="off"
          autofocus
        />
      </div>

      <!-- API source badge -->
      <div v-if="searchQuery.length >= 2" class="source-row">
        <span v-if="searching" class="source-tag neutral">Buscando…</span>
        <span v-else-if="apiSource === 'usda'" class="source-tag usda">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
          USDA FoodData
        </span>
        <span v-else-if="apiSource === 'off'" class="source-tag off">Open Food Facts</span>
        <span v-else-if="apiError" class="source-tag offline">Sin resultados de API — base local</span>
        <span v-else class="source-tag neutral">Base local</span>
      </div>

      <!-- Recientes (sin query) -->
      <div v-if="!searchQuery && recentFoods.length" class="fs-recents">
        <p class="fs-section-label">Recientes</p>
        <div class="recent-chips">
          <button
            v-for="food in recentFoods.slice(0, 6)"
            :key="food.id"
            class="recent-chip"
            @click="selectFood(food)"
          >
            {{ food.name }}
          </button>
        </div>
      </div>

      <!-- Results list -->
      <div class="fs-results">
        <div v-if="!displayResults.length && !searching && searchQuery.length >= 2" class="fs-empty">
          Sin resultados para "{{ searchQuery }}"
        </div>

        <div v-for="food in displayResults" :key="food.id" class="food-row-wrap">
          <button class="food-row" @click="selectFood(food)">
            <div class="food-row-left">
              <span class="food-name">{{ food.name }}</span>
              <div class="food-badges">
                <span v-if="food._type === 'custom'" class="badge-tuyo">Tuyo</span>
                <span v-if="food.serving_label" class="badge-serving">{{ food.serving_label }}</span>
              </div>
            </div>
            <span class="food-meta">{{ food.kcal }} kcal / {{ food.unit || '100g' }}</span>
          </button>
          <!-- Delete button for custom foods -->
          <button
            v-if="food._type === 'custom'"
            class="food-delete"
            title="Eliminar de biblioteca"
            @click="deleteCustomFood(food, $event)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>

      <!-- Create food / recipe buttons -->
      <div class="fs-create-row">
        <button class="btn-create" @click="mode = 'create-food'">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Crear alimento
        </button>
        <button class="btn-create" @click="mode = 'create-recipe'">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          Crear receta
        </button>
      </div>

    </template>

    <!-- ══ AMOUNT MODE ══════════════════════════════════════════ -->
    <template v-else-if="mode === 'amount'">
      <div class="selected-name">{{ selected.name }}</div>
      <p v-if="selected.serving_label" class="selected-serving-hint">Porción habitual: {{ selected.serving_label }} ({{ selected.serving_grams }}g)</p>

      <div class="amount-row">
        <label class="amount-label">Cantidad (g / ml)</label>
        <input
          v-model.number="amount"
          class="input-field amount-input"
          type="number"
          inputmode="numeric"
          min="1"
          max="5000"
          autofocus
        />
      </div>

      <div v-if="preview" class="macro-preview">
        <div class="mp-item">
          <span class="mp-val">{{ preview.kcal }}</span>
          <span class="mp-lbl">kcal</span>
        </div>
        <div class="mp-item">
          <span class="mp-val">{{ preview.protein }}g</span>
          <span class="mp-lbl">prot</span>
        </div>
        <div class="mp-item">
          <span class="mp-val">{{ preview.carbs }}g</span>
          <span class="mp-lbl">carbos</span>
        </div>
        <div class="mp-item">
          <span class="mp-val">{{ preview.fat }}g</span>
          <span class="mp-lbl">grasa</span>
        </div>
      </div>

      <div class="fs-actions">
        <button class="btn btn-ghost" @click="mode = 'search'">← Volver</button>
        <button class="btn btn-primary" :disabled="!preview || amount < 1" @click="confirmAdd">Añadir</button>
      </div>
    </template>

    <!-- ══ CREATE FOOD MODE ═════════════════════════════════════ -->
    <template v-else-if="mode === 'create-food'">
      <QuickFoodEntry
        @saved="onCustomSaved"
        @cancel="mode = 'search'"
      />
    </template>

    <!-- ══ CREATE RECIPE MODE ═══════════════════════════════════ -->
    <template v-else-if="mode === 'create-recipe'">
      <RecipeBuilder
        @saved="onCustomSaved"
        @cancel="mode = 'search'"
      />
    </template>

  </div>
</template>

<style scoped>
.food-search { padding: var(--space-5); }

.fs-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: var(--space-4);
}
.fs-title { font-size: var(--text-base); font-weight: 700; }
.fs-close {
  background: none; border: none; color: var(--muted);
  cursor: pointer; padding: 8px; border-radius: var(--radius-sm);
  transition: var(--transition); min-width: 44px; min-height: 44px;
  display: flex; align-items: center; justify-content: center;
}
.fs-close:hover { color: var(--text); background: var(--faint); }

.mb-3 { margin-bottom: var(--space-3); }

/* Spinner */
.spinner-sm {
  width: 14px; height: 14px;
  border: 2px solid var(--border-hi); border-top-color: var(--accent);
  border-radius: 50%; animation: spin 0.65s linear infinite; flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Source badge */
.source-row { margin-bottom: var(--space-2); }
.source-tag {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
  padding: 2px 8px; border-radius: var(--radius-full);
}
.source-tag.usda    { background: #e0f2fe; color: #0369a1; }
.source-tag.off     { background: var(--accent-dim); color: var(--accent); }
.source-tag.offline { background: var(--warning-dim, rgba(245,158,11,.1)); color: var(--warning, #f59e0b); }
.source-tag.neutral { background: var(--faint); color: var(--muted); }

/* Recientes */
.fs-recents { margin-bottom: var(--space-3); }
.fs-section-label {
  font-size: 10px; font-weight: 700; color: var(--muted);
  text-transform: uppercase; letter-spacing: 0.08em;
  margin-bottom: var(--space-2);
}
.recent-chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.recent-chip {
  padding: var(--space-1) var(--space-3);
  background: var(--faint-2); border: 1.5px solid var(--border);
  border-radius: var(--radius-full);
  font-size: var(--text-xs); font-weight: 600; color: var(--text);
  cursor: pointer; transition: var(--transition); white-space: nowrap;
}
.recent-chip:hover { border-color: var(--accent); color: var(--accent); }

/* Results */
.fs-results {
  display: flex; flex-direction: column; gap: 2px;
  max-height: 240px; overflow-y: auto;
  margin-bottom: var(--space-3);
}
.fs-empty {
  text-align: center; padding: var(--space-4) 0;
  font-size: var(--text-sm); color: var(--muted);
}
.food-row-wrap {
  display: flex; align-items: center; gap: 0;
  border-radius: var(--radius-sm);
}
.food-row-wrap:hover { background: var(--faint-2); }
.food-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--space-3); flex: 1;
  background: transparent; border: none; cursor: pointer;
  text-align: left;
}
.food-row-left { display: flex; flex-direction: column; gap: 2px; }
.food-name { font-size: var(--text-sm); font-weight: 600; color: var(--text); }
.food-badges { display: flex; gap: var(--space-1); align-items: center; }
.food-meta  { font-size: var(--text-xs); color: var(--muted); font-family: var(--font-mono); white-space: nowrap; }

.badge-tuyo {
  font-size: 9px; font-weight: 700;
  background: var(--accent-dim); color: var(--accent);
  border-radius: var(--radius-full); padding: 1px 6px;
}
.badge-serving {
  font-size: 9px; color: var(--muted);
  background: var(--faint); border-radius: var(--radius-full); padding: 1px 6px;
}

.food-delete {
  background: none; border: none; color: var(--muted);
  padding: var(--space-2); cursor: pointer;
  transition: color 0.15s; flex-shrink: 0;
  opacity: 0;
}
.food-row-wrap:hover .food-delete { opacity: 1; }
.food-delete:hover { color: var(--danger); }

/* Create row */
.fs-create-row {
  display: flex; gap: var(--space-2); padding-top: var(--space-2);
  border-top: 1px solid var(--border);
}
.btn-create {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--faint-2); border: 1.5px solid var(--border);
  border-radius: var(--radius); font-size: var(--text-xs); font-weight: 700;
  color: var(--muted); cursor: pointer; transition: var(--transition);
}
.btn-create:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }

/* Amount mode */
.selected-name { font-size: var(--text-base); font-weight: 700; margin-bottom: var(--space-1); }
.selected-serving-hint { font-size: var(--text-xs); color: var(--muted); margin-bottom: var(--space-4); }
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
