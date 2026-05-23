import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgressStore } from '@/stores/useProgressStore';
import { useColors } from '@/hooks/useColors';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { userName, setUserName, preferences, setPreference, totalXP, currentStreak, chaptersCompleted, reset } =
    useProgressStore();
  const [nameInput, setNameInput] = useState(userName ?? '');

  const handleSaveName = () => setUserName(nameInput.trim());

  const handleReset = () => {
    Alert.alert(
      'Reset Progress',
      'This will erase ALL your progress — XP, streak, and level completions. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            reset();
            router.replace('/');
          },
        },
      ]
    );
  };

  const chaptersCount = chaptersCompleted.length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: 'star' as const, color: '#D97706', label: 'Total XP', value: String(totalXP) },
            { icon: 'flame' as const, color: '#D97706', label: 'Streak', value: `${currentStreak} days` },
            { icon: 'library' as const, color: colors.primary, label: 'Chapters done', value: String(chaptersCount) },
          ].map(({ icon, color, label, value }, i) => (
            <View key={label}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <View style={styles.statRow}>
                <Ionicons name={icon} size={20} color={color} />
                <Text style={[styles.statLabel, { color: colors.foreground }]}>{label}</Text>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Profile</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              onBlur={handleSaveName}
              onSubmitEditing={handleSaveName}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.nameInput, { color: colors.foreground }]}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Gender */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Pronoun preference</Text>
          <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
            Urdu verb forms change based on the speaker's gender.
          </Text>
          <View style={styles.genderRow}>
            {(['m', 'f', 'na'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setPreference('gender', g)}
                style={[
                  styles.genderBtn,
                  {
                    backgroundColor: preferences.gender === g ? colors.primary : colors.muted,
                    borderColor: preferences.gender === g ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.genderBtnText, { color: preferences.gender === g ? '#fff' : colors.foreground }]}>
                  {g === 'm' ? 'Male' : g === 'f' ? 'Female' : 'Neutral'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Preferences</Text>
          {[
            { key: 'hintsEnabled' as const, label: 'Hints', desc: 'Show hints during exercises' },
            { key: 'audioAutoplay' as const, label: 'Auto-play audio', desc: 'Play audio when exercise loads' },
            { key: 'reduceMotion' as const, label: 'Reduce motion', desc: 'Disable animations' },
          ].map(({ key, label, desc }, i) => (
            <View
              key={key}
              style={[styles.prefRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.prefInfo}>
                <Text style={[styles.prefLabel, { color: colors.foreground }]}>{label}</Text>
                <Text style={[styles.prefDesc, { color: colors.mutedForeground }]}>{desc}</Text>
              </View>
              <Switch
                value={preferences[key]}
                onValueChange={(val) => setPreference(key, val)}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* Reset */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.destructive }]}>Danger zone</Text>
          <TouchableOpacity
            onPress={handleReset}
            style={[styles.resetBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
          >
            <Ionicons name="trash-outline" size={20} color={colors.destructive} />
            <Text style={[styles.resetBtnText, { color: colors.destructive }]}>Reset all progress</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 24 },
  statsCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  statValue: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  sectionDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, marginTop: -4 },
  inputWrapper: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16 },
  nameInput: { fontSize: 16, fontFamily: 'Inter_400Regular', paddingVertical: 14 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  genderBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  prefInfo: { flex: 1, gap: 2 },
  prefLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  prefDesc: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  resetBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
