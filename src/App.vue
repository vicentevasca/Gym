<script setup>
import { onMounted } from 'vue'
import { useAuthStore }    from '@/stores/auth.store'
import { useRankingStore } from '@/stores/ranking.store'
import { useTheme }        from '@/composables/useTheme'
import LevelUpModal        from '@/components/rewards/LevelUpModal.vue'
import ToastContainer      from '@/components/ui/ToastContainer.vue'

const auth    = useAuthStore()
const ranking = useRankingStore()
const { mode } = useTheme()

onMounted(async () => {
  await auth.init()
})
</script>

<template>
  <div
    class="app-container"
    :data-theme="auth.profile?.theme_color || 'lilac'"
    :data-mode="mode"
  >
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="$route.path" />
      </Transition>
    </RouterView>

    <!-- Modal global de nivel: se muestra desde cualquier vista -->
    <LevelUpModal v-if="ranking.justLeveledUp" @close="ranking.clearLevelUp()" />

    <!-- Toasts globales -->
    <ToastContainer />
  </div>
</template>
