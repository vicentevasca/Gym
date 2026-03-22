<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { gsap } from 'gsap'

const auth    = useAuthStore()
const email   = ref('')
const loading = ref(false)
const sent    = ref(false)
const container = ref(null)

onMounted(() => {
  auth.clearError()
  gsap.from(container.value, { opacity: 0, y: 24, duration: 0.5, ease: 'power2.out' })
})

async function handleReset() {
  if (!email.value) return
  loading.value = true
  try {
    await auth.forgotPassword(email.value)
    sent.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div ref="container" class="auth-inner">

      <RouterLink to="/login" class="back-link">← Volver</RouterLink>

      <div class="auth-logo">
        <h1 class="font-display">DISCIPLINA</h1>
      </div>

      <template v-if="!sent">
        <p class="auth-subtitle">Escribe tu correo y te enviamos un link para restablecer tu contraseña.</p>

        <form @submit.prevent="handleReset" class="auth-form" novalidate>
          <input
            v-model="email"
            type="email"
            placeholder="Correo electrónico"
            class="input-field"
            :class="{ error: auth.error }"
            inputmode="email"
            autocomplete="email"
          />
          <p v-if="auth.error" class="error-text">{{ auth.error }}</p>
          <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
            <span v-if="loading" class="spinner" />
            <span v-else>Enviar link</span>
          </button>
        </form>
      </template>

      <div v-else class="sent-state">
        <div class="sent-icon">✓</div>
        <p class="sent-title">Revisa tu correo</p>
        <p class="sent-body">Enviamos un link a <strong>{{ email }}</strong>. Puede tardar unos minutos.</p>
        <RouterLink to="/login" class="btn btn-ghost btn-full" style="margin-top: 16px; text-align: center; text-decoration: none;">
          Volver al login
        </RouterLink>
      </div>

    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
  padding-top: calc(24px + var(--safe-top));
  padding-bottom: calc(24px + var(--safe-bottom));
  background: var(--bg);
}
.auth-inner {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.back-link {
  color: var(--muted);
  font-size: 14px;
  text-decoration: none;
  transition: color 0.2s;
}
.back-link:hover { color: var(--text); }
.auth-logo { text-align: center; }
.auth-logo h1 {
  font-size: 36px;
  font-weight: 300;
  letter-spacing: 0.2em;
  color: var(--accent);
}
.auth-subtitle {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
}
.auth-form { display: flex; flex-direction: column; gap: 12px; }
.sent-state { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.sent-icon {
  width: 56px; height: 56px;
  background: var(--accent-dim);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
  color: var(--accent);
}
.sent-title { font-size: 18px; font-weight: 600; }
.sent-body { color: var(--muted); font-size: 14px; line-height: 1.6; }
.sent-body strong { color: var(--text); }
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
