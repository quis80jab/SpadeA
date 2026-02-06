import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useArgumentStore } from '../src/state/argumentStore';
import { generateCase } from '../src/agents/caseCreator';
import { colors, spacing } from '../src/theme';

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { initCase, setPhase, setGeneratingCase, reset } = useArgumentStore();

  const pulseOpacity = useSharedValue(1);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handleEnter = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setGeneratingCase(true);
    reset();

    try {
      const caseData = await generateCase();
      initCase(caseData);
      setGeneratingCase(false);
      router.push('/court-intro');
    } catch (err: any) {
      setGeneratingCase(false);
      setLoading(false);
      const msg = err?.message ?? 'Failed to generate case';
      setError(msg);
      Alert.alert('Error', msg);
    }
  }, [loading]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Title area */}
      <Animated.View entering={FadeIn.duration(800)} style={styles.titleArea}>
        <Text style={styles.subtitle}>ACE ATTORNEY</Text>
        <Text style={styles.title}>AI COURTROOM</Text>
        <View style={styles.divider} />
        <Text style={styles.tagline}>
          Where absurdity meets philosophy{'\n'}and justice is debatable
        </Text>
      </Animated.View>

      {/* Center decoration */}
      <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.gavelArea}>
        <Text style={styles.gavelEmoji}>⚖️</Text>
      </Animated.View>

      {/* Enter button */}
      <Animated.View entering={FadeInDown.delay(800).duration(600)} style={styles.buttonArea}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Preparing the case...</Text>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.enterButton,
              pressed && styles.enterButtonPressed,
            ]}
            onPress={handleEnter}
          >
            <Text style={styles.enterButtonText}>ENTER THE COURTROOM</Text>
          </Pressable>
        )}

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </Animated.View>

      {/* Footer */}
      <Animated.View entering={FadeIn.delay(1200).duration(600)} style={styles.footer}>
        <Text style={styles.footerText}>Powered by Claude AI</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  titleArea: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  subtitle: {
    fontSize: 14,
    letterSpacing: 8,
    color: colors.accent,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: colors.primary,
    marginVertical: spacing.md,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  gavelArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gavelEmoji: {
    fontSize: 80,
  },
  buttonArea: {
    alignItems: 'center',
    width: '100%',
  },
  enterButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    minWidth: 260,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  enterButtonPressed: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 0.97 }],
  },
  enterButtonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  errorText: {
    color: colors.primary,
    fontSize: 12,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
