<script setup>
import AppHeader from '@/components/ui/AppHeader.vue'
import BottomNav from '@/components/ui/BottomNav.vue'
</script>

<template>
  <div>
    <AppHeader title="COMIDA" />
    <main class="page-content px-4">
      <div class="card coming-soon">
        <p class="cs-label">Nutrición</p>
        <p class="cs-body">MacroRing, registro de comidas, búsqueda de alimentos y agua.</p>
        <p class="cs-sub">Fase 3 →</p>
      </div>
    </main>
    <BottomNav />
  </div>
</template>

<style scoped>
.px-4 { padding-left: 16px; padding-right: 16px; }
.cs-label { font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--accent); font-weight: 600; }
.cs-body { color: var(--muted); font-size: 14px; line-height: 1.6; margin-top: 6px; }
.cs-sub { font-size: 12px; color: var(--faint); margin-top: 4px; }
</style>
