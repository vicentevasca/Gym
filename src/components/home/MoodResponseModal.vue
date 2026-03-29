<script setup>
import { computed, onMounted, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import { MOOD_RESPONSES } from '@/utils/homeContent'

const props = defineProps({
  mood:     { type: Number, required: true },
  userName: { type: String, default: '' },
  streak:   { type: Number, default: 0 },
})

const emit   = defineEmits(['close'])
const router = useRouter()
const sheet  = ref(null)

const response = computed(() => MOOD_RESPONSES[props.mood] || MOOD_RESPONSES[3])

const personalizedMessage = computed(() => {
  const name = props.userName || 'amig@'
  return (response.value.message || '').replace('{name}', name)
})

const isSupport   = computed(() => response.value.type === 'support')
const isCelebrate = computed(() => response.value.type === 'celebrate')

const SUPPORT_ICONS = ['🌬️', '🚶', '✍️']

onMounted(() => {
  nextTick(() => {
    gsap.from(sheet.value, {
      y: '100%',
      duration: 0.45,
      ease: 'power3.out',
    })
  })
})

function close() {
  gsap.to(sheet.value, {
    y: '100%',
    duration: 0.3,
    ease: 'power2.in',
    onComplete: () => emit('close'),
  })
}

function goTrain() {
  close()
  setTimeout(() => router.push('/training'), 350)
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="close">
      <div ref="sheet" class="modal-sheet">

        <!-- ── HEADER ──────────────────────────────────────────── -->
        <div
          class="modal-header"
          :class="{
            'modal-header--support':   isSupport,
            'modal-header--neutral':   response.type === 'neutral',
            'modal-header--celebrate': isCelebrate,
          }"
        >
          <!-- Celebration burst emojis -->
          <div v-if="isCelebrate" class="burst" aria-hidden="true">
            <span class="burst-emoji burst-1">🎉</span>
            <span class="burst-emoji burst-2">⚡</span>
            <span class="burst-emoji burst-3">🔥</span>
            <span class="burst-emoji burst-4">✨</span>
          </div>

          <p class="modal-header-label label-caps">Estado de ánimo</p>
          <h2 class="modal-title">{{ response.title }}</h2>
        </div>

        <!-- ── BODY ────────────────────────────────────────────── -->
        <div class="modal-body">

          <!-- Mensaje personalizado -->
          <p class="modal-message">{{ personalizedMessage }}</p>

          <!-- Quote -->
          <div v-if="response.quote" class="modal-quote">
            <span class="modal-quote-mark">"</span>
            <p class="modal-quote-text">{{ response.quote.text }}</p>
            <p class="modal-quote-author label-caps">— {{ response.quote.author }}</p>
          </div>

          <!-- ── SOPORTE: acciones ──────────────────────────── -->
          <template v-if="isSupport">
            <p class="section-mini-label label-caps">Para este momento</p>
            <div class="action-list">
              <div
                v-for="(action, i) in response.actions"
                :key="i"
                class="action-card"
              >
                <span class="action-icon">{{ SUPPORT_ICONS[i] }}</span>
                <p class="action-text">{{ action }}</p>
              </div>
            </div>

            <p v-if="response.affirmation" class="modal-affirmation">
              {{ response.affirmation }}
            </p>

            <p v-if="streak > 0" class="streak-note">
              Tu racha de <strong>{{ streak }} días</strong> muestra de qué estás hecho/a.
            </p>
          </template>

          <!-- ── NEUTRAL: tip ────────────────────────────────── -->
          <template v-if="response.type === 'neutral'">
            <div v-if="response.tip" class="neutral-tip">
              <span class="neutral-tip-icon">💡</span>
              <p class="neutral-tip-text">{{ response.tip }}</p>
            </div>
          </template>

          <!-- ── CELEBRACIÓN: streak + CTA ─────────────────── -->
          <template v-if="isCelebrate">
            <div v-if="streak > 0" class="streak-badge-big">
              <span class="streak-fire">🔥</span>
              <span class="streak-number">{{ streak }}</span>
              <span class="streak-label">días de racha</span>
            </div>
            <p v-if="response.cta" class="celebrate-cta">{{ response.cta }}</p>
          </template>

        </div>

        <!-- ── FOOTER ──────────────────────────────────────────── -->
        <div class="modal-footer">
          <template v-if="isCelebrate">
            <button type="button" class="btn btn-primary modal-cta-btn" @click="goTrain">
              ¡Vamos a entrenar! 💪
            </button>
            <button type="button" class="modal-close-link" @click="close">
              Cerrar
            </button>
          </template>
          <template v-else>
            <button type="button" class="btn btn-secondary modal-close-btn" @click="close">
              {{ isSupport ? 'Gracias, lo tendré en cuenta' : 'Cerrar' }}
            </button>
          </template>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── Overlay ──────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

/* ── Sheet ────────────────────────────────────────────────────────────── */
.modal-sheet {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background: var(--surface);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  overflow: hidden;
  max-height: 90dvh;
  display: flex;
  flex-direction: column;
}

/* ── Header ───────────────────────────────────────────────────────────── */
.modal-header {
  position: relative;
  padding: var(--space-7) var(--space-6) var(--space-6);
  overflow: hidden;
}

.modal-header--support {
  background: linear-gradient(135deg, #3b4a6b 0%, #2d3748 100%);
}

.modal-header--neutral {
  background: linear-gradient(135deg, var(--faint) 0%, var(--card) 100%);
}

.modal-header--celebrate {
  background: linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%);
}

.modal-header-label {
  color: rgba(255, 255, 255, 0.65);
  margin-bottom: var(--space-2);
  font-size: 10px;
}

.modal-header--neutral .modal-header-label {
  color: var(--muted);
}

.modal-title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  margin: 0;
}

.modal-header--neutral .modal-title {
  color: var(--text);
}

/* ── Celebration burst ────────────────────────────────────────────────── */
.burst {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.burst-emoji {
  position: absolute;
  font-size: 24px;
  animation: burst-float 2s ease-in-out infinite;
}

.burst-1 { top: 10%; left: 15%; animation-delay: 0s; }
.burst-2 { top: 20%; right: 20%; animation-delay: 0.4s; }
.burst-3 { bottom: 25%; left: 60%; animation-delay: 0.8s; }
.burst-4 { top: 40%; right: 10%; animation-delay: 1.2s; }

@keyframes burst-float {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
  50%       { transform: translateY(-12px) rotate(15deg); opacity: 1; }
}

/* ── Body ─────────────────────────────────────────────────────────────── */
.modal-body {
  padding: var(--space-5) var(--space-6);
  overflow-y: auto;
  flex: 1;
}

.modal-message {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text);
  line-height: 1.7;
  margin-bottom: var(--space-5);
}

/* ── Quote ────────────────────────────────────────────────────────────── */
.modal-quote {
  background: var(--faint);
  border-left: 3px solid var(--accent);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  padding: var(--space-4) var(--space-4);
  margin-bottom: var(--space-5);
  position: relative;
}

.modal-quote-mark {
  font-family: var(--font-display);
  font-size: 48px;
  line-height: 0.5;
  color: var(--accent);
  display: block;
  margin-bottom: var(--space-2);
  opacity: 0.7;
}

.modal-quote-text {
  font-family: var(--font-verse);
  font-size: var(--text-sm);
  color: var(--text);
  line-height: 1.7;
  font-style: italic;
  margin-bottom: var(--space-2);
}

.modal-quote-author {
  color: var(--muted);
  font-size: 10px;
}

/* ── Acciones (soporte) ───────────────────────────────────────────────── */
.section-mini-label {
  color: var(--muted);
  font-size: 10px;
  margin-bottom: var(--space-3);
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.action-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  background: var(--faint);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
}

.action-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 1px;
}

.action-text {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text);
  line-height: 1.5;
}

/* ── Afirmación ───────────────────────────────────────────────────────── */
.modal-affirmation {
  font-family: var(--font-verse);
  font-size: var(--text-md);
  font-style: italic;
  color: var(--text);
  text-align: center;
  line-height: 1.6;
  padding: var(--space-4) var(--space-3);
  margin-bottom: var(--space-3);
}

.streak-note {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--muted);
  text-align: center;
  padding: var(--space-2) 0;
}

/* ── Neutral tip ──────────────────────────────────────────────────────── */
.neutral-tip {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  background: var(--faint-2, var(--faint));
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-top: var(--space-2);
}

.neutral-tip-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.neutral-tip-text {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text);
  line-height: 1.5;
}

/* ── Streak badge (celebración) ───────────────────────────────────────── */
.streak-badge-big {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  background: var(--accent-dim);
  border: 2px solid var(--accent);
  border-radius: var(--radius-full);
  padding: var(--space-2) var(--space-5);
  margin: var(--space-4) auto;
  width: fit-content;
}

.streak-fire   { font-size: 22px; }
.streak-number {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: 900;
  color: var(--accent);
  line-height: 1;
}
.streak-label {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--accent);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.celebrate-cta {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--muted);
  text-align: center;
  line-height: 1.5;
  padding: 0 var(--space-2);
}

/* ── Footer ───────────────────────────────────────────────────────────── */
.modal-footer {
  padding: var(--space-4) var(--space-6) var(--space-7);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  border-top: 1px solid var(--border);
}

.modal-close-btn {
  width: 100%;
  font-size: var(--text-sm);
}

.modal-cta-btn {
  width: 100%;
}

.modal-close-link {
  background: none;
  border: none;
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--muted);
  cursor: pointer;
  text-align: center;
  padding: var(--space-1);
  -webkit-tap-highlight-color: transparent;
}

.modal-close-link:hover {
  color: var(--text);
}
</style>
