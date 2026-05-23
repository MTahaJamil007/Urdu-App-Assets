import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
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

export default function LevelResultScreen() {
  const params = useLocalSearchParams<{
    levelId: string;
    chapterId: string;
    score: string;
    xp: string;
    isBoss: string;
    chapterTitle: string;
    chapterMessage: string;
  }>();

  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { isLevelUnlocked } = useProgressStore();

  const score = parseFloat(params.score ?? '0');
  const xpEarned = parseInt(params.xp ?? '0', 10);
  const isBoss = params.isBoss === '1';
  const passed = score >= 0.75;

  const scaleAnim = useSharedValue(0);

  useEffect(() => {
    scaleAnim.value = withDelay(150, withSpring(1, { damping: 12 }));
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const manifest = contentService.loadManifest();
  const currentChapterIndex = manifest.chapters.findIndex((c) => c.id === params.chapterId);
  const nextChapter = manifest.chapters[currentChapterIndex + 1];
  const currentChapter = manifest.chapters[currentChapterIndex];

  const currentLevelIndex = currentChapter?.levels.findIndex((l) => l.id === params.levelId) ?? -1;
  const nextLevelInChapter = currentChapter?.levels[currentLevelIndex + 1];

  const handleContinue = () => {
    if (isBoss && nextChapter) {
      const firstLevel = nextChapter.levels[0];
      if (firstLevel && isLevelUnlocked(firstLevel.id)) {
        router.replace(`/level/${firstLevel.id}`);
        return;
      }
    }
    if (!isBoss && nextLevelInChapter && isLevelUnlocked(nextLevelInChapter.id)) {
      router.replace(`/level/${nextLevelInChapter.id}`);
      return;
    }
    router.replace('/');
  };

  const bgColor = isBoss ? '#FFFBF0' : colors.background;
  const circleColor = passed
    ? (isBoss ? '#FEF3C7' : '#F0FDF4')
    : '#FEF3C7';
  const circleBorder = passed
    ? (isBoss ? '#FDE68A' : '#86EFAC')
    : '#FDE68A';

  return (
    <View style={[styles.screen, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 24, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <Animated.View style={[styles.circleWrapper, circleStyle]}>
          <View style={[styles.circle, { backgroundColor: circleColor, borderColor: circleBorder }]}>
            {isBoss && passed ? (
              <MaterialCommunityIcons name="crown" size={48} color="#D97706" />
            ) : passed ? (
              <Ionicons name="checkmark-circle" size={56} color="#16A34A" />
            ) : (
              <Ionicons name="refresh" size={48} color="#D97706" />
            )}
          </View>
        </Animated.View>

        {/* Headline */}
        <Animated.View entering={FadeIn.delay(250)} style={styles.headlineSection}>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            {!passed
              ? 'Almost there!'
              : isBoss
                ? `Chapter Complete!`
                : 'Level Complete!'}
          </Text>
          {isBoss && passed && (
            <Text style={[styles.chapterSubtitle, { color: '#D97706' }]}>
              {params.chapterTitle}
            </Text>
          )}
          <StarRating score={score} />
          <Text style={[styles.scoreText, { color: colors.mutedForeground }]}>
            {Math.round(score * 100)}%{' '}
            {!passed && `— need 75% to complete`}
          </Text>
        </Animated.View>

        {/* XP */}
        {xpEarned > 0 && (
          <Animated.View entering={FadeIn.delay(450)}>
            <View style={[styles.xpBanner, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <Ionicons name="star" size={22} color="#2563EB" />
              <Text style={[styles.xpText, { color: '#1E40AF' }]}>+{xpEarned} XP earned!</Text>
            </View>
          </Animated.View>
        )}

        {/* Chapter complete message */}
        {isBoss && passed && params.chapterMessage && (
          <Animated.View entering={FadeIn.delay(600)}>
            <View style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.messageText, { color: colors.foreground }]}>
                {params.chapterMessage}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Next chapter teaser */}
        {isBoss && passed && nextChapter && (
          <Animated.View entering={FadeIn.delay(700)}>
            <View style={[styles.nextCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.nextLabel, { color: colors.mutedForeground }]}>Up next</Text>
              <Text style={[styles.nextTitle, { color: colors.foreground }]}>
                Chapter {nextChapter.number}: {nextChapter.title}
              </Text>
              <Text style={[styles.nextSubtitle, { color: colors.mutedForeground }]}>
                {nextChapter.subtitle}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Not passed */}
        {!passed && (
          <Animated.View entering={FadeIn.delay(500)}>
            <View style={[styles.retryCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
              <Text style={[styles.retryText, { color: '#92400E' }]}>
                {isBoss
                  ? 'You need 75% to complete the boss challenge and unlock the next chapter.'
                  : 'You need 75% to unlock the next level. Keep practicing!'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Buttons */}
        <Animated.View entering={FadeIn.delay(800)} style={styles.buttons}>
          {passed ? (
            <TouchableOpacity
              onPress={handleContinue}
              style={[
                styles.primaryBtn,
                { backgroundColor: isBoss ? '#D97706' : colors.primary },
              ]}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>
                {isBoss && nextChapter
                  ? `Start Chapter ${nextChapter.number}`
                  : 'Continue'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.replace(`/level/${params.levelId}`)}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>Try Again</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => router.replace('/')}
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>
              Back to Path
            </Text>
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
  circleWrapper: { alignItems: 'center' },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  headlineSection: { alignItems: 'center', gap: 12 },
  headline: { fontSize: 32, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  chapterSubtitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  scoreText: { fontSize: 16, fontFamily: 'Inter_500Medium' },
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
  messageText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 23, textAlign: 'center' },
  nextCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    width: '100%',
    gap: 4,
  },
  nextLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
  nextTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  nextSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  retryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    width: '100%',
  },
  retryText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22, textAlign: 'center' },
  buttons: { width: '100%', gap: 12, marginTop: 8 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
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
