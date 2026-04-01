<script setup>
import { ref, computed } from 'vue'
import { useNutritionStore } from '@/stores/nutrition.store'
import { useToast } from '@/composables/useToast'

const emit = defineEmits(['saved', 'cancel'])

const nutrition = useNutritionStore()
const { toast }  = useToast()

const saving = ref(false)

const form = ref({
  name:          '',
  kcal:          '',
  protein:       '',
  carbs:         '',
  fat:           '',
  serving_grams: '',
  serving_label: '',
})

const valid = computed(() =>
  form.value.name.trim().length >= 2 &&
  Number(form.value.kcal) > 0
)

// Live preview: kcal per serving (if serving_grams set)
const servingPreview = computed(() => {
  const sg = Number(form.value.serving_grams)
  if (!sg || sg <= 0) return null
  const mul = sg / 100
  return {
    kcal:    Math.round(Number(form.value.kcal    || 0) * mul),
    protein: Math.round(Number(form.value.protein || 0) * mul * 10) / 10,
    carbs:   Math.round(Number(form.value.carbs   || 0) * mul * 10) / 10,
    fat:     Math.round(Number(form.value.fat     || 0) * mul * 10) / 10,
  }
})

async function save() {
  if (!valid.value || saving.value) return
  saving.value = true
  try {
    const food = await nutrition.saveCustomFood({
      name:          form.value.name.trim(),
      kcal:          Number(form.value.kcal)          || 0,
      protein:       Number(form.value.protein)       || 0,
      carbs:         Number(form.value.carbs)         || 0,
      fat:           Number(form.value.fat)           || 0,
      serving_grams: Number(form.value.serving_grams) || null,
      serving_label: form.value.serving_label.trim()  || null,
      source:        'manual',
    })
    toast.success(`${food.name} guardado en tu biblioteca`)
    emit('saved', food)
  } catch {
    toast.error('No se pudo guardar el alimento')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="qfe">
    <p class="qfe-title">Crear alimento</p>
    <p class="qfe-hint">Los valores son por cada <strong>100 g / 100 ml</strong></p>

    <!-- Name -->
    <div class="field-group mb-3">
      <label class="field-label">Nombre *</label>
      <input
        v-model="form.name"
        class="input-field"
        placeholder="Ej: Pechuga de pollo a la plancha"
        maxlength="80"
        autofocus
      />
    </div>

    <!-- Macros grid -->
    <div class="macros-grid mb-3">
      <div class="field-group">
        <label class="field-label">Calorías *</label>
        <div class="input-unit-wrap">
          <input v-model="form.kcal" class="input-field" type="number" inputmode="decimal" min="0" max="9999" placeholder="0" />
          <span class="input-unit">kcal</span>
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">Proteínas</label>
        <div class="input-unit-wrap">
          <input v-model="form.protein" class="input-field" type="number" inputmode="decimal" min="0" max="999" placeholder="0" />
          <span class="input-unit">g</span>
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">Carbohidratos</label>
        <div class="input-unit-wrap">
          <input v-model="form.carbs" class="input-field" type="number" inputmode="decimal" min="0" max="999" placeholder="0" />
          <span class="input-unit">g</span>
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">Grasas</label>
        <div class="input-unit-wrap">
          <input v-model="form.fat" class="input-field" type="number" inputmode="decimal" min="0" max="999" placeholder="0" />
          <span class="input-unit">g</span>
        </div>
      </div>
    </div>

    <!-- Optional serving -->
    <details class="serving-details mb-4">
      <summary class="serving-summary">Porción habitual (opcional)</summary>
      <div class="serving-fields">
        <div class="field-group">
          <label class="field-label">Gramos por porción</label>
          <div class="input-unit-wrap">
            <input v-model="form.serving_grams" class="input-field" type="number" inputmode="decimal" min="1" max="2000" placeholder="Ej: 30" />
            <span class="input-unit">g</span>
          </div>
        </div>
        <div class="field-group">
          <label class="field-label">Etiqueta</label>
          <input v-model="form.serving_label" class="input-field" placeholder='Ej: "1 taza", "1 unidad"' maxlength="40" />
        </div>
        <!-- Preview per serving -->
        <div v-if="servingPreview" class="serving-preview">
          <span class="sp-label">Por porción:</span>
          <span class="sp-val">{{ servingPreview.kcal }} kcal</span>
          <span class="sp-val">P {{ servingPreview.protein }}g</span>
          <span class="sp-val">C {{ servingPreview.carbs }}g</span>
          <span class="sp-val">G {{ servingPreview.fat }}g</span>
        </div>
      </div>
    </details>

    <div class="qfe-actions">
      <button class="btn btn-ghost" @click="emit('cancel')">Cancelar</button>
      <button class="btn btn-primary" :disabled="!valid || saving" @click="save">
        <span v-if="saving" class="spinner-xs" />
        <span v-else>Guardar</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.qfe { padding: var(--space-1) 0; }
.qfe-title { font-size: var(--text-base); font-weight: 700; margin-bottom: var(--space-1); }
.qfe-hint  { font-size: var(--text-xs); color: var(--muted); margin-bottom: var(--space-4); }

.mb-3 { margin-bottom: var(--space-3); }
.mb-4 { margin-bottom: var(--space-4); }

.field-group { display: flex; flex-direction: column; gap: var(--space-1); }
.field-label { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em; }

.macros-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.input-unit-wrap {
  position: relative; display: flex; align-items: center;
}
.input-unit-wrap .input-field { padding-right: 36px; }
.input-unit {
  position: absolute; right: 10px;
  font-size: 11px; color: var(--muted); font-weight: 600; pointer-events: none;
}

/* Serving details */
.serving-details { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.serving-summary {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-xs); font-weight: 700; color: var(--muted);
  text-transform: uppercase; letter-spacing: 0.07em;
  cursor: pointer; list-style: none; user-select: none;
}
.serving-summary::-webkit-details-marker { display: none; }
.serving-summary::before { content: '+ '; }
details[open] .serving-summary::before { content: '− '; }
.serving-fields {
  padding: var(--space-3) var(--space-4) var(--space-4);
  display: flex; flex-direction: column; gap: var(--space-3);
  border-top: 1px solid var(--border);
}

.serving-preview {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--accent-dim); border-radius: var(--radius-sm);
  flex-wrap: wrap;
}
.sp-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
.sp-val   { font-size: var(--text-xs); font-weight: 700; color: var(--accent); font-family: var(--font-mono); }

.qfe-actions { display: flex; gap: var(--space-3); }
.qfe-actions .btn { flex: 1; }

.spinner-xs {
  width: 14px; height: 14px;
  border: 2px solid var(--border); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
