import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SuggestedReply } from '../state/types';
import { colors, spacing } from '../theme';

interface SuggestionChipProps {
  suggestion: SuggestedReply;
  onPress: (suggestion: SuggestedReply) => void;
  index: number;
  disabled?: boolean;
}

const typeEmoji: Record<string, string> = {
  objection: '⚡',
  evidence: '📋',
  dramatic: '🔥',
  strategic: '🎯',
  surrender: '🏳️',
};

export function SuggestionChip({ suggestion, onPress, index, disabled }: SuggestionChipProps) {
  const isSurrender = suggestion.variant === 'surrender';

  return (
    <Animated.View entering={FadeIn.delay(index * 80).duration(300)}>
      <Pressable
        onPress={() => onPress(suggestion)}
        disabled={disabled}
        style={({ pressed }) => [
          styles.chip,
          isSurrender ? styles.surrenderChip : styles.defaultChip,
          pressed && (isSurrender ? styles.surrenderPressed : styles.defaultPressed),
          disabled && styles.disabledChip,
        ]}
      >
        <Text style={styles.emoji}>{typeEmoji[suggestion.type] ?? '💬'}</Text>
        <Text
          style={[
            styles.chipText,
            isSurrender ? styles.surrenderText : styles.defaultText,
          ]}
          numberOfLines={3}
        >
          {suggestion.text}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 260,
    minWidth: 140,
  },
  defaultChip: {
    backgroundColor: colors.chipDefault,
    borderColor: colors.chipBorder,
  },
  surrenderChip: {
    backgroundColor: colors.chipSurrender,
    borderColor: '#b91c1c',
  },
  defaultPressed: {
    backgroundColor: '#3a3a5a',
    transform: [{ scale: 0.96 }],
  },
  surrenderPressed: {
    backgroundColor: '#b91c1c',
    transform: [{ scale: 0.96 }],
  },
  disabledChip: {
    opacity: 0.5,
  },
  emoji: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  defaultText: {
    color: colors.chipText,
  },
  surrenderText: {
    color: colors.chipSurrenderText,
  },
});
