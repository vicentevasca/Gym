/**
 * useShareCard — Genera imágenes de tarjeta para compartir usando Canvas API.
 * Soporta Web Share API (móvil) con fallback a descarga.
 */

// Colores de acento por tema (CSS custom properties → hex confiable)
const ACCENT_MAP = {
  lilac: '#a78bfa',
  sky:   '#38bdf8',
  rose:  '#fb7185',
  mint:  '#34d399',
  amber: '#fbbf24',
}

function getThemeColors() {
  const root      = document.documentElement
  const themeKey  = root.closest('[data-theme]')?.dataset?.theme
                 || document.querySelector('[data-theme]')?.dataset?.theme
                 || 'lilac'
  const modeEl    = document.querySelector('[data-mode]')
  const isDark    = !modeEl || modeEl.dataset?.mode !== 'light'

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

// ── Helpers ──────────────────────────────────────────────────────────────────

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
  // hex: '#rrggbb', alpha: 0-1 → returns rgba
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function formatNum(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// ── Workout card ─────────────────────────────────────────────────────────────

function drawWorkoutCard(ctx, { session, ranking, streak }, c) {
  const S = 800
  const { accent, bg, surface, text, muted, border } = c

  // Background
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, S, S)

  // Subtle card area
  ctx.fillStyle = surface
  rrect(ctx, 32, 32, S - 64, S - 64, 24)
  ctx.fill()

  // Accent top stripe (inside card)
  const stripeGrad = ctx.createLinearGradient(32, 0, S - 32, 0)
  stripeGrad.addColorStop(0, accent)
  stripeGrad.addColorStop(0.7, hexAlpha(accent, 0.4))
  stripeGrad.addColorStop(1, hexAlpha(accent, 0.05))
  ctx.fillStyle = stripeGrad
  ctx.beginPath()
  ctx.moveTo(56, 32)
  ctx.lineTo(S - 56, 32)
  ctx.quadraticCurveTo(S - 32, 32, S - 32, 56)
  ctx.lineTo(S - 32, 40)
  ctx.quadraticCurveTo(S - 32, 32, S - 56, 32)
  // Simpler: just a rect on top edge of card
  rrect(ctx, 32, 32, S - 64, 8, 4)
  ctx.fill()

  // App label (top-left)
  ctx.fillStyle = hexAlpha(accent, 0.9)
  ctx.font = `700 13px -apple-system, system-ui, sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText('DISCIPLINA', 64, 78)

  // Date (top-right)
  ctx.fillStyle = muted
  ctx.font = `500 13px -apple-system, system-ui, sans-serif`
  ctx.textAlign = 'right'
  const dateStr = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
  ctx.fillText(dateStr, S - 64, 78)

  // Check circle
  const cx = S / 2, cy = 190, r = 52
  const circleGrad = ctx.createRadialGradient(cx - 10, cy - 10, 5, cx, cy, r)
  circleGrad.addColorStop(0, accent)
  circleGrad.addColorStop(1, hexAlpha(accent, 0.7))
  ctx.fillStyle = circleGrad
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  // Checkmark
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - 20, cy + 3)
  ctx.lineTo(cx - 2, cy + 21)
  ctx.lineTo(cx + 24, cy - 16)
  ctx.stroke()

  // Session name
  const title = session?.name || 'Sesión completada'
  const titleSize = fitText(ctx, title, 640, [34, 28, 24, 20])
  ctx.fillStyle = text
  ctx.font = `bold ${titleSize}px -apple-system, "SF Pro Display", system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(title, cx, 298)

  // Subtitle
  ctx.fillStyle = muted
  ctx.font = `500 16px -apple-system, system-ui, sans-serif`
  ctx.fillText('¡Sesión completada!', cx, 326)

  // Divider
  ctx.strokeStyle = border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(64, 352)
  ctx.lineTo(S - 64, 352)
  ctx.stroke()

  // Stats — 2×2 grid
  const stats = [
    { val: String(session?.exercises?.length ?? 0),                                        label: 'EJERCICIOS' },
    { val: String(session?.exercises?.reduce((a, e) => a + (e.sets?.length || 0), 0) ?? 0), label: 'SERIES' },
    { val: String(session?.volume_total_kg ?? 0) + ' kg',                                  label: 'VOLUMEN' },
    { val: session?.pointsEarned ? '+' + session.pointsEarned + ' XP' : '— XP',           label: 'XP GANADO' },
  ]

  const cols = [S / 4, (S * 3) / 4]
  const rows = [430, 520]
  stats.forEach((s, i) => {
    const x = cols[i % 2]
    const y = rows[Math.floor(i / 2)]

    ctx.fillStyle = accent
    ctx.font = `bold 38px -apple-system, "SF Pro Display", system-ui, "SF Pro Text", sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(s.val, x, y)

    ctx.fillStyle = muted
    ctx.font = `600 11px -apple-system, system-ui, sans-serif`
    ctx.fillText(s.label, x, y + 22)
  })

  // Vertical divider between columns
  ctx.strokeStyle = border
  ctx.beginPath()
  ctx.moveTo(S / 2, 375)
  ctx.lineTo(S / 2, 555)
  ctx.stroke()

  // Horizontal divider between rows
  ctx.beginPath()
  ctx.moveTo(80, 472)
  ctx.lineTo(S - 80, 472)
  ctx.stroke()

  // Level badge
  if (ranking?.currentLevel) {
    const lvl = ranking.currentLevel
    rrect(ctx, cx - 120, 575, 240, 44, 22)
    ctx.fillStyle = hexAlpha(lvl.color, 0.15)
    ctx.fill()
    ctx.strokeStyle = hexAlpha(lvl.color, 0.35)
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.font = `18px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
    ctx.textAlign = 'center'
    ctx.fillStyle = lvl.color
    ctx.fillText(lvl.emoji, cx - 40, 604)

    ctx.font = `bold 16px -apple-system, system-ui, sans-serif`
    ctx.fillStyle = lvl.color
    ctx.fillText(lvl.name, cx + 36, 604)
  }

  // Streak
  if (streak > 0) {
    ctx.font = `500 15px -apple-system, system-ui, sans-serif`
    ctx.fillStyle = '#f59e0b'
    ctx.textAlign = 'center'
    ctx.fillText('🔥 ' + streak + ' días de racha', cx, 650)
  }

  // Bottom divider + branding
  ctx.strokeStyle = border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(64, S - 80)
  ctx.lineTo(S - 64, S - 80)
  ctx.stroke()

  ctx.fillStyle = hexAlpha(muted, 0.6)
  ctx.font = `500 12px -apple-system, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('Forjado con DISCIPLINA', cx, S - 52)
}

// ── Rank card ─────────────────────────────────────────────────────────────────

function drawRankCard(ctx, { ranking, streak }, c) {
  const S = 800
  const { accent, bg, surface, text, muted, border } = c
  const lvl  = ranking?.currentLevel
  const next = ranking?.nextLevel
  const xp   = ranking?.xp ?? 0
  const pct  = ranking?.levelProgress ?? 0
  const lvlColor = lvl?.color || accent

  // Background
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, S, S)

  ctx.fillStyle = surface
  rrect(ctx, 32, 32, S - 64, S - 64, 24)
  ctx.fill()

  // Top accent stripe
  rrect(ctx, 32, 32, S - 64, 8, 4)
  const sGrad = ctx.createLinearGradient(32, 0, S - 32, 0)
  sGrad.addColorStop(0, lvlColor)
  sGrad.addColorStop(1, hexAlpha(lvlColor, 0.1))
  ctx.fillStyle = sGrad
  ctx.fill()

  // App label
  ctx.fillStyle = hexAlpha(lvlColor, 0.9)
  ctx.font = `700 13px -apple-system, system-ui, sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText('DISCIPLINA', 64, 78)

  ctx.fillStyle = muted
  ctx.font = `500 13px -apple-system, system-ui, sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText('Mi rango actual', S - 64, 78)

  // Big level emoji
  ctx.font = `96px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(lvl?.emoji || '🌱', S / 2, 230)

  // Level name
  const name = lvl?.name || 'Iniciado'
  fitText(ctx, name, 600, [58, 46, 38])
  ctx.font = ctx.font  // already set by fitText side effect... let me redo
  const nameSize = fitText(ctx, name, 600, [58, 46, 38])
  ctx.fillStyle = lvlColor
  ctx.font = `800 ${nameSize}px -apple-system, "SF Pro Display", system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(name, S / 2, 318)

  // Level index
  ctx.fillStyle = muted
  ctx.font = `500 16px -apple-system, system-ui, sans-serif`
  ctx.fillText(`Nivel ${(lvl?.index ?? 0) + 1} de 10`, S / 2, 350)

  // XP number
  ctx.fillStyle = text
  ctx.font = `800 52px -apple-system, "SF Pro Display", system-ui, sans-serif`
  ctx.fillText(formatNum(xp) + ' XP', S / 2, 430)

  // Progress bar
  const barX = 80, barY = 455, barW = S - 160, barH = 12
  ctx.fillStyle = hexAlpha(lvlColor, 0.15)
  rrect(ctx, barX, barY, barW, barH, barH / 2)
  ctx.fill()

  ctx.fillStyle = lvlColor
  const fillW = Math.max(8, (pct / 100) * barW)
  rrect(ctx, barX, barY, fillW, barH, barH / 2)
  ctx.fill()

  // Progress label
  ctx.fillStyle = muted
  ctx.font = `500 14px -apple-system, system-ui, sans-serif`
  ctx.textAlign = 'center'
  const progressLabel = next
    ? `${pct}% hacia ${next.name} (${formatNum(ranking.pointsToNext || 0)} XP restantes)`
    : '¡Rango máximo alcanzado!'
  ctx.fillText(progressLabel, S / 2, 493)

  // Stats row
  ctx.strokeStyle = border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(80, 522)
  ctx.lineTo(S - 80, 522)
  ctx.stroke()

  const statItems = [
    { val: String(streak ?? 0) + ' días', label: 'Racha actual' },
    { val: formatNum(xp),                 label: 'XP total' },
    { val: String(ranking?.bests?.best_streak ?? 0) + ' días', label: 'Mejor racha' },
  ]

  const colsW = [S / 6, S / 2, (S * 5) / 6]
  statItems.forEach((s, i) => {
    const x = colsW[i]
    ctx.fillStyle = i === 1 ? lvlColor : text
    ctx.font = `bold 28px -apple-system, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(s.val, x, 580)
    ctx.fillStyle = muted
    ctx.font = `500 12px -apple-system, system-ui, sans-serif`
    ctx.fillText(s.label.toUpperCase(), x, 600)
  })

  // Level dots (minimap)
  const dotsY = 650, dotR = 6, gap = 16
  const totalDots = 10
  const startX = S / 2 - ((totalDots - 1) * (dotR * 2 + gap)) / 2
  for (let i = 0; i < totalDots; i++) {
    const x = startX + i * (dotR * 2 + gap) + dotR
    const done = i <= (lvl?.index ?? 0)
    ctx.beginPath()
    ctx.arc(x, dotsY, done && i === lvl?.index ? dotR + 2 : dotR, 0, Math.PI * 2)
    ctx.fillStyle = done ? (i === lvl?.index ? lvlColor : hexAlpha(lvlColor, 0.5)) : hexAlpha(muted, 0.3)
    ctx.fill()
  }

  // Bottom branding
  ctx.strokeStyle = border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(64, S - 80)
  ctx.lineTo(S - 64, S - 80)
  ctx.stroke()

  ctx.fillStyle = hexAlpha(muted, 0.6)
  ctx.font = `500 12px -apple-system, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('Forjado con DISCIPLINA', S / 2, S - 52)
}

// ── API pública ───────────────────────────────────────────────────────────────

export function useShareCard() {

  function buildCanvas(drawFn, data) {
    const SIZE = 800
    const dpr  = Math.min(window.devicePixelRatio || 1, 2)
    const canvas = document.createElement('canvas')
    canvas.width  = SIZE * dpr
    canvas.height = SIZE * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    const colors = getThemeColors()
    drawFn(ctx, data, colors)
    return canvas
  }

  async function shareCanvas(canvas, filename, shareText) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) { reject(new Error('Canvas vacío')); return }
        const file = new File([blob], filename, { type: 'image/png' })
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              title:  'DISCIPLINA',
              text:   shareText,
              files:  [file],
            })
            resolve('shared')
          } catch (e) {
            if (e.name !== 'AbortError') {
              // Fallback to download if share fails
              downloadBlob(blob, filename)
              resolve('downloaded')
            } else {
              resolve('cancelled')
            }
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
    a.href    = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  /**
   * Genera y comparte/descarga la tarjeta de entrenamiento completado.
   * @param {{ session, ranking, streak }} data
   */
  async function shareWorkout(data) {
    const canvas = buildCanvas(drawWorkoutCard, data)
    return shareCanvas(
      canvas,
      `disciplina-workout-${new Date().toISOString().slice(0, 10)}.png`,
      `¡Sesión completada! 💪 ${data.session?.name || ''} — DISCIPLINA`,
    )
  }

  /**
   * Genera y comparte/descarga la tarjeta de rango actual.
   * @param {{ ranking, streak }} data
   */
  async function shareRank(data) {
    const canvas = buildCanvas(drawRankCard, data)
    const lvlName = data.ranking?.currentLevel?.name || 'Iniciado'
    return shareCanvas(
      canvas,
      `disciplina-rank-${lvlName.toLowerCase()}.png`,
      `¡Soy ${lvlName} en DISCIPLINA! ${data.ranking?.currentLevel?.emoji || ''} — ${data.ranking?.xp ?? 0} XP`,
    )
  }

  return { shareWorkout, shareRank }
}
