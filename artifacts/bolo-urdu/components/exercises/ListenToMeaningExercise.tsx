import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AudioButton } from '@/components/AudioButton';
import { ChoiceButton } from '@/components/ChoiceButton';
import { HintRevealer } from '@/components/HintRevealer';
import { audioService } from '@/services/audioService';
import { ExerciseResult } from '@/types/exercise';
import { ListenToMeaningExercise as LTMExercise } from '@/types/exercise';
import { Phrase } from '@/types/phrase';
import { shuffle } from '@/utils/shuffle';
import { useColors } from '@/hooks/useColors';
import { config } from '@/constants/config';

interface ListenToMeaningExerciseProps {
  exercise: LTMExercise;
  allPhrases: Phrase[];
  onResult: (result: ExerciseResult) => void;
  autoplay: boolean;
}

type FeedbackState = 'idle' | 'correct' | 'incorrect';

export function ListenToMeaningExercise({
  exercise,
  allPhrases,
  onResult,
  autoplay,
}: ListenToMeaningExerciseProps) {
  const colors = useColors();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [attempts, setAttempts] = useState(0);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const phraseMap = useMemo(() => {
    const map: Record<string, Phrase> = {};
    allPhrases.forEach((p) => { map[p.id] = p; });
    return map;
  }, [allPhrases]);

  const targetPhrase = phraseMap[exercise.phraseId];

  const options = useMemo(() => {
    const distractors = exercise.distractorPhraseIds
      .map((id) => phraseMap[id])
      .filter(Boolean);
    return shuffle([targetPhrase, ...distractors.slice(0, 2)]);
  }, [exercise.id]);

  useEffect(() => {
    if (autoplay && targetPhrase) {
      const t = setTimeout(() => audioService.playPhrase(targetPhrase, 'normal'), 300);
      return () => clearTimeout(t);
    }
  }, [exercise.id]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const handleSelect = (phraseId: string) => {
    if (feedback !== 'idle' || selectedId) return;
    setSelectedId(phraseId);
  };

  const handleCheck = () => {
    if (!selectedId) return;
    const isCorrect = selectedId === targetPhrase.id;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (isCorrect) {
      setFeedback('correct');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      advanceTimer.current = setTimeout(() => {
        onResult({
          exerciseId: exercise.id,
          passed: true,
          score: newAttempts === 1 ? 1.0 : 0.5,
          attempts: newAttempts,
          timestamp: Date.now(),
        });
      }, config.AUTO_ADVANCE_DELAY);
    } else {
      setFeedback('incorrect');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (newAttempts >= config.MAX_ATTEMPTS) {
        advanceTimer.current = setTimeout(() => {
          onResult({
            exerciseId: exercise.id,
            passed: false,
            score: 0,
            attempts: newAttempts,
            timestamp: Date.now(),
          });
        }, config.AUTO_ADVANCE_DELAY);
      } else {
        setTimeout(() => {
          setFeedback('idle');
          setSelectedId(null);
        }, config.FEEDBACK_DELAY);
      }
    }
  };

  if (!targetPhrase) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.prompt, { color: colors.foreground }]}>{exercise.prompt}</Text>
        <AudioButton phrase={targetPhrase} speed="normal" size="large" />
      </View>

      <Animated.View entering={FadeIn} style={styles.choices}>
        {options.map((phrase) => (
          <ChoiceButton
            key={phrase.id}
            label={phrase.englishContextual}
            isSelected={selectedId === phrase.id}
            isCorrect={feedback !== 'idle' && phrase.id === targetPhrase.id}
            isIncorrect={feedback === 'incorrect' && selectedId === phrase.id && phrase.id !== targetPhrase.id}
            onPress={() => handleSelect(phrase.id)}
            disabled={feedback === 'correct'}
          />
        ))}
      </Animated.View>

      {exercise.hint && feedback === 'incorrect' ? (
        <HintRevealer hint={exercise.hint} />
      ) : null}

      {feedback === 'idle' && (
        <TouchableOpacity
          onPress={handleCheck}
          disabled={!selectedId}
          style={[
            styles.checkButton,
            {
              backgroundColor: selectedId ? colors.primary : colors.muted,
            },
          ]}
          activeOpacity={0.85}
        >
          <Text style={[styles.checkButtonText, { color: selectedId ? '#fff' : colors.mutedForeground }]}>
            Check
          </Text>
        </TouchableOpacity>
      )}

      {feedback === 'correct' && (
        <View style={[styles.feedbackBanner, { backgroundColor: '#DCFCE7', borderColor: '#16A34A' }]}>
          <Text style={[styles.feedbackText, { color: '#166534' }]}>Correct! Bohot accha!</Text>
        </View>
      )}

      {feedback === 'incorrect' && attempts < config.MAX_ATTEMPTS && (
        <View style={[styles.feedbackBanner, { backgroundColor: '#FEE2E2', borderColor: '#DC2626' }]}>
          <Text style={[styles.feedbackText, { color: '#991B1B' }]}>
            Not quite — {config.MAX_ATTEMPTS - attempts} {config.MAX_ATTEMPTS - attempts === 1 ? 'try' : 'tries'} left
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
  header: {
    alignItems: 'center',
    gap: 16,
  },
  prompt: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  choices: {
    width: '100%',
    gap: 12,
  },
  checkButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  checkButtonText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
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
  },
});
