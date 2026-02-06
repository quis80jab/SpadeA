import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { SuggestionChip } from './SuggestionChip';
import { SuggestedReply } from '../state/types';
import { colors, spacing } from '../theme';

interface SuggestionCarouselProps {
  suggestions: SuggestedReply[];
  onSelect: (suggestion: SuggestedReply) => void;
  isLoading: boolean;
  disabled?: boolean;
}

function SkeletonChip({ index }: { index: number }) {
  return (
    <Animated.View
      entering={FadeIn.delay(index * 60).duration(200)}
      style={styles.skeleton}
    >
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '60%' }]} />
    </Animated.View>
  );
}

export function SuggestionCarousel({
  suggestions,
  onSelect,
  isLoading,
  disabled,
}: SuggestionCarouselProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Preparing your options...</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {[0, 1, 2, 3].map((i) => (
            <SkeletonChip key={i} index={i} />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={styles.container}
    >
      <Text style={styles.label}>Your response:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {suggestions.map((suggestion, idx) => (
          <SuggestionChip
            key={`${suggestion.text}-${idx}`}
            suggestion={suggestion}
            onPress={onSelect}
            index={idx}
            disabled={disabled}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  skeleton: {
    width: 180,
    height: 52,
    backgroundColor: colors.chipDefault,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    padding: spacing.md,
    justifyContent: 'center',
    gap: 6,
  },
  skeletonLine: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: '80%',
  },
});
