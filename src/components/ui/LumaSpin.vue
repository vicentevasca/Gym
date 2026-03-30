<script setup>
defineProps({
  size:  { type: Number, default: 65 },
  color: { type: String, default: 'rgba(255,255,255,0.85)' },
})
</script>

<template>
  <div
    class="luma-spin"
    :style="{ width: size + 'px', '--luma-color': color }"
  >
    <span class="luma-a" />
    <span class="luma-b" />
  </div>
</template>

<style scoped>
.luma-spin {
  position: relative;
  aspect-ratio: 1;
  flex-shrink: 0;
}

.luma-a,
.luma-b {
  position: absolute;
  border-radius: 50px;
  box-shadow: inset 0 0 0 3px var(--luma-color, rgba(255,255,255,0.85));
  animation: lumaAnim 2.5s infinite;
}

.luma-b {
  animation-delay: -1.25s;
}

@keyframes lumaAnim {
  0%    { inset: 0 35px 35px 0; }
  12.5% { inset: 0 35px 0    0; }
  25%   { inset: 35px 35px 0  0; }
  37.5% { inset: 35px 0 0    0; }
  50%   { inset: 35px 0 0 35px; }
  62.5% { inset: 0 0 0 35px;   }
  75%   { inset: 0 0 35px 35px; }
  87.5% { inset: 0 0 35px 0;   }
  100%  { inset: 0 35px 35px 0; }
}
</style>
