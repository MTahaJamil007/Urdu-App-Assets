import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AudioButton } from '@/components/AudioButton';
import { HintRevealer } from '@/components/HintRevealer';
import { RecordButton } from '@/components/RecordButton';
import { audioService } from '@/services/audioService';
import { scoringService } from '@/services/scoringService';
import { ExerciseResult, ScenarioTurnExercise as STExercise } from '@/types/exercise';
import { Phrase } from '@/types/phrase';
import { useColors } from '@/hooks/useColors';
import { config } from '@/constants/config';

interface ScenarioTurnExerciseProps {
  exercise: STExercise;
  expectedPhrase: Phrase;
  turnNumber: number;
  totalTurns: number;
  onResult: (result: ExerciseResult) => void;
  autoplay: boolean;
}

export function ScenarioTurnExercise({
  exercise,
  expectedPhrase,
  turnNumber,
  totalTurns,
  onResult,
  autoplay,
}: ScenarioTurnExerciseProps) {
  const colors = useColors();
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [recordEnabled, setRecordEnabled] = useState(!autoplay);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speakerPhrase: Phrase = {
    id: '__speaker__',
    chapterId: '',
    levelId: '',
    order: 0,
    urdu: exercise.speakerLine.urdu,
    roman: exercise.speakerLine.roman,
    english: exercise.speakerLine.english,
    englishContextual: exercise.speakerLine.english,
    gender: 'neutral',
    category: 'other',
    audio: { normal: exercise.speakerLine.audio, slow: exercise.speakerLine.audio },
    image: null,
    exerciseTypes: ['LISTEN_REPEAT'],
    notes: '',
  };

  useEffect(() => {
    if (autoplay) {
      const t = setTimeout(async () => {
        await audioService.playPhrase(speakerPhrase, 'normal');
        setRecordEnabled(true);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [exercise.id]);

  useEffect(() => {
    return () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); };
  }, []);

  const handleResult = (transcript: string) => {
    const result = scoringService.score(transcript, expectedPhrase, 0.65);
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
      setFeedbackMsg(`The answer: "${expectedPhrase.roman}"`);
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
    <Animated.View entering={FadeIn} style={styles.container}>
      {/* Scene indicator */}
      <View style={styles.sceneIndicator}>
        <Text style={[styles.sceneText, { color: '#D97706' }]}>
          Scene {turnNumber} of {totalTurns}
        </Text>
      </View>

      {/* Speaker card */}
      <View style={[styles.speakerCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
        <Text style={[styles.speakerLabel, { color: '#92400E' }]}>Your neighbor says</Text>
        <Text style={[styles.speakerRoman, { color: '#78350F' }]}>{exercise.speakerLine.roman}</Text>
        <Text style={[styles.speakerEnglish, { color: '#92400E' }]}>{exercise.speakerLine.english}</Text>
        <AudioButton phrase={speakerPhrase} speed="normal" size="small" />
      </View>

      {/* Prompt */}
      <View style={[styles.promptCard, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
        <Text style={[styles.promptLabel, { color: '#166534' }]}>Your turn</Text>
        <Text style={[styles.promptText, { color: '#14532D' }]}>{exercise.prompt}</Text>
      </View>

      {/* Hint */}
      {exercise.hint && (
        <HintRevealer hint={exercise.hint} />
      )}

      {/* Record */}
      <RecordButton
        onResult={handleResult}
        disabled={!recordEnabled || feedbackType === 'success'}
      />

      {!recordEnabled && (
        <Text style={[styles.waitText, { color: colors.mutedForeground }]}>
          Listen first...
        </Text>
      )}

      {/* Feedback */}
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 20,
    alignItems: 'center',
  },
  sceneIndicator: {
    alignSelf: 'flex-end',
  },
  sceneText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  speakerCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  speakerLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  speakerRoman: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  speakerEnglish: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  promptCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  promptLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  promptText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  waitText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontStyle: 'italic',
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
