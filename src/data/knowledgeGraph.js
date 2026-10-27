/**
 * ============================================================================
 * GRAFO DE CONOCIMIENTO NUTRICIONAL (Knowledge Graph)
 * ============================================================================
 * Modela la red ontológica de alimentos, grupos de intercambio calórico,
 * restricciones clínicas y contextos de consumo para el motor híbrido de NutriBot Coach.
 */

export const knowledgeGraph = {
  version: "1.0.0",
  metadata: {
    pais: "Chile",
    enfoque: "Intercambio de equivalencias y reducción de carga cognitiva sin culpa",
    total_alimentos: 16,
  },

  nodes: {
    // --------------------------------------------------------------------------
    // 1. Nodos: Alimento (con foco en cultura alimentaria chilena / local)
    // --------------------------------------------------------------------------
    alimentos: [
      {
        id_alimento: "alim_marraqueta",
        nombre_estandar: "Marraqueta Chilena",
        sinonimos_locales: ["marraqueta", "pan batido", "pan frances", "pan francés", "media marraqueta", "diente de marraqueta"],
        medida_casera: "1/2 unidad (1 diente)",
        gramos_porcion: 50,
        kcal_por_100g: 270,
        kcal_porcion: 135,
        proteinas_g: 4.5,
        carbohidratos_g: 28.0,
        grasas_g: 0.5,
      },
      {
        id_alimento: "alim_palta",
        nombre_estandar: "Palta Hass",
        sinonimos_locales: ["palta", "aguacate", "palta hass", "palta molida", "porcion de palta"],
        medida_casera: "1/2 unidad mediana",
        gramos_porcion: 70,
        kcal_por_100g: 160,
        kcal_porcion: 112,
        proteinas_g: 1.4,
        carbohidratos_g: 6.0,
        grasas_g: 10.5,
      },
      {
        id_alimento: "alim_quesillo",
        nombre_estandar: "Quesillo Fresco",
        sinonimos_locales: ["quesillo", "queso fresco", "quesillo light", "rebanada de quesillo"],
        medida_casera: "1 rebanada gruesa",
        gramos_porcion: 60,
        kcal_por_100g: 102,
        kcal_porcion: 61,
        proteinas_g: 7.5,
        carbohidratos_g: 2.2,
        grasas_g: 2.5,
      },
      {
        id_alimento: "alim_huevo",
        nombre_estandar: "Huevo de Gallina",
        sinonimos_locales: ["huevo", "huevos", "huevo revuelto", "huevo duro", "huevo a la copa", "par de huevos"],
        medida_casera: "2 unidades medianas",
        gramos_porcion: 100,
        kcal_por_100g: 143,
        kcal_porcion: 143,
        proteinas_g: 12.6,
        carbohidratos_g: 0.8,
        grasas_g: 9.5,
      },
      {
        id_alimento: "alim_tofu",
        nombre_estandar: "Tofu Firme",
        sinonimos_locales: ["tofu", "tofu firme", "tofu salteado", "queso de soya"],
        medida_casera: "1 cubo mediano",
        gramos_porcion: 100,
        kcal_por_100g: 83,
        kcal_porcion: 83,
        proteinas_g: 10.0,
        carbohidratos_g: 1.8,
        grasas_g: 4.8,
      },
      {
        id_alimento: "alim_tofu_revuelto",
        nombre_estandar: "Tofu Revuelto con Cúrcuma & Espinaca",
        sinonimos_locales: ["tofu revuelto", "revuelto vegano", "sustituto de huevo revuelto", "scramble de tofu"],
        medida_casera: "1 plato mediano",
        gramos_porcion: 120,
        kcal_por_100g: 95,
        kcal_porcion: 114,
        proteinas_g: 11.2,
        carbohidratos_g: 3.0,
        grasas_g: 6.0,
      },
      {
        id_alimento: "alim_helado_crema",
        nombre_estandar: "Helado de Crema Tradicional",
        sinonimos_locales: ["helado", "helado de crema", "helado artesanal", "barquillo", "cassata", "helado de chocolate"],
        medida_casera: "1 copa mediana (2 bolas)",
        gramos_porcion: 150,
        kcal_por_100g: 220,
        kcal_porcion: 330,
        proteinas_g: 3.5,
        carbohidratos_g: 28.0,
        grasas_g: 11.0,
      },
      {
        id_alimento: "alim_yogurt_berries",
        nombre_estandar: "Yogurt Griego con Berries",
        sinonimos_locales: ["yogurt griego", "yogurt con berries", "yogurt griego con frutos rojos", "yogurt con arandanos"],
        medida_casera: "1 pote grande con berries",
        gramos_porcion: 160,
        kcal_por_100g: 78,
        kcal_porcion: 125,
        proteinas_g: 11.0,
        carbohidratos_g: 12.0,
        grasas_g: 2.0,
      },
      {
        id_alimento: "alim_pizza",
        nombre_estandar: "Pizza Familiar Tradicional",
        sinonimos_locales: ["pizza", "pizza con queso", "porciones de pizza", "pizza pepperoni", "pizza delivery"],
        medida_casera: "2 porciones grandes",
        gramos_porcion: 220,
        kcal_por_100g: 266,
        kcal_porcion: 585,
        proteinas_g: 24.0,
        carbohidratos_g: 68.0,
        grasas_g: 22.0,
      },
      {
        id_alimento: "alim_hamburguesa_papas",
        nombre_estandar: "Hamburguesa con Papas Fritas",
        sinonimos_locales: ["hamburguesa", "burger", "hamburguesa con papas", "combo hamburguesa", "hamburguesa completa"],
        medida_casera: "1 combo completo mediano",
        gramos_porcion: 350,
        kcal_por_100g: 245,
        kcal_porcion: 857,
        proteinas_g: 28.0,
        carbohidratos_g: 82.0,
        grasas_g: 45.0,
      },
      {
        id_alimento: "alim_empanada_pino",
        nombre_estandar: "Empanada de Pino al Horno",
        sinonimos_locales: ["empanada", "empanada de pino", "empanada al horno", "empanada chilena"],
        medida_casera: "1 unidad grande",
        gramos_porcion: 200,
        kcal_por_100g: 250,
        kcal_porcion: 500,
        proteinas_g: 16.0,
        carbohidratos_g: 52.0,
        grasas_g: 24.0,
      },
      {
        id_alimento: "alim_sopaipilla",
        nombre_estandar: "Sopaipilla Frita",
        sinonimos_locales: ["sopaipilla", "sopaipillas", "sopaipas", "sopaipilla con pebre"],
        medida_casera: "2 unidades medianas",
        gramos_porcion: 100,
        kcal_por_100g: 320,
        kcal_porcion: 320,
        proteinas_g: 5.0,
        carbohidratos_g: 40.0,
        grasas_g: 15.0,
      },
      {
        id_alimento: "alim_porotos_riendas",
        nombre_estandar: "Porotos con Riendas Tradicional",
        sinonimos_locales: ["porotos", "porotos con riendas", "plato de porotos", "porotos con tallarines"],
        medida_casera: "1 plato hondo",
        gramos_porcion: 350,
        kcal_por_100g: 125,
        kcal_porcion: 437,
        proteinas_g: 18.0,
        carbohidratos_g: 68.0,
        grasas_g: 8.5,
      },
      {
        id_alimento: "alim_cazuela_ave",
        nombre_estandar: "Cazuela de Ave Casera",
        sinonimos_locales: ["cazuela", "cazuela de ave", "cazuela de pollo", "caldo de cazuela"],
        medida_casera: "1 plato hondo con presa y verduras",
        gramos_porcion: 400,
        kcal_por_100g: 75,
        kcal_porcion: 300,
        proteinas_g: 26.0,
        carbohidratos_g: 24.0,
        grasas_g: 9.0,
      },
      {
        id_alimento: "alim_avena",
        nombre_estandar: "Avena en Hojuelas Integral",
        sinonimos_locales: ["avena", "avena cocida", "porridge", "avena con leche", "tazon de avena"],
        medida_casera: "1/2 taza en seco (40g)",
        gramos_porcion: 40,
        kcal_por_100g: 370,
        kcal_porcion: 148,
        proteinas_g: 5.5,
        carbohidratos_g: 26.0,
        grasas_g: 2.8,
      },
      {
        id_alimento: "alim_chia_pudding",
        nombre_estandar: "Pudding de Chía con Bebida Vegetal",
        sinonimos_locales: ["chia pudding", "pudding de chia", "chia con leche vegetal", "semillas de chia"],
        medida_casera: "1 frasco mediano (150g)",
        gramos_porcion: 150,
        kcal_por_100g: 92,
        kcal_porcion: 138,
        proteinas_g: 4.8,
        carbohidratos_g: 11.0,
        grasas_g: 6.8,
      },
    ],

    // --------------------------------------------------------------------------
    // 2. Nodos: GrupoIntercambio
    // --------------------------------------------------------------------------
    grupos_intercambio: [
      {
        id_grupo: "grp_proteina_magra_desayuno",
        nombre_grupo: "Proteína Magra Desayuno",
        kcal_promedio_porcion: 120,
      },
      {
        id_grupo: "grp_antojo_dulce",
        nombre_grupo: "Antojo Dulce",
        kcal_promedio_porcion: 220,
      },
      {
        id_grupo: "grp_comida_social_rapida",
        nombre_grupo: "Comida Social / Rápida",
        kcal_promedio_porcion: 650,
      },
      {
        id_grupo: "grp_carbohidrato_complejo",
        nombre_grupo: "Carbohidrato Complejo",
        kcal_promedio_porcion: 150,
      },
      {
        id_grupo: "grp_grasa_saludable",
        nombre_grupo: "Grasa Saludable",
        kcal_promedio_porcion: 110,
      },
      {
        id_grupo: "grp_plato_casero_tradicional",
        nombre_grupo: "Plato Casero Tradicional",
        kcal_promedio_porcion: 380,
      },
    ],

    // --------------------------------------------------------------------------
    // 3. Nodos: RestriccionClinica
    // --------------------------------------------------------------------------
    restricciones_clinicas: [
      {
        id_restriccion: "restr_lactosa",
        nombre: "Intolerancia a la Lactosa",
        tipo_severidad: "MEDIA",
      },
      {
        id_restriccion: "restr_huevo",
        nombre: "Alergia al Huevo",
        tipo_severidad: "ALTA",
      },
      {
        id_restriccion: "restr_vegano",
        nombre: "Alimentación Vegana / Estricta",
        tipo_severidad: "ESTRICTA",
      },
      {
        id_restriccion: "restr_gluten",
        nombre: "Celiaquía / Sin Gluten",
        tipo_severidad: "ALTA",
      },
    ],

    // --------------------------------------------------------------------------
    // 4. Nodos: ContextoConsumo
    // --------------------------------------------------------------------------
    contextos_consumo: [
      {
        id_contexto: "ctx_desayuno",
        tipo_momento: "Desayuno",
      },
      {
        id_contexto: "ctx_colacion_tarde",
        tipo_momento: "Colación Tarde",
      },
      {
        id_contexto: "ctx_comida_social",
        tipo_momento: "Comida Social / Fin de Semana",
      },
      {
        id_contexto: "ctx_antojo_dulce",
        tipo_momento: "Antojo Dulce",
      },
      {
        id_contexto: "ctx_almuerzo_cena",
        tipo_momento: "Almuerzo / Cena",
      },
    ],
  },

  // ----------------------------------------------------------------------------
  // Aristas (Edges) Ontológicas
  // ----------------------------------------------------------------------------
  edges: [
    // --- PERTENECE_A (Alimento -> GrupoIntercambio) ---
    { type: "PERTENECE_A", from: "alim_huevo", to: "grp_proteina_magra_desayuno" },
    { type: "PERTENECE_A", from: "alim_quesillo", to: "grp_proteina_magra_desayuno" },
    { type: "PERTENECE_A", from: "alim_tofu", to: "grp_proteina_magra_desayuno" },
    { type: "PERTENECE_A", from: "alim_tofu_revuelto", to: "grp_proteina_magra_desayuno" },
    { type: "PERTENECE_A", from: "alim_helado_crema", to: "grp_antojo_dulce" },
    { type: "PERTENECE_A", from: "alim_yogurt_berries", to: "grp_antojo_dulce" },
    { type: "PERTENECE_A", from: "alim_chia_pudding", to: "grp_antojo_dulce" },
    { type: "PERTENECE_A", from: "alim_pizza", to: "grp_comida_social_rapida" },
    { type: "PERTENECE_A", from: "alim_hamburguesa_papas", to: "grp_comida_social_rapida" },
    { type: "PERTENECE_A", from: "alim_empanada_pino", to: "grp_comida_social_rapida" },
    { type: "PERTENECE_A", from: "alim_sopaipilla", to: "grp_comida_social_rapida" },
    { type: "PERTENECE_A", from: "alim_marraqueta", to: "grp_carbohidrato_complejo" },
    { type: "PERTENECE_A", from: "alim_avena", to: "grp_carbohidrato_complejo" },
    { type: "PERTENECE_A", from: "alim_porotos_riendas", to: "grp_carbohidrato_complejo" },
    { type: "PERTENECE_A", from: "alim_palta", to: "grp_grasa_saludable" },
    { type: "PERTENECE_A", from: "alim_cazuela_ave", to: "grp_plato_casero_tradicional" },

    // --- ES_SUSTITUTO_DE (AlimentoOrigen <- AlimentoSustituto) ---
    // Sustituto de Huevo: Tofu revuelto o Quesillo
    {
      type: "ES_SUSTITUTO_DE",
      from: "alim_tofu_revuelto",
      to: "alim_huevo",
      factor_conversion: 1.0,
      similitud_culinaria: 0.92,
      motivo: "Misma textura cremosa de desayuno, vegetal y libre de alérgenos de huevo.",
    },
    {
      type: "ES_SUSTITUTO_DE",
      from: "alim_quesillo",
      to: "alim_huevo",
      factor_conversion: 0.8,
      similitud_culinaria: 0.80,
      motivo: "Aporte proteico equivalente y bajo en grasas para untar en la marraqueta.",
    },
    // Sustituto de Helado de Crema: Yogurt Griego con Berries o Pudding de Chía
    {
      type: "ES_SUSTITUTO_DE",
      from: "alim_yogurt_berries",
      to: "alim_helado_crema",
      factor_conversion: 1.0,
      similitud_culinaria: 0.88,
      motivo: "Alternativa fresca y dulce con 62% menos calorías y 3 veces más proteína.",
    },
    {
      type: "ES_SUSTITUTO_DE",
      from: "alim_chia_pudding",
      to: "alim_helado_crema",
      factor_conversion: 1.0,
      similitud_culinaria: 0.78,
      motivo: "Pudding vegetal refrescante con alta saciedad de fibra y omega 3.",
    },
    // Sustituto de Avena: Pudding de Chía
    {
      type: "ES_SUSTITUTO_DE",
      from: "alim_chia_pudding",
      to: "alim_avena",
      factor_conversion: 1.0,
      similitud_culinaria: 0.85,
      motivo: "Textura de porridge frío sin cocción y menor impacto glucémico.",
    },
    // Sustituto de Comida Rápida (Hamburguesa con papas): Cazuela de ave
    {
      type: "ES_SUSTITUTO_DE",
      from: "alim_cazuela_ave",
      to: "alim_hamburguesa_papas",
      factor_conversion: 1.0,
      similitud_culinaria: 0.72,
      motivo: "Almuerzo tradicional completo, reconfortante y con 65% menos calorías y grasas saturadas.",
    },
    // Sustituto de Palta: Quesillo (para acompañar pan)
    {
      type: "ES_SUSTITUTO_DE",
      from: "alim_quesillo",
      to: "alim_palta",
      factor_conversion: 0.9,
      similitud_culinaria: 0.79,
      motivo: "Acompañamiento proteico fresco para marraqueta con 45% menos calorías.",
    },

    // --- INCOMPATIBLE_CON (Alimento -> RestriccionClinica) ---
    // Lactosa
    { type: "INCOMPATIBLE_CON", from: "alim_helado_crema", to: "restr_lactosa" },
    { type: "INCOMPATIBLE_CON", from: "alim_quesillo", to: "restr_lactosa" },
    { type: "INCOMPATIBLE_CON", from: "alim_yogurt_berries", to: "restr_lactosa" },
    { type: "INCOMPATIBLE_CON", from: "alim_pizza", to: "restr_lactosa" },

    // Huevo
    { type: "INCOMPATIBLE_CON", from: "alim_huevo", to: "restr_huevo" },

    // Vegano
    { type: "INCOMPATIBLE_CON", from: "alim_huevo", to: "restr_vegano" },
    { type: "INCOMPATIBLE_CON", from: "alim_quesillo", to: "restr_vegano" },
    { type: "INCOMPATIBLE_CON", from: "alim_helado_crema", to: "restr_vegano" },
    { type: "INCOMPATIBLE_CON", from: "alim_yogurt_berries", to: "restr_vegano" },
    { type: "INCOMPATIBLE_CON", from: "alim_pizza", to: "restr_vegano" },
    { type: "INCOMPATIBLE_CON", from: "alim_hamburguesa_papas", to: "restr_vegano" },
    { type: "INCOMPATIBLE_CON", from: "alim_empanada_pino", to: "restr_vegano" },
    { type: "INCOMPATIBLE_CON", from: "alim_cazuela_ave", to: "restr_vegano" },

    // Gluten
    { type: "INCOMPATIBLE_CON", from: "alim_marraqueta", to: "restr_gluten" },
    { type: "INCOMPATIBLE_CON", from: "alim_pizza", to: "restr_gluten" },
    { type: "INCOMPATIBLE_CON", from: "alim_hamburguesa_papas", to: "restr_gluten" },
    { type: "INCOMPATIBLE_CON", from: "alim_empanada_pino", to: "restr_gluten" },
    { type: "INCOMPATIBLE_CON", from: "alim_sopaipilla", to: "restr_gluten" },
    { type: "INCOMPATIBLE_CON", from: "alim_porotos_riendas", to: "restr_gluten" },

    // --- RECOMENDADO_EN (Alimento -> ContextoConsumo) ---
    { type: "RECOMENDADO_EN", from: "alim_marraqueta", to: "ctx_desayuno" },
    { type: "RECOMENDADO_EN", from: "alim_huevo", to: "ctx_desayuno" },
    { type: "RECOMENDADO_EN", from: "alim_palta", to: "ctx_desayuno" },
    { type: "RECOMENDADO_EN", from: "alim_tofu_revuelto", to: "ctx_desayuno" },
    { type: "RECOMENDADO_EN", from: "alim_avena", to: "ctx_desayuno" },
    { type: "RECOMENDADO_EN", from: "alim_yogurt_berries", to: "ctx_colacion_tarde" },
    { type: "RECOMENDADO_EN", from: "alim_yogurt_berries", to: "ctx_antojo_dulce" },
    { type: "RECOMENDADO_EN", from: "alim_chia_pudding", to: "ctx_colacion_tarde" },
    { type: "RECOMENDADO_EN", from: "alim_cazuela_ave", to: "ctx_almuerzo_cena" },
    { type: "RECOMENDADO_EN", from: "alim_porotos_riendas", to: "ctx_almuerzo_cena" },
    { type: "RECOMENDADO_EN", from: "alim_pizza", to: "ctx_comida_social" },
    { type: "RECOMENDADO_EN", from: "alim_hamburguesa_papas", to: "ctx_comida_social" },
  ],
};
