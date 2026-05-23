import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StreakBadge } from '@/components/StreakBadge';
import { XPCounter } from '@/components/XPCounter';
import { contentService } from '@/services/contentService';
import { useProgressStore } from '@/stores/useProgressStore';
import { useUserStore } from '@/stores/useUserStore';
import { LessonManifestEntry } from '@/types/lesson';
import { useColors } from '@/hooks/useColors';

function LessonRow({
  lesson,
  isUnlocked,
  isCompleted,
  bestScore,
  isCurrent,
  onPress,
}: {
  lesson: LessonManifestEntry;
  isUnlocked: boolean;
  isCompleted: boolean;
  bestScore: number;
  isCurrent: boolean;
  onPress: () => void;
}) {
  const colors = useColors();

  let statusIcon: React.ComponentProps<typeof Ionicons>['name'] = 'lock-closed';
  let statusColor = colors.mutedForeground;
  if (isCompleted) {
    statusIcon = 'checkmark-circle';
    statusColor = '#16A34A';
  } else if (isUnlocked) {
    statusIcon = 'play-circle';
    statusColor = colors.primary;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!isUnlocked}
      activeOpacity={0.85}
      style={[
        styles.lessonRow,
        {
          backgroundColor: isCurrent ? `${colors.primary}12` : colors.card,
          borderColor: isCurrent ? colors.primary : colors.border,
          opacity: isUnlocked ? 1 : 0.5,
        },
      ]}
    >
      <View style={[styles.lessonNum, { backgroundColor: isUnlocked ? colors.primary : colors.muted }]}>
        <Text style={[styles.lessonNumText, { color: isUnlocked ? '#fff' : colors.mutedForeground }]}>
          {lesson.number}
        </Text>
      </View>

      <View style={styles.lessonInfo}>
        <Text style={[styles.lessonTitle, { color: isUnlocked ? colors.foreground : colors.mutedForeground }]}>
          {lesson.title}
        </Text>
        <Text style={[styles.lessonSubtitle, { color: colors.mutedForeground }]}>
          {lesson.subtitle}
        </Text>
        {isCompleted && bestScore > 0 && (
          <Text style={[styles.lessonScore, { color: '#16A34A' }]}>
            Best: {Math.round(bestScore * 100)}%
          </Text>
        )}
      </View>

      <View style={styles.lessonMeta}>
        <Ionicons name={statusIcon} size={24} color={statusColor} />
        <Text style={[styles.lessonTime, { color: colors.mutedForeground }]}>
          {lesson.estimatedMinutes}m
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentStreak, totalXP, userName, setUserName, isLessonUnlocked, getLessonProgress, lessonsCompleted, preferences } = useProgressStore();
  const { hasCompletedOnboarding, completeOnboarding } = useUserStore();
  const [manifest, setManifest] = useState<LessonManifestEntry[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(!hasCompletedOnboarding);

  useEffect(() => {
    const m = contentService.loadManifest();
    setManifest(m.lessons);
  }, []);

  const currentLesson = manifest.find((l) => {
    const prog = getLessonProgress(l.id);
    return prog?.startedAt && !prog?.completedAt;
  });

  const handleLessonPress = (lesson: LessonManifestEntry) => {
    if (!isLessonUnlocked(lesson.id)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/lesson/${lesson.id}`);
  };

  const handleOnboardingDone = () => {
    if (nameInput.trim()) setUserName(nameInput.trim());
    completeOnboarding();
    setShowOnboarding(false);
  };

  const greeting = userName ? `Assalam alaikum, ${userName}!` : 'Assalam alaikum!';
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Onboarding Modal */}
      <Modal visible={showOnboarding} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Welcome to Bolo Urdu</Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              Learn spoken Urdu through listening and speaking. What's your name?
            </Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Your name (optional)"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.nameInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
              autoFocus
            />
            <TouchableOpacity
              onPress={handleOnboardingDone}
              style={[styles.startButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.startButtonText}>Let's Start Learning</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.appName, { color: colors.primary }]}>Bolo</Text>
          <Text style={[styles.appNameSub, { color: colors.foreground }]}> Urdu</Text>
        </View>
        <View style={styles.headerRight}>
          <StreakBadge streak={currentStreak} />
          <XPCounter xp={totalXP} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greeting, { color: colors.foreground }]}>{greeting}</Text>
          <Text style={[styles.subGreeting, { color: colors.mutedForeground }]}>
            {lessonsCompleted.length === 0
              ? 'Ready to start your Urdu journey?'
              : `${lessonsCompleted.length} lesson${lessonsCompleted.length !== 1 ? 's' : ''} completed`}
          </Text>
        </View>

        {/* Continue Card */}
        {currentLesson && (
          <TouchableOpacity
            onPress={() => router.push(`/lesson/${currentLesson.id}`)}
            style={[styles.continueCard, { backgroundColor: colors.primary }]}
            activeOpacity={0.88}
          >
            <View>
              <Text style={styles.continueLabel}>Continue learning</Text>
              <Text style={styles.continueTitle}>{currentLesson.title}</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={36} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        )}

        {/* Lesson List */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>All Lessons</Text>
        {manifest.map((lesson) => {
          const prog = getLessonProgress(lesson.id);
          const isCompleted = lessonsCompleted.includes(lesson.id);
          const isCurrent = currentLesson?.id === lesson.id;
          return (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              isUnlocked={isLessonUnlocked(lesson.id)}
              isCompleted={isCompleted}
              bestScore={prog?.bestScore ?? 0}
              isCurrent={isCurrent}
              onPress={() => handleLessonPress(lesson)}
            />
          );
        })}

        {/* Settings Link */}
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={[styles.settingsLink, { borderTopColor: colors.border }]}
        >
          <Ionicons name="settings-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.settingsLinkText, { color: colors.mutedForeground }]}>Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  appName: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
  },
  appNameSub: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  greetingSection: {
    marginBottom: 8,
    gap: 4,
  },
  greeting: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  subGreeting: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  continueCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  continueTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
    marginBottom: 4,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  lessonNum: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lessonNumText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  lessonInfo: {
    flex: 1,
    gap: 2,
  },
  lessonTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  lessonSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  lessonScore: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2,
  },
  lessonMeta: {
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  lessonTime: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 20,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  settingsLinkText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 28,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  startButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
});
