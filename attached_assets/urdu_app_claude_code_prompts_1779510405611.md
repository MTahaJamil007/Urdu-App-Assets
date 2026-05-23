# Claude Code Prompts Playbook — Bolo Urdu MVP

**Purpose:** Copy-paste-ready prompts to drive Claude Code through the 8-sprint MVP build. Each section corresponds to a sprint in the implementation spec.

**How to use:**

1. Open a terminal in your project folder.
2. Run `claude` to start Claude Code.
3. Before any sprint, paste the **Setup Context** prompt below so Claude understands the project.
4. For each sprint, paste the relevant prompt. Don't paste multiple sprints at once — let each one complete and verify before moving on.
5. After each sprint, paste the corresponding **Verification** prompt to confirm the work meets the spec.

**General tips:**

- Keep `urdu_app_mvp_spec.md`, `urdu_app_complete_curriculum.md`, and `lesson_01.json` in your repo root so Claude Code can reference them.
- If Claude proposes a different library or pattern, ask "why?" before accepting — sometimes its suggestion is better, sometimes it's hallucinating.
- After every sprint, commit to git before starting the next sprint.
- When stuck, the magic phrase is: *"Read `urdu_app_mvp_spec.md` section X.Y, then revise."*

---

## ⚙️ Setup Context (paste at the start of every Claude Code session)

```
You are helping me build "Bolo Urdu", a React Native + Expo mobile app that teaches spoken Urdu to heritage learners. 

The full spec is in `urdu_app_mvp_spec.md` in this repo. The complete curriculum (60 lessons across 4 stages) is in `urdu_app_complete_curriculum.md`. The first lesson's data file is `lesson_01.json`.

Before doing ANY work, read `urdu_app_mvp_spec.md` to understand:
- The tech stack (Expo SDK 51+, TypeScript strict, expo-router, Zustand, NativeWind, expo-av, @react-native-voice/voice)
- The project structure (section 4)
- The data models (section 5)
- The component breakdown (section 6)

I will give you one sprint at a time. Do NOT skip ahead. Do NOT install libraries not in the spec without asking first. Do NOT add features beyond what the sprint asks for.

When you complete a task:
1. Tell me exactly what files you created or modified
2. Tell me what to run to verify the work
3. Flag any decisions where you deviated from the spec, and explain why

Ready? Confirm you've read the spec and we'll start with Sprint 0.
```

---

## 🚀 Sprint 0 — Project Setup

```
Sprint 0: initialize the project.

Tasks:
1. Initialize a new Expo project with TypeScript template named "bolo-urdu" using `npx create-expo-app@latest`.
2. Install these dependencies (versions chosen by Expo's compatibility tool):
   - expo-router
   - zustand
   - @react-native-async-storage/async-storage
   - expo-av
   - @react-native-voice/voice
   - expo-speech
   - nativewind
   - tailwindcss (as devDependency)
   - lucide-react-native
   - react-native-svg
3. Configure:
   - `tsconfig.json` to strict mode
   - `tailwind.config.js` for NativeWind
   - `babel.config.js` for NativeWind preset
   - `app.json` with name "Bolo Urdu", slug "bolo-urdu", iOS bundle ID "com.bolourdu.app", Android package "com.bolourdu.app", microphone permission, and an `expo-router` plugin entry
4. Create the folder structure exactly per section 4 of the spec. Empty folders should contain a `.gitkeep`.
5. Create a placeholder `app/index.tsx` that renders a centered "Bolo Urdu — coming soon" message using NativeWind classes.
6. Create a `.gitignore` appropriate for Expo + Node.
7. Initialize git and make an initial commit.

Verification: tell me the exact commands to run to start the app on Android (development build or Expo Go) and confirm the placeholder screen loads.
```

**Verification prompt:**

```
Walk me through:
1. The exact commands I need to run to see the app on my Android device
2. Whether Expo Go is sufficient or whether I need a development build (@react-native-voice/voice may require this — check)
3. What I should see if everything is working
```

---

## 🧬 Sprint 1 — Types and Content Pipeline

```
Sprint 1: lock down the data layer.

Tasks:
1. Create all TypeScript files under `/types`:
   - `phrase.ts` — exact definitions from spec section 5.1
   - `exercise.ts` — exact definitions from spec section 5.2  
   - `lesson.ts` — exact definitions from spec section 5.3
   - `progress.ts` — exact definitions from spec section 5.4
2. Copy `lesson_01.json` into `/content/lessons/lesson_01.json`.
3. Create `/content/manifest.json` listing all 10 lessons. For lessons 2–10 use placeholder titles for now — we'll author full content later. Each entry needs id, number, title, subtitle, estimatedMinutes, and contentFile.
4. Create `/services/contentService.ts` that:
   - Exports `loadManifest()` returning the manifest
   - Exports `loadLesson(id: string): Promise<Lesson | null>` loading a lesson JSON file by ID
   - Uses static `require()` for bundling — DO NOT use dynamic imports (they don't work with React Native bundler)
5. Create `/scripts/validateAssets.ts` per spec section 9.4.
6. Add an npm script `"validate-assets": "ts-node scripts/validateAssets.ts"` to package.json.

After completing: in `app/index.tsx`, temporarily add a `useEffect` that calls `loadLesson('L01')` and logs the result. Verify in the console that the lesson data loads cleanly.

Commit when done. Tell me what to run to verify.
```

**Verification prompt:**

```
1. Show me what the console output should be when the app launches.
2. Confirm that the validateAssets script flags every missing audio file (it should fail because we haven't recorded any yet — that's expected).
3. Run `tsc --noEmit` and confirm zero errors.
```

---

## 🏠 Sprint 2 — Home Screen and Lesson List

```
Sprint 2: build the home screen.

Tasks:
1. Create `/constants/colors.ts` per spec section 11.1.
2. Create `/constants/typography.ts` per spec section 11.2.
3. Build `/stores/useProgressStore.ts` per spec section 10.1 exactly as written.
4. Build `/stores/useUserStore.ts` — minimal store for user name with persist middleware.
5. Build these components:
   - `/components/StreakBadge.tsx` — small badge showing current streak with a flame icon (use lucide-react-native)
   - `/components/XPCounter.tsx` — shows total XP with a star icon
   - `/components/LessonCard.tsx` — props: lesson manifest entry + lock state + completion state + best score. Tappable. Shows lesson number, title, subtitle, status icon (lock / play / checkmark), and best score if completed.
6. Rebuild `/app/index.tsx` per spec section 6.1:
   - Header with logo + streak badge + XP counter
   - Greeting strip using user name from useUserStore (fallback: "Assalam alaikum!")
   - "Continue learning" card if a lesson is in progress
   - Scrollable lesson list rendered from manifest
   - Each lesson card tappable — navigate to `/lesson/[id]` for unlocked lessons, or show a toast for locked
7. Use NativeWind classes throughout. No inline styles unless absolutely necessary.

Constraints:
- Use the color palette from constants/colors.ts
- Lesson lock logic must use useProgressStore.isLessonUnlocked
- Do NOT yet implement the lesson detail screen — just navigate to it (it can be a placeholder for now)

Commit when done.
```

**Verification prompt:**

```
1. Tell me what I should see on the home screen on first launch (no progress).
2. Tell me what happens if I tap Lesson 1 vs Lesson 2.
3. In the React Native debugger, manually call useProgressStore.getState().completeLesson('L01', 0.8). Then explain what should now be visible on the home screen.
```

---

## 🔊 Sprint 3 — Audio Service and AudioButton

```
Sprint 3: get audio working.

Tasks:
1. Build `/services/audioService.ts`:
   - Wraps expo-av's Audio.Sound
   - Exports `playAudio(assetPath: string, options?: { rate?: number }): Promise<void>` that loads, plays, and unloads cleanly
   - Maintain a single global "currently playing" reference; if a new playback starts, stop the previous one
   - Handle errors gracefully (log + return)
   - Use static require() for asset paths — provide a map from path strings to require() calls. Generate the map programmatically isn't possible at build time, so we need a switch or an explicit object. Show me your approach.

2. Build `/components/AudioButton.tsx`:
   - Props: `phrase: Phrase, speed?: 'normal' | 'slow', size?: 'small' | 'large'`
   - Circular button with a play icon (lucide Play) that becomes a pause icon while playing
   - Tapping plays the audio
   - Long-press toggles to slow speed for that play
   - Uses primary color from constants/colors

3. Build a temporary `/app/audio-test.tsx` screen that:
   - Loads lesson 1
   - Renders an AudioButton for each phrase
   - Lets me tap and verify each works
   - Add a navigation link to it from the home screen's settings or a dev menu

4. IMPORTANT: I have not yet recorded audio. The actual .m4a files don't exist. For now:
   - Implement a fallback: if audio file is missing, call expo-speech with phrase.roman in `ur-PK` locale at rate 0.9
   - This lets me verify the UI works before recording

5. Add the static require map by stubbing it for now — Claude, propose how we'll handle this elegantly.

Commit when done.
```

**Verification prompt:**

```
1. Show me the audio-test screen result — every AudioButton should make a sound (TTS fallback is fine).
2. Confirm that tapping a new button stops the previous one.
3. Walk me through how the static require map will scale when we have 20 lessons × 20 phrases × 2 speeds = 800 files. Is there a better approach?
```

**Note to you:** This sprint is also when you start recording Lesson 1 audio in parallel — see spec section 9. Aim to have all ~20 Lesson 1 clips recorded by the end of this sprint.

---

## 🎯 Sprint 4 — Exercise Engine, INTRODUCE, and L_TO_M

```
Sprint 4: build the core exercise loop.

Tasks:
1. Build `/stores/useLessonStore.ts` per spec section 10.2.

2. Build `/components/ProgressBar.tsx` — thin horizontal bar showing % progress through the lesson.

3. Build `/components/ChoiceButton.tsx`:
   - Props: label, isSelected, isCorrect?, isIncorrect?, onPress, disabled
   - Default state: white background, text in textPrimary
   - Selected: primary border highlight
   - Correct: green background after submit
   - Incorrect: red background after submit
   - Smooth color transitions

4. Build `/components/exercises/IntroduceExercise.tsx`:
   - Props: phrase, onDone
   - Layout per spec section 7.2.1
   - Auto-plays normal audio on mount (only once)
   - "Got it" button calls onDone

5. Build `/components/exercises/ListenToMeaningExercise.tsx`:
   - Props: exercise (L_TO_M type), allPhrases (the lesson's phrase list, to resolve distractor IDs), onResult
   - Resolves the target phrase + distractors
   - Shuffles options once on mount
   - Plays audio on mount (auto)
   - Shows 3 ChoiceButtons with English meanings
   - Tracks selected; "Check" button at bottom
   - On check: highlights correct/incorrect; locks selection; waits 1.5s; calls onResult with ExerciseResult
   - Hint button if exercise.hint exists; tapping shows a small popup with the hint text

6. Build `/app/lesson/[id].tsx` — lesson intro screen per spec section 6.2:
   - Show goal, cultural note, estimated time
   - "Start" / "Continue" button navigates to `/lesson/exercise`

7. Build `/app/lesson/exercise.tsx`:
   - Reads activeLesson and currentExerciseIndex from useLessonStore
   - Renders the appropriate exercise component based on current exercise type
   - For now, only handle INTRODUCE and L_TO_M
   - For unsupported types (LISTEN_REPEAT, SPEAK), show a placeholder "Coming soon" and advance after a tap
   - ProgressBar at the top
   - When sequence ends, navigate to mastery check (also placeholder for now)

8. Wire everything: tapping Lesson 1 on home → intro screen → start → exercise sequence works for the first ~15 exercises of Lesson 1 (the introduce + L_TO_M ones).

Commit when done.
```

**Verification prompt:**

```
1. Walk me through the user flow from home screen → tapping Lesson 1 → completing the first 5 exercises.
2. Confirm that going back from the exercise screen and re-entering picks up where I left off (useLessonStore state).
3. Confirm that the audio for L_TO_M auto-plays once on screen entry, and replays when I tap the play button.
4. Run `tsc --noEmit` — zero errors expected.
```

---

## 🎤 Sprint 5 — Speech Recognition, SPEAK, and LISTEN_REPEAT

```
Sprint 5: the hard part. Get the user's voice into the loop.

Tasks:
1. Build `/utils/similarity.ts` per spec section 8.2 exactly.

2. Build `/services/scoringService.ts` per spec section 8.3 exactly.

3. Build `/services/speechService.ts`:
   - Wraps @react-native-voice/voice per spec section 8.1
   - Exports startRecording, stopRecording, isAvailable
   - Critically, set up Voice.on listeners ONCE at module load, not per-call (otherwise old promises leak)
   - Add a 10-second timeout: if no speech detected, resolve with empty transcript
   - Handle permission denial: throw a specific PermissionError class

4. Build `/components/RecordButton.tsx`:
   - Large circular button (80px+)
   - States: idle, recording, processing, done
   - Idle: primary color with mic icon
   - Recording: red background, pulsing animation, mic icon
   - Processing: spinner
   - Done: green checkmark briefly
   - Press-and-hold OR tap-to-toggle (let user choose? for now, use tap-to-toggle, simpler)

5. Build `/components/exercises/SpeakExercise.tsx`:
   - Props: exercise (SPEAK), phrase (resolved from exercise.phraseId), onResult
   - Layout per spec section 7.2.4
   - English prompt at top
   - Hint button if hint is provided (revealing it caps max score at 0.7 — track this)
   - RecordButton triggers the speech flow
   - After recording stops: send transcript to scoringService, display result with appropriate feedback message
   - 3 attempts allowed; on 3rd fail, reveal the correct answer and advance with score 0.3

6. Build `/components/exercises/ListenRepeatExercise.tsx`:
   - Props: exercise (LISTEN_REPEAT), phrase, onResult
   - First plays audio automatically
   - After audio ends, record button activates
   - Same scoring as SPEAK but with lenient threshold (0.50 to pass, scoring tiers per spec section 7.2.3)

7. Update `/app/lesson/exercise.tsx` to handle these two new exercise types.

8. Add permission handling: on first SPEAK/LISTEN_REPEAT, check mic permission; if not granted, show an in-app explanation modal before triggering the system prompt.

Verification approach:
- For testing, your transcripts may not be perfect Urdu — that's the point. Try saying things in roman Urdu pronounced naturally.
- If on-device ASR returns Urdu in Nastaliq script, scoring will match against phrase.urdu; if it returns roman, it matches phrase.roman.

Commit when done.
```

**Verification prompt:**

```
1. Confirm the mic permission flow works: deny once, observe the in-app modal, grant via settings, retry.
2. Test on the SPEAK exercise for "Shukriya": say it correctly — confirm pass. Say "shukria" (missing the final 'h') — confirm it still passes intelligibly. Say "thank you" in English — confirm fail.
3. Test the 3-attempts-then-reveal flow.
4. On at least one phrase, test LISTEN_REPEAT and confirm scoring is more lenient than SPEAK.
5. Show me what happens if speech recognition returns an empty transcript (timeout).
```

---

## 🏆 Sprint 6 — Result Screen and Lesson Progression

```
Sprint 6: close the loop.

Tasks:
1. Build the mastery check flow:
   - When exerciseSequence is exhausted, useLessonStore.startMasteryCheck() switches to mastery check exercises
   - Mastery check is a subset (6 exercises) — same exercise components, just different sequence
   - Track score across all mastery check exercises
   - Final score = mean(exerciseResults.map(r => r.score))

2. Build `/app/lesson/result.tsx` per spec section 6.4:
   - Confetti animation on entry (use react-native-confetti-cannon or a simple animated emoji sprite)
   - Title: "Lesson Complete!" if passed, "Almost there!" if not
   - Score display
   - XP earned (animated count-up from 0)
   - Streak status
   - "Things you can now do" — pull from lesson.rewards.completionMessage
   - If passed: button "Continue to Lesson X" → navigate home and the next lesson is unlocked
   - If failed: button "Try Again" → reset useLessonStore and re-enter lesson; "Back to Home" secondary
   - Respect preferences.reduceMotion (no confetti if true)

3. Hook up the scoring + persistence chain:
   - On result screen entry, call useProgressStore.completeLesson if score >= passingScore
   - Award XP via useProgressStore.addXP(lesson.rewards.xp)
   - Call useProgressStore.updateStreak()

4. Sound effects:
   - Add sounds for correct/incorrect answers (use any free royalty-free sounds for now; bundle into /assets/sounds/)
   - Lesson complete chime on result screen entry
   - Make sounds optional in settings (preferences.audioEnabled)

5. Build `/app/settings.tsx`:
   - Inputs/toggles per spec section 6.5
   - User name editable
   - Gender preference editable
   - Hints toggle
   - Audio autoplay toggle
   - Reduce motion toggle
   - Hidden debug section (long-press the title 5 times to reveal): "Reset all progress"

Commit when done.
```

**Verification prompt:**

```
1. Complete Lesson 1 end-to-end with a passing score. Confirm:
   - Result screen shows correctly
   - XP increased on home screen
   - Streak is now 1
   - Lesson 2 is now unlocked
2. Force-quit and reopen the app. Confirm all state persists.
3. Enter Lesson 1 again. Confirm it can be replayed (best score updates if higher).
4. Fail mastery check intentionally (bad answers). Confirm next lesson stays locked.
5. Test the settings screen toggles.
```

---

## 📚 Sprint 7 — Lessons 2–10 Content

```
Sprint 7: scale the content. (This sprint is mostly content authoring, not code — but a few code tasks too.)

Tasks:
1. For lessons 2–10, author the JSON files following the exact structure of lesson_01.json. Use `urdu_app_complete_curriculum.md` as the source — each lesson's section has its vocabulary table, cultural notes, and exercise sequence approach.

   For each lesson, generate:
   - 8–12 new phrases
   - reviewPhraseIds (refs to prior lessons' phrases — at least 2 per lesson from L2 onward)
   - An exerciseSequence with INTRODUCE → L_TO_M → LISTEN_REPEAT → SPEAK patterns
   - A masteryCheck of 6 mixed exercises
   - Cultural notes from the curriculum

   IMPORTANT for me (the human): YOU (the user, not Claude Code) must validate every romanization and Urdu spelling as a native speaker. Claude Code will generate plausible content but cannot reliably produce correct Urdu without your review. After Claude generates each lesson, sit down and proofread it line by line before recording audio.

2. Update /content/manifest.json with all 10 lessons' real titles and metadata.

3. Implement the L_TO_I (Listen → Image) exercise type if any lesson uses it:
   - Build `/components/exercises/ListenToImageExercise.tsx`
   - Similar to L_TO_M but shows images instead of text
   - Update `/app/lesson/exercise.tsx` to handle it

4. As lesson 4 (family) is added, find or create simple iconographic images for family members. SVGs via react-native-svg are fine and small. Free sources: Lucide icons, flaticon (with attribution).

5. After all 10 lessons are authored, run the asset validation script. Audio files will be missing — that's the next thing I (the user) will record.

Commit when done. Then I'll go record audio for lessons 2–10 (~130 clips) over a weekend.
```

**Verification prompt:**

```
1. Show me the full lesson list with titles on the home screen.
2. Open lesson 5 (extended family). Walk me through the JSON — does each phrase have correct distractor IDs, audio paths, and notes?
3. Run a TypeScript check: tsc --noEmit. Zero errors expected.
4. Run validate-assets. Tell me how many audio files I need to record.
```

---

## ✨ Sprint 8 — Polish and APK Build

```
Sprint 8: ship it.

Tasks:
1. Onboarding flow:
   - On first launch (no user name set), show a 3-screen onboarding:
     - Screen 1: "Welcome to Bolo Urdu" + tagline
     - Screen 2: "What's your name?" — text input
     - Screen 3: "How should we address you?" — gender radio
   - Save to useUserStore/useProgressStore.preferences
   - Then enter home screen

2. Polish pass on all screens — review every screen for:
   - Consistent spacing (multiples of 4)
   - Consistent corner radii (12px buttons, 16px cards)
   - Touch targets at least 44x44
   - No clipped text on narrow screens
   - Readable contrast (WCAG AA at minimum)

3. Animations:
   - Subtle scale animation on button press (react-native-reanimated)
   - Fade-in for new exercise content
   - XP count-up animation on result screen

4. Sound design:
   - Verify correct/incorrect/lesson-complete sounds are warm, not jarring
   - Volume levels consistent

5. Error states:
   - Graceful handling of missing audio (TTS fallback already in place)
   - Graceful handling of speech recognition failure (offer "I said it correctly" button)
   - Graceful handling of denied mic permission (show in-app explainer, button to open settings)

6. Empty / first-time states:
   - Home screen on first launch with no streak yet
   - Lesson card "best score" hidden if never attempted

7. Splash screen and app icon:
   - Generate a simple icon — a stylized "ب" (Urdu letter "be") or chai cup or similar — using a vector tool
   - Splash screen: brand color with the icon centered
   - Use expo-splash-screen and expo-system-ui

8. EAS Build setup:
   - Configure eas.json with a "preview" profile (APK output, internal distribution)
   - Build the APK: `eas build --platform android --profile preview`
   - This produces a downloadable APK link

9. README.md update — write a clear README with:
   - What the app is
   - Tech stack
   - How to run locally
   - How to build an APK
   - Known limitations
   - Roadmap teaser (Stage 2, 3, 4)

Commit when done. Tag the commit "v1.0-mvp".
```

**Verification prompt:**

```
1. Install the APK on a physical Android device by sideloading the EAS Build output.
2. Hand the device to a friend who has never seen the app. Watch them complete Lesson 1 without explanation. Note where they hesitate, where they tap the wrong thing, where they laugh.
3. Run for 30 minutes — no crashes acceptable.
4. APK size — should be under 100 MB.
5. Take a screenshot of every screen. These become your investor demo materials.
```

---

## 🆘 Recovery Prompts (when things go sideways)

### When something is broken and you don't know why

```
Don't fix anything yet. First:
1. Read the relevant section of urdu_app_mvp_spec.md
2. Tell me what the spec says SHOULD happen
3. Tell me what's actually happening (run the code; check the logs)
4. Identify the gap between the two
5. Propose the smallest possible fix
6. Wait for me to approve before changing files
```

### When Claude proposes something not in the spec

```
That's not in the spec. Before we deviate, explain:
1. What specific problem are you solving?
2. Why does the spec's approach not work?
3. What are the downsides of your proposal?

If after explaining, the spec is genuinely wrong, we update the spec FIRST, then the code.
```

### When you want to refactor

```
We don't refactor mid-sprint. Document what you'd want to clean up in a /TODO.md file with a "Refactor" section, then continue with the sprint as written.
```

### When ASR is being wild

```
Speech recognition quality varies by device and is inherently noisy. Don't try to "fix" it in the code unless:
1. The scoring threshold is genuinely wrong (we can tune)
2. There's a real bug (e.g. listeners not detached)

What we DO want to add:
- A debug log of every (transcript, expected, score) tuple
- A way for me to see the last 10 attempts and their transcripts, so I can sanity-check

Build a hidden debug screen at /app/debug.tsx (accessible via the same long-press in settings as the reset button) that shows the last 20 speech attempts.
```

### When you hit a "this can't be done in Expo Go" wall

```
@react-native-voice/voice is a native module. Likely we've outgrown Expo Go and need a development build. Walk me through:
1. Whether this is the issue
2. How to set up `npx expo prebuild` and a development build
3. Whether EAS Build can issue a dev client APK for me
```

---

## 🪜 What comes after MVP

These aren't prompts — they're a heads-up for future sprints once MVP ships:

1. **iOS port** — `eas build --platform ios`, plus an Apple Developer account ($99/year)
2. **Cloud sync** — Supabase free tier is enough for thousands of users; auth + a single `progress` table
3. **L_TO_I image library** — illustrated phrase cards for family, food, colors lessons
4. **SRS layer** — spaced repetition for review (not just lesson-bundled review)
5. **Tutor/native-speaker integration** — record one's own audio for personalized review
6. **Nastaliq track** — Stage 3+ literacy lessons
7. **Stage 2 content build** — lessons 11–25 (full daily-life curriculum)

---

## 🧭 Final Tips From Project Manager Hat

- **Don't skip the verification prompts.** They're how you catch regressions before they pile up.
- **Commit at the end of every sprint.** Tag the commits (`v0.1-sprint-3`, etc.). If anything breaks, you can always roll back.
- **Take screenshots after every sprint.** Build a `/docs/progress/` folder. You'll need these for the investor pitch.
- **Record audio in parallel with development, starting Sprint 3.** It's the gating-task that will surprise you with how long it takes. Block 4 hours on a weekend for Lesson 1's audio; aim for a full lesson per sitting.
- **Test on a real Android device, not just an emulator.** Speech recognition behaves very differently on real hardware.
- **Show the app to 3 people before sprint 8.** Their feedback shapes the polish sprint. Friends, family, classmates.
- **Keep a `/RUNNING_NOTES.md` file** as a journal: what didn't work, what surprised you, what design decisions you made on the fly. This becomes the "lessons learned" doc that helps you (or future contributors) onboard to Stage 2 development.

Good luck, build well, and may your bhook never be lagi while debugging. 🌙
