/**
 * useFoodTranslation.js
 * Traduce nombres de alimentos EN→ES-CL usando MyMemory API + cache localStorage.
 * - Primero simplifica el nombre USDA (muy verbose)
 * - Busca en cache local (hasta 800 entradas)
 * - Si no está en cache, llama a MyMemory (1.000 req/día gratis, sin clave)
 * - Resultado siempre en español chileno
 */

const CACHE_KEY     = 'disciplina_food_trans_v1'
const MAX_CACHE     = 800
const REQUEST_DELAY = 120 // ms entre llamadas para no saturar MyMemory

// ── Cache localStorage ────────────────────────────────────────────

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') } catch { return {} }
}

function saveCache(cache) {
  try {
    const entries = Object.entries(cache)
    // Mantener solo las últimas MAX_CACHE entradas
    const trimmed = entries.length > MAX_CACHE
      ? Object.fromEntries(entries.slice(-MAX_CACHE))
      : cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed))
  } catch { /* ignorar errores de storage */ }
}

// ── Simplificador de nombres USDA ────────────────────────────────
// Los nombres USDA son muy verbosos: "Chicken, broilers or fryers, breast, meat only, raw"
// Los simplificamos a algo manejable antes de traducir.

const USDA_SIMPLIFY_MAP = {
  // Aves
  'chicken, broilers or fryers, breast':  'chicken breast',
  'chicken, breast':                       'chicken breast',
  'chicken, broilers or fryers, thigh':    'chicken thigh',
  'chicken, broilers or fryers, drumstick':'chicken drumstick',
  'chicken, broilers or fryers, wing':     'chicken wing',
  'chicken, broilers or fryers':           'chicken',
  'turkey, breast':                        'turkey breast',
  'turkey, ground':                        'ground turkey',
  // Res
  'beef, ground':                          'ground beef',
  'beef, loin':                            'beef loin',
  'beef, rib':                             'beef ribs',
  'beef, round':                           'beef round',
  'beef, chuck':                           'beef chuck',
  // Cerdo
  'pork, loin':                            'pork loin',
  'pork, ground':                          'ground pork',
  // Pescados
  'fish, salmon':                          'salmon',
  'fish, tuna':                            'tuna',
  'fish, tilapia':                         'tilapia',
  'fish, cod':                             'cod',
  'crustaceans, shrimp':                   'shrimp',
  // Lácteos
  'milk, whole':                           'whole milk',
  'milk, reduced fat':                     'reduced fat milk',
  'milk, nonfat':                          'skim milk',
  'yogurt, plain, whole milk':             'whole milk yogurt',
  'yogurt, greek, plain':                  'greek yogurt',
  'cheese, cottage':                       'cottage cheese',
  'cheese, cheddar':                       'cheddar cheese',
  'egg, whole':                            'whole egg',
  'egg, white':                            'egg white',
  // Cereales
  'rice, white, long-grain':              'white rice',
  'rice, brown, long-grain':              'brown rice',
  'oats':                                  'oats',
  'bread, whole-wheat':                    'whole wheat bread',
  'bread, white':                          'white bread',
  'pasta, dry':                            'dry pasta',
  'pasta, cooked':                         'cooked pasta',
  'wheat flour, white':                    'white flour',
  'wheat flour, whole-grain':              'whole wheat flour',
  'corn flour':                            'corn flour',
  // Frutas
  'bananas, raw':                          'banana',
  'apples, raw':                           'apple',
  'oranges, raw':                          'orange',
  'strawberries, raw':                     'strawberries',
  'grapes, raw':                           'grapes',
  'watermelon, raw':                       'watermelon',
  'pineapple, raw':                        'pineapple',
  'mango, raw':                            'mango',
  'avocado, raw':                          'avocado',
  'lemon, raw':                            'lemon',
  // Verduras
  'potato, baked':                         'baked potato',
  'potato, boiled':                        'boiled potato',
  'sweet potato, baked':                   'baked sweet potato',
  'sweet potato, raw':                     'sweet potato',
  'broccoli, raw':                         'broccoli',
  'broccoli, cooked':                      'cooked broccoli',
  'spinach, raw':                          'spinach',
  'tomatoes, raw':                         'tomatoes',
  'lettuce, raw':                          'lettuce',
  'onions, raw':                           'onion',
  'garlic, raw':                           'garlic',
  'carrots, raw':                          'carrots',
  'cauliflower, raw':                      'cauliflower',
  'cucumber, raw':                         'cucumber',
  'peppers, sweet, green':                 'green bell pepper',
  'peppers, sweet, red':                   'red bell pepper',
  // Legumbres
  'lentils, cooked':                       'cooked lentils',
  'beans, black, cooked':                  'black beans',
  'beans, kidney, cooked':                 'kidney beans',
  'chickpeas, cooked':                     'cooked chickpeas',
  // Frutos secos / aceites
  'almonds':                               'almonds',
  'walnuts':                               'walnuts',
  'peanuts':                               'peanuts',
  'peanut butter':                         'peanut butter',
  'oil, olive':                            'olive oil',
  'oil, coconut':                          'coconut oil',
  'oil, sunflower':                        'sunflower oil',
  'butter':                                'butter',
  // Otros
  'honey':                                 'honey',
  'sugar':                                 'sugar',
  'salt':                                  'salt',
  'oats, instant':                         'instant oats',
  'quinoa, cooked':                        'cooked quinoa',
  'chia seeds':                            'chia seeds',
  'flaxseed':                              'flaxseed',
}

// Simplifica el nombre USDA verboso antes de traducir
function simplifyUSDAName(name) {
  const lower = name.toLowerCase().trim()

  // Buscar coincidencia en el mapa de simplificación (prefijo)
  const entries = Object.entries(USDA_SIMPLIFY_MAP).sort((a, b) => b[0].length - a[0].length)
  for (const [key, simplified] of entries) {
    if (lower.startsWith(key)) return simplified
  }

  // Fallback: tomar solo la primera parte antes de la primera coma (eliminar descriptores)
  const parts = name.split(',')
  const base  = parts[0].trim()

  // Quitar descriptores comunes al final
  const cleaned = base
    .replace(/\b(raw|cooked|fresh|dried|canned|frozen|whole|plain|regular|unenriched)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned || base
}

// ── Traducción MyMemory ───────────────────────────────────────────

async function translateOne(text, cache) {
  const key = text.toLowerCase().trim()
  if (cache[key]) return cache[key]

  try {
    const url        = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es-CL`
    const controller = new AbortController()
    const tid        = setTimeout(() => controller.abort(), 4000)
    const res        = await fetch(url, { signal: controller.signal })
    clearTimeout(tid)
    if (!res.ok) return null
    const data = await res.json()
    const translated = data?.responseData?.translatedText?.trim()

    // Descartar si la "traducción" es el mismo texto o parece un error
    if (!translated || translated.toLowerCase() === key || translated.startsWith('MYMEMORY WARNING')) {
      return null
    }
    // Capitalizar primera letra
    const result = translated.charAt(0).toUpperCase() + translated.slice(1).toLowerCase()
    cache[key] = result
    return result
  } catch {
    return null
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ── Función principal exportada ───────────────────────────────────

/**
 * Traduce un array de nombres de alimentos USDA (inglés) a español chileno.
 * Retorna un objeto { originalName: traducción } con todos los nombres en ES.
 * Los no traducidos se mantienen como el nombre simplificado en inglés.
 */
export async function translateUSDAFoods(foods) {
  const cache = loadCache()
  const result = {}

  for (const food of foods) {
    const simplified = simplifyUSDAName(food.name ?? '')
    const key        = simplified.toLowerCase().trim()

    if (cache[key]) {
      result[food.id] = cache[key]
      continue
    }

    // Intentar traducción via API
    const translated = await translateOne(simplified, cache)
    result[food.id] = translated ?? capitalizeWords(simplified)
    await sleep(REQUEST_DELAY)
  }

  saveCache(cache)
  return result
}

/**
 * Traducción sincrónica usando solo el cache (sin llamada API).
 * Útil para re-renders sin delay.
 */
export function translateFromCache(name) {
  const cache     = loadCache()
  const simplified = simplifyUSDAName(name ?? '')
  const key        = simplified.toLowerCase().trim()
  return cache[key] ?? capitalizeWords(simplified)
}

function capitalizeWords(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
