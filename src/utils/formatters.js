/** Formatea segundos como mm:ss */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/** Formatea minutos como "1h 20m" o "45 min" */
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/** Retorna fecha en formato YYYY-MM-DD usando hora local (no UTC) */
export function toDateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Formatea fecha para mostrar: "Lunes 22 marzo" */
export function formatDateDisplay(dateStr) {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Formatea número con separador de miles */
export function formatNumber(n, decimals = 0) {
  return Number(n || 0).toLocaleString('es-CL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** Formatea peso: "75 kg" o "75.5 kg" */
export function formatWeight(kg) {
  const n = Number(kg || 0)
  return n % 1 === 0 ? `${n} kg` : `${n.toFixed(1)} kg`
}

/** Porcentaje redondeado con tope en 100 */
export function pct(value, total) {
  if (!total) return 0
  return Math.min(100, Math.round((value / total) * 100))
}

/** Nombre del día de la semana en español */
export function getDayName(date = new Date()) {
  return date.toLocaleDateString('es-CL', { weekday: 'long' })
}

/** Nombre corto del día (Lun, Mar, Mié...) */
export function getDayShort(date = new Date()) {
  const full = date.toLocaleDateString('es-CL', { weekday: 'short' }).replace(/\./g, '')
  return full.charAt(0).toUpperCase() + full.slice(1)
}
