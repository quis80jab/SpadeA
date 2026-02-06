import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInUp,
  SlideInLeft,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useArgumentStore } from '../src/state/argumentStore';
import { colors, spacing, animation } from '../src/theme';

interface IntroLine {
  text: string;
  style: 'label' | 'title' | 'charge' | 'context' | 'tension';
  delay: number;
}

export default function CourtIntro() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { caseData, setPhase } = useArgumentStore();
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [done, setDone] = useState(false);

  const lines: IntroLine[] = caseData
    ? [
        { text: 'COURT IS NOW IN SESSION', style: 'label', delay: 0 },
        { text: caseData.title, style: 'title', delay: 800 },
        { text: caseData.charge, style: 'charge', delay: 1800 },
        { text: caseData.context, style: 'context', delay: 3000 },
        { text: `"${caseData.philosophical_tension}"`, style: 'tension', delay: 4500 },
      ]
    : [];

  useEffect(() => {
    if (!caseData) {
      router.replace('/');
      return;
    }

    // Reveal lines one by one
    lines.forEach((line, idx) => {
      setTimeout(() => {
        setVisibleLines((v) => Math.max(v, idx + 1));
        if (line.style === 'title') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
      }, line.delay);
    });

    // Navigate to chat after all lines shown
    const totalDelay = (lines[lines.length - 1]?.delay ?? 0) + 2500;
    const timer = setTimeout(() => {
      setPhase('chat');
      router.replace('/chat');
    }, totalDelay);

    return () => clearTimeout(timer);
  }, [caseData]);

  if (!caseData) return null;

  const getLineStyle = (style: IntroLine['style']) => {
    switch (style) {
      case 'label':
        return styles.labelText;
      case 'title':
        return styles.titleText;
      case 'charge':
        return styles.chargeText;
      case 'context':
        return styles.contextText;
      case 'tension':
        return styles.tensionText;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xxl }]}>
      <View style={styles.linesContainer}>
        {lines.slice(0, visibleLines).map((line, idx) => (
          <Animated.View
            key={idx}
            entering={
              line.style === 'title'
                ? FadeIn.duration(600)
                : FadeInUp.duration(500)
            }
            style={styles.lineWrapper}
          >
            <Text style={getLineStyle(line.style)}>{line.text}</Text>
            {line.style === 'title' && <View style={styles.titleUnderline} />}
          </Animated.View>
        ))}
      </View>

      {/* Decorative bottom */}
      {visibleLines >= lines.length && (
        <Animated.View entering={FadeIn.delay(500).duration(800)} style={styles.bottomArea}>
          <Text style={styles.proceedText}>Entering courtroom...</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    padding: spacing.lg,
  },
  linesContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  lineWrapper: {
    alignItems: 'center',
  },
  labelText: {
    fontSize: 12,
    letterSpacing: 6,
    color: colors.accent,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  titleUnderline: {
    width: 80,
    height: 3,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  chargeText: {
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
    fontStyle: 'italic',
    paddingHorizontal: spacing.lg,
  },
  contextText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  tensionText: {
    fontSize: 15,
    color: colors.accent,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  bottomArea: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  proceedText: {
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 2,
  },
});
