<script setup>
import { onMounted }       from 'vue'
import { gsap }            from 'gsap'
import { useAuthStore }    from '@/stores/auth.store'
import { useRankingStore } from '@/stores/ranking.store'
import { useTheme }        from '@/composables/useTheme'
import { useNotifications } from '@/composables/useNotifications'
import LevelUpModal        from '@/components/rewards/LevelUpModal.vue'
import ToastContainer      from '@/components/ui/ToastContainer.vue'

const auth    = useAuthStore()
const ranking = useRankingStore()
const { mode } = useTheme()
const notif   = useNotifications()

onMounted(async () => {
  await auth.init()
  if (auth.isLoggedIn) {
    await ranking.load()
    // Small delay so training store loads first
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
