import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { FoodReplacementCard, CompensationSummaryCard } from './ActionCard';

export default function ChatMessage({
  message,
  onSelectReplacement,
  onKeepOriginal,
  onConfirmCompensation,
}) {
  const { theme } = useTheme();
  const isUser = message.sender === 'user';

  return (
    <View style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
      {/* Avatar del Bot en la izquierda */}
      {!isUser && (
        <View style={[styles.botAvatar, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
          <Ionicons name="nutrition" size={16} color={theme.primaryDark} />
        </View>
      )}

      <View style={[styles.messageBubbleContainer, isUser ? styles.userContainer : styles.botContainer]}>
        {/* Burbuja de Texto */}
        {message.text ? (
          <View
            style={[
              styles.bubble,
              isUser
                ? [styles.userBubble, { backgroundColor: theme.userBubble }]
                : [styles.botBubble, { backgroundColor: theme.botBubble, borderColor: theme.border }],
            ]}
          >
            <Text style={[styles.messageText, { color: isUser ? theme.userText : theme.botText }]}>
              {message.text}
            </Text>

            <View style={styles.metaRow}>
              <Text style={[styles.timestamp, { color: isUser ? 'rgba(255,255,255,0.7)' : theme.textMuted }]}>
                {message.time || '14:25'}
              </Text>
              {isUser && (
                <Ionicons name="checkmark-done" size={14} color="#A7F3D0" />
              )}
            </View>
          </View>
        ) : null}

        {/* Renderizado Condicional de Tarjetas de Acción del Bot */}
        {message.cardType === 'food_replacement' && (
          <FoodReplacementCard
            {...message.cardData}
            onSelectReplacement={() => onSelectReplacement?.(message.id, message.cardData)}
            onKeepOriginal={() => onKeepOriginal?.(message.id, message.cardData)}
          />
        )}

        {message.cardType === 'compensation_summary' && (
          <CompensationSummaryCard
            {...message.cardData}
            onConfirmCompensation={() => onConfirmCompensation?.(message.id, message.cardData)}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    marginVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.lg,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    marginBottom: 4,
    borderWidth: 1,
  },
  messageBubbleContainer: {
    maxWidth: '82%',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  botContainer: {
    alignItems: 'flex-start',
    flex: 1,
  },
  bubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    ...SHADOWS.soft,
  },
  userBubble: {
    borderBottomRightRadius: 2,
  },
  botBubble: {
    borderBottomLeftRadius: 2,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    fontSize: 10,
  },
});
