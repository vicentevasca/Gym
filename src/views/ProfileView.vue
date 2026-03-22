<script setup>
import { ref, onMounted } from 'vue'
import AppHeader           from '@/components/ui/AppHeader.vue'
import BottomNav           from '@/components/ui/BottomNav.vue'
import { useAuthStore }    from '@/stores/auth.store'
import { useProfileStore } from '@/stores/profile.store'
import { useRouter }       from 'vue-router'
import { staggerIn }       from '@/composables/useAnimations'

const auth    = useAuthStore()
const profile = useProfileStore()
const router  = useRouter()
const rows    = ref([])

const themes = [
  { id: 'lilac', label: 'Lila',  color: '#c4b5fd' },
  { id: 'cyan',  label: 'Cian',  color: '#67e8f9' },
  { id: 'amber', label: 'Ámbar', color: '#fbbf24' },
  { id: 'coral', label: 'Coral', color: '#fb7185' },
  { id: 'green', label: 'Verde', color: '#4ade80' },
]

onMounted(() => {
  staggerIn(rows.value, { delay: 0.1, y: 14 })
  profile.initTheme()
})

async function selectTheme(themeId) {
  await profile.saveThemeColor(themeId)
}

async function handleLogout() {
  await auth.signOut()
  router.push('/login')
}
</script>

<template>
  <div>
    <AppHeader title="Perfil" />

    <main class="page-content">

      <!-- Hero del perfil -->
      <div :ref="el => rows[0] = el" class="profile-hero">
        <div class="profile-avatar-lg">
          {{ auth.alias?.charAt(0)?.toUpperCase() || 'D' }}
        </div>
        <div class="profile-info">
          <h2 class="profile-name">{{ auth.alias }}</h2>
          <p class="profile-email">{{ auth.user?.email }}</p>
        </div>
      </div>

      <!-- Temas de color -->
      <div :ref="el => rows[1] = el" class="card section-card">
        <p class="section-title label-caps">Tema de color</p>
        <div class="themes-row">
          <button
            v-for="t in themes"
            :key="t.id"
            class="theme-dot"
            :class="{ active: (auth.profile?.theme_color || 'lilac') === t.id }"
            :style="{ '--dot-color': t.color }"
            :title="t.label"
            @click="selectTheme(t.id)"
          />
        </div>
      </div>

      <!-- Secciones coming -->
      <div :ref="el => rows[2] = el" class="card section-card coming-card">
        <div class="coming-icon-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg>
        </div>
        <div>
          <p class="coming-title">Perfil musical, Spotify y badges</p>
          <p class="coming-sub">Disponible en la Fase 7.</p>
        </div>
      </div>

      <!-- Logout -->
      <div :ref="el => rows[3] = el">
        <button class="btn btn-danger btn-full" @click="handleLogout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Cerrar sesión
        </button>
      </div>

    </main>
    <BottomNav />
  </div>
</template>

<style scoped>
.profile-hero {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  padding: var(--space-5);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.profile-avatar-lg {
  width: 60px; height: 60px;
  border-radius: var(--radius);
  background: var(--gradient-accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 700; color: #fff;
  box-shadow: var(--shadow-accent);
  flex-shrink: 0;
}
.profile-name { font-size: var(--text-lg); font-weight: 700; }
.profile-email { color: var(--muted); font-size: var(--text-sm); margin-top: 2px; }

.section-card { margin-bottom: var(--space-3); }
.section-title { margin-bottom: var(--space-4); }

.themes-row {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.theme-dot {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: var(--dot-color);
  border: 2px solid transparent;
  transition: var(--transition);
  position: relative;
}
.theme-dot.active {
  border-color: var(--text);
  box-shadow: 0 0 0 3px var(--bg), 0 0 0 5px var(--dot-color);
}

.coming-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  background: var(--faint-2);
  border-color: var(--border);
  margin-bottom: var(--space-5);
}
.coming-icon-sm {
  width: 30px; height: 30px;
  background: var(--accent-dim);
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
}
.coming-title { font-size: var(--text-sm); font-weight: 600; color: var(--text); margin-bottom: 2px; }
.coming-sub { font-size: var(--text-sm); color: var(--muted); }
</style>
