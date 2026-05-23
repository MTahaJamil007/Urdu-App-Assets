import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { contentService } from '@/services/contentService';
import { useProgressStore } from '@/stores/useProgressStore';
import { useLessonStore } from '@/stores/useLessonStore';
import { Lesson } from '@/types/lesson';
import { useColors } from '@/hooks/useColors';

export default function LessonIntroScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const { startLesson, getLessonProgress, lessonsCompleted } = useProgressStore();
  const { setActiveLesson } = useLessonStore();

  useEffect(() => {
    if (id) {
      const l = contentService.loadLesson(id);
      setLesson(l);
    }
  }, [id]);

  if (!lesson) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading...</Text>
      </View>
    );
  }

  const progress = getLessonProgress(lesson.id);
  const isCompleted = lessonsCompleted.includes(lesson.id);
  const isInProgress = !!progress?.startedAt && !progress?.completedAt;

  let buttonLabel = 'Start Lesson';
  if (isCompleted) buttonLabel = 'Replay Lesson';
  else if (isInProgress) buttonLabel = 'Continue';

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startLesson(lesson.id);
    setActiveLesson(lesson);
    router.push('/lesson/exercise');
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const previewPhrases = lesson.phrases.slice(0, 6);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.lessonNumber, { color: colors.mutedForeground }]}>
          Lesson {lesson.number}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.foreground }]}>{lesson.title}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{lesson.subtitle}</Text>
        </View>

        {/* Goal */}
        <View style={[styles.goalCard, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}30` }]}>
          <Text style={[styles.goalLabel, { color: colors.primary }]}>Goal</Text>
          <Text style={[styles.goalText, { color: colors.foreground }]}>{lesson.goal}</Text>
        </View>

        {/* Phrase Preview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>You will learn</Text>
          <View style={styles.phraseChips}>
            {previewPhrases.map((p) => (
              <View key={p.id} style={[styles.chip, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.chipText, { color: colors.foreground }]}>{p.roman}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Cultural Note */}
        <View style={[styles.culturalCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
          <View style={styles.culturalHeader}>
            <Ionicons name="information-circle" size={18} color="#D97706" />
            <Text style={[styles.culturalLabel, { color: '#92400E' }]}>Cultural note</Text>
          </View>
          <Text style={[styles.culturalText, { color: '#78350F' }]}>{lesson.culturalNote}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{lesson.estimatedMinutes} min</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Estimated</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="star" size={20} color="#D97706" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{lesson.rewards.xp} XP</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Reward</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="library-outline" size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{lesson.phrases.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Phrases</Text>
          </View>
        </View>

        {isCompleted && progress && (
          <View style={[styles.bestScore, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
            <Ionicons name="trophy" size={18} color="#16A34A" />
            <Text style={[styles.bestScoreText, { color: '#166534' }]}>
              Best score: {Math.round(progress.bestScore * 100)}%
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Start Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleStart}
          style={[styles.startButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.88}
        >
          <Text style={styles.startButtonText}>{buttonLabel}</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: { padding: 4 },
  lessonNumber: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, gap: 20 },
  titleSection: { gap: 4 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', lineHeight: 36 },
  subtitle: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  goalCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  goalLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
  goalText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  phraseChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  culturalCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  culturalHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  culturalLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  culturalText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  bestScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  bestScoreText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
});
