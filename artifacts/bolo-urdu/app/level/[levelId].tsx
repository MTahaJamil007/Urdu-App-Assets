import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressBar } from '@/components/ProgressBar';
import { IntroduceExercise } from '@/components/exercises/IntroduceExercise';
import { ListenRepeatExercise } from '@/components/exercises/ListenRepeatExercise';
import { ListenToMeaningExercise } from '@/components/exercises/ListenToMeaningExercise';
import { ScenarioTurnExercise } from '@/components/exercises/ScenarioTurnExercise';
import { SpeakExercise } from '@/components/exercises/SpeakExercise';
import { audioService } from '@/services/audioService';
import { contentService } from '@/services/contentService';
import { useChapterStore } from '@/stores/useChapterStore';
import { useProgressStore } from '@/stores/useProgressStore';
import { Chapter } from '@/types/chapter';
import { ExerciseResult } from '@/types/exercise';
import { Level } from '@/types/level';
import { useColors } from '@/hooks/useColors';

export default function LevelPlayerScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [showScenarioIntro, setShowScenarioIntro] = useState(false);

  const { setActive, activeLevel, currentExerciseIndex, advance, scenarioIntroShown, markScenarioIntroShown } =
    useChapterStore();
  const { startLevel, completeLevel, completeChapter, addXP, updateStreak, preferences } =
    useProgressStore();

  useEffect(() => {
    if (!levelId) return;
    const chapterId = contentService.chapterIdFromLevelId(levelId);
    const ch = contentService.loadChapter(chapterId);
    if (!ch) return;
    const lv = contentService.getLevelById(ch, levelId);
    if (!lv) return;
    setChapter(ch);
    setLevel(lv);
    setActive(ch, lv);
    startLevel(levelId, chapterId);

    if (lv.type === 'BOSS' && !scenarioIntroShown) {
      setShowScenarioIntro(true);
    }
  }, [levelId]);

  const phraseMap = useMemo(() => {
    if (!chapter) return {};
    return contentService.buildPhraseMap(chapter);
  }, [chapter]);

  const currentExercise = useMemo(() => {
    if (!level) return null;
    return level.exerciseSequence[currentExerciseIndex] ?? null;
  }, [level, currentExerciseIndex]);

  const progress = useMemo(() => {
    if (!level) return 0;
    return Math.max(0, currentExerciseIndex) / level.exerciseSequence.length;
  }, [level, currentExerciseIndex]);

  const isBoss = level?.type === 'BOSS';

  const handleClose = () => {
    audioService.stop();
    router.back();
  };

  const handleResult = useCallback((result: ExerciseResult) => {
    if (!level || !chapter) return;
    const newScores = [...scores, result.score];
    setScores(newScores);

    const nextIndex = currentExerciseIndex + 1;

    if (nextIndex >= level.exerciseSequence.length) {
      const avg = newScores.reduce((a, b) => a + b, 0) / newScores.length;
      const passed = avg >= (level.passingScore ?? 0.75);
      const chapterId = chapter.id;
      const xpEarned = passed
        ? level.rewards.xp + (passed && isBoss ? (level.rewards.chapterCompleteBonus ?? 0) : 0)
        : 0;

      audioService.stop();
      completeLevel(level.id, chapterId, avg);

      if (passed) {
        if (xpEarned > 0) addXP(xpEarned);
        updateStreak();
        if (isBoss) completeChapter(chapterId);
      }

      router.replace({
        pathname: '/level/result',
        params: {
          levelId: level.id,
          chapterId,
          score: avg.toFixed(3),
          xp: String(xpEarned),
          isBoss: isBoss ? '1' : '0',
          chapterTitle: chapter.title,
          chapterMessage: chapter.rewards.completionMessage,
        },
      });
    } else {
      advance();
    }
  }, [level, chapter, scores, currentExerciseIndex, isBoss]);

  const handleAdvance = useCallback(() => {
    if (!level) return;
    const nextIndex = currentExerciseIndex + 1;
    if (nextIndex >= level.exerciseSequence.length) {
      const avg = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 1.0;
      const passed = avg >= (level.passingScore ?? 0.75);
      const chapterId = chapter?.id ?? '';
      const xpEarned = passed
        ? level.rewards.xp + (isBoss ? (level.rewards.chapterCompleteBonus ?? 0) : 0)
        : 0;
      audioService.stop();
      completeLevel(level.id, chapterId, avg);
      if (passed) {
        if (xpEarned > 0) addXP(xpEarned);
        updateStreak();
        if (isBoss && chapter) completeChapter(chapter.id);
      }
      router.replace({
        pathname: '/level/result',
        params: {
          levelId: level.id,
          chapterId,
          score: avg.toFixed(3),
          xp: String(xpEarned),
          isBoss: isBoss ? '1' : '0',
          chapterTitle: chapter?.title ?? '',
          chapterMessage: chapter?.rewards.completionMessage ?? '',
        },
      });
    } else {
      advance();
    }
  }, [level, chapter, currentExerciseIndex, scores, isBoss]);

  const dismissScenarioIntro = () => {
    setShowScenarioIntro(false);
    markScenarioIntroShown();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  if (!chapter || !level) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadText, { color: colors.mutedForeground }]}>Loading...</Text>
      </View>
    );
  }

  const bgColor = isBoss
    ? 'rgba(120,53,15,0.04)'
    : colors.background;

  const scenarioTurnExercises = isBoss
    ? level.exerciseSequence.filter((e) => e.type === 'SCENARIO_TURN')
    : [];

  return (
    <View style={[styles.screen, { backgroundColor: isBoss ? '#FFFBF0' : colors.background }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} />
        </View>
        {isBoss && (
          <MaterialCommunityIcons name="crown" size={22} color="#D97706" />
        )}
      </View>

      {/* Level info */}
      <Text style={[styles.levelTitle, { color: colors.mutedForeground }]}>
        {level.title}
      </Text>

      {/* Scenario Intro overlay */}
      {showScenarioIntro && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={[styles.scenarioIntroOverlay, { backgroundColor: '#FFFBF0' }]}
        >
          <View style={styles.scenarioIntroContent}>
            <MaterialCommunityIcons name="crown" size={48} color="#D97706" />
            <Text style={[styles.scenarioIntroTitle, { color: '#78350F' }]}>Boss Challenge</Text>
            <Text style={[styles.scenarioIntroText, { color: '#92400E' }]}>
              {level.scenarioIntro}
            </Text>
            <TouchableOpacity
              onPress={dismissScenarioIntro}
              style={[styles.scenarioIntroButton, { backgroundColor: '#D97706' }]}
              activeOpacity={0.88}
            >
              <Text style={styles.scenarioIntroButtonText}>I'm Ready</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Exercise */}
      {!showScenarioIntro && currentExercise && (
        <View style={styles.exerciseContainer}>
          {currentExercise.type === 'INTRODUCE' && phraseMap[currentExercise.phraseId] && (
            <IntroduceExercise
              key={currentExercise.id}
              phrase={phraseMap[currentExercise.phraseId]}
              onDone={handleAdvance}
              autoplay={preferences.audioAutoplay}
            />
          )}
          {currentExercise.type === 'L_TO_M' && phraseMap[currentExercise.phraseId] && (
            <ListenToMeaningExercise
              key={currentExercise.id}
              exercise={currentExercise}
              allPhrases={chapter.phrases}
              onResult={handleResult}
              autoplay={preferences.audioAutoplay}
            />
          )}
          {currentExercise.type === 'LISTEN_REPEAT' && phraseMap[currentExercise.phraseId] && (
            <ListenRepeatExercise
              key={currentExercise.id}
              exercise={currentExercise}
              phrase={phraseMap[currentExercise.phraseId]}
              onResult={handleResult}
              autoplay={preferences.audioAutoplay}
            />
          )}
          {currentExercise.type === 'SPEAK' && phraseMap[currentExercise.phraseId] && (
            <SpeakExercise
              key={currentExercise.id}
              exercise={currentExercise}
              phrase={phraseMap[currentExercise.phraseId]}
              onResult={handleResult}
            />
          )}
          {currentExercise.type === 'SCENARIO_TURN' && phraseMap[currentExercise.expectedPhraseId] && (
            <ScenarioTurnExercise
              key={currentExercise.id}
              exercise={currentExercise}
              expectedPhrase={phraseMap[currentExercise.expectedPhraseId]}
              turnNumber={currentExerciseIndex + 1}
              totalTurns={scenarioTurnExercises.length}
              onResult={handleResult}
              autoplay={preferences.audioAutoplay}
            />
          )}
        </View>
      )}

      {!showScenarioIntro && !currentExercise && (
        <View style={styles.centered}>
          <Text style={[styles.loadText, { color: colors.mutedForeground }]}>
            Calculating result...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadText: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  closeBtn: { padding: 4 },
  progressContainer: { flex: 1 },
  levelTitle: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  exerciseContainer: { flex: 1 },
  scenarioIntroOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  scenarioIntroContent: {
    alignItems: 'center',
    gap: 16,
    maxWidth: 340,
  },
  scenarioIntroTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  scenarioIntroText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  scenarioIntroButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scenarioIntroButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
});
