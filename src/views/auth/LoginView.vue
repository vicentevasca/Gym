<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useTheme } from '@/composables/useTheme'
import { logoReveal, staggerIn, shakeError } from '@/composables/useAnimations'
import DitheringShader from '@/components/ui/DitheringShader.vue'

const router = useRouter()
const auth   = useAuthStore()
useTheme()

const form     = reactive({ email: '', password: '' })
const loading  = ref(false)
const showPass = ref(false)

const logoEl   = ref(null)
const formEl   = ref(null)
const fieldsEl = ref([])

onMounted(() => {
  auth.clearError()
  logoReveal(logoEl.value, 0)
  staggerIn(fieldsEl.value, { delay: 0.2, y: 16 })
})

async function handleLogin() {
  if (!form.email || !form.password) {
    shakeError(formEl.value)
    return
  }
  loading.value = true
  try {
    await auth.tryAction(() => auth.login(form.email, form.password))
    router.push(auth.onboardingCompleted ? '/' : '/onboarding')
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
  } catch {
    // error en auth.error
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">

    <!-- ── Fondo WebGL dithering ──────────────────────────── -->
    <div class="auth-shader-bg" aria-hidden="true">
      <DitheringShader
        shape="wave"
        type="8x8"
        colorBack="#04040f"
        colorFront="#6d28d9"
        :pxSize="3"
        :speed="0.55"
      />
    </div>

    <!-- ── Overlay de suavizado ───────────────────────────── -->
    <div class="auth-overlay" aria-hidden="true" />

    <!-- ── Contenido ─────────────────────────────────────── -->
    <div class="auth-inner">

      <!-- Logo -->
      <div class="auth-logo" ref="logoEl">
        <div class="auth-logo-mark">D</div>
        <div class="auth-logo-text">
          <h1 class="font-display">DISCIPLINA</h1>
          <p class="auth-tagline">Entrena el cuerpo. El resto llega solo.</p>
        </div>
      </div>

      <!-- Formulario -->
      <form ref="formEl" @submit.prevent="handleLogin" novalidate class="auth-form">

        <div class="fields-stack">
          <div :ref="el => fieldsEl[0] = el" class="input-with-icon">
            <span class="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </span>
            <input
              v-model="form.email"
              type="email"
              placeholder="Correo electrónico"
              class="input-field"
              :class="{ error: auth.error }"
              autocomplete="email"
              inputmode="email"
            />
          </div>

          <div :ref="el => fieldsEl[1] = el" class="input-with-icon">
            <span class="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            <input
              v-model="form.password"
              :type="showPass ? 'text' : 'password'"
              placeholder="Contraseña"
              class="input-field"
              :class="{ error: auth.error }"
              autocomplete="current-password"
            />
            <button type="button" class="input-action" @click="showPass = !showPass" tabindex="-1">
              <svg v-if="!showPass" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>
        </div>

        <Transition name="slide-down">
          <p v-if="auth.error" class="error-text">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {{ auth.error }}
          </p>
        </Transition>

        <div :ref="el => fieldsEl[2] = el" class="auth-actions">
          <RouterLink to="/forgot-password" class="forgot-link">
            ¿Olvidaste tu contraseña?
          </RouterLink>

          <button type="submit" class="btn-login btn-full" :disabled="loading">
            <span v-if="loading" class="spinner-white" />
            <span v-else>Entrar</span>
          </button>
        </div>

      </form>

      <!-- Divider -->
      <div :ref="el => fieldsEl[3] = el" class="divider">o continúa con</div>

      <!-- Google -->
      <div :ref="el => fieldsEl[4] = el">
        <button class="btn-google btn-full" @click="handleGoogle" :disabled="loading">
          <GoogleIcon />
          <span>Continuar con Google</span>
        </button>
      </div>

      <!-- Footer -->
      <p :ref="el => fieldsEl[5] = el" class="auth-footer">
        ¿Sin cuenta?
        <RouterLink to="/register">Crea una gratis</RouterLink>
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
/* ── Layout ────────────────────────────────────────────────── */
.auth-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-5);
  padding-top:    calc(var(--space-5) + var(--safe-top));
  padding-bottom: calc(var(--space-5) + var(--safe-bottom));
  position: relative;
  overflow: hidden;
  background: #04040f;
}

/* ── WebGL background ──────────────────────────────────────── */
.auth-shader-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* ── Gradient overlay — vignette + legibility ──────────────── */
.auth-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 80% 60% at 50% 100%, rgba(4,4,15,0.7) 0%, transparent 70%),
    radial-gradient(ellipse 60% 40% at 50% 0%,   rgba(4,4,15,0.5) 0%, transparent 60%);
}

/* ── Card container ────────────────────────────────────────── */
.auth-inner {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  position: relative;
  z-index: 1;
}

/* ── Logo ──────────────────────────────────────────────────── */
.auth-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}
.auth-logo-mark {
  width: 48px; height: 48px;
  border-radius: var(--radius);
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 500;
  color: #fff;
  box-shadow: 0 0 24px rgba(109,40,217,0.5);
  flex-shrink: 0;
}
.auth-logo h1 {
  font-size: var(--text-2xl);
  font-weight: 300;
  letter-spacing: 0.18em;
  color: #ffffff;
  line-height: 1;
}
.auth-tagline {
  color: rgba(255,255,255,0.55);
  font-size: var(--text-sm);
  margin-top: 2px;
  letter-spacing: 0.02em;
}

/* ── Form ──────────────────────────────────────────────────── */
.auth-form     { display: flex; flex-direction: column; gap: var(--space-3); }
.fields-stack  { display: flex; flex-direction: column; gap: var(--space-3); }
.auth-actions  { display: flex; flex-direction: column; gap: var(--space-3); }

/* Inputs — glassmorphism sobre el shader */
.auth-inner :deep(.input-with-icon) {
  position: relative;
}
.auth-inner :deep(.input-icon) {
  color: rgba(255,255,255,0.45);
}
.auth-inner :deep(.input-field) {
  background: rgba(255,255,255,0.08);
  border: 1.5px solid rgba(255,255,255,0.18);
  color: #ffffff;
  caret-color: #a78bfa;
  border-radius: var(--radius);
  height: 52px;
  padding: 0 var(--space-4) 0 44px;
  font-size: var(--text-base);
  transition: border-color 0.2s, background 0.2s;
  width: 100%;
  box-sizing: border-box;
}
.auth-inner :deep(.input-field::placeholder) {
  color: rgba(255,255,255,0.35);
}
.auth-inner :deep(.input-field:focus) {
  outline: none;
  border-color: rgba(167,139,250,0.7);
  background: rgba(255,255,255,0.12);
}
.auth-inner :deep(.input-field.error) {
  border-color: rgba(248,113,113,0.7);
}
.auth-inner :deep(.input-action) {
  color: rgba(255,255,255,0.4);
}
.auth-inner :deep(.input-action:hover) {
  color: rgba(255,255,255,0.8);
}

/* ── Forgot link ───────────────────────────────────────────── */
.forgot-link {
  align-self: flex-end;
  color: rgba(255,255,255,0.45);
  font-size: var(--text-sm);
  text-decoration: none;
  transition: color 0.2s;
}
.forgot-link:hover { color: #c4b5fd; }

/* ── Login button ──────────────────────────────────────────── */
.btn-login {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 52px;
  border-radius: var(--radius);
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  border: none;
  color: #fff;
  font-family: var(--font-ui);
  font-size: var(--text-base);
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(109,40,217,0.45);
  transition: filter 0.2s, box-shadow 0.2s;
}
.btn-login:hover:not(:disabled) {
  filter: brightness(1.12);
  box-shadow: 0 6px 28px rgba(109,40,217,0.6);
}
.btn-login:disabled { opacity: 0.55; pointer-events: none; }

.spinner-white {
  width: 18px; height: 18px;
  border: 2.5px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Error text ────────────────────────────────────────────── */
.error-text {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: #fca5a5;
  padding: var(--space-2) var(--space-3);
  background: rgba(248,113,113,0.1);
  border: 1px solid rgba(248,113,113,0.25);
  border-radius: var(--radius-sm);
}

/* ── Divider ───────────────────────────────────────────────── */
.divider {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255,255,255,0.12);
}

/* ── Google button ─────────────────────────────────────────── */
.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  height: 52px;
  border-radius: var(--radius);
  background: rgba(255,255,255,0.07);
  border: 1.5px solid rgba(255,255,255,0.18);
  color: rgba(255,255,255,0.85);
  font-family: var(--font-ui);
  font-weight: 600;
  font-size: var(--text-sm);
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.btn-google:hover:not(:disabled) {
  background: rgba(255,255,255,0.13);
  border-color: rgba(255,255,255,0.3);
  color: #fff;
}
.btn-google:disabled { opacity: 0.5; pointer-events: none; }

/* ── Footer ────────────────────────────────────────────────── */
.auth-footer {
  text-align: center;
  color: rgba(255,255,255,0.4);
  font-size: var(--text-sm);
}
.auth-footer a {
  color: #c4b5fd;
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
  transition: color 0.2s;
}
.auth-footer a:hover { color: #a78bfa; text-decoration: underline; }

/* ── btn-full util ─────────────────────────────────────────── */
.btn-full { width: 100%; }

/* ── Transition error ──────────────────────────────────────── */
.slide-down-enter-active, .slide-down-leave-active {
  transition: opacity 0.2s, transform 0.2s;
  overflow: hidden;
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
