<script setup>
import AppHeader from '@/components/ui/AppHeader.vue'
import BottomNav from '@/components/ui/BottomNav.vue'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()
</script>

<template>
  <div>
    <AppHeader />
    <main class="page-content px-4">

      <!-- Bienvenida -->
      <div class="welcome-block">
        <p class="welcome-label">Buenos días,</p>
        <h2 class="welcome-name font-display">{{ auth.alias }}</h2>
      </div>

      <!-- Placeholder: Dashboard completo en próximas fases -->
      <div class="card coming-soon">
        <p class="cs-label">Dashboard</p>
        <p class="cs-body">Aquí aparecerá tu sesión del día, macros, puntos y verso.</p>
        <p class="cs-sub">Fase 2 →</p>
      </div>

    </main>
    <BottomNav />
  </div>
</template>

<style scoped>
.px-4 { padding-left: 16px; padding-right: 16px; }

.welcome-block { margin-bottom: 20px; }
.welcome-label { color: var(--muted); font-size: 13px; letter-spacing: 0.05em; }
.welcome-name {
  font-size: 28px;
  font-weight: 300;
  color: var(--text);
  margin-top: 2px;
}

.coming-soon {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cs-label {
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent);
  font-weight: 600;
}
.cs-body { color: var(--muted); font-size: 14px; line-height: 1.6; }
.cs-sub { font-size: 12px; color: var(--faint); }
</style>
