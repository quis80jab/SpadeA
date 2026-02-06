import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { colors, spacing } from '../theme';

export function TypingIndicator() {
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    const dur = 400;
    dot1.value = withRepeat(
      withSequence(withTiming(1, { duration: dur }), withTiming(0.3, { duration: dur })),
      -1,
      false
    );
    dot2.value = withDelay(
      150,
      withRepeat(
        withSequence(withTiming(1, { duration: dur }), withTiming(0.3, { duration: dur })),
        -1,
        false
      )
    );
    dot3.value = withDelay(
      300,
      withRepeat(
        withSequence(withTiming(1, { duration: dur }), withTiming(0.3, { duration: dur })),
        -1,
        false
      )
    );
  }, []);

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.container}>
      <Text style={styles.label}>⚔️ PROSECUTOR</Text>
      <View style={styles.bubble}>
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, dot1Style]} />
          <Animated.View style={[styles.dot, dot2Style]} />
          <Animated.View style={[styles.dot, dot3Style]} />
        </View>
        <Text style={styles.thinkingText}>Preparing argument...</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
    maxWidth: '70%',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.primary,
    marginBottom: 4,
  },
  bubble: {
    backgroundColor: colors.attorneyBubble,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(232, 213, 255, 0.1)',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.attorneyText,
  },
  thinkingText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
