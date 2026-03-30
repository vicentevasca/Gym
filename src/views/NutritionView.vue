<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNutritionStore } from '@/stores/nutrition.store'
import { useTrainingStore }  from '@/stores/training.store'
import { staggerIn }         from '@/composables/useAnimations'
import { generateDietPlan }  from '@/utils/dietPlanner'
import { useShareCard }      from '@/composables/useShareCard'
import AppHeader      from '@/components/ui/AppHeader.vue'
import BottomNav      from '@/components/ui/BottomNav.vue'
import MacroRing      from '@/components/nutrition/MacroRing.vue'
import MealLogger     from '@/components/nutrition/MealLogger.vue'
import DietWizard     from '@/components/nutrition/DietWizard.vue'
import DietPlanCard   from '@/components/nutrition/DietPlanCard.vue'
import CalorieHistory from '@/components/nutrition/CalorieHistory.vue'
import ShareSheet     from '@/components/ui/ShareSheet.vue'

// ── Stores ────────────────────────────────────────────────────────────────

const nutrition = useNutritionStore()
const training  = useTrainingStore()
const { shareNutrition } = useShareCard()

// ── State ─────────────────────────────────────────────────────────────────

const activeTab       = ref('registro')
const showWizard      = ref(false)
const saving          = ref(false)
const showShareSheet  = ref(false)
const copyingYesterday = ref(false)
const copiedYesterday  = ref(false)

// ── Init ──────────────────────────────────────────────────────────────────

onMounted(async () => {
  await nutrition.loadDayLog()
  await training.loadRoutine()
  staggerIn('.meal-section', { delay: 0.2 })
})

// ── Computed ──────────────────────────────────────────────────────────────

const targets      = computed(() => nutrition.targets)
const consumed     = computed(() => nutrition.consumed)
const meals        = computed(() => nutrition.dayLog?.meals ?? [])
const water        = computed(() => nutrition.dayLog?.water_ml ?? 0)
const waterPct     = computed(() => Math.min(Math.round((water.value / 2500) * 100), 100))
const waterGlasses = computed(() => Math.floor(water.value / 250))

const dietPlan  = computed(() => nutrition.dietPlan)
const history   = computed(() => nutrition.history)
const routine   = computed(() => training.routine)

// ── Actions ───────────────────────────────────────────────────────────────

async function addWater(ml) {
  await nutrition.logWater(ml)
}

async function handleGenerate(params) {
  saving.value = true
  try {
    const plan = generateDietPlan(params, nutrition.targets, training.routine)
    await nutrition.saveDietPlan({ ...plan, wizard_params: params })
    showWizard.value = false
    activeTab.value  = 'dieta'
  } finally {
    saving.value = false
  }
}

async function handleCopyYesterday() {
  if (copyingYesterday.value) return
  copyingYesterday.value = true
  try {
    const ok = await nutrition.copyFromYesterday()
    if (ok) {
      copiedYesterday.value = true
      setTimeout(() => { copiedYesterday.value = false }, 3000)
    }
  } finally {
    copyingYesterday.value = false
  }
}

const nutritionShareOptions = computed(() => [
  {
    id:    'nutrition',
    icon:  '🥗',
    label: 'Compartir mi nutrición de hoy',
    fn:    () => shareNutrition({
      consumed:  consumed.value,
      targets:   targets.value,
      water_ml:  water.value,
      date:      new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }),
    }),
  },
])

const TABS = [
  { id: 'registro',  label: 'Registro' },
  { id: 'historial', label: 'Historial' },
  { id: 'dieta',     label: 'Mi dieta' },
]
</script>

<template>
  <div>
    <AppHeader title="NUTRICIÓN" />

    <main class="page-content page-pad">

      <!-- Loading -->
      <div v-if="nutrition.loading" class="loading-state">
        <div class="spinner" />
        <p>Cargando registro…</p>
      </div>

      <template v-else>

        <!-- Tab selector -->
        <div class="tab-bar">
          <button
            v-for="tab in TABS"
            :key="tab.id"
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- ═══ TAB: REGISTRO ════════════════════════════════════ -->
        <div v-show="activeTab === 'registro'">

          <section class="section-block meal-section">
            <MacroRing :consumed="consumed" :targets="targets" />
          </section>

          <!-- Water tracker -->
          <section class="section-block meal-section">
            <div class="water-card card">
              <div class="water-header">
                <div class="water-info">
                  <span class="water-icon">💧</span>
                  <div>
                    <p class="water-title">Agua</p>
                    <p class="water-ml">{{ water }} <span>/ 2500 ml</span></p>
                  </div>
                </div>
                <div class="water-glasses">
                  <span
                    v-for="n in 10"
                    :key="n"
                    class="glass-dot"
                    :class="{ filled: n <= waterGlasses }"
                  />
                </div>
              </div>
              <div class="water-progress">
                <div class="water-fill" :style="{ width: waterPct + '%' }" />
              </div>
              <div class="water-btns">
                <button type="button" class="water-btn" @click="addWater(150)">+150ml</button>
                <button type="button" class="water-btn" @click="addWater(250)">+250ml</button>
                <button type="button" class="water-btn" @click="addWater(500)">+500ml</button>
              </div>
            </div>
          </section>

          <!-- Acciones rápidas del registro -->
          <div class="registro-actions">
            <button
              type="button"
              class="btn btn-ghost reg-action-btn"
              :disabled="copyingYesterday"
              @click="handleCopyYesterday"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              {{ copiedYesterday ? '¡Copiado!' : copyingYesterday ? 'Copiando…' : 'Copiar de ayer' }}
            </button>
            <button
              type="button"
              class="btn btn-ghost reg-action-btn"
              @click="showShareSheet = true"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Compartir
            </button>
          </div>

          <!-- Meal loggers -->
          <section
            v-for="meal in meals"
            :key="meal.id"
            class="section-block meal-section"
          >
            <MealLogger :meal="meal" />
          </section>

        </div>

        <!-- ═══ TAB: HISTORIAL ═══════════════════════════════════ -->
        <div v-show="activeTab === 'historial'">
          <section v-if="history.length === 0" class="empty-state">
            <div class="empty-icon">📅</div>
            <p class="empty-title">Sin historial aún</p>
            <p class="empty-sub">Registra tus comidas durante la semana para ver el historial aquí.</p>
          </section>
          <section v-else class="section-block">
            <CalorieHistory :history="history" />
          </section>
        </div>

        <!-- ═══ TAB: MI DIETA ════════════════════════════════════ -->
        <div v-show="activeTab === 'dieta'">

          <!-- Sin plan: CTA -->
          <section v-if="!dietPlan" class="section-block">
            <div class="no-plan-card card">
              <div class="no-plan-icon">🍽️</div>
              <h2 class="no-plan-title">Crea tu plan nutricional</h2>
              <p class="no-plan-desc">
                Genera un plan de dieta personalizado basado en tus objetivos de entrenamiento, tipo de dieta y presupuesto.
                Incluye menú semanal, alimentos clave, timing de comidas y suplementos respaldados por evidencia científica.
              </p>
              <ul class="no-plan-features">
                <li>🔬 Basado en ciencia (ISSN, USDA, PREDIMED)</li>
                <li>🥗 8 tipos de dieta disponibles</li>
                <li>📅 Menú semanal con recetas reales</li>
                <li>💊 Suplementación evidenciada</li>
              </ul>
              <button
                type="button"
                class="btn btn-primary no-plan-btn"
                @click="showWizard = true"
              >
                Generar mi plan nutricional
              </button>
            </div>
          </section>

          <!-- Con plan: DietPlanCard -->
          <template v-else>
            <div class="plan-actions">
              <button
                type="button"
                class="btn btn-secondary"
                @click="showWizard = true"
              >
                Actualizar plan
              </button>
            </div>
            <section class="section-block">
              <DietPlanCard :plan="dietPlan" @edit="showWizard = true" />
            </section>
          </template>

        </div>

      </template>
    </main>

    <BottomNav />

    <!-- Diet Wizard Modal -->
    <DietWizard
      v-if="showWizard"
      :routine="routine"
      @generate="handleGenerate"
      @close="showWizard = false"
    />

    <ShareSheet
      v-if="showShareSheet"
      :options="nutritionShareOptions"
      @close="showShareSheet = false"
    />
  </div>
</template>

<style scoped>
.page-pad {
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

.section-block {
  margin-bottom: var(--space-4);
}

/* ── Loading ──────────────────────────────────────────────── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: var(--space-4);
  color: var(--muted);
}

/* ── Tabs ─────────────────────────────────────────────────── */
.tab-bar {
  display: flex;
  gap: 0;
  background: var(--faint);
  border-radius: var(--radius-lg);
  padding: 3px;
  margin-bottom: var(--space-4);
  overflow: hidden;
}

.tab-btn {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn.active {
  background: var(--card);
  color: var(--text);
  font-weight: 700;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

/* ── Water ────────────────────────────────────────────────── */
.water-card          { padding: var(--space-4) var(--space-5); }
.water-header        { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-3); }
.water-info          { display: flex; align-items: center; gap: var(--space-3); }
.water-icon          { font-size: 24px; }
.water-title         { font-size: var(--text-base); font-weight: 700; }
.water-ml            { font-size: var(--text-sm); color: var(--muted); font-family: var(--font-mono); }
.water-ml span       { font-size: var(--text-xs); }
.water-glasses       { display: flex; flex-wrap: wrap; gap: 4px; max-width: 90px; justify-content: flex-end; }
.glass-dot           { width: 12px; height: 12px; border-radius: 3px; background: var(--faint); transition: background 0.2s; }
.glass-dot.filled    { background: #60a5fa; }
.water-progress      { height: 6px; background: var(--faint); border-radius: 3px; overflow: hidden; margin-bottom: var(--space-4); }
.water-fill          { height: 100%; background: linear-gradient(90deg, #60a5fa, #38bdf8); border-radius: 3px; transition: width 0.5s ease; }
.water-btns          { display: flex; gap: var(--space-3); }
.water-btn {
  flex: 1;
  padding: var(--space-2);
  background: var(--faint-2);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--text);
  cursor: pointer;
  transition: var(--transition);
}
.water-btn:hover { border-color: #60a5fa; color: #60a5fa; }

/* ── No plan CTA ──────────────────────────────────────────── */
.no-plan-card {
  padding: var(--space-8) var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-4);
}

.no-plan-icon {
  font-size: 48px;
  line-height: 1;
}

.no-plan-title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 800;
  color: var(--text);
}

.no-plan-desc {
  font-size: var(--text-sm);
  color: var(--muted);
  line-height: 1.6;
  max-width: 340px;
}

.no-plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  text-align: left;
  width: 100%;
  max-width: 280px;
}

.no-plan-features li {
  font-size: var(--text-sm);
  color: var(--text);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.no-plan-btn {
  width: 100%;
  max-width: 320px;
  padding: var(--space-4);
  font-size: var(--text-base);
}

/* ── Plan actions ─────────────────────────────────────────── */
.plan-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--space-3);
}

/* ── Empty state ──────────────────────────────────────────── */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: var(--space-10) var(--space-4); gap: var(--space-3);
}
.empty-icon  { font-size: 44px; line-height: 1; }
.empty-title { font-size: var(--text-lg); font-weight: 700; color: var(--text); }
.empty-sub   { font-size: var(--text-sm); color: var(--muted); line-height: 1.6; max-width: 280px; }

/* ── Registro quick actions ───────────────────────────────── */
.registro-actions {
  display: flex; gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.reg-action-btn {
  flex: 1; display: flex; align-items: center; justify-content: center;
  gap: var(--space-2); font-size: var(--text-xs);
}
</style>
