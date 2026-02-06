import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeInLeft,
  FadeInRight,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Message } from '../state/types';
import { colors, spacing, animation } from '../theme';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAttorney = message.sender === 'attorney';
  const intensity = message.intensity ?? 1;

  // Determine animation based on intensity
  const getEntering = () => {
    if (!isAttorney) {
      return FadeInRight.duration(animation.normal);
    }
    if (intensity >= 7) {
      return ZoomIn.duration(animation.slow).springify();
    }
    return FadeInLeft.duration(animation.normal);
  };

  // Scale up text slightly for high intensity
  const scale = intensity >= 4 ? 1 + (intensity - 4) * 0.02 : 1;

  return (
    <Animated.View
      entering={getEntering()}
      style={[
        styles.container,
        isAttorney ? styles.attorneyContainer : styles.userContainer,
      ]}
    >
      {/* Sender label */}
      <Text style={[styles.senderLabel, isAttorney ? styles.attorneyLabel : styles.userLabel]}>
        {isAttorney ? '⚔️ PROSECUTOR' : '🛡️ YOU'}
      </Text>

      {/* Message bubble */}
      <View
        style={[
          styles.bubble,
          isAttorney ? styles.attorneyBubble : styles.userBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isAttorney ? styles.attorneyText : styles.userText,
            { transform: [{ scale }] },
          ]}
        >
          {message.text}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    maxWidth: '85%',
  },
  attorneyContainer: {
    alignSelf: 'flex-start',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  senderLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  attorneyLabel: {
    color: colors.primary,
  },
  userLabel: {
    color: colors.accent,
    textAlign: 'right',
  },
  bubble: {
    borderRadius: 16,
    padding: spacing.md,
    paddingHorizontal: spacing.md + 4,
  },
  attorneyBubble: {
    backgroundColor: colors.attorneyBubble,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(232, 213, 255, 0.1)',
  },
  userBubble: {
    backgroundColor: colors.userBubble,
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(213, 234, 255, 0.1)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  attorneyText: {
    color: colors.attorneyText,
  },
  userText: {
    color: colors.userText,
  },
});
