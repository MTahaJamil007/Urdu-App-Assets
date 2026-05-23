import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PathView } from '@/components/PathView';
import { StreakBadge } from '@/components/StreakBadge';
import { XPCounter } from '@/components/XPCounter';
import { contentService } from '@/services/contentService';
import { useProgressStore } from '@/stores/useProgressStore';
import { useUserStore } from '@/stores/useUserStore';
import { ChapterManifestEntry } from '@/types/chapter';
import { useColors } from '@/hooks/useColors';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const scrollRef = useRef<ScrollView>(null);

  const { currentStreak, totalXP, userName, setUserName, getCurrentLevel, preferences } = useProgressStore();
  const { hasCompletedOnboarding, completeOnboarding } = useUserStore();

  const [chapters, setChapters] = useState<ChapterManifestEntry[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(!hasCompletedOnboarding);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const manifest = contentService.loadManifest();
    setChapters(manifest.chapters);
  }, []);

  const currentLevel = getCurrentLevel();

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleLevelPress = (levelId: string, chapterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/level/${levelId}`);
  };

  const handleLevelLocked = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showToast('Complete the previous level first');
  };

  const handleOnboardingDone = () => {
    if (nameInput.trim()) setUserName(nameInput.trim());
    completeOnboarding();
    setShowOnboarding(false);
  };

  const greeting = userName
    ? `Assalam alaikum, ${userName}!`
    : 'Assalam alaikum!';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Onboarding Modal */}
      <Modal visible={showOnboarding} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIconRow, { backgroundColor: `${colors.primary}18` }]}>
              <Text style={styles.modalEmoji}>🇵🇰</Text>
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Welcome to Bolo
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              Learn to speak Pakistani Urdu. What's your name?
            </Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Your name (optional)"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.nameInput,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.background,
                },
              ]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleOnboardingDone}
            />
            <TouchableOpacity
              onPress={handleOnboardingDone}
              style={[styles.startButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.88}
            >
              <Text style={styles.startButtonText}>Start Learning</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {toastMsg && (
        <View style={[styles.toast, { backgroundColor: colors.foreground }]}>
          <Text style={[styles.toastText, { color: colors.background }]}>{toastMsg}</Text>
        </View>
      )}

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 10,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.logo, { color: colors.primary }]}>Bolo</Text>
        </View>
        <View style={styles.headerRight}>
          <StreakBadge streak={currentStreak} />
          <XPCounter xp={totalXP} />
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Greeting */}
      <View style={[styles.greetingBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.greeting, { color: colors.foreground }]}>{greeting}</Text>
        {currentLevel && (
          <TouchableOpacity
            onPress={() => router.push(`/level/${currentLevel.levelId}`)}
            style={[styles.continuePill, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.continuePillText}>Continue</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Path */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {chapters.length > 0 && (
          <PathView
            chapters={chapters}
            onLevelPress={handleLevelPress}
            onLevelLocked={handleLevelLocked}
            currentLevelId={currentLevel?.levelId ?? null}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {},
  logo: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsBtn: { padding: 4 },
  greetingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  greeting: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  continuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  continuePillText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 8 },
  toast: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 28,
    gap: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalIconRow: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmoji: {
    fontSize: 36,
  },
  modalTitle: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    width: '100%',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    marginTop: 4,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
});
