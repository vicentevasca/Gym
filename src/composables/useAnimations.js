import { gsap } from 'gsap'

/* ═══════════════════════════════════════════════
   DISCIPLINA — Animaciones GSAP
   Librería central de animaciones reutilizables
   ═══════════════════════════════════════════════ */

// ── Easings personalizados ──
export const ease = {
  smooth:  'power2.out',
  sharp:   'expo.out',
  spring:  'back.out(1.4)',
  bounce:  'elastic.out(1, 0.5)',
  gentle:  'sine.inOut',
  enter:   'power3.out',
}

// ── Duraciones ──
export const dur = {
  fast:   0.18,
  normal: 0.32,
  slow:   0.55,
  slower: 0.8,
}

/* ─────────────────────────────────────────────
   Página / Layout
   ───────────────────────────────────────────── */

// Entrada de página completa
export function pageEnter(container, delay = 0) {
  if (!container) return
  return gsap.from(container, {
    opacity: 0, y: 16,
    duration: dur.slow,
    delay,
    ease: ease.enter,
    clearProps: 'all',
  })
}

// Salida de página
export function pageLeave(container) {
  if (!container) return
  return gsap.to(container, {
    opacity: 0, y: -10,
    duration: dur.fast,
    ease: ease.smooth,
  })
}

/* ─────────────────────────────────────────────
   Stagger (lista de elementos)
   ───────────────────────────────────────────── */

// Entrada en cascada de elementos
export function staggerIn(elements, options = {}) {
  if (!elements?.length) return
  // Filter out null/undefined refs
  const els = Array.from(elements).filter(Boolean)
  if (!els.length) return
  return gsap.from(els, {
    opacity: 0,
    y: options.y ?? 20,
    x: options.x ?? 0,
    scale: options.scale ?? 1,
    duration: options.duration ?? dur.normal,
    stagger: options.stagger ?? 0.07,
    delay: options.delay ?? 0,
    ease: ease.enter,
    clearProps: 'all',
    ...options.gsap,
  })
}

// Fade in simple para un elemento
export function fadeIn(el, options = {}) {
  if (!el) return
  return gsap.from(el, {
    opacity: 0,
    y: options.y ?? 12,
    duration: options.duration ?? dur.normal,
    delay: options.delay ?? 0,
    ease: ease.smooth,
    clearProps: 'all',
  })
}

/* ─────────────────────────────────────────────
   Formularios / Auth
   ───────────────────────────────────────────── */

// Entrada del logo (carácter a carácter no disponible sin SplitText —
// usamos un reveal elegante)
export function logoReveal(el, delay = 0) {
  if (!el) return
  return gsap.from(el, {
    opacity: 0,
    y: -20,
    letterSpacing: '0.5em',
    duration: dur.slower,
    delay,
    ease: ease.gentle,
    clearProps: 'all',
  })
}

// Shake en error de formulario
export function shakeError(el) {
  if (!el) return
  return gsap.timeline()
    .to(el, { x: -8,  duration: 0.07, ease: 'none' })
    .to(el, { x:  8,  duration: 0.07, ease: 'none' })
    .to(el, { x: -6,  duration: 0.07, ease: 'none' })
    .to(el, { x:  6,  duration: 0.07, ease: 'none' })
    .to(el, { x: -3,  duration: 0.07, ease: 'none' })
    .to(el, { x:  0,  duration: 0.07, ease: ease.smooth })
}

/* ─────────────────────────────────────────────
   Botones / Micro-interacciones
   ───────────────────────────────────────────── */

// Press button
export function pressBtn(el) {
  if (!el) return
  return gsap.timeline()
    .to(el, { scale: 0.96, duration: 0.1, ease: 'power2.in' })
    .to(el, { scale: 1,    duration: 0.3, ease: ease.spring })
}

// Success pulse (badge, check)
export function successPop(el) {
  if (!el) return
  return gsap.timeline()
    .from(el, { scale: 0, opacity: 0, duration: 0.4, ease: ease.spring })
    .to(el,   { scale: 1.08, duration: 0.1 })
    .to(el,   { scale: 1,    duration: 0.2, ease: ease.smooth })
}

// Record badge
export function prBadge(el) {
  if (!el) return
  return gsap.timeline()
    .from(el, { scale: 0, rotation: -15, opacity: 0, duration: 0.5, ease: ease.spring })
    .to(el,   { rotation: 0, duration: 0.3, ease: ease.smooth })
}

/* ─────────────────────────────────────────────
   Modales / Overlays
   ───────────────────────────────────────────── */

export function modalIn(el) {
  if (!el) return
  return gsap.from(el, {
    opacity: 0, scale: 0.95, y: 20,
    duration: dur.normal,
    ease: ease.spring,
    clearProps: 'all',
  })
}

export function modalOut(el) {
  if (!el) return
  return gsap.to(el, {
    opacity: 0, scale: 0.95, y: 10,
    duration: dur.fast,
    ease: ease.smooth,
  })
}

/* ─────────────────────────────────────────────
   Timer circular (Rest Timer)
   ───────────────────────────────────────────── */

export function timerIn(el) {
  if (!el) return
  return gsap.from(el, {
    opacity: 0, scale: 0.8,
    duration: dur.normal,
    ease: ease.spring,
    clearProps: 'all',
  })
}

/* ─────────────────────────────────────────────
   Verso del Día
   ───────────────────────────────────────────── */

export function verseReveal(lines, tao, hint) {
  const tl = gsap.timeline()
  if (lines?.length) {
    tl.from(lines, {
      opacity: 0, y: 14,
      duration: dur.slow,
      stagger: 0.38,
      ease: ease.gentle,
    })
  }
  if (tao) {
    tl.from(tao, {
      opacity: 0, duration: dur.slow, ease: ease.gentle
    }, '+=0.2')
  }
  if (hint) {
    tl.from(hint, {
      opacity: 0, y: 8, duration: 0.5,
    }, '+=1.5')
  }
  return tl
}

/* ─────────────────────────────────────────────
   Progress / Barras
   ───────────────────────────────────────────── */

export function animateProgress(el, from = 0, to = 100) {
  if (!el) return
  return gsap.fromTo(el,
    { width: from + '%' },
    { width: to + '%', duration: dur.slow, ease: ease.smooth }
  )
}

/* ─────────────────────────────────────────────
   Nav Bottom
   ───────────────────────────────────────────── */

export function navItemTap(el) {
  if (!el) return
  return gsap.timeline()
    .to(el, { y: -3, scale: 1.12, duration: 0.15, ease: ease.sharp })
    .to(el, { y:  0, scale: 1,    duration: 0.25, ease: ease.spring })
}
