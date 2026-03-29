<script setup>
import { ref, computed, onMounted } from 'vue'
import { getWeekBook, weekOfYear } from '@/utils/homeContent'

const book        = getWeekBook()
const coverError  = ref(false)
const weekNumber  = weekOfYear()

const coverUrl = computed(() => {
  if (!book.open_library_key || coverError.value) return null
  return `https://covers.openlibrary.org/b/id/${book.open_library_key}-M.jpg`
})

function onCoverError() {
  coverError.value = true
}
</script>

<template>
  <div class="reading-card card">

    <!-- Etiqueta semana -->
    <p class="reading-week-label label-caps">Semana {{ weekNumber }} · Lectura recomendada</p>

    <!-- Layout horizontal -->
    <div class="reading-layout">

      <!-- Portada o emoji -->
      <div class="reading-cover-wrap">
        <img
          v-if="coverUrl"
          :src="coverUrl"
          :alt="book.title"
          class="reading-cover-img"
          @error="onCoverError"
        />
        <div v-else class="reading-cover-fallback">
          <span class="reading-book-emoji">{{ book.emoji }}</span>
        </div>
      </div>

      <!-- Info -->
      <div class="reading-info">
        <span class="reading-genre label-caps">{{ book.genre }}</span>
        <h3 class="reading-title">{{ book.title }}</h3>
        <p class="reading-meta">{{ book.author }} · {{ book.year > 0 ? book.year : Math.abs(book.year) + ' a.C.' }}</p>
        <p class="reading-tagline">{{ book.tagline }}</p>
      </div>

    </div>

    <!-- Por qué leerlo -->
    <div class="reading-why">
      <p class="reading-why-label label-caps">Por qué leerlo ahora</p>
      <p class="reading-why-text">{{ book.why }}</p>
    </div>

  </div>
</template>

<style scoped>
.reading-card {
  padding: var(--space-5);
}

/* ── Etiqueta semana ─────────────────────────────────────────── */
.reading-week-label {
  color: var(--muted);
  margin-bottom: var(--space-4);
  font-size: 10px;
}

/* ── Layout horizontal ───────────────────────────────────────── */
.reading-layout {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  margin-bottom: var(--space-4);
}

/* ── Portada ─────────────────────────────────────────────────── */
.reading-cover-wrap {
  flex-shrink: 0;
  width: 52px;
}

.reading-cover-img {
  width: 52px;
  height: 72px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--border);
  display: block;
}

.reading-cover-fallback {
  width: 52px;
  height: 72px;
  background: var(--faint);
  border-radius: 4px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.reading-book-emoji {
  font-size: 28px;
}

/* ── Info ────────────────────────────────────────────────────── */
.reading-info {
  flex: 1;
  min-width: 0;
}

.reading-genre {
  display: inline-block;
  background: var(--faint);
  border: 1px solid var(--border);
  color: var(--muted);
  border-radius: var(--radius-full);
  padding: 2px 8px;
  font-size: 9px;
  margin-bottom: var(--space-2);
}

.reading-title {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: 800;
  color: var(--text);
  line-height: 1.25;
  margin-bottom: var(--space-1);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.reading-meta {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--muted);
  margin-bottom: var(--space-2);
}

.reading-tagline {
  font-family: var(--font-verse);
  font-size: var(--text-xs);
  color: var(--text);
  font-style: italic;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* ── Por qué leerlo ──────────────────────────────────────────── */
.reading-why {
  background: var(--faint);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  border-top: 1px solid var(--border);
  padding-top: var(--space-4);
}

.reading-why-label {
  color: var(--accent);
  font-size: 10px;
  margin-bottom: var(--space-2);
}

.reading-why-text {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text);
  line-height: 1.65;
}
</style>
