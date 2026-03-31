<script setup>
import { onMounted, watch }   from 'vue'
import { gsap }               from 'gsap'
import { useAuthStore }       from '@/stores/auth.store'
import { useRankingStore }    from '@/stores/ranking.store'
import { usePointsStore }     from '@/stores/points.store'
import { useTrainingStore }   from '@/stores/training.store'
import { useMoodStore }       from '@/stores/mood.store'
import { useNutritionStore }  from '@/stores/nutrition.store'
import { useVerseStore }      from '@/stores/verse.store'
import { useRewardsStore }    from '@/stores/rewards.store'
import { useTheme }           from '@/composables/useTheme'
import { useNotifications }   from '@/composables/useNotifications'
import LevelUpModal           from '@/components/rewards/LevelUpModal.vue'
import ToastContainer         from '@/components/ui/ToastContainer.vue'

const auth      = useAuthStore()
const ranking   = useRankingStore()
const points    = usePointsStore()
const training  = useTrainingStore()
const mood      = useMoodStore()
const nutrition = useNutritionStore()
const verse     = useVerseStore()
const rewards   = useRewardsStore()
const { mode }  = useTheme()
const notif     = useNotifications()

onMounted(() => {
  auth.init()
})

// ── Aislamiento de datos por usuario ─────────────────────────────────────
// Cada vez que el UID cambia: limpia todos los stores del usuario anterior
// y carga los datos del nuevo usuario. Esto garantiza que ningún dato
// se filtre entre sesiones de distintos usuarios.
watch(() => auth.uid, async (newUid, oldUid) => {
  if (oldUid && oldUid !== newUid) {
    // Usuario anterior cerró sesión o cambió — limpiar TODO
    training.clearState()
    ranking.clearState()
    points.clearState()
    mood.clearState()
    nutrition.clearState()
    verse.clearState()
    rewards.clearState()
  }

  if (newUid) {
    // Nuevo usuario autenticado — cargar sus datos base
    await ranking.load()
    await points.initBalance()
    setTimeout(() => notif.checkDailyReminder(), 3000)
  }
})

// ── Transiciones de vista con GSAP ────────────────────────────
function onBeforeEnter(el) {
  gsap.set(el, { opacity: 0, y: 14 })
}
function onEnter(el, done) {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.26,
    ease: 'power2.out',
    clearProps: 'all',
    onComplete: done,
  })
}
function onLeave(el, done) {
  gsap.to(el, {
    opacity: 0,
    y: -10,
    duration: 0.16,
    ease: 'power2.in',
    onComplete: done,
  })
}
</script>

<template>
  <div
    class="app-container"
    :data-theme="auth.profile?.theme_color || 'lilac'"
    :data-mode="mode"
  >
    <RouterView v-slot="{ Component }">
      <Transition
        :css="false"
        mode="out-in"
        @before-enter="onBeforeEnter"
        @enter="onEnter"
        @leave="onLeave"
      >
        <component :is="Component" :key="$route.path" />
      </Transition>
    </RouterView>

    <LevelUpModal v-if="ranking.justLeveledUp" @close="ranking.clearLevelUp()" />
    <ToastContainer />
  </div>
</template>
