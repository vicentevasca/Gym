<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useTheme } from '@/composables/useTheme'
import { logoReveal, staggerIn, shakeError } from '@/composables/useAnimations'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'

const router = useRouter()
const auth   = useAuthStore()
useTheme()

const form       = reactive({ alias: '', email: '', password: '', confirm: '' })
const loading    = ref(false)
const showPass   = ref(false)
const localError = ref('')

const logoEl   = ref(null)
const formEl   = ref(null)
const fieldsEl = ref([])

onMounted(() => {
  auth.clearError()
  logoReveal(logoEl.value, 0)
  staggerIn(fieldsEl.value, { delay: 0.15, y: 16 })
})

function validate() {
  if (!form.alias.trim())             return 'Escribe cómo quieres que te llame la app.'
  if (!form.email)                    return 'Escribe tu correo electrónico.'
  if (form.password.length < 6)       return 'Mínimo 6 caracteres en la contraseña.'
  if (form.password !== form.confirm) return 'Las contraseñas no coinciden.'
  return null
}

const displayError = () => localError.value || auth.error

async function handleRegister() {
  localError.value = ''
  auth.clearError()
  const err = validate()
  if (err) { localError.value = err; shakeError(formEl.value); return }

  loading.value = true
  try {
    await auth.tryAction(() => auth.register(form.email, form.password, form.alias.trim()))
    router.push('/onboarding')
  } catch {
    shakeError(formEl.value)
  } finally {
    loading.value = false
  }
}

async function handleGoogle() {
  loading.value = true
  try {
    await auth.tryAction(() => auth.loginGoogle())
    router.push(auth.onboardingCompleted ? '/' : '/onboarding')
  } catch { }
  finally { loading.value = false }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-bg" aria-hidden="true">
      <div class="auth-blob auth-blob-1" />
      <div class="auth-blob auth-blob-2" />
    </div>

    <div class="auth-topbar">
      <ThemeToggle />
    </div>

    <div class="auth-inner">

      <div class="auth-logo" ref="logoEl">
        <div class="auth-logo-mark">D</div>
        <div class="auth-logo-text">
          <h1 class="font-display">DISCIPLINA</h1>
          <p class="auth-tagline">Tu versión. Tu app.</p>
        </div>
      </div>

      <form ref="formEl" @submit.prevent="handleRegister" novalidate class="auth-form">

        <div :ref="el => fieldsEl[0] = el" class="input-with-icon">
          <span class="input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </span>
          <input
            v-model="form.alias"
            type="text"
            placeholder="Tu alias (como te llama la app)"
            class="input-field"
            :class="{ error: displayError() }"
            autocomplete="nickname"
            maxlength="30"
          />
        </div>

        <div :ref="el => fieldsEl[1] = el" class="input-with-icon">
          <span class="input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </span>
          <input
            v-model="form.email"
            type="email"
            placeholder="Correo electrónico"
            class="input-field"
            :class="{ error: displayError() }"
            autocomplete="email"
            inputmode="email"
          />
        </div>

        <div :ref="el => fieldsEl[2] = el" class="input-with-icon">
          <span class="input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </span>
          <input
            v-model="form.password"
            :type="showPass ? 'text' : 'password'"
            placeholder="Contraseña (mín. 6 caracteres)"
            class="input-field"
            :class="{ error: displayError() }"
            autocomplete="new-password"
          />
          <button type="button" class="input-action" @click="showPass = !showPass" tabindex="-1">
            <svg v-if="!showPass" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </button>
        </div>

        <div :ref="el => fieldsEl[3] = el" class="input-with-icon">
          <span class="input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 12l2 2 4-4"/><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </span>
          <input
            v-model="form.confirm"
            type="password"
            placeholder="Confirmar contraseña"
            class="input-field"
            :class="{ error: displayError() }"
            autocomplete="new-password"
          />
        </div>

        <Transition name="slide-down">
          <p v-if="displayError()" class="error-text">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {{ displayError() }}
          </p>
        </Transition>

        <div :ref="el => fieldsEl[4] = el">
          <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
            <span v-if="loading" class="spinner" />
            <span v-else>Crear cuenta</span>
          </button>
        </div>

      </form>

      <div :ref="el => fieldsEl[5] = el" class="divider">o continúa con</div>

      <div :ref="el => fieldsEl[6] = el">
        <button class="btn-google btn-full" @click="handleGoogle" :disabled="loading">
          <GoogleIcon />
          <span>Continuar con Google</span>
        </button>
      </div>

      <p :ref="el => fieldsEl[7] = el" class="auth-footer">
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: var(--space-5);
  padding-top: calc(var(--space-12) + var(--safe-top));
  padding-bottom: calc(var(--space-5) + var(--safe-bottom));
  position: relative;
  overflow: hidden;
}
.auth-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.auth-blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.12; }
.auth-blob-1 { width: 400px; height: 400px; background: var(--accent); top: -100px; right: -100px; }
.auth-blob-2 { width: 300px; height: 300px; background: var(--accent-deep); bottom: -80px; left: -80px; opacity: 0.08; }
.auth-topbar { position: fixed; top: calc(var(--space-4) + var(--safe-top)); right: var(--space-4); z-index: 10; }
.auth-inner { width: 100%; max-width: 380px; display: flex; flex-direction: column; gap: var(--space-4); position: relative; z-index: 1; }
.auth-logo { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-2); }
.auth-logo-mark {
  width: 48px; height: 48px; border-radius: var(--radius);
  background: var(--gradient-accent); display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: 24px; font-weight: 500; color: #fff;
  box-shadow: var(--shadow-accent); flex-shrink: 0;
}
.auth-logo h1 { font-size: var(--text-2xl); font-weight: 300; letter-spacing: 0.18em; color: var(--text); line-height: 1; }
.auth-tagline { color: var(--muted); font-size: var(--text-sm); margin-top: 2px; }
.auth-form { display: flex; flex-direction: column; gap: var(--space-3); }
.btn-google {
  display: flex; align-items: center; justify-content: center; gap: var(--space-3);
  height: 52px; border-radius: var(--radius); background: var(--surface);
  border: 1.5px solid var(--border-hi); color: var(--text-2); font-family: var(--font-ui);
  font-weight: 600; font-size: var(--text-sm); letter-spacing: 0.04em; transition: var(--transition);
}
.btn-google:hover { background: var(--card); border-color: var(--border-focus); color: var(--text); }
.btn-google:disabled { opacity: 0.5; pointer-events: none; }
.auth-footer { text-align: center; color: var(--muted); font-size: var(--text-sm); }
.auth-footer a { color: var(--accent); text-decoration: none; font-weight: 600; margin-left: 4px; }
.slide-down-enter-active, .slide-down-leave-active { transition: opacity 0.2s, transform 0.2s; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
