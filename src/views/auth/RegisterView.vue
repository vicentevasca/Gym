<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { gsap } from 'gsap'

const router = useRouter()
const auth   = useAuthStore()

const form       = reactive({ alias: '', email: '', password: '', confirm: '' })
const loading    = ref(false)
const localError = ref('')
const container  = ref(null)

onMounted(() => {
  auth.clearError()
  gsap.from(container.value, { opacity: 0, y: 24, duration: 0.5, ease: 'power2.out' })
})

function validate() {
  if (!form.alias.trim())             return 'Escribe cómo quieres que te llame la app.'
  if (!form.email)                    return 'Escribe tu correo electrónico.'
  if (form.password.length < 6)       return 'La contraseña debe tener al menos 6 caracteres.'
  if (form.password !== form.confirm) return 'Las contraseñas no coinciden.'
  return null
}

const displayError = () => localError.value || auth.error

async function handleRegister() {
  localError.value = ''
  auth.clearError()
  const err = validate()
  if (err) { localError.value = err; return }

  loading.value = true
  try {
    await auth.tryAction(() => auth.register(form.email, form.password, form.alias.trim()))
    router.push('/onboarding')
  } catch {
    // error ya en auth.error
  } finally {
    loading.value = false
  }
}

async function handleGoogle() {
  loading.value = true
  try {
    await auth.tryAction(() => auth.loginGoogle())
    router.push(auth.onboardingCompleted ? '/' : '/onboarding')
  } catch {
    // error ya en auth.error
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div ref="container" class="auth-inner">

      <div class="auth-logo">
        <h1 class="font-display">DISCIPLINA</h1>
        <p class="auth-tagline">Tu app. Tu versión.</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form" novalidate>
        <input
          v-model="form.alias"
          type="text"
          placeholder="¿Cómo te llamas? (alias)"
          class="input-field"
          :class="{ error: displayError() }"
          autocomplete="nickname"
          maxlength="30"
        />
        <input
          v-model="form.email"
          type="email"
          placeholder="Correo electrónico"
          class="input-field"
          :class="{ error: displayError() }"
          autocomplete="email"
          inputmode="email"
        />
        <input
          v-model="form.password"
          type="password"
          placeholder="Contraseña (mín. 6 caracteres)"
          class="input-field"
          :class="{ error: displayError() }"
          autocomplete="new-password"
        />
        <input
          v-model="form.confirm"
          type="password"
          placeholder="Confirmar contraseña"
          class="input-field"
          :class="{ error: displayError() }"
          autocomplete="new-password"
        />

        <p v-if="displayError()" class="error-text">{{ displayError() }}</p>

        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
          <span v-if="loading" class="spinner" />
          <span v-else>Crear cuenta</span>
        </button>
      </form>

      <div class="divider">o</div>

      <button class="btn btn-ghost btn-full" @click="handleGoogle" :disabled="loading">
        <GoogleIcon />
        Continuar con Google
      </button>

      <p class="auth-footer">
        ¿Ya tienes cuenta?
        <RouterLink to="/login">Inicia sesión</RouterLink>
      </p>

    </div>
  </div>
</template>

<script>
const GoogleIcon = {
  template: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>`,
}
export default { components: { GoogleIcon } }
</script>

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
  gap: 12px;
}
.auth-logo { text-align: center; margin-bottom: 8px; }
.auth-logo h1 {
  font-size: 36px;
  font-weight: 300;
  letter-spacing: 0.2em;
  color: var(--accent);
}
.auth-tagline { color: var(--muted); font-size: 13px; margin-top: 4px; letter-spacing: 0.05em; }
.auth-form { display: flex; flex-direction: column; gap: 10px; }
.auth-footer { text-align: center; color: var(--muted); font-size: 14px; }
.auth-footer a { color: var(--accent); text-decoration: none; font-weight: 600; }
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
