<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'

const auth   = useAuthStore()
const router = useRouter()

// Inicializar auth una sola vez — el router guard ya maneja las redirecciones
onMounted(async () => {
  await auth.init()
})
</script>

<template>
  <div :data-theme="auth.profile?.theme_color || 'lilac'" class="app-container">
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </div>
</template>
