<script setup>
/**
 * RewardsQuestionnaire — Cuestionario de personalización de recompensas
 *
 * Diseño psicológico:
 * - Una pregunta por pantalla → no abruma
 * - Normalizer antes de cada pregunta → reduce vergüenza/juicio
 * - Lenguaje de agencia ("eliges", "disfrutas") no de adicción
 * - Botón "Prefiero saltar esta" siempre visible → control total del usuario
 * - Progreso visual → sensación de avance, no de interrogatorio
 * - Al final: refuerzo positivo, no diagnóstico
 */
import { ref, computed, onMounted } from 'vue'
import { gsap }              from 'gsap'
import { useAuthStore }      from '@/stores/auth.store'
import { useGendered }       from '@/composables/useGendered'
import { useRewardsStore, QUESTIONNAIRE } from '@/stores/rewards.store'
import DotScale              from '@/components/ui/DotScale.vue'

const emit = defineEmits(['complete'])

const auth    = useAuthStore()
const rewards = useRewardsStore()
const { g }   = useGendered()

const current   = ref(0)
const answers   = ref({})
const saving    = ref(false)
const slideDir  = ref(1) // 1 = forward, -1 = backward

const container = ref(null)
const card      = ref(null)

const total     = QUESTIONNAIRE.length
const question  = computed(() => QUESTIONNAIRE[current.value])
const progress  = computed(() => (current.value / total) * 100)

// Texto de la pregunta adaptado al género
const questionText = computed(() =>
  g(question.value.question_m, question.value.question_f)
)

const currentAnswer = computed({
  get: () => answers.value[question.value.id] ?? 0,
  set: (v) => { answers.value[question.value.id] = v },
})

onMounted(() => {
  gsap.from(container.value, { opacity: 0, y: 30, duration: 0.5, ease: 'power3.out' })
})

function animateTransition(direction, callback) {
  const x = direction * 40
  gsap.to(card.value, {
    opacity: 0, x, duration: 0.2, ease: 'power2.in',
    onComplete: () => {
      callback()
      gsap.fromTo(card.value,
        { opacity: 0, x: -x },
        { opacity: 1, x: 0, duration: 0.25, ease: 'power2.out' }
      )
    },
  })
}

function next() {
  slideDir.value = 1
  if (current.value < total - 1) {
    animateTransition(1, () => { current.value++ })
  } else {
    submit()
  }
}

function skip() {
  answers.value[question.value.id] = 0
  next()
}

function prev() {
  if (current.value > 0) {
    slideDir.value = -1
    animateTransition(-1, () => { current.value-- })
  }
}

async function submit() {
  saving.value = true
  await rewards.saveQuestionnaire(answers.value)
  saving.value = false
  // Animación de cierre
  gsap.to(container.value, {
    opacity: 0, scale: 0.95, duration: 0.3,
    onComplete: () => emit('complete'),
  })
}
</script>

<template>
  <div class="rq-wrapper" ref="container">

    <!-- Header con progreso -->
    <div class="rq-header">
      <div class="rq-progress-track">
        <div class="rq-progress-fill" :style="{ width: progress + '%' }" />
      </div>
      <div class="rq-steps">
        <span class="rq-step-count">{{ current + 1 }} de {{ total }}</span>
        <button v-if="current > 0" class="rq-back-btn" @click="prev">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Anterior
        </button>
      </div>
    </div>

    <!-- Card de pregunta -->
    <div class="rq-card" ref="card">

      <!-- Icono de categoría -->
      <div class="rq-category">
        <span class="rq-category-icon">{{ question.icon }}</span>
        <span class="rq-category-label label-caps">{{ question.title }}</span>
      </div>

      <!-- Normalizer — reduce carga emocional antes de la pregunta -->
      <p class="rq-normalizer">{{ question.normalizer }}</p>

      <!-- La pregunta -->
      <h3 class="rq-question">{{ questionText }}</h3>

      <!-- Nota adicional (solo algunas preguntas) -->
      <p v-if="question.note" class="rq-note">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
        {{ question.note }}
      </p>

      <!-- Escala de puntos -->
      <div class="rq-scale-wrap">
        <DotScale
          v-model="currentAnswer"
          :labels="question.labels"
        />
      </div>

      <!-- Respuesta actual en texto -->
      <div class="rq-answer-display" :class="{ visible: currentAnswer > 0 }">
        <div class="rq-answer-pill" :class="`level-${currentAnswer}`">
          <span class="rq-answer-num">{{ currentAnswer }}</span>
          <span class="rq-answer-text">— {{ question.labels[currentAnswer - 1] }}</span>
        </div>
      </div>

    </div>

    <!-- Acciones -->
    <div class="rq-actions">
      <button class="btn btn-ghost rq-skip-btn" @click="skip">
        {{ question.skip_label || 'Prefiero saltar esta' }}
      </button>
      <button
        class="btn btn-primary rq-next-btn"
        :disabled="saving"
        @click="next"
      >
        <span v-if="saving" class="spinner" />
        <template v-else>
          {{ current < total - 1 ? 'Siguiente' : 'Ver mis recompensas' }}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </template>
      </button>
    </div>

    <!-- Nota de privacidad footer -->
    <p class="rq-privacy">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      Tus respuestas son completamente privadas y nunca se comparten.
    </p>
  </div>
</template>

<style scoped>
.rq-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-5) var(--space-4) var(--space-8);
  max-width: 480px;
  margin: 0 auto;
}

/* Header */
.rq-header { display: flex; flex-direction: column; gap: var(--space-3); }
.rq-progress-track {
  height: 3px; background: var(--faint); border-radius: 2px; overflow: hidden;
}
.rq-progress-fill {
  height: 100%; background: var(--gradient-accent); border-radius: 2px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.rq-steps { display: flex; justify-content: space-between; align-items: center; }
.rq-step-count { font-size: var(--text-xs); color: var(--muted); font-weight: 600; }
.rq-back-btn {
  display: flex; align-items: center; gap: 4px;
  background: none; border: none; color: var(--muted); font-size: var(--text-xs);
  font-weight: 600; cursor: pointer; padding: 4px 0; transition: color 0.2s;
}
.rq-back-btn:hover { color: var(--text); }

/* Card */
.rq-card {
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius-xl); padding: var(--space-6);
  display: flex; flex-direction: column; gap: var(--space-4);
}

.rq-category {
  display: flex; align-items: center; gap: var(--space-2);
}
.rq-category-icon { font-size: 22px; }
.rq-category-label { color: var(--accent); }

.rq-normalizer {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--muted);
  background: var(--faint-2);
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
  border-left: 3px solid var(--border-hi);
}

.rq-question {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-snug);
  color: var(--text);
}

.rq-note {
  display: flex; align-items: flex-start; gap: var(--space-2);
  font-size: var(--text-xs); color: var(--muted);
  background: var(--accent-dim); border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
}
.rq-note svg { flex-shrink: 0; margin-top: 1px; color: var(--accent); }

.rq-scale-wrap {
  padding: var(--space-4) 0 var(--space-2);
}

/* Respuesta seleccionada */
.rq-answer-display {
  min-height: 32px;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.25s, transform 0.25s;
}
.rq-answer-display.visible {
  opacity: 1;
  transform: translateY(0);
}
.rq-answer-pill {
  display: inline-flex; align-items: center; gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-sm); font-weight: 600;
  background: var(--faint-2); border: 1px solid var(--border-hi);
}
.rq-answer-num {
  font-family: var(--font-mono);
  font-size: var(--text-base);
  font-weight: 800;
  font-feature-settings: "tnum" 1;
}
.rq-answer-pill.level-1, .rq-answer-pill.level-2 {
  color: var(--success); border-color: var(--success-dim);
  background: var(--success-dim);
}
.rq-answer-pill.level-3, .rq-answer-pill.level-4 {
  color: var(--warning); border-color: var(--warning-dim);
  background: var(--warning-dim);
}
.rq-answer-pill.level-5, .rq-answer-pill.level-6 {
  color: var(--danger); border-color: var(--danger-dim);
  background: var(--danger-dim);
}

/* Acciones */
.rq-actions { display: flex; flex-direction: column; gap: var(--space-3); }
.rq-next-btn {
  display: flex; align-items: center; justify-content: center; gap: var(--space-2);
}
.rq-skip-btn {
  font-size: var(--text-sm); color: var(--muted); border-color: transparent;
}
.rq-skip-btn:hover { color: var(--text); border-color: var(--border-hi); }

/* Privacidad */
.rq-privacy {
  display: flex; align-items: center; justify-content: center; gap: var(--space-2);
  font-size: var(--text-xs); color: var(--muted);
  opacity: 0.7;
}
</style>
