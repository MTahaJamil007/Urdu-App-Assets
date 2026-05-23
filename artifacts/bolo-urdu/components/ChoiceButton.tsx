import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';

interface ChoiceButtonProps {
  label: string;
  isSelected: boolean;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function ChoiceButton({
  label,
  isSelected,
  isCorrect,
  isIncorrect,
  onPress,
  disabled,
}: ChoiceButtonProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.95, {}, () => { scale.value = withSpring(1); });
    onPress();
  };

  let bgColor = colors.card;
  let borderColor = colors.border;
  let textColor = colors.foreground;

  if (isCorrect) {
    bgColor = '#DCFCE7';
    borderColor = '#16A34A';
    textColor = '#166534';
  } else if (isIncorrect) {
    bgColor = '#FEE2E2';
    borderColor = '#DC2626';
    textColor = '#991B1B';
  } else if (isSelected) {
    borderColor = colors.primary;
    bgColor = `${colors.primary}18`;
    textColor = colors.primary;
  }

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.85}
        style={[
          styles.button,
          {
            backgroundColor: bgColor,
            borderColor,
          },
        ]}
      >
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
});
