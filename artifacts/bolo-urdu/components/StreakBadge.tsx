import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: streak > 0 ? '#FEF3C7' : colors.muted }]}>
      <Ionicons name="flame" size={16} color={streak > 0 ? '#D97706' : colors.mutedForeground} />
      <Text style={[styles.text, { color: streak > 0 ? '#92400E' : colors.mutedForeground }]}>
        {streak}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  text: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
