import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - SPACING.lg * 2;

export default function DashboardScreen() {
  const { theme, isDark, toggleTheme } = useTheme();

  // Datos semanales (Lunes a Domingo)
  // Miércoles incluye la desviación (+500 kcal) que se compensó en Jue, Vie, Sáb, Dom
  const chartData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        data: [1950, 1980, 2500, 1875, 1875, 1875, 1875],
        color: (opacity = 1) => theme.primary,
        strokeWidth: 3,
      },
      {
        // Línea de meta diaria promedio (2,000 kcal)
        data: [2000, 2000, 2000, 2000, 2000, 2000, 2000],
        color: (opacity = 1) => isDark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(100, 116, 139, 0.4)',
        strokeWidth: 1.5,
        withDots: false,
      },
    ],
    legend: ['Consumo Real / Proyectado', 'Meta Promedio (2,000 kcal)'],
  };

  const chartConfig = {
    backgroundColor: theme.card,
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.primary,
    labelColor: (opacity = 1) => theme.textMuted,
    style: {
      borderRadius: RADIUS.lg,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: theme.card,
    },
    propsForBackgroundLines: {
      strokeDasharray: '4',
      stroke: theme.border,
      strokeWidth: 1,
    },
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Superior */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Resumen Semanal</Text>
          <Text style={[styles.headerSubtitle, { color: theme.primaryDark }]}>
            Presupuesto dinámico · Día 4 de 7
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
        {/* Banner de Estado Psicológico */}
        <View style={[styles.bannerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.bannerIconWrapper, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="shield-checkmark" size={22} color={theme.primary} />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={[styles.bannerTitle, { color: theme.text }]}>
              ¡Tu semana sigue en balance!
            </Text>
            <Text style={[styles.bannerDescription, { color: theme.textMuted }]}>
              El helado del miércoles (+500 kcal) ya fue distribuido equitativamente. Tu déficit se mantiene seguro (&lt;20% TMB).
            </Text>
          </View>
        </View>

        {/* Gráfico Principal: Consumo vs Meta */}
        <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.chartHeaderRow}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Calorías Lunes a Domingo
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>
                Línea punteada: Meta diaria (2,000 kcal)
              </Text>
            </View>

            <View style={[styles.deviationChip, { backgroundColor: theme.accentLight }]}>
              <View style={[styles.chipDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.deviationChipText, { color: theme.accentDark }]}>
                Mié: +500 kcal
              </Text>
            </View>
          </View>

          <LineChart
            data={chartData}
            width={CHART_WIDTH - SPACING.md * 2}
            height={210}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Sección de Tarjetas de Métricas Rápidas (KPIs) */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Métricas Clave</Text>

        <View style={styles.kpiGrid}>
          {/* KPI 1: Días en Plan */}
          <View style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.kpiHeaderRow}>
              <View style={[styles.kpiIconBox, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="checkmark-done" size={18} color={theme.primary} />
              </View>
              <View style={[styles.kpiTag, { backgroundColor: theme.primaryLight }]}>
                <Text style={[styles.kpiTagText, { color: theme.primaryDark }]}>71% Meta</Text>
              </View>
            </View>

            <Text style={[styles.kpiNumber, { color: theme.text }]}>5 / 7</Text>
            <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Días en Plan</Text>
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
                <Text style={[styles.kpiTagText, { color: theme.accentDark }]}>Amortizado</Text>
              </View>
            </View>

            <Text style={[styles.kpiNumber, { color: theme.accent }]}>+500 kcal</Text>
            <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Compensadas</Text>
            <Text style={[styles.kpiFooter, { color: theme.accentDark }]}>
              -125 kcal/día (4 días)
            </Text>
          </View>
        </View>

        {/* KPI 3: Distribución de Macros */}
        <View style={[styles.macroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.macroHeaderRow}>
            <View style={styles.macroTitleRow}>
              <Ionicons name="pie-chart-outline" size={18} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Distribución Semanal de Macros
              </Text>
            </View>
            <Text style={[styles.macroTotalCal, { color: theme.textMuted }]}>
              2,000 kcal / día prom.
            </Text>
          </View>

          {/* Barras de Macronutrientes */}
          <View style={styles.macroBarsContainer}>
            {/* Carbohidratos */}
            <View style={styles.macroRow}>
              <View style={styles.macroLabelRow}>
                <Text style={[styles.macroName, { color: theme.text }]}>Carbohidratos (45%)</Text>
                <Text style={[styles.macroGrams, { color: theme.textMuted }]}>225g / día</Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
                <View style={[styles.barFill, { width: '45%', backgroundColor: theme.primary }]} />
              </View>
            </View>

            {/* Proteínas */}
            <View style={styles.macroRow}>
              <View style={styles.macroLabelRow}>
                <Text style={[styles.macroName, { color: theme.text }]}>Proteínas (30%)</Text>
                <Text style={[styles.macroGrams, { color: theme.textMuted }]}>150g / día</Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
                <View style={[styles.barFill, { width: '30%', backgroundColor: theme.primaryDark }]} />
              </View>
            </View>

            {/* Grasas */}
            <View style={styles.macroRow}>
              <View style={styles.macroLabelRow}>
                <Text style={[styles.macroName, { color: theme.text }]}>Grasas Saludables (25%)</Text>
                <Text style={[styles.macroGrams, { color: theme.textMuted }]}>55g / día</Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
                <View style={[styles.barFill, { width: '25%', backgroundColor: theme.accent }]} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  bannerDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  chartCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
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
  chart: {
    marginVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
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
    fontSize: 20,
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
  macroCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  macroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  macroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroTotalCal: {
    fontSize: 11,
  },
  macroBarsContainer: {
    gap: SPACING.sm + 2,
  },
  macroRow: {
    gap: 4,
  },
  macroLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroName: {
    fontSize: 12,
    fontWeight: '600',
  },
  macroGrams: {
    fontSize: 11,
  },
  barTrack: {
    height: 8,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
