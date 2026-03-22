<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const nav = [
  { to: '/',          label: 'Home',    icon: 'home'     },
  { to: '/training',  label: 'Gym',     icon: 'gym'      },
  { to: '/nutrition', label: 'Comida',  icon: 'food'     },
  { to: '/progress',  label: 'Progreso',icon: 'progress' },
]

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="bottom-nav">
    <RouterLink
      v-for="item in nav"
      :key="item.to"
      :to="item.to"
      class="nav-item"
      :class="{ active: isActive(item.to) }"
    >
      <!-- Home -->
      <svg v-if="item.icon === 'home'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9L12 2l9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
      <!-- Gym -->
      <svg v-if="item.icon === 'gym'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6.5 6.5h11M6.5 17.5h11M4 12h16M2 9.5h2M20 9.5h2M2 14.5h2M20 14.5h2"/>
      </svg>
      <!-- Food -->
      <svg v-if="item.icon === 'food'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a7 7 0 017 7c0 4-3 7-7 9-4-2-7-5-7-9a7 7 0 017-7z"/>
        <path d="M12 12v7M9 15h6"/>
      </svg>
      <!-- Progress -->
      <svg v-if="item.icon === 'progress'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
      <span class="nav-label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  max-width: 480px;
  margin: 0 auto;
  height: calc(var(--nav-height) + var(--safe-bottom));
  background: var(--surface);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: flex-start;
  padding-top: 6px;
  padding-bottom: var(--safe-bottom);
  z-index: 100;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 4px 0;
  color: var(--muted);
  text-decoration: none;
  transition: color 0.2s;
  min-height: 44px;
}

.nav-item.active { color: var(--accent); }

.nav-label {
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
