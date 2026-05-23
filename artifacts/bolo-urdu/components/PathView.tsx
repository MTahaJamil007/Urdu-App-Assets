import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChapterHeader } from '@/components/ChapterHeader';
import { LevelNode, NodeState } from '@/components/LevelNode';
import { ChapterManifestEntry, ManifestLevel } from '@/types/chapter';
import { useColors } from '@/hooks/useColors';
import { useProgressStore } from '@/stores/useProgressStore';

const HORIZONTAL_OFFSETS = [70, -70, 70, -70, 0];

interface ConnectorProps {
  fromState: NodeState;
  toState: NodeState;
  isBossConnection: boolean;
}

function Connector({ fromState, toState, isBossConnection }: ConnectorProps) {
  const colors = useColors();
  const fromComplete = fromState === 'completed';
  const toUnlocked = toState !== 'locked';

  let dotColor = colors.border;
  if (fromComplete && toUnlocked) {
    dotColor = isBossConnection ? '#D97706' : colors.primary;
  } else if (fromComplete) {
    dotColor = colors.border;
  }

  return (
    <View style={styles.connector}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, { backgroundColor: dotColor }]}
        />
      ))}
    </View>
  );
}

interface PathViewProps {
  chapters: ChapterManifestEntry[];
  onLevelPress: (levelId: string, chapterId: string) => void;
  onLevelLocked: () => void;
  currentLevelId: string | null;
}

export function PathView({ chapters, onLevelPress, onLevelLocked, currentLevelId }: PathViewProps) {
  const { isLevelUnlocked, isLevelComplete, isChapterComplete } = useProgressStore();

  const getNodeState = useCallback((level: ManifestLevel): NodeState => {
    const unlocked = isLevelUnlocked(level.id);
    if (!unlocked) return 'locked';
    const complete = isLevelComplete(level.id);
    if (complete) return 'completed';
    if (level.id === currentLevelId) return 'current';
    return 'available';
  }, [isLevelUnlocked, isLevelComplete, currentLevelId]);

  return (
    <View style={styles.path}>
      {chapters.map((chapter) => {
        const chapterComplete = isChapterComplete(chapter.id);
        return (
          <View key={chapter.id} style={styles.chapterSection}>
            <ChapterHeader
              number={chapter.number}
              title={chapter.title}
              isComplete={chapterComplete}
            />

            <View style={styles.levelsContainer}>
              {chapter.levels.map((level, index) => {
                const nodeState = getNodeState(level);
                const offset = HORIZONTAL_OFFSETS[index] ?? 0;
                const isBoss = level.type === 'BOSS';
                const isLast = index === chapter.levels.length - 1;
                const nextLevel = chapter.levels[index + 1];
                const nextState = nextLevel ? getNodeState(nextLevel) : null;

                return (
                  <View key={level.id} style={styles.levelRow}>
                    <View
                      style={[
                        styles.nodeWrapper,
                        { transform: [{ translateX: offset }] },
                      ]}
                    >
                      <LevelNode
                        level={level}
                        nodeState={nodeState}
                        onPress={() => {
                          if (nodeState === 'locked') {
                            onLevelLocked();
                          } else {
                            onLevelPress(level.id, chapter.id);
                          }
                        }}
                      />
                    </View>

                    {!isLast && nextState && (
                      <Connector
                        fromState={nodeState}
                        toState={nextState}
                        isBossConnection={nextLevel?.type === 'BOSS'}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  path: {
    paddingBottom: 40,
  },
  chapterSection: {
    marginBottom: 12,
  },
  levelsContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  levelRow: {
    alignItems: 'center',
    width: '100%',
  },
  nodeWrapper: {
    paddingVertical: 8,
  },
  connector: {
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
