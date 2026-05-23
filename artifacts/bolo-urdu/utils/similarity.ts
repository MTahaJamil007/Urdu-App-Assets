export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?؟،]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
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

export function similarity(a: string, b: string): number {
  const aN = normalize(a);
  const bN = normalize(b);
  if (!aN && !bN) return 1;
  if (!aN || !bN) return 0;
  const maxLen = Math.max(aN.length, bN.length);
  const dist = levenshtein(aN, bN);
  return 1 - dist / maxLen;
}
