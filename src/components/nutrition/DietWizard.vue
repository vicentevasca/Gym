<script setup>
import { ref, computed, nextTick } from 'vue'
import gsap from 'gsap'
import { DIET_TYPES, ALLERGY_LIST, BUDGETS } from '@/utils/dietPlanner'

const props = defineProps({
  routine: { type: Object, default: null },
})

const emit = defineEmits(['generate', 'close'])

// ── Estado ────────────────────────────────────────────────────────────────

const currentStep        = ref(1)
const totalSteps         = 4
const generating         = ref(false)

const selectedDiet       = ref('')
const selectedAllergies  = ref([])
const noAllergies        = ref(false)
const selectedBudget     = ref('medio')
const specialPrefs       = ref([])
const intermittentFasting = ref(false)

// ── Extra prefs ───────────────────────────────────────────────────────────

const EXTRA_PREFS = [
  { id: 'sin_alcohol',          label: 'Sin alcohol',          desc: 'Evitar alimentos fermentados' },
  { id: 'sin_ultraprocesados',  label: 'Sin ultraprocesados',  desc: 'Solo alimentos naturales y mínimamente procesados' },
  { id: 'sin_gluten_adicional', label: 'Sin gluten adicional', desc: 'Más allá de la alergia declarada' },
]

// ── Navegación ────────────────────────────────────────────────────────────

const canProceed = computed(() => {
  if (currentStep.value === 1) return !!selectedDiet.value
  if (currentStep.value === 2) return true   // alergias es opcional
  if (currentStep.value === 3) return !!selectedBudget.value
  if (currentStep.value === 4) return true
  return false
})

async function nextStep() {
  if (!canProceed.value || currentStep.value >= totalSteps) return
  currentStep.value++
  await nextTick()
  animateStep('next')
}

async function prevStep() {
  if (currentStep.value <= 1) return
  currentStep.value--
  await nextTick()
  animateStep('prev')
}

function animateStep(direction) {
  const el = document.querySelector('.wizard-step-body')
  if (!el) return
  const xFrom = direction === 'next' ? 32 : -32
  gsap.set(el, { opacity: 0, x: xFrom })
  gsap.to(el, { opacity: 1, x: 0, duration: 0.28, ease: 'power2.out', clearProps: 'all' })
}

// ── Selección de alergias ────────────────────────────────────────────────

function toggleAllergy(id) {
  noAllergies.value = false
  const idx = selectedAllergies.value.indexOf(id)
  if (idx >= 0) selectedAllergies.value.splice(idx, 1)
  else selectedAllergies.value.push(id)
}

function toggleNoAllergies() {
  noAllergies.value = !noAllergies.value
  if (noAllergies.value) selectedAllergies.value = []
}

// ── Extra prefs ───────────────────────────────────────────────────────────

function togglePref(id) {
  const idx = specialPrefs.value.indexOf(id)
  if (idx >= 0) specialPrefs.value.splice(idx, 1)
  else specialPrefs.value.push(id)
}

// ── Generar plan ──────────────────────────────────────────────────────────

async function handleGenerate() {
  generating.value = true
  const params = {
    diet_type:            selectedDiet.value,
    allergies:            noAllergies.value ? [] : selectedAllergies.value,
    budget:               selectedBudget.value,
    special_prefs:        specialPrefs.value,
    intermittent_fasting: intermittentFasting.value,
  }
  emit('generate', params)
}

// ── Etiqueta rutina ───────────────────────────────────────────────────────

const routineLabel = computed(() => {
  if (!props.routine?.style) return ''
  const styleMap = {
    hipertrofia: 'hipertrofia',
    fuerza:      'fuerza',
    calistenia:  'calistenia',
    yoga:        'yoga',
    pilates:     'pilates',
    cardio:      'cardio',
    hiit:        'HIIT',
    híbrido:     'entrenamiento híbrido',
    terapéutico: 'rehabilitación terapéutica',
  }
  return styleMap[props.routine.style] || props.routine.style
})
</script>

<template>
  <Teleport to="body">
    <div class="wizard-overlay" @click.self="emit('close')">
      <div class="wizard-sheet">

        <!-- Header -->
        <div class="wizard-header">
          <button type="button" class="btn-ghost wizard-close" @click="emit('close')">✕</button>
          <p class="wizard-title">Mi plan de dieta</p>
          <!-- Progress dots -->
          <div class="wizard-dots">
            <span
              v-for="n in totalSteps"
              :key="n"
              class="wizard-dot"
              :class="{ active: n === currentStep, done: n < currentStep }"
            />
          </div>
        </div>

        <!-- Paso actual -->
        <div class="wizard-step-body">

          <!-- PASO 1: Tipo de dieta -->
          <template v-if="currentStep === 1">
            <h2 class="step-title">¿Qué tipo de dieta sigues?</h2>
            <p class="step-subtitle">Elige el patrón alimenticio que mejor se adapta a ti</p>
            <div class="diet-grid">
              <button
                v-for="diet in DIET_TYPES"
                :key="diet.id"
                type="button"
                class="diet-card"
                :class="{ selected: selectedDiet === diet.id }"
                @click="selectedDiet = diet.id"
              >
                <span class="diet-icon">{{ diet.icon }}</span>
                <span class="diet-label">{{ diet.label }}</span>
                <span class="diet-desc">{{ diet.description }}</span>
              </button>
            </div>
          </template>

          <!-- PASO 2: Alergias -->
          <template v-else-if="currentStep === 2">
            <h2 class="step-title">Alergias e intolerancias</h2>
            <p class="step-subtitle">Selecciona las que apliquen. Ajustaremos el plan para evitarlas.</p>

            <button
              type="button"
              class="no-allergy-toggle"
              :class="{ active: noAllergies }"
              @click="toggleNoAllergies"
            >
              <span class="toggle-check">{{ noAllergies ? '✓' : '' }}</span>
              Sin alergias conocidas
            </button>

            <div class="allergy-chips">
              <button
                v-for="allergen in ALLERGY_LIST"
                :key="allergen.id"
                type="button"
                class="allergy-chip"
                :class="{ selected: selectedAllergies.includes(allergen.id), disabled: noAllergies }"
                :disabled="noAllergies"
                @click="toggleAllergy(allergen.id)"
              >
                {{ allergen.icon }} {{ allergen.label }}
              </button>
            </div>
          </template>

          <!-- PASO 3: Presupuesto -->
          <template v-else-if="currentStep === 3">
            <h2 class="step-title">¿Cuál es tu presupuesto?</h2>
            <p class="step-subtitle">Adaptaremos los alimentos a tu bolsillo sin comprometer la nutrición</p>
            <div class="budget-list">
              <button
                v-for="b in BUDGETS"
                :key="b.id"
                type="button"
                class="budget-card"
                :class="{ selected: selectedBudget === b.id }"
                @click="selectedBudget = b.id"
              >
                <span class="budget-icon">{{ b.icon }}</span>
                <div class="budget-info">
                  <span class="budget-label">{{ b.label }}</span>
                  <span class="budget-desc">{{ b.description }}</span>
                </div>
                <span class="budget-check" v-if="selectedBudget === b.id">✓</span>
              </button>
            </div>
          </template>

          <!-- PASO 4: Preferencias extra -->
          <template v-else-if="currentStep === 4">
            <h2 class="step-title">Preferencias extra</h2>
            <p class="step-subtitle">Ajustes opcionales para personalizar más tu plan</p>

            <div v-if="routineLabel" class="routine-badge">
              <span class="routine-badge-icon">🏋️</span>
              Basado en tu rutina de <strong>{{ routineLabel }}</strong>
            </div>

            <div class="prefs-list">
              <div
                v-for="pref in EXTRA_PREFS"
                :key="pref.id"
                class="pref-row"
                :class="{ selected: specialPrefs.includes(pref.id) }"
                @click="togglePref(pref.id)"
              >
                <div class="pref-info">
                  <span class="pref-label">{{ pref.label }}</span>
                  <span class="pref-desc">{{ pref.desc }}</span>
                </div>
                <div class="pref-toggle" :class="{ on: specialPrefs.includes(pref.id) }">
                  <div class="pref-knob" />
                </div>
              </div>

              <!-- Ayuno intermitente -->
              <div
                class="pref-row"
                :class="{ selected: intermittentFasting }"
                @click="intermittentFasting = !intermittentFasting"
              >
                <div class="pref-info">
                  <span class="pref-label">Ayuno intermitente (16:8)</span>
                  <span class="pref-desc">Ventana de alimentación de 12:00 a 20:00</span>
                </div>
                <div class="pref-toggle" :class="{ on: intermittentFasting }">
                  <div class="pref-knob" />
                </div>
              </div>
            </div>

            <p class="disclaimer-text">
              ⚠️ Esta información es orientativa. Consulta con un profesional de la salud antes de iniciar cualquier plan alimenticio.
            </p>
          </template>

        </div>

        <!-- Footer: botones de navegación -->
        <div class="wizard-footer">
          <button
            v-if="currentStep > 1"
            type="button"
            class="btn btn-secondary"
            @click="prevStep"
          >
            Atrás
          </button>
          <div v-else class="spacer" />

          <button
            v-if="currentStep < totalSteps"
            type="button"
            class="btn btn-primary"
            :disabled="!canProceed"
            @click="nextStep"
          >
            Continuar
          </button>

          <button
            v-else
            type="button"
            class="btn btn-primary"
            :disabled="generating"
            @click="handleGenerate"
          >
            <span v-if="generating">
              <span class="spinner" style="width:16px;height:16px;border-width:2px" />
            </span>
            <span v-else>Generar mi plan ✨</span>
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── Overlay y sheet ──────────────────────────────────────── */
.wizard-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9000;
  display: flex;
  align-items: flex-end;
}

.wizard-sheet {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background: var(--card);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Header ───────────────────────────────────────────────── */
.wizard-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-4) var(--space-5) var(--space-3);
  border-bottom: 1px solid var(--border);
  position: relative;
}

.wizard-close {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  color: var(--muted);
  background: var(--faint);
  border: none;
  cursor: pointer;
}

.wizard-title {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--text);
  margin-bottom: var(--space-3);
}

.wizard-dots {
  display: flex;
  gap: var(--space-2);
}

.wizard-dot {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: var(--faint);
  transition: all 0.3s ease;
}

.wizard-dot.active {
  background: var(--accent);
  width: 24px;
}

.wizard-dot.done {
  background: var(--success);
}

/* ── Step body ────────────────────────────────────────────── */
.wizard-step-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5) var(--space-5) var(--space-4);
  -webkit-overflow-scrolling: touch;
}

.step-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text);
  margin-bottom: var(--space-1);
}

.step-subtitle {
  font-size: var(--text-sm);
  color: var(--muted);
  margin-bottom: var(--space-5);
  line-height: 1.5;
}

/* ── Paso 1: Diet grid ────────────────────────────────────── */
.diet-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.diet-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
  padding: var(--space-4);
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: left;
}

.diet-card:hover {
  border-color: var(--accent);
  background: var(--faint);
}

.diet-card.selected {
  border-color: var(--accent);
  background: var(--accent-dim);
}

.diet-icon {
  font-size: 22px;
  line-height: 1;
}

.diet-label {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text);
}

.diet-desc {
  font-size: var(--text-xs);
  color: var(--muted);
  line-height: 1.4;
}

/* ── Paso 2: Alergias ─────────────────────────────────────── */
.no-allergy-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--faint);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  transition: all 0.18s ease;
  margin-bottom: var(--space-4);
  text-align: left;
}

.no-allergy-toggle.active {
  border-color: var(--success);
  background: var(--success-dim);
  color: var(--success);
}

.toggle-check {
  width: 20px;
  height: 20px;
  border: 1.5px solid var(--border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  flex-shrink: 0;
  background: var(--surface);
  transition: all 0.18s;
}

.no-allergy-toggle.active .toggle-check {
  background: var(--success);
  border-color: var(--success);
  color: #fff;
}

.allergy-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.allergy-chip {
  padding: var(--space-2) var(--space-3);
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  transition: all 0.18s ease;
}

.allergy-chip:hover:not(.disabled) {
  border-color: var(--accent);
}

.allergy-chip.selected {
  border-color: var(--danger);
  background: color-mix(in srgb, var(--danger) 12%, transparent);
  color: var(--danger);
}

.allergy-chip.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Paso 3: Presupuesto ──────────────────────────────────── */
.budget-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.budget-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-4);
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: left;
}

.budget-card:hover {
  border-color: var(--accent);
  background: var(--faint);
}

.budget-card.selected {
  border-color: var(--accent);
  background: var(--accent-dim);
}

.budget-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.budget-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.budget-label {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--text);
}

.budget-desc {
  font-size: var(--text-sm);
  color: var(--muted);
}

.budget-check {
  color: var(--accent);
  font-weight: 800;
  font-size: var(--text-base);
  flex-shrink: 0;
}

/* ── Paso 4: Preferencias ─────────────────────────────────── */
.routine-badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--accent-dim);
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text);
  margin-bottom: var(--space-4);
}

.routine-badge-icon {
  font-size: 18px;
}

.prefs-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.pref-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color 0.18s;
}

.pref-row.selected {
  border-color: var(--accent);
  background: var(--accent-dim);
}

.pref-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pref-label {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text);
}

.pref-desc {
  font-size: var(--text-xs);
  color: var(--muted);
}

.pref-toggle {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: var(--faint);
  border: 1.5px solid var(--border);
  position: relative;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.pref-toggle.on {
  background: var(--accent);
  border-color: var(--accent);
}

.pref-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--muted);
  transition: all 0.2s ease;
}

.pref-toggle.on .pref-knob {
  left: 20px;
  background: #fff;
}

.disclaimer-text {
  font-size: var(--text-xs);
  color: var(--muted);
  line-height: 1.5;
  padding: var(--space-3);
  background: var(--faint);
  border-radius: var(--radius-sm);
}

/* ── Footer ───────────────────────────────────────────────── */
.wizard-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--border);
  gap: var(--space-3);
}

.wizard-footer .btn {
  min-width: 120px;
}

.wizard-footer .btn-primary {
  flex: 1;
}

.spacer {
  min-width: 120px;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
