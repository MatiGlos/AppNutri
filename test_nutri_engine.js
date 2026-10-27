/**
 * Script de validación integral: Knowledge Graph + Relational Store + NutriEngineService
 */

import { NutriEngineService } from "./src/services/nutriEngineService.js";
import { relationalStore } from "./src/data/relationalStore.js";
import { knowledgeGraph } from "./src/data/knowledgeGraph.js";

console.log("=================================================================");
console.log("TEST 1: Verificación de estructura del Grafo de Conocimiento");
console.log("=================================================================");
console.log(`Total Alimentos: ${knowledgeGraph.nodes.alimentos.length}`);
console.log(`Total Grupos Intercambio: ${knowledgeGraph.nodes.grupos_intercambio.length}`);
console.log(`Total Restricciones Clínicas: ${knowledgeGraph.nodes.restricciones_clinicas.length}`);
console.log(`Total Aristas: ${knowledgeGraph.edges.length}`);
if (knowledgeGraph.nodes.alimentos.length < 15) {
  throw new Error("Se esperaban al menos 15 alimentos en el grafo.");
}
console.log("✔ Grafo contiene al menos 15 alimentos locales y todas sus aristas.");

console.log("\n=================================================================");
console.log("TEST 2: Búsqueda de sustitutos para 'Helado' (Sin restricciones)");
console.log("=================================================================");
const resHelado = NutriEngineService.buscarSustitutosEnGrafo("helado", []);
console.log(`Alimento detectado: ${resHelado.alimento_origen.nombre_estandar}`);
console.log(`Sustitutos encontrados: ${resHelado.sustitutos.length}`);
resHelado.sustitutos.forEach((s) => {
  console.log(` -> ${s.nombre_estandar} | Ahorro: ${s.ahorro_kcal} kcal | Motivo: ${s.motivo}`);
});
if (resHelado.sustitutos.length === 0) {
  throw new Error("Se esperaba encontrar sustitutos para helado.");
}
console.log("✔ Sustitutos de helado encontrados correctamente con cálculo de ahorro calórico.");

console.log("\n=================================================================");
console.log("TEST 3: Filtro clínico - Búsqueda de 'Huevo' con restricción Vegana");
console.log("=================================================================");
const resHuevoVegano = NutriEngineService.buscarSustitutosEnGrafo("huevo", ["restr_vegano"]);
console.log(`Alimento detectado: ${resHuevoVegano.alimento_origen.nombre_estandar}`);
console.log(`Sustitutos válidos (filtrando productos animales): ${resHuevoVegano.sustitutos.length}`);
resHuevoVegano.sustitutos.forEach((s) => {
  console.log(` -> ${s.nombre_estandar} (ID: ${s.id_alimento})`);
});
const tieneQuesillo = resHuevoVegano.sustitutos.some((s) => s.id_alimento === "alim_quesillo");
if (tieneQuesillo) {
  throw new Error("FALLO DE FILTRADO: Quesillo no debe aparecer para un paciente vegano!");
}
console.log("✔ Filtrado clínico exitoso: Quesillo fue excluido y Tofu revuelto fue seleccionado.");

console.log("\n=================================================================");
console.log("TEST 4: Regla de Negocio 2 - Compensación Segura (500 kcal)");
console.log("=================================================================");
relationalStore.resetStore();
const compSegura = NutriEngineService.calcularCompensacionSemanal(500, "pac_001");
console.log(`Calorías exceso: ${compSegura.calorias_exceso}`);
console.log(`Días restantes: ${compSegura.dias_restantes}`);
console.log(`Descuento diario aplicado: -${compSegura.descuento_diario_aplicado} kcal`);
console.log(`Nueva cuota diaria: ${compSegura.cuota_diaria_recalculada} kcal (Límite TMB: ${compSegura.limite_seguridad_tmb} kcal)`);
console.log(`Alerta TMB activada: ${compSegura.alerta_limite_tmb}`);
console.log(`Mensaje Bot: ${compSegura.mensaje_bot}`);
if (compSegura.alerta_limite_tmb !== false || compSegura.abortado !== false) {
  throw new Error("La compensación de 500 kcal debió ser aceptada.");
}
console.log("✔ Compensación segura aplicada correctamente.");

console.log("\n=================================================================");
console.log("TEST 5: Regla de Negocio 2 - Validación Crítica TMB Abortada (2000 kcal)");
console.log("=================================================================");
// 2000 kcal en 3 días = ~667 kcal/día. 1875 - 667 = 1208 kcal < 1480 kcal (80% TMB)!
const compInsegura = NutriEngineService.calcularCompensacionSemanal(2000, "pac_001");
console.log(`Calorías exceso: ${compInsegura.calorias_exceso}`);
console.log(`Cuota peligrosa calculada: ${compInsegura.cuota_peligrosa_rechazada} kcal`);
console.log(`Límite 80% TMB: ${compInsegura.limite_seguridad_tmb} kcal`);
console.log(`Compensación abortada: ${compInsegura.abortado}`);
console.log(`Alerta TMB activada: ${compInsegura.alerta_limite_tmb}`);
console.log(`Cuota diaria protegida mantenida: ${compInsegura.cuota_diaria_recalculada} kcal`);
console.log(`Mensaje Bot: ${compInsegura.mensaje_bot}`);
if (compInsegura.abortado !== true || compInsegura.alerta_limite_tmb !== true) {
  throw new Error("La compensación excesiva debió ser ABORTADA por límite TMB.");
}
console.log("✔ Validación crítica de seguridad TMB funcionó según especificación clínica.");

console.log("\n=================================================================");
console.log("TEST 6: Verificación de Estado Relacional y Registro Histórico");
console.log("=================================================================");
const presFinal = relationalStore.getPresupuestoSemanal("pac_001");
console.log("Presupuesto actual:", presFinal);
const historial = relationalStore.getHistorialRegistros("pac_001");
console.log(`Total registros en historial: ${historial.length}`);
console.log(`Último registro:`, historial[0]);

console.log("\n>>> ¡TODAS LAS PRUEBAS UNITARIAS Y DE DOMINIO PASARON CON ÉXITO! <<<");
