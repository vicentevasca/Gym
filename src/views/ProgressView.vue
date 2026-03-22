<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db }               from '@/firebase/config'
import { useAuthStore }     from '@/stores/auth.store'
import { usePointsStore }   from '@/stores/points.store'
import { staggerIn }        from '@/composables/useAnimations'
import AppHeader            from '@/components/ui/AppHeader.vue'
import BottomNav            from '@/components/ui/BottomNav.vue'
import ProgressChart        from '@/components/progress/ProgressChart.vue'
import DailyClose           from '@/components/progress/DailyClose.vue'
import VerseLibrary         from '@/components/verse/VerseLibrary.vue'

const auth   = useAuthStore()
const points = usePointsStore()

const activeTab   = ref('progress')
const volumeData  = ref([])
const weightData  = ref([])
const loading     = ref(true)

const tabs = [
  { id: 'progress', label: 'Progreso' },
  { id: 'close',    label: 'Cierre' },
  { id: 'versos',   label: 'Versos' },
]

onMounted(async () => {
  await Promise.all([
    loadVolumeHistory(),
    points.subscribe(),
  ])
  loading.value = false
  staggerIn('.prog-section', { delay: 0.15 })
})

async function loadVolumeHistory() {
  if (!auth.uid) return
  const q    = query(collection(db, 'users', auth.uid, 'sessions'), orderBy('created_at', 'desc'), limit(14))
  const snap = await getDocs(q)
  const raw  = snap.docs.map(d => ({ date: d.id, value: d.data().total_volume ?? 0 })).reverse()
  volumeData.value = raw.filter(d => d.value > 0)
}
</script>

<template>
  <div>
    <AppHeader title="PROGRESO" />
    <main class="page-content page-pad">

      <!-- Tab bar -->
      <div class="tab-bar">
        <button
          v-for="t in tabs"
          :key="t.id"
          class="tab-btn"
          :class="{ active: activeTab === t.id }"
          @click="activeTab = t.id"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- Progress tab -->
      <div v-if="activeTab === 'progress'">
        <div v-if="loading" class="loading-state">
          <div class="spinner" /> <p>Cargando…</p>
        </div>
        <template v-else>
          <!-- Points summary -->
          <section class="card prog-section points-card">
            <div class="points-row">
              <div class="points-info">
                <p class="label-caps points-label">Balance de puntos</p>
                <p class="points-val">{{ points.balance }}</p>
              </div>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="var(--accent)"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
            </div>

            <!-- Recent transactions -->
            <div v-if="points.log?.length" class="tx-list">
              <div v-for="tx in points.log.slice(0, 5)" :key="tx.id" class="tx-row">
                <span class="tx-reason">{{ tx.reason }}</span>
                <span class="tx-amount" :class="tx.amount > 0 ? 'pos' : 'neg'">
                  {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount }}
                </span>
              </div>
            </div>
          </section>

          <!-- Volume chart -->
          <section class="card prog-section">
            <ProgressChart
              :data="volumeData"
              label="Volumen semanal"
              unit=" kg"
              color="var(--accent)"
            />
          </section>

          <!-- Weight chart -->
          <section class="card prog-section" v-if="weightData.length">
            <ProgressChart
              :data="weightData"
              label="Peso corporal"
              unit=" kg"
              color="var(--success)"
            />
          </section>

          <p v-if="!volumeData.length && !weightData.length" class="empty-charts">
            Completa sesiones de entrenamiento para ver tus gráficas de progreso.
          </p>
        </template>
      </div>

      <!-- Daily close tab -->
      <div v-else-if="activeTab === 'close'">
        <DailyClose class="prog-section" @done="activeTab = 'progress'" />
      </div>

      <!-- Verse library tab -->
      <div v-else-if="activeTab === 'versos'">
        <VerseLibrary />
      </div>

    </main>
    <BottomNav />
  </div>
</template>

<style scoped>
.page-pad { padding: var(--space-5) var(--space-4) var(--space-12); }

.tab-bar {
  display: flex; gap: var(--space-2);
  background: var(--surface); border-radius: var(--radius-lg);
  padding: var(--space-1); margin-bottom: var(--space-5);
}
.tab-btn {
  flex: 1; padding: var(--space-2) var(--space-3);
  border-radius: var(--radius); border: none;
  background: transparent; color: var(--muted);
  font-size: var(--text-sm); font-weight: 600;
  cursor: pointer; transition: var(--transition);
}
.tab-btn.active { background: var(--card); color: var(--text); box-shadow: var(--shadow-sm); }

.loading-state {
  display: flex; align-items: center; justify-content: center;
  min-height: 40vh; gap: var(--space-4); color: var(--muted);
}

.prog-section { margin-bottom: var(--space-4); }

.points-card { padding: var(--space-5); }
.points-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
.points-label { color: var(--muted); margin-bottom: var(--space-1); }
.points-val { font-size: var(--text-3xl); font-weight: 800; font-family: var(--font-mono); color: var(--accent); }

.tx-list { display: flex; flex-direction: column; gap: var(--space-2); }
.tx-row { display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) 0; border-top: 1px solid var(--faint); }
.tx-reason { font-size: var(--text-sm); color: var(--muted); }
.tx-amount { font-size: var(--text-sm); font-weight: 700; font-family: var(--font-mono); }
.tx-amount.pos { color: var(--success); }
.tx-amount.neg { color: var(--danger); }

.empty-charts { text-align: center; color: var(--muted); font-size: var(--text-sm); line-height: 1.7; padding: var(--space-8) 0; }
</style>
