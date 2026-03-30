<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  mealId: { type: String, required: true },
})
const emit = defineEmits(['add-food', 'close'])

// ── Base local de alimentos comunes (fallback offline) ─────────
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

const searchQuery  = ref('')
const selected     = ref(null)
const amount       = ref(100)
const apiResults   = ref([])
const searching    = ref(false)
const apiError     = ref(false)
const searchMode   = ref('local') // 'local' | 'api'

let debounceTimer = null

// ── Alimentos recientes (localStorage) ────────────────────────
const RECENT_KEY   = 'disciplina_recent_foods'
const RECENT_LIMIT = 12

function loadRecentFoods() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch { return [] }
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

// ── Resultados locales filtrados ───────────────────────────────
const localResults = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return LOCAL_DB.slice(0, 8)
  return LOCAL_DB.filter(f => f.name.toLowerCase().includes(q)).slice(0, 6)
})

// ── Preview macros según cantidad ingresada ─────────────────────
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

// ── Watch query con debounce → buscar en Open Food Facts ────────
watch(searchQuery, (val) => {
  clearTimeout(debounceTimer)
  apiError.value = false

  if (!val.trim() || val.trim().length < 2) {
    apiResults.value = []
    searchMode.value = 'local'
    searching.value = false
    return
  }

  searching.value = true
  debounceTimer = setTimeout(() => {
    fetchOpenFoodFacts(val.trim())
  }, 400)
})

// ── Llamada a Open Food Facts API ──────────────────────────────
async function fetchOpenFoodFacts(q) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&fields=product_name,nutriments,product_name_es&page_size=15&lc=es`
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 5000)
    const res  = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!res.ok) throw new Error('HTTP error')

    const data = await res.json()
    const products = (data.products || [])
      .filter(p => {
        const name = p.product_name_es || p.product_name
        const n    = p.nutriments
        return name && n && (n['energy-kcal_100g'] || n['energy-kcal']) > 0
      })
      .slice(0, 10)
      .map(p => {
        const name = (p.product_name_es || p.product_name || '').trim()
        const n    = p.nutriments
        return {
          id:      `off-${name.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}-${Math.random().toString(36).slice(2,6)}`,
          name,
          kcal:    Math.round(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0),
          protein: Math.round((n['proteins_100g']       ?? 0) * 10) / 10,
          carbs:   Math.round((n['carbohydrates_100g']  ?? 0) * 10) / 10,
          fat:     Math.round((n['fat_100g']            ?? 0) * 10) / 10,
          unit:    '100g',
          source:  'off',
        }
      })
      .filter(p => p.name.length > 1)

    apiResults.value = products
    searchMode.value = products.length > 0 ? 'api' : 'local'
  } catch (e) {
    apiError.value   = true
    searchMode.value = 'local'
    apiResults.value = []
  } finally {
    searching.value = false
  }
}

const displayResults = computed(() =>
  searchMode.value === 'api' ? apiResults.value : localResults.value
)

function selectFood(food) {
  selected.value = food
  amount.value   = 100
}

function addFood() {
  if (!selected.value || !preview.value) return
  const entry = {
    food_id:  selected.value.id,
    name:     selected.value.name,
    amount_g: amount.value,
    ...preview.value,
  }
  saveToRecent({ ...selected.value })
  emit('add-food', entry)
  selected.value    = null
  searchQuery.value = ''
  amount.value      = 100
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

    <!-- ── Search input ─────────────────────────────────────── -->
    <div v-if="!selected" class="input-with-icon mb-3">
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

    <!-- ── Source indicator ────────────────────────────────── -->
    <div v-if="!selected && searchQuery.length >= 2" class="source-row">
      <span v-if="searching" class="source-tag neutral">Buscando en base global…</span>
      <span v-else-if="searchMode === 'api'" class="source-tag api">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l10 6-10 6L2 8z"/><path d="M2 16l10 6 10-6"/></svg>
        Open Food Facts
      </span>
      <span v-else-if="apiError" class="source-tag offline">Sin conexión — base local</span>
      <span v-else class="source-tag neutral">Base local</span>
    </div>

    <!-- ── Recientes (sólo sin query) ─────────────────────── -->
    <div v-if="!selected && !searchQuery && recentFoods.length" class="fs-recents">
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

    <!-- ── Results list ────────────────────────────────────── -->
    <div v-if="!selected" class="fs-results">
      <div v-if="displayResults.length === 0 && !searching" class="fs-empty">
        <p>Sin resultados para "{{ searchQuery }}"</p>
      </div>
      <button
        v-for="food in displayResults"
        :key="food.id"
        class="food-row"
        @click="selectFood(food)"
      >
        <span class="food-name">{{ food.name }}</span>
        <span class="food-meta">{{ food.kcal }} kcal / {{ food.unit }}</span>
      </button>
    </div>

    <!-- ── Selected food — ingreso de cantidad ─────────────── -->
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
        <button class="btn btn-ghost" @click="selected = null">← Volver</button>
        <button class="btn btn-primary" :disabled="!preview || amount < 1" @click="addFood">Añadir</button>
      </div>
    </div>
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

/* Spinner pequeño dentro del input */
.spinner-sm {
  width: 14px; height: 14px;
  border: 2px solid var(--border-hi);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Source indicator */
.source-row { margin-bottom: var(--space-2); }
.source-tag {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
  padding: 2px 8px; border-radius: var(--radius-full);
}
.source-tag.api     { background: var(--accent-dim); color: var(--accent); }
.source-tag.offline { background: var(--warning-dim); color: var(--warning); }
.source-tag.neutral { background: var(--faint); color: var(--muted); }

/* Results */
.fs-results {
  display: flex; flex-direction: column; gap: 2px;
  max-height: 260px; overflow-y: auto;
}
.fs-empty {
  text-align: center; padding: var(--space-4) 0;
  font-size: var(--text-sm); color: var(--muted);
}
.food-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  background: transparent; border: none; cursor: pointer;
  transition: background 0.15s; text-align: left; width: 100%;
}
.food-row:hover { background: var(--faint-2); }
.food-name { font-size: var(--text-sm); font-weight: 600; color: var(--text); }
.food-meta { font-size: var(--text-xs); color: var(--muted); font-family: var(--font-mono); }

/* Selected */
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
  cursor: pointer; transition: var(--transition);
  white-space: nowrap;
}
.recent-chip:hover { border-color: var(--accent); color: var(--accent); }
</style>
