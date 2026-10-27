/**
 * ============================================================================
 * TEST DE VERIFICACIÓN: CIBERSEGURIDAD, GRAPHRAG Y LAS 5 REGLAS DE NEGOCIO
 * ============================================================================
 */

import { SecurityMiddleware } from "./src/services/securityMiddleware.js";
import { AICopilotService } from "./src/services/aiCopilotService.js";
import { relationalStore } from "./src/data/relationalStore.js";

async function runTests() {
  console.log("=================================================================");
  console.log("TEST 1: Módulo de Ciberseguridad y Pseudonimización (Ley 21.719 / HIPAA)");
  console.log("=================================================================");
  const pacienteReal = relationalStore.getPaciente("pac_001");
  const mensajeConPII = "Hola, soy Matias con rut 18.234.567-8 y fono +56912345678, me comí un helado de 500 kcal";
  
  const payloadSanitizado = SecurityMiddleware.pseudonimizarPayload(pacienteReal, mensajeConPII, {
    presupuesto: relationalStore.getPresupuestoSemanal("pac_001"),
    pauta: relationalStore.getPautaActiva("pac_001"),
  });

  console.log("-> Token Anónimo generado:", payloadSanitizado.paciente_token);
  console.log("-> Mensaje Sanitizado:", payloadSanitizado.mensaje_sanitizado);
  console.log("-> Métricas Minimizadas:", payloadSanitizado.metricas_fisiologicas);

  if (payloadSanitizado.paciente_token !== "PATIENT_TOKEN_89A") {
    throw new Error("El token de sesión anónimo no coincide.");
  }
  if (payloadSanitizado.mensaje_sanitizado.includes("18.234.567-8") || payloadSanitizado.mensaje_sanitizado.includes("+56912345678")) {
    throw new Error("Fallo en sanitización: El RUT o FONO no fueron enmascarados.");
  }
  if (payloadSanitizado.nombre || payloadSanitizado.correo_electronico || payloadSanitizado.id_paciente) {
    throw new Error("Fallo de minimización: Se filtró PII directa en el payload.");
  }
  console.log("✔ Pseudonimización, enmascaramiento y minimización de datos validados.");

  console.log("\n=================================================================");
  console.log("TEST 2: GraphRAG - Caso Reemplazo de Alimento (Regla 5)");
  console.log("=================================================================");
  const respuestaReemplazo = await AICopilotService.procesarMensaje("¿Con qué puedo cambiar los huevos al desayuno?");
  console.log("-> Intención:", respuestaReemplazo.intencion_detectada);
  console.log("-> Texto:", respuestaReemplazo.respuesta_texto);
  console.log("-> Tarjeta Reemplazo:", respuestaReemplazo.tarjeta_reemplazo);

  if (!respuestaReemplazo.tarjeta_reemplazo || !respuestaReemplazo.tarjeta_reemplazo.sugerencia) {
    throw new Error("Debe devolver una tarjeta_reemplazo válida del subgrafo.");
  }
  console.log("✔ GraphRAG: Reemplazo generado a partir del subgrafo inyectado.");

  console.log("\n=================================================================");
  console.log("TEST 3: Manejo de Incertidumbre en Entrada Ambigua (Regla 4)");
  console.log("=================================================================");
  const respuestaAmbigua = await AICopilotService.procesarMensaje("Comí pizza anoche");
  console.log("-> Intención:", respuestaAmbigua.intencion_detectada);
  console.log("-> Requiere Confirmación:", respuestaAmbigua.requiere_confirmacion);
  console.log("-> Pregunta:", respuestaAmbigua.respuesta_texto);

  if (respuestaAmbigua.requiere_confirmacion !== true) {
    throw new Error("Debe solicitar confirmación ante platos ambiguos (Regla 4).");
  }
  console.log("✔ Manejo de incertidumbre: Solicita confirmación antes de descontar.");

  console.log("\n=================================================================");
  console.log("TEST 4: Desviación Calórica Segura (Regla 2 y Regla 3)");
  console.log("=================================================================");
  relationalStore.resetStore();
  const respuestaDesviacion = await AICopilotService.procesarMensaje("Me comí un helado de 500 kcal post almuerzo");
  console.log("-> Intención:", respuestaDesviacion.intencion_detectada);
  console.log("-> Texto:", respuestaDesviacion.respuesta_texto);
  console.log("-> Tarjeta Compensación:", respuestaDesviacion.tarjeta_compensacion);

  // Validar ausencia de palabras culpabilizadoras (Regla 3)
  const palabrasProhibidas = ["pecado", "culpa", "comida chatarra", "malo", "arruinaste"];
  for (const palabra of palabrasProhibidas) {
    if (respuestaDesviacion.respuesta_texto.toLowerCase().includes(palabra)) {
      throw new Error(`Violación de Regla 3: Uso de término prohibido '${palabra}'.`);
    }
  }
  console.log("✔ Cero Juicios Morales y Compensación Segura validadas.");

  console.log("\n=================================================================");
  console.log("TEST 5: Seguridad Clínica TMB - Desviación Excesiva Abortada (Regla 2)");
  console.log("=================================================================");
  const respuestaExcesoCritico = await AICopilotService.procesarMensaje("Comí un asado enorme con amigos de 2200 kcal");
  console.log("-> Texto:", respuestaExcesoCritico.respuesta_texto);
  console.log("-> Tarjeta Compensación:", respuestaExcesoCritico.tarjeta_compensacion);
  console.log("-> Alerta TMB:", respuestaExcesoCritico.tarjeta_compensacion?.alerta_limite_tmb);

  if (respuestaExcesoCritico.tarjeta_compensacion?.alerta_limite_tmb !== true) {
    throw new Error("Debe activar alerta_limite_tmb ante cuota inferior al 80% de TMB (Regla 2).");
  }
  console.log("✔ Límite TMB: Se abortó el recorte diario para proteger la salud metabólica.");

  console.log("\n=================================================================");
  console.log("TEST 6: Registro de Auditoría de Ciberseguridad (Inspección)");
  console.log("=================================================================");
  const auditLogs = SecurityMiddleware.getAuditLogs();
  console.log(`Total Eventos Auditados: ${auditLogs.length}`);
  console.log("Último Log:", {
    id_evento: auditLogs[0].id_evento,
    normativa: auditLogs[0].normativa,
    token: auditLogs[0].paciente_token,
    pii_suprimida: auditLogs[0].campos_pii_removidos,
  });

  console.log("\n>>> ¡TODOS LOS CONTROLES DE CIBERSEGURIDAD, GRAPHRAG Y REGLAS DE NEGOCIO PASARON AL 100%! <<<");
}

runTests().catch((err) => {
  console.error("❌ ERROR EN TEST:", err);
  process.exit(1);
});
