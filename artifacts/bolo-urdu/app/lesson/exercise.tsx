import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressBar } from '@/components/ProgressBar';
import { IntroduceExercise } from '@/components/exercises/IntroduceExercise';
import { ListenToMeaningExercise } from '@/components/exercises/ListenToMeaningExercise';
import { ListenRepeatExercise } from '@/components/exercises/ListenRepeatExercise';
import { SpeakExercise } from '@/components/exercises/SpeakExercise';
import { audioService } from '@/services/audioService';
import { useProgressStore } from '@/stores/useProgressStore';
import { useLessonStore } from '@/stores/useLessonStore';
import { ExerciseResult } from '@/types/exercise';
import { useColors } from '@/hooks/useColors';

export default function ExerciseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeLesson, currentExerciseIndex, inMasteryCheck, advance, startMasteryCheck, recordMasteryResult, masteryResults } = useLessonStore();
  const { recordExerciseResult, completeLesson, addXP, updateStreak, preferences } = useProgressStore();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const phraseMap = useMemo(() => {
    if (!activeLesson) return {};
    const map: Record<string, (typeof activeLesson.phrases)[0]> = {};
    activeLesson.phrases.forEach((p) => { map[p.id] = p; });
    return map;
  }, [activeLesson]);

  const currentSequence = useMemo(() => {
    if (!activeLesson) return [];
    return inMasteryCheck ? activeLesson.masteryCheck : activeLesson.exerciseSequence;
  }, [activeLesson, inMasteryCheck]);

  const currentExercise = currentSequence[currentExerciseIndex];
  const progress = currentExercise
    ? (currentExerciseIndex + 1) / currentSequence.length
    : 1;

  const handleClose = () => {
    audioService.stop();
    router.back();
  };

  const handleResult = useCallback((result: ExerciseResult) => {
    if (!activeLesson) return;
    recordExerciseResult(activeLesson.id, result);

    if (inMasteryCheck) {
      recordMasteryResult(result.score);
    }

    const nextIndex = currentExerciseIndex + 1;

    if (nextIndex >= currentSequence.length) {
      // End of this sequence
      if (!inMasteryCheck) {
        // Move to mastery check
        audioService.stop();
        startMasteryCheck();
      } else {
        // Mastery check done — calculate final score
        const allScores = [...masteryResults, result.score];
        const finalScore = allScores.reduce((sum, s) => sum + s, 0) / allScores.length;
        audioService.stop();
        completeLesson(activeLesson.id, finalScore);
        if (finalScore >= activeLesson.passingScore) {
          addXP(activeLesson.rewards.xp);
          updateStreak();
        }
        router.replace({
          pathname: '/lesson/result',
          params: {
            lessonId: activeLesson.id,
            score: finalScore.toFixed(3),
            xp: finalScore >= activeLesson.passingScore ? String(activeLesson.rewards.xp) : '0',
            message: activeLesson.rewards.completionMessage,
          },
        });
      }
    } else {
      advance();
    }
  }, [activeLesson, currentExerciseIndex, currentSequence.length, inMasteryCheck, masteryResults]);

  const handleAdvance = useCallback(() => {
    const nextIndex = currentExerciseIndex + 1;
    if (nextIndex >= currentSequence.length) {
      if (!inMasteryCheck) {
        audioService.stop();
        startMasteryCheck();
      }
    } else {
      advance();
    }
  }, [currentExerciseIndex, currentSequence.length, inMasteryCheck]);

  if (!activeLesson || !currentExercise) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>No active lesson</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const phrase = phraseMap[currentExercise.phraseId];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} />
        </View>
        {inMasteryCheck && (
          <View style={[styles.masteryBadge, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.masteryBadgeText, { color: '#92400E' }]}>Quiz</Text>
          </View>
        )}
      </View>

      {/* Exercise Type Label */}
      <Text style={[styles.exerciseTypeLabel, { color: colors.mutedForeground }]}>
        {currentExercise.type === 'INTRODUCE' && 'New Phrase'}
        {currentExercise.type === 'L_TO_M' && 'Listen & Choose'}
        {currentExercise.type === 'LISTEN_REPEAT' && 'Listen & Repeat'}
        {currentExercise.type === 'SPEAK' && 'Speak'}
        {currentExercise.type === 'L_TO_I' && 'Listen & Choose'}
      </Text>

      {/* Exercise Content */}
      <View style={styles.exerciseContainer}>
        {currentExercise.type === 'INTRODUCE' && phrase && (
          <IntroduceExercise
            key={currentExercise.id}
            phrase={phrase}
            onDone={handleAdvance}
            autoplay={preferences.audioAutoplay}
          />
        )}

        {currentExercise.type === 'L_TO_M' && phrase && (
          <ListenToMeaningExercise
            key={currentExercise.id}
            exercise={currentExercise}
            allPhrases={activeLesson.phrases}
            onResult={handleResult}
            autoplay={preferences.audioAutoplay}
          />
        )}

        {currentExercise.type === 'LISTEN_REPEAT' && phrase && (
          <ListenRepeatExercise
            key={currentExercise.id}
            exercise={currentExercise}
            phrase={phrase}
            onResult={handleResult}
            autoplay={preferences.audioAutoplay}
          />
        )}

        {currentExercise.type === 'SPEAK' && phrase && (
          <SpeakExercise
            key={currentExercise.id}
            exercise={currentExercise}
            phrase={phrase}
            onResult={handleResult}
          />
        )}

        {currentExercise.type === 'L_TO_I' && (
          <View style={styles.unsupportedContainer}>
            <Text style={[styles.unsupportedText, { color: colors.mutedForeground }]}>
              This exercise type is coming soon.
            </Text>
            <TouchableOpacity
              onPress={handleAdvance}
              style={[styles.skipButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.skipButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  closeBtn: { padding: 4 },
  progressContainer: { flex: 1 },
  masteryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  masteryBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  exerciseTypeLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  exerciseContainer: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  backButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  unsupportedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 },
  unsupportedText: { fontSize: 16, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  skipButton: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  skipButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
