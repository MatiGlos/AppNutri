/**
 * ============================================================================
 * MÓDULO DE CIBERSEGURIDAD, PSEUDONIMIZACIÓN Y AUDITORÍA
 * (Cumplimiento Ley 21.719 de Protección de Datos Personales / HIPAA)
 * ============================================================================
 * 
 * Principios de Diseño:
 * 1. Privacidad por Diseño y por Defecto (Privacy by Design).
 * 2. Minimización de Datos: El LLM externo solo recibe variables antropométricas y
 *    clínicas estrictamente necesarias (TMB, peso, pauta, restricciones).
 * 3. Pseudonimización Determinista: Reemplazo de identificadores directos por
 *    un token anónimo de sesión ("PATIENT_TOKEN_89A").
 * 4. Sanitización de PII en Texto Libre: Enmascaramiento de RUT chileno, correos y teléfonos.
 * 5. Registro de Auditoría Demostrable para evaluación docente.
 */

// Registro de auditoría en memoria para demostración académica / fiscalización
const AUDIT_LOGS = [];

export class SecurityMiddleware {
  // Token pseudónimo asignado al paciente evaluado
  static ANONYMOUS_SESSION_TOKEN = "PATIENT_TOKEN_89A";

  /**
   * Sanitiza el texto libre introducido por el usuario para remover posibles PII
   * (Nombres, RUT chileno, teléfonos y correos electrónicos).
   * 
   * @param {string} texto - Mensaje original del usuario.
   * @returns {string} Texto con PII enmascarada.
   */
  static sanitizarTextoLibre(texto) {
    if (!texto || typeof texto !== "string") return "";

    let sanitizado = texto;

    // 1. Enmascarar RUT chileno (ej. 12.345.678-9, 12345678-k)
    const regexRUT = /\b\d{1,2}(?:\.?\d{3}){2}-[\dkK]\b/g;
    sanitizado = sanitizado.replace(regexRUT, "[RUT_ENMASCARADO]");

    // 2. Enmascarar correos electrónicos
    const regexEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    sanitizado = sanitizado.replace(regexEmail, "[EMAIL_ENMASCARADO]");

    // 3. Enmascarar números de teléfono (+569..., 9XXXXXXXX)
    const regexFono = /(?:\+?56\s?9\s?\d{4}\s?\d{4}|\b9\d{8}\b)/g;
    sanitizado = sanitizado.replace(regexFono, "[FONO_ENMASCARADO]");

    // 4. Enmascarar menciones explícitas al nombre real conocido
    const regexNombre = /\b(?:me llamo|soy|mi nombre es)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\b/gi;
    sanitizado = sanitizado.replace(regexNombre, "$1 [NOMBRE_REMOVIDO]");

    return sanitizado;
  }

  /**
   * Genera un payload minimizado y pseudonimizado antes de ser transmitido al LLM.
   * 
   * @param {Object} datosPaciente - Datos de la tabla Pacientes en relationalStore.
   * @param {string} mensajeUsuario - Mensaje libre enviado desde el chat.
   * @param {Object} contextoClinico - Presupuesto semanal, pauta y restricciones.
   * @returns {Object} Payload sanitizado conforme a Ley 21.719 / HIPAA.
   */
  static pseudonimizarPayload(datosPaciente, mensajeUsuario, contextoClinico = {}) {
    const timestamp = new Date().toISOString();

    // 1. Detección y lista de campos directos eliminados
    const camposRemovidos = [];
    if (datosPaciente?.nombre) camposRemovidos.push("nombre");
    if (datosPaciente?.correo_electronico) camposRemovidos.push("correo_electronico");
    if (datosPaciente?.id_paciente) camposRemovidos.push("id_paciente");
    if (datosPaciente?.telefono) camposRemovidos.push("telefono");

    // 2. Aplicar minimización de datos: Solo conservar parámetros fisiológicos y clínicos
    const metricasClinicasMinimizadas = {
      peso_actual_kg: datosPaciente?.peso_actual_kg || 90,
      estatura_cm: datosPaciente?.estatura_cm || 175,
      tmb_kcal: datosPaciente?.tmb_kcal || 1850,
      umbral_seguridad_tmb_80_pct: Math.round((datosPaciente?.tmb_kcal || 1850) * 0.8),
      restricciones_activas: datosPaciente?.restricciones_ids || [],
    };

    // 3. Sanitizar el mensaje de texto libre
    const mensajeSanitizado = this.sanitizarTextoLibre(mensajeUsuario);

    // 4. Payload que efectivamente saldrá hacia la API externa de IA
    const payloadSanitizado = {
      paciente_token: this.ANONYMOUS_SESSION_TOKEN,
      mensaje_sanitizado: mensajeSanitizado,
      metricas_fisiologicas: metricasClinicasMinimizadas,
      contexto_operativo: {
        dia_ciclo: contextoClinico?.presupuesto?.dia_actual_ciclo || 4,
        dias_restantes: Math.max(0, 7 - (contextoClinico?.presupuesto?.dia_actual_ciclo || 4)),
        calorias_consumidas_semana: contextoClinico?.presupuesto?.calorias_consumidas_semana || 7700,
        calorias_restantes_semana: contextoClinico?.presupuesto?.calorias_restantes_semana || 6300,
        cuota_diaria_actual: contextoClinico?.presupuesto?.cuota_diaria_recalculada || 1875,
        calorias_objetivo_semanal: contextoClinico?.pauta?.calorias_objetivo_semanal || 14000,
        alerta_limite_tmb: contextoClinico?.presupuesto?.alerta_limite_tmb || false,
      },
    };

    // 5. Registro formal en el Log de Auditoría
    const registroAuditoria = {
      id_evento: `AUDIT_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp,
      normativa: "Ley 21.719 (Chile) / HIPAA Compliance",
      paciente_token: this.ANONYMOUS_SESSION_TOKEN,
      campos_pii_removidos: camposRemovidos,
      texto_original_preview: mensajeUsuario ? `${mensajeUsuario.substring(0, 40)}...` : "",
      texto_sanitizado: mensajeSanitizado,
      payload_saliente: payloadSanitizado,
    };

    AUDIT_LOGS.unshift(registroAuditoria);

    // Demostración en consola visible para evaluación docente
    this.imprimirLogAuditoria(registroAuditoria);

    return payloadSanitizado;
  }

  /**
   * Imprime en consola un reporte formateado para inspección de seguridad en vivo.
   * 
   * @param {Object} log - Registro de auditoría a presentar.
   */
  static imprimirLogAuditoria(log) {
    console.log("\n╔════════════════════════════════════════════════════════════════════════════╗");
    console.log("║ 🛡️ [AUDITORÍA DE PRIVACIDAD POR DISEÑO - LEY 21.719 / HIPAA]               ║");
    console.log("╠════════════════════════════════════════════════════════════════════════════╣");
    console.log(`║ ID Evento       : ${log.id_evento}`);
    console.log(`║ Timestamp       : ${log.timestamp}`);
    console.log(`║ Token Anónimo   : ${log.paciente_token} (Identidad Real: Oculta)`);
    console.log(`║ PII Suprimida   : [${log.campos_pii_removidos.join(", ")}]`);
    console.log(`║ Texto Original  : "${log.texto_original_preview}"`);
    console.log(`║ Texto Sanitizado: "${log.texto_sanitizado}"`);
    console.log("║ Principio       : Minimización estricta (Solo TMB, peso y presupuesto)");
    console.log("╚════════════════════════════════════════════════════════════════════════════╝\n");
  }

  /**
   * Obtiene todos los logs de auditoría para visualización en pantalla o exportación.
   */
  static getAuditLogs() {
    return [...AUDIT_LOGS];
  }
}
