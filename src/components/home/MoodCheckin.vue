<script setup>
import { ref } from 'vue'
import { useMoodStore } from '@/stores/mood.store'

const emit = defineEmits(['checked'])

const mood = useMoodStore()

const EMOJIS  = ['😤', '😔', '😐', '🙂', '🤩']
const LABELS  = ['Frustrado', 'Triste', 'Neutral', 'Bien', 'Excelente']

const selecting     = ref(false)
const selectedLevel = ref(null)

async function selectMood(level) {
  if (selecting.value) return
  selecting.value  = true
  selectedLevel.value = level

  await mood.saveMood(level)
  emit('checked', level)

  selecting.value = false
}

async function changeMood() {
  // Permite volver a seleccionar
  mood.todayMood = null
}
</script>

<template>
  <div class="mood-checkin">

    <!-- Estado: no ha hecho check-in -->
    <template v-if="!mood.hasCheckedIn">
      <p class="mood-question">¿Cómo te sientes hoy?</p>
      <div class="mood-buttons" role="group" aria-label="Selecciona tu estado de ánimo">
        <button
          v-for="(emoji, i) in EMOJIS"
          :key="i"
          type="button"
          class="mood-btn"
          :class="{ 'mood-btn--active': selectedLevel === i + 1, 'mood-btn--loading': selecting && selectedLevel === i + 1 }"
          :aria-label="LABELS[i]"
          :disabled="selecting"
          @click="selectMood(i + 1)"
        >
          <span class="mood-emoji">{{ emoji }}</span>
          <span class="mood-label">{{ LABELS[i] }}</span>
        </button>
      </div>
    </template>

    <!-- Estado: ya hizo check-in -->
    <template v-else>
      <div class="mood-done">
        <span class="mood-done-emoji">{{ EMOJIS[mood.todayMood - 1] }}</span>
        <div class="mood-done-info">
          <span class="mood-done-label">{{ LABELS[mood.todayMood - 1] }}</span>
          <span class="mood-done-sub">Registrado hoy</span>
        </div>
        <button type="button" class="mood-change-btn" @click="changeMood">
          cambiar
        </button>
      </div>
    </template>

  </div>
</template>

<style scoped>
.mood-checkin {
  padding: var(--space-3) 0;
}

.mood-question {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--muted);
  margin-bottom: var(--space-3);
}

/* ── Botonera ─────────────────────────────────────────────── */
.mood-buttons {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
}

.mood-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  background: none;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-1);
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.2s ease, background 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.mood-btn:disabled {
  cursor: not-allowed;
}

.mood-btn:not(:disabled):hover {
  transform: scale(1.08);
  background: var(--faint);
}

.mood-btn--active {
  border-color: var(--accent);
  background: var(--accent-dim);
  transform: scale(1.12);
}

.mood-emoji {
  font-size: 28px;
  line-height: 1;
  display: block;
  transition: transform 0.15s ease;
}

.mood-btn:not(:disabled):active .mood-emoji {
  transform: scale(0.9);
}

.mood-label {
  font-family: var(--font-ui);
  font-size: 9px;
  color: var(--muted);
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.mood-btn--active .mood-label {
  color: var(--accent);
  font-weight: 700;
}

/* ── Estado ya registrado ──────────────────────────────────── */
.mood-done {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
}

.mood-done-emoji {
  font-size: 32px;
  line-height: 1;
}

.mood-done-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mood-done-label {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text);
}

.mood-done-sub {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--muted);
}

.mood-change-btn {
  margin-left: auto;
  background: none;
  border: none;
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--muted);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: color 0.2s, background 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.mood-change-btn:hover {
  color: var(--accent);
  background: var(--faint);
}
</style>
