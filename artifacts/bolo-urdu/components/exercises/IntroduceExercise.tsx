import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AudioButton } from '@/components/AudioButton';
import { audioService } from '@/services/audioService';
import { Phrase } from '@/types/phrase';
import { useColors } from '@/hooks/useColors';

interface IntroduceExerciseProps {
  phrase: Phrase;
  onDone: () => void;
  autoplay: boolean;
}

export function IntroduceExercise({ phrase, onDone, autoplay }: IntroduceExerciseProps) {
  const colors = useColors();

  useEffect(() => {
    if (autoplay) {
      const timer = setTimeout(() => {
        audioService.playPhrase(phrase, 'normal');
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [phrase.id]);

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    audioService.stop();
    onDone();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.typeLabel}>
          <Text style={[styles.typeLabelText, { color: colors.mutedForeground }]}>NEW PHRASE</Text>
        </View>

        <Text style={[styles.roman, { color: colors.foreground }]}>{phrase.roman}</Text>
        <Text style={[styles.english, { color: colors.mutedForeground }]}>
          {phrase.englishContextual}
        </Text>

        {phrase.notes ? (
          <Text style={[styles.notes, { color: colors.mutedForeground, borderColor: colors.border }]}>
            {phrase.notes}
          </Text>
        ) : null}
      </View>

      <View style={styles.audioRow}>
        <AudioButton phrase={phrase} speed="normal" size="large" />
        <AudioButton phrase={phrase} speed="slow" size="small" />
      </View>

      <TouchableOpacity
        onPress={handleDone}
        style={[styles.doneButton, { backgroundColor: colors.primary }]}
        activeOpacity={0.85}
      >
        <Text style={styles.doneButtonText}>Got it</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 32,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  typeLabel: {
    marginBottom: 4,
  },
  typeLabelText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.5,
  },
  roman: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    lineHeight: 42,
  },
  english: {
    fontSize: 18,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  notes: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    width: '100%',
    lineHeight: 18,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  doneButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
});
