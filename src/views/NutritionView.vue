<script setup>
import { onMounted, computed } from 'vue'
import { useNutritionStore } from '@/stores/nutrition.store'
import { staggerIn }         from '@/composables/useAnimations'
import AppHeader  from '@/components/ui/AppHeader.vue'
import BottomNav  from '@/components/ui/BottomNav.vue'
import MacroRing  from '@/components/nutrition/MacroRing.vue'
import MealLogger from '@/components/nutrition/MealLogger.vue'

const nutrition = useNutritionStore()

onMounted(async () => {
  await nutrition.loadDayLog()
  staggerIn('.meal-section', { delay: 0.2 })
})

const targets  = computed(() => nutrition.targets)
const consumed = computed(() => nutrition.consumed)
const meals    = computed(() => nutrition.dayLog?.meals ?? [])
const water    = computed(() => nutrition.dayLog?.water_ml ?? 0)
const waterPct = computed(() => Math.min(Math.round((water.value / 2500) * 100), 100))

const waterGlasses = computed(() => Math.floor(water.value / 250))

async function addWater(ml) {
  await nutrition.logWater(ml)
}
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
        <!-- Macro Ring summary -->
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
              <button class="water-btn" @click="addWater(150)">+150ml</button>
              <button class="water-btn" @click="addWater(250)">+250ml</button>
              <button class="water-btn" @click="addWater(500)">+500ml</button>
            </div>
          </div>
        </section>

        <!-- Meal loggers -->
        <section v-for="meal in meals" :key="meal.id" class="section-block meal-section">
          <MealLogger :meal="meal" />
        </section>
      </template>
    </main>
    <BottomNav />
  </div>
</template>

<style scoped>
.page-pad { padding: var(--space-5) var(--space-4) var(--space-12); }
.section-block { margin-bottom: var(--space-4); }

.loading-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 50vh; gap: var(--space-4); color: var(--muted);
}

.water-card { padding: var(--space-4) var(--space-5); }
.water-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-3); }
.water-info { display: flex; align-items: center; gap: var(--space-3); }
.water-icon { font-size: 24px; }
.water-title { font-size: var(--text-base); font-weight: 700; }
.water-ml { font-size: var(--text-sm); color: var(--muted); font-family: var(--font-mono); }
.water-ml span { font-size: var(--text-xs); }

.water-glasses { display: flex; flex-wrap: wrap; gap: 4px; max-width: 90px; justify-content: flex-end; }
.glass-dot { width: 12px; height: 12px; border-radius: 3px; background: var(--faint); transition: background 0.2s; }
.glass-dot.filled { background: #60a5fa; }

.water-progress { height: 6px; background: var(--faint); border-radius: 3px; overflow: hidden; margin-bottom: var(--space-4); }
.water-fill { height: 100%; background: linear-gradient(90deg, #60a5fa, #38bdf8); border-radius: 3px; transition: width 0.5s ease; }

.water-btns { display: flex; gap: var(--space-3); }
.water-btn {
  flex: 1; padding: var(--space-2) var(--space-2);
  background: var(--faint-2); border: 1.5px solid var(--border);
  border-radius: var(--radius-sm); font-size: var(--text-xs); font-weight: 700;
  color: var(--text); cursor: pointer; transition: var(--transition);
}
.water-btn:hover { border-color: #60a5fa; color: #60a5fa; }
</style>
