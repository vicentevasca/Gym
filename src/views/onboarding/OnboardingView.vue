<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { gsap } from 'gsap'
import { useProfileStore } from '@/stores/profile.store'
import { useAuthStore } from '@/stores/auth.store'

const router  = useRouter()
const profile = useProfileStore()
const auth    = useAuthStore()

const step    = ref(0)
const loading = ref(false)
const content = ref(null)

const TOTAL_STEPS = 4

// Datos del onboarding
const data = ref({
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
  gsap.from(content.value, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' })
})

function animateStep() {
  gsap.fromTo(content.value,
    { opacity: 0, x: 30 },
    { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' }
  )
}

function next() {
  if (step.value < TOTAL_STEPS - 1) {
    step.value++
    animateStep()
  }
}

function prev() {
  if (step.value > 0) {
    step.value--
    animateStep()
  }
}

async function finish() {
  loading.value = true
  try {
    await profile.updateProfile({
      biometrics: {
        weight_kg: Number(data.value.weight_kg),
        height_cm: Number(data.value.height_cm),
        dob: data.value.dob,
        sex: data.value.sex,
      },
      goals: {
        primary_goal: data.value.primary_goal,
      },
      activity_level: data.value.activity_level,
      training_prefs: {
        gym_days_per_week: data.value.gym_days_per_week,
      },
      personal: {
        why_joined: data.value.why_joined,
        desired_self: data.value.desired_self,
      },
      onboarding_completed: true,
    })
    router.push('/')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="onboarding-page">

    <!-- Progreso -->
    <div class="ob-progress">
      <div
        class="ob-progress-fill"
        :style="{ width: ((step + 1) / TOTAL_STEPS * 100) + '%' }"
      />
    </div>

    <!-- Contenido -->
    <div class="ob-content" ref="content">

      <!-- Paso 0: Tu cuerpo -->
      <div v-if="step === 0" class="ob-step">
        <p class="ob-step-num">01 / {{ TOTAL_STEPS }}</p>
        <h2 class="ob-title font-display">Tu cuerpo</h2>
        <p class="ob-subtitle">Datos básicos para calcular tus métricas.</p>

        <div class="ob-fields">
          <div class="ob-row">
            <div class="ob-field">
              <label class="ob-label">Peso (kg)</label>
              <input v-model="data.weight_kg" type="number" inputmode="decimal" placeholder="75" class="input-field" />
            </div>
            <div class="ob-field">
              <label class="ob-label">Altura (cm)</label>
              <input v-model="data.height_cm" type="number" inputmode="decimal" placeholder="178" class="input-field" />
            </div>
          </div>

          <div class="ob-field">
            <label class="ob-label">Fecha de nacimiento</label>
            <input v-model="data.dob" type="date" class="input-field" />
          </div>

          <div class="ob-field">
            <label class="ob-label">Sexo biológico (para TDEE)</label>
            <div class="ob-options">
              <button
                v-for="opt in ['masculino', 'femenino']"
                :key="opt"
                class="ob-option"
                :class="{ selected: data.sex === opt }"
                @click="data.sex = opt"
              >{{ opt }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Paso 1: Tu objetivo -->
      <div v-if="step === 1" class="ob-step">
        <p class="ob-step-num">02 / {{ TOTAL_STEPS }}</p>
        <h2 class="ob-title font-display">Tu objetivo</h2>
        <p class="ob-subtitle">¿Qué quieres lograr principalmente?</p>

        <div class="ob-fields">
          <div class="ob-options ob-options-col">
            <button
              v-for="opt in [
                { value: 'perder_grasa',      label: 'Perder grasa' },
                { value: 'ganar_musculo',     label: 'Ganar músculo' },
                { value: 'recomposicion',     label: 'Recomposición corporal' },
                { value: 'mantener',          label: 'Mantener peso y mejorar' },
                { value: 'rendimiento',       label: 'Mejorar rendimiento' },
              ]"
              :key="opt.value"
              class="ob-option ob-option-full"
              :class="{ selected: data.primary_goal === opt.value }"
              @click="data.primary_goal = opt.value"
            >{{ opt.label }}</button>
          </div>

          <div class="ob-field" style="margin-top: 20px;">
            <label class="ob-label">Nivel de actividad (sin gym)</label>
            <div class="ob-options ob-options-col">
              <button
                v-for="opt in [
                  { value: 'sedentario',  label: 'Sedentario (trabajo de escritorio)' },
                  { value: 'ligero',      label: 'Ligero (camino algo)' },
                  { value: 'moderado',    label: 'Moderado (activo en el día)' },
                  { value: 'muy_activo',  label: 'Muy activo (trabajo físico)' },
                ]"
                :key="opt.value"
                class="ob-option ob-option-full"
                :class="{ selected: data.activity_level === opt.value }"
                @click="data.activity_level = opt.value"
              >{{ opt.label }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Paso 2: Tu gym -->
      <div v-if="step === 2" class="ob-step">
        <p class="ob-step-num">03 / {{ TOTAL_STEPS }}</p>
        <h2 class="ob-title font-display">Tu gym</h2>
        <p class="ob-subtitle">¿Cuántos días a la semana entrenas?</p>

        <div class="ob-fields">
          <div class="days-selector">
            <button
              v-for="d in [2, 3, 4, 5, 6]"
              :key="d"
              class="day-btn"
              :class="{ selected: data.gym_days_per_week === d }"
              @click="data.gym_days_per_week = d"
            >{{ d }}</button>
          </div>
          <p class="ob-hint">{{ data.gym_days_per_week }} días / semana</p>
        </div>
      </div>

      <!-- Paso 3: Lo personal -->
      <div v-if="step === 3" class="ob-step">
        <p class="ob-step-num">04 / {{ TOTAL_STEPS }}</p>
        <h2 class="ob-title font-display">Lo que importa</h2>
        <p class="ob-subtitle">Solo tú y la app lo saben. Sin respuesta incorrecta.</p>

        <div class="ob-fields">
          <div class="ob-field">
            <label class="ob-label">¿Qué te trajo aquí?</label>
            <textarea
              v-model="data.why_joined"
              placeholder="Puede ser una sola palabra."
              class="input-field ob-textarea"
              rows="3"
            />
          </div>

          <div class="ob-field">
            <label class="ob-label">¿Qué versión de ti mismo quieres ser?</label>
            <textarea
              v-model="data.desired_self"
              placeholder="No tiene que ser perfecta la respuesta."
              class="input-field ob-textarea"
              rows="3"
            />
          </div>
        </div>
      </div>

    </div>

    <!-- Navegación -->
    <div class="ob-nav">
      <button v-if="step > 0" class="btn btn-ghost" @click="prev">← Atrás</button>
      <div v-else />

      <button
        v-if="step < TOTAL_STEPS - 1"
        class="btn btn-primary"
        @click="next"
      >Siguiente →</button>

      <button
        v-else
        class="btn btn-primary"
        :disabled="loading"
        @click="finish"
      >
        <span v-if="loading" class="spinner" />
        <span v-else>Empezar →</span>
      </button>
    </div>

  </div>
</template>

<style scoped>
.onboarding-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  padding-top: var(--safe-top);
  padding-bottom: calc(var(--safe-bottom) + 20px);
}

.ob-progress {
  height: 2px;
  background: var(--faint);
  flex-shrink: 0;
}
.ob-progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.4s ease;
}

.ob-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px 20px 16px;
}

.ob-step { display: flex; flex-direction: column; gap: 4px; }
.ob-step-num { font-size: 11px; letter-spacing: 0.15em; color: var(--accent); text-transform: uppercase; }
.ob-title { font-size: 32px; font-weight: 300; margin-top: 4px; }
.ob-subtitle { color: var(--muted); font-size: 14px; margin-top: 6px; line-height: 1.6; }
.ob-fields { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; }
.ob-label { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; display: block; }
.ob-field { display: flex; flex-direction: column; }
.ob-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ob-hint { color: var(--muted); font-size: 13px; text-align: center; }
.ob-textarea { resize: none; line-height: 1.6; }

.ob-options { display: flex; flex-wrap: wrap; gap: 8px; }
.ob-options-col { flex-direction: column; }

.ob-option {
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  font-family: var(--font-ui);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  text-transform: capitalize;
}
.ob-option:active { transform: scale(0.97); }
.ob-option.selected {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-dim);
}
.ob-option-full { text-align: left; }

.days-selector {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 8px;
}
.day-btn {
  width: 52px; height: 52px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font-ui);
  transition: all 0.15s;
}
.day-btn.selected {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-dim);
}

.ob-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  padding-bottom: calc(16px + var(--safe-bottom));
  border-top: 1px solid var(--border);
  gap: 12px;
}

.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(5,5,8,0.3);
  border-top-color: #050508;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
