<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { gsap } from 'gsap'
import { useProfileStore } from '@/stores/profile.store'
import { useAuthStore } from '@/stores/auth.store'
import { useTheme } from '@/composables/useTheme'
import { ease, dur, staggerIn, animateProgress } from '@/composables/useAnimations'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'

useTheme()
const router  = useRouter()
const profile = useProfileStore()
const auth    = useAuthStore()

const step      = ref(0)
const direction = ref(1)  // 1 = forward, -1 = back
const loading   = ref(false)
const stepEl    = ref(null)
const progBar   = ref(null)

const TOTAL_STEPS = 5

const data = ref({
  alias: auth.user?.displayName || '',
  weight_kg: '',
  height_cm: '',
  dob: '',
  sex: '',
  primary_goal: '',
  activity_level: '',
  gym_days_per_week: 3,
  why_joined: '',
  desired_self: '',
})

onMounted(() => {
  gsap.from('.ob-header', { opacity: 0, y: -16, duration: dur.normal, ease: ease.enter })
  animateStepIn()
})

function animateStepIn(fromRight = true) {
  nextTick(() => {
    const fields = stepEl.value?.querySelectorAll('.ob-field, .ob-option-group, .ob-days, .ob-question')
    gsap.from(stepEl.value, {
      opacity: 0,
      x: fromRight ? 24 : -24,
      duration: dur.normal,
      ease: ease.enter,
      clearProps: 'all',
    })
    if (fields?.length) {
      gsap.from(fields, {
        opacity: 0, y: 12,
        duration: dur.normal,
        stagger: 0.06,
        delay: 0.08,
        ease: ease.enter,
        clearProps: 'all',
      })
    }
  })
}

function updateProgress() {
  if (progBar.value) {
    gsap.to(progBar.value, {
      width: ((step.value + 1) / TOTAL_STEPS * 100) + '%',
      duration: 0.4,
      ease: ease.smooth,
    })
  }
}

function next() {
  if (step.value < TOTAL_STEPS - 1) {
    direction.value = 1
    gsap.to(stepEl.value, {
      opacity: 0, x: -20, duration: dur.fast, ease: ease.sharp,
      onComplete: () => { step.value++; updateProgress(); animateStepIn(true) }
    })
  }
}

function prev() {
  if (step.value > 0) {
    direction.value = -1
    gsap.to(stepEl.value, {
      opacity: 0, x: 20, duration: dur.fast, ease: ease.sharp,
      onComplete: () => { step.value--; updateProgress(); animateStepIn(false) }
    })
  }
}

async function finish() {
  loading.value = true
  try {
    await profile.updateProfile({
      alias: data.value.alias.trim() || auth.user?.displayName || 'Tú',
      biometrics: {
        weight_kg: Number(data.value.weight_kg),
        height_cm: Number(data.value.height_cm),
        dob: data.value.dob,
        sex: data.value.sex,
      },
      goals:          { primary_goal: data.value.primary_goal },
      activity_level: data.value.activity_level,
      training_prefs: { gym_days_per_week: data.value.gym_days_per_week },
      personal: {
        why_joined:   data.value.why_joined,
        desired_self: data.value.desired_self,
      },
      onboarding_completed: true,
    })
    gsap.to('.ob-page', {
      opacity: 0, scale: 0.98, duration: 0.3, ease: ease.smooth,
      onComplete: () => router.push('/')
    })
  } finally {
    loading.value = false
  }
}

const goals = [
  { value: 'perder_grasa',  label: 'Perder grasa' },
  { value: 'ganar_musculo', label: 'Ganar músculo' },
  { value: 'recomposicion', label: 'Recomposición corporal' },
  { value: 'mantener',      label: 'Mantener y mejorar' },
  { value: 'rendimiento',   label: 'Mejorar rendimiento' },
]
const activities = [
  { value: 'sedentario', label: 'Sedentario', sub: 'Trabajo de escritorio' },
  { value: 'ligero',     label: 'Ligero',     sub: 'Camino algo en el día' },
  { value: 'moderado',   label: 'Moderado',   sub: 'Activo en el día a día' },
  { value: 'muy_activo', label: 'Muy activo', sub: 'Trabajo físico o deporte extra' },
]
</script>

<template>
  <div class="ob-page">

    <!-- Header fijo -->
    <div class="ob-header">
      <div class="ob-progress-track">
        <div class="ob-progress-fill" ref="progBar" />
      </div>
      <div class="ob-header-row">
        <button v-if="step > 0" class="btn-back" @click="prev">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Atrás
        </button>
        <div v-else />
        <span class="ob-counter label-caps">{{ step + 1 }} / {{ TOTAL_STEPS }}</span>
        <ThemeToggle />
      </div>
    </div>

    <!-- Contenido del paso -->
    <div class="ob-content" ref="stepEl">

      <!-- Paso 0: Tu nombre -->
      <template v-if="step === 0">
        <div class="ob-step-header">
          <p class="ob-step-tag label-caps">Bienvenido</p>
          <h2 class="display-md">¿Cómo quieres que te llame?</h2>
          <p class="ob-step-sub">Este será tu nombre dentro de la app.</p>
        </div>

        <div class="ob-fields-stack">
          <div class="ob-field ob-input-group">
            <label class="label-caps">Tu nombre</label>
            <input
              v-model="data.alias"
              type="text"
              inputmode="text"
              autocomplete="given-name"
              placeholder="Escribe tu nombre..."
              class="input-field input-alias"
              maxlength="30"
            />
          </div>

          <div class="ob-alias-warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p>Este nombre <strong>no podrá modificarse</strong> después. Elige bien.</p>
          </div>
        </div>
      </template>

      <!-- Paso 1: Tu cuerpo -->
      <template v-if="step === 1">
        <div class="ob-step-header">
          <p class="ob-step-tag label-caps">Tu cuerpo</p>
          <h2 class="display-md">Cuéntame sobre ti</h2>
          <p class="ob-step-sub">Datos básicos para calcular tu TDEE y macros personalizados.</p>
        </div>

        <div class="ob-fields-stack">
          <div class="ob-field ob-row-2">
            <div class="ob-input-group">
              <label class="label-caps">Peso</label>
              <div class="input-with-suffix">
                <input v-model="data.weight_kg" type="number" inputmode="decimal" placeholder="75" class="input-field" />
                <span class="input-suffix">kg</span>
              </div>
            </div>
            <div class="ob-input-group">
              <label class="label-caps">Altura</label>
              <div class="input-with-suffix">
                <input v-model="data.height_cm" type="number" inputmode="decimal" placeholder="178" class="input-field" />
                <span class="input-suffix">cm</span>
              </div>
            </div>
          </div>

          <div class="ob-field ob-input-group">
            <label class="label-caps">Fecha de nacimiento</label>
            <input v-model="data.dob" type="date" class="input-field" />
          </div>

          <div class="ob-field ob-option-group">
            <label class="label-caps">Sexo biológico</label>
            <div class="chip-row">
              <button
                v-for="s in ['Masculino', 'Femenino']"
                :key="s"
                class="chip"
                :class="{ selected: data.sex === s.toLowerCase() }"
                @click="data.sex = s.toLowerCase()"
              >{{ s }}</button>
            </div>
          </div>
        </div>
      </template>

      <!-- Paso 2: Tu objetivo -->
      <template v-if="step === 2">
        <div class="ob-step-header">
          <p class="ob-step-tag label-caps">Tu objetivo</p>
          <h2 class="display-md">¿Qué buscas lograr?</h2>
          <p class="ob-step-sub">Esto define tu plan nutricional y de entrenamiento.</p>
        </div>

        <div class="ob-fields-stack">
          <div class="ob-field ob-option-group">
            <div class="option-list">
              <button
                v-for="g in goals"
                :key="g.value"
                class="option-row"
                :class="{ selected: data.primary_goal === g.value }"
                @click="data.primary_goal = g.value"
              >
                <span>{{ g.label }}</span>
                <div class="option-check" :class="{ active: data.primary_goal === g.value }">
                  <svg v-if="data.primary_goal === g.value" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </button>
            </div>
          </div>

          <div class="ob-field ob-option-group">
            <label class="label-caps">Actividad diaria (sin gym)</label>
            <div class="option-list">
              <button
                v-for="a in activities"
                :key="a.value"
                class="option-row"
                :class="{ selected: data.activity_level === a.value }"
                @click="data.activity_level = a.value"
              >
                <div>
                  <p>{{ a.label }}</p>
                  <p class="option-sub">{{ a.sub }}</p>
                </div>
                <div class="option-check" :class="{ active: data.activity_level === a.value }">
                  <svg v-if="data.activity_level === a.value" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Paso 3: Tu gym -->
      <template v-if="step === 3">
        <div class="ob-step-header">
          <p class="ob-step-tag label-caps">Tu gym</p>
          <h2 class="display-md">¿Cuántos días entrenas?</h2>
          <p class="ob-step-sub">Esto determina el split de tu rutina semanal.</p>
        </div>

        <div class="ob-days">
          <div class="days-grid">
            <button
              v-for="d in [2, 3, 4, 5, 6]"
              :key="d"
              class="day-btn"
              :class="{ selected: data.gym_days_per_week === d }"
              @click="data.gym_days_per_week = d"
            >
              <span class="day-num">{{ d }}</span>
              <span class="day-label">días</span>
            </button>
          </div>
          <p class="days-hint">
            {{ data.gym_days_per_week }} días por semana seleccionados
          </p>
        </div>
      </template>

      <!-- Paso 4: Lo personal -->
      <template v-if="step === 4">
        <div class="ob-step-header">
          <p class="ob-step-tag label-caps">Lo que importa</p>
          <h2 class="display-md">Solo tú y la app lo saben.</h2>
          <p class="ob-step-sub">No hay respuesta incorrecta. No es un formulario — es un primer paso.</p>
        </div>

        <div class="ob-fields-stack">
          <div class="ob-question">
            <label class="ob-question-label">¿Qué te trajo hasta aquí?</label>
            <p class="ob-question-hint">Puede ser una sola palabra.</p>
            <textarea
              v-model="data.why_joined"
              class="textarea-field"
              rows="3"
              placeholder="Escribir aquí..."
            />
          </div>

          <div class="ob-question">
            <label class="ob-question-label">¿Qué versión de ti mismo quieres ser?</label>
            <p class="ob-question-hint">No tiene que ser perfecta la respuesta.</p>
            <textarea
              v-model="data.desired_self"
              class="textarea-field"
              rows="3"
              placeholder="Escribir aquí..."
            />
          </div>
        </div>
      </template>

    </div>

    <!-- Navegación inferior -->
    <div class="ob-footer">
      <button
        v-if="step < TOTAL_STEPS - 1"
        class="btn btn-primary btn-full"
        @click="next"
      >
        Continuar
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
      <button
        v-else
        class="btn btn-primary btn-full"
        :disabled="loading"
        @click="finish"
      >
        <span v-if="loading" class="spinner" />
        <span v-else>Empezar mi programa</span>
      </button>
    </div>

  </div>
</template>

<style scoped>
.ob-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

/* Header */
.ob-header { flex-shrink: 0; }
.ob-progress-track {
  height: 2px;
  background: var(--faint);
}
.ob-progress-fill {
  height: 100%;
  background: var(--gradient-accent);
  width: 25%;
  border-radius: 0 2px 2px 0;
}
.ob-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-5);
  padding-top: calc(var(--space-3) + var(--safe-top));
}
.ob-counter { color: var(--muted); }
.btn-back {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  background: none;
  border: none;
  color: var(--muted);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: 600;
  transition: color 0.2s;
  padding: 4px 0;
}
.btn-back:hover { color: var(--text); }

/* Content */
.ob-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6) var(--space-5) var(--space-4);
}

.ob-step-header { margin-bottom: var(--space-6); }
.ob-step-tag { margin-bottom: var(--space-2); color: var(--accent); }
.ob-step-header h2 { color: var(--text); margin-bottom: var(--space-2); }
.ob-step-sub { color: var(--muted); font-size: var(--text-sm); line-height: 1.6; }

.ob-fields-stack { display: flex; flex-direction: column; gap: var(--space-5); }

.ob-field { display: flex; flex-direction: column; gap: var(--space-2); }
.ob-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }

.ob-input-group { display: flex; flex-direction: column; gap: var(--space-2); }
.ob-input-group label { display: block; }

.input-with-suffix { position: relative; }
.input-with-suffix .input-field { padding-right: 44px; }
.input-suffix {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  font-size: var(--text-sm);
  font-weight: 600;
  pointer-events: none;
}

/* Chips */
.chip-row { display: flex; gap: var(--space-2); }
.chip {
  flex: 1;
  height: 48px;
  border-radius: var(--radius);
  border: 1.5px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: 600;
  transition: var(--transition);
}
.chip.selected {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-dim);
}

/* Option list */
.ob-option-group { display: flex; flex-direction: column; gap: var(--space-2); }
.option-list { display: flex; flex-direction: column; gap: var(--space-2); }
.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-2);
  text-align: left;
  transition: var(--transition);
}
.option-row.selected {
  border-color: var(--accent);
  background: var(--accent-dim);
  color: var(--text);
}
.option-row:hover { border-color: var(--border-hi); }
.option-sub { font-size: var(--text-xs); color: var(--muted); margin-top: 2px; font-weight: 400; }
.option-check {
  width: 22px; height: 22px;
  border-radius: 50%;
  border: 1.5px solid var(--border-hi);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: var(--transition);
}
.option-check.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
[data-mode="light"] .option-check.active { color: #fff; }

/* Days */
.ob-days { display: flex; flex-direction: column; align-items: center; gap: var(--space-5); padding-top: var(--space-4); }
.days-grid { display: flex; gap: var(--space-3); }
.day-btn {
  width: 60px; height: 72px;
  border-radius: var(--radius);
  border: 1.5px solid var(--border);
  background: var(--surface);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  transition: var(--transition);
  font-family: var(--font-ui);
}
.day-btn.selected {
  border-color: var(--accent);
  background: var(--accent-dim);
  box-shadow: var(--shadow-accent);
}
.day-num {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--muted);
  transition: color 0.2s;
}
.day-btn.selected .day-num { color: var(--accent); }
.day-label {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}
.days-hint { color: var(--muted); font-size: var(--text-sm); }

/* Questions */
.ob-question { display: flex; flex-direction: column; gap: var(--space-2); }
.ob-question-label { font-size: var(--text-base); font-weight: 600; color: var(--text); }
.ob-question-hint { font-size: var(--text-sm); color: var(--muted); margin-top: -4px; }

/* Footer */
.ob-footer {
  padding: var(--space-4) var(--space-5);
  padding-bottom: calc(var(--space-4) + var(--safe-bottom));
  border-top: 1px solid var(--border);
  background: var(--bg);
}

/* Alias step */
.input-alias {
  font-size: var(--text-lg);
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.01em;
}
.ob-alias-warning {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  background: color-mix(in srgb, var(--warning, #f59e0b) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--warning, #f59e0b) 35%, transparent);
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-4);
  color: var(--warning, #f59e0b);
  font-size: var(--text-sm);
  line-height: 1.5;
}
.ob-alias-warning svg { flex-shrink: 0; margin-top: 2px; }
.ob-alias-warning p { color: var(--text-2); }
.ob-alias-warning strong { color: var(--text); }
</style>
