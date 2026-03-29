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
import { useRankingStore }   from '@/stores/ranking.store'
import { useMoodStore }      from '@/stores/mood.store'
import { useGendered }       from '@/composables/useGendered'
import { staggerIn, fadeIn } from '@/composables/useAnimations'
import MoodCheckin           from '@/components/home/MoodCheckin.vue'
import MoodResponseModal     from '@/components/home/MoodResponseModal.vue'
import ReflectionCard        from '@/components/home/ReflectionCard.vue'
import ConceptCard           from '@/components/home/ConceptCard.vue'
import ReadingCard           from '@/components/home/ReadingCard.vue'

const auth      = useAuthStore()
const training  = useTrainingStore()
const nutrition = useNutritionStore()
const points    = usePointsStore()
const verse     = useVerseStore()
const ranking   = useRankingStore()
const mood      = useMoodStore()
const router    = useRouter()
const { greeting, g } = useGendered()

const content          = ref(null)
const showVerse        = ref(false)
const showMoodModal    = ref(false)
const lastMoodChecked  = ref(null)

onMounted(async () => {
  fadeIn(content.value, { y: 0, duration: 0.4 })
  await Promise.all([
    training.loadTodaySession(),
    nutrition.loadDayLog(),
    verse.loadTodayVerse(),
    points.subscribe(),
    ranking.load(),
    mood.loadTodayMood(),
  ])
  staggerIn('.home-card', { delay: 0.2, y: 20 })
  // Show verse if not shown today
  if (!verse.shown && verse.verse) {
    setTimeout(() => { showVerse.value = true }, 600)
  }
})

function onMoodChecked(level) {
  lastMoodChecked.value = level
  showMoodModal.value   = true
}

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
          <div class="welcome-top">
            <p class="welcome-greeting label-caps">{{ greeting }}</p>
            <div v-if="ranking.streak > 0" class="streak-badge" @click="router.push('/rewards')">
              <span class="streak-fire">🔥</span>
              <span class="streak-num num-sm">{{ ranking.streak }}</span>
            </div>
          </div>
          <h2 class="welcome-name display-lg">{{ auth.alias }}</h2>
          <div class="welcome-rank-row" @click="router.push('/rewards')">
            <span class="rank-dot" :style="{ background: ranking.currentLevel.color }" />
            <span class="rank-name-sm" :style="{ color: ranking.currentLevel.color }">
              {{ ranking.currentLevel.emoji }} {{ ranking.currentLevel.name }}
            </span>
            <span class="rank-xp num-sm">{{ ranking.xp }} XP</span>
          </div>
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
            <!-- Sin rutina configurada -->
            <div v-else-if="!training.routine" class="session-empty setup" @click.stop="router.push('/training/setup')">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 9 15a1.65 1.65 0 0 0-.33-1.82"/></svg>
              <div>
                <p class="setup-msg">Configura tu rutina</p>
                <p class="setup-sub">Toca para generar tu plan personalizado</p>
              </div>
            </div>
            <!-- Día de descanso -->
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

        <!-- ── NUEVO: Check-in emocional ── -->
        <section class="home-section">
          <p class="section-label label-caps">¿Cómo te sientes?</p>
          <MoodCheckin @checked="onMoodChecked" />
        </section>

        <!-- ── NUEVO: Reflexión del día ── -->
        <section class="home-section">
          <ReflectionCard />
        </section>

        <!-- ── NUEVO: Concepto del día ── -->
        <section class="home-section">
          <ConceptCard />
        </section>

        <!-- ── NUEVO: Lectura recomendada ── -->
        <section class="home-section">
          <ReadingCard />
        </section>

      </div>
    </main>

    <BottomNav />

    <!-- Verse modal -->
    <VerseScreen v-if="showVerse" @close="showVerse = false" />

    <!-- Mood response modal -->
    <MoodResponseModal
      v-if="showMoodModal"
      :mood="lastMoodChecked"
      :user-name="auth.alias"
      :streak="ranking.streak"
      @close="showMoodModal = false"
    />
  </div>
</template>

<style scoped>
.page-pad { padding-left: var(--space-4); padding-right: var(--space-4); }

.welcome-section { margin-bottom: var(--space-6); }
.welcome-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-1);
}
.welcome-greeting { }
.welcome-name { color: var(--text); line-height: var(--leading-tight); margin-bottom: var(--space-2); }

.streak-badge {
  display: flex;
  align-items: center;
  gap: 3px;
  background: var(--faint);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  padding: 3px 10px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.streak-badge:hover { border-color: var(--accent); }
.streak-fire { font-size: 14px; }
.streak-num  { font-size: var(--text-xs); color: var(--text); }

.welcome-rank-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}
.rank-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.rank-name-sm {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: 700;
}
.rank-xp {
  font-size: var(--text-xs);
  color: var(--muted);
  margin-left: auto;
}

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
.session-empty.setup { color: var(--accent); cursor: pointer; }
.session-empty.setup:hover { opacity: 0.8; }
.setup-msg { font-size: var(--text-sm); font-weight: 700; color: var(--accent); }
.setup-sub { font-size: var(--text-xs); color: var(--muted); margin-top: 2px; }

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

/* Nuevas secciones */
.home-section { margin-top: var(--space-5); }
.section-label { margin-bottom: var(--space-3); }
</style>
