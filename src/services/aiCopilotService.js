/**
 * ============================================================================
 * SERVICIO DE INTEGRACIÓN CON IA GENERATIVA Y GRAPHRAG (aiCopilotService)
 * ============================================================================
 * 
 * Arquitectura:
 * 1. GraphRAG Retrieval: Extracción previa del subgrafo de alimentos y del
 *    estado operacional de la pauta/presupuesto.
 * 2. Privacy-by-Design: Filtrado y pseudonimización mediante SecurityMiddleware.
 * 3. System Prompt Grounded: 5 Reglas de Negocio deterministas inyectadas.
 * 4. Structured JSON Output: Salida estricta para renderizar UI Cards en React Native.
 * 5. Multi-Provider & Resilient Fallback: Soporte para OpenAI (gpt-4o-mini / gpt-4o),
 *    Google Gemini (gemini-2.5-flash / gemini-1.5-flash) y motor determinista local en caso offline.
 */

import { NutriEngineService } from "./nutriEngineService.js";
import { relationalStore } from "../data/relationalStore.js";
import { SecurityMiddleware } from "./securityMiddleware.js";

// Almacenamiento en memoria / fallback si no está en localStorage
let inMemoryKeys = {
  gemini: null,
  openai: null,
};

export class AICopilotService {
  /**
   * Obtiene la API key configurada en memoria, localStorage o variables de entorno.
   */
  static getAPIKeys() {
    let localGemini = null;
    let localOpenAI = null;

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localGemini = window.localStorage.getItem("NUTRIBOT_GEMINI_KEY");
        localOpenAI = window.localStorage.getItem("NUTRIBOT_OPENAI_KEY");
      } catch (e) {
        // Ignorar errores de acceso a localStorage
      }
    }

    const envOpenAI =
      (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_OPENAI_API_KEY) ||
      (typeof process !== "undefined" && process.env?.OPENAI_API_KEY) ||
      null;

    const envGemini =
      (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_GEMINI_API_KEY) ||
      (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) ||
      null;

    return {
      gemini: inMemoryKeys.gemini || localGemini || envGemini || null,
      openai: inMemoryKeys.openai || localOpenAI || envOpenAI || null,
    };
  }

  /**
   * Guarda una API key en memoria y localStorage (para entorno web/app).
   */
  static setAPIKey(provider, key) {
    const cleanKey = (key || "").trim();
    if (provider === "gemini") {
      inMemoryKeys.gemini = cleanKey || null;
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          if (cleanKey) {
            window.localStorage.setItem("NUTRIBOT_GEMINI_KEY", cleanKey);
          } else {
            window.localStorage.removeItem("NUTRIBOT_GEMINI_KEY");
          }
        } catch (e) {}
      }
    } else if (provider === "openai") {
      inMemoryKeys.openai = cleanKey || null;
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          if (cleanKey) {
            window.localStorage.setItem("NUTRIBOT_OPENAI_KEY", cleanKey);
          } else {
            window.localStorage.removeItem("NUTRIBOT_OPENAI_KEY");
          }
        } catch (e) {}
      }
    }
  }

  /**
   * Indica qué proveedor de IA está activo o si se está en modo local.
   */
  static getStatusIA() {
    const keys = this.getAPIKeys();
    if (keys.gemini) {
      return { connected: true, provider: "Google Gemini (gemini-3.8-flash)", type: "gemini" };
    }
    if (keys.openai) {
      return { connected: true, provider: "OpenAI (gpt-4o-mini)", type: "openai" };
    }
    return { connected: false, provider: "Modo Local Offline", type: "offline" };
  }

  /**
   * Ejecuta el pre-retrieval GraphRAG para alimentar el contexto del LLM.
   */
  static extraerContextoGraphRAG(mensajeUsuario, idPaciente = "pac_001") {
    const paciente = relationalStore.getPaciente(idPaciente);
    const pauta = relationalStore.getPautaActiva(idPaciente);
    const presupuesto = relationalStore.getPresupuestoSemanal(idPaciente);

    // Intentar extraer menciones de alimentos en el mensaje para consultar el subgrafo
    const subgrafo = NutriEngineService.buscarSustitutosEnGrafo(
      mensajeUsuario,
      paciente?.restricciones_ids || []
    );

    return {
      paciente,
      pauta,
      presupuesto,
      subgrafo: subgrafo.encontrado ? subgrafo : null,
    };
  }

  /**
   * Construye el System Prompt con las 5 Reglas de Negocio inmutables.
   */
  static construirSystemPrompt(payloadSanitizado, subgrafo) {
    const { metricas_fisiologicas, contexto_operativo } = payloadSanitizado;

    const subgrafoString = subgrafo
      ? JSON.stringify(
          {
            alimento_detectado: subgrafo.alimento_origen.nombre_estandar,
            kcal_porcion: subgrafo.alimento_origen.kcal_porcion,
            gramos_porcion: subgrafo.alimento_origen.gramos_porcion,
            sustitutos_permitidos_en_grafo: subgrafo.sustitutos.map((s) => ({
              id: s.id_alimento,
              nombre: s.nombre_estandar,
              medida: s.medida_casera,
              kcal: s.kcal_porcion,
              ahorro_kcal: s.ahorro_kcal,
              motivo: s.motivo,
              macros: s.macros,
            })),
          },
          null,
          2
        )
      : "Ningún alimento específico coincidió directamente en el subgrafo.";

    return `
Eres el Copilot de Continuidad Nutricional de la aplicación 'NutriBot Coach'.
Tu misión es acompañar al paciente con empatía y calidez, respondiendo de forma conversacional y personalizada a exactamente lo que escribe, calculando calorías reales según la información dada o el subgrafo, y evitando cualquier culpa.

================================================================================
INFORMACIÓN CLÍNICA PSEUDONIMIZADA (LEY 21.719 / HIPAA):
================================================================================
- Token Paciente: ${payloadSanitizado.paciente_token}
- Tasa Metabólica Basal (TMB): ${metricas_fisiologicas.tmb_kcal} kcal/día
- Umbral de Seguridad TMB (80%): ${metricas_fisiologicas.umbral_seguridad_tmb_80_pct} kcal/día
- Restricciones Clínicas Activas: ${JSON.stringify(metricas_fisiologicas.restricciones_activas)}
- Día Actual del Ciclo: Día ${contexto_operativo.dia_ciclo} de 7 (Quedan ${contexto_operativo.dias_restantes} días)
- Presupuesto Semanal Total: ${contexto_operativo.calorias_objetivo_semanal} kcal
- Calorías Consumidas en Semana: ${contexto_operativo.calorias_consumidas_semana} kcal
- Cuota Diaria Actual Reajustada: ${contexto_operativo.cuota_diaria_actual} kcal/día
- Alerta Límite TMB Previa: ${contexto_operativo.alerta_limite_tmb ? "ACTIVA" : "INACTIVA"}

================================================================================
SUBGRAFO DE CONOCIMIENTO INYECTADO (GraphRAG Grounding):
================================================================================
${subgrafoString}

================================================================================
LAS 5 REGLAS DE NEGOCIO DETERMINISTAS:
================================================================================
1. REGLA 1 (INMUTABILIDAD DE LA PAUTA):
   Jamás modifiques las calorías base fijadas por el nutricionista (${contexto_operativo.calorias_objetivo_semanal} kcal/semana). Tu rol es reubicar dinámicamente los saldos diarios.

2. REGLA 2 (LÍMITE DE SEGURIDAD TMB 80%):
   Si el exceso es masivo (ej. > 1500-2000 kcal en pocos días) y llevaría la cuota diaria por debajo de ${metricas_fisiologicas.umbral_seguridad_tmb_80_pct} kcal (80% del TMB), explica con afecto y rigor clínico que no se recortará más calorías diarias para proteger su masa muscular y evitar efecto rebote.

3. REGLA 3 (CERO JUICIOS MORALES):
   Queda estrictamente prohibido usar palabras como 'pecado', 'culpa', 'comida chatarra', 'malo', 'prohibido' o 'arruinar la dieta'. Si el paciente comió pizza al desayuno o helado con amigos, normalízalo con amabilidad: el presupuesto semanal dinámico lo amortiza.

4. REGLA 4 (MANEJO DE INCERTIDUMBRE):
   Si el usuario dice algo vago sin porciones (ej. "comí pizza" o "fui a un asado"), NO apliques descuento calórico de inmediato. Haz 1 o 2 preguntas breves de confirmación (ej. "¿fueron 1 o 2 porciones? ¿era masa delgada?") y pon "requiere_confirmacion": true. PERO si el usuario YA ESPECIFICA porciones (ej. "comí 3 porciones de pizza al desayuno"), calcula el impacto calórico real (ej. 3 trozos de pizza ≈ 870-900 kcal), responde de forma natural comentando el desayuno sin juzgar, y pon "requiere_confirmacion": false e "impacto_calorico_estimado": 870.

5. REGLA 5 (SUSTITUCIÓN RESTRINGIDA AL GRAFO):
   Si el usuario pide un reemplazo ("¿con qué cambio el huevo?", "¿qué como en vez de helado?"), debes sugerir SOLO alternativas presentes en el SUBGRAFO DE CONOCIMIENTO inyectado.

================================================================================
FORMATO DE SALIDA (ESTRICTAMENTE JSON):
================================================================================
Debes responder SIEMPRE con un objeto JSON válido (sin markdown exterior ni texto adicional) con esta estructura:
{
  "respuesta_texto": "Mensaje conversacional empático, natural y directamente conectado con lo que el usuario escribió.",
  "intencion_detectada": "registro_desviacion" | "solicitud_reemplazo" | "confirmacion_porciones" | "consulta_general",
  "requiere_confirmacion": boolean,
  "tarjeta_reemplazo": {
    "original": "Nombre Alimento Original",
    "sugerencia": "Nombre Sustituto del Grafo",
    "kcal_original": number,
    "kcal_sugerencia": number,
    "porcion": "Medida casera sugerida",
    "tags": ["tag1", "tag2"]
  } | null,
  "impacto_calorico_estimado": number | null
}
`;
  }

  /**
   * Procesa un mensaje conversacional utilizando la arquitectura GraphRAG.
   */
  static async procesarMensaje(mensajeUsuario, idPaciente = "pac_001", historialMensajes = []) {
    // 1. GraphRAG Retrieval: Obtener subgrafo de alimentos y estado relacional
    const contexto = this.extraerContextoGraphRAG(mensajeUsuario, idPaciente);

    // 2. Cybersecurity: Sanitizar y pseudonimizar datos conforme a Ley 21.719 / HIPAA
    const payloadSanitizado = SecurityMiddleware.pseudonimizarPayload(
      contexto.paciente,
      mensajeUsuario,
      contexto
    );

    // 3. System Prompt determinista
    const systemPrompt = this.construirSystemPrompt(payloadSanitizado, contexto.subgrafo);

    // 4. Intentar llamada a API de LLM externo si hay credenciales disponibles
    const keys = this.getAPIKeys();

    if (keys.gemini) {
      try {
        const respuesta = await this._llamarGemini(
          keys.gemini,
          systemPrompt,
          payloadSanitizado.mensaje_sanitizado,
          contexto,
          historialMensajes
        );
        if (respuesta && respuesta.respuesta_texto) {
          return respuesta;
        }
      } catch (error) {
        console.warn("⚠️ Error llamando a Gemini API:", error.message);
      }
    }

    if (keys.openai) {
      try {
        const respuesta = await this._llamarOpenAI(
          keys.openai,
          systemPrompt,
          payloadSanitizado.mensaje_sanitizado,
          contexto,
          historialMensajes
        );
        if (respuesta && respuesta.respuesta_texto) {
          return respuesta;
        }
      } catch (error) {
        console.warn("⚠️ Error llamando a OpenAI API:", error.message);
      }
    }

    // 5. Fallback Determinista Inteligente (Grounded en Graph y Reglas de Negocio)
    return this._ejecutarFallbackDeterminista(payloadSanitizado, contexto);
  }

  /**
   * Llamada a Google Gemini API con cascada de modelos (Failover) ante alta demanda (503 / 429).
   */
  static async _llamarGemini(apiKey, systemPrompt, userMessage, contexto, historial = []) {
    // Cascada de modelos (Failover): flash, flash-lite y pro en caso de alta demanda o saturación
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-lite:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
    ];

    // Formatear historial reciente (últimos 4 mensajes)
    const formattedHistory = (historial || [])
      .slice(-4)
      .map((m) => `${m.sender === "user" ? "PACIENTE" : "NUTRIBOT"}: ${m.text || ""}`)
      .join("\n");

    const promptCompleto = `${systemPrompt}

${formattedHistory ? `HISTORIAL DE LA CONVERSACIÓN RECIENTE:\n${formattedHistory}\n` : ""}
MENSAJE ACTUAL DEL PACIENTE:
"${userMessage}"

Recuerda: Devuelve ÚNICAMENTE el objeto JSON estructurado según el formato de salida.`;

    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: promptCompleto }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    };

    let lastError = null;

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        // Manejo específico de saturación / alta demanda (HTTP 503 Unavailable o HTTP 429 Too Many Requests)
        if (response.status === 503 || response.status === 429) {
          console.warn(`⚠️ Gemini endpoint con alta demanda (${response.status}). Esperando 600ms antes del siguiente modelo...`);
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue; // Salta de inmediato al siguiente servidor en la cascada
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawJson) throw new Error("Respuesta vacía de Gemini");

        // Limpiar bloques markdown ```json ... ``` de forma robusta
        const cleanedJson = rawJson
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
        const parsed = JSON.parse(cleanedJson);

        return this._enriquecerRespuestaConMotor(parsed, contexto);
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error("Fallo en llamadas a Gemini");
  }

  /**
   * Llamada a OpenAI (gpt-4o-mini / gpt-4o) con JSON Mode.
   */
  static async _llamarOpenAI(apiKey, systemPrompt, userMessage, contexto, historial = []) {
    const url = "https://api.openai.com/v1/chat/completions";

    const messages = [{ role: "system", content: systemPrompt }];

    // Incluir mensajes previos relevantes
    if (Array.isArray(historial)) {
      historial.slice(-4).forEach((m) => {
        if (m.text) {
          messages.push({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          });
        }
      });
    }

    messages.push({ role: "user", content: userMessage });

    const body = {
      model: "gpt-4o-mini",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.3,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    return this._enriquecerRespuestaConMotor(parsed, contexto);
  }

  /**
   * Fallback determinista inteligente en caso de no contar con API key o red.
   */
  static _ejecutarFallbackDeterminista(payloadSanitizado, contexto) {
    const texto = payloadSanitizado.mensaje_sanitizado.toLowerCase();

    // Caso 1: Consulta directa de Presupuesto y Calorías de Hoy (ej. "cuántas calorías debo comer hoy", "cuál es mi cuota")
    if (
      texto.includes("cuántas calorías") ||
      texto.includes("cuantas calorias") ||
      texto.includes("cuánto puedo comer") ||
      texto.includes("cuanto puedo comer") ||
      texto.includes("cuál es mi cuota") ||
      texto.includes("cual es mi cuota") ||
      texto.includes("calorías de hoy") ||
      texto.includes("calorias de hoy") ||
      texto.includes("presupuesto") ||
      texto.includes("cuanto me queda") ||
      texto.includes("cuánto me queda")
    ) {
      const pres = relationalStore.getPresupuestoSemanal(contexto.paciente.id_paciente);
      const cuotaHoy = pres?.cuota_diaria_recalculada || 1875;
      const consumidasHoy = 1240; // Consumo acumulado hoy (desayuno y colación)
      const restantesHoy = Math.max(0, cuotaHoy - consumidasHoy);
      const restantesSemana = pres?.calorias_restantes_semana || 6800;
      const diasRestantes = Math.max(1, 7 - (pres?.dia_actual_ciclo || 4));
      const amortizando = pres?.calorias_amortizandose || 0;

      let detalleCompensacion = "";
      if (amortizando > 0) {
        detalleCompensacion = ` (recalibrado con -125 kcal por compensación de exceso previo sin afectar tu masa muscular).`;
      }

      return {
        respuesta_texto: `Tu cuota diaria para hoy es de ${cuotaHoy} kcal${detalleCompensacion}. Has consumido ${consumidasHoy} kcal y te quedan exactamente ${restantesHoy} kcal disponibles para hoy (y ${restantesSemana} kcal para el resto de la semana). ¡Vas con excelente adherencia!`,
        intencion_detectada: "consulta_general",
        requiere_confirmacion: false,
        tarjeta_reemplazo: null,
        tarjeta_compensacion: null,
        impacto_calorico_estimado: null,
      };
    }

    // Caso 2: Solicitud de Reemplazo (Regla 5)
    if (
      texto.includes("reemplazo") ||
      texto.includes("cambiar") ||
      texto.includes("sustituto") ||
      texto.includes("no tengo")
    ) {
      const subgrafo = contexto.subgrafo;
      if (subgrafo && subgrafo.sustitutos.length > 0) {
        const mejorSustituto = subgrafo.sustitutos[0];
        return {
          respuesta_texto: `Para reemplazar ${subgrafo.alimento_origen.nombre_estandar} sin alterar tu plan, te sugiero esta alternativa de alta densidad nutricional:`,
          intencion_detectada: "solicitud_reemplazo",
          requiere_confirmacion: false,
          tarjeta_reemplazo: {
            original: subgrafo.alimento_origen.nombre_estandar,
            sugerencia: mejorSustituto.nombre_estandar,
            kcal_original: subgrafo.alimento_origen.kcal_porcion,
            kcal_sugerencia: mejorSustituto.kcal_porcion,
            porcion: mejorSustituto.medida_casera,
            tags: [mejorSustituto.grupo_intercambio, `Ahorras ${mejorSustituto.ahorro_kcal} kcal`],
          },
          tarjeta_compensacion: null,
          impacto_calorico_estimado: null,
        };
      }
    }

    // Caso 3: Manejo de Incertidumbre si no hay cantidad (Regla 4)
    if (texto.includes("pizza") && !texto.match(/\d+\s*(?:porciones|trozos|rebanadas)/)) {
      return {
        respuesta_texto:
          "¿Qué rico! Para ajustar con precisión tu presupuesto semanal: ¿fueron 1 o 2 porciones de pizza, o fue pizza completa?",
        intencion_detectada: "confirmacion_porciones",
        requiere_confirmacion: true,
        tarjeta_reemplazo: null,
        tarjeta_compensacion: null,
        impacto_calorico_estimado: 585,
      };
    }

    // Caso 4: Cálculo dinámico de porciones si se mencionan
    let caloriasCalculadas = null;
    const matchPorcionesPizza = texto.match(/(\d+)\s*(?:porciones|trozos|rebanadas)\s*(?:de\s*)?pizza/i);
    if (matchPorcionesPizza) {
      const porciones = parseInt(matchPorcionesPizza[1], 10);
      caloriasCalculadas = porciones * 290; // ~290 kcal por trozo de pizza
    } else {
      const matchCal = texto.match(/(\d+)\s*(?:kcal|calorías|cal)/);
      if (matchCal) {
        caloriasCalculadas = parseInt(matchCal[1], 10);
      } else if (texto.includes("helado")) {
        caloriasCalculadas = 500;
      } else if (texto.includes("pizza")) {
        caloriasCalculadas = 580;
      } else {
        caloriasCalculadas = 400;
      }
    }

    const resultadoCompensacion = NutriEngineService.calcularCompensacionSemanal(
      caloriasCalculadas,
      contexto.paciente.id_paciente
    );

    return {
      respuesta_texto: resultadoCompensacion.mensaje_bot,
      intencion_detectada: "registro_desviacion",
      requiere_confirmacion: false,
      tarjeta_reemplazo: null,
      tarjeta_compensacion: {
        calorias_exceso: caloriasCalculadas,
        dias_restantes: resultadoCompensacion.dias_restantes,
        reduccion_diaria: resultadoCompensacion.descuento_diario_aplicado || 0,
        cuota_recalculada: resultadoCompensacion.cuota_diaria_recalculada,
        alerta_limite_tmb: resultadoCompensacion.alerta_limite_tmb,
      },
      impacto_calorico_estimado: caloriasCalculadas,
    };
  }

  /**
   * Conecta la respuesta generada por el LLM con el motor determinista de compensación si aplica.
   */
  static _enriquecerRespuestaConMotor(parsedLLM, contexto) {
    if (parsedLLM.intencion_detectada === "registro_desviacion" && !parsedLLM.requiere_confirmacion) {
      const exceso = parsedLLM.impacto_calorico_estimado || 400;
      const comp = NutriEngineService.calcularCompensacionSemanal(exceso, contexto.paciente.id_paciente);

      parsedLLM.tarjeta_compensacion = {
        calorias_exceso: exceso,
        dias_restantes: comp.dias_restantes,
        reduccion_diaria: comp.descuento_diario_aplicado || 0,
        cuota_recalculada: comp.cuota_diaria_recalculada,
        alerta_limite_tmb: comp.alerta_limite_tmb,
      };
    }
    return parsedLLM;
  }
}

export default AICopilotService;
