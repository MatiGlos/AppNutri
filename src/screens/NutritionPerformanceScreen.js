import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { relationalStore } from '../data/relationalStore';

export default function NutritionPerformanceScreen() {
  const { theme, isDark } = useTheme();

  // Estados sincronizados con el store relacional
  const [presupuesto, setPresupuesto] = useState(() => relationalStore.getPresupuestoSemanal('pac_001'));
  const [pauta, setPauta] = useState(() => relationalStore.getPautaActiva('pac_001'));
  const [paciente, setPaciente] = useState(() => relationalStore.getPaciente('pac_001'));
  const [registros, setRegistros] = useState(() => relationalStore.getHistorialRegistros('pac_001'));

  // Estado interactivo de hidratación
  const [aguaConsumidaMl, setAguaConsumidaMl] = useState(1800);
  const metaAguaMl = 2500;

  useEffect(() => {
    const syncData = () => {
      setPresupuesto(relationalStore.getPresupuestoSemanal('pac_001'));
      setPauta(relationalStore.getPautaActiva('pac_001'));
      setPaciente(relationalStore.getPaciente('pac_001'));
      setRegistros(relationalStore.getHistorialRegistros('pac_001'));
    };

    const unsubscribe = relationalStore.subscribe(syncData);
    return () => unsubscribe();
  }, []);

  const agregarAgua = () => {
    setAguaConsumidaMl((prev) => Math.min(4000, prev + 250));
  };

  // Datos de Macronutrientes del Día
  const macros = [
    {
      id: 'protein',
      label: 'Proteínas',
      current: 118,
      target: pauta?.macros_objetivo?.proteinas_g || 150,
      unit: 'g',
      pct: 79,
      color: '#10B981', // Verde Esmeralda
      bgColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
      icon: 'fitness-outline',
      description: 'Preservación de masa magra y saciedad prolongada',
    },
    {
      id: 'carbs',
      label: 'Carbohidratos',
      current: 145,
      target: pauta?.macros_objetivo?.carbohidratos_g || 200,
      unit: 'g',
      pct: 72,
      color: '#38BDF8', // Azul Cielo
      bgColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#F0F9FF',
      icon: 'flash-outline',
      description: 'Energía glucolítica de asimilación gradual',
    },
    {
      id: 'fats',
      label: 'Grasas Saludables',
      current: 48,
      target: pauta?.macros_objetivo?.grasas_g || 65,
      unit: 'g',
      pct: 74,
      color: '#F59E0B', // Ámbar
      bgColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
      icon: 'water-outline',
      description: 'Soporte hormonal y absorción de vitaminas lipídicas',
    },
  ];

  // Desglose de Comidas del Día (Pauta vs Real)
  const comidasDelDia = [
    {
      id: 'desayuno',
      nombre: 'Desayuno',
      hora: '08:30 AM',
      kcalPauta: 450,
      kcalReal: 420,
      estado: 'en_pauta',
      estadoLabel: 'En Pauta',
      estadoColor: '#10B981',
      detalle: 'Marraqueta tostada con palta hass (100g) + Café sin azúcar',
      icono: 'sunny-outline',
    },
    {
      id: 'colacion_am',
      nombre: 'Colación Mañana',
      hora: '11:15 AM',
      kcalPauta: 200,
      kcalReal: 180,
      estado: 'sustitucion_grafo',
      estadoLabel: 'Reemplazo del Grafo',
      estadoColor: '#10B981',
      detalle: 'Yogurt Griego natural con 1 taza de berries (Ahorro: 320 kcal vs Helado)',
      icono: 'leaf-outline',
    },
    {
      id: 'almuerzo',
      nombre: 'Almuerzo Social',
      hora: '02:00 PM',
      kcalPauta: 650,
      kcalReal: 640,
      estado: 'en_pauta',
      estadoLabel: 'En Pauta',
      estadoColor: '#10B981',
      detalle: 'Pechuga a la plancha (150g), quinoa cocida y mix verde con oliva',
      icono: 'restaurant-outline',
    },
    {
      id: 'cena',
      nombre: 'Cena Programada',
      hora: '08:30 PM',
      kcalPauta: 575,
      kcalReal: 575,
      estado: 'proyectada',
      estadoLabel: 'Cuota Disponible',
      estadoColor: '#38BDF8',
      detalle: 'Tortilla de espinacas al horno con ensalada de tomate cherry y quesillo',
      icono: 'moon-outline',
    },
  ];

  const pctAgua = Math.min(100, Math.round((aguaConsumidaMl / metaAguaMl) * 100));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.webContainer}>
        {/* Cabecera */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Nutrición & Rendimiento</Text>
            <Text style={[styles.headerSubtitle, { color: theme.primaryDark }]}>
              Bioquímica Alimentaria · {paciente?.nombre || 'Mati'}
            </Text>
          </View>
          <View style={[styles.badgeLive, { backgroundColor: theme.primaryLight }]}>
            <View style={[styles.dotLive, { backgroundColor: theme.primary }]} />
            <Text style={[styles.textLive, { color: theme.primaryDark }]}>En Tiempo Real</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 1. Cumplimiento de Macronutrientes del Día */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Cumplimiento de Macronutrientes</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>Objetivos diarios de pauta</Text>
          </View>

          <View style={styles.macrosGrid}>
            {macros.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.macroCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.macroCardTop}>
                  <View style={[styles.macroIconCircle, { backgroundColor: m.bgColor }]}>
                    <Ionicons name={m.icon} size={18} color={m.color} />
                  </View>
                  <View style={[styles.macroPctPill, { backgroundColor: m.bgColor }]}>
                    <Text style={[styles.macroPctText, { color: m.color }]}>{m.pct}%</Text>
                  </View>
                </View>

                <Text style={[styles.macroLabel, { color: theme.textMuted }]}>{m.label}</Text>
                <View style={styles.macroValueRow}>
                  <Text style={[styles.macroCurrentVal, { color: theme.text }]}>
                    {m.current}
                    <Text style={[styles.macroUnitText, { color: theme.textMuted }]}> {m.unit}</Text>
                  </Text>
                  <Text style={[styles.macroTargetVal, { color: theme.textMuted }]}>
                    / {m.target} {m.unit}
                  </Text>
                </View>

                {/* Barra Nativa de Progreso de Macro */}
                <View style={[styles.macroTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}>
                  <View
                    style={[
                      styles.macroFill,
                      {
                        width: `${m.pct}%`,
                        backgroundColor: m.color,
                      },
                    ]}
                  />
                </View>

                <Text style={[styles.macroDesc, { color: theme.textMuted }]}>{m.description}</Text>
              </View>
            ))}
          </View>

          {/* 2. Control de Azúcares e Índice Glucémico */}
          <View style={[styles.cardHighlight, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.cardHighlightHeader}>
              <View style={[styles.iconBoxSugar, { backgroundColor: 'rgba(249, 115, 22, 0.12)' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#F97316" />
              </View>
              <View style={styles.flex}>
                <View style={styles.sugarTitleRow}>
                  <Text style={[styles.sugarTitle, { color: theme.text }]}>
                    Control de Azúcares Añadidos
                  </Text>
                  {/* Semáforo Visual */}
                  <View style={[styles.semaforoPill, { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}>
                    <View style={[styles.semaforoDot, { backgroundColor: '#10B981' }]} />
                    <Text style={[styles.semaforoText, { color: '#047857' }]}>ÓPTIMO</Text>
                  </View>
                </View>
                <Text style={[styles.sugarSubtitle, { color: theme.textMuted }]}>
                  Recomendación OMS: &lt; 25g/día
                </Text>
              </View>
            </View>

            {/* Medidor de Azúcares */}
            <View style={styles.sugarMetricBox}>
              <View style={styles.sugarValRow}>
                <Text style={[styles.sugarValBig, { color: theme.text }]}>
                  18g{' '}
                  <Text style={[styles.sugarValTarget, { color: theme.textMuted }]}>
                    / 25g máx
                  </Text>
                </Text>
                <Text style={[styles.sugarMarginText, { color: '#10B981' }]}>
                  Margen seguro: 7g restantes
                </Text>
              </View>

              <View style={[styles.sugarBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}>
                <View style={[styles.sugarBarFill, { width: '72%', backgroundColor: '#10B981' }]} />
              </View>
            </View>

            {/* Impacto del Grafo de Conocimiento */}
            <View style={[styles.graphImpactCard, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4', borderColor: '#10B981' }]}>
              <Ionicons name="sparkles" size={16} color="#10B981" />
              <Text style={[styles.graphImpactText, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
                <Text style={{ fontWeight: '800' }}>Impacto del Grafo:</Text> Ahorraste 24g de azúcar refinada al sustituir Helado por Yogurt Griego & Berries.
              </Text>
            </View>
          </View>

          {/* 3. Micronutrientes y Saciedad (Fibra, Sodio, Hidratación) */}
          <Text style={[styles.sectionTitle, { color: theme.text, marginTop: SPACING.md }]}>
            Micronutrientes & Hidratación
          </Text>

          <View style={[styles.microCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Fibra */}
            <View style={styles.microItem}>
              <View style={styles.microHeaderRow}>
                <View style={styles.microLabelGroup}>
                  <Ionicons name="nutrition-outline" size={16} color={theme.primary} />
                  <Text style={[styles.microLabel, { color: theme.text }]}>Fibra Dietética</Text>
                </View>
                <Text style={[styles.microValue, { color: theme.text }]}>
                  22g <Text style={{ color: theme.textMuted, fontSize: 11 }}>/ 30g</Text>
                </Text>
              </View>
              <View style={[styles.microTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}>
                <View style={[styles.microFill, { width: '73%', backgroundColor: theme.primary }]} />
              </View>
            </View>

            {/* Sodio */}
            <View style={styles.microItem}>
              <View style={styles.microHeaderRow}>
                <View style={styles.microLabelGroup}>
                  <Ionicons name="speedometer-outline" size={16} color="#38BDF8" />
                  <Text style={[styles.microLabel, { color: theme.text }]}>Sodio Controlado</Text>
                </View>
                <Text style={[styles.microValue, { color: theme.text }]}>
                  1,450mg <Text style={{ color: theme.textMuted, fontSize: 11 }}>/ 2,000mg</Text>
                </Text>
              </View>
              <View style={[styles.microTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}>
                <View style={[styles.microFill, { width: '72%', backgroundColor: '#38BDF8' }]} />
              </View>
            </View>

            {/* Hidratación Diaria Interactiva */}
            <View style={[styles.waterBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.08)' : '#F0F9FF', borderColor: '#38BDF8' }]}>
              <View style={styles.waterHeaderRow}>
                <View style={styles.waterLabelGroup}>
                  <Ionicons name="water" size={18} color="#0284C7" />
                  <View>
                    <Text style={[styles.waterTitle, { color: theme.text }]}>Hidratación Celular</Text>
                    <Text style={[styles.waterSub, { color: theme.textMuted }]}>
                      {(aguaConsumidaMl / 1000).toFixed(1)}L de {(metaAguaMl / 1000).toFixed(1)}L ({pctAgua}%)
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.addWaterBtn, { backgroundColor: '#38BDF8' }]}
                  onPress={agregarAgua}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.addWaterBtnText}>+250 ml</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.waterTrack, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
                <View style={[styles.waterFill, { width: `${pctAgua}%`, backgroundColor: '#38BDF8' }]} />
              </View>
            </View>
          </View>

          {/* 4. Desglose por Comidas del Día (Pauta vs Real) */}
          <Text style={[styles.sectionTitle, { color: theme.text, marginTop: SPACING.md }]}>
            Desglose por Comidas del Día
          </Text>

          <View style={styles.comidasList}>
            {comidasDelDia.map((c) => (
              <View
                key={c.id}
                style={[
                  styles.comidaCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.comidaHeaderRow}>
                  <View style={styles.comidaTitleGroup}>
                    <View style={[styles.comidaIconCircle, { backgroundColor: theme.borderLight }]}>
                      <Ionicons name={c.icono} size={16} color={theme.text} />
                    </View>
                    <View>
                      <Text style={[styles.comidaNombre, { color: theme.text }]}>{c.nombre}</Text>
                      <Text style={[styles.comidaHora, { color: theme.textMuted }]}>{c.hora}</Text>
                    </View>
                  </View>

                  <View style={[styles.comidaBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
                    <Text style={[styles.comidaBadgeText, { color: c.estadoColor }]}>
                      {c.estadoLabel}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.comidaDetalle, { color: theme.textMuted }]}>{c.detalle}</Text>

                <View style={[styles.comidaKcalFooter, { borderTopColor: theme.border }]}>
                  <Text style={[styles.comidaKcalText, { color: theme.text }]}>
                    Consumo: <Text style={{ fontWeight: '800' }}>{c.kcalReal} kcal</Text>
                  </Text>
                  <Text style={[styles.comidaPautaText, { color: theme.textMuted }]}>
                    Pauta objetivo: {c.kcalPauta} kcal
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  flex: {
    flex: 1,
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
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  badgeLive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  dotLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  textLive: {
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  sectionHeaderRow: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  macrosGrid: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  macroCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.soft,
  },
  macroCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  macroIconCircle: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroPctPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  macroPctText: {
    fontSize: 11,
    fontWeight: '800',
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  macroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
    marginBottom: 6,
  },
  macroCurrentVal: {
    fontSize: 20,
    fontWeight: '900',
  },
  macroUnitText: {
    fontSize: 13,
    fontWeight: '600',
  },
  macroTargetVal: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  macroTrack: {
    height: 6,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: 6,
  },
  macroFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  macroDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  cardHighlight: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    ...SHADOWS.soft,
  },
  cardHighlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  iconBoxSugar: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sugarTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sugarTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  sugarSubtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  semaforoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 4,
  },
  semaforoDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  semaforoText: {
    fontSize: 9,
    fontWeight: '800',
  },
  sugarMetricBox: {
    marginBottom: SPACING.sm,
  },
  sugarValRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  sugarValBig: {
    fontSize: 18,
    fontWeight: '900',
  },
  sugarValTarget: {
    fontSize: 12,
    fontWeight: '600',
  },
  sugarMarginText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sugarBarTrack: {
    height: 6,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  sugarBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  graphImpactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 6,
  },
  graphImpactText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  microCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.md,
    ...SHADOWS.soft,
  },
  microItem: {},
  microHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  microLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  microLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  microValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  microTrack: {
    height: 5,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  microFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  waterBox: {
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  waterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  waterLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waterTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  waterSub: {
    fontSize: 10,
  },
  addWaterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 3,
  },
  addWaterBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  waterTrack: {
    height: 6,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  waterFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  comidasList: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  comidaCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.soft,
  },
  comidaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  comidaTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  comidaIconCircle: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comidaNombre: {
    fontSize: 13,
    fontWeight: '800',
  },
  comidaHora: {
    fontSize: 10,
  },
  comidaBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  comidaBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  comidaDetalle: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
  },
  comidaKcalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
  },
  comidaKcalText: {
    fontSize: 11,
  },
  comidaPautaText: {
    fontSize: 11,
  },
});
