<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useTheme } from '@/composables/useTheme'

const auth  = useAuthStore()
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
  </div>
</template>
