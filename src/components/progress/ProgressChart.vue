<script setup>
import { computed } from 'vue'

const props = defineProps({
  data:    { type: Array, default: () => [] },  // [{ date, value }]
  label:   { type: String, default: 'Valor' },
  color:   { type: String, default: 'var(--accent)' },
  unit:    { type: String, default: '' },
})

const W = 300
const H = 100
const PAD = 10

const points = computed(() => {
  if (props.data.length < 2) return []
  const values = props.data.map(d => d.value)
  const minV   = Math.min(...values)
  const maxV   = Math.max(...values)
  const range  = maxV - minV || 1
  return props.data.map((d, i) => {
    const x = PAD + (i / (props.data.length - 1)) * (W - PAD * 2)
    const y = PAD + (1 - (d.value - minV) / range) * (H - PAD * 2)
    return { x, y, value: d.value, date: d.date }
  })
})

const polyline = computed(() =>
  points.value.map(p => `${p.x},${p.y}`).join(' ')
)

const area = computed(() => {
  if (!points.value.length) return ''
  const start = `M ${points.value[0].x},${H}`
  const line  = points.value.map(p => `L ${p.x},${p.y}`).join(' ')
  const end   = `L ${points.value[points.value.length - 1].x},${H} Z`
  return `${start} ${line} ${end}`
})

const lastPoint = computed(() => points.value[points.value.length - 1])
</script>

<template>
  <div class="progress-chart">
    <div class="chart-header">
      <span class="chart-label label-caps">{{ label }}</span>
      <span v-if="lastPoint" class="chart-val">{{ lastPoint.value }}{{ unit }}</span>
    </div>

    <div v-if="data.length < 2" class="chart-empty">
      <p>Faltan datos para mostrar la gráfica.</p>
    </div>

    <svg v-else :viewBox="`0 0 ${W} ${H}`" class="chart-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="color" stop-opacity="0.3"/>
          <stop offset="100%" :stop-color="color" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <!-- Area fill -->
      <path :d="area" fill="url(#chart-grad)" />
      <!-- Line -->
      <polyline
        :points="polyline"
        fill="none"
        :stroke="color"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <!-- Last dot -->
      <circle v-if="lastPoint" :cx="lastPoint.x" :cy="lastPoint.y" r="4" :fill="color" />
    </svg>

    <!-- X-axis dates (first + last) -->
    <div v-if="data.length >= 2" class="chart-dates">
      <span class="date-lbl">{{ data[0].date }}</span>
      <span class="date-lbl">{{ data[data.length - 1].date }}</span>
    </div>
  </div>
</template>

<style scoped>
.progress-chart { width: 100%; }
.chart-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: var(--space-3); }
.chart-label  { color: var(--muted); }
.chart-val    { font-size: var(--text-base); font-weight: 800; font-family: var(--font-mono); color: var(--text); }

.chart-empty { height: 80px; display: flex; align-items: center; justify-content: center; color: var(--muted); font-size: var(--text-sm); }

.chart-svg { width: 100%; height: 100px; display: block; }

.chart-dates { display: flex; justify-content: space-between; margin-top: var(--space-2); }
.date-lbl { font-size: 10px; color: var(--muted); }
</style>
