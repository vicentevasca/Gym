<script setup>
/**
 * DotScale — escala visual de 6 puntos para el cuestionario de recompensas.
 *
 * Click en el punto N → rellena 1..N (si ya estaba en N → deselecciona)
 * Diseño: puntos que se rellenan progresivamente, etiqueta dinámica
 */
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  labels: {
    type: Array,
    default: () => [
      'Casi nunca',
      'Pocas veces',
      'A veces',
      'Con frecuencia',
      'Muy seguido',
      'Constantemente',
    ],
  },
})
const emit = defineEmits(['update:modelValue'])

const hovered = ref(0)

function select(n) {
  // Click en valor ya seleccionado → deselecciona
  emit('update:modelValue', props.modelValue === n ? 0 : n)
}

const activeLabel = (n) => {
  const idx = (hovered.value || props.modelValue || 0) - 1
  return idx >= 0 ? props.labels[idx] : null
}
</script>

<template>
  <div class="dot-scale">
    <!-- Dots row -->
    <div class="dots-row" role="group" :aria-label="`Escala del 1 al 6`">
      <button
        v-for="n in 6"
        :key="n"
        class="dot-btn"
        :class="{
          filled:  n <= (hovered || modelValue),
          active:  n === modelValue,
          preview: hovered > 0 && n <= hovered && n > modelValue,
        }"
        :aria-label="`Nivel ${n}: ${labels[n-1]}`"
        :aria-pressed="n === modelValue"
        @click="select(n)"
        @mouseenter="hovered = n"
        @mouseleave="hovered = 0"
        @touchstart.passive="hovered = n"
        @touchend.passive="hovered = 0"
      />
    </div>

    <!-- Dynamic label -->
    <div class="dot-label-row">
      <span class="dot-edge-label">{{ labels[0] }}</span>
      <Transition name="label-fade">
        <span
          v-if="hovered || modelValue"
          :key="hovered || modelValue"
          class="dot-active-label"
          :class="`level-${hovered || modelValue}`"
        >
          {{ labels[(hovered || modelValue) - 1] }}
        </span>
      </Transition>
      <span class="dot-edge-label">{{ labels[5] }}</span>
    </div>
  </div>
</template>

<style scoped>
.dot-scale {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  user-select: none;
}

.dots-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.dot-btn {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--border-hi);
  background: transparent;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease,
              transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.2s ease;
  padding: 0;
  flex-shrink: 0;
}

/* Preview al hover */
.dot-btn.preview {
  background: var(--accent-dim);
  border-color: var(--accent);
}

/* Rellenado definitivo */
.dot-btn.filled {
  background: var(--accent);
  border-color: var(--accent);
  transform: scale(1.1);
}

/* El punto clickeado (valor actual) */
.dot-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  transform: scale(1.25);
  box-shadow: 0 0 0 4px var(--accent-dim), 0 0 12px var(--accent-dim);
}

.dot-btn:not(.filled):hover {
  border-color: var(--accent);
  transform: scale(1.15);
}

/* Etiquetas */
.dot-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  min-height: 20px;
}

.dot-edge-label {
  font-family: var(--font-ui);
  font-size: var(--text-2xs);
  font-weight: 600;
  color: var(--muted);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  flex-shrink: 0;
}

.dot-active-label {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--accent);
  text-align: center;
  flex: 1;
}

/* Color semántico por nivel */
.dot-active-label.level-1 { color: var(--success); }
.dot-active-label.level-2 { color: var(--success); }
.dot-active-label.level-3 { color: var(--warning); }
.dot-active-label.level-4 { color: var(--warning); }
.dot-active-label.level-5 { color: var(--danger); }
.dot-active-label.level-6 { color: var(--danger); }

/* Transición de etiqueta */
.label-fade-enter-active { transition: opacity 0.15s, transform 0.15s; }
.label-fade-leave-active { transition: opacity 0.1s; position: absolute; }
.label-fade-enter-from   { opacity: 0; transform: translateY(4px); }
.label-fade-leave-to     { opacity: 0; }
</style>
