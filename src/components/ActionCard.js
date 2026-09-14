import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, SHADOWS } from '../constants/theme';

/**
 * Tarjeta de Acción 1: Sugerencia de Reemplazo Inteligente
 * Renderiza una comparación visual entre el alimento deseado y la alternativa inteligente
 */
export function FoodReplacementCard({
  alimentoOriginal = 'Helado de Crema',
  caloriasOriginal = 500,
  alimentoSugerido = 'Yogurt Griego & Berries',
  caloriasSugerido = 180,
  porcion = '1 porción mediana (180g)',
  tags = ['Alto en Proteína', 'Antojo Dulce', 'Cremoso'],
  ahorroKcal = 320,
  onSelectReplacement,
  onKeepOriginal,
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Header de la tarjeta */}
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.sparkleIconWrapper, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="sparkles" size={16} color={theme.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Alternativa Inteligente Sugerida</Text>
        </View>
        <View style={[styles.savingsBadge, { backgroundColor: theme.primaryLight }]}>
          <Text style={[styles.savingsBadgeText, { color: theme.primaryDark }]}>Ahorras {ahorroKcal} kcal</Text>
        </View>
      </View>

      {/* Comparador Visual */}
      <View style={[styles.comparisonRow, { backgroundColor: theme.background }]}>
        {/* Lado A: Original */}
        <View style={styles.foodColumn}>
          <View style={[styles.foodIconCircle, { backgroundColor: theme.accentLight }]}>
            <Ionicons name="ice-cream-outline" size={24} color={theme.accentDark} />
          </View>
          <Text style={[styles.foodName, { color: theme.text }]} numberOfLines={2}>{alimentoOriginal}</Text>
          <Text style={[styles.foodCaloriesAccent, { color: theme.accent }]}>{caloriasOriginal} kcal</Text>
          <Text style={[styles.foodLabel, { color: theme.textMuted }]}>Original</Text>
        </View>

        {/* Flecha Central de Reemplazo */}
        <View style={styles.arrowContainer}>
          <View style={[styles.arrowCircle, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="arrow-forward" size={16} color={theme.primaryDark} />
          </View>
        </View>

        {/* Lado B: Sugerido */}
        <View style={[styles.foodColumn, styles.suggestedColumn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.foodIconCircle, { backgroundColor: theme.primaryLight }]}>
            <MaterialCommunityIcons name="fruit-cherries" size={24} color={theme.primaryDark} />
          </View>
          <Text style={[styles.foodName, { color: theme.text }]} numberOfLines={2}>{alimentoSugerido}</Text>
          <Text style={[styles.foodCaloriesPrimary, { color: theme.primary }]}>{caloriasSugerido} kcal</Text>
          <Text style={[styles.foodLabel, { color: theme.primaryDark, fontWeight: '700' }]}>
            Sugerencia
          </Text>
        </View>
      </View>

      {/* Porción y Tags */}
      <View style={styles.detailsContainer}>
        <View style={styles.portionRow}>
          <Ionicons name="restaurant-outline" size={13} color={theme.textMuted} />
          <Text style={[styles.portionText, { color: theme.textMuted }]}>{porcion}</Text>
        </View>

        <View style={styles.tagsRow}>
          {tags.map((tag, idx) => (
            <View key={idx} style={[styles.tagBadge, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.tagText, { color: theme.textMuted }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Botones de Acción */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={onSelectReplacement}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Elegir este reemplazo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onKeepOriginal}
          activeOpacity={0.7}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.textMuted }]}>
            Comer original y compensar semana
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Tarjeta de Acción 2: Confirmación de Recalibración Semanal Dinámica
 */
export function CompensationSummaryCard({
  caloriasExceso = 500,
  diasRestantes = 4,
  reduccionDiaria = 125,
  onConfirmCompensation,
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.cardContainer, styles.compensationBorder, { backgroundColor: theme.card, borderColor: theme.accentLight }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.sparkleIconWrapper, { backgroundColor: theme.accentLight }]}>
            <Ionicons name="sync-outline" size={16} color={theme.accent} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Recalibración de Presupuesto</Text>
        </View>
        <View style={[styles.savingsBadge, { backgroundColor: theme.accentLight }]}>
          <Text style={[styles.savingsBadgeText, { color: theme.accentDark }]}>
            +{caloriasExceso} kcal
          </Text>
        </View>
      </View>

      {/* Explicación de la distribución */}
      <View style={[styles.compensationBody, { backgroundColor: theme.background }]}>
        <Text style={[styles.compensationTitle, { color: theme.text }]}>
          ¡Disfrutado y resuelto! Tu semana lo absorbe así:
        </Text>

        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownNumber, { color: theme.text }]}>{diasRestantes}</Text>
            <Text style={[styles.breakdownLabel, { color: theme.textMuted }]}>Días restantes</Text>
          </View>
          <View style={[styles.breakdownDivider, { backgroundColor: theme.border }]} />
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownNumber, { color: theme.accent }]}>
              -{reduccionDiaria}
            </Text>
            <Text style={[styles.breakdownLabel, { color: theme.textMuted }]}>kcal / día</Text>
          </View>
          <View style={[styles.breakdownDivider, { backgroundColor: theme.border }]} />
          <View style={styles.breakdownItem}>
            <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
            <Text style={[styles.breakdownLabel, { color: theme.textMuted }]}>Déficit Seguro (&lt;20% TMB)</Text>
          </View>
        </View>
      </View>

      {/* Botón de Aceptación */}
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: theme.isDark ? theme.border : theme.secondary }]}
        onPress={onConfirmCompensation}
        activeOpacity={0.85}
      >
        <Ionicons name="flash-outline" size={16} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>Aceptar ajuste en mi presupuesto</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    ...SHADOWS.card,
  },
  compensationBorder: {
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sparkleIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  savingsBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  savingsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  foodColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  suggestedColumn: {
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  foodIconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  foodName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    minHeight: 28,
  },
  foodCaloriesAccent: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  foodCaloriesPrimary: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  foodLabel: {
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  arrowContainer: {
    paddingHorizontal: 6,
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    marginBottom: SPACING.md,
    gap: 6,
  },
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  portionText: {
    fontSize: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionsContainer: {
    gap: SPACING.xs,
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: SPACING.xs + 2,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  compensationBody: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  compensationTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  breakdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  breakdownItem: {
    alignItems: 'center',
    flex: 1,
  },
  breakdownDivider: {
    width: 1,
    height: 30,
  },
  breakdownNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  breakdownLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
});
