<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { gsap } from 'gsap'
import AppHeader from '@/components/ui/AppHeader.vue'
import BottomNav from '@/components/ui/BottomNav.vue'

const router = useRouter()

onMounted(() => {
  gsap.from('.choice-card', { y: 28, opacity: 0, duration: 0.45, stagger: 0.18, ease: 'power2.out', clearProps: 'all' })
})
</script>

<template>
  <div>
    <AppHeader title="Crear rutina" />

    <main class="page-content page-pad">

      <div class="choice-header">
        <div class="choice-hero-icon">🏋️</div>
        <h2 class="choice-title display-sm">¿Cómo quieres entrenar?</h2>
        <p class="choice-sub">Elige la opción que mejor se adapte a ti</p>
      </div>

      <!-- Opción 1: Rutinas listas -->
      <button type="button" class="choice-card" @click="router.push('/training/nueva')">
        <div class="choice-card-top">
          <span class="choice-icon">🗂️</span>
          <div class="choice-body">
            <h3 class="choice-name">Rutinas listas para ti</h3>
            <p class="choice-desc">Selecciona tu estilo, objetivo y días de entrenamiento. Generamos tu plan en segundos.</p>
          </div>
          <svg class="choice-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg>
        </div>
        <ul class="choice-features">
          <li>5 pasos rápidos</li>
          <li>Personalización por estilo y objetivo</li>
          <li>Ideal para empezar hoy mismo</li>
        </ul>
      </button>

      <!-- Opción 2: A tu medida -->
      <button type="button" class="choice-card choice-card--featured" @click="router.push('/training/medida')">
        <span class="choice-badge label-caps">Recomendado</span>
        <div class="choice-card-top">
          <span class="choice-icon">🎯</span>
          <div class="choice-body">
            <h3 class="choice-name">A tu medida</h3>
            <p class="choice-desc">Evaluación completa que analiza tu historial, condición y objetivos para crear un plan 100% personalizado con asignación científica de días.</p>
          </div>
          <svg class="choice-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg>
        </div>
        <ul class="choice-features">
          <li>Evaluación de salud y condición física</li>
          <li>Asignación de días con base científica</li>
          <li>Adaptado a tu cuerpo, equipo y metas</li>
        </ul>
      </button>

    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.page-pad { padding-left: var(--space-4); padding-right: var(--space-4); }

.choice-header {
  text-align: center;
  padding: var(--space-6) 0 var(--space-5);
}
.choice-hero-icon { font-size: 48px; margin-bottom: var(--space-3); }
.choice-title { margin-bottom: var(--space-2); }
.choice-sub { font-size: var(--text-sm); color: var(--muted); }

.choice-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-5);
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition);
  text-align: left;
  color: var(--text);
  margin-bottom: var(--space-4);
  position: relative;
}
.choice-card:hover { border-color: var(--accent); }
.choice-card--featured { border-color: var(--accent); background: var(--accent-dim); }

.choice-badge {
  position: absolute;
  top: -10px;
  left: var(--space-5);
  background: var(--accent);
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.1em;
  padding: 2px 10px;
  border-radius: var(--radius-full);
}

.choice-card-top {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}
.choice-icon { font-size: 28px; flex-shrink: 0; margin-top: 2px; }
.choice-body { flex: 1; min-width: 0; }
.choice-name {
  font-size: var(--text-base);
  font-weight: 800;
  margin-bottom: var(--space-1);
}
.choice-desc {
  font-size: var(--text-sm);
  color: var(--muted);
  line-height: var(--leading-relaxed);
}
.choice-arrow { flex-shrink: 0; color: var(--muted); margin-top: 4px; }

.choice-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-left: calc(28px + var(--space-3));
}
.choice-features li {
  font-size: var(--text-xs);
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.choice-features li::before {
  content: '✓';
  color: var(--accent);
  font-weight: 800;
  font-size: 11px;
  flex-shrink: 0;
}
.choice-card--featured .choice-features li { color: var(--text); }
</style>
