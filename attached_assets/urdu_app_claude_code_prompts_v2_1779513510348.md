# Bolo Urdu — Claude Code Prompts Playbook (v2)

**Updated for chapter/level structure, Pakistani-only positioning.**

---

## How to use this playbook

1. Open a terminal in your project folder, run `claude`.
2. Paste the **Setup Context** prompt first, every session.
3. For each sprint, paste the sprint prompt. Don't paste multiple at once.
4. After each sprint, paste the verification prompt.
5. Commit to git between sprints.

Reference docs Claude Code should have access to in the repo root:
- `urdu_app_complete_curriculum_v3.md`
- `urdu_app_mvp_spec_v2.md`
- `chapter_01.json` (eventually moves into `/content/chapters/`)

---

## ⚙️ Setup Context

```
You are helping me build "Bolo", a React Native + Expo mobile app that teaches PAKISTANI URDU to heritage learners.

Critical positioning: this is a Pakistani-only product. We do NOT make comparisons to Hindi or to Indian-region Urdu. We do NOT frame things as "Muslim" vs "Hindu" — Pakistani Urdu is just what it is. Cultural notes refer to Pakistani cities, food, family structure, customs.

The full spec is in `urdu_app_mvp_spec_v2.md`. The complete curriculum is in `urdu_app_complete_curriculum_v3.md`. Chapter 1's full data file is `chapter_01.json`.

Key structural concepts:
- The app is organized as: Stages → Chapters → Levels
- Each chapter has 4 short levels (2–3 min each, type STANDARD) + 1 boss level (5–7 min, type BOSS)
- The boss level uses chained SCENARIO_TURN exercises in a real-world Pakistani scenario
- The home screen is a vertical scrolling PATH (like Duolingo) — not a list view
- Linear progression: complete a level to unlock the next; complete a chapter's boss to unlock the next chapter

Before any work, read:
- urdu_app_mvp_spec_v2.md sections 4 (project structure), 5 (data models), 6 (screens), 7 (exercise engine)
- chapter_01.json to understand the data shape

I will give you one sprint at a time. Don't skip ahead. Don't install libraries not in the spec without asking. Don't add features beyond the sprint.

When you finish a task:
1. Tell me exactly what files you created or modified
2. Tell me what to run to verify
3. Flag any deviations from the spec, and explain why

Ready? Confirm you've read the docs and we'll start with Sprint 0.
```

---

## 🚀 Sprint 0 — Project Setup *(2–3 hours)*

```
Sprint 0: initialize the project.

Tasks:
1. Initialize new Expo project with TypeScript: `npx create-expo-app@latest bolo-urdu --template`. Pick the blank TypeScript template.
2. Install dependencies (use Expo's compatibility tool — `npx expo install`):
   - expo-router
   - zustand
   - @react-native-async-storage/async-storage
   - expo-av
   - @react-native-voice/voice
   - expo-speech
   - react-native-svg
   - react-native-reanimated
   - nativewind
   - tailwindcss (devDep)
   - lucide-react-native
3. Configure:
   - tsconfig.json — strict mode
   - tailwind.config.js — for NativeWind
   - babel.config.js — NativeWind preset, reanimated plugin LAST
   - app.json — name "Bolo", slug "bolo-urdu", bundle/package "com.bolourdu.app", microphone permission, expo-router plugin
4. Create folder structure exactly per spec v2 section 4. Empty folders get .gitkeep.
5. Create placeholder app/index.tsx with centered "Bolo — Pakistani Urdu" message using NativeWind classes.
6. .gitignore for Expo + Node.
7. git init and initial commit.

After: tell me the exact commands to verify the app runs on Android. Note that @react-native-voice/voice is a native module, so we'll likely need a development build later — but for sprint 0, Expo Go should still load the placeholder screen.
```

**Verify:**

```
1. Commands to start the app on Android.
2. Confirm the placeholder loads.
3. Tell me whether we already need a development build or can stay in Expo Go for now.
```

---

## 🧬 Sprint 1 — Types and Content Pipeline *(1 week)*

```
Sprint 1: lock down the data layer.

Tasks:
1. Create all TypeScript files in /types per spec v2 section 5:
   - phrase.ts (with chapterId AND levelId fields)
   - exercise.ts (includes SCENARIO_TURN type)
   - level.ts (NEW — Level with type STANDARD | BOSS)
   - chapter.ts (replaces lesson.ts, contains phrases AND levels arrays)
   - progress.ts (with LevelProgress and ChapterProgress)
2. Copy chapter_01.json into /content/chapters/chapter_01.json.
3. Create /content/manifest.json listing all 10 Stage 1 chapters. For C02–C10 use placeholders from the curriculum doc — id, number, stage: 1, title, subtitle, estimatedMinutes (~14), contentFile.
4. Create /services/contentService.ts:
   - loadManifest() → returns the manifest
   - loadChapter(chapterId: string): Promise<Chapter | null>
   - getLevelById(chapter, levelId): Level | null — utility for finding a level inside a chapter
   - getPhraseById(chapter, phraseId): Phrase | null — utility
   - Use static require() for bundling. Show me how you map chapter IDs to require statements.
5. Create /scripts/validateAssets.ts — checks every phrase + every scenario turn audio file exists.
6. Add npm scripts: "validate-assets" and "typecheck".

After: temporary code in app/index.tsx that loads chapter_01 and console-logs the title and the 5 level titles. Verify load works.

Commit.
```

**Verify:**

```
1. Show me the console output — Chapter 1's title + 5 level titles + a count of phrases.
2. Run `tsc --noEmit` — zero errors.
3. Run validate-assets — should fail with a list of missing audio files (expected).
```

---

## 🛤️ Sprint 2 — Path UI (Home Screen) *(1.5 weeks)*

This sprint is significantly harder than v1 because the path UI is more complex than a flat list.

```
Sprint 2: build the path-based home screen.

Tasks:
1. Create constants/colors.ts:
   - primary (teal #0F766E) — standard levels
   - accent (amber #D97706) — boss levels
   - Plus the full palette from spec v2 section 11.
2. Create constants/typography.ts.

3. Build /stores/useProgressStore.ts per spec v2 section 10:
   - All actions: setUserName, startLevel, recordExerciseResult, completeLevel, completeChapter, addXP, updateStreak, reset
   - All queries: isLevelUnlocked, isLevelComplete, isChapterComplete, getCurrentLevel
   - Persist with AsyncStorage via zustand/middleware

4. Build /stores/useUserStore.ts — minimal user store (name, gender preference).

5. Build the path UI components:
   - components/StreakBadge.tsx — flame icon + count
   - components/XPCounter.tsx — star icon + count
   - components/ChapterHeader.tsx — horizontal "─── Chapter N: Title ───" divider
   - components/LevelNode.tsx — the circle. Props: level + state (locked/available/completed/current) + onPress. Standard levels are smaller teal circles; BOSS levels are larger amber circles with a Crown icon. Use lucide icons. Pulse animation on "current" state.
   - components/Connector.tsx — dashed vertical line between levels. Style based on whether the connection is between two unlocked, locked, or one of each.
   - components/PathView.tsx — the master scrolling component. For each chapter in the manifest, render a ChapterHeader, then iterate levels, alternating slight left/right horizontal offsets (like Duolingo's wavy path). Render Connectors between consecutive levels.

6. Build app/index.tsx:
   - Sticky header (logo + streak + XP)
   - Greeting strip using userStore.name (fallback: "Assalam alaikum!")
   - PathView fills the rest of the screen
   - On launch, scroll to the current level (frontier) using a ref + onLayout

7. Wiring:
   - Tap unlocked level → navigate to /level/[levelId]
   - Tap locked level → small toast
   - Tap completed level → navigate to /level/[levelId] (replay allowed)

Use react-native-svg for the connector lines for crisp rendering. Use react-native-reanimated for the pulse animation on the current level.

Don't yet implement the level player — just navigate to a placeholder /level/[levelId] screen that shows the level ID.

Commit.
```

**Verify:**

```
1. Show me what the path looks like on first launch. Only L1-1 should be tappable.
2. In the React Native debugger, manually call completeLevel('L1-1', 0.85). Confirm:
   - L1-1 now shows checkmark
   - L1-2 is now tappable (glowing)
   - L1-3, L1-4, L1-5 (boss) still locked
3. Manually complete L1-1 through L1-5 (the boss). After completing L1-5, confirm:
   - All Chapter 1 nodes show checkmarks
   - C02-L2-1 is now tappable
4. Scroll the path — verify smooth scroll across all 10 chapters of Stage 1.
```

---

## 🔊 Sprint 3 — Audio Service + AudioButton *(1 week)*

```
Sprint 3: get audio working.

Tasks:
1. Build /services/audioService.ts wrapping expo-av:
   - playAudio(assetPath: string, options?): Promise<void>
   - One global "currently playing" — new playback stops previous
   - Handle errors gracefully
   - Use a static asset map. Show me how to structure it — likely a generated/maintained mapping from path strings to require() calls. Given we'll have ~150+ audio files in MVP, propose a manageable approach.

2. Build /components/AudioButton.tsx:
   - Props: { phrase: Phrase, speed?: 'normal' | 'slow', size?: 'small' | 'large' }
   - Circular, play/pause icon, primary color
   - Long-press for slow speed
   - Pause icon while playing

3. Create a temporary /app/audio-test.tsx for debugging:
   - Loads chapter_01
   - Renders AudioButtons for all phrases AND for the scenario turn audio
   - Lets me tap each to verify
   - Add a Settings shortcut to this screen for now (we'll remove before shipping)

4. CRITICAL: I haven't recorded audio yet. Implement TTS fallback:
   - If audio file missing, fall back to expo-speech with phrase.roman, language 'ur-PK', rate 0.9
   - Log clearly when fallback is used

Commit.
```

**Verify:**

```
1. Open the audio-test screen — every AudioButton should produce sound (TTS fallback acceptable).
2. Confirm new playback stops the previous.
3. Walk me through the asset map approach — how does it scale to 50 chapters?
```

**Note for me (the human):** Start recording Chapter 1 audio THIS sprint. ~24 clips: 10 phrases × 2 speeds + 4 scenario turns. Block 3 hours on a weekend.

---

## 🎯 Sprint 4 — Level Player + INTRODUCE + L_TO_M *(1.5 weeks)*

```
Sprint 4: build the core exercise loop, working through standard (non-boss) levels.

Tasks:
1. Build /stores/useChapterStore.ts (transient — current chapter + level state):
   - activeChapter: Chapter | null
   - activeLevel: Level | null
   - currentExerciseIndex: number
   - Actions: setActive(chapter, level), advance(), reset()

2. Build /components/ProgressBar.tsx — % through current level's exerciseSequence.

3. Build /components/ChoiceButton.tsx — props: label, isSelected, isCorrect?, isIncorrect?, onPress, disabled. Smooth color transitions.

4. Build /components/exercises/IntroduceExercise.tsx — per spec v2 / v1 section 7.2.1. Auto-plays normal audio on mount.

5. Build /components/exercises/ListenToMeaningExercise.tsx — per spec section 7.2.2. Shuffles options once on mount; handles correct/incorrect feedback; one retry.

6. Build /app/level/[levelId].tsx (the level player):
   - Reads the level ID from route params
   - Loads its parent chapter via contentService
   - Resolves the level object from the chapter
   - Sets it as active in useChapterStore
   - Header: chapter number + level title + ProgressBar
   - Renders the appropriate exercise component for the current exercise
   - Handles INTRODUCE and L_TO_M for now; placeholder for LISTEN_REPEAT, SPEAK, SCENARIO_TURN
   - On sequence end, navigate to /level/result with the result data

7. Wire from home: tap unlocked L1-1 on the path → level player loads Level 1.1 of Chapter 1 → user can complete its INTRODUCE and L_TO_M exercises.

Commit.
```

**Verify:**

```
1. Tap Level 1.1. Walk through every exercise. Auto-play should fire once for L_TO_M. Replays work.
2. Back out and re-enter — does it resume from where I left off?
3. Try Level 1.2 — confirm review phrases from Level 1.1 are correctly resolved.
4. Run tsc --noEmit.
```

---

## 🎤 Sprint 5 — Speech Recognition + SPEAK + LISTEN_REPEAT *(1.5 weeks)*

```
Sprint 5: get the user's voice into the loop.

Tasks:
1. Build /utils/similarity.ts per spec v1 section 8.2 exactly (normalize, levenshtein, similarity).

2. Build /services/scoringService.ts:
   - score(transcript, phrase, threshold=0.70) → { score, passed, matchedAgainst, transcript }
   - Try both romanScore and urduScore, take max — handles ASR returning either script

3. Build /services/speechService.ts:
   - Wraps @react-native-voice/voice (locale 'ur-PK')
   - Set up Voice event listeners ONCE at module load (not per-call) — important to prevent leaks
   - startRecording, stopRecording (returns transcript), isAvailable
   - 10-second timeout: if no speech detected, resolve with empty transcript
   - Permission denial → throw PermissionError class

4. Build /components/RecordButton.tsx — large circular button, states idle/recording/processing/done. Pulse animation when recording. Use reanimated.

5. Build /components/exercises/SpeakExercise.tsx — per spec v1 section 7.2.4. Hint reveal caps max score at 0.7. 3 attempts then reveal + soft-fail.

6. Build /components/exercises/ListenRepeatExercise.tsx — per spec v1 section 7.2.3. Audio plays first, then record activates. Lenient scoring (passes at 0.50).

7. Update /app/level/[levelId].tsx to handle these two exercise types.

8. Permission handling: first time mic is needed, show in-app explainer modal before triggering OS permission prompt. Cache "I've explained" in user preferences.

Commit.
```

**Verify:**

```
1. Permission flow: deny first, observe the in-app modal, grant via settings, retry.
2. Test SPEAK on Level 1.3's "Shukriya":
   - Say "shukriya" — should pass
   - Say "shukria" — should also pass (intelligibility)
   - Say "thank you" — should fail
3. Test 3-attempts-then-reveal.
4. Test LISTEN_REPEAT on Level 1.1's "Assalam alaikum" — confirm lenient scoring.
5. Empty transcript (silence) — should fail gracefully with retry.
```

---

## 👑 Sprint 6 — Boss Level + Result Screen *(1.5 weeks)*

This sprint has the highest demo value.

```
Sprint 6: build the boss level experience and the result screen.

Tasks:
1. Build /components/exercises/ScenarioTurnExercise.tsx per spec v2 section 7.1:
   - Top: "Scene N of M" indicator
   - Speaker line card: their audio + Urdu + Roman + English context
   - Auto-play speaker audio on mount
   - Below speaker line: prompt text + hint button (if hint provided)
   - RecordButton activates after audio ends
   - Scoring uses scoringService against the expected phrase's roman/urdu
   - 3 attempts then reveal + soft-fail score 0.3
   - Auto-advance after pass (1.5s feedback)

2. Update /app/level/[levelId].tsx:
   - If level.type === 'BOSS': show a "Scenario intro" splash card for 2 seconds before exercises start, using level.scenarioIntro text
   - Visual treatment for boss levels: slight darker background gradient (one exception to flat rule), small crown icon in header
   - Subtle "drum-roll" ambient sound when scenario starts (use any free royalty-free intro sound)

3. Build /app/level/result.tsx with two variants:
   - STANDARD level passed: soft confetti + "Level Complete!" + XP count-up + "Continue" → back to path
   - BOSS level passed (chapter complete): full celebration + "Chapter Complete!" + XP + chapter completion message + "Continue to Chapter X" → back to path, scrolled to next chapter
   - Failed (any level): "Almost there!" + score + threshold + Try Again primary

4. Hook persistence:
   - On result screen entry, call completeLevel(levelId, score) if score >= passingScore
   - For boss: also call completeChapter(chapterId)
   - Award XP (level.rewards.xp + chapterCompleteBonus if applicable)
   - Update streak

5. Build /app/settings.tsx — per spec section 6.5. User name, gender, hints toggle, audio autoplay toggle, reduce motion toggle. Hidden debug section (long-press title 5x) with "Reset all progress."

Commit and tag this commit "v0.6-boss-working".
```

**Verify:**

```
1. Complete Chapter 1 end-to-end:
   - Levels 1.1 → 1.4 (standard, should be quick now)
   - Level 1.5 BOSS — confirm the scenario splash, the drum-roll sound, the crown icon
   - Each scenario turn auto-plays the auntie's line, then waits for your response
2. After passing the boss:
   - Result screen shows "Chapter Complete!"
   - XP earned matches (50 + 25 + 10*4 = 115 XP for first time through)
   - On returning to path, Chapter 1 is all checkmarks; Chapter 2's L2-1 is unlocked and glowing
3. Force-quit and reopen — all state persists
4. Replay the boss after completing — best score updates if higher
5. Intentionally fail (give wrong answers all 3 attempts) — confirm Chapter 2 stays locked
6. Test settings toggles
```

---

## 📚 Sprint 7 — Chapters 2–10 Content + L_TO_I *(2.5 weeks)*

```
Sprint 7: scale the content.

Tasks (Claude Code's role):
1. For chapters 2–10, generate JSON files in /content/chapters/ following chapter_01.json's exact structure:
   - 4 STANDARD levels + 1 BOSS level per chapter
   - 8–12 phrases per chapter
   - Boss scenarios use SCENARIO_TURN exercises with appropriate speakerLine content
   - Cultural notes Pakistani-focused (use curriculum doc as source)
   - reviewPhraseIds drawn from prior chapters

2. Update /content/manifest.json with the real titles for all 10 chapters.

3. Build /components/exercises/ListenToImageExercise.tsx (L_TO_I) — for chapters that use it (Chapter 4: family, Chapter 7: colors, Chapter 8: objects). Same as L_TO_M but options are images, not text. Use simple SVG illustrations via react-native-svg. Update level player to handle this type.

4. For chapters that need images (Chapter 4 family icons, Chapter 7 color swatches, Chapter 8 object icons), generate simple illustrative SVGs. Family members can be Lucide icons (User, UserCircle, etc.) for now — replace with proper illustrations in Sprint 8 polish.

CRITICAL CAVEAT for me (the human):
Claude Code will generate plausible Urdu content but cannot reliably produce correct romanization or culturally-appropriate phrases without review.

After each chapter is generated, I MUST sit down as a native speaker and proofread:
- Every romanization (some Claude-suggested spellings will be off)
- Every cultural note (some will be too generic)
- Every boss scenario (does this actually sound like how Pakistanis talk?)
- The distractor phrase IDs (do they form genuinely confusable wrong answers?)

5. Run validate-assets — produces a list of all audio files still needed.

Commit.
```

**Verify:**

```
1. Show the full path on the home screen with all 10 chapter headers and 50 level nodes.
2. Open Chapter 5 (extended family). Walk me through the JSON — does it feel right?
3. Open Chapter 7 (colors). Confirm L_TO_I exercises are scaffolded.
4. Run typecheck — zero errors.
5. Run validate-assets — show me the full list of missing files. This is my recording todo list.
```

**Note to me:** Recording 130 audio clips is a 6–10 hour task spread over multiple sessions. Start during Sprint 7, finish during Sprint 8. Each chapter takes 30–45 minutes.

---

## ✨ Sprint 8 — Polish, Onboarding, Build *(1 week)*

```
Sprint 8: ship it.

Tasks:
1. Onboarding flow (first launch only):
   - Screen 1: "Welcome to Bolo" + tagline "Speak Pakistani Urdu, one chapter at a time"
   - Screen 2: "What's your name?" text input
   - Screen 3: "How should we refer to you?" — male / female / prefer not to say (drives gendered phrase selection)
   - Screen 4: "Ready to start?" → home with L1-1 highlighted

2. Polish pass on every screen:
   - Spacing in multiples of 4
   - Corner radii consistent (12 buttons, 16 cards, level nodes circular)
   - Touch targets ≥ 44x44
   - Readable contrast (WCAG AA)
   - Boss nodes visibly distinct (larger, amber, crown, gradient if reduceMotion is false)

3. Animations (respect reduceMotion preference):
   - Scale on button press (reanimated)
   - Pulse on current level node
   - Confetti on level/chapter complete
   - XP count-up animation
   - Path scrolls smoothly to next current level after completion

4. Sound design:
   - Verify correct/incorrect/lesson-complete sounds are warm
   - Drum roll for boss scenarios
   - All volumes consistent

5. Error states:
   - Missing audio → TTS fallback (already implemented)
   - Speech recognition failure → offer "I said it correctly" self-report
   - Mic permission denied → in-app modal pointing to system settings

6. App icon and splash:
   - Simple stylized "ب" (Urdu letter "be") OR a chai cup OR a stylized B for Bolo
   - Splash screen: brand teal with the icon
   - Use expo-splash-screen and expo-system-ui

7. EAS Build:
   - Configure eas.json with a "preview" profile (APK, internal distribution)
   - eas build --platform android --profile preview

8. README.md:
   - What Bolo is (Pakistani Urdu learning, audio-first, chapter/level structure)
   - Tech stack summary
   - Local run instructions
   - APK build instructions
   - Known MVP limitations
   - Roadmap teaser (Stages 2–4, Nastaliq track)

Commit and tag "v1.0-mvp".
```

**Verify:**

```
1. Install the APK on a physical Android device by sideloading.
2. Hand the device to someone who's never seen the app — preferably a non-developer. Watch them complete the chapter unassisted. Note hesitations, confusion, delights.
3. Run for 30+ minutes without crashes.
4. APK size under 100 MB.
5. Screenshot every screen for the investor deck.
6. Test the full chapter 1 flow including boss on at least 2 different Android devices.
```

---

## 🆘 Recovery Prompts

Same as v1 — when something is broken, when Claude proposes off-spec changes, when ASR is being wild, when you hit a "needs dev build" wall.

Add one more for this version:

### When the path UI is buggy

```
The path UI is the most complex piece of the home screen and the most visible. Before fixing:
1. Tell me what the spec says the path should look like
2. Tell me what's actually rendering
3. Identify whether it's a layout issue (flex/positioning), a state issue (wrong unlocked levels showing), or a rendering issue (SVG connectors not drawing)
4. Propose the smallest fix

If the issue is at the layout level (level nodes overlapping, connectors not aligning), suggest a simplified algorithm: render all level nodes in a vertical flex column with alternating horizontal offsets; render connectors as absolute-positioned SVG lines computed from node positions on layout.
```

---

## 🪜 Beyond MVP

After v1.0-mvp ships:

1. **iOS port** — `eas build --platform ios` ($99/year Apple Developer)
2. **Cloud sync** — Supabase free tier
3. **L_TO_I image library proper illustrations** — replace lucide-icon placeholders
4. **SRS layer** — spaced repetition across chapter boundaries
5. **Stage 2 content build-out** — Chapters 11–25 (Daily Life)
6. **Personalized speaker voices** — let user choose voice character
7. **Nastaliq parallel track** — unlocked after Stage 2

---

## Final Project Manager Tips

- **Path UI is the demo.** Spend extra time on Sprint 2 if needed. A polished path with even just one playable level is more impressive to investors than 10 fully-built lessons in a list view.
- **The boss scenario is the WOW.** Sprint 6 is where you make people go "oh, this is real." Polish disproportionately.
- **Record Chapter 1 audio early.** Block the entire weekend after Sprint 3 ends to record all 24 clips for Chapter 1 (10 phrases × 2 speeds + 4 scenario turns). This gives you 4 weeks runway before you need any of the other audio.
- **Native-speaker review is non-negotiable.** Claude Code will generate plausible-looking Urdu in Sprint 7 — you must proofread every chapter before audio recording.
- **Daily journal.** Keep RUNNING_NOTES.md. It becomes the onboarding doc for Stage 2 development.
- **Investor demo flow.** Show the path → tap Level 1.1 → complete it → show the path again with progress → tap straight to the boss → complete it → show the Chapter 2 unlocking. Five minutes. That's the pitch.

Bolo — taking Pakistani Urdu somewhere it's never been. 🌙
