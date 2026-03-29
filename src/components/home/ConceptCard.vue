<script setup>
import { ref, computed } from 'vue'
import { getTodayConcept } from '@/utils/homeContent'

const concept  = getTodayConcept()
const expanded = ref(false)

// Primer párrafo (primera oración terminada en punto)
const previewText = computed(() => {
  const firstSentence = concept.body.split('. ')[0]
  return firstSentence.endsWith('.') ? firstSentence : firstSentence + '.'
})
</script>

<template>
  <div class="concept-card card">

    <!-- Encabezado -->
    <div class="concept-top">
      <span class="concept-emoji" aria-hidden="true">{{ concept.emoji }}</span>
      <span class="concept-category label-caps">{{ concept.category }}</span>
    </div>

    <!-- Título -->
    <h3 class="concept-title">{{ concept.title }}</h3>

    <!-- Cuerpo (colapsable) -->
    <div class="concept-body-wrap" :class="{ 'concept-body-wrap--expanded': expanded }">
      <p v-if="!expanded" class="concept-body concept-body--preview">
        {{ previewText }}
      </p>
      <p v-else class="concept-body">
        {{ concept.body }}
      </p>
    </div>

    <!-- Fuente -->
    <p class="concept-author">{{ concept.author }}</p>

    <!-- Botón expandir -->
    <button
      v-if="!expanded"
      type="button"
      class="concept-expand-btn"
      @click="expanded = true"
    >
      Leer más ↓
    </button>

    <template v-if="expanded">
      <!-- Divider -->
      <hr class="concept-divider" />

      <!-- Aplica hoy -->
      <div class="concept-apply">
        <p class="concept-apply-label label-caps">Aplica hoy</p>
        <p class="concept-apply-text">{{ concept.apply_today }}</p>
      </div>

      <!-- Botón colapsar -->
      <button
        type="button"
        class="concept-expand-btn concept-expand-btn--collapse"
        @click="expanded = false"
      >
        Mostrar menos ↑
      </button>
    </template>

  </div>
</template>

<style scoped>
.concept-card {
  padding: var(--space-5);
  transition: var(--transition);
}

/* ── Encabezado ─────────────────────────────────────────────── */
.concept-top {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.concept-emoji {
  font-size: 32px;
  line-height: 1;
  flex-shrink: 0;
}

.concept-category {
  background: var(--accent-dim);
  color: var(--accent);
  border-radius: var(--radius-full);
  padding: 3px 10px;
  font-size: 10px;
}

/* ── Título ─────────────────────────────────────────────────── */
.concept-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 800;
  color: var(--text);
  margin-bottom: var(--space-3);
  line-height: 1.25;
}

/* ── Cuerpo ─────────────────────────────────────────────────── */
.concept-body-wrap {
  overflow: hidden;
}

.concept-body {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text);
  line-height: 1.75;
  margin-bottom: var(--space-2);
}

.concept-body--preview {
  color: var(--muted);
}

/* ── Autor ──────────────────────────────────────────────────── */
.concept-author {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--muted);
  font-style: italic;
  margin-bottom: var(--space-3);
}

/* ── Botón expandir ─────────────────────────────────────────── */
.concept-expand-btn {
  background: none;
  border: none;
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--accent);
  cursor: pointer;
  padding: var(--space-1) 0;
  font-weight: 600;
  letter-spacing: 0.02em;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}

.concept-expand-btn:hover {
  opacity: 0.75;
}

.concept-expand-btn--collapse {
  color: var(--muted);
  margin-top: var(--space-2);
}

/* ── Divider ─────────────────────────────────────────────────── */
.concept-divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: var(--space-4) 0;
}

/* ── Aplica hoy ─────────────────────────────────────────────── */
.concept-apply {
  background: var(--faint);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.concept-apply-label {
  color: var(--accent);
  margin-bottom: var(--space-2);
  font-size: 10px;
}

.concept-apply-text {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text);
  line-height: 1.65;
}
</style>
