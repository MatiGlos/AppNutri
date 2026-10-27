import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { relationalStore } from '../data/relationalStore';
import { SecurityMiddleware } from '../services/securityMiddleware';
import { knowledgeGraph } from '../data/knowledgeGraph';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - SPACING.lg * 2;

export default function DashboardScreen() {
  const { theme, isDark, toggleTheme } = useTheme();

  // Estados sincronizados en vivo con relationalStore
  const [presupuesto, setPresupuesto] = useState(() => relationalStore.getPresupuestoSemanal('pac_001'));
  const [registros, setRegistros] = useState(() => relationalStore.getHistorialRegistros('pac_001'));
  const [paciente, setPaciente] = useState(() => relationalStore.getPaciente('pac_001'));
  const [pauta, setPauta] = useState(() => relationalStore.getPautaActiva('pac_001'));
  const [nutricionista, setNutricionista] = useState(() => relationalStore.getNutricionista('nutri_001'));

  // Estado del modal del Inspector de Base de Conocimiento y Auditoría
  const [inspectorVisible, setInspectorVisible] = useState(false);
  const [inspectorTab, setInspectorTab] = useState('graph'); // 'graph' | 'rls' | 'audit'

  // Suscripción reactiva al singleton relationalStore
  useEffect(() => {
    const syncFromStore = () => {
      setPresupuesto(relationalStore.getPresupuestoSemanal('pac_001'));
      setRegistros(relationalStore.getHistorialRegistros('pac_001'));
      setPaciente(relationalStore.getPaciente('pac_001'));
      setPauta(relationalStore.getPautaActiva('pac_001'));
      setNutricionista(relationalStore.getNutricionista('nutri_001'));
    };

    syncFromStore();
    const unsubscribe = relationalStore.subscribe(syncFromStore);
    return () => unsubscribe();
  }, []);

  // Cálculos dinámicos de métricas
  const caloriasConsumidas = presupuesto?.calorias_consumidas_semana || 7200;
  const caloriasAmortizandose = presupuesto?.calorias_amortizandose || 0;
  const caloriasRestantes = presupuesto?.calorias_restantes_semana || 6800;
  const cuotaRecalculada = presupuesto?.cuota_diaria_recalculada || 1875;
  const alertaLimiteTMB = Boolean(presupuesto?.alerta_limite_tmb);
  const diaActual = presupuesto?.dia_actual_ciclo || 4;
  const diasRestantes = Math.max(1, 7 - diaActual);

  // Adherencia: proporción de registros En_Plan o Sustitucion_Grafo
  const totalRegistros = Math.max(1, registros.length);
  const registrosPositivos = registros.filter(
    (r) => r.tipo_interaccion === 'En_Plan' || r.tipo_interaccion === 'Sustitucion_Grafo'
  ).length;
  const adherenciaPorcentaje = Math.round((registrosPositivos / totalRegistros) * 100);

  // Datos dinámicos para el gráfico semanal
  // Datos dinámicos para las barras de consumo semanal Lunes a Domingo
  const wednesdayKcal = caloriasAmortizandose > 0 ? 2000 + caloriasAmortizandose : 2000;
  const remainingDaysKcal = caloriasAmortizandose > 0 ? cuotaRecalculada : 2000;
  const targetKcal = pauta?.calorias_objetivo_diario_base || 2000;

  const weeklyDays = [
    { label: 'Lun', kcal: 1950, isCompensated: false, isCurrent: diaActual === 1 },
    { label: 'Mar', kcal: 1980, isCompensated: false, isCurrent: diaActual === 2 },
    { label: 'Mié', kcal: wednesdayKcal, isCompensated: caloriasAmortizandose > 0, isCurrent: diaActual === 3 },
    { label: 'Jue', kcal: remainingDaysKcal, isCompensated: false, isCurrent: diaActual === 4 },
    { label: 'Vie', kcal: remainingDaysKcal, isCompensated: false, isCurrent: diaActual === 5 },
    { label: 'Sáb', kcal: remainingDaysKcal, isCompensated: false, isCurrent: diaActual === 6 },
    { label: 'Dom', kcal: remainingDaysKcal, isCompensated: false, isCurrent: diaActual === 7 },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.webContainer}>
      {/* 1. Header Superior con Selector de Tema */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Resumen Clínico & Progreso</Text>
          <Text style={[styles.headerSubtitle, { color: theme.primaryDark }]}>
            Paciente: {paciente?.nombre || 'Mati'} · Día {diaActual} de 7
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.themeButton, { backgroundColor: theme.borderLight, borderColor: theme.border }]}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={18}
            color={isDark ? '#FACC15' : theme.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Botón Destacado: Inspector de Base de Conocimiento y Ciberseguridad */}
        <TouchableOpacity
          style={[styles.inspectorTriggerButton, { backgroundColor: theme.card, borderColor: theme.primary }]}
          onPress={() => setInspectorVisible(true)}
          activeOpacity={0.85}
        >
          <View style={[styles.inspectorTriggerIconBox, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
          </View>
          <View style={styles.inspectorTriggerTextCol}>
            <View style={styles.badgeInlineRow}>
              <Text style={[styles.inspectorTriggerTitle, { color: theme.text }]}>
                Inspector de Base de Conocimiento
              </Text>
              <View style={[styles.miniBadgeSuccess, { backgroundColor: theme.primaryLight }]}>
                <Text style={[styles.miniBadgeSuccessText, { color: theme.primaryDark }]}>En Vivo</Text>
              </View>
            </View>
            <Text style={[styles.inspectorTriggerSubtitle, { color: theme.textMuted }]}>
              Demostración: Grafo + Supabase RLS + Payload Pseudonimizado (Ley 21.719)
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.primary} />
        </TouchableOpacity>

        {/* 3. Banner de Estado Clínico / Alerta TMB para Nutricionista */}
        {alertaLimiteTMB ? (
          <View style={[styles.bannerCard, styles.bannerCardWarning, { backgroundColor: theme.card, borderColor: theme.accent }]}>
            <View style={[styles.bannerIconWrapper, { backgroundColor: theme.accentLight }]}>
              <Ionicons name="warning" size={24} color={theme.accent} />
            </View>
            <View style={styles.bannerTextContainer}>
              <View style={styles.bannerHeaderRow}>
                <Text style={[styles.bannerTitle, { color: theme.accentDark }]}>
                  ⚠️ Alerta Clínica TMB: Límite 80% Alcanzado
                </Text>
                <View style={[styles.miniBadge, { backgroundColor: theme.accentLight }]}>
                  <Text style={[styles.miniBadgeText, { color: theme.accentDark }]}>Nutricionista Notificada</Text>
                </View>
              </View>
              <Text style={[styles.bannerDescription, { color: theme.textMuted }]}>
                El exceso calórico acumulado no se restará de la cuota diaria para proteger el metabolismo basal (&lt;1,480 kcal/día). Se preserva la masa muscular y se evita efecto rebote.
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.bannerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.bannerIconWrapper, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="shield-checkmark" size={22} color={theme.primary} />
            </View>
            <View style={styles.bannerTextContainer}>
              <View style={styles.bannerHeaderRow}>
                <Text style={[styles.bannerTitle, { color: theme.text }]}>
                  Metabolismo Basal Seguro & Protegido
                </Text>
                <View style={[styles.miniBadge, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.miniBadgeText, { color: theme.primaryDark }]}>TMB Segura</Text>
                </View>
              </View>
              <Text style={[styles.bannerDescription, { color: theme.textMuted }]}>
                {caloriasAmortizandose > 0
                  ? `El exceso de +${caloriasAmortizandose} kcal se amortiza en los ${diasRestantes} días restantes (${cuotaRecalculada} kcal/día), sin pasar hambre ni déficits extremos.`
                  : 'Tu semana avanza según la pauta clínica base prescrita. Presupuesto sin desviaciones activas.'}
              </Text>
            </View>
          </View>
        )}

        {/* 4. Gráfico Semanal: Consumo Real vs Meta */}
        <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.chartHeaderRow}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Calorías Lunes a Domingo
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>
                Línea punteada: Meta diaria base ({pauta?.calorias_objetivo_diario_base || 2000} kcal)
              </Text>
            </View>

            {caloriasAmortizandose > 0 && (
              <View style={[styles.deviationChip, { backgroundColor: theme.accentLight }]}>
                <View style={[styles.chipDot, { backgroundColor: theme.accent }]} />
                <Text style={[styles.deviationChipText, { color: theme.accentDark }]}>
                  Mié: +{caloriasAmortizandose} kcal
                </Text>
              </View>
            )}
          </View>

          {/* Gráfico de Barras Nativo React Native (Cero dependencias problemáticas en Web) */}
          <View style={styles.nativeChartWrapper}>
            {/* Línea de referencia Meta 2,000 kcal */}
            <View style={styles.chartReferenceLineRow}>
              <View style={[styles.targetDashLine, { borderColor: isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.3)' }]} />
              <Text style={[styles.targetDashLabel, { color: theme.textMuted }]}>
                Meta {targetKcal} kcal
              </Text>
            </View>

            {/* Contenedor de las 7 barras */}
            <View style={styles.barsContainer}>
              {weeklyDays.map((d, idx) => {
                const maxKcalScale = 3000;
                const barHeightPercent = Math.min(100, Math.max(15, Math.round((d.kcal / maxKcalScale) * 100)));
                const barColor = d.isCompensated ? theme.accent : theme.primary;
                const barBg = d.isCompensated ? theme.accentLight : theme.primaryLight;

                return (
                  <View key={idx} style={styles.barCol}>
                    {/* Valor calórico encima de la barra */}
                    <Text
                      style={[
                        styles.barKcalText,
                        { color: d.isCompensated ? theme.accentDark : theme.textMuted },
                        d.isCompensated && { fontWeight: '800' },
                      ]}
                      numberOfLines={1}
                    >
                      {Math.round(d.kcal)}
                    </Text>

                    {/* Track de la barra */}
                    <View style={[styles.barTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${barHeightPercent}%`,
                            backgroundColor: barColor,
                          },
                        ]}
                      />
                    </View>

                    {/* Etiqueta del Día */}
                    <Text
                      style={[
                        styles.barDayLabel,
                        { color: d.isCurrent ? theme.text : theme.textMuted },
                        d.isCurrent && { fontWeight: '800', color: theme.primary },
                      ]}
                    >
                      {d.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Leyenda explicativa inferior */}
            <View style={styles.chartLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: theme.primary }]} />
                <Text style={[styles.legendText, { color: theme.textMuted }]}>En Plan ({pauta?.calorias_objetivo_diario_base || 2000} kcal)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: theme.accent }]} />
                <Text style={[styles.legendText, { color: theme.textMuted }]}>Compensación Semanal</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. Sección de Métricas Clave (KPIs en Vivo) */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Métricas Operativas</Text>

        <View style={styles.kpiGrid}>
          {/* KPI 1: Adherencia al Plan */}
          <View style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.kpiHeaderRow}>
              <View style={[styles.kpiIconBox, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="checkmark-done" size={18} color={theme.primary} />
              </View>
              <View style={[styles.kpiTag, { backgroundColor: theme.primaryLight }]}>
                <Text style={[styles.kpiTagText, { color: theme.primaryDark }]}>{adherenciaPorcentaje}%</Text>
              </View>
            </View>

            <Text style={[styles.kpiNumber, { color: theme.text }]}>
              {registrosPositivos} / {totalRegistros}
            </Text>
            <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Eventos en Plan / Grafo</Text>
            <Text style={[styles.kpiFooter, { color: theme.primaryDark }]}>
              Consistencia &gt; Perfección
            </Text>
          </View>

          {/* KPI 2: Calorías Compensadas */}
          <View style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.kpiHeaderRow}>
              <View style={[styles.kpiIconBox, { backgroundColor: theme.accentLight }]}>
                <Ionicons name="sync-outline" size={18} color={theme.accent} />
              </View>
              <View style={[styles.kpiTag, { backgroundColor: theme.accentLight }]}>
                <Text style={[styles.kpiTagText, { color: theme.accentDark }]}>
                  {caloriasAmortizandose > 0 ? 'Amortizando' : 'Equilibrado'}
                </Text>
              </View>
            </View>

            <Text style={[styles.kpiNumber, { color: caloriasAmortizandose > 0 ? theme.accent : theme.primary }]}>
              +{caloriasAmortizandose} kcal
            </Text>
            <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Compensación Activa</Text>
            <Text style={[styles.kpiFooter, { color: caloriasAmortizandose > 0 ? theme.accentDark : theme.textMuted }]}>
              {caloriasAmortizandose > 0 ? `-${Math.ceil(caloriasAmortizandose / diasRestantes)} kcal/día (${diasRestantes}d)` : 'Sin exceso pendiente'}
            </Text>
          </View>
        </View>

        {/* KPI 3: Presupuesto Acumulado */}
        <View style={[styles.budgetSummaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.budgetSummaryRow}>
            <View>
              <Text style={[styles.budgetSummaryLabel, { color: theme.textMuted }]}>Consumo Semanal Total</Text>
              <Text style={styles.budgetSummaryValue}>
                <Text style={[styles.boldBig, { color: theme.text }]}>{caloriasConsumidas.toLocaleString()}</Text>
                <Text style={[styles.totalMuted, { color: theme.textMuted }]}> / 14,000 kcal</Text>
              </Text>
            </View>
            <View style={[styles.remainingBadge, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.remainingBadgeText, { color: theme.primaryDark }]}>
                Quedan {caloriasRestantes.toLocaleString()} kcal
              </Text>
            </View>
          </View>
        </View>

        {/* 6. Historial de Registros en Vivo */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: SPACING.md }]}>
          Registros de Consumo y Comportamiento ({registros.length})
        </Text>

        <View style={styles.historyList}>
          {registros.map((item, index) => {
            const isGrafo = item.tipo_interaccion === 'Sustitucion_Grafo';
            const isCompensado = item.tipo_interaccion === 'Desviacion_Compensada';

            return (
              <View
                key={item.id_registro || index}
                style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View
                  style={[
                    styles.historyIconCircle,
                    {
                      backgroundColor: isGrafo
                        ? theme.primaryLight
                        : isCompensado
                        ? theme.accentLight
                        : theme.borderLight,
                    },
                  ]}
                >
                  <Ionicons
                    name={isGrafo ? 'sparkles' : isCompensado ? 'sync-outline' : 'checkmark-circle-outline'}
                    size={18}
                    color={isGrafo ? theme.primary : isCompensado ? theme.accent : theme.textMuted}
                  />
                </View>

                <View style={styles.historyContent}>
                  <View style={styles.historyTopRow}>
                    <Text style={[styles.historyFoodName, { color: theme.text }]}>
                      {item.alimento_detectado}
                    </Text>
                    <View
                      style={[
                        styles.historyBadge,
                        {
                          backgroundColor: isGrafo
                            ? theme.primaryLight
                            : isCompensado
                            ? theme.accentLight
                            : theme.borderLight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.historyBadgeText,
                          {
                            color: isGrafo
                              ? theme.primaryDark
                              : isCompensado
                              ? theme.accentDark
                              : theme.textMuted,
                          },
                        ]}
                      >
                        {isGrafo ? 'Sustitución Grafo' : isCompensado ? 'Desviación' : 'En Plan'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.historySubRow}>
                    <Text style={[styles.historyCalories, { color: isCompensado ? theme.accent : theme.primary }]}>
                      +{item.calorias_estimadas} kcal
                    </Text>
                    <Text style={[styles.historyContext, { color: theme.textMuted }]} numberOfLines={1}>
                      · {item.contexto_emocional}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 7. Modal del Inspector de Base de Conocimiento (Grafo + RLS + Payload Pseudonimizado) */}
      <Modal
        visible={inspectorVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setInspectorVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          {/* Header del Modal */}
          <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Inspector de Arquitectura & Seguridad
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.primaryDark }]}>
                Grafo de Conocimiento · Supabase RLS · Ley 21.719
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalCloseCircle, { backgroundColor: theme.borderLight }]}
              onPress={() => setInspectorVisible(false)}
            >
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Segmented Control / Pestañas del Inspector */}
          <View style={[styles.tabSelectorBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <TouchableOpacity
              style={[
                styles.tabItem,
                inspectorTab === 'graph' && [styles.tabItemActive, { borderBottomColor: theme.primary }],
              ]}
              onPress={() => setInspectorTab('graph')}
            >
              <Ionicons
                name="git-network-outline"
                size={16}
                color={inspectorTab === 'graph' ? theme.primary : theme.textMuted}
              />
              <Text
                style={[
                  styles.tabItemText,
                  { color: inspectorTab === 'graph' ? theme.primary : theme.textMuted },
                ]}
              >
                Grafo (GraphRAG)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabItem,
                inspectorTab === 'rls' && [styles.tabItemActive, { borderBottomColor: theme.primary }],
              ]}
              onPress={() => setInspectorTab('rls')}
            >
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={inspectorTab === 'rls' ? theme.primary : theme.textMuted}
              />
              <Text
                style={[
                  styles.tabItemText,
                  { color: inspectorTab === 'rls' ? theme.primary : theme.textMuted },
                ]}
              >
                Supabase RLS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabItem,
                inspectorTab === 'audit' && [styles.tabItemActive, { borderBottomColor: theme.primary }],
              ]}
              onPress={() => setInspectorTab('audit')}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={inspectorTab === 'audit' ? theme.primary : theme.textMuted}
              />
              <Text
                style={[
                  styles.tabItemText,
                  { color: inspectorTab === 'audit' ? theme.primary : theme.textMuted },
                ]}
              >
                Payload & Auditoría
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contenido de las Pestañas */}
          <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            {/* PESTAÑA 1: GRAFO DE CONOCIMIENTO */}
            {inspectorTab === 'graph' && (
              <View>
                <View style={[styles.inspectorCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.inspectorCardTitle, { color: theme.text }]}>
                    🕸️ Topología del Grafo de Nutrición Híbrido
                  </Text>
                  <Text style={[styles.inspectorCardDesc, { color: theme.textMuted }]}>
                    Estructura formal de Nodos y Aristas que alimenta el pre-retrieval GraphRAG determinista.
                  </Text>

                  <View style={styles.graphStatsGrid}>
                    <View style={[styles.graphStatBox, { backgroundColor: theme.background }]}>
                      <Text style={[styles.graphStatNumber, { color: theme.primary }]}>
                        {knowledgeGraph?.nodes?.alimentos?.length || 0}
                      </Text>
                      <Text style={[styles.graphStatLabel, { color: theme.textMuted }]}>Nodos Alimento</Text>
                    </View>

                    <View style={[styles.graphStatBox, { backgroundColor: theme.background }]}>
                      <Text style={[styles.graphStatNumber, { color: theme.accent }]}>
                        {knowledgeGraph?.nodes?.grupos_intercambio?.length || 0}
                      </Text>
                      <Text style={[styles.graphStatLabel, { color: theme.textMuted }]}>Grupos Intercambio</Text>
                    </View>

                    <View style={[styles.graphStatBox, { backgroundColor: theme.background }]}>
                      <Text style={[styles.graphStatNumber, { color: theme.primaryDark }]}>
                        {knowledgeGraph?.nodes?.restricciones_clinicas?.length || 0}
                      </Text>
                      <Text style={[styles.graphStatLabel, { color: theme.textMuted }]}>Restricciones</Text>
                    </View>

                    <View style={[styles.graphStatBox, { backgroundColor: theme.background }]}>
                      <Text style={[styles.graphStatNumber, { color: '#8B5CF6' }]}>
                        {Array.isArray(knowledgeGraph?.edges) ? knowledgeGraph.edges.length : 0}
                      </Text>
                      <Text style={[styles.graphStatLabel, { color: theme.textMuted }]}>Aristas Semánticas</Text>
                    </View>
                  </View>
                </View>

                {/* Subgrafo de Sustituciones Clave */}
                <Text style={[styles.sectionTitle, { color: theme.text, marginTop: SPACING.md }]}>
                  Aristas de Sustitución Validada (ES_SUSTITUTO_DE)
                </Text>

                {(Array.isArray(knowledgeGraph?.edges)
                  ? knowledgeGraph.edges.filter((e) => e?.type === 'ES_SUSTITUTO_DE').slice(0, 4)
                  : []
                ).map((edge, idx) => (
                  <View
                    key={idx}
                    style={[styles.edgeCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <View style={styles.edgeHeaderRow}>
                      <Text style={[styles.edgeOrigin, { color: theme.accentDark }]}>
                        {(edge?.from || '').replace('alim_', '').replace(/_/g, ' ').toUpperCase()}
                      </Text>
                      <Ionicons name="arrow-forward" size={14} color={theme.textMuted} />
                      <Text style={[styles.edgeDest, { color: theme.primaryDark }]}>
                        {(edge?.to || '').replace('alim_', '').replace(/_/g, ' ').toUpperCase()}
                      </Text>
                      <View style={[styles.miniBadgeSuccess, { backgroundColor: theme.primaryLight }]}>
                        <Text style={[styles.miniBadgeSuccessText, { color: theme.primaryDark }]}>
                          Similitud: {edge?.similitud_culinaria || 0.85}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.edgeMotivo, { color: theme.textMuted }]}>
                      {edge?.motivo || 'Equivalencia nutricional validada.'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* PESTAÑA 2: POLÍTICAS SUPABASE RLS */}
            {inspectorTab === 'rls' && (
              <View>
                <View style={[styles.inspectorCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.inspectorCardTitle, { color: theme.text }]}>
                    🔒 Row Level Security (RLS) en Supabase / PostgreSQL
                  </Text>
                  <Text style={[styles.inspectorCardDesc, { color: theme.textMuted }]}>
                    Aislamiento multi-inquilino a nivel de base de datos. Ningún usuario puede consultar registros de otros pacientes sin token autorizado.
                  </Text>

                  {/* Estado Multi-tenant Activo */}
                  <View style={[styles.sessionBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <View style={styles.sessionRow}>
                      <Text style={[styles.sessionKey, { color: theme.textMuted }]}>Sesión Paciente (auth.uid):</Text>
                      <Text style={[styles.sessionVal, { color: theme.primary }]}>pac_001 (Mati)</Text>
                    </View>
                    <View style={styles.sessionRow}>
                      <Text style={[styles.sessionKey, { color: theme.textMuted }]}>Nutricionista Asignado:</Text>
                      <Text style={[styles.sessionVal, { color: theme.accentDark }]}>nutri_001 ({nutricionista?.nombre_completo})</Text>
                    </View>
                    <View style={styles.sessionRow}>
                      <Text style={[styles.sessionKey, { color: theme.textMuted }]}>Aislamiento RLS:</Text>
                      <Text style={[styles.sessionVal, { color: '#10B981', fontWeight: '800' }]}>ACTIVO Y VERIFICADO</Text>
                    </View>
                  </View>
                </View>

                {/* Código SQL de Políticas */}
                <Text style={[styles.sectionTitle, { color: theme.text, marginTop: SPACING.md }]}>
                  Políticas SQL Implementadas en Supabase
                </Text>

                <View style={[styles.codeBox, { backgroundColor: isDark ? '#020617' : '#1E293B' }]}>
                  <Text style={styles.sqlCode}>
                    {`-- 1. Paciente solo consulta su propia pauta y presupuesto\nCREATE POLICY paciente_isolation ON Pacientes\n  FOR ALL USING (auth.uid() = id_paciente);\n\n-- 2. Nutricionista solo supervisa a sus pacientes asignados\nCREATE POLICY nutricionista_supervision ON Registros_Consumo\n  FOR SELECT USING (\n    EXISTS (\n      SELECT 1 FROM Pacientes\n      WHERE id_nutricionista = auth.uid()\n      AND id_paciente = Registros_Consumo.id_paciente\n    )\n  );`}
                  </Text>
                </View>
              </View>
            )}

            {/* PESTAÑA 3: PAYLOAD Y AUDITORÍA LEY 21.719 */}
            {inspectorTab === 'audit' && (
              <View>
                <View style={[styles.inspectorCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.inspectorCardTitle, { color: theme.text }]}>
                    🛡️ Privacidad por Diseño (Ley 21.719 / HIPAA)
                  </Text>
                  <Text style={[styles.inspectorCardDesc, { color: theme.textMuted }]}>
                    Inspección del payload minimizado y pseudonimizado que viaja hacia las APIs de Inteligencia Artificial externa.
                  </Text>

                  <View style={styles.auditSummaryRow}>
                    <View style={[styles.auditPill, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[styles.auditPillText, { color: theme.primaryDark }]}>
                        Token: PATIENT_TOKEN_89A
                      </Text>
                    </View>
                    <View style={[styles.auditPill, { backgroundColor: theme.accentLight }]}>
                      <Text style={[styles.auditPillText, { color: theme.accentDark }]}>
                        PII Suprimida: [RUT, Nombre, Correo]
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Muestra JSON del Payload Sanitizado */}
                <Text style={[styles.sectionTitle, { color: theme.text, marginTop: SPACING.md }]}>
                  Payload Minimizado Transmitido al LLM
                </Text>

                <View style={[styles.codeBox, { backgroundColor: isDark ? '#020617' : '#1E293B' }]}>
                  <Text style={styles.jsonCode}>
                    {JSON.stringify(
                      {
                        paciente_token: SecurityMiddleware.ANONYMOUS_SESSION_TOKEN,
                        mensaje_sanitizado: '[Texto libre con RUT, emails y teléfonos enmascarados]',
                        metricas_fisiologicas: {
                          peso_actual_kg: paciente?.peso_actual_kg || 90,
                          estatura_cm: paciente?.estatura_cm || 175,
                          tmb_kcal: paciente?.tmb_kcal || 1850,
                          umbral_seguridad_tmb_80_pct: Math.round((paciente?.tmb_kcal || 1850) * 0.8),
                          restricciones_activas: paciente?.restricciones_ids || [],
                        },
                        contexto_operativo: {
                          dia_ciclo: diaActual,
                          dias_restantes: diasRestantes,
                          calorias_consumidas_semana: caloriasConsumidas,
                          calorias_amortizandose: caloriasAmortizandose,
                          alerta_limite_tmb: alertaLimiteTMB,
                        },
                      },
                      null,
                      2
                    )}
                  </Text>
                </View>

                {/* Historial de Logs de Auditoría Forense */}
                <Text style={[styles.sectionTitle, { color: theme.text, marginTop: SPACING.md }]}>
                  Eventos en Log de Auditoría Forense ({SecurityMiddleware.getAuditLogs().length})
                </Text>

                {SecurityMiddleware.getAuditLogs().slice(0, 3).map((log, i) => (
                  <View
                    key={i}
                    style={[styles.edgeCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <View style={styles.historyTopRow}>
                      <Text style={[styles.sessionKey, { color: theme.primary }]}>{log.id_evento}</Text>
                      <Text style={[styles.historyContext, { color: theme.textMuted }]}>{log.timestamp.slice(11, 19)}</Text>
                    </View>
                    <Text style={[styles.edgeMotivo, { color: theme.textMuted }]}>
                      Normativa: {log.normativa} · Token: {log.paciente_token}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    ...(Platform.OS === 'web' && {
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: 'rgba(0,0,0,0.08)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  themeButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  inspectorTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  inspectorTriggerIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inspectorTriggerTextCol: {
    flex: 1,
  },
  badgeInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  inspectorTriggerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  inspectorTriggerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  miniBadgeSuccess: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  miniBadgeSuccessText: {
    fontSize: 9,
    fontWeight: '800',
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },
  bannerCardWarning: {
    borderWidth: 1.5,
  },
  bannerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  bannerDescription: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  chartCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  deviationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  deviationChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  nativeChartWrapper: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
  },
  chartReferenceLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  targetDashLine: {
    flex: 1,
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
  },
  targetDashLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    paddingHorizontal: 2,
  },
  barKcalText: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  barTrack: {
    width: '100%',
    maxWidth: 28,
    height: 110,
    borderRadius: RADIUS.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: RADIUS.sm,
    minHeight: 12,
  },
  barDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  kpiCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.soft,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  kpiTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  kpiNumber: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
  },
  kpiLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  kpiFooter: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
  },
  budgetSummaryCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  budgetSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetSummaryLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  budgetSummaryValue: {
    marginTop: 2,
  },
  boldBig: {
    fontSize: 18,
    fontWeight: '800',
  },
  totalMuted: {
    fontSize: 12,
  },
  remainingBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
  },
  remainingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyList: {
    gap: SPACING.xs + 2,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  historyIconCircle: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyContent: {
    flex: 1,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyFoodName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  historyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  historyBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  historySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  historyCalories: {
    fontSize: 11,
    fontWeight: '700',
  },
  historyContext: {
    fontSize: 11,
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabSelectorBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {},
  tabItemText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalScrollContent: {
    padding: SPACING.lg,
  },
  inspectorCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  inspectorCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  inspectorCardDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: SPACING.md,
  },
  graphStatsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  graphStatBox: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  graphStatNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  graphStatLabel: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  edgeCard: {
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.xs + 2,
  },
  edgeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  edgeOrigin: {
    fontSize: 11,
    fontWeight: '800',
  },
  edgeDest: {
    fontSize: 11,
    fontWeight: '800',
  },
  edgeMotivo: {
    fontSize: 11,
    lineHeight: 15,
  },
  sessionBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 6,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionKey: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  codeBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  sqlCode: {
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  jsonCode: {
    color: '#4ADE80',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  auditSummaryRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  auditPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  auditPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
