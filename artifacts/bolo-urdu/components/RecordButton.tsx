import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';

type RecordState = 'idle' | 'recording' | 'confirming';

interface RecordButtonProps {
  onResult: (transcript: string) => void;
  disabled?: boolean;
}

export function RecordButton({ onResult, disabled = false }: RecordButtonProps) {
  const colors = useColors();
  const [state, setState] = useState<RecordState>('idle');
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scale = useSharedValue(1);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimation(scale);
    };
  }, []);

  const startRecording = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setState('recording');
    setCountdown(3);

    scale.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1,
      false
    );

    let count = 3;
    timerRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(timerRef.current!);
        cancelAnimation(scale);
        scale.value = withTiming(1);
        setState('confirming');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 1000);
  };

  const stopEarly = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    cancelAnimation(scale);
    scale.value = withTiming(1);
    setState('confirming');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleYes = () => {
    setState('idle');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onResult('__SELF_REPORT_YES__');
  };

  const handleNo = () => {
    setState('idle');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onResult('__SELF_REPORT_NO__');
  };

  if (state === 'confirming') {
    return (
      <View style={styles.confirmRow}>
        <Text style={[styles.confirmText, { color: colors.foreground }]}>Did you say it?</Text>
        <View style={styles.confirmButtons}>
          <TouchableOpacity
            onPress={handleNo}
            style={[styles.confirmBtn, { backgroundColor: colors.destructive }]}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleYes}
            style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="checkmark" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isRecording = state === 'recording';
  const bgColor = isRecording ? '#DC2626' : colors.primary;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulse,
          { backgroundColor: isRecording ? 'rgba(220,38,38,0.2)' : 'transparent' },
          pulseStyle,
        ]}
      />
      <TouchableOpacity
        onPress={isRecording ? stopEarly : startRecording}
        disabled={disabled}
        style={[styles.button, { backgroundColor: bgColor }]}
        activeOpacity={0.85}
      >
        <Ionicons name={isRecording ? 'stop' : 'mic'} size={36} color="#fff" />
      </TouchableOpacity>
      {isRecording && (
        <Text style={[styles.countdownText, { color: colors.mutedForeground }]}>
          {countdown}s — tap to stop
        </Text>
      )}
      {!isRecording && (
        <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
          Tap to record
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  pulse: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  countdownText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
  },
  hintText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  confirmRow: {
    alignItems: 'center',
    gap: 16,
  },
  confirmText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  confirmBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
