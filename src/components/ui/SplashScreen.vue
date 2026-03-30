<script setup>
import { ref, onMounted } from 'vue'
import { gsap } from 'gsap'
import DitheringShader from './DitheringShader.vue'
import LumaSpin        from './LumaSpin.vue'

const splashEl   = ref(null)
const logoEl     = ref(null)
const spinnerEl  = ref(null)
const subtitleEl = ref(null)
const visible    = ref(true)

// ── Entrada: se expande desde el centro hacia arriba y abajo ──
onMounted(() => {
  // Contenido oculto inicialmente
  gsap.set([logoEl.value, spinnerEl.value, subtitleEl.value], { opacity: 0 })
  gsap.set(logoEl.value,    { y: 10 })
  gsap.set(spinnerEl.value, { scale: 0.7 })

  const tl = gsap.timeline()

  // 1. El panel se abre desde el centro — clip-path ya está en inset(50% 0 50% 0)
  tl.to(splashEl.value, {
    clipPath: 'inset(0% 0% 0% 0%)',
    duration: 0.55,
    ease: 'power4.out',
  })

  // 2. Contenido aparece una vez que el panel está abierto
  tl.to(logoEl.value, {
    opacity: 1, y: 0,
    duration: 0.45,
    ease: 'power3.out',
  }, '-=0.1')

  tl.to(spinnerEl.value, {
    opacity: 1, scale: 1,
    duration: 0.4,
    ease: 'back.out(1.5)',
  }, '-=0.25')

  tl.to(subtitleEl.value, {
    opacity: 1,
    duration: 0.3,
    ease: 'power2.out',
  }, '-=0.15')
})

// ── Salida: contenido se desvanece, panel se contrae al centro ─
async function dismiss() {
  return new Promise(resolve => {
    const tl = gsap.timeline({
      onComplete: () => {
        visible.value = false
        resolve()
      },
    })

    // 1. Subtítulo y spinner se apagan rápido
    tl.to([subtitleEl.value, spinnerEl.value], {
      opacity: 0, scale: 0.4,
      duration: 0.28,
      ease: 'power3.in',
      stagger: 0.04,
    })

    // 2. Logo se expande ligeramente y desaparece
    tl.to(logoEl.value, {
      opacity: 0,
      letterSpacing: '0.38em',
      duration: 0.32,
      ease: 'power2.inOut',
    }, '-=0.1')

    // 3. Panel se contrae de vuelta al centro
    tl.to(splashEl.value, {
      clipPath: 'inset(50% 0% 50% 0%)',
      duration: 0.55,
      ease: 'power4.inOut',
    }, '+=0.05')
  })
}

defineExpose({ dismiss })
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="splashEl"
      class="splash-root"
    >
      <!-- Shader — idéntico al login -->
      <div class="splash-shader">
        <DitheringShader
          shape="wave"
          type="8x8"
          colorBack="#04040f"
          colorFront="#6d28d9"
          :pxSize="3"
          :speed="0.45"
        />
      </div>

      <!-- Vignette -->
      <div class="splash-overlay" />

      <!-- Contenido -->
      <div class="splash-center">

        <div ref="logoEl" class="splash-logo">
          <div class="splash-mark">D</div>
          <span class="splash-wordmark">DISCIPLINA</span>
        </div>

        <div ref="spinnerEl" class="splash-spinner">
          <LumaSpin :size="58" color="rgba(167,139,250,0.9)" />
        </div>

        <p ref="subtitleEl" class="splash-sub">Cargando tu sesión…</p>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.splash-root {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  /* Mobile: usa toda la altura incluyendo notch / barra inferior */
  height: 100dvh;
  z-index: 9999;
  overflow: hidden;
  will-change: clip-path;
  /* Estado inicial: colapsado en la línea central */
  clip-path: inset(50% 0% 50% 0%);
}

.splash-shader {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.splash-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 80% 50% at 50% 100%, rgba(4,4,15,0.7) 0%, transparent 70%),
    radial-gradient(ellipse 60% 40% at 50% 0%,   rgba(4,4,15,0.55) 0%, transparent 60%);
}

.splash-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  /* Safe areas para notch y barra home */
  padding-top:    env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

.splash-logo {
  display: flex;
  align-items: center;
  gap: 13px;
}

.splash-mark {
  width: 50px;
  height: 50px;
  border-radius: 13px;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display, sans-serif);
  font-size: 25px;
  font-weight: 500;
  color: #fff;
  box-shadow:
    0 0 28px rgba(109, 40, 217, 0.6),
    0 0 56px rgba(109, 40, 217, 0.2);
  flex-shrink: 0;
}

.splash-wordmark {
  font-family: var(--font-display, sans-serif);
  font-size: 26px;
  font-weight: 200;
  letter-spacing: 0.22em;
  color: #ffffff;
  line-height: 1;
  text-shadow: 0 0 36px rgba(167, 139, 250, 0.45);
}

.splash-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.splash-sub {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.28);
}
</style>
