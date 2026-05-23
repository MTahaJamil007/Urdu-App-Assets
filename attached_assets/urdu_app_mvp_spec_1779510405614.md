# Urdu Learning App — MVP Implementation Specification

**Version:** 1.0
**Status:** Ready for development
**Target:** Functional Android prototype demonstrating the full pedagogical loop on 10 lessons
**Timeline:** 6–8 weeks part-time (solo developer with AI coding assistance)
**Budget:** $0 cash; native-speaker audio recording in-house
**Codename:** *Bolo* (Urdu: "speak") — working title, change at will

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack & Rationale](#2-tech-stack--rationale)
3. [Architecture](#3-architecture)
4. [Project Structure](#4-project-structure)
5. [Data Models & TypeScript Types](#5-data-models--typescript-types)
6. [Screen-by-Screen Specifications](#6-screen-by-screen-specifications)
7. [Exercise Engine](#7-exercise-engine)
8. [Speech Recognition & Scoring](#8-speech-recognition--scoring)
9. [Audio Asset Pipeline](#9-audio-asset-pipeline)
10. [State Management & Storage](#10-state-management--storage)
11. [Visual Design System](#11-visual-design-system)
12. [Build Sequence (Sprints)](#12-build-sequence-sprints)
13. [Definition of Done — MVP](#13-definition-of-done--mvp)
14. [Out of Scope for MVP](#14-out-of-scope-for-mvp)
15. [Known Risks & Mitigations](#15-known-risks--mitigations)

---

## 1. Product Overview

### 1.1 Product Statement

A mobile app that teaches spoken Urdu to heritage learners through an audio-first, speak-back-driven curriculum, starting from greetings and progressing through Stage 1 of a 60-lesson roadmap.

### 1.2 MVP Success Criteria

The MVP is "done" when a user can:

1. Open the app and see 10 lessons (only Lesson 1 unlocked initially).
2. Complete Lesson 1 through a sequence of mixed exercise types.
3. Hear a phrase, see the meaning, repeat it aloud, and receive feedback.
4. Earn XP and see a streak counter increase.
5. Unlock Lesson 2 upon passing Lesson 1's mastery check.
6. Resume their progress when reopening the app.
7. Replay any completed lesson at any time.

A "demo-ready" MVP means a non-technical observer (potential investor, friend, professor) can pick up the phone and complete a lesson without instruction.

### 1.3 Non-Goals for MVP

- iOS support (Android-only initially; iOS port is a later sprint)
- User accounts / cloud sync (everything local)
- Multiple users on one device
- Social / leaderboard features
- Push notifications
- In-app purchases
- Nastaliq script display in exercises (data carries it; UI hides it)
- Pronunciation phoneme-level scoring (intelligibility scoring only)
- Lesson editor / CMS
- Analytics dashboard (basic local logs only)

---

## 2. Tech Stack & Rationale

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Expo SDK 51+** (React Native) | Cross-platform later; OTA updates; free; rich ecosystem |
| Language | **TypeScript** (strict mode) | Catches errors AI coders introduce; self-documenting schemas |
| Navigation | **expo-router** (file-based) | Modern, simple, replaces react-navigation boilerplate |
| State | **Zustand** + **AsyncStorage** | Lightweight, no Redux ceremony; persists trivially |
| Audio playback | **expo-av** | Standard, handles m4a files reliably |
| Speech recognition | **@react-native-voice/voice** | Wraps free on-device ASR; supports Urdu (`ur-PK`) |
| Text-to-speech (fallback) | **expo-speech** | Free fallback if a recorded clip is missing |
| Storage | **AsyncStorage** for progress; **bundled JSON** for content | Simpler than SQLite for MVP scale |
| Styling | **NativeWind** (Tailwind for RN) | Fast iteration; declarative; AI coders write Tailwind well |
| Icons | **lucide-react-native** | Clean, free, comprehensive |
| Animations | **react-native-reanimated** (built into Expo) | Smooth feel; needed for streak/XP celebrations |
| Build | **EAS Build** (free tier) | Cloud builds an APK without needing Android Studio |
| Testing | Skip for MVP | Manual testing only; add Jest in Stage 2 build |

### 2.1 Why NOT Replit for the actual MVP build

Replit's mobile builder is fine for scaffolding, but for a project of this depth — custom speech logic, audio asset management, native module integration — local development with Claude Code in VS Code (or Cursor) is faster, more debuggable, and gives you full git/CI/CD control. Use Replit as an *option* if you're away from your dev machine; treat your local environment as the source of truth.

### 2.2 Why on-device ASR over cloud

- **Free.** No API costs as users multiply.
- **Offline-capable.** Works on a train, in a basement, anywhere.
- **Privacy.** Voice never leaves the device — easy positioning point.
- **Good enough.** Android's built-in `SpeechRecognizer` with `ur-PK` locale produces usable transcripts for our intelligibility-scoring needs.

The cost: accuracy is lower than Whisper-large or Google Cloud Speech. The mitigation: our scoring tolerates ~30% character variance, treating intelligibility (not phonetic perfection) as the success signal.

---

## 3. Architecture

### 3.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      USER (phone)                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  PRESENTATION LAYER                          │
│  Screens (expo-router) — Home, Lesson, Exercise, Result      │
│  Components — PhraseCard, AudioButton, RecordButton, etc.   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    STATE LAYER (Zustand)                     │
│  useProgressStore  •  useLessonStore  •  useUserStore        │
└──────────┬──────────────────────┬───────────────────────────┘
           │                      │
           ▼                      ▼
┌──────────────────────┐  ┌──────────────────────────────────┐
│   CONTENT LAYER      │  │     SERVICES LAYER                │
│  /content/*.json     │  │  • audioService (expo-av)         │
│  loaded at app start │  │  • speechService (Voice)          │
│                      │  │  • scoringService (similarity)    │
│                      │  │  • storageService (AsyncStorage)  │
└──────────────────────┘  └──────────────────────────────────┘
                                       │
                                       ▼
                          ┌─────────────────────────┐
                          │  DEVICE NATIVE APIs     │
                          │  • Audio playback        │
                          │  • Microphone           │
                          │  • SpeechRecognizer     │
                          │  • Local storage        │
                          └─────────────────────────┘
```

### 3.2 Key Architectural Decisions

1. **Content is bundled, not fetched.** All 10 lesson JSONs and ~150 audio files ship inside the APK. Pros: works offline, no backend, no latency. Cons: every content fix needs a new APK build. Acceptable trade-off for MVP.

2. **Progress is the only mutable state.** Lessons, phrases, exercises are immutable content. User progress (XP, streak, completed lessons, mastery scores) is the only thing written to AsyncStorage.

3. **Services are pure functions where possible.** `scoringService.score(transcript, expected) → number` has no side effects. Easier to test, easier to debug, easier for AI to refactor.

4. **No backend in MVP.** Everything is on-device. When (if) we add accounts later, we sync the progress store to a server — but the local-first design means the app never breaks if the backend is down.

---

## 4. Project Structure

```
bolo-urdu/
├── app/                              # expo-router screens
│   ├── _layout.tsx                   # root layout with providers
│   ├── index.tsx                     # home/lesson list
│   ├── lesson/
│   │   ├── [id].tsx                  # lesson intro screen
│   │   ├── exercise.tsx              # active exercise screen
│   │   └── result.tsx                # lesson result/celebration
│   └── settings.tsx                  # user settings
│
├── components/                       # reusable UI
│   ├── AudioButton.tsx               # play audio clip
│   ├── RecordButton.tsx              # record + transcribe
│   ├── PhraseCard.tsx                # display phrase (Urdu/roman/English)
│   ├── ChoiceButton.tsx              # multiple-choice option
│   ├── ProgressBar.tsx               # lesson progress indicator
│   ├── StreakBadge.tsx               # streak display
│   ├── XPCounter.tsx                 # XP display
│   ├── HintRevealer.tsx              # toggleable hint
│   └── exercises/                    # exercise-specific components
│       ├── IntroduceExercise.tsx
│       ├── ListenToMeaningExercise.tsx
│       ├── ListenRepeatExercise.tsx
│       └── SpeakExercise.tsx
│
├── content/                          # bundled lesson content
│   ├── lessons/
│   │   ├── lesson_01.json
│   │   ├── lesson_02.json
│   │   └── ... (lessons 3–10)
│   └── manifest.json                 # list of all lessons + order
│
├── assets/
│   ├── audio/
│   │   └── L01/
│   │       ├── L01-001-normal.m4a
│   │       ├── L01-001-slow.m4a
│   │       └── ... (~20 files per lesson)
│   ├── images/                       # mascot, icons, illustrations
│   ├── fonts/
│   │   └── NotoNastaliqUrdu-Regular.ttf
│   └── sounds/                       # success/error chimes
│       ├── correct.m4a
│       ├── incorrect.m4a
│       └── lesson_complete.m4a
│
├── services/                         # business logic
│   ├── audioService.ts               # wraps expo-av
│   ├── speechService.ts              # wraps @react-native-voice/voice
│   ├── scoringService.ts             # similarity scoring
│   ├── storageService.ts             # AsyncStorage wrapper
│   └── contentService.ts             # loads lessons from /content
│
├── stores/                           # zustand stores
│   ├── useProgressStore.ts           # XP, streak, completed lessons
│   ├── useLessonStore.ts             # current lesson + exercise state
│   └── useUserStore.ts               # user name, preferences
│
├── types/                            # TypeScript types
│   ├── lesson.ts
│   ├── exercise.ts
│   ├── phrase.ts
│   └── progress.ts
│
├── utils/                            # pure helpers
│   ├── similarity.ts                 # Levenshtein-based fuzzy match
│   ├── urduNormalize.ts              # normalize Urdu strings for comparison
│   ├── shuffle.ts                    # array shuffling
│   └── dateHelpers.ts                # streak date logic
│
├── constants/
│   ├── colors.ts
│   ├── typography.ts
│   └── config.ts                     # app-wide constants
│
├── app.json                          # Expo config
├── babel.config.js
├── tsconfig.json
├── package.json
├── tailwind.config.js
└── README.md
```

---

## 5. Data Models & TypeScript Types

These types are the contract. Every JSON file conforms to them; every component consumes them. Lock these down before writing screens.

### 5.1 `types/phrase.ts`

```typescript
export type Gender = 'm' | 'f' | 'neutral' | 'na';

export type PhraseCategory =
  | 'greeting'
  | 'response'
  | 'courtesy'
  | 'farewell'
  | 'family'
  | 'pronoun'
  | 'number'
  | 'color'
  | 'object'
  | 'food'
  | 'question'
  | 'other';

export type ExerciseType =
  | 'INTRODUCE'        // teach a new phrase
  | 'L_TO_I'           // listen, pick the matching image
  | 'L_TO_M'           // listen, pick the meaning
  | 'LISTEN_REPEAT'    // shadow the audio
  | 'SPEAK';           // produce from English prompt

export interface AudioAssets {
  normal: string;      // path relative to /assets/audio/
  slow: string;        // slower version for replay
}

export interface Phrase {
  id: string;          // e.g. "L01-001"
  lessonId: string;    // e.g. "L01"
  order: number;       // display order within lesson
  urdu: string;        // Nastaliq script
  roman: string;       // Roman Urdu transliteration
  english: string;     // literal English meaning
  englishContextual: string; // pragmatic / natural English equivalent
  gender: Gender;
  category: PhraseCategory;
  audio: AudioAssets;
  image: string | null; // path relative to /assets/images/ or null
  exerciseTypes: ExerciseType[]; // which types this phrase is suitable for
  notes: string;       // teaching notes for hint system
}
```

### 5.2 `types/exercise.ts`

```typescript
import { ExerciseType } from './phrase';

export interface BaseExercise {
  id: string;          // e.g. "L01-EX-001"
  type: ExerciseType;
  phraseId: string;
}

export interface IntroduceExercise extends BaseExercise {
  type: 'INTRODUCE';
}

export interface ListenToMeaningExercise extends BaseExercise {
  type: 'L_TO_M';
  distractorPhraseIds: string[]; // wrong answer options
  prompt: string;
  hint?: string;
}

export interface ListenToImageExercise extends BaseExercise {
  type: 'L_TO_I';
  distractorPhraseIds: string[];
  prompt: string;
  hint?: string;
}

export interface ListenRepeatExercise extends BaseExercise {
  type: 'LISTEN_REPEAT';
}

export interface SpeakExercise extends BaseExercise {
  type: 'SPEAK';
  prompt: string;       // English prompt shown to user
  hint?: string | null; // hint shown on request (often the Roman Urdu)
}

export type Exercise =
  | IntroduceExercise
  | ListenToMeaningExercise
  | ListenToImageExercise
  | ListenRepeatExercise
  | SpeakExercise;

export interface ExerciseResult {
  exerciseId: string;
  passed: boolean;
  score: number;        // 0.0 to 1.0
  attempts: number;     // how many tries used
  transcript?: string;  // for SPEAK/LISTEN_REPEAT — what ASR heard
  timestamp: number;    // epoch ms
}
```

### 5.3 `types/lesson.ts`

```typescript
import { Phrase } from './phrase';
import { Exercise } from './exercise';

export interface Lesson {
  id: string;           // e.g. "L01"
  number: number;       // 1
  title: string;
  subtitle: string;
  goal: string;
  estimatedMinutes: number;
  culturalNote: string;
  passingScore: number; // 0.0 to 1.0 — usually 0.75
  phrases: Phrase[];
  reviewPhraseIds: string[]; // IDs of phrases from earlier lessons to revisit
  exerciseSequence: Exercise[];
  masteryCheck: Exercise[];
  rewards: LessonRewards;
}

export interface LessonRewards {
  xp: number;
  completionMessage: string;
}

export interface LessonManifest {
  lessons: {
    id: string;
    number: number;
    title: string;
    subtitle: string;
    estimatedMinutes: number;
    contentFile: string; // e.g. "lesson_01.json"
  }[];
}
```

### 5.4 `types/progress.ts`

```typescript
import { ExerciseResult } from './exercise';

export interface LessonProgress {
  lessonId: string;
  startedAt: number | null;
  completedAt: number | null;
  bestScore: number;       // best mastery check score, 0.0 to 1.0
  attemptCount: number;
  exerciseResults: ExerciseResult[];
}

export interface UserProgress {
  userName: string | null;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null; // ISO date string YYYY-MM-DD
  lessonsCompleted: string[];      // lesson IDs in completion order
  lessonProgress: Record<string, LessonProgress>; // keyed by lesson ID
  preferences: UserPreferences;
}

export interface UserPreferences {
  gender: 'm' | 'f' | 'na'; // affects which phrases shown in mixed exercises
  hintsEnabled: boolean;
  audioAutoplay: boolean;
  reduceMotion: boolean;
}
```

---

## 6. Screen-by-Screen Specifications

### 6.1 Home Screen (`app/index.tsx`)

**Purpose:** Lesson list, progress overview, entry point.

**Layout (top to bottom):**

1. Header bar — app logo + streak badge + XP counter
2. Greeting strip — *"Assalam alaikum, [name]"* if name set; otherwise generic
3. "Continue learning" card — large, prominent, shows current lesson if mid-progress
4. Lesson list — scrollable vertical list of all 10 lessons:
   - Each row: lesson number, title, status icon (locked / available / completed), best score
   - Locked lessons grayed out with a small lock icon
   - Available next lesson highlighted
   - Completed lessons show a checkmark
5. Footer — small "Settings" link

**Interactions:**
- Tap an available or completed lesson → navigate to `lesson/[id]`
- Tap a locked lesson → small toast "Complete Lesson X first"
- Tap Settings → settings screen

**Empty states:**
- First open: no streak, no XP, only Lesson 1 unlocked, show a friendly onboarding card prompting for name

### 6.2 Lesson Intro Screen (`app/lesson/[id].tsx`)

**Purpose:** Set expectations before starting exercises.

**Layout:**
1. Back button (top-left)
2. Lesson number + title
3. Goal statement (1 sentence)
4. "You'll learn" preview — show 4–6 phrase chips (Roman Urdu only)
5. Cultural note card (collapsible)
6. Estimated time + XP reward
7. Big "Start" button (or "Continue" if mid-progress, "Replay" if completed)

**Interactions:**
- Start → navigate to `lesson/exercise`, beginning at the first exercise
- Continue → navigate to `lesson/exercise`, resuming from the last unfinished exercise

### 6.3 Exercise Screen (`app/lesson/exercise.tsx`)

**Purpose:** The core lesson loop. This screen is where ~80% of user time is spent.

**Layout (top to bottom):**
1. Progress bar — % of current lesson's exercises completed
2. Exercise-type-specific UI (see §7 for each type)
3. Footer action button (Continue / Check / Submit)

**State machine:**

```
[Exercise Loaded] → [User Interacts] → [User Submits] →
  → if correct → [Show Success Feedback] → [Auto-advance after 1.5s]
  → if incorrect → [Show Correction Feedback] → [Allow Retry up to 3x]
    → after 3rd fail → [Reveal Correct Answer] → [Continue with soft-fail recorded]
```

**Visual feedback:**
- Correct: green flash, soft chime, brief "Bohot accha!" / "Shabash!" toast
- Incorrect: gentle red shake, soft "try again" sound, hint becomes available
- Soft-fail: subtle yellow indicator, no celebration, advance anyway

**Edge cases:**
- App backgrounded mid-exercise → state is preserved; on resume show the current exercise
- Mic permission denied for SPEAK exercise → graceful fallback to "I said it" self-report button (lower XP)
- Audio file missing → fall back to expo-speech TTS with a small "(generated voice)" label

### 6.4 Result Screen (`app/lesson/result.tsx`)

**Purpose:** Celebrate completion; communicate progression.

**Layout:**
1. Confetti animation (skip if reduceMotion preference set)
2. "Lesson Complete!" headline
3. Score (e.g. "5 out of 6 correct")
4. XP earned animation
5. Streak update if applicable
6. New ability statement — e.g. *"You can now greet people in Urdu, ask how they are, and say goodbye"*
7. Next lesson preview card
8. Two buttons: "Continue to Lesson 2" / "Back to Home"

**Soft-fail handling:**
- If score < passingScore (0.75): show encouraging message, allow retry, don't unlock next lesson
- If score >= passingScore: unlock next lesson, save completion

### 6.5 Settings Screen (`app/settings.tsx`)

**Purpose:** Minimal preferences.

**Fields:**
- User name (text input)
- Gender for personalized phrasing (radio: m / f / prefer not to say)
- Hints enabled (toggle)
- Audio autoplay (toggle)
- Reduce motion (toggle)
- (Debug-only, hidden in production): Reset all progress button

---

## 7. Exercise Engine

### 7.1 The Core Loop

```typescript
// Pseudocode for the exercise screen's logic
const currentExercise = lesson.exerciseSequence[currentIndex];

switch (currentExercise.type) {
  case 'INTRODUCE':
    return <IntroduceExercise phrase={getPhrase(currentExercise.phraseId)} onDone={advance} />;
  case 'L_TO_M':
    return <ListenToMeaningExercise exercise={currentExercise} onResult={handleResult} />;
  case 'LISTEN_REPEAT':
    return <ListenRepeatExercise exercise={currentExercise} onResult={handleResult} />;
  case 'SPEAK':
    return <SpeakExercise exercise={currentExercise} onResult={handleResult} />;
  // ...
}

function handleResult(result: ExerciseResult) {
  storeResult(result);
  if (result.passed || result.attempts >= 3) {
    advance();
  } else {
    showHint();
  }
}
```

### 7.2 Exercise Type Specifications

#### 7.2.1 INTRODUCE

**Purpose:** First exposure to a phrase. No interaction required besides "got it."

**UI:**
- Large card with the Roman Urdu (e.g. "Assalam alaikum")
- Small English translation below
- Big play button (auto-plays once on load)
- "Play slowly" secondary button
- "Got it" button at bottom

**No scoring — always passes.**

#### 7.2.2 L_TO_M (Listen → Meaning)

**Purpose:** Recognition. Hear it, identify what it means.

**UI:**
- "Tap to hear" play button at top
- Prompt text: "What does this mean?"
- 3 answer buttons (English meanings — the target + 2 distractors, shuffled)
- (Optional) hint button if hint provided

**Scoring:**
- Correct = 1.0
- Incorrect = 0.0
- One retry allowed after a wrong answer (replaces wrong option with another distractor)

**Behavior:**
- Auto-play audio on screen load (respecting user preference)
- Tap the audio button to replay

#### 7.2.3 LISTEN_REPEAT (Shadowing)

**Purpose:** Pronunciation + rhythm. Hear, repeat, get loose scoring.

**UI:**
- Play button — large, central
- Below: "Now you say it" prompt
- Record button — tap to record, tap again to stop, OR press-and-hold
- Visual: a waveform or pulsing dot while recording
- Feedback area appears after recording stops

**Scoring (intelligibility-based, lenient):**
- 90%+ similarity = "Excellent!" 1.0
- 70–89% = "Good!" 0.8
- 50–69% = "Almost — try again" 0.5 (retry available)
- <50% = "Let's try again" 0.0 (retry available)

**Mechanics:**
1. User taps play, audio plays
2. After audio ends, record button becomes active
3. User records
4. Recording sent to `speechService` → returns transcript
5. `scoringService.score(transcript, phrase.roman)` returns score
6. Result displayed; if passing, auto-advance after 1.5s

#### 7.2.4 SPEAK (Production)

**Purpose:** Active production. Show English, user speaks Urdu.

**UI:**
- English prompt at top (e.g. "Say: 'I am fine'")
- Hint button (if hint provided) — reveals Roman Urdu on tap (penalty: max score capped at 0.7 if used)
- Big record button below
- Feedback area appears after recording

**Scoring (stricter than LISTEN_REPEAT):**
- 90%+ = "Bohot accha!" 1.0
- 80–89% = "Accha!" 0.85
- 70–79% = "Theek hai" 0.7 — passes
- <70% = retry, then reveal on third fail with soft-fail score 0.3

**Mechanics:** Same flow as LISTEN_REPEAT but without the "listen first" step.

### 7.3 Exercise Sequencing Logic

Lessons define `exerciseSequence` as a fixed ordered list. The engine doesn't randomize order — the curriculum has deliberately sequenced introductions, drills, and reviews. **Don't shuffle this.**

Within an exercise, however, distractor options ARE shuffled per-attempt to prevent rote memorization of button positions.

---

## 8. Speech Recognition & Scoring

### 8.1 Speech Recognition

Wraps `@react-native-voice/voice`:

```typescript
// services/speechService.ts
import Voice from '@react-native-voice/voice';

interface SpeechResult {
  transcript: string;
  confidence: number; // 0–1; not all devices return this reliably
  duration: number;   // ms
}

export const speechService = {
  async startRecording(): Promise<void> {
    await Voice.start('ur-PK'); // Pakistani Urdu locale
  },

  async stopRecording(): Promise<SpeechResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      Voice.onSpeechResults = (e) => {
        const transcript = e.value?.[0] ?? '';
        const duration = Date.now() - startTime;
        resolve({ transcript, confidence: 0.5, duration });
      };
      Voice.onSpeechError = (e) => reject(e);
      Voice.stop();
    });
  },

  isAvailable(): Promise<boolean> {
    return Voice.isAvailable();
  }
};
```

**Important caveats:**
- Some Android devices return Urdu transcripts in Nastaliq script; others in Roman. Our scoring must handle both.
- On-device ASR quality varies *significantly* by Android OEM (Samsung > Pixel > Xiaomi > others typically). Test on at least 2 devices.
- iOS version (later) will use a different underlying API but the wrapper interface stays the same.

### 8.2 Scoring Algorithm

The heart of the intelligibility check. Pure function, easy to test.

```typescript
// utils/similarity.ts

/** Normalize Urdu/Roman strings for comparison. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?؟،]/g, '')         // punctuation
    .replace(/\s+/g, ' ')              // whitespace
    .trim();
}

/** Standard Levenshtein distance. */
export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/** Similarity score 0..1 — 1 means identical, 0 means completely different. */
export function similarity(a: string, b: string): number {
  const aN = normalize(a);
  const bN = normalize(b);
  if (!aN && !bN) return 1;
  if (!aN || !bN) return 0;
  const maxLen = Math.max(aN.length, bN.length);
  const dist = levenshtein(aN, bN);
  return 1 - dist / maxLen;
}
```

### 8.3 The Roman ↔ Urdu Script Problem

ASR may return either Roman Urdu or Nastaliq. The phrase data has both. The scoring service tries both:

```typescript
// services/scoringService.ts
import { similarity } from '../utils/similarity';
import { Phrase } from '../types/phrase';

export interface ScoringResult {
  score: number;          // 0..1
  passed: boolean;
  matchedAgainst: 'roman' | 'urdu' | 'neither';
  transcript: string;
}

export const scoringService = {
  score(transcript: string, phrase: Phrase, threshold = 0.70): ScoringResult {
    if (!transcript) return { score: 0, passed: false, matchedAgainst: 'neither', transcript };

    const romanScore = similarity(transcript, phrase.roman);
    const urduScore = similarity(transcript, phrase.urdu);
    const bestScore = Math.max(romanScore, urduScore);

    return {
      score: bestScore,
      passed: bestScore >= threshold,
      matchedAgainst: romanScore >= urduScore ? 'roman' : 'urdu',
      transcript,
    };
  }
};
```

### 8.4 Why This Approach Is Defensible (Not a Hack)

A few sentences for when investors ask:
- We measure **intelligibility**, not phonetic perfection — could a native speaker (or ASR proxy) understand you?
- This is the right metric for heritage learners who want functional speaking ability, not accent elimination.
- The production version (post-MVP) will add SpeechAce or Azure phoneme-level scoring for users who want it.
- Calibrate thresholds based on user-testing data, not theory.

---

## 9. Audio Asset Pipeline

### 9.1 Recording Setup (Zero Budget)

**Equipment:**
- Phone or laptop with a half-decent built-in mic
- A quiet room with soft surfaces (closet with clothes is genuinely the best home studio)
- Free app: Voice Memos (iOS), GoodLuck Recorder (Android), or Audacity (desktop)

**Recording settings:**
- Format: WAV initially, convert to M4A (AAC) for app bundling
- Sample rate: 44.1 kHz
- Channels: Mono
- Bit depth: 16-bit
- Volume: speak at normal conversational volume; 6 inches from mic; no shouting

**Per-phrase output:**
- One "normal speed" recording: natural pace, conversational
- One "slow" recording: deliberate, ~70% speed, every syllable clear

### 9.2 File Naming Convention

```
{LESSON_ID}-{PHRASE_NUM}-{SPEED}.m4a

Examples:
L01-001-normal.m4a   ← Lesson 1, Phrase 001, normal speed
L01-001-slow.m4a     ← Lesson 1, Phrase 001, slow speed
L01-002-normal.m4a
```

Place in `assets/audio/L01/`, `assets/audio/L02/`, etc.

### 9.3 Recording Workflow

1. Open the lesson JSON.
2. For each phrase, record both speeds in one take using the script ("L zero one zero zero one normal: assalam alaikum. L zero one zero zero one slow: as-sa-laam a-lai-kum.")
3. Trim and split using Audacity (free) or a free online splitter.
4. Save with the correct filename.
5. Drop into the assets folder.
6. Run the validation script (see §9.4) to confirm every phrase has both audio files.

### 9.4 Asset Validation Script

```typescript
// scripts/validateAssets.ts
import * as fs from 'fs';
import * as path from 'path';

const lessonsDir = path.join(__dirname, '../content/lessons');
const audioDir = path.join(__dirname, '../assets/audio');

const lessons = fs.readdirSync(lessonsDir)
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(lessonsDir, f), 'utf-8')));

let missing: string[] = [];
for (const lesson of lessons) {
  for (const phrase of lesson.phrases) {
    for (const speed of ['normal', 'slow']) {
      const filePath = path.join(__dirname, '../assets', phrase.audio[speed]);
      if (!fs.existsSync(filePath)) {
        missing.push(filePath);
      }
    }
  }
}

if (missing.length > 0) {
  console.error(`Missing ${missing.length} audio files:`);
  missing.forEach(f => console.error('  ' + f));
  process.exit(1);
}
console.log('All audio assets present.');
```

Run with `npx ts-node scripts/validateAssets.ts` before each build.

### 9.5 TTS Fallback

If an audio file is missing, fall back to `expo-speech`:

```typescript
import * as Speech from 'expo-speech';

Speech.speak(phrase.roman, { language: 'ur-PK', rate: 0.9 });
```

This is meant as a development safety net, not the production path. Real recordings sound 10x better and demos require them.

---

## 10. State Management & Storage

### 10.1 Zustand Stores

#### `useProgressStore`

```typescript
// stores/useProgressStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProgress, LessonProgress } from '../types/progress';
import { ExerciseResult } from '../types/exercise';

interface ProgressState extends UserProgress {
  // actions
  setUserName: (name: string) => void;
  startLesson: (lessonId: string) => void;
  recordExerciseResult: (lessonId: string, result: ExerciseResult) => void;
  completeLesson: (lessonId: string, score: number) => void;
  addXP: (amount: number) => void;
  updateStreak: () => void;
  isLessonUnlocked: (lessonId: string) => boolean;
  reset: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      userName: null,
      totalXP: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      lessonsCompleted: [],
      lessonProgress: {},
      preferences: {
        gender: 'na',
        hintsEnabled: true,
        audioAutoplay: true,
        reduceMotion: false,
      },

      setUserName: (name) => set({ userName: name }),

      startLesson: (lessonId) => set((state) => {
        const existing = state.lessonProgress[lessonId];
        if (existing?.startedAt) return state;
        return {
          lessonProgress: {
            ...state.lessonProgress,
            [lessonId]: {
              lessonId,
              startedAt: Date.now(),
              completedAt: null,
              bestScore: 0,
              attemptCount: 0,
              exerciseResults: [],
            },
          },
        };
      }),

      recordExerciseResult: (lessonId, result) => set((state) => {
        const lp = state.lessonProgress[lessonId];
        if (!lp) return state;
        return {
          lessonProgress: {
            ...state.lessonProgress,
            [lessonId]: {
              ...lp,
              exerciseResults: [...lp.exerciseResults, result],
            },
          },
        };
      }),

      completeLesson: (lessonId, score) => set((state) => {
        const lp = state.lessonProgress[lessonId] ?? {
          lessonId,
          startedAt: Date.now(),
          completedAt: null,
          bestScore: 0,
          attemptCount: 0,
          exerciseResults: [],
        };
        const wasAlreadyComplete = state.lessonsCompleted.includes(lessonId);
        return {
          lessonProgress: {
            ...state.lessonProgress,
            [lessonId]: {
              ...lp,
              completedAt: lp.completedAt ?? Date.now(),
              bestScore: Math.max(lp.bestScore, score),
              attemptCount: lp.attemptCount + 1,
            },
          },
          lessonsCompleted: wasAlreadyComplete
            ? state.lessonsCompleted
            : [...state.lessonsCompleted, lessonId],
        };
      }),

      addXP: (amount) => set((state) => ({ totalXP: state.totalXP + amount })),

      updateStreak: () => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        if (state.lastActivityDate === today) return state;

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const newStreak = state.lastActivityDate === yesterday
          ? state.currentStreak + 1
          : 1;

        return {
          currentStreak: newStreak,
          longestStreak: Math.max(state.longestStreak, newStreak),
          lastActivityDate: today,
        };
      }),

      isLessonUnlocked: (lessonId) => {
        const state = get();
        if (lessonId === 'L01') return true;
        const lessonNum = parseInt(lessonId.slice(1), 10);
        const prevId = `L${(lessonNum - 1).toString().padStart(2, '0')}`;
        return state.lessonsCompleted.includes(prevId);
      },

      reset: () => set({
        userName: null,
        totalXP: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        lessonsCompleted: [],
        lessonProgress: {},
      }),
    }),
    {
      name: 'bolo-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### 10.2 `useLessonStore` (transient — current lesson state)

```typescript
// stores/useLessonStore.ts
import { create } from 'zustand';
import { Lesson } from '../types/lesson';

interface LessonState {
  activeLesson: Lesson | null;
  currentExerciseIndex: number;
  inMasteryCheck: boolean;
  setActiveLesson: (lesson: Lesson) => void;
  advance: () => void;
  startMasteryCheck: () => void;
  reset: () => void;
}

export const useLessonStore = create<LessonState>((set) => ({
  activeLesson: null,
  currentExerciseIndex: 0,
  inMasteryCheck: false,
  setActiveLesson: (lesson) => set({ activeLesson: lesson, currentExerciseIndex: 0, inMasteryCheck: false }),
  advance: () => set((s) => ({ currentExerciseIndex: s.currentExerciseIndex + 1 })),
  startMasteryCheck: () => set({ currentExerciseIndex: 0, inMasteryCheck: true }),
  reset: () => set({ activeLesson: null, currentExerciseIndex: 0, inMasteryCheck: false }),
}));
```

---

## 11. Visual Design System

### 11.1 Color Palette

Warm, friendly, distinctively-not-Duolingo. Pakistani cultural cues without being kitsch.

```typescript
// constants/colors.ts
export const colors = {
  // Primary — deep teal (echoes Pakistani truck art, distinct from Duolingo green)
  primary: '#0F766E',
  primaryLight: '#5EEAD4',
  primaryDark: '#134E4A',

  // Accent — warm gold (chai, sunset, marigold)
  accent: '#D97706',
  accentLight: '#FCD34D',

  // Success / Error
  success: '#16A34A',
  error: '#DC2626',
  warning: '#EAB308',

  // Neutrals
  background: '#FAFAF9',
  surface: '#FFFFFF',
  textPrimary: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#A8A29E',
  border: '#E7E5E4',

  // Special
  cardShadow: 'rgba(15, 23, 42, 0.06)',
};
```

### 11.2 Typography

```typescript
// constants/typography.ts
export const typography = {
  fontFamily: {
    sans: 'System',                            // device default
    nastaliq: 'NotoNastaliqUrdu-Regular',     // bundled font for Urdu
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 22,
    '2xl': 28,
    '3xl': 36,
    '4xl': 48,
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
```

Important: **Urdu Nastaliq is right-to-left.** When you display the `urdu` string, the text component needs `writingDirection: 'rtl'` and `textAlign: 'right'`. Roman Urdu is LTR and uses the default direction.

### 11.3 Component Style Guidelines

- **Buttons:** rounded corners (12px radius), generous padding, subtle press animation
- **Cards:** white surface, soft shadow, 16px radius, 16px internal padding
- **Audio buttons:** circular, large (64px+), prominent color
- **Record buttons:** even larger (80px+), red when active, pulsing animation while recording
- **Spacing:** consistent multiples of 4 (4, 8, 12, 16, 24, 32, 48)

### 11.4 Sound Design

- Correct answer: soft warm chime (~250ms)
- Incorrect: gentle low "uhh" tone (~200ms) — never harsh
- Lesson complete: 3-note ascending celebration
- Recording start: subtle click
- Recording stop: subtle click

Royalty-free sources: freesound.org, ZapSplat, Mixkit.

---

## 12. Build Sequence (Sprints)

Each sprint is roughly 1 week part-time (~10 hours). Adjust to your pace.

### Sprint 0 — Project Setup *(2–3 hours)*
- Initialize Expo project with TypeScript
- Configure expo-router, NativeWind, Zustand, AsyncStorage
- Set up folder structure exactly per §4
- Commit `package.json`, `tsconfig.json`, `tailwind.config.js`, `app.json`
- Verify "hello world" runs on Android device or emulator
- **Definition of done:** App launches and shows a blank home screen

### Sprint 1 — Types and Content Pipeline *(1 week)*
- Define all TypeScript types from §5
- Create `content/lessons/lesson_01.json` (provided)
- Build `contentService.ts` to load lessons
- Create `content/manifest.json` listing all lessons
- Build the asset validation script
- **Definition of done:** App can load and log lesson 1's data; types compile without errors

### Sprint 2 — Home Screen + Lesson List *(1 week)*
- Build `app/index.tsx`
- Create `LessonCard` component
- Wire up `useProgressStore`
- Lock/unlock logic per §10.1
- Streak badge and XP counter components
- **Definition of done:** Home screen displays all 10 lessons with correct lock states

### Sprint 3 — Audio Service + AudioButton *(1 week)*
- Build `audioService.ts` wrapping expo-av
- Build `AudioButton` component (play/pause, slow speed toggle)
- Record audio for Lesson 1 (~20 clips — see §9)
- Bundle audio assets
- Run validation script
- **Definition of done:** Tapping AudioButton plays the correct phrase audio

### Sprint 4 — Exercise Engine + INTRODUCE + L_TO_M *(1.5 weeks)*
- Build `lesson/exercise.tsx` screen
- Implement `IntroduceExercise` and `ListenToMeaningExercise` components
- Wire exercise sequencing through `useLessonStore`
- Result feedback UI
- **Definition of done:** Can complete first half of Lesson 1 using only L_TO_M exercises

### Sprint 5 — Speech Recognition + SPEAK + LISTEN_REPEAT *(1.5 weeks)*
- Build `speechService.ts` with @react-native-voice/voice
- Build `scoringService.ts` and `similarity.ts`
- Implement `SpeakExercise` and `ListenRepeatExercise` components
- Build `RecordButton` with recording animation
- Handle mic permissions
- **Definition of done:** Full Lesson 1 can be completed end-to-end including speaking exercises

### Sprint 6 — Result Screen + Lesson Progression *(1 week)*
- Build `lesson/result.tsx`
- Implement mastery check flow
- Implement lesson unlocking
- XP awarding, streak updates
- Confetti animation
- **Definition of done:** Completing Lesson 1 unlocks Lesson 2; progress persists across app restarts

### Sprint 7 — Content Build-out: Lessons 2–10 *(2 weeks)*
- Author JSON for lessons 2–10 following the lesson 1 template
- Record audio for ~130 additional clips
- Iterate on any UI rough edges discovered while testing real content
- **Definition of done:** All 10 lessons are playable end-to-end

### Sprint 8 — Polish + APK Build *(1 week)*
- Settings screen
- Onboarding screen for first-time users
- Sound effects, animations
- Color polish, font polish
- EAS Build → APK
- Install on a friend's phone, watch them use it
- **Definition of done:** A non-developer can install and complete Lesson 1 unassisted

---

## 13. Definition of Done — MVP

The MVP is shipped when:

- [ ] App installs on Android via APK
- [ ] First-launch onboarding asks for user name and gender preference
- [ ] Home screen lists all 10 lessons with correct lock states
- [ ] User can complete Lesson 1 in 8–12 minutes end-to-end
- [ ] All 4 exercise types work as specified
- [ ] Audio plays for every phrase
- [ ] Speech recognition functions on at least 2 test Android devices
- [ ] Intelligibility scoring returns sensible results
- [ ] XP, streak, and lesson completion persist across app restarts
- [ ] Completing a lesson unlocks the next one
- [ ] All 10 lessons are playable
- [ ] No crashes in 30 minutes of normal use
- [ ] APK size under 100 MB

---

## 14. Out of Scope for MVP

**Explicitly deferred (these will come back):**

- iOS support
- User accounts / cloud sync
- Spaced repetition system (the curriculum has review built in, but no SRS algorithm yet)
- L_TO_I (Listen → Image) exercise type — Lesson 1 doesn't need it, deferred until Lesson 4 (family)
- Lesson editor / CMS
- Native ads
- In-app purchases
- Push notifications
- Sharing / social features
- Leaderboards
- Daily goal customization
- Multiple language support
- Tablet-optimized layouts
- Dark mode (acceptable but not required)
- Accessibility audit (basic only)

**Explicitly NOT in the roadmap (won't ever build):**

- AI conversation partners (out of scope for the heritage-learner positioning)
- Live tutor marketplace
- VR/AR experiences

---

## 15. Known Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Android speech recognition quality varies wildly | High | High | Test on ≥2 devices early (Sprint 5); calibrate threshold; fall back to "I said it" button if recognition fails repeatedly |
| Recording 150 audio clips is more work than expected | Medium | Medium | Start recording Lesson 1 in Sprint 3, in parallel with development; batch-record on weekends |
| User says the right thing but ASR mis-transcribes | High | Medium | Lenient threshold (0.70 default); always allow user to manually mark as "I said it correctly" |
| Permissions prompts deter users | Medium | Medium | Show in-app explanation before requesting mic permission; one-time prompt |
| AsyncStorage corruption / migration headaches | Low | High | Version the storage schema; on read, validate; on corruption, reset gracefully with a clear message |
| Expo SDK upgrade breaks something | Medium | Medium | Pin to the SDK version that works; upgrade deliberately, not automatically |
| Family-recorded audio is inconsistent in volume / tone | High | Low | Use Audacity's Loudness Normalization (free) to bring all clips to a consistent LUFS target |
| Replit Agent generates Replit-specific scaffolding | Medium | Low | If you start in Replit, scan for `@replit/*` packages and remove before going local |

---

## End of MVP Specification
