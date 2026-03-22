<script setup>
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'

defineProps({
  title: { type: String, default: 'DISCIPLINA' },
  showBack: { type: Boolean, default: false },
})

const auth   = useAuthStore()
const router = useRouter()
</script>

<template>
  <header class="app-header">
    <button v-if="showBack" class="header-btn" @click="router.back()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
    </button>
    <span v-else class="header-logo font-display">{{ title }}</span>

    <div class="header-right">
      <!-- Racha -->
      <div v-if="auth.profile" class="streak-badge">
        🔥 <span>{{ auth.profile.current_streak || 0 }}</span>
      </div>
      <!-- Avatar / perfil -->
      <RouterLink to="/profile" class="avatar-btn">
        <div class="avatar">
          {{ auth.alias?.charAt(0)?.toUpperCase() || 'D' }}
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
  padding-left: 20px;
  padding-right: 16px;
  z-index: 90;
}

.header-logo {
  font-size: 18px;
  font-weight: 400;
  letter-spacing: 0.2em;
  color: var(--accent);
}

.header-btn {
  background: none;
  border: none;
  color: var(--text);
  cursor: pointer;
  padding: 8px;
  margin-left: -8px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.streak-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--warning);
  font-weight: 600;
}

.avatar-btn { text-decoration: none; }

.avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: var(--accent-dim);
  border: 1px solid var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0;
}
</style>
