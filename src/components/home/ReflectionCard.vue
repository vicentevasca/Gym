<script setup>
import { ref, onMounted } from 'vue'
import { FALLBACK_QUOTES, dayOfYear } from '@/utils/homeContent'

const CACHE_KEY = 'disciplina_daily_quote'

const quote   = ref(null)
const loading = ref(true)

onMounted(async () => {
  await loadQuote()
})

async function loadQuote() {
  loading.value = true
  try {
    // Intentar usar caché
    const cached = readCache()
    if (cached) {
      quote.value   = cached
      loading.value = false
      return
    }

    // Intentar API con timeout de 3 segundos
    const controller = new AbortController()
    const timeout    = setTimeout(() => controller.abort(), 3000)

    let apiQuote = null
    try {
      const res = await fetch(
        'https://api.quotable.io/random?tags=stoicism|philosophy|motivational&minLength=60&maxLength=200',
        { signal: controller.signal }
      )
      clearTimeout(timeout)
      if (res.ok) {
        const data = await res.json()
        if (data?.content && data?.author) {
          apiQuote = { text: data.content, author: data.author }
        }
      }
    } catch {
      clearTimeout(timeout)
      // Falla silenciosa — usamos fallback
    }

    if (apiQuote) {
      quote.value = apiQuote
      writeCache(apiQuote)
    } else {
      quote.value = getFallbackQuote()
    }
  } finally {
    loading.value = false
  }
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const today  = new Date().toISOString().split('T')[0]
    if (parsed.date === today && parsed.quote?.text) {
      return parsed.quote
    }
    return null
  } catch {
    return null
  }
}

function writeCache(q) {
  try {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, quote: q }))
  } catch {
    // ignorar errores de storage
  }
}

function getFallbackQuote() {
  const index = dayOfYear() % FALLBACK_QUOTES.length
  return FALLBACK_QUOTES[index]
}
</script>

<template>
  <div class="reflection-card card">

    <p class="reflection-label label-caps">Reflexión del día</p>

    <!-- Skeleton de carga -->
    <template v-if="loading">
      <div class="skeleton-wrap">
        <div class="skeleton skeleton--lg" />
        <div class="skeleton skeleton--md" />
        <div class="skeleton skeleton--sm" />
      </div>
    </template>

    <!-- Contenido real -->
    <template v-else-if="quote">
      <span class="quote-mark" aria-hidden="true">"</span>
      <p class="quote-text">{{ quote.text }}</p>
      <p class="quote-author label-caps">— {{ quote.author }}</p>
    </template>

  </div>
</template>

<style scoped>
.reflection-card {
  padding: var(--space-5);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius-md);
}

.reflection-label {
  color: var(--accent);
  margin-bottom: var(--space-4);
}

/* ── Quote mark ─────────────────────────────────────────────── */
.quote-mark {
  display: block;
  font-family: var(--font-display);
  font-size: 52px;
  line-height: 0.6;
  color: var(--accent);
  opacity: 0.5;
  margin-bottom: var(--space-3);
  user-select: none;
}

.quote-text {
  font-family: var(--font-verse);
  font-size: var(--text-base);
  color: var(--text);
  line-height: 1.75;
  margin-bottom: var(--space-3);
  font-style: italic;
}

.quote-author {
  color: var(--muted);
  font-size: 10px;
  letter-spacing: 0.06em;
}

/* ── Skeleton ───────────────────────────────────────────────── */
.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-2);
}

.skeleton {
  background: var(--faint);
  border-radius: var(--radius-sm);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton--lg { height: 16px; width: 100%; }
.skeleton--md { height: 16px; width: 80%; }
.skeleton--sm { height: 12px; width: 40%; margin-top: var(--space-1); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
</style>
