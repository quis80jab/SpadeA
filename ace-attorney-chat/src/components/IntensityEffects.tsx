import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Screen Flash (intensity 7+) ───

interface FlashOverlayProps {
  visible: boolean;
  color?: string;
  onDone?: () => void;
}

export function FlashOverlay({ visible, color = colors.flashWhite, onDone }: FlashOverlayProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 400 })
      );
      if (onDone) {
        setTimeout(onDone, 500);
      }
    }
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.fullOverlay, { backgroundColor: color }, style]}
      pointerEvents="none"
    />
  );
}

// ─── OBJECTION! Banner (intensity 7-9) ───

interface ObjectionBannerProps {
  visible: boolean;
  text?: string;
  onDone?: () => void;
}

export function ObjectionBanner({
  visible,
  text = 'OBJECTION!',
  onDone,
}: ObjectionBannerProps) {
  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      if (onDone) {
        setTimeout(onDone, 1200);
      }
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={ZoomIn.duration(300).springify()}
      exiting={FadeOut.duration(400)}
      style={styles.bannerOverlay}
      pointerEvents="none"
    >
      <View style={styles.bannerBg}>
        <Text style={styles.bannerText}>{text}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Screen Shake Container (intensity 4-6) ───

interface ShakeContainerProps {
  shake: boolean;
  intensity: number;
  children: React.ReactNode;
}

export function ShakeContainer({ shake, intensity, children }: ShakeContainerProps) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (shake && intensity >= 4) {
      const magnitude = Math.min((intensity - 3) * 2, 10);
      translateX.value = withSequence(
        withTiming(magnitude, { duration: 40 }),
        withTiming(-magnitude, { duration: 40 }),
        withTiming(magnitude * 0.6, { duration: 40 }),
        withTiming(-magnitude * 0.6, { duration: 40 }),
        withTiming(magnitude * 0.3, { duration: 40 }),
        withTiming(0, { duration: 40 })
      );
      if (intensity >= 4 && intensity < 7) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, [shake, intensity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.shakeContainer, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// ─── Gavel Slam (intensity 10) ───

interface GavelSlamProps {
  visible: boolean;
  onDone?: () => void;
}

export function GavelSlam({ visible, onDone }: GavelSlamProps) {
  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      if (onDone) {
        setTimeout(onDone, 1500);
      }
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={ZoomIn.duration(200)}
      exiting={FadeOut.delay(800).duration(400)}
      style={styles.gavelOverlay}
      pointerEvents="none"
    >
      <Text style={styles.gavelEmoji}>🔨</Text>
      <Text style={styles.gavelText}>ORDER!</Text>
    </Animated.View>
  );
}

// ─── GUILTY Overlay (surrender) ───

interface GuiltyOverlayProps {
  visible: boolean;
}

export function GuiltyOverlay({ visible }: GuiltyOverlayProps) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={styles.guiltyOverlay}
      pointerEvents="none"
    >
      <Animated.Text
        entering={ZoomIn.delay(300).duration(400).springify()}
        style={styles.guiltyText}
      >
        GUILTY
      </Animated.Text>
      <Animated.Text
        entering={FadeIn.delay(1000).duration(400)}
        style={styles.guiltySubtext}
      >
        The defendant has surrendered.
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Flash
  fullOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },

  // Banner
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  bannerBg: {
    backgroundColor: colors.objection,
    paddingHorizontal: spacing.xl + 20,
    paddingVertical: spacing.md,
    borderRadius: 4,
    shadowColor: colors.objection,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  bannerText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },

  // Shake
  shakeContainer: {
    flex: 1,
  },

  // Gavel
  gavelOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 100,
  },
  gavelEmoji: {
    fontSize: 80,
  },
  gavelText: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 6,
    marginTop: spacing.md,
  },

  // Guilty
  guiltyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,26,0.92)',
    zIndex: 200,
  },
  guiltyText: {
    fontSize: 64,
    fontWeight: '900',
    color: colors.guilty,
    letterSpacing: 8,
    textShadowColor: 'rgba(220,38,38,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  guiltySubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    letterSpacing: 2,
  },
});
