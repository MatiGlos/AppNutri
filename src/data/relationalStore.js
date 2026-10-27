/**
 * ============================================================================
 * ESTADO / REPOSITORIO RELACIONAL OPERATIVO (Relational Store)
 * ============================================================================
 * Modela las 5 tablas operativas de la arquitectura técnica de 'NutriBot Coach'.
 * Proporciona persistencia en memoria reactiva con métodos transaccionales
 * y compatibilidad de esquema directa con PostgreSQL / Supabase.
 */

// Estado Inicial Determinista (Seed Oficial)
const INITIAL_STATE = {
  // 1. Tabla: Nutricionistas
  Nutricionistas: [
    {
      id_nutricionista: "nutri_001",
      nombre_completo: "Dra. Camila Morales",
      especialidad: "Nutrición Clínica y Comportamiento Alimentario",
      correo_electronico: "camila.morales@nutribot.cl",
    },
  ],

  // 2. Tabla: Pacientes
  Pacientes: [
    {
      id_paciente: "pac_001",
      id_nutricionista: "nutri_001",
      nombre: "Mati",
      peso_actual_kg: 90,
      estatura_cm: 175,
      tmb_kcal: 1850, // Tasa Metabólica Basal crítica (80% = 1480 kcal)
      restricciones_ids: [], // e.g. ['restr_huevo', 'restr_lactosa']
    },
  ],

  // 3. Tabla: Pautas_Nutricionales
  Pautas_Nutricionales: [
    {
      id_pauta: "pauta_001",
      id_paciente: "pac_001",
      calorias_objetivo_semanal: 14000,
      calorias_objetivo_diario_base: 2000,
      macros_objetivo: {
        proteinas_g: 150,
        carbohidratos_g: 200,
        grasas_g: 65,
      },
      estructura_comidas_json: {
        desayuno: 450,
        almuerzo: 650,
        colacion: 250,
        cena: 650,
      },
      estado_pauta: true, // Activa
      fecha_creacion: "2026-10-25T08:00:00Z",
    },
  ],

  // 4. Tabla: Presupuesto_Dinamico_Semanal
  Presupuesto_Dinamico_Semanal: [
    {
      id_presupuesto: "pres_001",
      id_paciente: "pac_001",
      semana_inicio: "2026-10-26",
      semana_fin: "2026-11-01",
      dia_actual_ciclo: 4, // Día 4 de 7 (restan 3 días)
      calorias_consumidas_semana: 7200,
      calorias_restantes_semana: 6800,
      calorias_amortizandose: 0, // Amortización inicial (0 kcal antes de confirmar desviación)
      cuota_diaria_recalculada: 1875,
      alerta_limite_tmb: false, // Flag de seguridad clínica
    },
  ],

  // 5. Tabla: Registros_Consumo_y_Comportamiento
  Registros_Consumo_y_Comportamiento: [
    {
      id_registro: "reg_001",
      id_paciente: "pac_001",
      fecha_hora: "2026-10-28T16:20:00Z",
      tipo_interaccion: "Desviacion_Compensada", // 'En_Plan' | 'Sustitucion_Grafo' | 'Desviacion_Compensada'
      alimento_detectado: "Helado de crema tradicional",
      calorias_estimadas: 500,
      nivel_hambre_previa: 2, // Escala 1 a 5 (antojo / social)
      contexto_emocional: "Salida con amigos post-almuerzo",
    },
    {
      id_registro: "reg_002",
      id_paciente: "pac_001",
      fecha_hora: "2026-10-29T09:15:00Z",
      tipo_interaccion: "En_Plan",
      alimento_detectado: "Marraqueta con palta hass y café",
      calorias_estimadas: 247,
      nivel_hambre_previa: 4,
      contexto_emocional: "Desayuno habitual tranquilo",
    },
  ],
};

// Instancia reactiva del Store en memoria con soporte Pub/Sub
class RelationalStore {
  constructor() {
    this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
    this.listeners = new Set();
  }

  // --- Sistema de Suscripción Reactiva para Vistas y Componentes ---
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (err) {
        console.error("Error notificando listener en relationalStore:", err);
      }
    });
  }

  // --- Métodos de Acceso a Pacientes y Nutricionistas ---
  getPaciente(id_paciente = "pac_001") {
    return this.state.Pacientes.find((p) => p.id_paciente === id_paciente) || null;
  }

  actualizarRestriccionesPaciente(id_paciente, restricciones_ids = []) {
    const paciente = this.getPaciente(id_paciente);
    if (paciente) {
      paciente.restricciones_ids = [...restricciones_ids];
      this.notify();
    }
    return paciente;
  }

  getNutricionista(id_nutricionista = "nutri_001") {
    return this.state.Nutricionistas.find((n) => n.id_nutricionista === id_nutricionista) || null;
  }

  // --- Métodos de Pauta Nutricional ---
  getPautaActiva(id_paciente = "pac_001") {
    return (
      this.state.Pautas_Nutricionales.find(
        (p) => p.id_paciente === id_paciente && p.estado_pauta === true
      ) || null
    );
  }

  // --- Métodos de Presupuesto Dinámico Semanal ---
  getPresupuestoSemanal(id_paciente = "pac_001") {
    return (
      this.state.Presupuesto_Dinamico_Semanal.find(
        (b) => b.id_paciente === id_paciente
      ) || null
    );
  }

  actualizarPresupuesto(id_presupuesto, updates = {}) {
    const presupuesto = this.state.Presupuesto_Dinamico_Semanal.find(
      (b) => b.id_presupuesto === id_presupuesto
    );
    if (!presupuesto) {
      throw new Error(`Presupuesto ${id_presupuesto} no encontrado`);
    }

    Object.assign(presupuesto, updates);
    this.notify();
    return { ...presupuesto };
  }

  // --- Métodos de Historial y Comportamiento ---
  agregarRegistroConsumo(nuevoRegistro) {
    const registro = {
      id_registro: nuevoRegistro.id_registro || `reg_${Date.now()}`,
      id_paciente: nuevoRegistro.id_paciente || "pac_001",
      fecha_hora: nuevoRegistro.fecha_hora || new Date().toISOString(),
      tipo_interaccion: nuevoRegistro.tipo_interaccion || "En_Plan",
      alimento_detectado: nuevoRegistro.alimento_detectado,
      calorias_estimadas: nuevoRegistro.calorias_estimadas || 0,
      nivel_hambre_previa: nuevoRegistro.nivel_hambre_previa || 3,
      contexto_emocional: nuevoRegistro.contexto_emocional || "Neutro",
    };

    this.state.Registros_Consumo_y_Comportamiento.unshift(registro);
    this.notify();
    return registro;
  }

  getHistorialRegistros(id_paciente = "pac_001") {
    return this.state.Registros_Consumo_y_Comportamiento.filter(
      (r) => r.id_paciente === id_paciente
    );
  }

  // --- Restablecer a Valores de Fábrica (útil para pruebas y demos) ---
  resetStore() {
    this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
    this.notify();
    return this.state;
  }

  // Retornar copia íntegra del estado
  getFullSnapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }
}

// Exportar instancia singleton
export const relationalStore = new RelationalStore();
