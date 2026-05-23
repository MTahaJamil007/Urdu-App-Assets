#!/usr/bin/env node
/**
 * generateAudioMap.js
 * Walks assets/audio/ and generates services/audioMap.ts with one require() per .m4a file.
 *
 * Run: pnpm gen:audio
 *      (or: node scripts/generateAudioMap.js)
 *
 * After running, restart the Expo dev server so Metro picks up new assets.
 */

const fs = require('fs');
const path = require('path');

const AUDIO_ROOT = path.join(__dirname, '..', 'assets', 'audio');
const OUT_FILE = path.join(__dirname, '..', 'services', 'audioMap.ts');

function walk(dir, base = '') {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    const rel = base ? `${base}/${name}` : name;
    if (fs.statSync(full).isDirectory()) return walk(full, rel);
    if (name.endsWith('.m4a') || name.endsWith('.mp3') || name.endsWith('.wav')) return [rel];
    return [];
  });
}

const files = walk(AUDIO_ROOT);

const entries = files
  .map((rel) => {
    const key = `audio/${rel}`;
    const requirePath = `../assets/audio/${rel}`;
    return `  "${key}": require("${requirePath}"),`;
  })
  .join('\n');

const output = `// AUTO-GENERATED — do not edit manually. Run \`pnpm gen:audio\` to regenerate.
// Add audio files to assets/audio/ then re-run this script.
// Files present: ${files.length}
const audioMap: Record<string, number> = {
${entries || '  // No audio files found yet — all phrases will use TTS fallback.'}
};

export default audioMap;
`;

fs.writeFileSync(OUT_FILE, output, 'utf8');
console.log(`[gen:audio] wrote ${files.length} entries to services/audioMap.ts`);
if (files.length === 0) {
  console.log('[gen:audio] Tip: drop .m4a files into assets/audio/C01/sabrina/ then re-run.');
}
