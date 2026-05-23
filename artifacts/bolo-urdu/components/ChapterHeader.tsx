import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface ChapterHeaderProps {
  number: number;
  title: string;
  isComplete?: boolean;
}

export function ChapterHeader({ number, title, isComplete }: ChapterHeaderProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
      <View style={[styles.pill, { backgroundColor: isComplete ? '#F0FDF4' : colors.muted, borderColor: isComplete ? '#86EFAC' : colors.border }]}>
        <Text style={[styles.text, { color: isComplete ? '#166534' : colors.mutedForeground }]}>
          Chapter {number}: {title}
        </Text>
      </View>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 8,
    gap: 8,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
});
