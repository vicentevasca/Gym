<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { gsap }                from 'gsap'
import { useRewardsStore }     from '@/stores/rewards.store'
import { usePointsStore }      from '@/stores/points.store'
import { useRankingStore }     from '@/stores/ranking.store'
import { useGendered }         from '@/composables/useGendered'
import { staggerIn }           from '@/composables/useAnimations'
import AppHeader               from '@/components/ui/AppHeader.vue'
import BottomNav               from '@/components/ui/BottomNav.vue'
import RewardsQuestionnaire    from '@/components/rewards/RewardsQuestionnaire.vue'
import RewardCard              from '@/components/rewards/RewardCard.vue'
import RankCard                from '@/components/rewards/RankCard.vue'

const rewards = useRewardsStore()
const points  = usePointsStore()
const ranking = useRankingStore()
const { g }   = useGendered()

const tab = ref('rangos')   // 'rangos' | 'retos' | 'puntos'

onMounted(async () => {
  await Promise.all([
    rewards.loadRewardsProfile(),
    points.subscribe(),
    ranking.load(),
  ])
  if (tab.value === 'retos' && rewards.questionnaireCompleted) {
    staggerIn('.category-section', { delay: 0.15 })
  }
})

watch(tab, (val) => {
  if (val === 'retos' && rewards.questionnaireCompleted) {
    setTimeout(() => staggerIn('.category-section', { delay: 0.1 }), 50)
  }
})

async function onQuestComplete() {
  tab.value = 'retos'
  setTimeout(() => staggerIn('.category-section', { delay: 0.2 }), 100)
}

async function handleStart(reward) {
  await rewards.startChallenge(reward.id)
  navigator.vibrate?.(40)
}

async function handleComplete(challenge) {
  await rewards.completeChallenge(challenge.docId, points)
  navigator.vibrate?.([50, 30, 80])
  gsap.from('.category-section', { opacity: 0.5, duration: 0.4 })
}

const groups         = computed(() => rewards.rewardsByCategory)
const activeCount    = computed(() => rewards.activeRewards?.length ?? 0)
const completedCount = computed(() => rewards.completedRewards?.length ?? 0)

// Points log preview (last 8 entries)
const logPreview = computed(() => points.log.slice(0, 8))

function reasonLabel(r) {
  const map = {
    set_complete:      'Serie completada',
    exercise_complete: 'Ejercicio completo',
    session_complete:  'Sesión terminada',
    session_full_bonus:'¡Multiplicador ×1.5!',
    nutrition_logged:  'Nutrición registrada',
    water_goal:        'Meta de agua',
    daily_close:       'Cierre del día',
    new_record:        'Récord personal 🎉',
    streak_7:          'Racha de 7 días',
    streak_30:         'Racha de 30 días',
    challenge_complete:'Reto completado',
    días_sin_entrenar: 'Decaimiento (inactividad)',
  }
  return map[r] || r
}
</script>

<template>
  <div>
    <AppHeader title="RETOS & RANGOS" />

    <main class="page-content page-pad">

      <!-- ── Tabs ── -->
      <div class="tabs-row">
        <button
          v-for="t in ['rangos','retos','puntos']"
          :key="t"
          class="tab-btn"
          :class="{ active: tab === t }"
          @click="tab = t"
        >{{ t === 'rangos' ? 'Rango' : t === 'retos' ? 'Retos' : 'Puntos' }}</button>
      </div>

      <!-- ══════════ RANGOS ══════════ -->
      <template v-if="tab === 'rangos'">

        <!-- Rank card -->
        <RankCard class="tab-section" />

        <!-- Personal bests -->
        <section class="card pb-card tab-section">
          <p class="card-label label-caps">Mejores marcas</p>
          <div class="pb-grid">
            <div class="pb-item">
              <p class="pb-val num-sm">{{ ranking.bests.best_streak ?? 0 }}</p>
              <p class="pb-label">Racha récord</p>
            </div>
            <div class="pb-item">
              <p class="pb-val num-sm">
                {{ ranking.bests.best_volume ? Math.round(ranking.bests.best_volume / 1000 * 10) / 10 + 't' : '—' }}
              </p>
              <p class="pb-label">Volumen récord</p>
            </div>
            <div class="pb-item">
              <p class="pb-val num-sm accent">{{ ranking.xp }}</p>
              <p class="pb-label">XP total</p>
            </div>
          </div>
        </section>

        <!-- Cómo ganar XP -->
        <section class="card xp-guide tab-section">
          <p class="card-label label-caps" style="margin-bottom: var(--space-3)">Cómo ganar XP</p>

          <p class="xp-group-label">Entrenamiento</p>
          <div class="xp-row-item">
            <span class="xp-icon">🏋️</span>
            <span class="xp-text">Por serie completada</span>
            <span class="xp-pts num-sm">+3 XP</span>
          </div>
          <div class="xp-row-item">
            <span class="xp-icon">✅</span>
            <span class="xp-text">Ejercicio completo</span>
            <span class="xp-pts num-sm">+10 XP</span>
          </div>
          <div class="xp-row-item">
            <span class="xp-icon">🎯</span>
            <span class="xp-text">Sesión terminada</span>
            <span class="xp-pts num-sm">+50 XP</span>
          </div>
          <div class="xp-row-item highlight">
            <span class="xp-icon">⚡</span>
            <span class="xp-text">¡Todos los ejercicios completos!</span>
            <span class="xp-pts num-sm accent">×1.5</span>
          </div>
          <div class="xp-row-item">
            <span class="xp-icon">🏆</span>
            <span class="xp-text">Nuevo récord personal (PR)</span>
            <span class="xp-pts num-sm">+50 XP</span>
          </div>

          <p class="xp-group-label" style="margin-top: var(--space-3)">Constancia</p>
          <div class="xp-row-item highlight">
            <span class="xp-icon">🔥</span>
            <span class="xp-text">Racha de 7 días seguidos</span>
            <span class="xp-pts num-sm accent">+150 pts</span>
          </div>
          <div class="xp-row-item highlight">
            <span class="xp-icon">🏅</span>
            <span class="xp-text">Racha de 30 días seguidos</span>
            <span class="xp-pts num-sm accent">+500 pts</span>
          </div>

          <p class="xp-group-label" style="margin-top: var(--space-3)">Hábitos</p>
          <div class="xp-row-item">
            <span class="xp-icon">🥗</span>
            <span class="xp-text">Nutrición registrada</span>
            <span class="xp-pts num-sm">+30 pts</span>
          </div>
          <div class="xp-row-item">
            <span class="xp-icon">💧</span>
            <span class="xp-text">Meta de agua alcanzada</span>
            <span class="xp-pts num-sm">+20 pts</span>
          </div>
          <div class="xp-row-item">
            <span class="xp-icon">🌙</span>
            <span class="xp-text">Cierre del día</span>
            <span class="xp-pts num-sm">+25 pts</span>
          </div>

          <div class="xp-row-item xp-decay" style="margin-top: var(--space-3)">
            <span class="xp-icon">📉</span>
            <span class="xp-text">Día sin entrenar (puntos)</span>
            <span class="xp-pts num-sm decay">−5 pts/día</span>
          </div>
          <p class="xp-note">El decaimiento afecta solo los puntos (canjeables). El XP de rango nunca decrece.</p>
        </section>

      </template>

      <!-- ══════════ RETOS ══════════ -->
      <template v-else-if="tab === 'retos'">

        <!-- Loading -->
        <div v-if="rewards.loading" class="loading-state">
          <div class="spinner" />
          <p>Cargando retos…</p>
        </div>

        <!-- Cuestionario primera vez -->
        <div v-else-if="!rewards.questionnaireCompleted">
          <div class="intro-card">
            <div class="intro-icon">🎯</div>
            <div class="intro-text">
              <h2 class="intro-title display-sm">Retos personalizados</h2>
              <p class="intro-body">
                {{ g(
                  'Responde unas preguntas breves para que tus retos reflejen tus hábitos reales.',
                  'Responde unas preguntas breves para que tus retos reflejen tus hábitos reales.',
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

        <!-- Retos generados -->
        <template v-else>
          <div class="challenges-stats">
            <div class="cstat">
              <span class="cstat-val num-sm">{{ activeCount }}</span>
              <span class="cstat-label">En curso</span>
            </div>
            <div class="cstat-div" />
            <div class="cstat">
              <span class="cstat-val num-sm accent">{{ completedCount }}</span>
              <span class="cstat-label">Completados</span>
            </div>
            <div class="cstat-div" />
            <div class="cstat">
              <span class="cstat-val num-sm">{{ points.balance }}</span>
              <span class="cstat-label">Puntos</span>
            </div>
          </div>

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

          <div class="reset-section">
            <p class="reset-hint">¿Cambiaron tus hábitos? Puedes repersonalizar tus retos.</p>
            <button class="btn btn-ghost reset-btn" @click="rewards.resetQuestionnaire()">
              Rehacer cuestionario
            </button>
          </div>
        </template>

      </template>

      <!-- ══════════ PUNTOS ══════════ -->
      <template v-else>

        <div class="balance-hero card tab-section">
          <p class="label-caps" style="margin-bottom:4px">Puntos disponibles</p>
          <p class="balance-big num-xl accent">{{ points.balance }}</p>
          <p class="balance-sub">Total ganado: <strong>{{ points.totalEarned }}</strong></p>
        </div>

        <section class="card log-card tab-section">
          <p class="card-label label-caps" style="margin-bottom: var(--space-3)">Historial reciente</p>
          <div v-if="logPreview.length === 0" class="log-empty">
            <p>Completa ejercicios para ver tu historial de puntos.</p>
          </div>
          <div v-else class="log-list">
            <div
              v-for="entry in logPreview"
              :key="entry.id"
              class="log-entry"
              :class="entry.type"
            >
              <div class="log-icon">
                {{ entry.type === 'earn' ? '▲' : entry.type === 'decay' ? '▼' : '↙' }}
              </div>
              <div class="log-detail">
                <p class="log-reason">{{ reasonLabel(entry.reason) }}</p>
                <p class="log-date">{{ entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleDateString('es', { day:'2-digit', month:'short' }) : '' }}</p>
              </div>
              <span class="log-amount num-sm" :class="entry.type === 'earn' ? 'earn' : 'lose'">
                {{ entry.type === 'earn' ? '+' : '' }}{{ entry.amount }}
              </span>
            </div>
          </div>
        </section>

      </template>

    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.page-pad { padding-left: var(--space-4); padding-right: var(--space-4); }

/* Tabs */
.tabs-row {
  display: flex;
  background: var(--faint);
  border-radius: var(--radius-lg);
  padding: 3px;
  margin-bottom: var(--space-5);
  gap: 2px;
  overflow: hidden;
}
.tab-btn {
  flex: 1;
  padding: var(--space-2) 0;
  border: none;
  background: transparent;
  border-radius: var(--radius);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s;
  text-transform: capitalize;
  letter-spacing: 0.02em;
}
.tab-btn.active {
  background: var(--card);
  color: var(--text);
  box-shadow: var(--shadow-sm);
}

.tab-section { margin-bottom: var(--space-4); }

/* Loading */
.loading-state {
  display: flex; flex-direction: column; align-items: center;
  min-height: 40vh; justify-content: center; gap: var(--space-4); color: var(--muted);
}

/* Intro */
.intro-card {
  display: flex; gap: var(--space-4); align-items: flex-start;
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-xl); padding: var(--space-6);
  margin-bottom: var(--space-5);
}
.intro-icon { font-size: 36px; flex-shrink: 0; }
.intro-text { display: flex; flex-direction: column; gap: var(--space-3); }
.intro-title { color: var(--text); }
.intro-body {
  font-family: var(--font-ui); font-size: var(--text-sm);
  line-height: var(--leading-relaxed); color: var(--muted);
}
.intro-privacy { display: flex; align-items: center; gap: 6px; font-size: var(--text-xs); color: var(--muted); }

/* Challenges stats */
.challenges-stats {
  display: flex; align-items: center; gap: var(--space-4);
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-xl); padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-5);
}
.cstat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.cstat-val { color: var(--text); }
.cstat-val.accent { color: var(--accent); }
.cstat-label { font-size: 10px; color: var(--muted); }
.cstat-div { width: 1px; height: 28px; background: var(--border); }

/* Categories */
.category-section { margin-bottom: var(--space-6); }
.category-header { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-3); }
.category-emoji { font-size: 18px; }
.category-title {
  font-family: var(--font-display); font-size: var(--text-lg); font-weight: 700;
  letter-spacing: var(--tracking-snug);
}
.rewards-list { display: flex; flex-direction: column; gap: var(--space-3); }

/* Reset */
.reset-section {
  margin-top: var(--space-4); padding: var(--space-6) 0;
  border-top: 1px solid var(--border);
  display: flex; flex-direction: column; align-items: center; gap: var(--space-3);
}
.reset-hint { font-size: var(--text-sm); color: var(--muted); text-align: center; }
.reset-btn  { font-size: var(--text-sm); }

/* Personal bests */
.pb-card { padding: var(--space-5); }
.pb-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-3); margin-top: var(--space-3); }
.pb-item { text-align: center; }
.pb-val  { color: var(--text); }
.pb-val.accent { color: var(--accent); }
.pb-label { font-size: 10px; color: var(--muted); margin-top: 2px; font-family: var(--font-ui); }

/* XP guide */
.xp-guide { padding: var(--space-5); }
.xp-group-label {
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  font-family: var(--font-ui);
  margin-bottom: var(--space-1);
}
.xp-row-item {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--faint);
}
.xp-row-item:last-of-type { border-bottom: none; }
.xp-row-item.highlight { background: var(--accent-dim); margin: 0 calc(-1 * var(--space-5)); padding: var(--space-2) var(--space-5); border-radius: 0; }
.xp-row-item.xp-decay   { opacity: 0.7; }
.xp-icon  { font-size: 16px; width: 22px; text-align: center; flex-shrink: 0; }
.xp-text  { flex: 1; font-size: var(--text-sm); color: var(--text); font-family: var(--font-ui); }
.xp-pts   { font-weight: 700; }
.xp-pts.accent { color: var(--accent); }
.xp-pts.decay  { color: var(--danger, #ef4444); }
.xp-note {
  font-size: var(--text-xs); color: var(--muted);
  margin-top: var(--space-3); line-height: var(--leading-relaxed);
  font-family: var(--font-ui);
}

/* Balance hero */
.balance-hero { padding: var(--space-6); text-align: center; }
.balance-big  { font-size: var(--text-4xl, 48px); line-height: 1; margin: var(--space-2) 0; }
.balance-sub  { font-size: var(--text-sm); color: var(--muted); font-family: var(--font-ui); }

/* Log */
.log-card { padding: var(--space-5); }
.log-empty { text-align: center; padding: var(--space-6) 0; color: var(--muted); font-size: var(--text-sm); }
.log-list  { display: flex; flex-direction: column; gap: 1px; }
.log-entry {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--faint);
}
.log-entry:last-child { border-bottom: none; }
.log-icon {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; flex-shrink: 0;
  background: var(--faint);
}
.log-entry.earn   .log-icon { background: color-mix(in srgb, var(--success) 20%, transparent); color: var(--success); }
.log-entry.decay  .log-icon { background: color-mix(in srgb, #ef4444 20%, transparent); color: #ef4444; }
.log-entry.redeem .log-icon { background: var(--accent-dim); color: var(--accent); }
.log-detail { flex: 1; min-width: 0; }
.log-reason { font-size: var(--text-sm); color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.log-date   { font-size: 10px; color: var(--muted); }
.log-amount { flex-shrink: 0; }
.log-amount.earn { color: var(--success); }
.log-amount.lose { color: #ef4444; }
</style>
