import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { useArgumentStore } from '../src/state/argumentStore';
import { getLawyerResponse } from '../src/agents/lawyer';
import { getDefendantSuggestions } from '../src/agents/defendant';
import { MessageBubble } from '../src/components/MessageBubble';
import { TypingIndicator } from '../src/components/TypingIndicator';
import { SuggestionCarousel } from '../src/components/SuggestionCarousel';
import {
  FlashOverlay,
  ObjectionBanner,
  ShakeContainer,
  GavelSlam,
  GuiltyOverlay,
} from '../src/components/IntensityEffects';
import { Message, SuggestedReply } from '../src/state/types';
import { colors, spacing } from '../src/theme';
import {
  generateIssueMd,
  generatePointsMd,
  generateAnalysisMd,
  generateConversationMd,
} from '../src/state/markdownManager';

export default function ChatPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [customText, setCustomText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [busy, setBusy] = useState(false);

  // Intensity effects state
  const [showFlash, setShowFlash] = useState(false);
  const [flashColor, setFlashColor] = useState(colors.flashWhite);
  const [showObjection, setShowObjection] = useState(false);
  const [objectionText, setObjectionText] = useState('OBJECTION!');
  const [shakeActive, setShakeActive] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [showGavel, setShowGavel] = useState(false);
  const [showGuilty, setShowGuilty] = useState(false);

  const {
    caseData,
    messages,
    suggestions,
    exchangeCount,
    isAttorneyThinking,
    isSuggestionsLoading,
    phase,
    attorneyPoints,
    defendantPoints,
    analysis,
    addMessage,
    setSuggestions,
    incrementExchange,
    updatePoints,
    updateAnalysis,
    setAttorneyThinking,
    setSuggestionsLoading,
    setPhase,
    setOutcome,
    persist,
  } = useArgumentStore();

  // ─── Initial load: attorney opening statement ───
  useEffect(() => {
    if (caseData && messages.length === 0) {
      handleAttorneyOpening();
    }
  }, [caseData]);

  // ─── Auto-scroll on new messages ───
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isAttorneyThinking]);

  // ─── Redirect if no case ───
  useEffect(() => {
    if (!caseData) {
      router.replace('/');
    }
  }, [caseData]);

  // ─── Gestures ───
  const swipeRight = Gesture.Pan()
    .activeOffsetX(50)
    .onEnd((e) => {
      if (e.translationX > 100) {
        router.replace('/');
      }
    });

  const swipeDown = Gesture.Pan()
    .activeOffsetY(30)
    .onEnd((e) => {
      if (e.translationY > 50 && e.translationX < 30 && e.translationX > -30) {
        setShowHistory(true);
      }
    });

  const composedGesture = Gesture.Race(swipeRight, swipeDown);

  // ─── Trigger intensity effects based on level ───
  const triggerIntensityEffects = useCallback((intensity: number) => {
    if (intensity >= 4) {
      setShakeIntensity(intensity);
      setShakeActive(true);
      setTimeout(() => setShakeActive(false), 300);
    }

    if (intensity >= 7 && intensity < 10) {
      setShowFlash(true);
      setFlashColor(colors.flashWhite);
      setTimeout(() => setShowFlash(false), 500);

      // Check if message contains OBJECTION, HOLD IT, or TAKE THAT
      const lastMsg = useArgumentStore.getState().messages;
      const latest = lastMsg[lastMsg.length - 1];
      if (latest) {
        const text = latest.text.toUpperCase();
        if (text.includes('OBJECTION')) {
          setObjectionText('OBJECTION!');
          setShowObjection(true);
          setTimeout(() => setShowObjection(false), 1200);
        } else if (text.includes('HOLD IT')) {
          setObjectionText('HOLD IT!');
          setShowObjection(true);
          setTimeout(() => setShowObjection(false), 1200);
        } else if (text.includes('TAKE THAT')) {
          setObjectionText('TAKE THAT!');
          setShowObjection(true);
          setTimeout(() => setShowObjection(false), 1200);
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    if (intensity >= 10) {
      setShowGavel(true);
      setShowFlash(true);
      setFlashColor(colors.flashWhite);
      setTimeout(() => {
        setShowFlash(false);
        setShowGavel(false);
      }, 1500);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, []);

  // ─── Attorney opening ───
  const handleAttorneyOpening = async () => {
    if (!caseData) return;

    setAttorneyThinking(true);
    // Add opening statement directly (no agent call needed -- it's from the case data)
    await new Promise((r) => setTimeout(r, 1500)); // Brief dramatic pause
    addMessage(caseData.opening_statement, 'attorney', 5);
    setAttorneyThinking(false);

    triggerIntensityEffects(5);

    // Get initial suggestions
    setSuggestionsLoading(true);
    try {
      const defResponse = await getDefendantSuggestions(0);
      setSuggestions(defResponse.suggestions);
    } catch (err: any) {
      console.error('Failed to get initial suggestions:', err);
      // Provide fallback suggestions
      setSuggestions([
        { text: 'OBJECTION! I demand to see the evidence!', type: 'objection', variant: 'default' },
        { text: 'That opening statement is misleading!', type: 'strategic', variant: 'default' },
        { text: 'The defense is ready to present its case!', type: 'dramatic', variant: 'default' },
        { text: 'Let\'s examine the facts more carefully.', type: 'strategic', variant: 'default' },
      ]);
    }
    setSuggestionsLoading(false);
  };

  // ─── Handle user message (core game loop) ───
  const handleUserMessage = async (text: string) => {
    if (busy || !text.trim()) return;
    setBusy(true);

    const isSurrender = text === '...I surrender.';

    // Add user message
    addMessage(text.trim(), 'user');
    incrementExchange();
    setSuggestions([]);
    setCustomText('');

    if (isSurrender) {
      // Surrender flow
      setPhase('surrender');
      await new Promise((r) => setTimeout(r, 2000)); // 2 second pause

      setAttorneyThinking(true);
      try {
        const lawyerResp = await getLawyerResponse(text, true);
        addMessage(lawyerResp.message, 'attorney', 10);
        setAttorneyThinking(false);

        triggerIntensityEffects(10);
        await new Promise((r) => setTimeout(r, 1500));

        // Show GUILTY overlay
        setShowGuilty(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        await persist();

        // Return to splash after 3 seconds
        setTimeout(() => {
          setOutcome('lost');
          setShowGuilty(false);
          router.replace('/');
        }, 3000);
      } catch (err: any) {
        setAttorneyThinking(false);
        Alert.alert('Error', 'Failed to get attorney response');
      }
      setBusy(false);
      return;
    }

    // Normal flow: call lawyer agent
    setAttorneyThinking(true);
    try {
      const lawyerResp = await getLawyerResponse(text);

      // Update state
      if (lawyerResp.updated_points.length > 0) {
        updatePoints(lawyerResp.updated_points);
      }
      if (
        lawyerResp.fallacies_identified.length > 0 ||
        lawyerResp.assumptions_challenged.length > 0
      ) {
        updateAnalysis(
          lawyerResp.fallacies_identified,
          lawyerResp.assumptions_challenged
        );
      }

      addMessage(lawyerResp.message, 'attorney', lawyerResp.intensity_level);
      setAttorneyThinking(false);

      triggerIntensityEffects(lawyerResp.intensity_level);

      // Get new suggestions from defendant agent
      setSuggestionsLoading(true);
      const currentExchange = useArgumentStore.getState().exchangeCount;
      try {
        const defResponse = await getDefendantSuggestions(currentExchange);
        setSuggestions(defResponse.suggestions);
      } catch (err: any) {
        console.error('Failed to get suggestions:', err);
        setSuggestions([
          { text: 'OBJECTION! That argument is flawed!', type: 'objection', variant: 'default' },
          { text: 'Let me present my evidence.', type: 'evidence', variant: 'default' },
          { text: 'The truth will prevail!', type: 'dramatic', variant: 'default' },
        ]);
      }
      setSuggestionsLoading(false);

      await persist();
    } catch (err: any) {
      setAttorneyThinking(false);
      setSuggestionsLoading(false);
      Alert.alert('Error', err?.message ?? 'Failed to get attorney response');
    }

    setBusy(false);
  };

  // ─── Chip selection handler ───
  const handleChipSelect = useCallback(
    (suggestion: SuggestedReply) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      handleUserMessage(suggestion.text);
    },
    [busy]
  );

  // ─── Custom text send ───
  const handleSendCustom = useCallback(() => {
    if (customText.trim()) {
      handleUserMessage(customText.trim());
    }
  }, [customText, busy]);

  // ─── Render helpers ───
  const renderMessage = useCallback(
    ({ item }: { item: Message }) => <MessageBubble message={item} />,
    []
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  if (!caseData) return null;

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ShakeContainer shake={shakeActive} intensity={shakeIntensity}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {caseData.title}
            </Text>
            <Text style={styles.headerExchange}>
              Exchange {exchangeCount}
            </Text>
          </View>

          {/* Messages */}
          <KeyboardAvoidingView
            style={styles.chatArea}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={insets.top + 60}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                isAttorneyThinking ? <TypingIndicator /> : null
              }
            />

            {/* Suggestion Carousel */}
            <SuggestionCarousel
              suggestions={suggestions}
              onSelect={handleChipSelect}
              isLoading={isSuggestionsLoading}
              disabled={busy}
            />

            {/* Custom input */}
            <View style={[styles.inputRow, { paddingBottom: insets.bottom + spacing.xs }]}>
              <TextInput
                style={styles.textInput}
                placeholder="Or type your own argument..."
                placeholderTextColor={colors.textMuted}
                value={customText}
                onChangeText={setCustomText}
                onSubmitEditing={handleSendCustom}
                returnKeyType="send"
                editable={!busy}
                multiline={false}
              />
              <Pressable
                style={[
                  styles.sendButton,
                  (!customText.trim() || busy) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendCustom}
                disabled={!customText.trim() || busy}
              >
                <Text style={styles.sendButtonText}>⚡</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </ShakeContainer>

        {/* Overlays */}
        <FlashOverlay visible={showFlash} color={flashColor} />
        <ObjectionBanner visible={showObjection} text={objectionText} />
        <GavelSlam visible={showGavel} />
        <GuiltyOverlay visible={showGuilty} />

        {/* History Modal */}
        <Modal
          visible={showHistory}
          animationType="slide"
          transparent
          onRequestClose={() => setShowHistory(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing.md }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Case Summary</Text>
                <Pressable onPress={() => setShowHistory(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Case info */}
                <Text style={styles.modalSectionTitle}>The Case</Text>
                <Text style={styles.modalBody}>{caseData.charge}</Text>
                <Text style={styles.modalBody}>{caseData.context}</Text>
                <Text style={[styles.modalBody, { color: colors.accent, fontStyle: 'italic' }]}>
                  "{caseData.philosophical_tension}"
                </Text>

                {/* Points status */}
                <Text style={styles.modalSectionTitle}>Prosecution Points</Text>
                {attorneyPoints.map((p) => (
                  <View key={p.id} style={styles.pointRow}>
                    <Text style={styles.pointId}>{p.id}</Text>
                    <View style={styles.pointInfo}>
                      <Text style={styles.pointClaim}>{p.claim}</Text>
                      <Text style={[styles.pointStatus, getStatusStyle(p.status)]}>
                        {p.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                ))}

                <Text style={styles.modalSectionTitle}>Defense Points</Text>
                {defendantPoints.map((p) => (
                  <View key={p.id} style={styles.pointRow}>
                    <Text style={styles.pointId}>{p.id}</Text>
                    <View style={styles.pointInfo}>
                      <Text style={styles.pointClaim}>{p.claim}</Text>
                      <Text style={[styles.pointStatus, getStatusStyle(p.status)]}>
                        {p.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Score */}
                <Text style={styles.modalSectionTitle}>Score</Text>
                <Text style={styles.modalBody}>
                  Attorney: {analysis.attorneyScore.validPoints} valid, {analysis.attorneyScore.fallacies} fallacies
                </Text>
                <Text style={styles.modalBody}>
                  Defendant: {analysis.defendantScore.validPoints} valid, {analysis.defendantScore.fallacies} fallacies
                </Text>

                {/* Fallacies */}
                {analysis.fallacies.length > 0 && (
                  <>
                    <Text style={styles.modalSectionTitle}>Fallacies Identified</Text>
                    {analysis.fallacies.map((f, idx) => (
                      <Text key={idx} style={styles.modalBody}>
                        • {f.side}: {f.type} — {f.context}
                      </Text>
                    ))}
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </GestureDetector>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'unchallenged':
      return { color: colors.textSecondary };
    case 'challenged':
      return { color: colors.holdIt };
    case 'refuted':
      return { color: colors.objection };
    case 'proven':
      return { color: colors.takeThat };
    default:
      return { color: colors.textMuted };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  headerExchange: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  chatArea: {
    flex: 1,
  },
  messageList: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.bgLight,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.bgLight,
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 18,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalClose: {
    fontSize: 22,
    color: colors.textMuted,
    padding: spacing.sm,
  },
  modalScroll: {
    flex: 1,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  modalBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  pointId: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    width: 28,
    paddingTop: 2,
  },
  pointInfo: {
    flex: 1,
  },
  pointClaim: {
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  pointStatus: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
