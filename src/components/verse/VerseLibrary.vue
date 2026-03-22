<script setup>
import { onMounted } from 'vue'
import { useVerseStore }  from '@/stores/verse.store'
import { formatDateDisplay } from '@/utils/formatters'

const store = useVerseStore()
onMounted(() => store.loadLibrary())
</script>

<template>
  <div class="verse-library">
    <p v-if="!store.library.length" class="empty-lib">
      Todavía no has guardado ningún verso.<br>
      Guarda el verso del día desde la pantalla principal.
    </p>
    <div v-else class="lib-list">
      <div v-for="entry in store.library" :key="entry.id" class="lib-card card">
        <p class="lib-date label-caps">{{ formatDateDisplay(entry.original_date) }}</p>
        <div class="lib-verse">
          <p v-for="(line, i) in entry.verse_text?.split('\n')" :key="i" class="lib-line" :class="{ 'lib-blank': !line }">
            {{ line || '' }}
          </p>
        </div>
        <div class="lib-divider" />
        <blockquote class="lib-tao">
          {{ entry.tao_fragment }}
          <cite class="lib-source">{{ entry.tao_source }}</cite>
        </blockquote>
      </div>
    </div>
  </div>
</template>

<style scoped>
.verse-library { padding: var(--space-4) 0; }
.empty-lib { text-align: center; color: var(--muted); font-size: var(--text-sm); line-height: 1.7; padding: var(--space-8) 0; }
.lib-list { display: flex; flex-direction: column; gap: var(--space-4); }
.lib-card { padding: var(--space-5); }
.lib-date { color: var(--accent); margin-bottom: var(--space-3); }
.lib-verse { display: flex; flex-direction: column; gap: 2px; margin-bottom: var(--space-4); }
.lib-line { font-size: var(--text-base); line-height: 1.65; color: var(--text); font-family: var(--font-display); }
.lib-blank { height: var(--space-3); }
.lib-divider { height: 1px; background: var(--border); margin-bottom: var(--space-4); }
.lib-tao { font-size: var(--text-sm); font-style: italic; color: var(--muted); line-height: 1.6; border-left: 3px solid var(--accent); padding-left: var(--space-4); }
.lib-source { display: block; font-size: var(--text-xs); margin-top: var(--space-2); font-style: normal; }
</style>
