<script setup>
import AppHeader from '@/components/ui/AppHeader.vue'
import BottomNav from '@/components/ui/BottomNav.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'

const auth   = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await auth.signOut()
  router.push('/login')
}
</script>

<template>
  <div>
    <AppHeader title="PERFIL" />
    <main class="page-content px-4">

      <!-- Info usuario -->
      <div class="profile-hero card">
        <div class="profile-avatar">
          {{ auth.alias?.charAt(0)?.toUpperCase() || 'D' }}
        </div>
        <div>
          <p class="profile-alias">{{ auth.alias }}</p>
          <p class="profile-email">{{ auth.user?.email }}</p>
        </div>
      </div>

      <!-- Placeholder secciones -->
      <div class="card coming-soon" style="margin-top: 12px;">
        <p class="cs-label">Perfil musical, badges, Spotify</p>
        <p class="cs-body">Próximamente en Fase 7.</p>
      </div>

      <!-- Logout -->
      <button class="btn btn-danger btn-full" style="margin-top: 16px;" @click="handleLogout">
        Cerrar sesión
      </button>

    </main>
    <BottomNav />
  </div>
</template>

<style scoped>
.px-4 { padding-left: 16px; padding-right: 16px; }
.profile-hero { display: flex; align-items: center; gap: 14px; }
.profile-avatar {
  width: 52px; height: 52px;
  border-radius: 50%;
  background: var(--accent-dim);
  border: 1px solid var(--accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 700; color: var(--accent);
  flex-shrink: 0;
}
.profile-alias { font-size: 17px; font-weight: 600; }
.profile-email { color: var(--muted); font-size: 13px; margin-top: 2px; }
.cs-label { font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--accent); font-weight: 600; }
.cs-body { color: var(--muted); font-size: 14px; line-height: 1.6; margin-top: 6px; }
</style>
