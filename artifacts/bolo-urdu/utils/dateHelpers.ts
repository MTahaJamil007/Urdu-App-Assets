export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getYesterdayString(): string {
  return new Date(Date.now() - 86400000).toISOString().split('T')[0];
}

export function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr === getTodayString();
}

export function isYesterday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr === getYesterdayString();
}
