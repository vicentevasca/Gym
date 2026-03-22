<script setup>
import { onMounted, ref } from 'vue'
import { prBadge } from '@/composables/useAnimations'
defineProps({ exercise: String })
const el = ref(null)
onMounted(() => prBadge(el.value))
</script>

<template>
  <div ref="el" class="pr-badge">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
    <span>RÉCORD</span>
  </div>
</template>

<style scoped>
.pr-badge {
  display: inline-flex; align-items: center; gap: 4px;
  background: var(--gradient-accent);
  color: #fff;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 800;
  letter-spacing: 0.12em;
  box-shadow: var(--shadow-accent);
}
</style>
