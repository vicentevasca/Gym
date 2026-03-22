<script setup>
import { onMounted, computed } from 'vue'
import { gsap }                from 'gsap'
import { useRewardsStore }     from '@/stores/rewards.store'
import { usePointsStore }      from '@/stores/points.store'
import { useGendered }         from '@/composables/useGendered'
import { staggerIn }           from '@/composables/useAnimations'
import AppHeader               from '@/components/ui/AppHeader.vue'
import BottomNav               from '@/components/ui/BottomNav.vue'
import RewardsQuestionnaire    from '@/components/rewards/RewardsQuestionnaire.vue'
import RewardCard              from '@/components/rewards/RewardCard.vue'

const rewards = useRewardsStore()
const points  = usePointsStore()
const { g }   = useGendered()

onMounted(async () => {
  await Promise.all([
    rewards.loadRewardsProfile(),
    points.subscribe(),
  ])
  if (rewards.questionnaireCompleted) {
    staggerIn('.category-section', { delay: 0.15 })
  }
})

async function onQuestComplete() {
  staggerIn('.category-section', { delay: 0.2 })
}

async function handleStart(reward) {
  await rewards.startChallenge(reward.id)
  // Pequeña vibración de confirmación
  navigator.vibrate?.(40)
}

async function handleComplete(challenge) {
  await rewards.completeChallenge(challenge.docId, points)
  navigator.vibrate?.([50, 30, 80])
  gsap.from('.category-section', { opacity: 0.5, duration: 0.4 })
}

async function handleReset() {
  await rewards.resetQuestionnaire()
}

const groups         = computed(() => rewards.rewardsByCategory)
const activeCount    = computed(() => rewards.activeRewards.length)
const completedCount = computed(() => rewards.completedRewards.length)
</script>

<template>
  <div>
    <AppHeader title="RECOMPENSAS" />

    <main class="page-content page-pad">

      <!-- ── Loading ── -->
      <div v-if="rewards.loading" class="loading-state">
        <div class="spinner" />
        <p>Cargando recompensas…</p>
      </div>

      <!-- ── Cuestionario: primera vez ── -->
      <div v-else-if="!rewards.questionnaireCompleted">
        <!-- Intro card -->
        <div class="intro-card">
          <div class="intro-icon">🎯</div>
          <div class="intro-text">
            <h2 class="intro-title display-sm">Recompensas personalizadas</h2>
            <p class="intro-body">
              {{ g(
                'Responde unas preguntas breves para que tus recompensas reflejen tus hábitos reales — no las de otra persona.',
                'Responde unas preguntas breves para que tus recompensas reflejen tus hábitos reales — no los de otra persona.',
              ) }}
            </p>
            <p class="intro-privacy">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Tus respuestas son privadas y solo las ves tú.
            </p>
          </div>
        </div>

        <RewardsQuestionnaire @complete="onQuestComplete" />
      </div>

      <!-- ── Recompensas generadas ── -->
      <template v-else>

        <!-- Balance + stats -->
        <section class="balance-section">
          <div class="balance-card card">
            <div class="balance-row">
              <div>
                <p class="label-caps balance-label">Tus puntos</p>
                <p class="balance-val num-lg">{{ points.balance }}</p>
              </div>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="var(--accent)" opacity="0.8"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
            </div>
            <div class="balance-stats">
              <div class="bstat">
                <span class="bstat-val num-sm">{{ activeCount }}</span>
                <span class="bstat-label">En curso</span>
              </div>
              <div class="bstat-divider" />
              <div class="bstat">
                <span class="bstat-val num-sm">{{ completedCount }}</span>
                <span class="bstat-label">Completados</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Explicación de cómo funciona -->
        <section class="how-it-works card category-section">
          <p class="hiw-title label-caps">Cómo funciona</p>
          <div class="hiw-steps">
            <div class="hiw-step">
              <span class="hiw-num">1</span>
              <p>Elige un reto de la lista. Cuanto más difícil sea para ti, más puntos vale.</p>
            </div>
            <div class="hiw-step">
              <span class="hiw-num">2</span>
              <p>Completa el reto y márcalo como logrado para ganar los puntos.</p>
            </div>
            <div class="hiw-step">
              <span class="hiw-num">3</span>
              <p>Los puntos se suman a tu balance y puedes usar para lo que quieras.</p>
            </div>
          </div>
        </section>

        <!-- Categorías de recompensas -->
        <section
          v-for="group in groups"
          :key="group.id"
          class="category-section"
        >
          <div class="category-header">
            <span class="category-emoji">{{ group.emoji }}</span>
            <h3 class="category-title" :style="{ color: group.color }">{{ group.label }}</h3>
          </div>

          <div class="rewards-list">
            <RewardCard
              v-for="reward in group.rewards"
              :key="reward.id"
              :reward="reward"
              @start="handleStart"
              @complete="handleComplete"
            />
          </div>
        </section>

        <!-- Footer: re-hacer cuestionario -->
        <div class="reset-section">
          <p class="reset-hint">¿Cambiaron tus hábitos? Puedes re-personalizar tus recompensas.</p>
          <button class="btn btn-ghost reset-btn" @click="handleReset">
            Rehacer cuestionario
          </button>
        </div>

      </template>
    </main>
    <BottomNav />
  </div>
</template>

<style scoped>
.page-pad { padding: var(--space-5) var(--space-4) var(--space-12); }

.loading-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 50vh; gap: var(--space-4); color: var(--muted);
}

/* Intro */
.intro-card {
  display: flex; gap: var(--space-4); align-items: flex-start;
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-xl); padding: var(--space-6);
  margin-bottom: var(--space-5);
}
.intro-icon { font-size: 40px; flex-shrink: 0; }
.intro-text { display: flex; flex-direction: column; gap: var(--space-3); }
.intro-title { color: var(--text); }
.intro-body {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--muted);
}
.intro-privacy {
  display: flex; align-items: center; gap: 6px;
  font-size: var(--text-xs); color: var(--muted);
}

/* Balance */
.balance-section { margin-bottom: var(--space-4); }
.balance-card { padding: var(--space-5); }
.balance-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
.balance-label { margin-bottom: var(--space-1); }
.balance-val { color: var(--accent); }
.balance-stats { display: flex; align-items: center; gap: var(--space-4); }
.bstat { display: flex; flex-direction: column; gap: 2px; }
.bstat-val { color: var(--text); }
.bstat-label { font-size: var(--text-xs); color: var(--muted); }
.bstat-divider { width: 1px; height: 32px; background: var(--border); }

/* How it works */
.how-it-works { margin-bottom: var(--space-4); padding: var(--space-5); }
.hiw-title { margin-bottom: var(--space-4); }
.hiw-steps { display: flex; flex-direction: column; gap: var(--space-3); }
.hiw-step { display: flex; align-items: flex-start; gap: var(--space-3); }
.hiw-num {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--accent-dim); color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-xs); font-weight: 800;
  flex-shrink: 0; margin-top: 1px;
}
.hiw-step p { font-size: var(--text-sm); color: var(--muted); line-height: var(--leading-relaxed); }

/* Categorías */
.category-section { margin-bottom: var(--space-6); }
.category-header {
  display: flex; align-items: center; gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.category-emoji { font-size: 20px; }
.category-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  letter-spacing: var(--tracking-snug);
}
.rewards-list { display: flex; flex-direction: column; gap: var(--space-3); }

/* Reset */
.reset-section {
  margin-top: var(--space-6);
  display: flex; flex-direction: column; align-items: center; gap: var(--space-3);
  padding: var(--space-6) 0;
  border-top: 1px solid var(--border);
}
.reset-hint { font-size: var(--text-sm); color: var(--muted); text-align: center; line-height: 1.6; }
.reset-btn { font-size: var(--text-sm); }
</style>
