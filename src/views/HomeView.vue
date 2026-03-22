<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter }         from 'vue-router'
import AppHeader             from '@/components/ui/AppHeader.vue'
import BottomNav             from '@/components/ui/BottomNav.vue'
import VerseScreen           from '@/components/verse/VerseScreen.vue'
import { useAuthStore }      from '@/stores/auth.store'
import { useTrainingStore }  from '@/stores/training.store'
import { useNutritionStore } from '@/stores/nutrition.store'
import { usePointsStore }    from '@/stores/points.store'
import { useVerseStore }     from '@/stores/verse.store'
import { staggerIn, fadeIn } from '@/composables/useAnimations'

const auth      = useAuthStore()
const training  = useTrainingStore()
const nutrition = useNutritionStore()
const points    = usePointsStore()
const verse     = useVerseStore()
const router    = useRouter()

const content     = ref(null)
const showVerse   = ref(false)

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

onMounted(async () => {
  fadeIn(content.value, { y: 0, duration: 0.4 })
  await Promise.all([
    training.loadTodaySession(),
    nutrition.loadDayLog(),
    verse.loadTodayVerse(),
    points.subscribe(),
  ])
  staggerIn('.home-card', { delay: 0.2, y: 20 })
  // Show verse if not shown today
  if (!verse.shown && verse.verse) {
    setTimeout(() => { showVerse.value = true }, 600)
  }
})

const session  = computed(() => training.todaySession)
const consumed = computed(() => nutrition.consumed)
const kcalPct  = computed(() => {
  const target = auth.profile?.nutrition_plan?.kcal ?? 2000
  return Math.min(Math.round((consumed.value.kcal / target) * 100), 100)
})
const waterPct = computed(() => Math.min(Math.round(((nutrition.dayLog?.water_ml ?? 0) / 2500) * 100), 100))

const sessionProgress = computed(() => {
  if (!session.value?.exercises?.length) return 0
  const total     = session.value.exercises.reduce((a, e) => a + e.sets.length, 0)
  const completed = session.value.exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0)
  return total ? Math.round((completed / total) * 100) : 0
})
</script>

<template>
  <div>
    <AppHeader />

    <main class="page-content page-pad">
      <div ref="content">

        <!-- Greeting -->
        <div class="welcome-section">
          <p class="welcome-greeting label-caps">{{ greeting() }}</p>
          <h2 class="welcome-name display-lg">{{ auth.alias }}</h2>
        </div>

        <div class="cards-grid">

          <!-- Session card -->
          <div class="card session-card home-card" @click="router.push('/training')">
            <div class="session-top">
              <p class="card-label label-caps">Sesión de hoy</p>
              <span v-if="session" class="progress-badge">{{ sessionProgress }}%</span>
            </div>
            <div v-if="session" class="session-info">
              <p class="session-name">{{ session.name }}</p>
              <p class="session-exercises">{{ session.exercises?.length }} ejercicios</p>
              <div class="session-bar">
                <div class="session-fill" :style="{ width: sessionProgress + '%' }" />
              </div>
            </div>
            <div v-else class="session-empty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6.5 6.5h11M6.5 17.5h11M4 12h16M2 9.5h2M20 9.5h2M2 14.5h2M20 14.5h2"/></svg>
              <p>¡Día de descanso! 🎉</p>
            </div>
          </div>

          <!-- Metrics row -->
          <div class="metrics-row">
            <div class="card-sm metric-card home-card" @click="router.push('/nutrition')">
              <p class="metric-label label-caps">Kcal</p>
              <p class="metric-value">{{ consumed.kcal }}</p>
              <div class="metric-bar"><div class="metric-fill" :style="{ width: kcalPct + '%' }" /></div>
            </div>
            <div class="card-sm metric-card home-card" @click="router.push('/nutrition')">
              <p class="metric-label label-caps">Agua</p>
              <p class="metric-value">{{ Math.round((nutrition.dayLog?.water_ml ?? 0) / 100) / 10 }}L</p>
              <div class="metric-bar"><div class="metric-fill water" :style="{ width: waterPct + '%' }" /></div>
            </div>
            <div class="card-sm metric-card home-card">
              <p class="metric-label label-caps">Puntos</p>
              <p class="metric-value accent">{{ points.balance }}</p>
            </div>
          </div>

          <!-- Verse card -->
          <div v-if="verse.verse" class="card verse-card home-card" @click="showVerse = true">
            <div class="verse-top">
              <p class="card-label label-caps">Verso del día</p>
              <svg v-if="verse.verse?.saved" width="14" height="14" viewBox="0 0 24 24" fill="var(--success)" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <p class="verse-preview">{{ verse.verse?.verse_text?.split('\n')[0] }}</p>
            <p class="verse-tap label-caps">Toca para leer</p>
          </div>

        </div>
      </div>
    </main>

    <BottomNav />

    <!-- Verse modal -->
    <VerseScreen v-if="showVerse" @close="showVerse = false" />
  </div>
</template>

<style scoped>
.page-pad { padding: var(--space-5) var(--space-4) var(--space-12); }

.welcome-section { margin-bottom: var(--space-6); }
.welcome-greeting { margin-bottom: var(--space-1); }
.welcome-name { color: var(--text); }

.cards-grid { display: flex; flex-direction: column; gap: var(--space-3); }

/* Session card */
.session-card { padding: var(--space-5); cursor: pointer; transition: var(--transition); }
.session-card:hover { border-color: var(--accent); }
.session-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
.card-label { color: var(--accent); }
.progress-badge {
  background: var(--accent-dim); color: var(--accent);
  border-radius: var(--radius-full); padding: 2px 10px;
  font-size: var(--text-xs); font-weight: 700; font-family: var(--font-mono);
}
.session-name  { font-size: var(--text-base); font-weight: 700; margin-bottom: 2px; }
.session-exercises { font-size: var(--text-xs); color: var(--muted); margin-bottom: var(--space-3); }
.session-bar { height: 4px; background: var(--faint); border-radius: 2px; overflow: hidden; }
.session-fill { height: 100%; background: var(--gradient-accent); border-radius: 2px; transition: width 0.5s ease; }
.session-empty { display: flex; align-items: center; gap: var(--space-3); color: var(--muted); font-size: var(--text-sm); }

/* Metrics */
.metrics-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-3); }
.metric-card { display: flex; flex-direction: column; gap: var(--space-1); cursor: pointer; transition: var(--transition); }
.metric-card:hover { border-color: var(--accent); }
.metric-label { font-size: 10px; }
.metric-value { font-size: var(--text-lg); font-weight: 700; color: var(--text); line-height: 1; }
.metric-value.accent { color: var(--accent); }
.metric-bar { height: 3px; background: var(--faint); border-radius: 2px; margin-top: var(--space-1); overflow: hidden; }
.metric-fill { height: 100%; background: var(--gradient-accent); border-radius: 2px; transition: width 0.5s ease; }
.metric-fill.water { background: linear-gradient(90deg, #60a5fa, #38bdf8); }

/* Verse card */
.verse-card { padding: var(--space-5); cursor: pointer; transition: var(--transition); }
.verse-card:hover { border-color: var(--accent); }
.verse-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
.verse-preview { font-size: var(--text-base); font-family: var(--font-display); line-height: 1.6; color: var(--text); margin-bottom: var(--space-3); }
.verse-tap { color: var(--muted); font-size: 10px; }
</style>
