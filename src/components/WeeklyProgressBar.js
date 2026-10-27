import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, SHADOWS } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function WeeklyProgressBar({
  presupuestoSemanal = 14000,
  caloriasConsumidasBase = 7200,
  caloriasDesviacion = 500,
  diaActual = 4,
  diasTotales = 7,
  caloriasConsumidasHoy = 1240,
  cuotaDiariaRecalculada = 1875,
  caloriasBaseDiaria = 2000,
}) {
  const { theme, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);

  // Cálculos DIARIOS (Foco Principal)
  const caloriasRestantesHoy = Math.max(0, cuotaDiariaRecalculada - caloriasConsumidasHoy);
  const pctDia = Math.min(100, Math.round((caloriasConsumidasHoy / cuotaDiariaRecalculada) * 100));
  const diferenciaCuotaBase = cuotaDiariaRecalculada - caloriasBaseDiaria; // Ej: -125 kcal

  // Cálculos SEMANALES (Sub-Tarjeta Compacta)
  const totalSemanaConDesviacion = caloriasConsumidasBase + caloriasDesviacion;
  const pctSemanaBase = Math.min(100, Math.round((caloriasConsumidasBase / presupuestoSemanal) * 100));
  const pctSemanaDesviacion = Math.min(
    100 - pctSemanaBase,
    Math.round((caloriasDesviacion / presupuestoSemanal) * 100)
  );
  const caloriasRestantesSemana = Math.max(0, presupuestoSemanal - totalSemanaConDesviacion);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      {/* 1. Fila Superior: Título y Toggle Expandir */}
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <View style={[styles.cycleBadge, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="flame" size={13} color={theme.primaryDark} />
            <Text style={[styles.cycleText, { color: theme.primaryDark }]}>
              META DIARIA AJUSTADA · HOY
            </Text>
          </View>

          <View style={[styles.dayIndicator, { backgroundColor: theme.borderLight }]}>
            <Text style={[styles.dayIndicatorText, { color: theme.textMuted }]}>
              Día {diaActual} de {diasTotales}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.infoButton, { backgroundColor: expanded ? theme.primaryLight : theme.borderLight }]} 
          onPress={toggleExpand}
          activeOpacity={0.7}
        >
          <Text style={[styles.infoButtonText, { color: expanded ? theme.primaryDark : theme.textMuted }]}>
            {expanded ? 'Ocultar balance' : 'Ver balance semanal'}
          </Text>
          <Ionicons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={13} 
            color={expanded ? theme.primaryDark : theme.textMuted} 
          />
        </TouchableOpacity>
      </View>

      {/* 2. Cifra Grande Principal: Calorías de Hoy vs Cuota Diaria */}
      <View style={styles.metricsRow}>
        <View style={styles.kcalNumbersCol}>
          <View style={styles.mainNumberRow}>
            <Text style={[styles.boldValue, { color: theme.text }]}>
              {caloriasConsumidasHoy.toLocaleString()}
            </Text>
            <Text style={[styles.totalValue, { color: theme.textMuted }]}>
              {' '}/ {cuotaDiariaRecalculada.toLocaleString()} kcal
            </Text>
          </View>
          <Text style={[styles.metricSubtitle, { color: theme.textMuted }]}>
            Consumo acumulado hoy (desayuno, colación, etc.)
          </Text>
        </View>

        {/* Píldora Sutil de Compensación */}
        <View style={[styles.pillCompensacion, { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.15)' : '#FFF7ED', borderColor: theme.accent }]}>
          <View style={[styles.pillDot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.pillCompensacionText, { color: theme.accentDark }]}>
            Base: {caloriasBaseDiaria} kcal {diferenciaCuotaBase < 0 ? `| ${diferenciaCuotaBase} kcal` : ''}
          </Text>
        </View>
      </View>

      {/* 3. Barra de Progreso Principal (Avance del Día) */}
      <View style={[styles.progressBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
        <View 
          style={[
            styles.progressSegmentDaily, 
            { 
              backgroundColor: pctDia > 100 ? theme.accent : theme.primary, 
              width: `${Math.min(100, Math.max(6, pctDia))}%` 
            }
          ]} 
        />
      </View>

      {/* 4. Leyenda de Hoy: Quedan X kcal para hoy */}
      <View style={styles.legendRow}>
        <View style={styles.legendLeft}>
          <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
          <Text style={[styles.legendText, { color: theme.textMuted }]}>
            Progreso diario ({pctDia}%)
          </Text>
        </View>

        <View style={styles.remainingPill}>
          <Ionicons name="sparkles-outline" size={13} color={theme.primaryDark} />
          <Text style={[styles.remainingText, { color: theme.primaryDark }]}>
            Quedan {caloriasRestantesHoy.toLocaleString()} kcal para hoy
          </Text>
        </View>
      </View>

      {/* 5. Sub-Tarjeta Desplegable: Acumulado Semanal y Micro-Chips de Macros del Día */}
      {expanded && (
        <View style={[styles.expandedCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Cabecera Semanal */}
          <View style={styles.weeklyHeaderRow}>
            <View style={styles.weeklyTitleCol}>
              <Text style={[styles.weeklyTitle, { color: theme.text }]}>
                Presupuesto Semanal Dinámico
              </Text>
              <Text style={[styles.weeklySub, { color: theme.textMuted }]}>
                {totalSemanaConDesviacion.toLocaleString()} / {presupuestoSemanal.toLocaleString()} kcal ({pctSemanaBase}%)
              </Text>
            </View>

            {caloriasDesviacion > 0 && (
              <View style={[styles.amortBadge, { backgroundColor: theme.accentLight }]}>
                <Ionicons name="sync" size={11} color={theme.accentDark} />
                <Text style={[styles.amortBadgeText, { color: theme.accentDark }]}>
                  +{caloriasDesviacion} amortizándose
                </Text>
              </View>
            )}
          </View>

          {/* Mini Barra Semanal */}
          <View style={[styles.miniBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}>
            <View 
              style={[
                styles.miniBarBase, 
                { backgroundColor: theme.primary, width: `${pctSemanaBase}%` }
              ]} 
            />
            {caloriasDesviacion > 0 && (
              <View 
                style={[
                  styles.miniBarDev, 
                  { backgroundColor: theme.accent, width: `${Math.max(3, pctSemanaDesviacion)}%` }
                ]} 
              />
            )}
          </View>

          {/* Micro-Chips Rápidos de Macros del Día */}
          <Text style={[styles.macrosSectionTitle, { color: theme.textMuted }]}>
            MACROS ACUMULADOS HOY
          </Text>
          <View style={styles.macroChipsRow}>
            {/* Proteína */}
            <View style={[styles.macroChip, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5', borderColor: '#10B981' }]}>
              <View style={styles.macroChipHeader}>
                <View style={[styles.macroDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.macroChipName, { color: '#047857' }]}>Proteína</Text>
              </View>
              <Text style={[styles.macroChipValue, { color: theme.text }]}>98 / 150g</Text>
              <View style={[styles.macroBarBg, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <View style={[styles.macroBarFill, { backgroundColor: '#10B981', width: '65%' }]} />
              </View>
            </View>

            {/* Carbohidratos */}
            <View style={[styles.macroChip, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#F0F9FF', borderColor: '#38BDF8' }]}>
              <View style={styles.macroChipHeader}>
                <View style={[styles.macroDot, { backgroundColor: '#38BDF8' }]} />
                <Text style={[styles.macroChipName, { color: '#0284C7' }]}>Carbs</Text>
              </View>
              <Text style={[styles.macroChipValue, { color: theme.text }]}>130 / 200g</Text>
              <View style={[styles.macroBarBg, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
                <View style={[styles.macroBarFill, { backgroundColor: '#38BDF8', width: '65%' }]} />
              </View>
            </View>

            {/* Grasas Saludables */}
            <View style={[styles.macroChip, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB', borderColor: '#F59E0B' }]}>
              <View style={styles.macroChipHeader}>
                <View style={[styles.macroDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={[styles.macroChipName, { color: '#B45309' }]}>Grasas</Text>
              </View>
              <Text style={[styles.macroChipValue, { color: theme.text }]}>42 / 65g</Text>
              <View style={[styles.macroBarBg, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <View style={[styles.macroBarFill, { backgroundColor: '#F59E0B', width: '64%' }]} />
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md + 2,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  cycleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  cycleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  dayIndicator: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  dayIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  infoButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 2,
    marginBottom: SPACING.xs,
  },
  kcalNumbersCol: {
    flex: 1,
  },
  mainNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  boldValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  metricSubtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  pillCompensacion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 4,
    marginTop: 2,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillCompensacionText: {
    fontSize: 10,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 9,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 6,
  },
  progressSegmentDaily: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },
  remainingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  remainingText: {
    fontSize: 11,
    fontWeight: '800',
  },
  expandedCard: {
    marginTop: SPACING.sm + 2,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.soft,
  },
  weeklyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  weeklyTitleCol: {
    flex: 1,
  },
  weeklyTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  weeklySub: {
    fontSize: 10,
    marginTop: 1,
  },
  amortBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  amortBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  miniBarTrack: {
    height: 6,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  miniBarBase: {
    height: '100%',
  },
  miniBarDev: {
    height: '100%',
  },
  macrosSectionTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  macroChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  macroChip: {
    flex: 1,
    padding: 7,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  macroChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroChipName: {
    fontSize: 10,
    fontWeight: '700',
  },
  macroChipValue: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  macroBarBg: {
    height: 4,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
});
