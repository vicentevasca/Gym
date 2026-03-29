/**
 * DISCIPLINA — Planificador de dieta basado en evidencia científica
 * Todo el contenido en español. Datos nutricionales validados.
 *
 * Fuentes:
 * - ISSN Position Stand: Nutrient timing (Kerksick et al., 2017)
 * - Dietary Guidelines for Americans 2020-2025 (USDA/HHS)
 * - Vegetarian Diets: Position of the Academy of Nutrition and Dietetics (2016)
 * - Mediterranean diet and cardiovascular disease: PREDIMED trial (Estruch et al., 2013)
 * - Dietary protein for athletes: from requirements to optimum adaptation (Moore et al., 2009)
 */

// ── Tipos de dieta ──────────────────────────────────────────────────────────

export const DIET_TYPES = [
  {
    id: 'omnivoro',
    label: 'Omnívoro',
    icon: '🥩',
    description: 'Todos los grupos alimenticios',
  },
  {
    id: 'vegetariano',
    label: 'Vegetariano',
    icon: '🥦',
    description: 'Sin carne ni pescado, incluye lácteos y huevos',
  },
  {
    id: 'vegano',
    label: 'Vegano',
    icon: '🌱',
    description: 'Solo alimentos de origen vegetal',
  },
  {
    id: 'pescetariano',
    label: 'Pescetariano',
    icon: '🐟',
    description: 'Vegetariano + pescado y mariscos',
  },
  {
    id: 'cetogenico',
    label: 'Cetogénico',
    icon: '⚡',
    description: 'Muy bajo en carbos, alto en grasas',
  },
  {
    id: 'mediterraneo',
    label: 'Mediterráneo',
    icon: '🫒',
    description: 'Aceite de oliva, pescado, legumbres, cereales integrales',
  },
  {
    id: 'flexitariano',
    label: 'Flexitariano',
    icon: '🌿',
    description: 'Principalmente plantas, carne ocasional',
  },
  {
    id: 'paleo',
    label: 'Paleo',
    icon: '🦴',
    description: 'Sin procesados, granos ni lácteos',
  },
]

// ── Alergias ────────────────────────────────────────────────────────────────

export const ALLERGY_LIST = [
  { id: 'gluten',       label: 'Gluten',       icon: '🌾' },
  { id: 'lactosa',      label: 'Lactosa',       icon: '🥛' },
  { id: 'huevos',       label: 'Huevos',        icon: '🥚' },
  { id: 'mariscos',     label: 'Mariscos',      icon: '🦐' },
  { id: 'frutos_secos', label: 'Frutos secos',  icon: '🥜' },
  { id: 'soja',         label: 'Soja',          icon: '🫘' },
  { id: 'cacahuate',    label: 'Cacahuate',     icon: '🥜' },
  { id: 'sulfitos',     label: 'Sulfitos',      icon: '🍷' },
]

// ── Presupuestos ────────────────────────────────────────────────────────────

export const BUDGETS = [
  {
    id: 'bajo',
    label: 'Ajustado',
    description: 'Nutritivo y económico',
    icon: '💰',
  },
  {
    id: 'medio',
    label: 'Moderado',
    description: 'Buena variedad y calidad',
    icon: '💳',
  },
  {
    id: 'alto',
    label: 'Premium',
    description: 'Sin restricciones de presupuesto',
    icon: '💎',
  },
]

// ── Alimentos clave por tipo de dieta y presupuesto ─────────────────────────

const KEY_FOODS_DB = {
  omnivoro: {
    proteins: {
      bajo: [
        { name: 'Huevo entero', kcal_per_100g: 155, protein_per_100g: 13, budget: 'bajo' },
        { name: 'Pechuga de pollo', kcal_per_100g: 165, protein_per_100g: 31, budget: 'bajo' },
        { name: 'Atún enlatado en agua', kcal_per_100g: 116, protein_per_100g: 26, budget: 'bajo' },
        { name: 'Lentejas cocidas', kcal_per_100g: 116, protein_per_100g: 9, budget: 'bajo' },
        { name: 'Queso cottage', kcal_per_100g: 98, protein_per_100g: 11, budget: 'bajo' },
      ],
      medio: [
        { name: 'Pechuga de pollo', kcal_per_100g: 165, protein_per_100g: 31, budget: 'medio' },
        { name: 'Carne molida 90%', kcal_per_100g: 172, protein_per_100g: 26, budget: 'medio' },
        { name: 'Salmón enlatado', kcal_per_100g: 142, protein_per_100g: 20, budget: 'medio' },
        { name: 'Requesón', kcal_per_100g: 173, protein_per_100g: 28, budget: 'medio' },
        { name: 'Yogur griego', kcal_per_100g: 59, protein_per_100g: 10, budget: 'medio' },
      ],
      alto: [
        { name: 'Salmón fresco', kcal_per_100g: 208, protein_per_100g: 20, budget: 'alto' },
        { name: 'Carne de res magra', kcal_per_100g: 158, protein_per_100g: 26, budget: 'alto' },
        { name: 'Atún fresco', kcal_per_100g: 144, protein_per_100g: 23, budget: 'alto' },
        { name: 'Pechuga de pavo', kcal_per_100g: 135, protein_per_100g: 30, budget: 'alto' },
        { name: 'Proteína de suero (whey)', kcal_per_100g: 370, protein_per_100g: 80, budget: 'alto' },
      ],
    },
    carbs: [
      { name: 'Arroz blanco cocido', kcal_per_100g: 130, budget: 'bajo' },
      { name: 'Avena en hojuelas', kcal_per_100g: 389, budget: 'bajo' },
      { name: 'Papa/patata cocida', kcal_per_100g: 87, budget: 'bajo' },
      { name: 'Camote/batata', kcal_per_100g: 86, budget: 'bajo' },
      { name: 'Arroz integral cocido', kcal_per_100g: 123, budget: 'medio' },
      { name: 'Quinoa cocida', kcal_per_100g: 120, budget: 'medio' },
      { name: 'Pan integral', kcal_per_100g: 247, budget: 'bajo' },
      { name: 'Pasta integral', kcal_per_100g: 124, budget: 'bajo' },
    ],
    fats: [
      { name: 'Aceite de oliva virgen extra', kcal_per_100g: 884, budget: 'medio' },
      { name: 'Aguacate', kcal_per_100g: 160, budget: 'bajo' },
      { name: 'Almendras', kcal_per_100g: 579, budget: 'medio' },
      { name: 'Nueces', kcal_per_100g: 654, budget: 'medio' },
      { name: 'Semillas de chía', kcal_per_100g: 486, budget: 'bajo' },
    ],
    vegetables: [
      { name: 'Brócoli', kcal_per_100g: 34 },
      { name: 'Espinaca', kcal_per_100g: 23 },
      { name: 'Zanahoria', kcal_per_100g: 41 },
      { name: 'Tomate', kcal_per_100g: 18 },
      { name: 'Pepino', kcal_per_100g: 15 },
      { name: 'Pimiento rojo', kcal_per_100g: 31 },
      { name: 'Calabacín', kcal_per_100g: 17 },
      { name: 'Lechuga romana', kcal_per_100g: 17 },
    ],
    fruits: [
      { name: 'Plátano/banano', kcal_per_100g: 89 },
      { name: 'Manzana', kcal_per_100g: 52 },
      { name: 'Fresas', kcal_per_100g: 32 },
      { name: 'Arándanos', kcal_per_100g: 57 },
      { name: 'Naranja', kcal_per_100g: 47 },
      { name: 'Mango', kcal_per_100g: 60 },
    ],
  },
}

// Hereda de omnivoro con ajustes por tipo de dieta
function getFoodsForDiet(dietType, budget) {
  const base = KEY_FOODS_DB.omnivoro
  const budgetKey = budget || 'medio'

  const proteins = budget === 'bajo'
    ? base.proteins.bajo
    : budget === 'alto'
    ? base.proteins.alto
    : base.proteins.medio

  if (dietType === 'vegano' || dietType === 'vegetariano') {
    const vegProteins = [
      { name: 'Tofu firme', kcal_per_100g: 76, protein_per_100g: 8, budget: 'bajo' },
      { name: 'Tempeh', kcal_per_100g: 193, protein_per_100g: 19, budget: 'medio' },
      { name: 'Lentejas cocidas', kcal_per_100g: 116, protein_per_100g: 9, budget: 'bajo' },
      { name: 'Garbanzos cocidos', kcal_per_100g: 164, protein_per_100g: 9, budget: 'bajo' },
      { name: 'Frijoles negros', kcal_per_100g: 132, protein_per_100g: 8, budget: 'bajo' },
      { name: 'Quinoa cocida', kcal_per_100g: 120, protein_per_100g: 4, budget: 'medio' },
      { name: 'Edamame', kcal_per_100g: 121, protein_per_100g: 11, budget: 'medio' },
      { name: 'Soja texturizada', kcal_per_100g: 333, protein_per_100g: 52, budget: 'bajo' },
      { name: 'Semillas de cáñamo', kcal_per_100g: 553, protein_per_100g: 32, budget: 'alto' },
      { name: 'Amaranto cocido', kcal_per_100g: 102, protein_per_100g: 4, budget: 'bajo' },
    ]
    const extraProteins = dietType === 'vegetariano'
      ? [
          { name: 'Huevo entero', kcal_per_100g: 155, protein_per_100g: 13, budget: 'bajo' },
          { name: 'Yogur griego', kcal_per_100g: 59, protein_per_100g: 10, budget: 'medio' },
          { name: 'Queso cottage', kcal_per_100g: 98, protein_per_100g: 11, budget: 'bajo' },
        ]
      : []
    return {
      proteins: [...vegProteins, ...extraProteins],
      carbs: base.carbs,
      fats: base.fats,
      vegetables: base.vegetables,
      fruits: base.fruits,
    }
  }

  if (dietType === 'cetogenico') {
    return {
      proteins: proteins.slice(0, 5),
      carbs: [
        { name: 'Verduras de hoja verde', kcal_per_100g: 20, budget: 'bajo' },
        { name: 'Aguacate', kcal_per_100g: 160, budget: 'bajo' },
        { name: 'Brócoli', kcal_per_100g: 34, budget: 'bajo' },
        { name: 'Coliflor', kcal_per_100g: 25, budget: 'bajo' },
      ],
      fats: [
        { name: 'Aceite de coco', kcal_per_100g: 892, budget: 'medio' },
        { name: 'Aguacate', kcal_per_100g: 160, budget: 'bajo' },
        { name: 'Aceite de oliva virgen extra', kcal_per_100g: 884, budget: 'medio' },
        { name: 'Mantequilla sin sal', kcal_per_100g: 717, budget: 'bajo' },
        { name: 'Crema para batir', kcal_per_100g: 340, budget: 'bajo' },
        { name: 'Queso cheddar', kcal_per_100g: 403, budget: 'medio' },
        { name: 'Nueces de macadamia', kcal_per_100g: 718, budget: 'alto' },
        { name: 'Tocino / panceta', kcal_per_100g: 458, budget: 'bajo' },
      ],
      vegetables: base.vegetables.filter(v =>
        ['Brócoli', 'Espinaca', 'Calabacín', 'Pepino', 'Lechuga romana'].includes(v.name)
      ),
      fruits: [
        { name: 'Fresas', kcal_per_100g: 32 },
        { name: 'Frambuesas', kcal_per_100g: 52 },
        { name: 'Arándanos (pequeña cantidad)', kcal_per_100g: 57 },
      ],
    }
  }

  if (dietType === 'pescetariano') {
    const fishProteins = [
      { name: 'Salmón fresco', kcal_per_100g: 208, protein_per_100g: 20, budget: 'alto' },
      { name: 'Atún enlatado en agua', kcal_per_100g: 116, protein_per_100g: 26, budget: 'bajo' },
      { name: 'Tilapia', kcal_per_100g: 96, protein_per_100g: 21, budget: 'bajo' },
      { name: 'Sardinas en lata', kcal_per_100g: 208, protein_per_100g: 25, budget: 'bajo' },
      { name: 'Camarón/gamba cocido', kcal_per_100g: 99, protein_per_100g: 21, budget: 'medio' },
      { name: 'Merluza', kcal_per_100g: 86, protein_per_100g: 17, budget: 'medio' },
      { name: 'Huevo entero', kcal_per_100g: 155, protein_per_100g: 13, budget: 'bajo' },
      { name: 'Yogur griego', kcal_per_100g: 59, protein_per_100g: 10, budget: 'medio' },
    ]
    return {
      proteins: fishProteins,
      carbs: base.carbs,
      fats: base.fats,
      vegetables: base.vegetables,
      fruits: base.fruits,
    }
  }

  if (dietType === 'paleo') {
    const paleoProteins = [
      { name: 'Pechuga de pollo', kcal_per_100g: 165, protein_per_100g: 31, budget: 'bajo' },
      { name: 'Carne de res magra', kcal_per_100g: 158, protein_per_100g: 26, budget: 'alto' },
      { name: 'Salmón fresco', kcal_per_100g: 208, protein_per_100g: 20, budget: 'alto' },
      { name: 'Huevo entero', kcal_per_100g: 155, protein_per_100g: 13, budget: 'bajo' },
      { name: 'Pechuga de pavo', kcal_per_100g: 135, protein_per_100g: 30, budget: 'medio' },
      { name: 'Sardinas en lata', kcal_per_100g: 208, protein_per_100g: 25, budget: 'bajo' },
    ]
    return {
      proteins: paleoProteins,
      carbs: [
        { name: 'Camote/batata cocida', kcal_per_100g: 86, budget: 'bajo' },
        { name: 'Plátano verde cocido', kcal_per_100g: 89, budget: 'bajo' },
        { name: 'Remolacha', kcal_per_100g: 43, budget: 'bajo' },
        { name: 'Zanahoria', kcal_per_100g: 41, budget: 'bajo' },
        { name: 'Yuca cocida', kcal_per_100g: 160, budget: 'bajo' },
      ],
      fats: [
        { name: 'Aguacate', kcal_per_100g: 160, budget: 'bajo' },
        { name: 'Aceite de coco', kcal_per_100g: 892, budget: 'medio' },
        { name: 'Nueces', kcal_per_100g: 654, budget: 'medio' },
        { name: 'Almendras', kcal_per_100g: 579, budget: 'medio' },
        { name: 'Aceite de aguacate', kcal_per_100g: 884, budget: 'alto' },
      ],
      vegetables: base.vegetables,
      fruits: base.fruits,
    }
  }

  if (dietType === 'mediterraneo') {
    const medProteins = [
      { name: 'Salmón fresco', kcal_per_100g: 208, protein_per_100g: 20, budget: 'alto' },
      { name: 'Sardinas en lata', kcal_per_100g: 208, protein_per_100g: 25, budget: 'bajo' },
      { name: 'Atún enlatado en aceite de oliva', kcal_per_100g: 198, protein_per_100g: 24, budget: 'bajo' },
      { name: 'Garbanzos cocidos', kcal_per_100g: 164, protein_per_100g: 9, budget: 'bajo' },
      { name: 'Lentejas cocidas', kcal_per_100g: 116, protein_per_100g: 9, budget: 'bajo' },
      { name: 'Pollo asado', kcal_per_100g: 239, protein_per_100g: 27, budget: 'bajo' },
      { name: 'Queso feta', kcal_per_100g: 264, protein_per_100g: 14, budget: 'medio' },
      { name: 'Yogur griego', kcal_per_100g: 59, protein_per_100g: 10, budget: 'medio' },
    ]
    return {
      proteins: medProteins,
      carbs: [
        { name: 'Arroz integral cocido', kcal_per_100g: 123, budget: 'bajo' },
        { name: 'Pan integral de masa madre', kcal_per_100g: 274, budget: 'medio' },
        { name: 'Pasta integral', kcal_per_100g: 124, budget: 'bajo' },
        { name: 'Quinoa cocida', kcal_per_100g: 120, budget: 'medio' },
        { name: 'Cuscús integral', kcal_per_100g: 112, budget: 'bajo' },
        { name: 'Bulgur cocido', kcal_per_100g: 83, budget: 'bajo' },
      ],
      fats: [
        { name: 'Aceite de oliva virgen extra', kcal_per_100g: 884, budget: 'medio' },
        { name: 'Aceitunas negras', kcal_per_100g: 115, budget: 'bajo' },
        { name: 'Aguacate', kcal_per_100g: 160, budget: 'bajo' },
        { name: 'Almendras', kcal_per_100g: 579, budget: 'medio' },
        { name: 'Nueces', kcal_per_100g: 654, budget: 'medio' },
      ],
      vegetables: base.vegetables,
      fruits: [
        { name: 'Uvas rojas', kcal_per_100g: 69 },
        { name: 'Higos', kcal_per_100g: 74 },
        { name: 'Naranja', kcal_per_100g: 47 },
        { name: 'Manzana', kcal_per_100g: 52 },
        { name: 'Granada', kcal_per_100g: 83 },
        { name: 'Limón', kcal_per_100g: 29 },
      ],
    }
  }

  // omnivoro, flexitariano
  return {
    proteins,
    carbs: base.carbs,
    fats: base.fats,
    vegetables: base.vegetables,
    fruits: base.fruits,
  }
}

// ── Alimentos a evitar por alergia ──────────────────────────────────────────

const AVOID_BY_ALLERGY = {
  gluten:       ['Pan de trigo', 'Pasta de trigo', 'Cebada', 'Centeno', 'Avena (no certificada sin gluten)', 'Cerveza', 'Salsas de soja convencional'],
  lactosa:      ['Leche de vaca', 'Queso curado', 'Yogur convencional', 'Mantequilla', 'Helado', 'Crema'],
  huevos:       ['Huevo entero', 'Clara de huevo', 'Mayonesa', 'Merengue', 'Muchos productos horneados'],
  mariscos:     ['Camarón/gamba', 'Langosta', 'Cangrejo', 'Langostino', 'Vieiras', 'Almejas', 'Mejillones'],
  frutos_secos: ['Almendras', 'Nueces', 'Anacardos', 'Pistachos', 'Avellanas', 'Nueces de Brazil', 'Mantequilla de frutos secos'],
  soja:         ['Tofu', 'Tempeh', 'Edamame', 'Leche de soja', 'Miso', 'Salsa de soja', 'Soja texturizada'],
  cacahuate:    ['Cacahuates/maní', 'Mantequilla de cacahuate', 'Aceite de cacahuate', 'Productos horneados con maní'],
  sulfitos:     ['Vino', 'Fruta seca', 'Vinagre', 'Camarones en conserva', 'Alimentos procesados con conservantes E220-E228'],
}

// ── Suplementos por objetivo/dieta ──────────────────────────────────────────

function getSupplements(dietType, routineStyle, allergies) {
  const supplements = []
  const isVegan = dietType === 'vegano'
  const isVegetarian = dietType === 'vegetariano' || isVegan
  const isKeto = dietType === 'cetogenico'
  const isStrength = ['hipertrofia', 'fuerza', 'calistenia'].includes(routineStyle)
  const isCardio = ['cardio', 'hiit'].includes(routineStyle)

  if (isStrength) {
    supplements.push({
      name: 'Creatina monohidrato',
      dose: '3-5g diarios',
      timing: 'Cualquier momento del día (consistencia es clave)',
      rationale: 'El suplemento deportivo más estudiado. Mejora fuerza, potencia y masa muscular.',
      evidence: 'Nivel A — múltiples meta-análisis',
    })
  }

  if (!allergies?.includes('lactosa') && !isVegan) {
    supplements.push({
      name: 'Proteína de suero (Whey)',
      dose: '20-40g post-entrenamiento',
      timing: 'Dentro de 45 minutos post-ejercicio',
      rationale: 'Alto contenido en leucina, aminoácido disparador de síntesis proteica muscular.',
      evidence: 'Nivel A — ISSN Position Stand',
    })
  }

  if (isVegan) {
    supplements.push({
      name: 'Proteína vegana (guisante/arroz)',
      dose: '25-30g post-entrenamiento',
      timing: 'Post-entrenamiento o entre comidas',
      rationale: 'La combinación guisante + arroz provee perfil de aminoácidos completo comparable al suero.',
      evidence: 'Nivel B',
    })
    supplements.push({
      name: 'Vitamina B12',
      dose: '1000mcg (cianocobalamina) una vez al día',
      timing: 'Con el desayuno',
      rationale: 'Esencial para dietas veganas; prácticamente imposible de obtener de fuentes vegetales.',
      evidence: 'Nivel A — posición oficial ADA/AND',
    })
    supplements.push({
      name: 'Vitamina D3 + K2',
      dose: '2000 UI vitamina D3 + 100mcg K2 diarios',
      timing: 'Con comida que contenga grasa',
      rationale: 'Deficiencia común en veganos; el K2 optimiza la absorción del calcio y salud ósea.',
      evidence: 'Nivel B',
    })
    supplements.push({
      name: 'Omega-3 de algas',
      dose: '250-500mg EPA+DHA diarios',
      timing: 'Con la comida principal',
      rationale: 'Los veganos no consumen pescado; las algas son la fuente original de omega-3 en la cadena alimentaria.',
      evidence: 'Nivel B',
    })
  }

  if (isVegetarian && !isVegan) {
    supplements.push({
      name: 'Vitamina B12',
      dose: '500mcg (cianocobalamina) diarios',
      timing: 'Con el desayuno',
      rationale: 'Recomendado para vegetarianos que no consumen carnes. Las reservas pueden agotarse en meses/años.',
      evidence: 'Nivel B',
    })
  }

  if (isCardio) {
    supplements.push({
      name: 'Beta-alanina',
      dose: '3.2-6.4g diarios (divididos para evitar hormigueo)',
      timing: 'Pre-entrenamiento',
      rationale: 'Aumenta las reservas de carnosina muscular, mejora rendimiento en ejercicios de alta intensidad de 1-4 minutos.',
      evidence: 'Nivel A — meta-análisis Hobson et al., 2012',
    })
  }

  if (isKeto) {
    supplements.push({
      name: 'Electrolitos (sodio, potasio, magnesio)',
      dose: 'Según etiqueta; magnesio 300-400mg',
      timing: 'Distribuido a lo largo del día',
      rationale: 'La dieta cetogénica aumenta la excreción renal de electrolitos. La reposición previene la "gripe keto".',
      evidence: 'Nivel B',
    })
  }

  supplements.push({
    name: 'Magnesio glicinato',
    dose: '200-400mg',
    timing: 'Por la noche antes de dormir',
    rationale: 'Mineral clave para función muscular, calidad del sueño y producción de energía. Deficiencia común en atletas.',
    evidence: 'Nivel B',
  })

  return supplements
}

// ── Plan semanal por tipo de dieta ──────────────────────────────────────────

const WEEKLY_SAMPLES = {
  omnivoro: [
    {
      day: 'Lunes',
      meals: [
        { name: 'Desayuno', foods: ['Avena con leche entera (80g avena)', 'Plátano troceado', '2 huevos revueltos'], kcal_approx: 520 },
        { name: 'Almuerzo', foods: ['Pechuga de pollo a la plancha (200g)', 'Arroz integral (150g cocido)', 'Brócoli al vapor (200g)', 'Aceite de oliva (1 cda)'], kcal_approx: 620 },
        { name: 'Cena', foods: ['Salmón al horno con limón (180g)', 'Camote asado (150g)', 'Ensalada de espinaca con tomate cherry'], kcal_approx: 540 },
        { name: 'Snack', foods: ['Yogur griego natural (200g)', 'Almendras (20g)', 'Arándanos frescos (100g)'], kcal_approx: 260 },
      ],
    },
    {
      day: 'Martes',
      meals: [
        { name: 'Desayuno', foods: ['Tostadas de pan integral (2 rebanadas)', 'Aguacate machacado (80g)', '2 huevos pochados', 'Tomate cherry'], kcal_approx: 490 },
        { name: 'Almuerzo', foods: ['Carne molida 90% con especias (180g)', 'Pasta integral (130g cocida)', 'Salsa de tomate casera', 'Zanahoria rallada'], kcal_approx: 680 },
        { name: 'Cena', foods: ['Pechuga de pavo a la plancha (200g)', 'Ensalada de lechuga, pepino y pimiento', 'Quinoa cocida (100g)', 'Vinagreta de limón'], kcal_approx: 480 },
        { name: 'Snack', foods: ['Manzana mediana', 'Queso cottage (150g)', 'Nueces (15g)'], kcal_approx: 240 },
      ],
    },
    {
      day: 'Miércoles',
      meals: [
        { name: 'Desayuno', foods: ['Batido: leche desnatada (300ml)', 'Avena (50g)', 'Plátano', 'Mantequilla de cacahuate (20g)'], kcal_approx: 510 },
        { name: 'Almuerzo', foods: ['Lentejas guisadas con zanahoria y cebolla (300g)', 'Arroz blanco (100g cocido)', 'Pan integral (1 rebanada)'], kcal_approx: 590 },
        { name: 'Cena', foods: ['Atún enlatado en agua (180g)', 'Ensalada Nicoise: judías verdes, huevo duro, aceitunas', 'Papas pequeñas cocidas (100g)'], kcal_approx: 460 },
        { name: 'Snack', foods: ['Requesón (200g) con fresas', 'Galletas de arroz (4 unidades)'], kcal_approx: 220 },
      ],
    },
    {
      day: 'Jueves',
      meals: [
        { name: 'Desayuno', foods: ['Tortilla de 3 claras + 1 huevo entero', 'Pimiento rojo y espinaca salteados', 'Pan integral (1 rebanada)', 'Naranja'], kcal_approx: 430 },
        { name: 'Almuerzo', foods: ['Pechuga de pollo al curry con garbanzos (250g pollo + 100g garbanzos)', 'Arroz basmati (120g cocido)', 'Yogur natural como salsa'], kcal_approx: 710 },
        { name: 'Cena', foods: ['Merluza al vapor con hierbas (200g)', 'Calabacín a la plancha (200g)', 'Puré de coliflor (150g)'], kcal_approx: 370 },
        { name: 'Snack', foods: ['Plátano', 'Almendras tostadas sin sal (25g)'], kcal_approx: 230 },
      ],
    },
    {
      day: 'Viernes',
      meals: [
        { name: 'Desayuno', foods: ['Pancakes de avena y banana (3 unidades)', 'Miel (1 cda)', 'Fresas en rodajas (100g)'], kcal_approx: 480 },
        { name: 'Almuerzo', foods: ['Bowl de arroz: arroz integral, pechuga de pollo en tiras (180g), aguacate, maíz, tomate, salsa de yogur'], kcal_approx: 660 },
        { name: 'Cena', foods: ['Lomo de cerdo magro (180g)', 'Ensalada de rúcula con nueces y parmesano', 'Espárragos a la plancha'], kcal_approx: 520 },
        { name: 'Snack', foods: ['Yogur griego (150g)', 'Granola sin azúcar añadida (30g)', 'Arándanos (80g)'], kcal_approx: 280 },
      ],
    },
    {
      day: 'Sábado',
      meals: [
        { name: 'Desayuno', foods: ['Huevos revueltos con salmón ahumado (80g salmón + 3 huevos)', 'Tostadas de pan integral', 'Jugo de naranja natural (200ml)'], kcal_approx: 560 },
        { name: 'Almuerzo', foods: ['Pollo asado (200g)', 'Papas al horno con piel (200g)', 'Ensalada mediterránea: tomate, pepino, aceitunas, queso feta'], kcal_approx: 700 },
        { name: 'Cena', foods: ['Sopa de verduras con pechuga de pollo (250ml)', 'Pan integral (2 rebanadas)', 'Manzana'], kcal_approx: 400 },
        { name: 'Snack', foods: ['Mix de frutos secos: almendras, nueces, anacardos (30g)', 'Dátiles (3 unidades)'], kcal_approx: 260 },
      ],
    },
    {
      day: 'Domingo',
      meals: [
        { name: 'Desayuno', foods: ['Tazón de frutas: plátano, mango, fresas, arándanos (300g)', 'Granola artesanal (40g)', 'Leche de almendra (200ml)'], kcal_approx: 420 },
        { name: 'Almuerzo', foods: ['Carne de res magra a la plancha (200g)', 'Arroz blanco (150g cocido)', 'Frijoles negros guisados (150g)', 'Guacamole (50g)'], kcal_approx: 720 },
        { name: 'Cena', foods: ['Sopa de lentejas rojas con cúrcuma y jengibre (350ml)', 'Tostadas de pan de centeno', 'Ensalada de espinaca'], kcal_approx: 390 },
        { name: 'Snack', foods: ['Requesón (200g)', 'Canela y miel', 'Nueces (20g)'], kcal_approx: 250 },
      ],
    },
  ],

  vegano: [
    {
      day: 'Lunes',
      meals: [
        { name: 'Desayuno', foods: ['Avena con leche de soja (300ml)', 'Semillas de chía (20g)', 'Plátano', 'Fresas (100g)'], kcal_approx: 480 },
        { name: 'Almuerzo', foods: ['Bowl de Buddha: tofu firme marinado (200g)', 'Arroz integral (150g cocido)', 'Brócoli al vapor', 'Zanahoria rallada', 'Salsa tahini-limón'], kcal_approx: 630 },
        { name: 'Cena', foods: ['Lentejas rojas con cúrcuma y coco (300g)', 'Pan integral (1 rebanada)', 'Ensalada de rúcula'], kcal_approx: 510 },
        { name: 'Snack', foods: ['Yogur de soja (200g)', 'Almendras (20g)', 'Arándanos (100g)'], kcal_approx: 250 },
      ],
    },
    {
      day: 'Martes',
      meals: [
        { name: 'Desayuno', foods: ['Tostadas de pan integral (2 rebanadas)', 'Aguacate (80g)', 'Tomate cherry', 'Semillas de girasol (15g)', 'Zumo de limón'], kcal_approx: 400 },
        { name: 'Almuerzo', foods: ['Curry de garbanzos y espinaca (300g)', 'Arroz basmati (130g cocido)', 'Chapati integral'], kcal_approx: 680 },
        { name: 'Cena', foods: ['Pasta integral con pesto de albahaca y nueces (200g pasta)', 'Tofu salteado (100g)', 'Ensalada de tomate y albahaca'], kcal_approx: 570 },
        { name: 'Snack', foods: ['Hummus casero (80g)', 'Zanahorias y apio crudos', 'Nueces (15g)'], kcal_approx: 220 },
      ],
    },
    {
      day: 'Miércoles',
      meals: [
        { name: 'Desayuno', foods: ['Batido verde: espinaca (50g)', 'Leche de almendra (300ml)', 'Plátano', 'Mantequilla de almendra (25g)', 'Semillas de cáñamo (20g)'], kcal_approx: 490 },
        { name: 'Almuerzo', foods: ['Quinoa con verduras asadas: pimiento, cebolla, calabacín (300g quinoa)', 'Frijoles negros (100g)', 'Aguacate (80g)'], kcal_approx: 620 },
        { name: 'Cena', foods: ['Sopa miso con tofu sedoso y alga wakame (400ml)', 'Edamame cocido (150g)', 'Arroz de jazmín (100g cocido)'], kcal_approx: 420 },
        { name: 'Snack', foods: ['Dátiles Medjool (3 unidades)', 'Mantequilla de cacahuate (20g)', 'Leche de avena (200ml)'], kcal_approx: 280 },
      ],
    },
    {
      day: 'Jueves',
      meals: [
        { name: 'Desayuno', foods: ['Overnight oats: avena (80g)', 'Leche de coco (200ml)', 'Semillas de chía (15g)', 'Mango troceado (150g)'], kcal_approx: 510 },
        { name: 'Almuerzo', foods: ['Tempeh salteado con brócoli y pimiento (200g tempeh)', 'Fideos soba (130g cocidos)', 'Salsa teriyaki de soja', 'Semillas de sésamo'], kcal_approx: 650 },
        { name: 'Cena', foods: ['Tacos de lechuga con soja texturizada especiada (150g)', 'Pico de gallo: tomate, cebolla, cilantro, limón', 'Aguacate (100g)'], kcal_approx: 450 },
        { name: 'Snack', foods: ['Mix de frutos secos sin sal (30g)', 'Manzana verde'], kcal_approx: 230 },
      ],
    },
    {
      day: 'Viernes',
      meals: [
        { name: 'Desayuno', foods: ['Tostadas de pan integral con hummus (80g)', 'Pepino en rodajas', 'Semillas de sésamo', 'Jugo de naranja (200ml)'], kcal_approx: 380 },
        { name: 'Almuerzo', foods: ['Bowl de arroz integral (150g)', 'Tofu crujiente al horno (200g)', 'Edamame (100g)', 'Pepino', 'Alga nori', 'Salsa ponzu'], kcal_approx: 600 },
        { name: 'Cena', foods: ['Estofado de lentejas verdes con zanahoria y papa (400g)', 'Espinaca salteada con ajo', 'Pan pita integral'], kcal_approx: 520 },
        { name: 'Snack', foods: ['Yogur de coco (200g)', 'Granola vegana (30g)', 'Fresas (100g)'], kcal_approx: 260 },
      ],
    },
    {
      day: 'Sábado',
      meals: [
        { name: 'Desayuno', foods: ['Pancakes de plátano y avena (sin huevo, 3 unidades)', 'Frutas del bosque (150g)', 'Jarabe de arce (1 cda)', 'Leche de soja (200ml)'], kcal_approx: 530 },
        { name: 'Almuerzo', foods: ['Hamburguesa de frijoles negros casera', 'Pan integral con aguacate y tomate', 'Camote frito al horno (200g)', 'Ensalada verde'], kcal_approx: 700 },
        { name: 'Cena', foods: ['Ramen vegano: caldo de hongos shiitake', 'Fideos ramen (100g)', 'Tofu marinado (150g)', 'Bok choy', 'Cebollín'], kcal_approx: 470 },
        { name: 'Snack', foods: ['Leche de almendra con cacao (250ml)', 'Galletas de avena veganas (3 unidades)'], kcal_approx: 240 },
      ],
    },
    {
      day: 'Domingo',
      meals: [
        { name: 'Desayuno', foods: ['Granola casera (60g) con leche de avena', 'Plátano y mango', 'Semillas de cáñamo (20g)'], kcal_approx: 470 },
        { name: 'Almuerzo', foods: ['Paella vegana con arroz integral, pimiento, tomate, judías verdes, pimentón ahumado (350g)', 'Limón exprimido', 'Perejil fresco'], kcal_approx: 650 },
        { name: 'Cena', foods: ['Crema de calabaza con leche de coco y jengibre (400ml)', 'Pan integral (2 rebanadas)', 'Nueces (20g)'], kcal_approx: 420 },
        { name: 'Snack', foods: ['Manzana con mantequilla de almendra (25g)', 'Dátiles (2 unidades)'], kcal_approx: 200 },
      ],
    },
  ],

  cetogenico: [
    {
      day: 'Lunes',
      meals: [
        { name: 'Desayuno', foods: ['Huevos revueltos con mantequilla (3 huevos)', 'Tocino de pavo (50g)', 'Aguacate (100g)', 'Café con crema entera'], kcal_approx: 560 },
        { name: 'Almuerzo', foods: ['Pechuga de pollo a la plancha con mantequilla y hierbas (200g)', 'Espárragos salteados en aceite de coco (200g)', 'Queso cheddar (30g)'], kcal_approx: 580 },
        { name: 'Cena', foods: ['Salmón al horno con eneldo (200g)', 'Brócoli con mantequilla y ajo (250g)', 'Ensalada de espinaca con aceite de oliva y vinagre'], kcal_approx: 560 },
        { name: 'Snack', foods: ['Nueces de macadamia (30g)', 'Queso gouda (40g)', 'Aceitunas (50g)'], kcal_approx: 280 },
      ],
    },
    {
      day: 'Martes',
      meals: [
        { name: 'Desayuno', foods: ['Omelette de 3 huevos con queso y espinaca', 'Aguacate (80g)', 'Café keto (café + MCT oil + mantequilla 1 cda)'], kcal_approx: 540 },
        { name: 'Almuerzo', foods: ['Carne molida 80% grasa (180g)', 'Calabacín relleno con queso', 'Ensalada de hojas verdes con aderezo ranch'], kcal_approx: 620 },
        { name: 'Cena', foods: ['Costillas de cerdo al horno (250g)', 'Coliflor en puré con crema y mantequilla (200g)', 'Pepino con sal'], kcal_approx: 680 },
        { name: 'Snack', foods: ['Almendras crudas (25g)', 'Cuadros de chocolate negro 85% (20g)'], kcal_approx: 210 },
      ],
    },
    {
      day: 'Miércoles',
      meals: [
        { name: 'Desayuno', foods: ['Batido keto: leche de coco entera (200ml)', 'Proteína de suero sin carbs (30g)', 'Mantequilla de almendra (25g)', 'Hielo'], kcal_approx: 450 },
        { name: 'Almuerzo', foods: ['Ensalada César con pollo (200g pollo)', 'Aderezo César sin crutones', 'Queso parmesano (20g)', 'Tocino crujiente (30g)'], kcal_approx: 560 },
        { name: 'Cena', foods: ['Chuleta de res a la plancha (220g)', 'Espárragos al horno con aceite de oliva', 'Mantequilla compuesta con ajo y perejil'], kcal_approx: 620 },
        { name: 'Snack', foods: ['Queso mozzarella fresco (60g)', 'Jamón serrano (30g)', 'Aceitunas verdes (40g)'], kcal_approx: 230 },
      ],
    },
    {
      day: 'Jueves',
      meals: [
        { name: 'Desayuno', foods: ['Huevos fritos en mantequilla (3 unidades)', 'Queso feta (40g)', 'Tomate cherry (80g)', 'Espinaca cruda'], kcal_approx: 430 },
        { name: 'Almuerzo', foods: ['Atún enlatado en aceite de oliva (180g)', 'Mayonesa casera (30g)', 'Lechuga romana envuelta', 'Pepino y apio'], kcal_approx: 490 },
        { name: 'Cena', foods: ['Pollo entero asado con piel y especias (250g)', 'Brócoli asado con aceite de coco (200g)', 'Ensalada caprese: mozzarella, tomate, albahaca, aceite de oliva'], kcal_approx: 670 },
        { name: 'Snack', foods: ['Nueces (25g)', 'Queso ricotta (80g)', 'Canela'], kcal_approx: 240 },
      ],
    },
    {
      day: 'Viernes',
      meals: [
        { name: 'Desayuno', foods: ['Panqueques keto: queso crema (80g) + 2 huevos + eritritol (30g aprox)', 'Fresas (80g)', 'Crema batida sin azúcar'], kcal_approx: 470 },
        { name: 'Almuerzo', foods: ['Hamburguesa de res (200g) sin pan', 'Lechuga como "bun"', 'Queso cheddar', 'Aguacate', 'Tocino (30g)', 'Mostaza'], kcal_approx: 630 },
        { name: 'Cena', foods: ['Salmón en costra de queso parmesano (200g)', 'Judías verdes salteadas con ajo y aceite de oliva (200g)'], kcal_approx: 540 },
        { name: 'Snack', foods: ['Cuadros de chocolate negro 85% (25g)', 'Nueces de macadamia (20g)', 'Café con crema'], kcal_approx: 220 },
      ],
    },
    {
      day: 'Sábado',
      meals: [
        { name: 'Desayuno', foods: ['Revuelto de huevos con salmón ahumado (80g)', 'Crema fresca (2 cdas)', 'Aguacate (100g)', 'Café con leche entera'], kcal_approx: 590 },
        { name: 'Almuerzo', foods: ['Costillas de cerdo ahumadas (300g)', 'Coleslaw keto: col, mayonesa, vinagre de manzana', 'Queso cheddar (30g)'], kcal_approx: 740 },
        { name: 'Cena', foods: ['Pollo al horno con mantequilla de hierbas (200g)', 'Calabacín en espirales con pesto (200g)'], kcal_approx: 520 },
        { name: 'Snack', foods: ['Cerdo rinds / chicharrones (20g)', 'Guacamole casero (80g)'], kcal_approx: 240 },
      ],
    },
    {
      day: 'Domingo',
      meals: [
        { name: 'Desayuno', foods: ['Huevos benedictinos sin inglés muffin: huevos pochados', 'Jamón curado (60g)', 'Salsa holandesa casera (2 cdas)', 'Espinaca'], kcal_approx: 520 },
        { name: 'Almuerzo', foods: ['Carne de res al curry keto (200g)', 'Coliflor en arroz (200g)', 'Leche de coco entera', 'Especias aromáticas'], kcal_approx: 610 },
        { name: 'Cena', foods: ['Pizza keto: base de coliflor + mozzarella', 'Tomate cherry', 'Pepperoni (40g)', 'Aceitunas negras', 'Albahaca'], kcal_approx: 490 },
        { name: 'Snack', foods: ['Almendras tostadas (25g)', 'Queso parmesano en láminas (30g)'], kcal_approx: 220 },
      ],
    },
  ],

  mediterraneo: [
    {
      day: 'Lunes',
      meals: [
        { name: 'Desayuno', foods: ['Tostadas de pan integral de masa madre (2 rebanadas)', 'Aceite de oliva virgen extra (1 cda)', 'Tomate maduro rallado', 'Queso feta (30g)', 'Aceitunas negras (30g)'], kcal_approx: 420 },
        { name: 'Almuerzo', foods: ['Ensalada Niçoise: atún enlatado (150g)', 'Papa cocida (150g)', 'Judías verdes', 'Aceitunas', 'Huevo duro', 'Aderezo de aceite de oliva'], kcal_approx: 600 },
        { name: 'Cena', foods: ['Salmón a la plancha (200g)', 'Ratatouille de verduras: berenjena, calabacín, pimiento, tomate', 'Cuscús integral (100g)'], kcal_approx: 580 },
        { name: 'Snack', foods: ['Hummus (80g)', 'Zanahorias y pepino crudos', 'Nueces (15g)'], kcal_approx: 210 },
      ],
    },
    {
      day: 'Martes',
      meals: [
        { name: 'Desayuno', foods: ['Yogur griego natural (200g)', 'Miel de abeja (1 cda)', 'Nueces (15g)', 'Higos secos (30g)', 'Canela'], kcal_approx: 360 },
        { name: 'Almuerzo', foods: ['Pollo al horno con limón, orégano y ajo (200g)', 'Arroz integral con perejil (130g cocido)', 'Ensalada griega: tomate, pepino, cebolla roja, queso feta, aceitunas'], kcal_approx: 650 },
        { name: 'Cena', foods: ['Sopa de lentejas con aceite de oliva y limón (350ml)', 'Pan integral (2 rebanadas)', 'Aceitunas (40g)'], kcal_approx: 450 },
        { name: 'Snack', foods: ['Uvas rojas (150g)', 'Almendras (20g)'], kcal_approx: 190 },
      ],
    },
    {
      day: 'Miércoles',
      meals: [
        { name: 'Desayuno', foods: ['Shakshuka: 2 huevos pochados en salsa de tomate especiada', 'Pan de pita integral', 'Queso feta desmenuzado (20g)'], kcal_approx: 420 },
        { name: 'Almuerzo', foods: ['Pasta integral con sardinas (120g sardinas)', 'Tomates cherry', 'Aceite de oliva', 'Ajo y perejil', 'Pimentón'], kcal_approx: 620 },
        { name: 'Cena', foods: ['Brochetas de pollo y verduras (200g pollo)', 'Bulgur tabulé con perejil, menta, tomate, limón (150g)'], kcal_approx: 500 },
        { name: 'Snack', foods: ['Dátiles Medjool (3 unidades)', 'Almendras (15g)', 'Té verde'], kcal_approx: 180 },
      ],
    },
    {
      day: 'Jueves',
      meals: [
        { name: 'Desayuno', foods: ['Pan integral (2 rebanadas)', 'Aguacate aplastado (80g)', 'Sardinas en aceite de oliva (50g)', 'Jugo de limón', 'Pimentón'], kcal_approx: 450 },
        { name: 'Almuerzo', foods: ['Moussaka vegetariana: berenjena, lenteja, tomate, bechamel ligera (400g)', 'Ensalada de pepino y menta con limón'], kcal_approx: 570 },
        { name: 'Cena', foods: ['Mejillones al vino blanco y ajo (400g)', 'Pan de masa madre para mojar', 'Perejil fresco'], kcal_approx: 420 },
        { name: 'Snack', foods: ['Queso manchego (30g)', 'Higos frescos (100g)', 'Nueces (10g)'], kcal_approx: 200 },
      ],
    },
    {
      day: 'Viernes',
      meals: [
        { name: 'Desayuno', foods: ['Avena cocida en leche entera (80g avena)', 'Miel (1 cda)', 'Pistachos (15g)', 'Naranja'], kcal_approx: 440 },
        { name: 'Almuerzo', foods: ['Merluza al horno con tomate, aceitunas y alcaparras (200g)', 'Papas panaderas con aceite de oliva y romero (200g)', 'Ensalada verde'], kcal_approx: 620 },
        { name: 'Cena', foods: ['Garbanzos con espinaca y comino (300g)', 'Pan de pita integral', 'Limón exprimido'], kcal_approx: 450 },
        { name: 'Snack', foods: ['Yogur griego (150g)', 'Miel y canela', 'Uvas (100g)'], kcal_approx: 200 },
      ],
    },
    {
      day: 'Sábado',
      meals: [
        { name: 'Desayuno', foods: ['Huevos fritos en aceite de oliva (2 unidades)', 'Pan de masa madre (2 rebanadas)', 'Tomate maduro', 'Aceitunas (40g)', 'Queso blanco fresco (50g)'], kcal_approx: 530 },
        { name: 'Almuerzo', foods: ['Paella valenciana o de mariscos (350g porción)', 'Limón', 'Alioli ligero', 'Ensalada de pimientos asados'], kcal_approx: 680 },
        { name: 'Cena', foods: ['Gazpacho frío (300ml)', 'Tortilla española de 3 huevos y papa (200g)', 'Pan integral (1 rebanada)'], kcal_approx: 470 },
        { name: 'Snack', foods: ['Higos frescos (120g)', 'Almendras (20g)', 'Queso manchego (20g)'], kcal_approx: 220 },
      ],
    },
    {
      day: 'Domingo',
      meals: [
        { name: 'Desayuno', foods: ['Granola artesanal (50g)', 'Yogur griego (200g)', 'Miel de tomillo (1 cda)', 'Frutas de temporada (150g)'], kcal_approx: 480 },
        { name: 'Almuerzo', foods: ['Cordero al horno con romero y ajo (200g)', 'Arroz basmati con verduras (150g cocido)', 'Tzatziki casero (100g)'], kcal_approx: 700 },
        { name: 'Cena', foods: ['Sopa de tomate con albahaca fresca (350ml)', 'Pan integral con aceite de oliva', 'Queso ricotta (80g)'], kcal_approx: 400 },
        { name: 'Snack', foods: ['Mezze: hummus (50g)', 'Babaganoush (50g)', 'Crudités de verduras', 'Aceitunas (30g)'], kcal_approx: 220 },
      ],
    },
  ],

  vegetariano: [
    {
      day: 'Lunes',
      meals: [
        { name: 'Desayuno', foods: ['Avena con leche entera (80g)', 'Huevo duro (1)', 'Plátano', 'Miel (1 cda)'], kcal_approx: 490 },
        { name: 'Almuerzo', foods: ['Dhal de lentejas rojas con espinaca y coco (350g)', 'Arroz basmati (130g cocido)', 'Yogur natural (100g)'], kcal_approx: 640 },
        { name: 'Cena', foods: ['Quiche de brócoli y queso (200g porción)', 'Ensalada de hojas verdes con aceite de oliva', 'Tomate cherry'], kcal_approx: 510 },
        { name: 'Snack', foods: ['Yogur griego (200g)', 'Almendras (20g)', 'Arándanos (80g)'], kcal_approx: 260 },
      ],
    },
    {
      day: 'Martes',
      meals: [
        { name: 'Desayuno', foods: ['Tostadas de pan integral (2 rebanadas)', 'Aguacate (80g)', '2 huevos pochados', 'Semillas de chía (10g)', 'Zumo de limón'], kcal_approx: 480 },
        { name: 'Almuerzo', foods: ['Bowl de falafel (4 unidades)', 'Quinoa (100g cocida)', 'Pepino', 'Tomate', 'Salsa de yogur con menta', 'Aceitunas (30g)'], kcal_approx: 630 },
        { name: 'Cena', foods: ['Curry de garbanzos con tomate y cúrcuma (300g)', 'Arroz integral (100g cocido)', 'Raita de yogur y pepino'], kcal_approx: 540 },
        { name: 'Snack', foods: ['Queso cottage (150g)', 'Piña fresca (100g)', 'Nueces (15g)'], kcal_approx: 230 },
      ],
    },
    {
      day: 'Miércoles',
      meals: [
        { name: 'Desayuno', foods: ['Batido proteico: leche de vaca (300ml)', 'Avena (50g)', 'Plátano', 'Mantequilla de cacahuate (25g)', 'Miel'], kcal_approx: 530 },
        { name: 'Almuerzo', foods: ['Ensalada de quinoa, huevo duro (2), aguacate, tomate', 'Garbanzos especiados (100g)', 'Aderezo de limón y aceite de oliva'], kcal_approx: 600 },
        { name: 'Cena', foods: ['Tortilla española de papa y cebolla (200g)', 'Ensalada mixta', 'Pan integral (1 rebanada)'], kcal_approx: 480 },
        { name: 'Snack', foods: ['Requesón (200g)', 'Fresas (100g)', 'Granola (20g)'], kcal_approx: 250 },
      ],
    },
    {
      day: 'Jueves',
      meals: [
        { name: 'Desayuno', foods: ['Pancakes de avena y huevo (2 huevos + 80g avena)', 'Frutas del bosque (100g)', 'Miel o jarabe de arce', 'Leche entera (200ml)'], kcal_approx: 520 },
        { name: 'Almuerzo', foods: ['Lasaña de verduras: berenjena, calabacín, espinaca, ricotta, mozzarella (350g)', 'Ensalada de rúcula'], kcal_approx: 680 },
        { name: 'Cena', foods: ['Sopa de miso con tofu (400ml)', 'Edamame cocido (120g)', 'Arroz integral (100g cocido)'], kcal_approx: 420 },
        { name: 'Snack', foods: ['Yogur griego con miel (150g)', 'Almendras (15g)'], kcal_approx: 220 },
      ],
    },
    {
      day: 'Viernes',
      meals: [
        { name: 'Desayuno', foods: ['Tazón de açaí (200g puré)', 'Granola (40g)', 'Plátano', 'Coco rallado (10g)', 'Miel'], kcal_approx: 500 },
        { name: 'Almuerzo', foods: ['Burrito de frijoles negros y arroz: tortilla integral', 'Frijoles (100g)', 'Arroz (80g cocido)', 'Queso rallado (30g)', 'Pico de gallo', 'Crema ácida (30g)'], kcal_approx: 680 },
        { name: 'Cena', foods: ['Revuelto de huevos con espinaca, champiñones y queso feta (3 huevos)', 'Pan integral (1 rebanada)'], kcal_approx: 420 },
        { name: 'Snack', foods: ['Manzana con queso cheddar (30g)', 'Nueces (15g)'], kcal_approx: 220 },
      ],
    },
    {
      day: 'Sábado',
      meals: [
        { name: 'Desayuno', foods: ['Huevos benedictinos con espinaca (2 huevos)', 'Inglés muffin integral', 'Salsa holandesa ligera', 'Zumo de naranja'], kcal_approx: 550 },
        { name: 'Almuerzo', foods: ['Pizza integral casera: masa fina', 'Queso mozzarella (80g)', 'Tomate, pimiento, champiñones, aceitunas', 'Albahaca fresca', 'Huevo (opcional)'], kcal_approx: 720 },
        { name: 'Cena', foods: ['Crema de brócoli con yogur griego (350ml)', 'Pan de masa madre (2 rebanadas)', 'Queso manchego (30g)'], kcal_approx: 430 },
        { name: 'Snack', foods: ['Dátiles (3 unidades)', 'Mantequilla de almendra (20g)', 'Leche caliente (200ml)'], kcal_approx: 250 },
      ],
    },
    {
      day: 'Domingo',
      meals: [
        { name: 'Desayuno', foods: ['Granola artesanal (60g)', 'Leche entera o yogur natural (250ml)', 'Frutas de temporada (150g)', 'Semillas de lino (10g)'], kcal_approx: 480 },
        { name: 'Almuerzo', foods: ['Paella de verduras y huevo (350g)', 'Limón', 'Ensalada de hojas verdes con aceite de oliva'], kcal_approx: 640 },
        { name: 'Cena', foods: ['Tacos de coliflor asada (4 unidades)', 'Crema de frijoles negros (80g)', 'Queso panela (50g)', 'Pico de gallo', 'Aguacate'], kcal_approx: 450 },
        { name: 'Snack', foods: ['Requesón (200g) con canela y miel', 'Frutos secos mixtos (20g)'], kcal_approx: 270 },
      ],
    },
  ],

  pescetariano: [
    {
      day: 'Lunes',
      meals: [
        { name: 'Desayuno', foods: ['Avena con leche entera (80g)', 'Plátano', '2 huevos revueltos', 'Jugo de naranja (200ml)'], kcal_approx: 510 },
        { name: 'Almuerzo', foods: ['Salmón al horno con limón y eneldo (200g)', 'Arroz integral (150g cocido)', 'Ensalada de espinaca con tomate cherry y aguacate'], kcal_approx: 640 },
        { name: 'Cena', foods: ['Gambas salteadas con ajo y aceite de oliva (200g)', 'Pasta integral (120g cocida)', 'Tomates cherry', 'Perejil'], kcal_approx: 550 },
        { name: 'Snack', foods: ['Yogur griego (200g)', 'Almendras (20g)', 'Arándanos (80g)'], kcal_approx: 260 },
      ],
    },
    {
      day: 'Martes',
      meals: [
        { name: 'Desayuno', foods: ['Tostadas de aguacate (80g) con salmón ahumado (50g)', 'Pan integral (2 rebanadas)', 'Huevo pochado', 'Alcaparras'], kcal_approx: 490 },
        { name: 'Almuerzo', foods: ['Ensalada de atún: atún en agua (180g)', 'Garbanzos (100g)', 'Pepino', 'Tomate', 'Aceitunas', 'Aceite de oliva', 'Orégano'], kcal_approx: 580 },
        { name: 'Cena', foods: ['Tilapia a la plancha (200g)', 'Camote al horno (150g)', 'Brócoli al vapor con limón'], kcal_approx: 470 },
        { name: 'Snack', foods: ['Sardinas en lata con galletas de arroz (3)', 'Pepino en rodajas'], kcal_approx: 220 },
      ],
    },
    {
      day: 'Miércoles',
      meals: [
        { name: 'Desayuno', foods: ['Batido: leche de avena (300ml)', 'Plátano', 'Mantequilla de cacahuate (25g)', 'Avena (50g)', 'Semillas de chía (10g)'], kcal_approx: 510 },
        { name: 'Almuerzo', foods: ['Tacos de pescado: tilapia especiada (200g)', 'Tortillas de maíz (3)', 'Repollo rallado', 'Pico de gallo', 'Crema', 'Limón'], kcal_approx: 620 },
        { name: 'Cena', foods: ['Sopa de mariscos: mejillones, almejas, camarón (300g)', 'Pan de masa madre', 'Perejil y limón'], kcal_approx: 430 },
        { name: 'Snack', foods: ['Queso cottage (150g)', 'Piña fresca (100g)', 'Nueces (15g)'], kcal_approx: 230 },
      ],
    },
    {
      day: 'Jueves',
      meals: [
        { name: 'Desayuno', foods: ['Tortilla de espinaca y salmón ahumado (3 huevos + 60g salmón)', 'Queso crema (20g)', 'Tostadas de pan integral'], kcal_approx: 500 },
        { name: 'Almuerzo', foods: ['Sushi bowl: arroz de sushi (150g cocido)', 'Salmón crudo o cocido (120g)', 'Aguacate', 'Pepino', 'Alga nori', 'Salsa soya baja en sodio', 'Sésamo'], kcal_approx: 620 },
        { name: 'Cena', foods: ['Merluza al vapor con salsa de tomate y aceitunas (200g)', 'Judías verdes salteadas (200g)', 'Arroz blanco (80g cocido)'], kcal_approx: 450 },
        { name: 'Snack', foods: ['Manzana', 'Mantequilla de almendra (20g)', 'Nueces (10g)'], kcal_approx: 210 },
      ],
    },
    {
      day: 'Viernes',
      meals: [
        { name: 'Desayuno', foods: ['Pancakes de avena y huevo (80g avena + 2 huevos)', 'Arándanos (100g)', 'Miel', 'Leche entera (200ml)'], kcal_approx: 490 },
        { name: 'Almuerzo', foods: ['Ceviche de camarón (250g camarón cocido)', 'Cebolla morada', 'Cilantro', 'Limón', 'Tostadas de maíz (4)', 'Aguacate'], kcal_approx: 560 },
        { name: 'Cena', foods: ['Salmón en costra de hierbas (200g)', 'Ensalada de quinoa (100g cocida)', 'Tomates cherry asados', 'Espárragos'], kcal_approx: 590 },
        { name: 'Snack', foods: ['Yogur griego (150g)', 'Granola (25g)', 'Fresas (80g)'], kcal_approx: 240 },
      ],
    },
    {
      day: 'Sábado',
      meals: [
        { name: 'Desayuno', foods: ['Huevos revueltos con salmón ahumado (80g) y crema cheese (30g)', 'Bagel integral', 'Alcaparras y cebolla morada'], kcal_approx: 560 },
        { name: 'Almuerzo', foods: ['Paella de mariscos: arroz (200g cocido)', 'Gambas (100g)', 'Mejillones (100g)', 'Calamares (80g)', 'Pimentón y azafrán', 'Limón'], kcal_approx: 700 },
        { name: 'Cena', foods: ['Crema de bacalao con papa (350g)', 'Pan integral (2 rebanadas)', 'Ensalada verde'], kcal_approx: 450 },
        { name: 'Snack', foods: ['Mix de frutos secos (30g)', 'Dátiles (2 unidades)'], kcal_approx: 220 },
      ],
    },
    {
      day: 'Domingo',
      meals: [
        { name: 'Desayuno', foods: ['Granola (50g)', 'Yogur natural (200g)', 'Miel y canela', 'Mango fresco (150g)'], kcal_approx: 460 },
        { name: 'Almuerzo', foods: ['Atún fresco a la plancha (200g)', 'Arroz con vegetales: zanahoria, chícharo, maíz (200g cocido)', 'Salsa teriyaki', 'Ensalada verde'], kcal_approx: 660 },
        { name: 'Cena', foods: ['Sopa de lentejas con sardinas enlatadas (400ml)', 'Pan de pita integral', 'Aceitunas (30g)'], kcal_approx: 430 },
        { name: 'Snack', foods: ['Queso cottage (200g)', 'Arándanos (100g)', 'Nueces (15g)'], kcal_approx: 240 },
      ],
    },
  ],

  paleo: [
    {
      day: 'Lunes',
      meals: [
        { name: 'Desayuno', foods: ['Huevos revueltos con tocino de pavo (3 huevos + 60g)', 'Aguacate (100g)', 'Tomate cherry', 'Café negro'], kcal_approx: 490 },
        { name: 'Almuerzo', foods: ['Pechuga de pollo asada (200g)', 'Camote al horno (200g)', 'Brócoli asado con aceite de coco', 'Aguacate (80g)'], kcal_approx: 620 },
        { name: 'Cena', foods: ['Salmón al horno con limón (200g)', 'Espárragos a la plancha', 'Ensalada de rúcula con nueces y vinagre balsámico'], kcal_approx: 520 },
        { name: 'Snack', foods: ['Mix de nueces y almendras (30g)', 'Plátano maduro'], kcal_approx: 250 },
      ],
    },
    {
      day: 'Martes',
      meals: [
        { name: 'Desayuno', foods: ['Frittata de verduras: 4 huevos', 'Pimiento rojo y verde', 'Espinaca', 'Cebolla', 'Aceite de coco', 'Arándanos (100g)'], kcal_approx: 450 },
        { name: 'Almuerzo', foods: ['Carne molida con especias (200g)', 'Remolacha asada (150g)', 'Zanahoria', 'Aguacate (80g)', 'Perejil'], kcal_approx: 600 },
        { name: 'Cena', foods: ['Lomo de cerdo magro (200g)', 'Espinaca salteada con ajo y aceite de coco', 'Coliflor en puré con aceite de coco'], kcal_approx: 530 },
        { name: 'Snack', foods: ['Manzana', 'Mantequilla de almendra (25g) (sin azúcar)'], kcal_approx: 200 },
      ],
    },
    {
      day: 'Miércoles',
      meals: [
        { name: 'Desayuno', foods: ['Batido paleo: leche de coco (200ml)', 'Plátano', 'Espinaca (50g)', 'Mantequilla de almendra (25g)', 'Semillas de chía (10g)'], kcal_approx: 440 },
        { name: 'Almuerzo', foods: ['Pollo entero asado con hierbas (250g)', 'Yuca cocida (180g)', 'Ensalada de pepino y tomate', 'Aceite de aguacate'], kcal_approx: 640 },
        { name: 'Cena', foods: ['Atún fresco a la plancha (200g)', 'Verduras asadas: calabacín, pimiento, berenjena', 'Aguacate (100g)', 'Limón'], kcal_approx: 510 },
        { name: 'Snack', foods: ['Nueces pecanas (25g)', 'Dátiles (3 unidades)', 'Coco rallado (10g)'], kcal_approx: 240 },
      ],
    },
    {
      day: 'Jueves',
      meals: [
        { name: 'Desayuno', foods: ['Huevos fritos en aceite de coco (3)', 'Salchicha de pavo (60g, sin aditivos)', 'Aguacate (80g)', 'Fresas (100g)'], kcal_approx: 480 },
        { name: 'Almuerzo', foods: ['Carne de res magra a la plancha (200g)', 'Batata asada (200g)', 'Ensalada verde con nueces y aderezo de mostaza dijon-aceite de oliva'], kcal_approx: 640 },
        { name: 'Cena', foods: ['Tilapia en papillote (200g) con tomate, pimiento y hierbas', 'Judías verdes al vapor', 'Zanahoria asada'], kcal_approx: 420 },
        { name: 'Snack', foods: ['Mix de frutos secos (almendras, nueces, anacardos) 30g', 'Naranja'], kcal_approx: 250 },
      ],
    },
    {
      day: 'Viernes',
      meals: [
        { name: 'Desayuno', foods: ['Pancakes paleo: plátano maduro + huevo (1 plátano + 2 huevos)', 'Frambuesas frescas (100g)', 'Aceite de coco para cocinar'], kcal_approx: 360 },
        { name: 'Almuerzo', foods: ['Bowl de carne de res (200g) con vegetables asados', 'Camote (150g)', 'Aguacate (80g)', 'Cebolla caramelizada'], kcal_approx: 620 },
        { name: 'Cena', foods: ['Pollo salteado con brócoli y jengibre (200g pollo)', 'Coliflor frita en aceite de coco (200g)', 'Salsa de soya de coco (coconut aminos)'], kcal_approx: 500 },
        { name: 'Snack', foods: ['Plátano macho cocido (100g)', 'Canela', 'Nueces (20g)'], kcal_approx: 210 },
      ],
    },
    {
      day: 'Sábado',
      meals: [
        { name: 'Desayuno', foods: ['Omelette con salmón ahumado (80g) y espárragos', 'Aguacate (100g)', 'Frutas: mango y fresas (200g)'], kcal_approx: 520 },
        { name: 'Almuerzo', foods: ['Costillas de res al horno con especias paleo (300g)', 'Batata frita al horno (200g)', 'Ensalada de col cruda'], kcal_approx: 700 },
        { name: 'Cena', foods: ['Gambas salteadas con ajo y aceite de coco (250g)', 'Espinaca salteada', 'Aguacate (80g)'], kcal_approx: 450 },
        { name: 'Snack', foods: ['Macaroons de coco sin azúcar (3 unidades)', 'Almendras (20g)'], kcal_approx: 240 },
      ],
    },
    {
      day: 'Domingo',
      meals: [
        { name: 'Desayuno', foods: ['Frutas de temporada (300g)', 'Nueces y almendras (30g)', 'Té verde o café negro'], kcal_approx: 310 },
        { name: 'Almuerzo', foods: ['Pechuga de pavo asada (250g)', 'Yuca asada (200g)', 'Brócoli y coliflor al vapor', 'Guacamole casero (80g)'], kcal_approx: 680 },
        { name: 'Cena', foods: ['Caldo de huesos casero (400ml)', 'Verduras de temporada: zanahoria, chirivía, apio', 'Pollo desmenuzado (150g)'], kcal_approx: 380 },
        { name: 'Snack', foods: ['Dátiles Medjool (2 unidades)', 'Mantequilla de almendra (20g)', 'Coco rallado (10g)'], kcal_approx: 190 },
      ],
    },
  ],

  flexitariano: [
    {
      day: 'Lunes',
      meals: [
        { name: 'Desayuno', foods: ['Avena con leche vegetal de avena (80g)', 'Semillas de chía (15g)', 'Plátano', 'Miel (1 cda)', 'Arándanos (80g)'], kcal_approx: 470 },
        { name: 'Almuerzo', foods: ['Bowl vegetal: lentejas negras (150g)', 'Arroz integral (130g cocido)', 'Espinaca', 'Zanahoria asada', 'Tahini (20g)', 'Limón'], kcal_approx: 590 },
        { name: 'Cena', foods: ['Pechuga de pollo a la plancha (150g)', 'Ensalada grande: hojas verdes, tomate, pepino, rábano', 'Quinoa (80g cocida)', 'Aceite de oliva'], kcal_approx: 480 },
        { name: 'Snack', foods: ['Yogur de soja o griego (200g)', 'Almendras (20g)', 'Fresas (100g)'], kcal_approx: 250 },
      ],
    },
    {
      day: 'Martes',
      meals: [
        { name: 'Desayuno', foods: ['Tostadas de pan integral (2 rebanadas)', 'Aguacate (80g)', 'Tomate cherry', 'Zumo de limón', 'Semillas de girasol (15g)'], kcal_approx: 390 },
        { name: 'Almuerzo', foods: ['Garbanzos al curry con espinaca y tomate (350g)', 'Arroz basmati (130g cocido)', 'Yogur natural (80g)'], kcal_approx: 660 },
        { name: 'Cena', foods: ['Tacos de frijoles negros refritos (3 tortillas maíz)', 'Pico de gallo', 'Queso cotija (30g)', 'Lechuga', 'Aguacate'], kcal_approx: 560 },
        { name: 'Snack', foods: ['Requesón (150g)', 'Manzana', 'Nueces (15g)'], kcal_approx: 230 },
      ],
    },
    {
      day: 'Miércoles',
      meals: [
        { name: 'Desayuno', foods: ['Batido verde: espinaca (50g)', 'Leche de almendra (300ml)', 'Plátano', 'Proteína vegetal (25g)', 'Mantequilla de almendra (20g)'], kcal_approx: 480 },
        { name: 'Almuerzo', foods: ['Salmón al horno (200g) —comida de proteína animal semanal—', 'Arroz integral (150g)', 'Brócoli y zanahorias asadas', 'Limón y eneldo'], kcal_approx: 610 },
        { name: 'Cena', foods: ['Pasta integral con salsa de tomate y albahaca', 'Tofu salteado (100g)', 'Champiñones y pimiento', 'Levadura nutricional (10g)'], kcal_approx: 540 },
        { name: 'Snack', foods: ['Hummus (80g)', 'Crudités variados', 'Nueces (15g)'], kcal_approx: 230 },
      ],
    },
    {
      day: 'Jueves',
      meals: [
        { name: 'Desayuno', foods: ['Avena overnight: avena (80g)', 'Leche de coco (200ml)', 'Semillas de calabaza (20g)', 'Mango (150g)', 'Canela'], kcal_approx: 510 },
        { name: 'Almuerzo', foods: ['Ensalada de quinoa (100g cocida) con garbanzos (100g)', 'Aguacate', 'Tomate', 'Pepino', 'Aceitunas', 'Vinagreta mediterránea'], kcal_approx: 580 },
        { name: 'Cena', foods: ['Revuelto de huevos con champiñones y espinaca (3 huevos)', 'Pan integral (1 rebanada)', 'Queso fresco (30g)', 'Tomate cherry'], kcal_approx: 440 },
        { name: 'Snack', foods: ['Dátiles (3 unidades)', 'Almendras tostadas (20g)', 'Leche de avena (200ml)'], kcal_approx: 250 },
      ],
    },
    {
      day: 'Viernes',
      meals: [
        { name: 'Desayuno', foods: ['Granola vegana (50g)', 'Yogur de coco (200g)', 'Mango y piña frescos (150g)', 'Semillas de lino (10g)'], kcal_approx: 470 },
        { name: 'Almuerzo', foods: ['Hamburguesa de lentejas casera con quinoa', 'Pan integral', 'Aguacate', 'Tomate', 'Lechuga', 'Mostaza'], kcal_approx: 620 },
        { name: 'Cena', foods: ['Atún enlatado en agua (150g)', 'Arroz blanco (100g cocido)', 'Ensalada de pepino, tomate y perejil', 'Aceite de oliva y limón'], kcal_approx: 430 },
        { name: 'Snack', foods: ['Plátano con mantequilla de cacahuate (25g)', 'Leche de almendra (200ml)'], kcal_approx: 270 },
      ],
    },
    {
      day: 'Sábado',
      meals: [
        { name: 'Desayuno', foods: ['Huevos revueltos (3) con pimiento y cebolla', 'Pan integral tostado (2 rebanadas)', 'Jugo de naranja fresco (200ml)', 'Fruta fresca'], kcal_approx: 500 },
        { name: 'Almuerzo', foods: ['Curry vegano de garbanzos y camote (350g)', 'Arroz integral (150g cocido)', 'Chutney de mango', 'Pan naan integral'], kcal_approx: 700 },
        { name: 'Cena', foods: ['Crema de calabaza (350ml)', 'Semillas de calabaza tostadas', 'Pan integral (2 rebanadas)', 'Queso fresco (40g)'], kcal_approx: 430 },
        { name: 'Snack', foods: ['Yogur griego (150g)', 'Granola (25g)', 'Arándanos (80g)'], kcal_approx: 250 },
      ],
    },
    {
      day: 'Domingo',
      meals: [
        { name: 'Desayuno', foods: ['Açaí bowl: puré de açaí (200g)', 'Granola (40g)', 'Coco rallado (10g)', 'Plátano', 'Fresas', 'Miel'], kcal_approx: 520 },
        { name: 'Almuerzo', foods: ['Pollo asado al horno (200g) —proteína animal semanal—', 'Papas al horno con piel (200g)', 'Ensalada de remolacha y rúcula', 'Vinagreta de naranja'], kcal_approx: 680 },
        { name: 'Cena', foods: ['Sopa de lentejas rojas con cúrcuma y jengibre (400ml)', 'Pan pita integral', 'Ensalada de pepino y yogur'], kcal_approx: 420 },
        { name: 'Snack', foods: ['Mix de semillas y frutos secos (30g)', 'Dátiles (2 unidades)', 'Té de manzanilla'], kcal_approx: 200 },
      ],
    },
  ],
}

// Reutilizar omnivoro para dietas sin muestra específica
WEEKLY_SAMPLES.cetogenico = WEEKLY_SAMPLES.cetogenico
WEEKLY_SAMPLES.mediterraneo = WEEKLY_SAMPLES.mediterraneo

function getWeeklySample(dietType) {
  return WEEKLY_SAMPLES[dietType] || WEEKLY_SAMPLES.omnivoro
}

// ── Etiqueta de foco según entrenamiento ───────────────────────────────────

function getFocusLabel(routineStyle, dietType) {
  if (dietType === 'cetogenico') return 'Cetosis y quema de grasa'
  if (dietType === 'mediterraneo') return 'Longevidad y salud cardiovascular'

  const focusMap = {
    hipertrofia:  'Alta en proteína — Síntesis muscular',
    fuerza:       'Alta en proteína — Fuerza máxima',
    calistenia:   'Proteína + relación peso-fuerza',
    cardio:       'Alta en carbohidratos — Rendimiento aeróbico',
    hiit:         'Carbos + proteína — Recuperación rápida',
    yoga:         'Antiinflamatoria — Movilidad y recuperación',
    pilates:      'Antiinflamatoria — Control corporal',
    terapéutico:  'Antiinflamatoria — Sanación y bienestar',
    híbrido:      'Equilibrada — Rendimiento integral',
  }
  return focusMap[routineStyle] || 'Nutrición equilibrada'
}

// ── Argumentos científicos por combo ──────────────────────────────────────

function getRationale(dietType, routineStyle) {
  if (dietType === 'cetogenico') {
    return 'La dieta cetogénica reduce drásticamente los carbohidratos para inducir cetosis, obligando al cuerpo a utilizar las grasas como fuente primaria de energía. Evidencia clínica apoya su eficacia en pérdida de grasa, control glucémico y reducción del apetito (Volek & Phinney, 2012).'
  }
  if (dietType === 'mediterraneo') {
    return 'El patrón mediterráneo —rico en AGMI del aceite de oliva, omega-3 del pescado, polifenoles y fibra— ha demostrado en el ensayo PREDIMED reducir en un 30% los eventos cardiovasculares mayores versus una dieta baja en grasas (Estruch et al., 2013).'
  }
  if (dietType === 'vegano' && ['hipertrofia', 'fuerza', 'calistenia'].includes(routineStyle)) {
    return 'Las dietas veganas requieren un 10% más de ingesta proteica para compensar la menor biodisponibilidad y el perfil incompleto de aminoácidos de las proteínas vegetales. La combinación de quinoa, edamame y soja texturizada ofrece todos los aminoácidos esenciales (ADA Position Paper, 2016).'
  }
  if (['cardio', 'hiit'].includes(routineStyle)) {
    return 'El rendimiento en ejercicio aeróbico e intervalado de alta intensidad depende principalmente del glucógeno muscular. Las guías ACSM recomiendan entre 6-10g/kg/día de carbohidratos para atletas de resistencia (Thomas et al., 2016).'
  }
  if (['yoga', 'pilates', 'terapéutico'].includes(routineStyle)) {
    return 'Una dieta antiinflamatoria rica en omega-3 (EPA/DHA), polifenoles (curcumina, resveratrol, quercetina) y antioxidantes reduce los biomarcadores de inflamación sistémica, apoyando la recuperación, movilidad articular y bienestar general (Calder et al., 2017).'
  }
  if (['hipertrofia', 'fuerza', 'calistenia'].includes(routineStyle)) {
    return 'Para maximizar la síntesis proteica muscular se recomienda 2.0-2.2g de proteína por kg de peso corporal, distribuidos en 4-5 tomas de 30-40g ricas en leucina (umbral ~2.5g), que actúa como señal clave del mTOR (Moore et al., 2009; Kerksick et al., 2017).'
  }
  return 'Una alimentación equilibrada con suficiente proteína de calidad, carbohidratos de bajo índice glucémico y grasas saludables cubre los requerimientos nutricionales para mantener la salud y el rendimiento físico (Dietary Guidelines for Americans 2020-2025).'
}

// ── Tips por tipo de dieta ─────────────────────────────────────────────────

const TIPS_DB = {
  omnivoro: [
    'Distribuye la proteína en al menos 4-5 comidas del día; cada una debe aportar ~30-40g para maximizar la síntesis muscular.',
    'Prioriza carbohidratos de bajo índice glucémico (avena, arroz integral, legumbres) la mayor parte del tiempo; reserva los de alto IG (arroz blanco, plátano) para justo antes o después del entrenamiento.',
    'Incluye al menos 2 porciones de pescado graso (salmón, sardinas) por semana para cubrir los requerimientos de omega-3 EPA/DHA.',
  ],
  vegetariano: [
    'Combina legumbres con cereales integrales en la misma comida para obtener un perfil completo de aminoácidos esenciales (ej. arroz + frijoles, hummus + pan integral).',
    'Los huevos y el yogur griego son tus mejores aliados proteicos; apunta a 3 porciones de lácteos y 2-3 huevos al día si no tienes restricciones.',
    'Monitorea regularmente la vitamina B12 y el hierro; considera suplementar B12 si el consumo de lácteos/huevos es bajo.',
  ],
  vegano: [
    'La proteína vegana tiene menor biodisponibilidad: añade un 10-15% más a tu objetivo diario. El tofu, tempeh, edamame y soja texturizada son tus fuentes más densas.',
    'Suplementa vitamina B12 sin excepción; es el único nutriente imposible de obtener en cantidades adecuadas de una dieta vegana.',
    'Para optimizar la absorción de hierro no hemo, consume fuentes de hierro vegetal (lentejas, espinaca, semillas de calabaza) junto con vitamina C (limón, pimiento, fresas).',
  ],
  pescetariano: [
    'El salmón, las sardinas y el atún son excelentes fuentes de omega-3 y proteína de alta calidad; apunta a 3-4 porciones semanales.',
    'Los mariscos de concha (mejillones, ostras) son excepcionalmente ricos en zinc, hierro y vitamina B12, nutrientes que pueden escasear sin carne roja.',
    'Varía las especies de pescado para minimizar la exposición al mercurio; el atún debe limitarse a 2-3 veces por semana.',
  ],
  cetogenico: [
    'Mantén los electrolitos: consume sodio (caldo de huesos, sal marina), potasio (aguacate, verduras de hoja) y magnesio (semillas de calabaza, nueces) a diario para evitar la "gripe keto".',
    'En las primeras 2-4 semanas de adaptación el rendimiento físico puede disminuir; es normal mientras el cuerpo aprende a oxidar cetonas eficientemente.',
    'Registra tus carbohidratos netos (carbos totales − fibra); muchas verduras tienen carbos pero alta fibra que no eleva la glucemia significativamente.',
  ],
  mediterraneo: [
    'El aceite de oliva virgen extra es tu grasa principal; úsalo tanto para cocinar a temperatura media como en crudo. Aporta oleocantal, un antiinflamatorio natural.',
    'Las legumbres (lentejas, garbanzos, frijoles) deben estar presentes al menos 3-4 veces por semana; son la base proteica y de fibra de este patrón.',
    'Reduce la carne roja a no más de 2 veces por semana; reemplázala por pescado, aves de corral, legumbres y huevos.',
  ],
  flexitariano: [
    'Planifica con antelación tus "días de carne": 1-2 veces por semana es suficiente para obtener los beneficios de reducir el consumo animal sin sacrificar la densidad nutricional.',
    'Las comidas vegetales deben basarse en legumbres + cereal completo o proteína vegetal densa (tofu, tempeh) para evitar déficit proteico.',
    'Aprovecha la variedad: cada semana intenta incluir al menos 30 tipos distintos de plantas (frutas, verduras, legumbres, cereales, frutos secos, semillas, hierbas) para maximizar el microbioma intestinal.',
  ],
  paleo: [
    'La ausencia de cereales y legumbres puede reducir la ingesta de fibra; compensa con verduras de colores variados, frutas y frutos secos.',
    'El camote/batata y la yuca son tus fuentes principales de carbohidratos; consúmelos preferiblemente en los días de entrenamiento.',
    'Aunque el paleo restringe los lácteos, si no tienes intolerancia, considera si el beneficio nutricional supera la restricción; algunos estudios sugieren que los lácteos enteros no son perjudiciales para poblaciones activas.',
  ],
}

// ── Timing de comidas ──────────────────────────────────────────────────────

function getMealTiming(routineStyle, intermittentFasting, targetKcal) {
  if (intermittentFasting) {
    return [
      { time: '12:00', name: 'Primera comida (romper ayuno)', kcal_pct: 35, tip: 'Comida más abundante del día. Prioriza proteína y carbohidratos de calidad.' },
      { time: '15:30', name: 'Comida intermedia', kcal_pct: 25, tip: 'Buena oportunidad para legumbres o cereales integrales.' },
      { time: '18:30', name: 'Pre-entrenamiento (si entrenas tarde)', kcal_pct: 20, tip: 'Carbohidratos de rápida absorción + algo de proteína.' },
      { time: '20:00', name: 'Última comida (cerrar ventana)', kcal_pct: 20, tip: 'Proteína + verduras. Evita carbohidratos en exceso por la noche.' },
    ]
  }

  if (['hipertrofia', 'fuerza', 'calistenia'].includes(routineStyle)) {
    return [
      { time: '08:00', name: 'Desayuno', kcal_pct: 25, tip: 'Proteína de alta calidad + carbohidratos complejos para empezar el anabolismo del día.' },
      { time: '11:00', name: 'Pre-entrenamiento (2h antes)', kcal_pct: 20, tip: 'Carbohidratos + proteína moderada. Evita mucha grasa que retrase la digestión.' },
      { time: '13:30', name: 'Post-entrenamiento (ventana 45min)', kcal_pct: 30, tip: 'Prioridad máxima: proteína 30-40g + carbohidratos para reponer glucógeno y activar mTOR.' },
      { time: '20:00', name: 'Cena', kcal_pct: 25, tip: 'Proteína de digestión lenta (caseína, requesón) favorece el anabolismo nocturno.' },
    ]
  }

  if (['cardio', 'hiit'].includes(routineStyle)) {
    return [
      { time: '07:30', name: 'Desayuno', kcal_pct: 30, tip: 'Alto en carbohidratos para cargar glucógeno antes del entrenamiento matutino.' },
      { time: '10:30', name: 'Snack pre-entrenamiento', kcal_pct: 15, tip: 'Plátano o dátiles + pequeña cantidad de proteína.' },
      { time: '13:00', name: 'Almuerzo (post-entrenamiento)', kcal_pct: 30, tip: 'Reponer glucógeno y reparar músculo: carbos + proteína en proporción 3:1.' },
      { time: '19:30', name: 'Cena', kcal_pct: 25, tip: 'Comida completa balanceada; reduce carbohidratos si no hay entrenamiento vespertino.' },
    ]
  }

  if (['yoga', 'pilates', 'terapéutico'].includes(routineStyle)) {
    return [
      { time: '08:00', name: 'Desayuno', kcal_pct: 25, tip: 'Alimentos antiinflamatorios: frutos rojos, cúrcuma, omega-3. Ligero para no pesar en la práctica.' },
      { time: '13:00', name: 'Almuerzo (comida principal)', kcal_pct: 40, tip: 'Comida más abundante del día. Legumbres, vegetales, proteína magra.' },
      { time: '17:00', name: 'Merienda', kcal_pct: 10, tip: 'Snack ligero: fruta, nueces o yogur.' },
      { time: '20:00', name: 'Cena', kcal_pct: 25, tip: 'Cena ligera rica en triptófano (plátano, pavo, semillas de calabaza) para mejorar el sueño.' },
    ]
  }

  // Default estándar
  return [
    { time: '08:00', name: 'Desayuno', kcal_pct: 25, tip: 'No omitas el desayuno; es clave para el metabolismo y evitar el hambre excesiva al mediodía.' },
    { time: '13:30', name: 'Almuerzo', kcal_pct: 35, tip: 'Comida más abundante del día. Incluye proteína, carbohidratos y verduras.' },
    { time: '17:00', name: 'Merienda', kcal_pct: 15, tip: 'Snack nutritivo para mantener el metabolismo activo y evitar el picoteo nocturno.' },
    { time: '20:30', name: 'Cena', kcal_pct: 25, tip: 'Cena ligera, rica en proteína y verduras. Reduce carbohidratos si el objetivo es perder grasa.' },
  ]
}

// ── Ajuste de macros por tipo de dieta y rutina ───────────────────────────

function adjustMacrosForDiet(nutritionPlan, dietType, routineStyle) {
  const base = {
    kcal:    nutritionPlan?.targetKcal ?? nutritionPlan?.kcal ?? 2000,
    protein: nutritionPlan?.protein_g  ?? nutritionPlan?.protein ?? 150,
    carbs:   nutritionPlan?.carbs_g    ?? nutritionPlan?.carbs   ?? 200,
    fat:     nutritionPlan?.fat_g      ?? nutritionPlan?.fat     ?? 60,
  }

  const kcal = base.kcal

  if (dietType === 'cetogenico') {
    // Carbs < 10% (~50g max), grasas 70-75%, proteína 20-25%
    return {
      kcal,
      protein: Math.round((kcal * 0.22) / 4),
      carbs:   Math.min(50, Math.round((kcal * 0.08) / 4)),
      fat:     Math.round((kcal * 0.70) / 9),
    }
  }

  if (dietType === 'mediterraneo') {
    // Grasas 35-40% (AGMI), carbos 45-50%, proteína 15-20%
    return {
      kcal,
      protein: Math.round((kcal * 0.18) / 4),
      carbs:   Math.round((kcal * 0.47) / 4),
      fat:     Math.round((kcal * 0.35) / 9),
    }
  }

  if (dietType === 'vegano') {
    // +10% proteína por menor biodisponibilidad
    return {
      kcal,
      protein: Math.round(base.protein * 1.10),
      carbs:   base.carbs,
      fat:     base.fat,
    }
  }

  if (dietType === 'paleo') {
    // Sin cereales/legumbres: proteína 25-35%, grasas 35-40%, carbos de frutas/tubérculos
    return {
      kcal,
      protein: Math.round((kcal * 0.30) / 4),
      carbs:   Math.round((kcal * 0.30) / 4),
      fat:     Math.round((kcal * 0.40) / 9),
    }
  }

  if (['cardio', 'hiit'].includes(routineStyle)) {
    // Carbos 55-60%, proteína 1.4-1.6g/kg (ACSM)
    return {
      kcal,
      protein: Math.max(Math.round(base.protein * 0.80), 100),
      carbs:   Math.round((kcal * 0.57) / 4),
      fat:     Math.round((kcal * 0.23) / 9),
    }
  }

  if (['yoga', 'pilates', 'terapéutico'].includes(routineStyle)) {
    // Dieta antiinflamatoria balanceada con más grasas saludables
    return {
      kcal,
      protein: base.protein,
      carbs:   Math.round((kcal * 0.45) / 4),
      fat:     Math.round((kcal * 0.35) / 9),
    }
  }

  return base
}

// ── Función principal: generateDietPlan ────────────────────────────────────

/**
 * Genera un plan nutricional basado en evidencia científica.
 *
 * @param {Object} params - { diet_type, allergies[], budget, special_prefs[], intermittent_fasting }
 * @param {Object} nutritionPlan - { targetKcal, protein_g, carbs_g, fat_g, water_ml }
 * @param {Object|null} routine - { style, goal }
 * @returns {Object} Plan nutricional completo
 */
export function generateDietPlan(params, nutritionPlan, routine) {
  const {
    diet_type = 'omnivoro',
    allergies = [],
    budget = 'medio',
    special_prefs = [],
    intermittent_fasting = false,
  } = params || {}

  const routineStyle = routine?.style || null

  // Ajustar macros según dieta y rutina
  const macro_targets = adjustMacrosForDiet(nutritionPlan, diet_type, routineStyle)

  // Obtener etiqueta y argumentación científica
  const focus_label = getFocusLabel(routineStyle, diet_type)
  const rationale = getRationale(diet_type, routineStyle)

  // Timing de comidas
  const meal_timing = getMealTiming(routineStyle, intermittent_fasting, macro_targets.kcal)

  // Alimentos clave
  const key_foods = getFoodsForDiet(diet_type, budget)

  // Plan semanal
  const weekly_sample = getWeeklySample(diet_type)

  // Alimentos a evitar por alergias
  const avoid_foods = allergies.flatMap(a => AVOID_BY_ALLERGY[a] || [])

  // Suplementos
  const supplements = getSupplements(diet_type, routineStyle, allergies)

  // Tips
  const tips = TIPS_DB[diet_type] || TIPS_DB.omnivoro

  // Fuentes científicas
  const sources = [
    'Kerksick CM et al. (2017). ISSN Exercise & Sport Nutrition Review: Research & Recommendations. J Int Soc Sports Nutr. 14:33.',
    'U.S. Department of Agriculture and U.S. Department of Health and Human Services. (2020). Dietary Guidelines for Americans, 2020-2025. 9th Edition.',
    'Melina V, Craig W, Levin S. (2016). Position of the Academy of Nutrition and Dietetics: Vegetarian Diets. J Acad Nutr Diet. 116(12):1970-1980.',
    'Estruch R et al. (2013). Primary Prevention of Cardiovascular Disease with a Mediterranean Diet. N Engl J Med. 368(14):1279-90. (PREDIMED Trial)',
    'Moore DR et al. (2009). Ingested protein dose response of muscle and albumin protein synthesis after resistance exercise in young men. Am J Clin Nutr. 89(1):161-8.',
  ]

  const dietInfo = DIET_TYPES.find(d => d.id === diet_type) || DIET_TYPES[0]

  return {
    diet_type,
    diet_label: dietInfo.label,
    diet_icon:  dietInfo.icon,
    macro_targets,
    focus_label,
    rationale,
    meal_timing,
    key_foods,
    weekly_sample,
    avoid_foods,
    supplements,
    tips,
    sources,
    disclaimer: 'Esta información es orientativa. Consulta con un profesional de la salud antes de iniciar cualquier plan alimenticio.',
    generated_at: new Date().toISOString(),
    wizard_params: params,
  }
}
