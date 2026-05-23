import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';

interface HintRevealerProps {
  hint: string;
  onReveal?: () => void;
}

export function HintRevealer({ hint, onReveal }: HintRevealerProps) {
  const colors = useColors();
  const [revealed, setRevealed] = useState(false);

  const handleReveal = () => {
    setRevealed(true);
    onReveal?.();
  };

  if (revealed) {
    return (
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={[styles.hintCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}
      >
        <Ionicons name="bulb" size={16} color="#D97706" />
        <Text style={[styles.hintText, { color: '#92400E' }]}>{hint}</Text>
      </Animated.View>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleReveal}
      style={[styles.hintButton, { borderColor: colors.border }]}
    >
      <Ionicons name="bulb-outline" size={16} color={colors.mutedForeground} />
      <Text style={[styles.hintButtonText, { color: colors.mutedForeground }]}>Show hint</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'center',
  },
  hintButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  hintText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
});
