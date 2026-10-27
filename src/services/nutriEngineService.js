/**
 * ============================================================================
 * SERVICIO DE RECORRIDO DE GRAFO Y REGLAS DE NEGOCIO (NutriEngineService)
 * ============================================================================
 * Implementa:
 * 1. Recorrido del Grafo de Conocimiento (Knowledge Graph) para sustituciones
 *    inteligentes basadas en aristas ES_SUSTITUTO_DE y PERTENECE_A, filtrando
 *    por INCOMPATIBLE_CON según las restricciones clínicas del paciente.
 * 2. Regla de Negocio 2 determinista: Compensación Semanal Dinámica con
 *    salvaguarda clínica estricta del 80% de la Tasa Metabólica Basal (TMB).
 */

import { knowledgeGraph } from "../data/knowledgeGraph.js";
import { relationalStore } from "../data/relationalStore.js";

export class NutriEngineService {
  /**
   * Recorre el grafo de conocimiento para encontrar alternativas alimentarias seguras y equivalentes.
   *
   * @param {string} nombreAlimento - Nombre o sinónimo del alimento a reemplazar (ej. 'huevo', 'helado', 'avena').
   * @param {string[]} restriccionesPaciente - IDs de restricciones del paciente (ej. ['restr_huevo', 'restr_lactosa']).
   * @returns {Object} Subgrafo con el alimento origen, sustitutos válidos, calorías ahorradas y metadatos.
   */
  static buscarSustitutosEnGrafo(nombreAlimento, restriccionesPaciente = []) {
    if (!nombreAlimento || typeof nombreAlimento !== "string") {
      return {
        encontrado: false,
        error: "Nombre de alimento no proporcionado o inválido.",
      };
    }

    const query = nombreAlimento.toLowerCase().trim();

    // 1. Localizar el nodo alimento correspondiente mediante nombre estándar o sinónimos locales
    const alimentoOrigen = knowledgeGraph.nodes.alimentos.find((alim) => {
      if (alim.nombre_estandar.toLowerCase().includes(query)) return true;
      return alim.sinonimos_locales.some((sinonimo) =>
        sinonimo.toLowerCase().includes(query) || query.includes(sinonimo.toLowerCase())
      );
    });

    if (!alimentoOrigen) {
      return {
        encontrado: false,
        alimento_buscado: nombreAlimento,
        mensaje: `No se encontró '${nombreAlimento}' en la base de conocimiento local.`,
        sugerencias_disponibles: knowledgeGraph.nodes.alimentos.slice(0, 5).map((a) => a.nombre_estandar),
      };
    }

    const idOrigen = alimentoOrigen.id_alimento;

    // 2. Localizar aristas directas ES_SUSTITUTO_DE
    // (Buscamos aristas donde 'to' sea el alimento origen, es decir, 'from' sustituye a 'to')
    const aristasSustitucionDirecta = knowledgeGraph.edges.filter(
      (edge) => edge.type === "ES_SUSTITUTO_DE" && edge.to === idOrigen
    );

    // 3. Localizar el Grupo de Intercambio del alimento origen para buscar sustitutos del mismo grupo (aristas PERTENECE_A)
    const aristaGrupoOrigen = knowledgeGraph.edges.find(
      (edge) => edge.type === "PERTENECE_A" && edge.from === idOrigen
    );
    const idGrupoOrigen = aristaGrupoOrigen ? aristaGrupoOrigen.to : null;

    // Alimentos del mismo grupo de intercambio
    const alimentosMismoGrupo = idGrupoOrigen
      ? knowledgeGraph.edges
          .filter((edge) => edge.type === "PERTENECE_A" && edge.to === idGrupoOrigen && edge.from !== idOrigen)
          .map((edge) => edge.from)
      : [];

    // Conjunto de candidatos iniciales
    const candidatosIds = new Set([
      ...aristasSustitucionDirecta.map((e) => e.from),
      ...alimentosMismoGrupo,
    ]);

    // 4. Filtrar candidatos por restricciones clínicas (Aristas INCOMPATIBLE_CON)
    const restriccionesEfectivas = new Set(restriccionesPaciente || []);

    const sustitutosValidos = [];

    for (const idCandidato of candidatosIds) {
      // Verificar incompatibilidades
      const incompatibilidades = knowledgeGraph.edges.filter(
        (edge) => edge.type === "INCOMPATIBLE_CON" && edge.from === idCandidato
      );

      const esIncompatible = incompatibilidades.some((edge) =>
        restriccionesEfectivas.has(edge.to)
      );

      // Si tiene alguna incompatibilidad clínica con el paciente, se descarta del subgrafo
      if (esIncompatible) {
        continue;
      }

      // Obtener nodo completo del alimento sustituto
      const nodoSustituto = knowledgeGraph.nodes.alimentos.find(
        (a) => a.id_alimento === idCandidato
      );

      if (!nodoSustituto) continue;

      // Buscar si tenía arista directa ES_SUSTITUTO_DE
      const aristaDirecta = aristasSustitucionDirecta.find((e) => e.from === idCandidato);

      // Calcular ahorro calórico por porción estándar
      const caloriasOriginal = alimentoOrigen.kcal_porcion;
      const caloriasSustituto = nodoSustituto.kcal_porcion;
      const ahorroKcal = Math.max(0, caloriasOriginal - caloriasSustituto);

      // Obtener grupo del sustituto
      const aristaGrupoSub = knowledgeGraph.edges.find(
        (edge) => edge.type === "PERTENECE_A" && edge.from === idCandidato
      );
      const nodoGrupoSub = aristaGrupoSub
        ? knowledgeGraph.nodes.grupos_intercambio.find((g) => g.id_grupo === aristaGrupoSub.to)
        : null;

      sustitutosValidos.push({
        id_alimento: nodoSustituto.id_alimento,
        nombre_estandar: nodoSustituto.nombre_estandar,
        medida_casera: nodoSustituto.medida_casera,
        gramos_porcion: nodoSustituto.gramos_porcion,
        kcal_porcion: caloriasSustituto,
        calorias_original: caloriasOriginal,
        ahorro_kcal: ahorroKcal,
        factor_conversion: aristaDirecta ? aristaDirecta.factor_conversion : 1.0,
        similitud_culinaria: aristaDirecta ? aristaDirecta.similitud_culinaria : 0.75,
        motivo: aristaDirecta
          ? aristaDirecta.motivo
          : `Alternativa del grupo ${nodoGrupoSub ? nodoGrupoSub.nombre_grupo : "equivalente"}.`,
        grupo_intercambio: nodoGrupoSub ? nodoGrupoSub.nombre_grupo : "General",
        es_reemplazo_directo: Boolean(aristaDirecta),
        macros: {
          proteinas_g: nodoSustituto.proteinas_g,
          carbohidratos_g: nodoSustituto.carbohidratos_g,
          grasas_g: nodoSustituto.grasas_g,
        },
      });
    }

    // 5. Ordenar sustitutos: primero reemplazos directos con mayor similitud y mayor ahorro calórico
    sustitutosValidos.sort((a, b) => {
      if (a.es_reemplazo_directo && !b.es_reemplazo_directo) return -1;
      if (!a.es_reemplazo_directo && b.es_reemplazo_directo) return 1;
      return b.similitud_culinaria - a.similitud_culinaria || b.ahorro_kcal - a.ahorro_kcal;
    });

    return {
      encontrado: true,
      alimento_origen: {
        id_alimento: alimentoOrigen.id_alimento,
        nombre_estandar: alimentoOrigen.nombre_estandar,
        medida_casera: alimentoOrigen.medida_casera,
        kcal_porcion: alimentoOrigen.kcal_porcion,
        macros: {
          proteinas_g: alimentoOrigen.proteinas_g,
          carbohidratos_g: alimentoOrigen.carbohidratos_g,
          grasas_g: alimentoOrigen.grasas_g,
        },
      },
      sustitutos: sustitutosValidos,
      total_opciones: sustitutosValidos.length,
      restricciones_paciente_aplicadas: Array.from(restriccionesEfectivas),
    };
  }

  /**
   * REGLA DE NEGOCIO 2 - SEGURIDAD CLÍNICA TMB
   * Calcula la redistribución semanal dinámica ante un exceso calórico.
   *
   * @param {number} caloriasExceso - Magnitud del exceso en kcal (ej. 500 kcal o 2000 kcal).
   * @param {string} idPaciente - ID del paciente (default: 'pac_001').
   * @returns {Object} Resultado de la compensación y estado del presupuesto dinámico.
   */
  static calcularCompensacionSemanal(caloriasExceso, idPaciente = "pac_001") {
    if (typeof caloriasExceso !== "number" || caloriasExceso <= 0) {
      throw new Error("Las calorías de exceso deben ser un número positivo.");
    }

    // 1. Obtener entidades del Relational Store
    const paciente = relationalStore.getPaciente(idPaciente);
    if (!paciente) throw new Error(`Paciente ${idPaciente} no encontrado.`);

    const pauta = relationalStore.getPautaActiva(idPaciente);
    if (!pauta) throw new Error(`Pauta activa para paciente ${idPaciente} no encontrada.`);

    const presupuesto = relationalStore.getPresupuestoSemanal(idPaciente);
    if (!presupuesto) throw new Error(`Presupuesto semanal de ${idPaciente} no encontrado.`);

    // 2. Parámetros del ciclo y regla clínica de seguridad
    const diasTotalesCiclo = 7;
    const diaActual = presupuesto.dia_actual_ciclo; // e.g. Día 4
    const diasRestantes = Math.max(0, diasTotalesCiclo - diaActual); // e.g. 7 - 4 = 3 días

    // Cota clínica: La cuota diaria nunca puede caer bajo el 80% del metabolismo basal
    const limiteSeguridadTMB = Math.round(paciente.tmb_kcal * 0.80); // 0.80 * 1850 = 1480 kcal

    // Caso borde: Es el último día de la semana (0 días restantes para amortizar)
    if (diasRestantes === 0) {
      return {
        exito: false,
        abortado: true,
        alerta_limite_tmb: false,
        razon: "FIN_DE_CICLO",
        dias_restantes: 0,
        cuota_diaria_recalculada: presupuesto.cuota_diaria_recalculada,
        mensaje_bot:
          "¡No pasa nada! El exceso ocurrió en el cierre de tu ciclo semanal. Para no inducir un déficit agresivo, tu balance cerrará aquí y tu nutricionista calibrará la próxima pauta.",
      };
    }

    // 3. Proyección matemática del presupuesto semanal
    const nuevoConsumoSemana = presupuesto.calorias_consumidas_semana + caloriasExceso;
    const nuevasCaloriasRestantes = pauta.calorias_objetivo_semanal - nuevoConsumoSemana;

    // Reducción diaria requerida para compensar exactamente el exceso en los días restantes
    const descuentoDiarioTeorico = Math.ceil(caloriasExceso / diasRestantes);

    // Cuota diaria resultante si aplicamos el descuento a la cuota vigente
    const cuotaDiariaProyectada = presupuesto.cuota_diaria_recalculada - descuentoDiarioTeorico;

    // 4. VALIDACIÓN CRÍTICA: Regla de Seguridad Clínica TMB (< 80% de tmb_kcal)
    if (cuotaDiariaProyectada < limiteSeguridadTMB) {
      // ABORTAR descuento matemático para proteger la salud metabólica
      relationalStore.actualizarPresupuesto(presupuesto.id_presupuesto, {
        alerta_limite_tmb: true, // Flag en true
        calorias_consumidas_semana: nuevoConsumoSemana,
        calorias_restantes_semana: Math.max(0, nuevasCaloriasRestantes),
      });

      // Registrar interacción clínica de seguridad
      relationalStore.agregarRegistroConsumo({
        id_paciente: idPaciente,
        tipo_interaccion: "Desviacion_Compensada",
        alimento_detectado: "Exceso con Alerta TMB Activada",
        calorias_estimadas: caloriasExceso,
        nivel_hambre_previa: 2,
        contexto_emocional: "Exceso superior a umbral seguro de TMB",
      });

      return {
        exito: false,
        abortado: true,
        alerta_limite_tmb: true,
        tmb_kcal: paciente.tmb_kcal,
        limite_seguridad_tmb: limiteSeguridadTMB,
        cuota_diaria_recalculada: presupuesto.cuota_diaria_recalculada, // Se mantiene la cuota normal
        cuota_peligrosa_rechazada: cuotaDiariaProyectada,
        dias_restantes: diasRestantes,
        calorias_exceso: caloriasExceso,
        calorias_no_descontadas: caloriasExceso,
        mensaje_bot:
          `⚠️ Por criterio de seguridad médica, no recortaremos tus calorías por debajo de ${limiteSeguridadTMB} kcal/día ` +
          `(80% de tu metabolismo basal de ${paciente.tmb_kcal} kcal). Mantendremos tu cuota normal para cuidar tu masa muscular ` +
          `y evitar efecto rebote. ¡Tu constancia global importa más que un solo día!`,
      };
    }

    // 5. Aplicar compensación exitosa dentro del umbral seguro
    const nuevoPresupuesto = relationalStore.actualizarPresupuesto(presupuesto.id_presupuesto, {
      calorias_consumidas_semana: nuevoConsumoSemana,
      calorias_restantes_semana: Math.max(0, nuevasCaloriasRestantes),
      calorias_amortizandose: presupuesto.calorias_amortizandose + caloriasExceso,
      cuota_diaria_recalculada: cuotaDiariaProyectada,
      alerta_limite_tmb: false,
    });

    // Registrar interacción en historial operativo
    relationalStore.agregarRegistroConsumo({
      id_paciente: idPaciente,
      tipo_interaccion: "Desviacion_Compensada",
      alimento_detectado: `Compensación de +${caloriasExceso} kcal`,
      calorias_estimadas: caloriasExceso,
      nivel_hambre_previa: 2,
      contexto_emocional: "Amortización exitosa en ciclo semanal",
    });

    return {
      exito: true,
      abortado: false,
      alerta_limite_tmb: false,
      tmb_kcal: paciente.tmb_kcal,
      limite_seguridad_tmb: limiteSeguridadTMB,
      cuota_diaria_recalculada: cuotaDiariaProyectada,
      cuota_anterior: presupuesto.cuota_diaria_recalculada,
      descuento_diario_aplicado: descuentoDiarioTeorico,
      dias_restantes: diasRestantes,
      calorias_exceso: caloriasExceso,
      presupuesto_actualizado: nuevoPresupuesto,
      mensaje_bot:
        `¡Disfrutado y resuelto! Tu presupuesto semanal absorbió las +${caloriasExceso} kcal. ` +
        `Ajustamos solo -${descuentoDiarioTeorico} kcal en los próximos ${diasRestantes} días ` +
        `(quedando en ${cuotaDiariaProyectada} kcal/día), protegiendo tu metabolismo basal.`,
    };
  }
}
