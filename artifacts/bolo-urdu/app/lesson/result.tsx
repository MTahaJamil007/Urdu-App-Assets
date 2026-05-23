import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { contentService } from '@/services/contentService';
import { useProgressStore } from '@/stores/useProgressStore';
import { useColors } from '@/hooks/useColors';

function StarRating({ score }: { score: number }) {
  const filled = score >= 0.9 ? 3 : score >= 0.75 ? 2 : 1;
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3].map((i) => (
        <Ionicons
          key={i}
          name={i <= filled ? 'star' : 'star-outline'}
          size={36}
          color={i <= filled ? '#D97706' : '#E5E7EB'}
        />
      ))}
    </View>
  );
}

export default function ResultScreen() {
  const { lessonId, score: scoreStr, xp: xpStr, message } = useLocalSearchParams<{
    lessonId: string;
    score: string;
    xp: string;
    message: string;
  }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const score = parseFloat(scoreStr ?? '0');
  const xpEarned = parseInt(xpStr ?? '0', 10);
  const passed = score >= 0.75;

  const scaleAnim = useSharedValue(0);
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    scaleAnim.value = withDelay(200, withSpring(1, { damping: 12 }));
    progressAnim.value = withDelay(400, withTiming(score, { duration: 800 }));
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const manifest = contentService.loadManifest();
  const lessonNum = parseInt(lessonId?.slice(1) ?? '1', 10);
  const nextLesson = manifest.lessons.find((l) => l.number === lessonNum + 1);
  const { isLessonUnlocked } = useProgressStore();

  const handleContinue = () => {
    if (nextLesson && isLessonUnlocked(nextLesson.id)) {
      router.replace(`/lesson/${nextLesson.id}`);
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 24, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Result Circle */}
        <Animated.View style={[styles.resultCircleWrapper, circleStyle]}>
          <View
            style={[
              styles.resultCircle,
              {
                backgroundColor: passed ? '#F0FDF4' : '#FEF3C7',
                borderColor: passed ? '#86EFAC' : '#FDE68A',
              },
            ]}
          >
            <Ionicons
              name={passed ? 'trophy' : 'refresh'}
              size={48}
              color={passed ? '#16A34A' : '#D97706'}
            />
          </View>
        </Animated.View>

        {/* Headline */}
        <Animated.View entering={FadeIn.delay(300)} style={styles.headlineSection}>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            {passed ? 'Lesson Complete!' : 'Almost there!'}
          </Text>
          <StarRating score={score} />
          <Text style={[styles.scoreText, { color: colors.mutedForeground }]}>
            Score: {Math.round(score * 100)}%
          </Text>
        </Animated.View>

        {/* XP Banner */}
        {xpEarned > 0 && (
          <Animated.View entering={FadeIn.delay(500)}>
            <View style={[styles.xpBanner, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <Ionicons name="star" size={22} color="#2563EB" />
              <Text style={[styles.xpText, { color: '#1E40AF' }]}>+{xpEarned} XP earned!</Text>
            </View>
          </Animated.View>
        )}

        {/* Message */}
        {passed && message && (
          <Animated.View entering={FadeIn.delay(600)}>
            <View style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.messageText, { color: colors.foreground }]}>{message}</Text>
            </View>
          </Animated.View>
        )}

        {/* Not passed message */}
        {!passed && (
          <Animated.View entering={FadeIn.delay(500)}>
            <View style={[styles.retryCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
              <Text style={[styles.retryText, { color: '#92400E' }]}>
                You need 75% to unlock the next lesson. Keep practicing — you're getting there!
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Next Lesson Preview */}
        {nextLesson && passed && (
          <Animated.View entering={FadeIn.delay(700)}>
            <View style={[styles.nextCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.nextLabel, { color: colors.mutedForeground }]}>Up next</Text>
              <Text style={[styles.nextTitle, { color: colors.foreground }]}>{nextLesson.title}</Text>
              <Text style={[styles.nextSubtitle, { color: colors.mutedForeground }]}>{nextLesson.subtitle}</Text>
            </View>
          </Animated.View>
        )}

        {/* Buttons */}
        <Animated.View entering={FadeIn.delay(800)} style={styles.buttons}>
          {passed && nextLesson ? (
            <TouchableOpacity
              onPress={handleContinue}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>Continue to Lesson {lessonNum + 1}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.replace(`/lesson/${lessonId}`)}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>{passed ? 'Replay Lesson' : 'Try Again'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => router.replace('/')}
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    gap: 24,
    alignItems: 'center',
  },
  resultCircleWrapper: { alignItems: 'center' },
  resultCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  headlineSection: { alignItems: 'center', gap: 12 },
  headline: { fontSize: 32, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  scoreText: { fontSize: 18, fontFamily: 'Inter_500Medium' },
  xpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  xpText: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  messageCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    width: '100%',
  },
  messageText: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 24, textAlign: 'center' },
  retryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    width: '100%',
  },
  retryText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22, textAlign: 'center' },
  nextCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    width: '100%',
    gap: 4,
  },
  nextLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
  nextTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  nextSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  buttons: { width: '100%', gap: 12, marginTop: 8 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontFamily: 'Inter_700Bold' },
  secondaryBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
