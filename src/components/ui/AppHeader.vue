<script setup>
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'

defineProps({
  title:    { type: String,  default: '' },
  showBack: { type: Boolean, default: false },
})

const auth   = useAuthStore()
const router = useRouter()
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <button v-if="showBack" class="btn-icon btn-ghost header-back" @click="router.back()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </button>
      <span v-else-if="title" class="header-title label-caps">{{ title }}</span>
      <span v-else class="header-logo font-display">DISCIPLINA</span>
    </div>

    <div class="header-right">
      <!-- Racha -->
      <div v-if="auth.profile?.current_streak" class="streak-chip">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--warning)" stroke="none"><path d="M12 2C8 7 5 10 5 14a7 7 0 0014 0c0-4-3-7-7-12z"/></svg>
        <span>{{ auth.profile.current_streak }}</span>
      </div>

      <ThemeToggle />

      <!-- Avatar -->
      <RouterLink to="/profile" class="avatar-link">
        <div class="avatar">
          <span>{{ auth.alias?.charAt(0)?.toUpperCase() || 'D' }}</span>
        </div>
      </RouterLink>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  max-width: 480px;
  margin: 0 auto;
  height: calc(var(--header-height) + var(--safe-top));
  padding-top: var(--safe-top);
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: var(--space-5);
  padding-right: var(--space-4);
  z-index: 90;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.header-left { display: flex; align-items: center; }
.header-right { display: flex; align-items: center; gap: var(--space-2); }

.header-logo {
  font-size: 17px;
  font-weight: 400;
  letter-spacing: 0.22em;
  color: var(--accent);
}
.header-title { color: var(--text-2); }
.header-back { background: none; border: none; }

.streak-chip {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 10px;
  background: var(--warning-dim);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--warning);
  border: 1px solid rgba(252, 211, 77, 0.2);
}

.avatar-link { text-decoration: none; }
.avatar {
  width: 34px; height: 34px;
  border-radius: var(--radius-sm);
  background: var(--gradient-accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  box-shadow: var(--shadow-accent);
  transition: var(--transition);
}
.avatar:hover { opacity: 0.85; }
</style>
