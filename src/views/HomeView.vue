<script setup>
import { ref, onMounted } from 'vue'
import AppHeader from '@/components/ui/AppHeader.vue'
import BottomNav from '@/components/ui/BottomNav.vue'
import { useAuthStore } from '@/stores/auth.store'
import { staggerIn, fadeIn } from '@/composables/useAnimations'

const auth    = useAuthStore()
const content = ref(null)
const cards   = ref([])

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

onMounted(() => {
  fadeIn(content.value, { y: 0, duration: 0.4 })
  staggerIn(cards.value, { delay: 0.15, y: 20 })
})
</script>

<template>
  <div>
    <AppHeader />

    <main class="page-content">
      <div ref="content">

        <!-- Saludo -->
        <div class="welcome-section">
          <p class="welcome-greeting label-caps">{{ greeting() }}</p>
          <h2 class="welcome-name display-lg">{{ auth.alias }}</h2>
        </div>

        <!-- Cards placeholder (Fase 2+) -->
        <div class="cards-grid">

          <div :ref="el => cards[0] = el" class="card session-card">
            <div class="card-label label-caps">Sesión de hoy</div>
            <div class="session-placeholder">
              <div class="session-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6.5 6.5h11M6.5 17.5h11M4 12h16M2 9.5h2M20 9.5h2M2 14.5h2M20 14.5h2"/></svg>
              </div>
              <p class="session-text">Tu rutina se genera en la Fase 2</p>
            </div>
          </div>

          <div class="metrics-row">
            <div :ref="el => cards[1] = el" class="card-sm metric-card">
              <p class="metric-label label-caps">Calorías</p>
              <p class="metric-value">—</p>
              <div class="metric-bar"><div class="metric-fill" style="width:0%" /></div>
            </div>
            <div :ref="el => cards[2] = el" class="card-sm metric-card">
              <p class="metric-label label-caps">Agua</p>
              <p class="metric-value">—</p>
              <div class="metric-bar"><div class="metric-fill" style="width:0%" /></div>
            </div>
            <div :ref="el => cards[3] = el" class="card-sm metric-card">
              <p class="metric-label label-caps">Puntos</p>
              <p class="metric-value accent">0</p>
            </div>
          </div>

          <div :ref="el => cards[4] = el" class="card coming-card">
            <div class="coming-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
            </div>
            <div>
              <p class="coming-title">Dashboard completo</p>
              <p class="coming-sub">Verso del día, sesión activa, métricas en tiempo real y más — llegando en las próximas fases.</p>
            </div>
          </div>

        </div>
      </div>
    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.welcome-section { margin-bottom: var(--space-6); }
.welcome-greeting { margin-bottom: var(--space-1); }
.welcome-name { color: var(--text); }

.cards-grid { display: flex; flex-direction: column; gap: var(--space-3); }

/* Sesión card */
.session-card { padding: var(--space-5); }
.card-label { margin-bottom: var(--space-3); color: var(--accent); }
.session-placeholder {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--faint-2);
  border-radius: var(--radius-sm);
  border: 1px dashed var(--border-hi);
}
.session-icon { color: var(--muted); flex-shrink: 0; }
.session-text { color: var(--muted); font-size: var(--text-sm); line-height: 1.5; }

/* Métricas */
.metrics-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-3);
}
.metric-card { display: flex; flex-direction: column; gap: var(--space-1); }
.metric-label { font-size: 10px; }
.metric-value {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text);
  line-height: 1;
}
.metric-value.accent { color: var(--accent); }
.metric-bar {
  height: 3px;
  background: var(--faint);
  border-radius: 2px;
  margin-top: var(--space-1);
  overflow: hidden;
}
.metric-fill {
  height: 100%;
  background: var(--gradient-accent);
  border-radius: 2px;
  transition: width 0.5s ease;
}

/* Coming soon */
.coming-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  background: var(--accent-dim);
  border-color: var(--border-hi);
}
.coming-icon {
  width: 36px; height: 36px;
  background: var(--accent-glow);
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
}
.coming-title { font-size: var(--text-sm); font-weight: 600; color: var(--text); margin-bottom: 3px; }
.coming-sub { font-size: var(--text-sm); color: var(--muted); line-height: 1.5; }
</style>
