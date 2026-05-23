import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { audioService } from '@/services/audioService';
import { Phrase } from '@/types/phrase';
import { useColors } from '@/hooks/useColors';

interface AudioButtonProps {
  phrase: Phrase;
  speed?: 'normal' | 'slow';
  size?: 'small' | 'large';
}

export function AudioButton({ phrase, speed = 'normal', size = 'large' }: AudioButtonProps) {
  const colors = useColors();
  const [isPlaying, setIsPlaying] = useState(false);
  const scale = useSharedValue(1);

  const dim = size === 'large' ? 64 : 44;
  const iconSize = size === 'large' ? 28 : 20;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async () => {
    if (isPlaying) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.9, {}, () => {
      scale.value = withSpring(1);
    });
    setIsPlaying(true);
    try {
      await audioService.playPhrase(phrase, speed);
    } finally {
      setIsPlaying(false);
    }
  };

  const bgColor = speed === 'slow' ? colors.secondary : colors.primary;
  const iconColor = speed === 'slow' ? colors.primary : '#fff';

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={isPlaying}
        style={[
          styles.button,
          {
            width: dim,
            height: dim,
            borderRadius: dim / 2,
            backgroundColor: bgColor,
          },
        ]}
        activeOpacity={0.85}
      >
        {isPlaying ? (
          <ActivityIndicator color={iconColor} size="small" />
        ) : (
          <Ionicons
            name={speed === 'slow' ? 'turtle-outline' : 'volume-high'}
            size={iconSize}
            color={iconColor}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
