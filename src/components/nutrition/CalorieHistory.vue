<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  history: {
    type: Array,
    default: () => [],
  },
})

// ── Chart config ──────────────────────────────────────────────────────────

const SVG_W     = 320
const SVG_H     = 160
const BAR_W     = 32
const PAD_X     = 12
const PAD_TOP   = 16
const PAD_BOT   = 30
const CHART_H   = SVG_H - PAD_TOP - PAD_BOT

const DAY_ABBREV = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// ── Computed chart data ───────────────────────────────────────────────────

const maxKcal = computed(() => {
  const allKcal = props.history.map(d => Math.max(d.kcal || 0, d.target_kcal || 0))
  const max = Math.max(...allKcal, 2000)
  return Math.ceil(max / 500) * 500
})

const targetKcal = computed(() => {
  const t = props.history.find(d => d.target_kcal)?.target_kcal
  return t ?? 2000
})

const targetY = computed(() => {
  const pct = targetKcal.value / maxKcal.value
  return PAD_TOP + CHART_H * (1 - Math.min(pct, 1))
})

function barHeight(kcal) {
  if (!kcal) return 0
  return Math.min((kcal / maxKcal.value) * CHART_H, CHART_H)
}

function barY(kcal) {
  return PAD_TOP + CHART_H - barHeight(kcal)
}

function barX(idx) {
  const totalW = SVG_W - PAD_X * 2
  const spacing = totalW / 7
  return PAD_X + spacing * idx + (spacing - BAR_W) / 2
}

function labelX(idx) {
  const totalW = SVG_W - PAD_X * 2
  const spacing = totalW / 7
  return PAD_X + spacing * idx + spacing / 2
}

function barColor(day) {
  if (day.empty || !day.kcal) return 'empty'
  const ratio = day.kcal / (day.target_kcal || 2000)
  if (ratio < 0.90) return 'under'
  if (ratio <= 1.10) return 'on-target'
  return 'over'
}

// ── Tooltip ───────────────────────────────────────────────────────────────

const tooltip     = ref(null)
const tooltipIdx  = ref(null)

function showTooltip(idx) {
  tooltipIdx.value = idx
  tooltip.value    = props.history[idx] || null
}

function hideTooltip() {
  tooltip.value   = null
  tooltipIdx.value = null
}

// ── Today highlight ───────────────────────────────────────────────────────

const todayStr = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})

function isToday(day) {
  return day.date === todayStr.value
}

// ── 7-day stats ────────────────────────────────────────────────────────────

const stats = computed(() => {
  const filled = props.history.filter(d => !d.empty && d.kcal > 0)
  if (!filled.length) return null

  const avgKcal   = Math.round(filled.reduce((a, d) => a + d.kcal, 0) / filled.length)
  const best      = filled.reduce((a, b) => b.kcal > a.kcal ? b : a, filled[0])
  const target    = targetKcal.value
  const onTarget  = filled.filter(d => {
    const r = d.kcal / target
    return r >= 0.90 && r <= 1.10
  }).length

  return { avgKcal, bestDay: best, onTarget, trackedDays: filled.length }
})

// ── Expanded day ──────────────────────────────────────────────────────────

const expandedDay = ref(null)

function toggleDayLog(idx) {
  expandedDay.value = expandedDay.value === idx ? null : idx
}

// ── Format date ───────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${d} ${months[parseInt(m) - 1]}`
}

function getDayMealsTotal(meals) {
  let kcal = 0
  ;(meals || []).forEach(m => (m.foods || []).forEach(f => { kcal += f.kcal || 0 }))
  return Math.round(kcal)
}
</script>

<template>
  <div class="calorie-history">

    <!-- Chart card -->
    <div class="chart-card card">
      <p class="section-title label-caps">Calorías — últimos 7 días</p>

      <div class="chart-wrapper" v-if="history.length">
        <svg
          :viewBox="`0 0 ${SVG_W} ${SVG_H}`"
          class="history-svg"
          @mouseleave="hideTooltip"
          @touchend="hideTooltip"
        >
          <!-- Target dashed line -->
          <line
            :x1="PAD_X"
            :y1="targetY"
            :x2="SVG_W - PAD_X"
            :y2="targetY"
            stroke="var(--accent)"
            stroke-width="1.5"
            stroke-dasharray="5,4"
            opacity="0.6"
          />
          <text
            :x="SVG_W - PAD_X - 2"
            :y="targetY - 4"
            text-anchor="end"
            font-size="9"
            fill="var(--accent)"
            opacity="0.8"
          >meta</text>

          <!-- Bars -->
          <g v-for="(day, idx) in history" :key="idx">
            <!-- Empty bar outline -->
            <rect
              v-if="day.empty || !day.kcal"
              :x="barX(idx)"
              :y="PAD_TOP"
              :width="BAR_W"
              :height="CHART_H"
              rx="5"
              fill="none"
              stroke="var(--border)"
              stroke-width="1.5"
              stroke-dasharray="4,3"
            />
            <!-- Filled bar -->
            <rect
              v-else
              :x="barX(idx)"
              :y="barY(day.kcal)"
              :width="BAR_W"
              :height="barHeight(day.kcal)"
              rx="5"
              :class="['history-bar', 'bar-' + barColor(day)]"
              :opacity="tooltipIdx !== null && tooltipIdx !== idx ? 0.55 : 1"
              @click="showTooltip(idx)"
              @touchstart.prevent="showTooltip(idx)"
              style="cursor:pointer"
            />
            <!-- Today ring -->
            <rect
              v-if="isToday(day)"
              :x="barX(idx) - 2"
              :y="PAD_TOP - 2"
              :width="BAR_W + 4"
              :height="CHART_H + 4"
              rx="7"
              fill="none"
              stroke="var(--accent)"
              stroke-width="1.5"
              opacity="0.5"
            />
          </g>

          <!-- X labels -->
          <text
            v-for="(day, idx) in history"
            :key="'lbl-' + idx"
            :x="labelX(idx)"
            :y="SVG_H - 6"
            text-anchor="middle"
            font-size="11"
            :fill="isToday(day) ? 'var(--accent)' : 'var(--muted)'"
            :font-weight="isToday(day) ? '800' : '500'"
          >
            {{ DAY_ABBREV[idx] }}
          </text>
        </svg>

        <!-- Tooltip -->
        <div v-if="tooltip && !tooltip.empty" class="bar-tooltip">
          <p class="tt-date">{{ formatDate(tooltip.date) }}</p>
          <p class="tt-kcal">
            <span class="tt-num">{{ tooltip.kcal }}</span>
            <span class="tt-sep"> / {{ tooltip.target_kcal }} kcal</span>
          </p>
          <div class="tt-macros">
            <span class="tt-p">P: {{ tooltip.protein }}g</span>
            <span class="tt-c">C: {{ tooltip.carbs }}g</span>
            <span class="tt-f">G: {{ tooltip.fat }}g</span>
          </div>
        </div>
      </div>

      <div v-else class="chart-empty">
        <p>Sin datos de los últimos 7 días</p>
        <p class="chart-empty-sub">Registra alimentos para ver tu historial aquí</p>
      </div>

      <!-- Legend -->
      <div class="chart-legend">
        <span class="legend-item under">Por debajo</span>
        <span class="legend-item on-target">En objetivo</span>
        <span class="legend-item over">Exceso</span>
      </div>
    </div>

    <!-- Stats summary -->
    <div v-if="stats" class="stats-card card">
      <p class="section-title label-caps">Resumen de 7 días</p>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-num">{{ stats.avgKcal }}</span>
          <span class="stat-lbl">Kcal promedio</span>
        </div>
        <div class="stat-item">
          <span class="stat-num">{{ stats.onTarget }}/{{ stats.trackedDays }}</span>
          <span class="stat-lbl">Días en objetivo</span>
        </div>
        <div class="stat-item">
          <span class="stat-num">{{ formatDate(stats.bestDay.date) }}</span>
          <span class="stat-lbl">Día más activo</span>
        </div>
        <div class="stat-item">
          <span class="stat-num">{{ stats.bestDay.kcal }}</span>
          <span class="stat-lbl">Kcal máximo</span>
        </div>
      </div>
    </div>

    <!-- Day log accordion -->
    <div class="day-logs card">
      <p class="section-title label-caps">Ver registro por día</p>
      <div class="day-log-list">
        <div
          v-for="(day, idx) in [...history].reverse()"
          :key="idx"
          class="day-log-item"
        >
          <button
            type="button"
            class="day-log-toggle"
            :disabled="day.empty || !day.kcal"
            @click="toggleDayLog(idx)"
          >
            <div class="day-log-left">
              <span class="day-log-date">{{ formatDate(day.date) }}</span>
              <span v-if="isToday(day)" class="today-badge">Hoy</span>
            </div>
            <div class="day-log-right">
              <span
                v-if="day.kcal"
                class="day-log-kcal"
                :class="'color-' + barColor(day)"
              >
                {{ day.kcal }} kcal
              </span>
              <span v-else class="day-log-empty">Sin datos</span>
              <span class="log-arrow" :class="{ open: expandedDay === idx }">›</span>
            </div>
          </button>

          <div v-if="expandedDay === idx && !day.empty" class="day-log-meals">
            <div v-for="(meal, mi) in day.meals" :key="mi" class="day-log-meal">
              <div v-if="meal.foods && meal.foods.length" class="meal-log-block">
                <p class="meal-log-name">{{ meal.name }}</p>
                <div class="meal-log-foods">
                  <div
                    v-for="(food, fi) in meal.foods"
                    :key="fi"
                    class="meal-log-food-row"
                  >
                    <span class="log-food-name">{{ food.name }}</span>
                    <span class="log-food-kcal">{{ food.kcal }} kcal</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="day-log-total-row">
              <span>Total del día</span>
              <span class="day-log-total-num">{{ day.kcal }} kcal</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.calorie-history {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* ── Chart card ───────────────────────────────────────────── */
.chart-card {
  padding: var(--space-4) var(--space-5);
}

.section-title {
  margin-bottom: var(--space-3);
  color: var(--muted);
}

.chart-wrapper {
  position: relative;
}

.history-svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

/* Bar colors */
.history-bar { transition: opacity 0.15s; }
.bar-under     { fill: #60a5fa; }
.bar-on-target { fill: var(--success); }
.bar-over      { fill: var(--warning); }
.bar-empty     { fill: var(--faint-2); }

/* Tooltip */
.bar-tooltip {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background: var(--card);
  border: 1.5px solid var(--border-hi);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  pointer-events: none;
  min-width: 120px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.tt-date {
  font-size: var(--text-xs);
  color: var(--muted);
  margin-bottom: var(--space-1);
}

.tt-kcal {
  display: flex;
  align-items: baseline;
  gap: 3px;
  margin-bottom: var(--space-1);
}

.tt-num {
  font-family: var(--font-mono);
  font-size: var(--text-base);
  font-weight: 800;
  color: var(--text);
}

.tt-sep {
  font-size: var(--text-xs);
  color: var(--muted);
}

.tt-macros {
  display: flex;
  gap: var(--space-2);
}

.tt-p { font-size: var(--text-xs); color: var(--success); font-weight: 600; font-family: var(--font-mono); }
.tt-c { font-size: var(--text-xs); color: var(--accent); font-weight: 600; font-family: var(--font-mono); }
.tt-f { font-size: var(--text-xs); color: var(--warning); font-weight: 600; font-family: var(--font-mono); }

/* Legend */
.chart-legend {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-3);
  flex-wrap: wrap;
}

.legend-item {
  font-size: var(--text-xs);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--muted);
}

.legend-item::before {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 3px;
  display: inline-block;
}

.legend-item.under::before     { background: #60a5fa; }
.legend-item.on-target::before { background: var(--success); }
.legend-item.over::before      { background: var(--warning); }

/* Empty state */
.chart-empty {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--muted);
  font-size: var(--text-sm);
}

.chart-empty-sub {
  font-size: var(--text-xs);
  margin-top: var(--space-2);
}

/* ── Stats grid ───────────────────────────────────────────── */
.stats-card {
  padding: var(--space-4) var(--space-5);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-3);
  background: var(--surface);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.stat-num {
  font-family: var(--font-mono);
  font-size: var(--text-base);
  font-weight: 800;
  color: var(--text);
}

.stat-lbl {
  font-size: var(--text-xs);
  color: var(--muted);
}

/* ── Day logs ─────────────────────────────────────────────── */
.day-logs {
  padding: var(--space-4) var(--space-5);
}

.day-log-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.day-log-item {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.day-log-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--surface);
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.day-log-toggle:disabled {
  cursor: default;
}

.day-log-toggle:not(:disabled):hover {
  background: var(--faint);
}

.day-log-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.day-log-date {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text);
}

.today-badge {
  font-size: 10px;
  font-weight: 700;
  background: var(--accent-dim);
  color: var(--accent);
  padding: 2px 6px;
  border-radius: var(--radius-full);
}

.day-log-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.day-log-kcal {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 700;
}

.color-under     { color: #60a5fa; }
.color-on-target { color: var(--success); }
.color-over      { color: var(--warning); }
.color-empty     { color: var(--muted); }

.day-log-empty {
  font-size: var(--text-xs);
  color: var(--muted);
}

.log-arrow {
  font-size: 18px;
  color: var(--muted);
  transform: rotate(0deg);
  transition: transform 0.2s;
}

.log-arrow.open {
  transform: rotate(90deg);
}

.day-log-meals {
  padding: var(--space-3) var(--space-4);
  background: var(--faint);
  border-top: 1px solid var(--border);
}

.day-log-meal {}

.meal-log-block {
  margin-bottom: var(--space-3);
}

.meal-log-name {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-1);
}

.meal-log-foods {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meal-log-food-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-food-name {
  font-size: var(--text-sm);
  color: var(--text);
}

.log-food-kcal {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--muted);
}

.day-log-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border);
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--muted);
}

.day-log-total-num {
  font-family: var(--font-mono);
  color: var(--text);
  font-weight: 800;
}
</style>
