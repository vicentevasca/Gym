/**
 * useShareCard — Genera imágenes de tarjeta para compartir usando Canvas API.
 * Soporta Web Share API (móvil) con fallback a descarga.
 *
 * Tipos de tarjeta:
 *  - workout   : sesión de entrenamiento completada
 *  - rank      : rango y XP actual
 *  - nutrition : resumen nutricional del día
 *  - progress  : estadísticas de progreso
 *  - challenge : reto personal completado
 */

// ── Paletas de color por tema ─────────────────────────────────────────────────
const ACCENT_MAP = {
  lilac: '#a78bfa',
  cyan:  '#67e8f9',
  amber: '#fbbf24',
  coral: '#fb7185',
  green: '#4ade80',
}

function getThemeColors() {
  const themeKey = document.querySelector('[data-theme]')?.dataset?.theme || 'lilac'
  const isDark   = document.querySelector('[data-mode]')?.dataset?.mode !== 'light'
  return {
    accent:  ACCENT_MAP[themeKey] || '#a78bfa',
    isDark,
    bg:      isDark ? '#0c0c0c' : '#f5f5f7',
    surface: isDark ? '#161616' : '#ffffff',
    text:    isDark ? '#f2f2f2' : '#111111',
    muted:   isDark ? '#6b7280' : '#8a8a8a',
    border:  isDark ? '#242424' : '#e2e2e2',
  }
}

// ── Canvas helpers ────────────────────────────────────────────────────────────

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function fitText(ctx, text, maxWidth, sizes) {
  for (const size of sizes) {
    ctx.font = `bold ${size}px -apple-system, "SF Pro Display", system-ui, sans-serif`
    if (ctx.measureText(text).width <= maxWidth) return size
  }
  return sizes[sizes.length - 1]
}

function hexAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function formatNum(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n ?? 0))
}

// Dibuja franja superior de acento + app label + fecha
function drawHeader(ctx, S, accent, muted, rightLabel) {
  rrect(ctx, 32, 32, S - 64, 8, 4)
  const sGrad = ctx.createLinearGradient(32, 0, S - 32, 0)
  sGrad.addColorStop(0, accent)
  sGrad.addColorStop(1, hexAlpha(accent, 0.05))
  ctx.fillStyle = sGrad
  ctx.fill()

  ctx.fillStyle = hexAlpha(accent, 0.9)
  ctx.font = `700 13px -apple-system, system-ui, sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText('DISCIPLINA', 64, 78)

  ctx.fillStyle = muted
  ctx.font = `500 13px -apple-system, system-ui, sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText(rightLabel ?? new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }), S - 64, 78)
}

function drawBranding(ctx, S, muted, border) {
  ctx.strokeStyle = border; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(64, S - 80); ctx.lineTo(S - 64, S - 80); ctx.stroke()
  ctx.fillStyle = hexAlpha(muted, 0.6)
  ctx.font = `500 12px -apple-system, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('Forjado con DISCIPLINA', S / 2, S - 52)
}

// ── TARJETA 1: Workout completado ─────────────────────────────────────────────
function drawWorkoutCard(ctx, { session, ranking, streak }, c) {
  const S = 800
  const { accent, bg, surface, text, muted, border } = c

  ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S)
  ctx.fillStyle = surface; rrect(ctx, 32, 32, S - 64, S - 64, 24); ctx.fill()
  drawHeader(ctx, S, accent, muted)

  // Check circle
  const cx = S / 2, cy = 190, r = 52
  const circleGrad = ctx.createRadialGradient(cx - 10, cy - 10, 5, cx, cy, r)
  circleGrad.addColorStop(0, accent)
  circleGrad.addColorStop(1, hexAlpha(accent, 0.7))
  ctx.fillStyle = circleGrad
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - 20, cy + 3); ctx.lineTo(cx - 2, cy + 21); ctx.lineTo(cx + 24, cy - 16)
  ctx.stroke()

  // Nombre de sesión
  const title = session?.name || 'Sesión completada'
  const titleSize = fitText(ctx, title, 640, [34, 28, 24, 20])
  ctx.fillStyle = text
  ctx.font = `bold ${titleSize}px -apple-system, "SF Pro Display", system-ui, sans-serif`
  ctx.textAlign = 'center'; ctx.fillText(title, cx, 298)
  ctx.fillStyle = muted; ctx.font = `500 16px -apple-system, system-ui, sans-serif`
  ctx.fillText('¡Sesión completada!', cx, 326)

  ctx.strokeStyle = border; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(64, 352); ctx.lineTo(S - 64, 352); ctx.stroke()

  // Stats 2×2
  const stats = [
    { val: String(session?.exercises?.length ?? 0),                                          label: 'EJERCICIOS' },
    { val: String(session?.exercises?.reduce((a, e) => a + (e.sets?.length || 0), 0) ?? 0), label: 'SERIES'     },
    { val: formatNum(session?.volume_total_kg ?? 0) + ' kg',                                 label: 'VOLUMEN'    },
    { val: session?.pointsEarned ? '+' + session.pointsEarned + ' XP' : '—',                label: 'XP GANADO'  },
  ]
  const cols = [S / 4, (S * 3) / 4]
  const rows = [430, 520]
  stats.forEach((s, i) => {
    const x = cols[i % 2], y = rows[Math.floor(i / 2)]
    ctx.fillStyle = accent
    ctx.font = `bold 38px -apple-system, "SF Pro Display", system-ui, sans-serif`
    ctx.textAlign = 'center'; ctx.fillText(s.val, x, y)
    ctx.fillStyle = muted; ctx.font = `600 11px -apple-system, system-ui, sans-serif`
    ctx.fillText(s.label, x, y + 22)
  })
  ctx.strokeStyle = border; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(S / 2, 375); ctx.lineTo(S / 2, 555); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(80, 472); ctx.lineTo(S - 80, 472); ctx.stroke()

  // Level badge
  if (ranking?.currentLevel) {
    const lvl = ranking.currentLevel
    rrect(ctx, cx - 120, 575, 240, 44, 22)
    ctx.fillStyle = hexAlpha(lvl.color, 0.15); ctx.fill()
    ctx.strokeStyle = hexAlpha(lvl.color, 0.35); ctx.lineWidth = 1; ctx.stroke()
    ctx.font = `18px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
    ctx.textAlign = 'center'; ctx.fillStyle = lvl.color
    ctx.fillText(lvl.emoji, cx - 40, 604)
    ctx.font = `bold 16px -apple-system, system-ui, sans-serif`
    ctx.fillText(lvl.name, cx + 36, 604)
  }
  if (streak > 0) {
    ctx.font = `500 15px -apple-system, system-ui, sans-serif`
    ctx.fillStyle = '#f59e0b'; ctx.textAlign = 'center'
    ctx.fillText('🔥 ' + streak + ' días de racha', cx, 650)
  }

  drawBranding(ctx, S, muted, border)
}

// ── TARJETA 2: Rango actual ───────────────────────────────────────────────────
function drawRankCard(ctx, { ranking, streak }, c) {
  const S = 800
  const { accent, bg, surface, text, muted, border } = c
  const lvl      = ranking?.currentLevel
  const next     = ranking?.nextLevel
  const xp       = ranking?.xp ?? 0
  const pct      = ranking?.levelProgress ?? 0
  const lvlColor = lvl?.color || accent

  ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S)
  ctx.fillStyle = surface; rrect(ctx, 32, 32, S - 64, S - 64, 24); ctx.fill()
  drawHeader(ctx, S, lvlColor, muted, 'Mi rango actual')

  ctx.font = `96px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
  ctx.textAlign = 'center'; ctx.fillText(lvl?.emoji || '🌱', S / 2, 230)

  const nameSize = fitText(ctx, lvl?.name || 'Iniciado', 600, [58, 46, 38])
  ctx.fillStyle = lvlColor
  ctx.font = `800 ${nameSize}px -apple-system, "SF Pro Display", system-ui, sans-serif`
  ctx.textAlign = 'center'; ctx.fillText(lvl?.name || 'Iniciado', S / 2, 318)
  ctx.fillStyle = muted; ctx.font = `500 16px -apple-system, system-ui, sans-serif`
  ctx.fillText(`Nivel ${(lvl?.index ?? 0) + 1} de 10`, S / 2, 350)

  ctx.fillStyle = text
  ctx.font = `800 52px -apple-system, "SF Pro Display", system-ui, sans-serif`
  ctx.fillText(formatNum(xp) + ' XP', S / 2, 430)

  const barX = 80, barY = 455, barW = S - 160, barH = 12
  ctx.fillStyle = hexAlpha(lvlColor, 0.15)
  rrect(ctx, barX, barY, barW, barH, barH / 2); ctx.fill()
  ctx.fillStyle = lvlColor
  rrect(ctx, barX, barY, Math.max(8, (pct / 100) * barW), barH, barH / 2); ctx.fill()

  ctx.fillStyle = muted; ctx.font = `500 14px -apple-system, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(
    next ? `${pct}% hacia ${next.name} (${formatNum(ranking?.pointsToNext ?? 0)} XP restantes)` : '¡Rango máximo!',
    S / 2, 493,
  )

  ctx.strokeStyle = border; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(80, 522); ctx.lineTo(S - 80, 522); ctx.stroke()

  const statItems = [
    { val: String(streak ?? 0) + ' días',                                   label: 'Racha actual'  },
    { val: formatNum(xp),                                                    label: 'XP total'      },
    { val: String(ranking?.bests?.best_streak ?? 0) + ' días',              label: 'Mejor racha'   },
  ]
  const colsW = [S / 6, S / 2, (S * 5) / 6]
  statItems.forEach((s, i) => {
    const x = colsW[i]
    ctx.fillStyle = i === 1 ? lvlColor : text
    ctx.font = `bold 28px -apple-system, system-ui, sans-serif`
    ctx.textAlign = 'center'; ctx.fillText(s.val, x, 580)
    ctx.fillStyle = muted; ctx.font = `500 12px -apple-system, system-ui, sans-serif`
    ctx.fillText(s.label.toUpperCase(), x, 600)
  })

  const dotsY = 650, dotR = 6, gap = 16
  const startX = S / 2 - (9 * (dotR * 2 + gap)) / 2
  for (let i = 0; i < 10; i++) {
    const x = startX + i * (dotR * 2 + gap) + dotR
    const done = i <= (lvl?.index ?? 0)
    ctx.beginPath()
    ctx.arc(x, dotsY, done && i === lvl?.index ? dotR + 2 : dotR, 0, Math.PI * 2)
    ctx.fillStyle = done ? (i === lvl?.index ? lvlColor : hexAlpha(lvlColor, 0.5)) : hexAlpha(muted, 0.3)
    ctx.fill()
  }
  drawBranding(ctx, S, muted, border)
}

// ── TARJETA 3: Nutrición del día ──────────────────────────────────────────────
function drawNutritionCard(ctx, { consumed, targets, water_ml, date }, c) {
  const S = 800
  const { accent, bg, surface, text, muted, border } = c
  const kcalColor  = '#22c55e'
  const waterColor = '#60a5fa'

  ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S)
  ctx.fillStyle = surface; rrect(ctx, 32, 32, S - 64, S - 64, 24); ctx.fill()
  drawHeader(ctx, S, kcalColor, muted, date ?? new Date().toLocaleDateString('es', { day: 'numeric', month: 'long' }))

  // Título
  ctx.fillStyle = text
  ctx.font = `800 40px -apple-system, "SF Pro Display", system-ui, sans-serif`
  ctx.textAlign = 'center'; ctx.fillText('Nutrición del día', S / 2, 145)

  // Kcal grande
  const kcal       = Math.round(consumed?.kcal ?? 0)
  const kcalTarget = targets?.kcal ?? 2000
  const kcalPct    = Math.min(Math.round((kcal / kcalTarget) * 100), 100)

  ctx.fillStyle = kcalColor
  ctx.font = `800 72px -apple-system, "SF Pro Display", system-ui, sans-serif`
  ctx.textAlign = 'center'; ctx.fillText(formatNum(kcal), S / 2, 240)
  ctx.fillStyle = muted; ctx.font = `500 18px -apple-system, system-ui, sans-serif`
  ctx.fillText(`kcal de ${formatNum(kcalTarget)} objetivo · ${kcalPct}%`, S / 2, 275)

  // Barra kcal
  const barX = 80, barH = 14
  ctx.fillStyle = hexAlpha(kcalColor, 0.15)
  rrect(ctx, barX, 298, S - 160, barH, barH / 2); ctx.fill()
  ctx.fillStyle = kcalColor
  rrect(ctx, barX, 298, Math.max(barH, (kcalPct / 100) * (S - 160)), barH, barH / 2); ctx.fill()

  ctx.strokeStyle = border; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(64, 336); ctx.lineTo(S - 64, 336); ctx.stroke()

  // Macros: 3 columnas
  const macros = [
    { label: 'PROTEÍNA',   val: Math.round(consumed?.protein ?? 0), target: targets?.protein ?? 150, unit: 'g', color: '#f59e0b' },
    { label: 'CARBOS',     val: Math.round(consumed?.carbs   ?? 0), target: targets?.carbs   ?? 200, unit: 'g', color: '#8b5cf6' },
    { label: 'GRASAS',     val: Math.round(consumed?.fat     ?? 0), target: targets?.fat     ??  60, unit: 'g', color: '#ec4899' },
  ]
  const macroColX = [S / 6, S / 2, (S * 5) / 6]
  macros.forEach((m, i) => {
    const x   = macroColX[i]
    const pct = Math.min(Math.round((m.val / m.target) * 100), 100)
    ctx.fillStyle = m.color
    ctx.font = `800 34px -apple-system, "SF Pro Display", system-ui, sans-serif`
    ctx.textAlign = 'center'; ctx.fillText(m.val + m.unit, x, 400)
    ctx.fillStyle = muted; ctx.font = `500 11px -apple-system, system-ui, sans-serif`
    ctx.fillText(m.label, x, 422)
    ctx.fillText(`${pct}% de ${m.target}${m.unit}`, x, 438)
    // mini-bar debajo
    const bw = 100, bh = 6, bx = x - bw / 2, by = 448
    ctx.fillStyle = hexAlpha(m.color, 0.2); rrect(ctx, bx, by, bw, bh, bh / 2); ctx.fill()
    ctx.fillStyle = m.color; rrect(ctx, bx, by, Math.max(bh, (pct / 100) * bw), bh, bh / 2); ctx.fill()
  })

  // Divisores verticales
  ctx.strokeStyle = border; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(S / 3, 360); ctx.lineTo(S / 3, 462); ctx.stroke()
  ctx.beginPath(); ctx.moveTo((S * 2) / 3, 360); ctx.lineTo((S * 2) / 3, 462); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(64, 472); ctx.lineTo(S - 64, 472); ctx.stroke()

  // Agua
  const waterMl    = water_ml ?? 0
  const waterPct   = Math.min(Math.round((waterMl / 2500) * 100), 100)
  const waterL     = (waterMl / 1000).toFixed(1)

  ctx.fillStyle = waterColor
  ctx.font = `800 44px -apple-system, "SF Pro Display", system-ui, sans-serif`
  ctx.textAlign = 'center'; ctx.fillText('💧 ' + waterL + ' L', S / 2, 540)
  ctx.fillStyle = muted; ctx.font = `500 15px -apple-system, system-ui, sans-serif`
  ctx.fillText(`Agua · ${waterPct}% de 2.5 L`, S / 2, 568)

  // Barra agua
  ctx.fillStyle = hexAlpha(waterColor, 0.15)
  rrect(ctx, barX, 585, S - 160, barH, barH / 2); ctx.fill()
  ctx.fillStyle = waterColor
  rrect(ctx, barX, 585, Math.max(barH, (waterPct / 100) * (S - 160)), barH, barH / 2); ctx.fill()

  drawBranding(ctx, S, muted, border)
}

// ── TARJETA 4: Progreso / estadísticas ───────────────────────────────────────
function drawProgressCard(ctx, { ranking, streak, sessionsCount, volumeTotal }, c) {
  const S = 800
  const { accent, bg, surface, text, muted, border } = c
  const lvl      = ranking?.currentLevel
  const lvlColor = lvl?.color || accent

  ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S)
  ctx.fillStyle = surface; rrect(ctx, 32, 32, S - 64, S - 64, 24); ctx.fill()
  drawHeader(ctx, S, lvlColor, muted, 'Mi progreso')

  // Emoji de nivel grande
  ctx.font = `72px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
  ctx.textAlign = 'center'; ctx.fillText(lvl?.emoji || '🌱', S / 2, 190)

  ctx.fillStyle = lvlColor
  const nameSize = fitText(ctx, lvl?.name || 'Iniciado', 600, [48, 40, 32])
  ctx.font = `800 ${nameSize}px -apple-system, "SF Pro Display", system-ui, sans-serif`
  ctx.textAlign = 'center'; ctx.fillText(lvl?.name || 'Iniciado', S / 2, 270)

  ctx.fillStyle = muted; ctx.font = `500 15px -apple-system, system-ui, sans-serif`
  ctx.fillText(`Nivel ${(lvl?.index ?? 0) + 1} de 10`, S / 2, 298)

  ctx.strokeStyle = border; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(64, 325); ctx.lineTo(S - 64, 325); ctx.stroke()

  // 4 stats
  const statsData = [
    { val: formatNum(ranking?.xp ?? 0) + ' XP', label: 'EXPERIENCIA',  color: lvlColor },
    { val: String(streak ?? 0) + ' días',        label: 'RACHA ACTUAL', color: '#f59e0b' },
    { val: String(sessionsCount ?? 0),            label: 'SESIONES',     color: accent   },
    { val: formatNum(volumeTotal ?? 0) + ' kg',  label: 'VOLUMEN TOTAL',color: '#22c55e' },
  ]
  const sRows = [430, 570]
  const sCols = [S / 4, (S * 3) / 4]
  statsData.forEach((s, i) => {
    const x = sCols[i % 2], y = sRows[Math.floor(i / 2)]
    ctx.fillStyle = s.color
    ctx.font = `800 36px -apple-system, "SF Pro Display", system-ui, sans-serif`
    ctx.textAlign = 'center'; ctx.fillText(s.val, x, y)
    ctx.fillStyle = muted; ctx.font = `600 11px -apple-system, system-ui, sans-serif`
    ctx.fillText(s.label, x, y + 24)
  })

  ctx.strokeStyle = border; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(S / 2, 360); ctx.lineTo(S / 2, 620); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(80, 498); ctx.lineTo(S - 80, 498); ctx.stroke()

  drawBranding(ctx, S, muted, border)
}

// ── TARJETA 5: Reto completado ────────────────────────────────────────────────
function drawChallengeCard(ctx, { challenge, ranking, streak }, c) {
  const S = 800
  const { accent, bg, surface, text, muted, border } = c
  const catColor = challenge?.category_color || accent

  ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S)
  ctx.fillStyle = surface; rrect(ctx, 32, 32, S - 64, S - 64, 24); ctx.fill()
  drawHeader(ctx, S, catColor, muted, '¡Reto superado!')

  // Badge
  const cx = S / 2, cy = 185
  const grad = ctx.createRadialGradient(cx - 8, cy - 8, 4, cx, cy, 52)
  grad.addColorStop(0, catColor)
  grad.addColorStop(1, hexAlpha(catColor, 0.6))
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.fill()
  ctx.font = `44px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
  ctx.textAlign = 'center'; ctx.fillText(challenge?.category_emoji || '🏆', cx, 200)

  // Título del reto
  const title = challenge?.reward_title || 'Reto completado'
  const tSize = fitText(ctx, title, 620, [32, 26, 22, 18])
  ctx.fillStyle = text
  ctx.font = `bold ${tSize}px -apple-system, "SF Pro Display", system-ui, sans-serif`
  ctx.textAlign = 'center'; ctx.fillText(title, cx, 304)
  ctx.fillStyle = catColor; ctx.font = `700 16px -apple-system, system-ui, sans-serif`
  ctx.fillText(challenge?.category_label || '', cx, 334)

  ctx.strokeStyle = border; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(64, 360); ctx.lineTo(S - 64, 360); ctx.stroke()

  // Stats del reto
  const stats2 = [
    { val: (challenge?.days ?? '—') + (challenge?.days === 1 ? ' día' : ' días'), label: 'DURACIÓN',     color: catColor },
    { val: '+' + (challenge?.cost ?? 0) + ' pts',                                  label: 'PTS GANADOS',  color: '#22c55e' },
  ]
  const sCols2 = [S / 4, (S * 3) / 4]
  stats2.forEach((s, i) => {
    const x = sCols2[i]
    ctx.fillStyle = s.color
    ctx.font = `800 42px -apple-system, "SF Pro Display", system-ui, sans-serif`
    ctx.textAlign = 'center'; ctx.fillText(s.val, x, 448)
    ctx.fillStyle = muted; ctx.font = `600 11px -apple-system, system-ui, sans-serif`
    ctx.fillText(s.label, x, 472)
  })
  ctx.strokeStyle = border; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(S / 2, 375); ctx.lineTo(S / 2, 490); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(64, 500); ctx.lineTo(S - 64, 500); ctx.stroke()

  // Nivel actual
  if (ranking?.currentLevel) {
    const lvl = ranking.currentLevel
    ctx.font = `36px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
    ctx.textAlign = 'center'; ctx.fillText(lvl.emoji, cx - 90, 570)
    ctx.fillStyle = lvl.color
    ctx.font = `bold 22px -apple-system, system-ui, sans-serif`
    ctx.textAlign = 'left'; ctx.fillText(lvl.name, cx - 60, 563)
    ctx.fillStyle = muted; ctx.font = `500 14px -apple-system, system-ui, sans-serif`
    ctx.fillText(`${ranking.xp} XP · Nivel ${(lvl.index ?? 0) + 1}`, cx - 60, 583)
  }
  if (streak > 0) {
    ctx.font = `500 16px -apple-system, system-ui, sans-serif`
    ctx.fillStyle = '#f59e0b'; ctx.textAlign = 'center'
    ctx.fillText('🔥 ' + streak + ' días de racha', cx, 640)
  }
  drawBranding(ctx, S, muted, border)
}

// ── API pública ───────────────────────────────────────────────────────────────

export function useShareCard() {

  function buildCanvas(drawFn, data, squareSize = 800) {
    const dpr    = Math.min(window.devicePixelRatio || 1, 2)
    const canvas = document.createElement('canvas')
    canvas.width  = squareSize * dpr
    canvas.height = squareSize * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    drawFn(ctx, data, getThemeColors())
    return canvas
  }

  async function shareCanvas(canvas, filename, shareText) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) { reject(new Error('Canvas vacío')); return }
        const file = new File([blob], filename, { type: 'image/png' })
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ title: 'DISCIPLINA', text: shareText, files: [file] })
            resolve('shared')
          } catch (e) {
            if (e.name !== 'AbortError') { downloadBlob(blob, filename); resolve('downloaded') }
            else resolve('cancelled')
          }
        } else {
          downloadBlob(blob, filename)
          resolve('downloaded')
        }
      }, 'image/png')
    })
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href = url; a.download = filename
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function shareWorkout(data) {
    const canvas = buildCanvas(drawWorkoutCard, data)
    return shareCanvas(canvas, `disciplina-workout-${new Date().toISOString().slice(0, 10)}.png`,
      `¡Sesión completada! 💪 ${data.session?.name || ''} — DISCIPLINA`)
  }

  async function shareRank(data) {
    const canvas  = buildCanvas(drawRankCard, data)
    const lvlName = data.ranking?.currentLevel?.name || 'Iniciado'
    return shareCanvas(canvas, `disciplina-rank-${lvlName.toLowerCase()}.png`,
      `¡Soy ${lvlName} en DISCIPLINA! ${data.ranking?.currentLevel?.emoji || ''} — ${data.ranking?.xp ?? 0} XP`)
  }

  async function shareNutrition(data) {
    const canvas = buildCanvas(drawNutritionCard, data)
    const kcal   = Math.round(data.consumed?.kcal ?? 0)
    return shareCanvas(canvas, `disciplina-nutricion-${new Date().toISOString().slice(0, 10)}.png`,
      `Hoy llevo ${kcal} kcal registradas 🥗 — DISCIPLINA`)
  }

  async function shareProgress(data) {
    const canvas = buildCanvas(drawProgressCard, data)
    return shareCanvas(canvas, `disciplina-progreso-${new Date().toISOString().slice(0, 10)}.png`,
      `Mi progreso en DISCIPLINA: ${data.ranking?.currentLevel?.name || 'Iniciado'} — ${data.ranking?.xp ?? 0} XP 💪`)
  }

  async function shareChallenge(data) {
    const canvas = buildCanvas(drawChallengeCard, data)
    const title  = data.challenge?.reward_title || 'un reto'
    return shareCanvas(canvas, `disciplina-reto-${new Date().toISOString().slice(0, 10)}.png`,
      `¡Completé "${title}" en DISCIPLINA! 🏆 +${data.challenge?.cost ?? 0} pts`)
  }

  return { shareWorkout, shareRank, shareNutrition, shareProgress, shareChallenge }
}
