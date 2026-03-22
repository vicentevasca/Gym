<script setup>
import { computed } from 'vue'

const props = defineProps({
  consumed: { type: Object, default: () => ({ kcal: 0, protein: 0, carbs: 0, fat: 0 }) },
  targets:  { type: Object, default: () => ({ kcal: 2000, protein: 150, carbs: 200, fat: 60 }) },
})

const R    = 42
const CIRC = computed(() => 2 * Math.PI * R)

function offset(value, max) {
  const pct = Math.min(value / (max || 1), 1)
  return CIRC.value * (1 - pct)
}

const kcalPct    = computed(() => Math.min(Math.round((props.consumed.kcal    / (props.targets.kcal    || 1)) * 100), 100))
const proteinPct = computed(() => Math.min(Math.round((props.consumed.protein / (props.targets.protein || 1)) * 100), 100))
const carbsPct   = computed(() => Math.min(Math.round((props.consumed.carbs   / (props.targets.carbs   || 1)) * 100), 100))
const fatPct     = computed(() => Math.min(Math.round((props.consumed.fat     / (props.targets.fat     || 1)) * 100), 100))
</script>

<template>
  <div class="macro-ring-card card">
    <!-- Kcal ring -->
    <div class="ring-wrap">
      <svg class="ring-svg" viewBox="0 0 100 100">
        <circle class="ring-track" cx="50" cy="50" :r="R" fill="none" stroke-width="8"/>
        <circle
          class="ring-fill kcal"
          cx="50" cy="50" :r="R" fill="none" stroke-width="8"
          :stroke-dasharray="CIRC"
          :stroke-dashoffset="offset(consumed.kcal, targets.kcal)"
          stroke-linecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div class="ring-center">
        <span class="ring-val">{{ consumed.kcal }}</span>
        <span class="ring-lbl">kcal</span>
        <span class="ring-sub">/ {{ targets.kcal }}</span>
      </div>
    </div>

    <!-- Macro bars -->
    <div class="macro-bars">
      <div class="macro-item">
        <div class="macro-row">
          <span class="macro-name">Proteína</span>
          <span class="macro-nums">{{ consumed.protein }}<span class="macro-max">/{{ targets.protein }}g</span></span>
        </div>
        <div class="bar-track">
          <div class="bar-fill protein" :style="{ width: proteinPct + '%' }" />
        </div>
      </div>
      <div class="macro-item">
        <div class="macro-row">
          <span class="macro-name">Carbos</span>
          <span class="macro-nums">{{ consumed.carbs }}<span class="macro-max">/{{ targets.carbs }}g</span></span>
        </div>
        <div class="bar-track">
          <div class="bar-fill carbs" :style="{ width: carbsPct + '%' }" />
        </div>
      </div>
      <div class="macro-item">
        <div class="macro-row">
          <span class="macro-name">Grasa</span>
          <span class="macro-nums">{{ consumed.fat }}<span class="macro-max">/{{ targets.fat }}g</span></span>
        </div>
        <div class="bar-track">
          <div class="bar-fill fat" :style="{ width: fatPct + '%' }" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.macro-ring-card {
  display: flex; gap: var(--space-5); align-items: center;
}

.ring-wrap { position: relative; width: 110px; height: 110px; flex-shrink: 0; }
.ring-svg  { width: 100%; height: 100%; }
.ring-track { stroke: var(--faint); }
.ring-fill  { transition: stroke-dashoffset 0.6s ease; }
.ring-fill.kcal { stroke: var(--accent); }
.ring-center {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.ring-val { font-size: 22px; font-weight: 800; font-family: var(--font-mono); color: var(--text); line-height: 1; }
.ring-lbl { font-size: var(--text-xs); color: var(--accent); font-weight: 700; letter-spacing: 0.05em; }
.ring-sub { font-size: 10px; color: var(--muted); }

.macro-bars { flex: 1; display: flex; flex-direction: column; gap: var(--space-3); }
.macro-item {}
.macro-row  { display: flex; justify-content: space-between; margin-bottom: var(--space-1); }
.macro-name { font-size: var(--text-xs); font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em; }
.macro-nums { font-size: var(--text-sm); font-weight: 700; font-family: var(--font-mono); color: var(--text); }
.macro-max  { color: var(--muted); font-weight: 400; }

.bar-track { height: 6px; background: var(--faint); border-radius: 3px; overflow: hidden; }
.bar-fill  { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.bar-fill.protein { background: var(--success); }
.bar-fill.carbs   { background: var(--accent); }
.bar-fill.fat     { background: var(--warning); }
</style>
