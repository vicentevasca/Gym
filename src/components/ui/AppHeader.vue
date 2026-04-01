<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter }    from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'
import AIChat      from '@/components/ai/AIChat.vue'

defineProps({
  title:    { type: String,  default: '' },
  showBack: { type: Boolean, default: false },
})

const auth    = useAuthStore()
const router  = useRouter()
const showAI  = ref(false)
</script>

<template>
  <header class="app-header">

    <!-- Izquierda: logo / título / volver -->
    <div class="header-left">
      <button v-if="showBack" class="btn-icon btn-ghost header-back" @click="router.back()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </button>
      <span v-else-if="title" class="header-title label-caps">{{ title }}</span>
      <span v-else class="header-logo font-display">DISCIPLINA</span>
    </div>

    <!-- Centro: botón IA (posición absoluta centrada) -->
    <div class="header-center">
      <button
        class="ai-btn"
        :class="{ active: showAI }"
        title="ARIA — Asistente IA"
        @click="showAI = true"
      >
        <!-- Sparkle icon -->
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/>
          <path d="M19 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" opacity=".6"/>
          <path d="M4 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" opacity=".4"/>
        </svg>
      </button>
    </div>

    <!-- Derecha: racha + tema + avatar -->
    <div class="header-right">
      <div v-if="auth.profile?.current_streak > 0" class="streak-chip">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--warning)" stroke="none"><path d="M12 2C8 7 5 10 5 14a7 7 0 0014 0c0-4-3-7-7-12z"/></svg>
        <span>{{ auth.profile.current_streak ?? 0 }}</span>
      </div>

      <ThemeToggle />

      <RouterLink to="/profile" class="avatar-link">
        <div class="avatar">
          <span>{{ auth.alias?.charAt(0)?.toUpperCase() || 'D' }}</span>
        </div>
      </RouterLink>
    </div>

  </header>

  <!-- Chat IA -->
  <AIChat v-if="showAI" @close="showAI = false" />
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

.header-left  { display: flex; align-items: center; }
.header-right { display: flex; align-items: center; gap: var(--space-2); }

/* Centro absoluto */
.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex; align-items: center;
}

/* Botón IA */
.ai-btn {
  width: 38px; height: 38px;
  border-radius: var(--radius-sm);
  background: var(--accent-dim);
  border: 1px solid transparent;
  color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: var(--transition);
}
.ai-btn:hover,
.ai-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  box-shadow: var(--shadow-accent);
}

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
  width: 44px; height: 44px;
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
