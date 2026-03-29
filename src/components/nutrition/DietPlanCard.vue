<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  plan: { type: Object, required: true },
})

const emit = defineEmits(['edit'])

// ── Accordion state ───────────────────────────────────────────────────────
const openFoodSection = ref(null)
const openDay         = ref(null)
const showSources     = ref(false)

function toggleFoodSection(key) {
  openFoodSection.value = openFoodSection.value === key ? null : key
}

function toggleDay(idx) {
  openDay.value = openDay.value === idx ? null : idx
}

// ── Macro bar widths ──────────────────────────────────────────────────────
const totalMacroKcal = computed(() => {
  if (!props.plan?.macro_targets) return 1
  const { protein, carbs, fat } = props.plan.macro_targets
  return (protein * 4) + (carbs * 4) + (fat * 9)
})

function macroPct(gram, factor) {
  const total = totalMacroKcal.value
  if (!total) return 0
  return Math.min(Math.round((gram * factor / total) * 100), 100)
}

// ── Key foods sections ────────────────────────────────────────────────────
const foodSections = computed(() => {
  if (!props.plan?.key_foods) return []
  const kf = props.plan.key_foods
  return [
    { key: 'proteins',   label: 'Proteínas',    icon: '🥩', items: kf.proteins   || [] },
    { key: 'carbs',      label: 'Carbohidratos', icon: '🌾', items: kf.carbs      || [] },
    { key: 'fats',       label: 'Grasas sanas',  icon: '🥑', items: kf.fats       || [] },
    { key: 'vegetables', label: 'Verduras',       icon: '🥦', items: kf.vegetables || [] },
    { key: 'fruits',     label: 'Frutas',         icon: '🍎', items: kf.fruits     || [] },
  ].filter(s => s.items.length > 0)
})

// ── Day label abbrev ──────────────────────────────────────────────────────
const DAY_ABBREV = { Lunes: 'L', Martes: 'M', Miércoles: 'X', Jueves: 'J', Viernes: 'V', Sábado: 'S', Domingo: 'D' }
</script>

<template>
  <div class="diet-plan-card">

    <!-- 1. Header ─────────────────────────────────────────────────────── -->
    <div class="plan-header card">
      <div class="plan-header-main">
        <span class="plan-type-icon">{{ plan.diet_icon }}</span>
        <div class="plan-header-info">
          <p class="plan-type-label label-caps">{{ plan.diet_label }}</p>
          <span class="plan-focus-badge">{{ plan.focus_label }}</span>
        </div>
      </div>
      <button type="button" class="btn btn-ghost edit-btn" @click="emit('edit')">
        Editar
      </button>
    </div>

    <!-- Disclaimer -->
    <div class="disclaimer-banner">
      ⚠️ {{ plan.disclaimer }}
    </div>

    <!-- 2. Macro targets ─────────────────────────────────────────────── -->
    <div class="section-card card">
      <p class="section-title label-caps">Objetivos nutricionales</p>
      <div class="macro-kcal-row">
        <span class="macro-kcal-num">{{ plan.macro_targets.kcal }}</span>
        <span class="macro-kcal-lbl">kcal / día</span>
      </div>
      <div class="macro-bars-list">
        <div class="macro-bar-item">
          <div class="macro-bar-label-row">
            <span class="macro-bar-name">Proteína</span>
            <span class="macro-bar-val">{{ plan.macro_targets.protein }}g</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill protein" :style="{ width: macroPct(plan.macro_targets.protein, 4) + '%' }" />
          </div>
        </div>
        <div class="macro-bar-item">
          <div class="macro-bar-label-row">
            <span class="macro-bar-name">Carbohidratos</span>
            <span class="macro-bar-val">{{ plan.macro_targets.carbs }}g</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill carbs" :style="{ width: macroPct(plan.macro_targets.carbs, 4) + '%' }" />
          </div>
        </div>
        <div class="macro-bar-item">
          <div class="macro-bar-label-row">
            <span class="macro-bar-name">Grasas</span>
            <span class="macro-bar-val">{{ plan.macro_targets.fat }}g</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill fat" :style="{ width: macroPct(plan.macro_targets.fat, 9) + '%' }" />
          </div>
        </div>
      </div>
      <p class="rationale-text">{{ plan.rationale }}</p>
    </div>

    <!-- 3. Timing de comidas ─────────────────────────────────────────── -->
    <div class="section-card card">
      <p class="section-title label-caps">Timing de comidas</p>
      <div class="timing-list">
        <div v-for="(item, idx) in plan.meal_timing" :key="idx" class="timing-item">
          <div class="timing-left">
            <span class="timing-time">{{ item.time }}</span>
            <div class="timing-line" v-if="idx < plan.meal_timing.length - 1" />
          </div>
          <div class="timing-body">
            <p class="timing-name">{{ item.name }}</p>
            <p class="timing-pct">{{ item.kcal_pct }}% de kcal diarias</p>
            <p class="timing-tip">{{ item.tip }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Alimentos clave ───────────────────────────────────────────── -->
    <div class="section-card card">
      <p class="section-title label-caps">Alimentos clave</p>
      <div class="accordion-list">
        <div
          v-for="section in foodSections"
          :key="section.key"
          class="accordion-item"
        >
          <button
            type="button"
            class="accordion-toggle"
            @click="toggleFoodSection(section.key)"
          >
            <span>{{ section.icon }} {{ section.label }}</span>
            <span class="accordion-arrow" :class="{ open: openFoodSection === section.key }">›</span>
          </button>
          <div v-if="openFoodSection === section.key" class="accordion-body">
            <div class="food-chips">
              <div
                v-for="(food, fi) in section.items"
                :key="fi"
                class="food-chip"
              >
                <span class="food-chip-name">{{ food.name }}</span>
                <span v-if="food.kcal_per_100g" class="food-chip-meta">{{ food.kcal_per_100g }} kcal/100g</span>
                <span v-if="food.protein_per_100g" class="food-chip-meta protein">{{ food.protein_per_100g }}g prot</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. Plan semanal ─────────────────────────────────────────────── -->
    <div class="section-card card">
      <p class="section-title label-caps">Plan semanal de ejemplo</p>
      <p class="section-sub">Menús orientativos para guiarte. Ajusta porciones a tus objetivos.</p>
      <div class="week-list">
        <div v-for="(dayPlan, idx) in plan.weekly_sample" :key="idx" class="day-item">
          <button
            type="button"
            class="day-toggle"
            @click="toggleDay(idx)"
          >
            <div class="day-toggle-left">
              <span class="day-abbrev">{{ DAY_ABBREV[dayPlan.day] || dayPlan.day[0] }}</span>
              <span class="day-name">{{ dayPlan.day }}</span>
            </div>
            <div class="day-toggle-right">
              <span class="day-kcal">
                ~{{ dayPlan.meals.reduce((a, m) => a + (m.kcal_approx || 0), 0) }} kcal
              </span>
              <span class="accordion-arrow" :class="{ open: openDay === idx }">›</span>
            </div>
          </button>
          <div v-if="openDay === idx" class="day-meals">
            <div v-for="(meal, mi) in dayPlan.meals" :key="mi" class="day-meal-row">
              <div class="meal-row-header">
                <span class="meal-row-name">{{ meal.name }}</span>
                <span class="meal-row-kcal">~{{ meal.kcal_approx }} kcal</span>
              </div>
              <ul class="meal-food-list">
                <li v-for="(food, fi) in meal.foods" :key="fi">{{ food }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 6. Suplementos ──────────────────────────────────────────────── -->
    <div v-if="plan.supplements && plan.supplements.length" class="section-card card">
      <p class="section-title label-caps">Suplementos recomendados</p>
      <p class="section-sub">Basado en evidencia científica. Consulta con tu médico antes de suplementar.</p>
      <div class="supp-list">
        <div v-for="(supp, idx) in plan.supplements" :key="idx" class="supp-card">
          <div class="supp-header">
            <span class="supp-name">{{ supp.name }}</span>
            <span class="supp-evidence">{{ supp.evidence }}</span>
          </div>
          <p class="supp-dose">💊 {{ supp.dose }} — {{ supp.timing }}</p>
          <p class="supp-rationale">{{ supp.rationale }}</p>
        </div>
      </div>
    </div>

    <!-- 7. Evitar ───────────────────────────────────────────────────── -->
    <div v-if="plan.avoid_foods && plan.avoid_foods.length" class="section-card card">
      <p class="section-title label-caps">Alimentos a evitar</p>
      <p class="section-sub">Por tus alergias e intolerancias declaradas.</p>
      <div class="avoid-chips">
        <span v-for="(food, idx) in plan.avoid_foods" :key="idx" class="avoid-chip">
          ✕ {{ food }}
        </span>
      </div>
    </div>

    <!-- 8. Tips ─────────────────────────────────────────────────────── -->
    <div class="section-card card">
      <p class="section-title label-caps">Consejos prácticos</p>
      <div class="tips-list">
        <div v-for="(tip, idx) in plan.tips" :key="idx" class="tip-card">
          <span class="tip-num">{{ idx + 1 }}</span>
          <p class="tip-text">{{ tip }}</p>
        </div>
      </div>
    </div>

    <!-- 9. Fuentes ──────────────────────────────────────────────────── -->
    <div class="section-card card">
      <button type="button" class="accordion-toggle sources-toggle" @click="showSources = !showSources">
        <span>📚 Fuentes científicas</span>
        <span class="accordion-arrow" :class="{ open: showSources }">›</span>
      </button>
      <div v-if="showSources" class="sources-list">
        <p v-for="(src, idx) in plan.sources" :key="idx" class="source-item">
          {{ idx + 1 }}. {{ src }}
        </p>
      </div>
    </div>

  </div>
</template>

<style scoped>
.diet-plan-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* ── Shared card sections ─────────────────────────────────── */
.section-card {
  padding: var(--space-4) var(--space-5);
}

.section-title {
  margin-bottom: var(--space-3);
  color: var(--muted);
}

.section-sub {
  font-size: var(--text-xs);
  color: var(--muted);
  margin-bottom: var(--space-3);
  margin-top: calc(-1 * var(--space-2));
  line-height: 1.5;
}

/* ── Header ───────────────────────────────────────────────── */
.plan-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  gap: var(--space-3);
}

.plan-header-main {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
}

.plan-type-icon {
  font-size: 32px;
  line-height: 1;
}

.plan-header-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.plan-type-label {
  font-size: var(--text-xs);
  color: var(--muted);
  margin: 0;
}

.plan-focus-badge {
  display: inline-block;
  padding: 2px var(--space-2);
  background: var(--accent-dim);
  color: var(--accent);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 700;
  line-height: 1.6;
}

.edit-btn {
  flex-shrink: 0;
  font-size: var(--text-sm);
}

/* ── Disclaimer ───────────────────────────────────────────── */
.disclaimer-banner {
  padding: var(--space-3) var(--space-4);
  background: var(--warning-dim);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--text);
  line-height: 1.5;
  border-left: 3px solid var(--warning);
}

/* ── Macro bars ───────────────────────────────────────────── */
.macro-kcal-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.macro-kcal-num {
  font-family: var(--font-mono);
  font-size: 28px;
  font-weight: 800;
  color: var(--text);
}

.macro-kcal-lbl {
  font-size: var(--text-sm);
  color: var(--muted);
}

.macro-bars-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.macro-bar-item {}
.macro-bar-label-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-1);
}

.macro-bar-name {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.macro-bar-val {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text);
}

.bar-track {
  height: 7px;
  background: var(--faint);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.bar-fill.protein { background: var(--success); }
.bar-fill.carbs   { background: var(--accent); }
.bar-fill.fat     { background: var(--warning); }

.rationale-text {
  font-size: var(--text-xs);
  color: var(--muted);
  line-height: 1.6;
  padding: var(--space-3);
  background: var(--faint);
  border-radius: var(--radius-sm);
  border-left: 2px solid var(--accent);
}

/* ── Timing ───────────────────────────────────────────────── */
.timing-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.timing-item {
  display: flex;
  gap: var(--space-3);
}

.timing-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 48px;
  flex-shrink: 0;
}

.timing-time {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--accent);
  white-space: nowrap;
}

.timing-line {
  flex: 1;
  width: 2px;
  background: var(--border);
  margin: var(--space-1) 0;
  min-height: 20px;
}

.timing-body {
  flex: 1;
  padding-bottom: var(--space-4);
}

.timing-name {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text);
  margin-bottom: 2px;
}

.timing-pct {
  font-size: var(--text-xs);
  color: var(--accent);
  font-weight: 600;
  margin-bottom: var(--space-1);
}

.timing-tip {
  font-size: var(--text-xs);
  color: var(--muted);
  line-height: 1.5;
}

/* ── Accordion ────────────────────────────────────────────── */
.accordion-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.accordion-item {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.accordion-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--surface);
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text);
  text-align: left;
  transition: background 0.15s;
}

.accordion-toggle:hover {
  background: var(--faint);
}

.accordion-arrow {
  font-size: 18px;
  color: var(--muted);
  transform: rotate(0deg);
  transition: transform 0.2s ease;
}

.accordion-arrow.open {
  transform: rotate(90deg);
}

.accordion-body {
  padding: var(--space-3) var(--space-4);
  background: var(--faint);
  border-top: 1px solid var(--border);
}

/* ── Food chips ───────────────────────────────────────────── */
.food-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.food-chip {
  display: flex;
  flex-direction: column;
  padding: var(--space-2) var(--space-3);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  gap: 2px;
}

.food-chip-name {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--text);
}

.food-chip-meta {
  font-size: 10px;
  color: var(--muted);
  font-family: var(--font-mono);
}

.food-chip-meta.protein {
  color: var(--success);
}

/* ── Weekly plan ──────────────────────────────────────────── */
.week-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.day-item {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.day-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--surface);
  border: none;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
}

.day-toggle:hover {
  background: var(--faint);
}

.day-toggle-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.day-abbrev {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent-dim);
  color: var(--accent);
  font-size: var(--text-xs);
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.day-name {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text);
}

.day-toggle-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.day-kcal {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--muted);
}

.day-meals {
  padding: var(--space-3) var(--space-4);
  background: var(--faint);
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.day-meal-row {}

.meal-row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.meal-row-name {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text);
}

.meal-row-kcal {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--muted);
}

.meal-food-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meal-food-list li {
  font-size: var(--text-xs);
  color: var(--muted);
  padding-left: var(--space-3);
  position: relative;
  line-height: 1.5;
}

.meal-food-list li::before {
  content: '·';
  position: absolute;
  left: var(--space-1);
  color: var(--accent);
  font-weight: 700;
}

/* ── Supplements ──────────────────────────────────────────── */
.supp-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.supp-card {
  padding: var(--space-3) var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--accent);
}

.supp-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.supp-name {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text);
}

.supp-evidence {
  font-size: 10px;
  color: var(--muted);
  background: var(--faint);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.supp-dose {
  font-size: var(--text-xs);
  color: var(--accent);
  font-weight: 600;
  margin-bottom: var(--space-1);
}

.supp-rationale {
  font-size: var(--text-xs);
  color: var(--muted);
  line-height: 1.5;
}

/* ── Avoid foods ──────────────────────────────────────────── */
.avoid-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.avoid-chip {
  padding: var(--space-2) var(--space-3);
  background: color-mix(in srgb, var(--danger) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--danger) 30%, transparent);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--danger);
}

/* ── Tips ─────────────────────────────────────────────────── */
.tips-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.tip-card {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
}

.tip-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--accent-dim);
  color: var(--accent);
  font-size: var(--text-xs);
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.tip-text {
  font-size: var(--text-sm);
  color: var(--text);
  line-height: 1.6;
}

/* ── Sources ──────────────────────────────────────────────── */
.sources-toggle {
  background: transparent;
  padding: 0;
  border: none;
}

.sources-list {
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.source-item {
  font-size: var(--text-xs);
  color: var(--muted);
  line-height: 1.6;
  padding-left: var(--space-3);
  border-left: 2px solid var(--border);
}
</style>
