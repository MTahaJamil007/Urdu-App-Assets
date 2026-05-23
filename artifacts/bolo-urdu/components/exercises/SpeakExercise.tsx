import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HintRevealer } from '@/components/HintRevealer';
import { RecordButton } from '@/components/RecordButton';
import { scoringService } from '@/services/scoringService';
import { ExerciseResult } from '@/types/exercise';
import { SpeakExercise as SPExercise } from '@/types/exercise';
import { Phrase } from '@/types/phrase';
import { useColors } from '@/hooks/useColors';
import { config } from '@/constants/config';

interface SpeakExerciseProps {
  exercise: SPExercise;
  phrase: Phrase;
  onResult: (result: ExerciseResult) => void;
}

export function SpeakExercise({ exercise, phrase, onResult }: SpeakExerciseProps) {
  const colors = useColors();
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); };
  }, []);

  const handleResult = (transcript: string) => {
    const threshold = hintUsed ? 0.70 : 0.70;
    const result = scoringService.score(transcript, phrase, threshold);
    const rawScore = hintUsed ? Math.min(result.score, 0.7) : result.score;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (result.passed) {
      setFeedbackType('success');
      setFeedbackMsg(scoringService.getScoreLabel(rawScore));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      advanceTimer.current = setTimeout(() => {
        onResult({
          exerciseId: exercise.id,
          passed: true,
          score: rawScore,
          attempts: newAttempts,
          transcript: result.transcript,
          timestamp: Date.now(),
        });
      }, config.AUTO_ADVANCE_DELAY);
    } else if (newAttempts >= config.MAX_ATTEMPTS) {
      setFeedbackType('error');
      setFeedbackMsg(`The answer: "${phrase.roman}"`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      advanceTimer.current = setTimeout(() => {
        onResult({
          exerciseId: exercise.id,
          passed: false,
          score: 0.3,
          attempts: newAttempts,
          transcript: result.transcript,
          timestamp: Date.now(),
        });
      }, config.AUTO_ADVANCE_DELAY * 2);
    } else {
      setFeedbackType('error');
      setFeedbackMsg(`Try again — ${config.MAX_ATTEMPTS - newAttempts} more attempt${config.MAX_ATTEMPTS - newAttempts !== 1 ? 's' : ''}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setTimeout(() => { setFeedbackMsg(null); setFeedbackType(null); }, 1500);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.promptCard, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
        <Text style={[styles.promptLabel, { color: '#166534' }]}>Say in Urdu</Text>
        <Text style={[styles.promptText, { color: '#14532D' }]}>{exercise.prompt}</Text>
      </View>

      {exercise.hint && !hintUsed && (
        <HintRevealer hint={exercise.hint} onReveal={() => setHintUsed(true)} />
      )}
      {exercise.hint && hintUsed && (
        <View style={[styles.hintShown, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
          <Text style={[styles.hintShownText, { color: '#92400E' }]}>{exercise.hint}</Text>
        </View>
      )}

      <RecordButton
        onResult={handleResult}
        disabled={feedbackType === 'success'}
      />

      {feedbackMsg && (
        <View style={[
          styles.feedbackBanner,
          {
            backgroundColor: feedbackType === 'success' ? '#DCFCE7' : '#FEE2E2',
            borderColor: feedbackType === 'success' ? '#16A34A' : '#DC2626',
          },
        ]}>
          <Text style={[
            styles.feedbackText,
            { color: feedbackType === 'success' ? '#166534' : '#991B1B' },
          ]}>
            {feedbackMsg}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 28,
    alignItems: 'center',
  },
  promptCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  promptLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  promptText: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    lineHeight: 32,
  },
  hintShown: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  hintShownText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  feedbackBanner: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
});
