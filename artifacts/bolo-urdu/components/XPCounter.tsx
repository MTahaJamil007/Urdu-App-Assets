import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface XPCounterProps {
  xp: number;
}

export function XPCounter({ xp }: XPCounterProps) {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: '#EFF6FF' }]}>
      <Ionicons name="star" size={16} color="#2563EB" />
      <Text style={[styles.text, { color: '#1E40AF' }]}>{xp} XP</Text>
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
