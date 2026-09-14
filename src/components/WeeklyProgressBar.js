import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, SHADOWS } from '../constants/theme';

export default function WeeklyProgressBar({
  presupuestoSemanal = 14000,
  caloriasConsumidasBase = 7200,
  caloriasDesviacion = 500,
  diaActual = 4,
  diasTotales = 7,
}) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);

  // Cálculos porcentuales para los segmentos de la barra
  const totalConDesviacion = caloriasConsumidasBase + caloriasDesviacion;
  const pctBase = Math.min(100, Math.round((caloriasConsumidasBase / presupuestoSemanal) * 100));
  const pctDesviacion = Math.min(
    100 - pctBase,
    Math.round((caloriasDesviacion / presupuestoSemanal) * 100)
  );
  const caloriasRestantes = Math.max(0, presupuestoSemanal - totalConDesviacion);

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      {/* Fila Superior: Título del Ciclo y Botón de Estado */}
      <View style={styles.topRow}>
        <View style={[styles.cycleBadge, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="calendar-outline" size={14} color={theme.primaryDark} />
          <Text style={[styles.cycleText, { color: theme.primaryDark }]}>
            Día {diaActual} de {diasTotales} · Ciclo Semanal
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.infoButton} 
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Text style={[styles.infoButtonText, { color: theme.textMuted }]}>
            {expanded ? 'Ocultar' : 'Ver balance'}
          </Text>
          <Ionicons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={14} 
            color={theme.textMuted} 
          />
        </TouchableOpacity>
      </View>

      {/* Métricas Principales de Calorías */}
      <View style={styles.metricsRow}>
        <View>
          <Text style={[styles.metricTitle, { color: theme.textMuted }]}>Presupuesto Semanal Dinámico</Text>
          <Text style={styles.metricValue}>
            <Text style={[styles.boldValue, { color: theme.text }]}>{totalConDesviacion.toLocaleString()}</Text>
            <Text style={[styles.totalValue, { color: theme.textMuted }]}> / {presupuestoSemanal.toLocaleString()} kcal</Text>
          </Text>
        </View>

        {caloriasDesviacion > 0 && (
          <View style={[styles.deviationBadge, { backgroundColor: theme.accentLight }]}>
            <View style={[styles.deviationDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.deviationBadgeText, { color: theme.accentDark }]}>
              +{caloriasDesviacion} kcal amortizándose
            </Text>
          </View>
        )}
      </View>

      {/* Barra de Progreso Multi-Segmento */}
      <View style={[styles.progressBarTrack, { backgroundColor: theme.border }]}>
        {/* Segmento 1: Calorías consumidas habituales (Verde Menta) */}
        <View 
          style={[
            styles.progressSegmentBase, 
            { backgroundColor: theme.primary, width: `${pctBase}%` },
            pctDesviacion === 0 && styles.singleSegmentRounded
          ]} 
        />
        
        {/* Segmento 2: Calorías de desviación o recalibración (Naranja Coral) */}
        {caloriasDesviacion > 0 && (
          <View 
            style={[
              styles.progressSegmentDeviation, 
              { backgroundColor: theme.accent, width: `${Math.max(4, pctDesviacion)}%` }
            ]} 
          />
        )}
      </View>

      {/* Leyenda y porcentaje restante */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
          <Text style={[styles.legendText, { color: theme.textMuted }]}>En plan ({pctBase}%)</Text>
        </View>

        {caloriasDesviacion > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.legendText, { color: theme.accentDark, fontWeight: '700' }]}>
              Compensación
            </Text>
          </View>
        )}

        <View style={styles.legendItem}>
          <Text style={[styles.remainingText, { color: theme.text }]}>
            Quedan {caloriasRestantes.toLocaleString()} kcal
          </Text>
        </View>
      </View>

      {/* Panel Desplegable con detalle psicológico y clínico */}
      {expanded && (
        <View style={[styles.expandedPanel, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={styles.expandedRow}>
            <Ionicons name="shield-checkmark" size={18} color={theme.primary} />
            <Text style={[styles.expandedText, { color: theme.text }]}>
              Tu meta sigue 100% intacta. El exceso de{' '}
              <Text style={{ fontWeight: '700', color: theme.accent }}>
                {caloriasDesviacion} kcal
              </Text>{' '}
              se distribuyó en los días restantes sin pasar hambre (déficit seguro &lt;20% TMB).
            </Text>
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    ...SHADOWS.soft,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
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
    fontSize: 12,
    fontWeight: '600',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 2,
  },
  infoButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginVertical: SPACING.xs,
  },
  metricTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  metricValue: {
    marginTop: 2,
  },
  boldValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  deviationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    gap: 5,
  },
  deviationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  deviationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 10,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  progressSegmentBase: {
    height: '100%',
    borderTopLeftRadius: RADIUS.full,
    borderBottomLeftRadius: RADIUS.full,
  },
  progressSegmentDeviation: {
    height: '100%',
    borderTopRightRadius: RADIUS.full,
    borderBottomRightRadius: RADIUS.full,
  },
  singleSegmentRounded: {
    borderTopRightRadius: RADIUS.full,
    borderBottomRightRadius: RADIUS.full,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
  },
  remainingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandedPanel: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  expandedText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});
