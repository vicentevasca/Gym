<script setup>
import { useRoute } from 'vue-router'
import { navItemTap } from '@/composables/useAnimations'
import { ref } from 'vue'

const route = useRoute()
const iconRefs = ref([])

const nav = [
  {
    to: '/',
    label: 'Inicio',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9L12 2l9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    iconFilled: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
  },
  {
    to: '/training',
    label: 'Gym',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6.5 6.5h11M6.5 17.5h11M4 12h16M2 9.5h2M20 9.5h2M2 14.5h2M20 14.5h2"/></svg>`,
    iconFilled: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6.5 6.5h11M6.5 17.5h11M4 12h16M2 9.5h2M20 9.5h2M2 14.5h2M20 14.5h2"/></svg>`,
  },
  {
    to: '/nutrition',
    label: 'Comida',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
    iconFilled: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
  },
  {
    to: '/progress',
    label: 'Progreso',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    iconFilled: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  },
  {
    to: '/rewards',
    label: 'Retos',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>`,
    iconFilled: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2a6 6 0 110 12A6 6 0 0112 2zm0 2a4 4 0 100 8 4 4 0 000-8zm3.477 8.89L17 22l-5-3-5 3 1.523-9.11A7.96 7.96 0 0012 20a7.96 7.96 0 003.477-.11z"/></svg>`,
  },
]

const isActive = (path) => path === '/' ? route.path === '/' : route.path.startsWith(path)

function handleTap(index) {
  if (iconRefs.value[index]) {
    navItemTap(iconRefs.value[index])
  }
}
</script>

<template>
  <nav class="bottom-nav">
    <RouterLink
      v-for="(item, i) in nav"
      :key="item.to"
      :to="item.to"
      class="nav-item"
      :class="{ active: isActive(item.to) }"
      @click="handleTap(i)"
    >
      <div :ref="el => iconRefs[i] = el" class="nav-icon-wrap">
        <span v-if="isActive(item.to)" v-html="item.iconFilled" />
        <span v-else v-html="item.icon" />
      </div>
      <span class="nav-label">{{ item.label }}</span>
      <div v-if="isActive(item.to)" class="nav-dot" />
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
  padding-top: var(--space-2);
  padding-bottom: var(--safe-bottom);
  padding-left: var(--safe-left);
  padding-right: var(--safe-right);
  z-index: 100;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-1) 0;
  color: var(--muted);
  text-decoration: none;
  min-height: 44px;
  position: relative;
  transition: color 0.2s;
}
.nav-item.active { color: var(--accent); }

.nav-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 28px;
}

.nav-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.nav-dot {
  position: absolute;
  bottom: 0;
  width: 4px; height: 4px;
  border-radius: 50%;
  background: var(--accent);
}
</style>
