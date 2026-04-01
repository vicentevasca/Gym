<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'

const emit = defineEmits(['close'])

// ── Config desde .env ─────────────────────────────────────────────
const AI_URL = import.meta.env.VITE_AI_URL || 'http://192.168.1.7:8000/chat'
const AI_KEY = import.meta.env.VITE_AI_KEY  || ''


// ── Estado ────────────────────────────────────────────────────────
const messages   = ref([])       // { id, role: 'user'|'ai', text }
const input      = ref('')
const sending    = ref(false)
const aiTyping   = ref(false)
const offline    = ref(false)    // no se pudo conectar
const messagesEl = ref(null)
const inputEl    = ref(null)
const overlay    = ref(null)
const panel      = ref(null)

// ── Animación entrada ─────────────────────────────────────────────
onMounted(() => {
  gsap.from(overlay.value, { opacity: 0, duration: 0.25 })
  gsap.from(panel.value,   { y: '100%', duration: 0.42, ease: 'expo.out', delay: 0.05 })
  nextTick(() => inputEl.value?.focus())
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => window.removeEventListener('keydown', onKeyDown))

async function close() {
  await Promise.all([
    gsap.to(overlay.value, { opacity: 0, duration: 0.2 }),
    gsap.to(panel.value,   { y: '100%', duration: 0.3, ease: 'power3.in' }),
  ])
  emit('close')
}

// Cierre con Escape — solo si el foco NO está en el textarea
function onKeyDown(e) {
  if (e.key === 'Escape' && document.activeElement !== inputEl.value) close()
}

// ── Scroll al último mensaje ──────────────────────────────────────
async function scrollToBottom() {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTo({ top: messagesEl.value.scrollHeight, behavior: 'smooth' })
  }
}

// ── Enviar mensaje ────────────────────────────────────────────────
async function send() {
  const text = input.value.trim()
  if (!text || sending.value) return

  offline.value = false
  input.value   = ''
  sending.value = true

  // Agregar mensaje del usuario
  messages.value.push({ id: Date.now(), role: 'user', text })
  await scrollToBottom()

  // Indicador "escribiendo..."
  aiTyping.value = true
  await scrollToBottom()

  try {
    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), 120_000) // 2 min — LLMs locales pueden tardar

    const res = await fetch(AI_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${AI_KEY}`,
      },
      body:   JSON.stringify({ message: text }),
      signal: controller.signal,
    })
    clearTimeout(tid)

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()

    // Manejar distintos formatos de respuesta
    const reply =
      data?.response  ??
      data?.message   ??
      data?.text      ??
      data?.content   ??
      data?.answer    ??
      (typeof data === 'string' ? data : null)

    aiTyping.value = false
    messages.value.push({
      id:   Date.now() + 1,
      role: 'ai',
      text: reply ?? '(sin respuesta)',
    })
  } catch (err) {
    aiTyping.value = false
    offline.value  = true

    // Detectar causa específica del error
    let errorText = ''
    const msg = err?.message ?? ''

    if (msg.startsWith('HTTP ')) {
      errorText = `Error del servidor: ${msg}. Revisa los logs de tu LLM.`
    } else if (
      msg.toLowerCase().includes('failed to fetch') ||
      msg.toLowerCase().includes('network') ||
      err?.name === 'TypeError'
    ) {
      errorText =
        'Error de CORS — el navegador bloqueó la petición.\n' +
        'Agrega los headers CORS en tu servidor LLM (ver instrucciones en el chat).'
      messages.value.push({
        id:   Date.now() + 1,
        role: 'cors-help',
        text: '',
      })
    } else if (err?.name === 'AbortError') {
      errorText = 'La petición tardó demasiado (timeout). ¿Está cargando el modelo?'
    } else {
      errorText = `Error: ${msg || 'desconocido'}`
    }

    messages.value.push({
      id:   Date.now() + 1,
      role: 'error',
      text: errorText,
    })
  } finally {
    sending.value = false
    await scrollToBottom()
    await nextTick()
    inputEl.value?.focus()
  }
}

function clearChat() {
  messages.value = []
  offline.value  = false
}

function onEnter(e) {
  // Solo actúa en Enter — Shift+Enter permite salto de línea
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

function sendSuggestion(text) {
  input.value = text
  nextTick(() => send())
}
</script>

<template>
  <Teleport to="body">
    <!-- Overlay -->
    <div class="ai-overlay" ref="overlay" @click.self="close">

      <!-- Panel -->
      <div class="ai-panel" ref="panel">

        <!-- Header -->
        <div class="ai-header">
          <div class="ai-header-left">
            <div class="ai-icon-wrap">
              <!-- Sparkle / IA icon -->
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/>
                <path d="M19 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" opacity=".6"/>
                <path d="M4 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" opacity=".4"/>
              </svg>
            </div>
            <div>
              <p class="ai-title">ARIA</p>
              <p class="ai-status" :class="{ offline: offline }">
                <span class="ai-dot" :class="{ offline: offline }" />
                {{ offline ? 'Sin conexión' : 'Conectada · red local' }}
              </p>
            </div>
          </div>
          <div class="ai-header-actions">
            <button class="ai-action-btn" title="Limpiar chat" @click="clearChat">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
            <button class="ai-action-btn" title="Cerrar" @click="close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div class="ai-messages" ref="messagesEl">

          <!-- Empty state -->
          <div v-if="!messages.length" class="ai-empty">
            <div class="ai-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/>
                <path d="M19 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" opacity=".5"/>
              </svg>
            </div>
            <p class="ai-empty-title">Hola, soy ARIA</p>
            <p class="ai-empty-sub">Tu asistente de entrenamiento, nutrición y rendimiento. ¿En qué te ayudo hoy?</p>
            <!-- Quick suggestions -->
            <div class="ai-suggestions">
              <button class="ai-suggestion" @click="sendSuggestion('¿Qué debería comer antes de entrenar?')">
                ¿Qué comer antes de entrenar?
              </button>
              <button class="ai-suggestion" @click="sendSuggestion('¿Cuánto descanso necesito entre series?')">
                ¿Cuánto descanso entre series?
              </button>
              <button class="ai-suggestion" @click="sendSuggestion('¿Cómo mejorar mi recuperación muscular?')">
                Recuperación muscular
              </button>
            </div>
          </div>

          <!-- Message list -->
          <template v-else>
            <template v-for="msg in messages" :key="msg.id">

              <!-- Mensaje normal (user / ai / error) -->
              <div
                v-if="msg.role !== 'cors-help'"
                class="ai-msg-row"
                :class="msg.role"
              >
                <div v-if="msg.role === 'ai' || msg.role === 'error'" class="ai-msg-avatar">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/>
                  </svg>
                </div>
                <div class="ai-bubble" :class="msg.role">
                  <p class="ai-bubble-text">{{ msg.text }}</p>
                </div>
              </div>

              <!-- Tarjeta de ayuda CORS -->
              <div v-else class="cors-card">
                <p class="cors-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Cómo activar CORS en tu servidor
                </p>
                <p class="cors-card-sub">El navegador bloqueó la petición por política CORS. Elige el framework de tu servidor LLM:</p>

                <div class="cors-tab-group">
                  <!-- FastAPI -->
                  <details class="cors-detail" open>
                    <summary>FastAPI / Uvicorn</summary>
                    <pre class="cors-code">from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)</pre>
                  </details>

                  <!-- Flask -->
                  <details class="cors-detail">
                    <summary>Flask</summary>
                    <pre class="cors-code">pip install flask-cors

from flask_cors import CORS
CORS(app)</pre>
                  </details>

                  <!-- Express -->
                  <details class="cors-detail">
                    <summary>Node / Express</summary>
                    <pre class="cors-code">npm install cors

const cors = require('cors')
app.use(cors())</pre>
                  </details>

                  <!-- LiteLLM / Ollama -->
                  <details class="cors-detail">
                    <summary>Ollama</summary>
                    <pre class="cors-code"># Variable de entorno antes de iniciar Ollama:
OLLAMA_ORIGINS="*" ollama serve</pre>
                  </details>
                </div>

                <p class="cors-card-hint">Después de agregar CORS, reinicia el servidor y vuelve a intentarlo.</p>
              </div>

            </template>

            <!-- Typing indicator -->
            <div v-if="aiTyping" class="ai-msg-row ai">
              <div class="ai-msg-avatar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/>
                </svg>
              </div>
              <div class="ai-bubble ai typing-bubble">
                <span class="typing-dot" />
                <span class="typing-dot" style="animation-delay: 0.2s" />
                <span class="typing-dot" style="animation-delay: 0.4s" />
              </div>
            </div>
          </template>

        </div>

        <!-- Input -->
        <div class="ai-input-wrap">
          <textarea
            ref="inputEl"
            v-model="input"
            class="ai-input"
            placeholder="Escribe tu pregunta… (Enter para enviar)"
            rows="1"
            :disabled="sending"
            @keydown="onEnter"
          />
          <button
            class="ai-send-btn"
            :disabled="!input.trim() || sending"
            @click="send"
          >
            <svg v-if="!sending" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span v-else class="ai-spinner" />
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── Overlay ─────────────────────────────────────────────────────── */
.ai-overlay {
  position: fixed; inset: 0; z-index: 400;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex; align-items: flex-end; justify-content: center;
}

/* ── Panel ───────────────────────────────────────────────────────── */
.ai-panel {
  width: 100%; max-width: 480px;
  height: 88dvh;
  background: var(--bg);
  border-top: 1px solid var(--border-hi);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  display: flex; flex-direction: column;
  overflow: hidden;
}

/* ── Header ──────────────────────────────────────────────────────── */
.ai-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.ai-header-left  { display: flex; align-items: center; gap: var(--space-3); }
.ai-header-actions { display: flex; gap: var(--space-1); }

.ai-icon-wrap {
  width: 36px; height: 36px; border-radius: var(--radius-sm);
  background: var(--accent-dim);
  color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.ai-title  { font-size: var(--text-sm); font-weight: 700; color: var(--text); line-height: 1.2; }
.ai-status {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; color: var(--success); font-weight: 600;
  letter-spacing: 0.03em; margin-top: 1px;
}
.ai-status.offline { color: var(--danger); }

.ai-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--success); flex-shrink: 0;
  animation: pulse-dot 2s ease-in-out infinite;
}
.ai-dot.offline { background: var(--danger); animation: none; }

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

.ai-action-btn {
  width: 34px; height: 34px; border-radius: var(--radius-sm);
  background: none; border: none; color: var(--muted);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: var(--transition);
}
.ai-action-btn:hover { background: var(--faint); color: var(--text); }

/* ── Messages area ───────────────────────────────────────────────── */
.ai-messages {
  flex: 1; overflow-y: auto;
  padding: var(--space-4) var(--space-4);
  display: flex; flex-direction: column; gap: var(--space-3);
  scroll-behavior: smooth;
}

/* Empty state */
.ai-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center; padding: var(--space-8) var(--space-6);
  gap: var(--space-2);
}
.ai-empty-icon {
  width: 56px; height: 56px; border-radius: var(--radius-lg);
  background: var(--accent-dim); color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: var(--space-2);
}
.ai-empty-title { font-size: var(--text-lg); font-weight: 700; color: var(--text); }
.ai-empty-sub   { font-size: var(--text-sm); color: var(--muted); max-width: 260px; line-height: 1.5; }

.ai-suggestions {
  display: flex; flex-direction: column; gap: var(--space-2);
  margin-top: var(--space-4); width: 100%;
}
.ai-suggestion {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  background: var(--faint-2); border: 1px solid var(--border);
  border-radius: var(--radius); font-size: var(--text-sm);
  color: var(--text-2); cursor: pointer; transition: var(--transition);
  line-height: 1.4;
}
.ai-suggestion:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }

/* Messages */
.ai-msg-row {
  display: flex; gap: var(--space-2); align-items: flex-end;
  animation: msg-in 0.25s ease-out both;
}
.ai-msg-row.user  { flex-direction: row-reverse; }
.ai-msg-row.error { flex-direction: row; }

@keyframes msg-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.ai-msg-avatar {
  width: 26px; height: 26px; border-radius: var(--radius-sm);
  background: var(--accent-dim); color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.ai-bubble {
  max-width: 82%;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  line-height: 1.6;
}
.ai-bubble.user {
  background: var(--accent);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.ai-bubble.ai {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-bottom-left-radius: 4px;
}
.ai-bubble.error {
  background: var(--danger-dim);
  border: 1px solid rgba(252, 165, 165, 0.2);
  color: var(--danger);
  border-bottom-left-radius: 4px;
}

.ai-bubble-text { white-space: pre-wrap; word-break: break-word; }

/* Typing indicator */
.typing-bubble {
  display: flex; align-items: center; gap: 5px;
  padding: var(--space-3) var(--space-4);
  min-height: 42px;
}
.typing-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--muted);
  animation: typing 1.2s ease-in-out infinite;
  display: inline-block;
}
@keyframes typing {
  0%, 100% { transform: translateY(0);    opacity: 0.4; }
  50%       { transform: translateY(-5px); opacity: 1;   }
}

/* ── Input area ──────────────────────────────────────────────────── */
.ai-input-wrap {
  display: flex; align-items: flex-end; gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border);
  background: var(--bg);
  flex-shrink: 0;
  padding-bottom: calc(var(--space-3) + var(--safe-bottom, 0px));
}

.ai-input {
  flex: 1;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: var(--text-sm);
  font-family: var(--font-ui);
  padding: var(--space-3) var(--space-4);
  resize: none;
  line-height: 1.5;
  min-height: 44px; max-height: 120px;
  overflow-y: auto;
  transition: border-color 0.2s;
  outline: none;
  field-sizing: content;
}
.ai-input:focus { border-color: var(--accent); }
.ai-input:disabled { opacity: 0.5; cursor: not-allowed; }
.ai-input::placeholder { color: var(--muted); }

.ai-send-btn {
  width: 44px; height: 44px; border-radius: var(--radius);
  background: var(--accent); color: #fff; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: var(--transition);
  flex-shrink: 0;
}
.ai-send-btn:hover:not(:disabled) { opacity: 0.85; }
.ai-send-btn:disabled {
  background: var(--faint); color: var(--muted); cursor: not-allowed;
}

.ai-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Tarjeta de ayuda CORS ───────────────────────────────────────── */
.cors-card {
  background: var(--surface);
  border: 1px solid var(--warning-dim, rgba(252,211,77,.15));
  border-left: 3px solid var(--warning, #fcd34d);
  border-radius: var(--radius);
  padding: var(--space-4);
  animation: msg-in 0.25s ease-out both;
}
.cors-card-title {
  display: flex; align-items: center; gap: var(--space-2);
  font-size: var(--text-sm); font-weight: 700;
  color: var(--warning, #fcd34d); margin-bottom: var(--space-2);
}
.cors-card-sub {
  font-size: var(--text-xs); color: var(--muted);
  margin-bottom: var(--space-3); line-height: 1.5;
}
.cors-card-hint {
  font-size: var(--text-xs); color: var(--muted);
  margin-top: var(--space-3); font-style: italic;
}

.cors-tab-group { display: flex; flex-direction: column; gap: var(--space-2); }

.cors-detail {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.cors-detail summary {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs); font-weight: 700;
  color: var(--text-2); cursor: pointer;
  background: var(--faint-2); list-style: none;
  user-select: none;
}
.cors-detail summary::-webkit-details-marker { display: none; }
.cors-detail summary::before { content: '▶  '; font-size: 8px; color: var(--muted); }
details[open].cors-detail summary::before { content: '▼  '; }

.cors-code {
  margin: 0;
  padding: var(--space-3);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
  background: var(--bg);
  border-top: 1px solid var(--border);
  white-space: pre;
  overflow-x: auto;
  line-height: 1.7;
}
</style>
