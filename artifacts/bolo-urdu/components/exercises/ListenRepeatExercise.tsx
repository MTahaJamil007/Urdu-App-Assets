import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AudioButton } from '@/components/AudioButton';
import { RecordButton } from '@/components/RecordButton';
import { audioService } from '@/services/audioService';
import { scoringService } from '@/services/scoringService';
import { ExerciseResult } from '@/types/exercise';
import { ListenRepeatExercise as LRExercise } from '@/types/exercise';
import { Phrase } from '@/types/phrase';
import { useColors } from '@/hooks/useColors';
import { config } from '@/constants/config';

interface ListenRepeatExerciseProps {
  exercise: LRExercise;
  phrase: Phrase;
  onResult: (result: ExerciseResult) => void;
  autoplay: boolean;
}

export function ListenRepeatExercise({ exercise, phrase, onResult, autoplay }: ListenRepeatExerciseProps) {
  const colors = useColors();
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);
  const [attempts, setAttempts] = useState(0);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoplay) {
      const t = setTimeout(() => audioService.playPhrase(phrase, 'normal'), 300);
      return () => clearTimeout(t);
    }
  }, [exercise.id]);

  useEffect(() => {
    return () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); };
  }, []);

  const handleResult = (transcript: string) => {
    const result = scoringService.score(transcript, phrase, 0.50);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (result.passed) {
      setFeedbackType('success');
      setFeedbackMsg(scoringService.getScoreLabel(result.score));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      advanceTimer.current = setTimeout(() => {
        onResult({
          exerciseId: exercise.id,
          passed: true,
          score: result.score,
          attempts: newAttempts,
          transcript: result.transcript,
          timestamp: Date.now(),
        });
      }, config.AUTO_ADVANCE_DELAY);
    } else if (newAttempts >= config.MAX_ATTEMPTS) {
      setFeedbackType('error');
      setFeedbackMsg(`The phrase is: "${phrase.roman}"`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      advanceTimer.current = setTimeout(() => {
        onResult({
          exerciseId: exercise.id,
          passed: false,
          score: result.score,
          attempts: newAttempts,
          transcript: result.transcript,
          timestamp: Date.now(),
        });
      }, config.AUTO_ADVANCE_DELAY * 2);
    } else {
      setFeedbackType('error');
      setFeedbackMsg('Try again — say it after listening');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setTimeout(() => { setFeedbackMsg(null); setFeedbackType(null); }, 1500);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.instruction, { color: colors.foreground }]}>
        Listen, then repeat
      </Text>

      <View style={[styles.phraseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.roman, { color: colors.foreground }]}>{phrase.roman}</Text>
        <Text style={[styles.english, { color: colors.mutedForeground }]}>{phrase.englishContextual}</Text>
      </View>

      <View style={styles.audioRow}>
        <AudioButton phrase={phrase} speed="normal" size="large" />
        <AudioButton phrase={phrase} speed="slow" size="small" />
      </View>

      <Text style={[styles.nowSay, { color: colors.mutedForeground }]}>Now you say it</Text>

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
    gap: 24,
    alignItems: 'center',
  },
  instruction: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  phraseCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  roman: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  english: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  nowSay: {
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
