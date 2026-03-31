import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const routes = [
  // Auth (sin guard)
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { guestOnly: true },
  },

  // Onboarding (requiere auth, sin onboarding completo)
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('@/views/onboarding/OnboardingView.vue'),
    meta: { requiresAuth: true },
  },

  // App principal (requiere auth + onboarding completo)
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiresAuth: true, requiresOnboarding: true },
  },
  {
    path: '/training',
    name: 'Training',
    component: () => import('@/views/TrainingView.vue'),
    meta: { requiresAuth: true, requiresOnboarding: true },
  },
  {
    path: '/nutrition',
    name: 'Nutrition',
    component: () => import('@/views/NutritionView.vue'),
    meta: { requiresAuth: true, requiresOnboarding: true },
  },
  {
    path: '/progress',
    name: 'Progress',
    component: () => import('@/views/ProgressView.vue'),
    meta: { requiresAuth: true, requiresOnboarding: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true, requiresOnboarding: true },
  },
  {
    path: '/training/setup',
    name: 'TrainingSetup',
    component: () => import('@/views/TrainingSetupView.vue'),
    meta: { requiresAuth: true, requiresOnboarding: true },
  },
  {
    path: '/training/choice',
    name: 'RoutineChoice',
    component: () => import('@/views/RoutineChoiceView.vue'),
    meta: { requiresAuth: true, requiresOnboarding: true },
  },
  {
    path: '/training/nueva',
    name: 'NewRoutine',
    component: () => import('@/views/NewRoutineView.vue'),
    meta: { requiresAuth: true, requiresOnboarding: true },
  },
  {
    path: '/training/medida',
    name: 'MedidaSetup',
    component: () => import('@/views/MedidaSetupView.vue'),
    meta: { requiresAuth: true, requiresOnboarding: true },
  },
  {
    path: '/rewards',
    name: 'Rewards',
    component: () => import('@/views/RewardsView.vue'),
    meta: { requiresAuth: true, requiresOnboarding: true },
  },

  // Fallback
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, savedPosition) => savedPosition || { top: 0 },
})

// Guard global
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Siempre esperar la misma promesa de init — garantiza que Firebase
  // restauró el token guardado antes de evaluar permisos
  await auth.init()

  const requiresAuth       = to.meta.requiresAuth
  const requiresOnboarding = to.meta.requiresOnboarding
  const guestOnly          = to.meta.guestOnly

  // Rutas de invitado → redirigir si ya está logueado
  if (guestOnly && auth.isLoggedIn) {
    return auth.onboardingCompleted ? { name: 'Home' } : { name: 'Onboarding' }
  }

  // Rutas protegidas → redirigir a login si no está autenticado
  if (requiresAuth && !auth.isLoggedIn) {
    return { name: 'Login' }
  }

  // Rutas que requieren onboarding completo
  if (requiresOnboarding && auth.isLoggedIn && !auth.onboardingCompleted) {
    return { name: 'Onboarding' }
  }

  // Si está logueado y va a /onboarding pero ya completó → al home
  if (to.name === 'Onboarding' && auth.isLoggedIn && auth.onboardingCompleted) {
    return { name: 'Home' }
  }
})

export default router
