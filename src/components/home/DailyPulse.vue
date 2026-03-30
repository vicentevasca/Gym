<script setup>
import { ref, computed } from 'vue'
import { getDailyContent } from '@/data/dailyContent'
import { toDateKey } from '@/utils/formatters'

const { verso, concepto, microReto } = getDailyContent()

// ── Micro-reto: completado por día (localStorage) ──────────────
const RETO_KEY      = `disciplina_reto_${toDateKey()}`
const retoCompleted = ref(localStorage.getItem(RETO_KEY) === 'done')

function completeReto() {
  localStorage.setItem(RETO_KEY, 'done')
  retoCompleted.value = true
}

// ── Verso expandido ────────────────────────────────────────────
const versoExpanded = ref(false)

// ── Líneas del verso ───────────────────────────────────────────
const versoLines = computed(() => verso.body.split('\n'))

// ── Categoría color para micro-reto ───────────────────────────
const CATEGORIA_COLOR = {
  Espiritual:    'var(--accent)',
  Físico:        'var(--success)',
  Terapéutico:   '#c084fc',
}
const retoColor = computed(() => CATEGORIA_COLOR[microReto.categoria] || 'var(--accent)')
</script>

<template>
  <div class="daily-pulse">

    <!-- ══ VERSO DEL DÍA ════════════════════════════════════════ -->
    <div
      class="pulse-card verso-card"
      :class="{ expanded: versoExpanded }"
      @click="versoExpanded = !versoExpanded"
    >
      <div class="pulse-tag">
        <span class="tag-dot verso-dot" />
        Verso del día
      </div>

      <h3 class="verso-title">{{ verso.title }}</h3>

      <div class="verso-body" :class="{ 'verso-collapsed': !versoExpanded }">
        <p
          v-for="(line, i) in versoLines"
          :key="i"
          class="verso-line"
          :class="{ 'verso-blank': !line.trim() }"
        >
          {{ line || '' }}
        </p>
      </div>

      <div class="verso-expand">
        <span>{{ versoExpanded ? 'Cerrar' : 'Leer completo' }}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2.5"
          :style="{ transform: versoExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
    </div>

    <!-- ══ CONCEPTO SEMANAL ══════════════════════════════════════ -->
    <div class="pulse-card concepto-card">
      <div class="pulse-tag">
        <span class="tag-dot concepto-dot" />
        {{ concepto.tag }}
      </div>

      <div class="concepto-header">
        <span class="concepto-emoji">{{ concepto.emoji }}</span>
        <h3 class="concepto-title">{{ concepto.title }}</h3>
      </div>

      <p class="concepto-body">{{ concepto.body }}</p>

      <p class="concepto-fuente label-caps">{{ concepto.fuente }}</p>
    </div>

    <!-- ══ MICRO-RETO DEL DÍA ════════════════════════════════════ -->
    <div
      class="pulse-card reto-card"
      :class="{ 'reto-done': retoCompleted }"
      :style="{ '--reto-color': retoColor }"
    >
      <div class="pulse-tag">
        <span class="tag-dot reto-dot" />
        Micro-reto · {{ microReto.categoria }}
      </div>

      <div class="reto-content">
        <span class="reto-emoji">{{ microReto.emoji }}</span>
        <p class="reto-texto">{{ microReto.texto }}</p>
      </div>

      <div class="reto-footer">
        <button
          v-if="!retoCompleted"
          class="btn btn-primary reto-btn"
          @click.stop="completeReto"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Lo hice hoy
        </button>
        <div v-else class="reto-completed">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Completado hoy
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.daily-pulse {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* ── Card base ──────────────────────────────────────────────── */
.pulse-card {
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  position: relative;
  overflow: hidden;
}

/* ── Tag row ────────────────────────────────────────────────── */
.pulse-tag {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
}
.tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.verso-dot    { background: var(--accent); }
.concepto-dot { background: var(--warning); }
.reto-dot     { background: var(--reto-color, var(--accent)); }

/* ── VERSO ──────────────────────────────────────────────────── */
.verso-card {
  cursor: pointer;
  border-left: 3px solid var(--accent);
  padding-left: calc(var(--space-5) - 1px);
  transition: border-color 0.2s;
}
.verso-card:hover { border-left-color: var(--accent); }
.verso-card.expanded { border-color: var(--accent); }

.verso-title {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: 800;
  letter-spacing: var(--tracking-snug);
  color: var(--text);
  line-height: var(--leading-snug);
}

.verso-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: max-height 0.4s ease;
}
.verso-collapsed {
  max-height: 72px;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
}

.verso-line {
  font-family: var(--font-verse, var(--font-display));
  font-style: italic;
  font-size: var(--text-sm);
  color: var(--text);
  line-height: 1.7;
}
.verso-blank { height: var(--space-2); }

.verso-expand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--accent);
  margin-top: var(--space-1);
}

/* ── CONCEPTO ───────────────────────────────────────────────── */
.concepto-card {
  border-left: 3px solid var(--warning);
  background: color-mix(in srgb, var(--warning) 4%, var(--card));
}

.concepto-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}
.concepto-emoji {
  font-size: 26px;
  flex-shrink: 0;
  line-height: 1;
  margin-top: 2px;
}
.concepto-title {
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: 800;
  color: var(--text);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-snug);
}

.concepto-body {
  font-size: var(--text-sm);
  color: var(--text);
  line-height: 1.65;
  opacity: 0.85;
}

.concepto-fuente {
  color: var(--muted);
  margin-top: var(--space-1);
}

/* ── MICRO-RETO ─────────────────────────────────────────────── */
.reto-card {
  border-left: 3px solid var(--reto-color);
  background: color-mix(in srgb, var(--reto-color) 5%, var(--card));
  transition: opacity 0.3s;
}
.reto-card.reto-done {
  opacity: 0.65;
}

.reto-content {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}
.reto-emoji {
  font-size: 28px;
  flex-shrink: 0;
  line-height: 1;
  margin-top: 2px;
}
.reto-texto {
  font-size: var(--text-sm);
  color: var(--text);
  line-height: 1.65;
}

.reto-footer { padding-top: var(--space-1); }

.reto-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  background: var(--reto-color);
  border-color: var(--reto-color);
  color: #fff;
}
.reto-btn:hover {
  filter: brightness(1.1);
}

.reto-completed {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--reto-color);
  padding: var(--space-2) var(--space-3);
  background: color-mix(in srgb, var(--reto-color) 12%, transparent);
  border-radius: var(--radius-full);
}
</style>
