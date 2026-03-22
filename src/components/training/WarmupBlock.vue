<script setup>
defineProps({
  warmup: { type: Array, default: () => [] }
})
</script>

<template>
  <div class="warmup-block">
    <div class="wu-header">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
      <span class="label-caps">Calentamiento</span>
    </div>
    <div class="wu-list">
      <div v-for="(item, i) in warmup" :key="i" class="wu-item">
        <span class="wu-num">{{ i + 1 }}</span>
        <div class="wu-info">
          <p class="wu-name">{{ item.name }}</p>
          <p class="wu-detail">{{ item.detail }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.warmup-block {
  background: var(--faint-2); border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--border);
}
.wu-header {
  display: flex; align-items: center; gap: var(--space-2);
  color: var(--warning); margin-bottom: var(--space-3);
}
.wu-header span { font-size: var(--text-xs); font-weight: 700; letter-spacing: 0.1em; }
.wu-list { display: flex; flex-direction: column; gap: var(--space-2); }
.wu-item { display: flex; align-items: flex-start; gap: var(--space-3); }
.wu-num {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--warning-dim, rgba(251,191,36,.15)); color: var(--warning);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-xs); font-weight: 700; flex-shrink: 0; margin-top: 1px;
}
.wu-name { font-size: var(--text-sm); font-weight: 600; }
.wu-detail { font-size: var(--text-xs); color: var(--muted); margin-top: 1px; }
</style>
