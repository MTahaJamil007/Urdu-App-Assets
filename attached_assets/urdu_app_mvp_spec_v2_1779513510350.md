# Bolo — Pakistani Urdu Learning App — MVP Implementation Spec (v2)

**Version:** 2.0 — Chapter/Level structure, Pakistani-only positioning
**Status:** Ready for development
**Target:** Functional Android prototype demonstrating the full pedagogical loop on Chapter 1
**Timeline:** 8–10 weeks part-time
**Budget:** $0 cash

---

## What changed from v1

1. **Data model:** "Lessons" replaced by "Chapters." Each chapter contains 4 short levels + 1 boss level. Chapter 1's old `lesson_01.json` has been restructured into `chapter_01.json` with embedded levels.
2. **Home screen:** Flat list of lessons replaced by a vertical scrolling **path UI** — circles connected by dashed lines, like Duolingo. The current level is highlighted; locked levels are dimmed.
3. **Boss levels:** New exercise type `SCENARIO_TURN` for chained multi-turn scenarios. New visual treatment — larger amber circle on the path, crown icon, distinct celebration on completion.
4. **Positioning:** Pakistani-only throughout. Removed `Adaab` from Chapter 1. Both `Khuda hafiz` and `Allah hafiz` taught as equally Pakistani.
5. **Curriculum doc:** Now references `urdu_app_complete_curriculum_v3.md`.

---

## 1. Product Overview

### 1.1 Statement

A mobile app that teaches Pakistani Urdu to heritage learners through an audio-first, speak-back-driven curriculum, structured as a linear path of chapters with bite-sized levels and a boss challenge at the end of each chapter.

### 1.2 MVP Success Criteria

The MVP is "done" when a user can:

1. Open the app and see the path of Chapter 1 — 4 small circles + 1 large boss circle, with only Level 1.1 unlocked.
2. Complete each level individually (2–3 min each), unlocking the next.
3. Complete the boss to finish Chapter 1 and unlock Chapter 2's first level.
4. Earn XP and see a streak counter increase.
5. Resume from where they left off when reopening the app.
6. Replay any completed level.

A "demo-ready" MVP means a non-technical observer can pick up the phone and complete Level 1.1 + Level 1.2 in under 6 minutes, then understand exactly how the chapter progression works.

### 1.3 MVP Scope

- Chapter 1 fully built (5 levels including boss)
- Chapters 2–10 scaffolded as JSON with placeholder audio (TTS fallback)
- Path UI for all 10 chapters of Stage 1
- All four exercise types working: INTRODUCE, L_TO_M, LISTEN_REPEAT, SPEAK
- Boss level scenario engine (SCENARIO_TURN)
- Streak + XP + lesson lock/unlock + progress persistence

### 1.4 Non-Goals for MVP

Same as v1 spec — iOS, accounts, cloud sync, push notifications, etc.

---

## 2. Tech Stack

Same as v1:
- Expo SDK 51+ with TypeScript strict
- expo-router (file-based navigation)
- Zustand + AsyncStorage
- expo-av (audio playback)
- @react-native-voice/voice (on-device speech recognition)
- expo-speech (TTS fallback)
- NativeWind (Tailwind for RN)
- lucide-react-native (icons)
- react-native-reanimated (animations)
- EAS Build (cloud builds)

---

## 3. Architecture

### 3.1 High-Level

```
┌──────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                          │
│  Screens (expo-router) — Home (Path) ─ Chapter Detail ─        │
│   Level Player ─ Boss Player ─ Result                          │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                    STATE LAYER (Zustand)                       │
│  useProgressStore  •  useChapterStore  •  useUserStore         │
└──────────┬───────────────────────┬───────────────────────────┘
           │                       │
┌──────────▼───────────┐  ┌────────▼─────────────────────────┐
│   CONTENT LAYER      │  │      SERVICES LAYER               │
│  /content/*.json     │  │  audioService  •  speechService   │
│  (chapters w/ levels)│  │  scoringService  •  storageService│
└──────────────────────┘  └────────────────┬──────────────────┘
                                            ▼
                              ┌─────────────────────────┐
                              │  DEVICE NATIVE APIs     │
                              │  audio, mic, ASR, storage│
                              └─────────────────────────┘
```

### 3.2 Key Architectural Decisions

1. **Path is the home screen.** Not a list view, not a card grid. A scrollable vertical path with chapter headers as section breaks.
2. **Levels are leaves; chapters group them.** Lock/unlock logic operates on levels, not chapters. A chapter is "complete" when its boss is complete.
3. **Boss levels are levels too.** Same data shape, just `type: "BOSS"`. Reuses the exercise engine; SCENARIO_TURN is just another exercise type.
4. **Content is bundled; progress is the only mutable state.**

---

## 4. Project Structure

```
bolo-urdu/
├── app/                              # expo-router screens
│   ├── _layout.tsx
│   ├── index.tsx                     # home: path UI
│   ├── chapter/
│   │   └── [chapterId].tsx           # chapter intro screen (optional pre-level overview)
│   ├── level/
│   │   ├── [levelId].tsx             # active level player (handles STANDARD and BOSS)
│   │   └── result.tsx                # level + chapter completion celebration
│   └── settings.tsx
│
├── components/
│   ├── PathView.tsx                  # the scrolling Duolingo-style path
│   ├── LevelNode.tsx                 # circle on the path (standard or boss)
│   ├── ChapterHeader.tsx             # divider showing "Chapter N: Title"
│   ├── AudioButton.tsx
│   ├── RecordButton.tsx
│   ├── ChoiceButton.tsx
│   ├── ProgressBar.tsx
│   ├── StreakBadge.tsx
│   ├── XPCounter.tsx
│   ├── HintRevealer.tsx
│   └── exercises/
│       ├── IntroduceExercise.tsx
│       ├── ListenToMeaningExercise.tsx
│       ├── ListenRepeatExercise.tsx
│       ├── SpeakExercise.tsx
│       └── ScenarioTurnExercise.tsx  # NEW — for boss levels
│
├── content/
│   ├── chapters/
│   │   ├── chapter_01.json
│   │   ├── chapter_02.json
│   │   └── ... through chapter_10.json
│   └── manifest.json                 # list of all chapters in stage order
│
├── assets/
│   ├── audio/
│   │   ├── C01/
│   │   │   ├── C01-001-normal.m4a
│   │   │   ├── C01-001-slow.m4a
│   │   │   ├── ... (10 phrases × 2 speeds = 20 files)
│   │   │   └── scenario/
│   │   │       ├── turn1.m4a
│   │   │       ├── turn2.m4a
│   │   │       ├── turn3.m4a
│   │   │       └── turn4.m4a
│   │   └── ... (C02–C10)
│   ├── images/
│   ├── fonts/
│   │   └── NotoNastaliqUrdu-Regular.ttf
│   └── sounds/
│
├── services/
├── stores/
├── types/
├── utils/
├── constants/
└── ... (config files)
```

---

## 5. Updated Data Models

### 5.1 `types/phrase.ts`

Same as v1, with one addition: `levelId` field on each phrase.

```typescript
export interface Phrase {
  id: string;
  chapterId: string;       // NEW — was lessonId
  levelId: string;         // NEW — which level introduces this phrase
  order: number;
  urdu: string;
  roman: string;
  english: string;
  englishContextual: string;
  gender: Gender;
  category: PhraseCategory;
  audio: AudioAssets;
  image: string | null;
  exerciseTypes: ExerciseType[];
  notes: string;
}
```

### 5.2 `types/exercise.ts`

New exercise type added:

```typescript
export type ExerciseType =
  | 'INTRODUCE'
  | 'L_TO_I'
  | 'L_TO_M'
  | 'LISTEN_REPEAT'
  | 'SPEAK'
  | 'SCENARIO_TURN';      // NEW — for boss levels

export interface ScenarioTurnExercise extends BaseExercise {
  type: 'SCENARIO_TURN';
  speakerLine: {
    audio: string;          // path to the "other speaker's" audio
    urdu: string;
    roman: string;
    english: string;
  };
  expectedPhraseId: string;  // what the user should say
  prompt: string;            // English context shown to user
  hint: string | null;
}

export type Exercise =
  | IntroduceExercise
  | ListenToMeaningExercise
  | ListenToImageExercise
  | ListenRepeatExercise
  | SpeakExercise
  | ScenarioTurnExercise;
```

### 5.3 `types/level.ts` — NEW

```typescript
export type LevelType = 'STANDARD' | 'BOSS';

export interface Level {
  id: string;             // e.g. "L1-1" — globally unique within app
  chapterId: string;      // parent chapter
  number: number;         // 1..5 within chapter
  title: string;
  subtitle: string;
  type: LevelType;
  estimatedMinutes: number;
  newPhraseIds: string[];      // phrases introduced in this level
  reviewPhraseIds: string[];   // phrases revisited from earlier levels
  exerciseSequence: Exercise[];
  scenarioIntro?: string;      // BOSS levels only — pre-scenario framing
  passingScore?: number;       // BOSS levels only — usually 0.75
  rewards: {
    xp: number;
    chapterCompleteBonus?: number; // BOSS levels only
  };
}
```

### 5.4 `types/chapter.ts` — replaces `lesson.ts`

```typescript
import { Phrase } from './phrase';
import { Level } from './level';

export interface Chapter {
  id: string;             // e.g. "C01"
  number: number;
  title: string;
  subtitle: string;
  goal: string;
  estimatedMinutes: number;
  culturalNote: string;
  passingScore: number;   // chapter-level passing — usually 0.75
  phrases: Phrase[];      // all phrases in this chapter (referenced by levels)
  levels: Level[];        // 4 STANDARD + 1 BOSS, ordered
  rewards: {
    xp: number;           // chapter-completion XP
    completionMessage: string;
  };
}

export interface ChapterManifest {
  chapters: {
    id: string;
    number: number;
    stage: 1 | 2 | 3 | 4;
    title: string;
    subtitle: string;
    estimatedMinutes: number;
    contentFile: string;
  }[];
}
```

### 5.5 `types/progress.ts`

Updated to track level-by-level progress:

```typescript
export interface LevelProgress {
  levelId: string;
  chapterId: string;
  startedAt: number | null;
  completedAt: number | null;
  bestScore: number;
  attemptCount: number;
}

export interface ChapterProgress {
  chapterId: string;
  startedAt: number | null;
  completedAt: number | null;  // set when boss is completed
  levelProgress: Record<string, LevelProgress>; // keyed by levelId
}

export interface UserProgress {
  userName: string | null;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  chaptersCompleted: string[];
  chapterProgress: Record<string, ChapterProgress>;
  preferences: UserPreferences;
}
```

### 5.6 Lock / Unlock Logic

```
A LEVEL is unlocked when:
- It's the first level of the first chapter (L1-1 of C01)
  OR
- The previous level (in the same chapter) is completed
  OR
- It's the first level of a chapter whose preceding chapter is completed

A CHAPTER is "completed" when its BOSS level is completed.
A LEVEL is "completed" when its mastery score >= passingScore (default 0.75).
```

```typescript
isLevelUnlocked(levelId: string): boolean {
  // Decompose levelId — e.g. "L1-1" = chapter 1, level 1
  const [chapterPart, levelPart] = levelId.split('-');
  const chapterNum = parseInt(chapterPart.slice(1), 10);
  const levelNum = parseInt(levelPart, 10);

  // First level of first chapter is always unlocked
  if (chapterNum === 1 && levelNum === 1) return true;

  // First level of any other chapter: previous chapter must be complete
  if (levelNum === 1) {
    const prevChapterId = `C${(chapterNum - 1).toString().padStart(2, '0')}`;
    return this.chaptersCompleted.includes(prevChapterId);
  }

  // Any other level: previous level in same chapter must be complete
  const prevLevelId = `L${chapterNum}-${levelNum - 1}`;
  return this.isLevelComplete(prevLevelId);
}
```

---

## 6. Screen Specifications

### 6.1 Home (Path View) — `app/index.tsx`

This is the most important screen. It defines the entire feel of the product.

**Layout:**

```
┌─────────────────────────────────────────┐
│  [Logo]      🔥 5      ⭐ 230            │  ← Header (sticky)
├─────────────────────────────────────────┤
│                                         │
│  Assalam alaikum, Hassan!               │  ← Greeting strip
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│           Chapter 1: Greetings           │  ← Chapter header
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                         │
│             ╭─────╮                     │
│             │ ✓ 1 │ ◀ completed         │
│             ╰─────╯                     │
│                ┊                        │
│                ┊                        │
│             ╭─────╮                     │
│             │ ▶ 2 │ ◀ current (glowing) │
│             ╰─────╯                     │
│                ┊                        │
│                ┊                        │
│             ╭─────╮                     │
│             │ 🔒 3 │ ◀ locked            │
│             ╰─────╯                     │
│                ┊                        │
│                ┊                        │
│             ╭─────╮                     │
│             │ 🔒 4 │                    │
│             ╰─────╯                     │
│                ┊                        │
│                ┊                        │
│           ╭─────────╮                   │
│           │ 👑 BOSS  │ ◀ larger, gold   │
│           ╰─────────╯                   │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│      Chapter 2: Introducing Yourself     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│             ╭─────╮                     │
│             │ 🔒 1 │                    │
│             ╰─────╯                     │
│              ...                        │
└─────────────────────────────────────────┘
```

**Components:**

- `<PathView />` — the scrolling container. Renders one `<ChapterHeader />` + N `<LevelNode />` per chapter.
- `<LevelNode />` — circle showing status (locked / available / completed / boss). Tap to start level (if unlocked).
- `<ChapterHeader />` — horizontal divider showing chapter number + title.
- Dashed `<Connector />` lines between consecutive level nodes.

**Visual states for LevelNode:**

| State | Visual |
|-------|--------|
| Locked | Gray fill, lock icon, dimmed |
| Available | Teal fill (or amber for boss), play icon, slight pulse animation |
| Completed | Teal fill (or amber for boss), checkmark icon |
| Current (most recent unlocked) | Stronger pulse + outer glow ring |

**Boss-specific styling:**
- ~50% larger than standard level nodes
- Amber color ramp instead of teal
- Crown icon (lucide `Crown`)
- A subtle radial gradient overlay (one of the few exceptions to flat-design rule, but only on the boss for emphasis)

**Tap behavior:**
- Tap on unlocked level → navigate to `/level/[levelId]`
- Tap on locked level → small toast "Complete the previous level first"
- Tap on completed level → navigate to `/level/[levelId]` (replay allowed)

**Empty state:**
- First launch: greeting card prompts for name; only L1-1 is unlocked and prominently highlighted.

### 6.2 Level Player — `app/level/[levelId].tsx`

Loads the level by ID, runs through its exerciseSequence. Handles both STANDARD and BOSS levels (the boss just uses SCENARIO_TURN exercises instead of the standard mix).

Layout same as v1's exercise screen, plus:
- For BOSS levels: show a "Scenario intro" splash card for 2 seconds before exercises begin (uses `level.scenarioIntro` text)
- Progress bar shows current exercise / total exercises in this level

### 6.3 Result — `app/level/result.tsx`

Two variants:

**Standard level complete:**
- Soft celebration (confetti at lower intensity)
- "Level Complete!" headline
- XP earned (animated count-up)
- Streak update
- "Continue" button → back to path; next level becomes available

**Boss level complete (chapter complete):**
- Full celebration (confetti, sound, animation)
- "Chapter Complete!" headline + chapter title
- XP earned (with bonus animation)
- "You can now…" recap message from `chapter.rewards.completionMessage`
- "Continue to Chapter X" button — pre-scrolls the path to the new chapter's first level

**Failure case (any level — boss especially):**
- Encouraging "Almost there!" header
- Show the score, indicate threshold
- "Try Again" primary, "Back to path" secondary

### 6.4 Settings — `app/settings.tsx`

Same as v1.

---

## 7. Exercise Engine (Updates)

### 7.1 New Exercise Type: SCENARIO_TURN

**Used in:** BOSS levels only.

**UI:**

1. Top: a small "Scene" card showing the other speaker's line in English context (`exercise.prompt`).
2. Center: an audio play button + transcript of what the other speaker just said. Auto-plays on screen load.
3. Below: an instruction line (`exercise.prompt`).
4. Bottom: a RecordButton.
5. Optional hint button.

**Flow:**

1. Speaker line plays automatically (`exercise.speakerLine.audio`)
2. After audio ends, RecordButton activates
3. User records their response
4. Scoring against `exercise.expectedPhraseId` (resolved to a phrase, then scoring against its `roman` and `urdu`)
5. 3 attempts max; on 3rd fail, reveal the expected phrase with soft-fail score 0.3
6. Auto-advance to next scenario turn

**Scoring:** Same as SPEAK exercise — threshold 0.70 for "pass."

**Critical design note:** A boss level must FEEL different from a regular level. Suggestions:
- Slightly darker background gradient (one exception to flat-only rule)
- Sound design: a brief drum-roll intro sound before the scenario starts
- A small "scene number" indicator (Scene 1 of 4, Scene 2 of 4, etc.)
- Crown icon visible in the top corner throughout

---

## 8. Speech Recognition & Scoring

Identical to v1. Same `speechService`, same `scoringService`, same similarity algorithm. Only difference: scoring is now invoked from both `SpeakExercise` and `ScenarioTurnExercise`.

---

## 9. Audio Asset Pipeline

Same as v1, with additions for BOSS scenarios:

**File naming for boss scenarios:**

```
audio/C{NN}/scenario/turn{N}.m4a

Examples:
audio/C01/scenario/turn1.m4a   ← Chapter 1 boss, scene 1's speaker line
audio/C01/scenario/turn2.m4a
```

**Recording the boss scenarios:**
- These are the "other speaker's" lines — the auntie, the cousin, the shopkeeper
- For Chapter 1, the same recorded voice can play all 4 turns (it's one neighbor)
- For later chapters with multiple characters, recruit a second voice

---

## 10. State Management

Updates to `useProgressStore`:

```typescript
interface ProgressState extends UserProgress {
  setUserName: (name: string) => void;
  startLevel: (levelId: string) => void;
  recordExerciseResult: (levelId: string, result: ExerciseResult) => void;
  completeLevel: (levelId: string, score: number) => void;
  completeChapter: (chapterId: string) => void;  // called when boss level completes
  addXP: (amount: number) => void;
  updateStreak: () => void;

  isLevelUnlocked: (levelId: string) => boolean;
  isLevelComplete: (levelId: string) => boolean;
  isChapterComplete: (chapterId: string) => boolean;

  getCurrentLevel: () => { chapterId: string; levelId: string } | null;
  // ^ returns the "frontier" — the most recently unlocked, not-yet-completed level
  // Used by the path UI to glow and by the home screen to set the "Continue" CTA

  reset: () => void;
}
```

---

## 11. Visual Design System

Same palette as v1, with one addition:

**Boss color:** `accent` (amber `#D97706`) is the boss color. Standard levels use `primary` (teal `#0F766E`).

**Path styling:**
- Connector lines: 0.5px dashed in `border` color when between locked levels
- Connector lines: 0.5px solid in `primary` (teal) between completed levels
- Connector line into boss: 1px solid in `accent` (amber)

---

## 12. Build Sequence (Sprints)

Same 8-sprint structure as v1, with these changes:

- **Sprint 1:** Types now include Chapter, Level, ScenarioTurnExercise. Lock/unlock logic operates on levels.
- **Sprint 2:** Home screen is the PATH (not a list). Build `PathView`, `LevelNode`, `ChapterHeader`. This sprint is harder than v1's equivalent because the path UI is more complex.
- **Sprint 4:** Same exercise types but rendered inside a level player that knows about level-vs-chapter progression.
- **Sprint 6:** Result screen now has two variants — standard level vs chapter-complete.
- **Sprint 7:** Now requires authoring 9 more chapters (C02–C10), each with 5 levels = ~45 levels total, ~140 phrases total. The boss scenarios for each chapter take additional design time.
- **Sprint 8:** Adds boss-level visual polish (crown icon, larger nodes, gradient backgrounds).

Timeline grows slightly: **8–10 weeks** part-time (up from 6–8).

---

## 13. Definition of Done — MVP

- [ ] App installs on Android via APK
- [ ] First launch onboarding asks for user name and gender
- [ ] Path screen shows Chapter 1's 5 levels (4 standard + 1 boss) with correct lock states
- [ ] User can complete Level 1.1 in 2–3 minutes
- [ ] Completing Level 1.1 unlocks Level 1.2 on the path
- [ ] User can complete all 4 standard levels of Chapter 1
- [ ] User can complete the BOSS level — Scenario Turn exercises function correctly
- [ ] Completing the boss unlocks Chapter 2's Level 2.1 on the path
- [ ] Path scrolls smoothly across all 10 chapters
- [ ] XP, streak, level progress all persist across app restarts
- [ ] No crashes in 30 minutes of normal use
- [ ] APK size under 100 MB

---

## 14. Out of Scope for MVP

Same list as v1.

---

## 15. Risks & Mitigations

Same as v1, with one addition:

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Path UI is harder to build than expected | Medium | Medium | Use SVG (react-native-svg) for connector lines; layout nodes via flex with absolute-positioned connectors. Reference existing open-source Duolingo clones for technique. |

---

*End of MVP Spec v2.0*
