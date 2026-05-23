import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ManifestLevel } from '@/types/chapter';
import { useColors } from '@/hooks/useColors';

export type NodeState = 'locked' | 'available' | 'completed' | 'current';

interface LevelNodeProps {
  level: ManifestLevel;
  nodeState: NodeState;
  onPress: () => void;
}

export function LevelNode({ level, nodeState, onPress }: LevelNodeProps) {
  const colors = useColors();
  const isBoss = level.type === 'BOSS';
  const size = isBoss ? 80 : 64;
  const isCurrent = nodeState === 'current';

  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isCurrent) {
      scale.value = withRepeat(
        withSequence(withTiming(1.08, { duration: 700 }), withTiming(1, { duration: 700 })),
        -1,
        false
      );
      glowOpacity.value = withRepeat(
        withSequence(withTiming(0.5, { duration: 700 }), withTiming(0, { duration: 700 })),
        -1,
        false
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(glowOpacity);
      scale.value = withTiming(1);
      glowOpacity.value = withTiming(0);
    }
    return () => {
      cancelAnimation(scale);
      cancelAnimation(glowOpacity);
    };
  }, [isCurrent]);

  const nodeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const isUnlocked = nodeState !== 'locked';

  let bgColor = colors.muted;
  let borderColor = colors.border;
  let iconColor = colors.mutedForeground;

  if (isUnlocked) {
    bgColor = isBoss ? '#D97706' : colors.primary;
    borderColor = isBoss ? '#B45309' : '#0D655E';
    iconColor = '#fff';
  }

  const glowColor = isBoss ? 'rgba(217,119,6,0.35)' : 'rgba(15,118,110,0.35)';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <View style={styles.wrapper}>
      {/* Glow ring */}
      {isCurrent && (
        <Animated.View
          style={[
            styles.glow,
            {
              width: size + 24,
              height: size + 24,
              borderRadius: (size + 24) / 2,
              backgroundColor: glowColor,
            },
            glowStyle,
          ]}
        />
      )}

      <Animated.View style={nodeStyle}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={isUnlocked ? 0.85 : 1}
          style={[
            styles.node,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: bgColor,
              borderColor,
            },
          ]}
        >
          {nodeState === 'locked' && (
            <Ionicons name="lock-closed" size={isBoss ? 28 : 22} color={colors.mutedForeground} />
          )}
          {nodeState === 'completed' && !isBoss && (
            <Ionicons name="checkmark" size={26} color="#fff" />
          )}
          {nodeState === 'completed' && isBoss && (
            <MaterialCommunityIcons name="crown" size={32} color="#fff" />
          )}
          {nodeState === 'available' && !isBoss && (
            <Text style={styles.levelNum}>{level.number}</Text>
          )}
          {nodeState === 'available' && isBoss && (
            <MaterialCommunityIcons name="crown" size={32} color="#fff" />
          )}
          {nodeState === 'current' && !isBoss && (
            <Ionicons name="play" size={24} color="#fff" />
          )}
          {nodeState === 'current' && isBoss && (
            <MaterialCommunityIcons name="crown" size={32} color="#fff" />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Level title below node */}
      <Text
        style={[
          styles.label,
          { color: isUnlocked ? colors.foreground : colors.mutedForeground },
          isBoss && styles.bossLabel,
        ]}
        numberOfLines={1}
      >
        {isBoss ? 'BOSS' : level.title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 6,
  },
  glow: {
    position: 'absolute',
    alignSelf: 'center',
  },
  node: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  levelNum: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    maxWidth: 90,
  },
  bossLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    color: '#D97706',
  },
});
