export function calculateScore(bid: number, actualWins: number): number {
  if (actualWins >= bid) {
    return bid + actualWins - bid;
  } else {
    return -bid;
  }
}

export function calculateCallBreakScore(bid: number, actualWins: number): number {
  if (actualWins >= bid) {
    return bid + (actualWins - bid) * 0.1;
  } else {
    return -bid;
  }
}

export function formatScore(score: number): string {
  if (score > 0) return `+${score.toFixed(1)}`;
  return score.toFixed(1);
}

export function formatActualTotal(total: number): string {
  const rounded = Math.round(total * 10) / 10;
  const formatted = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return formatted;
}

export function computePlayerActualTotal(
  rounds: { scores: { playerId: string; actualWins: number }[] }[],
  playerId: string,
  throughRoundIndex?: number
): number {
  const slice = throughRoundIndex === undefined ? rounds : rounds.slice(0, throughRoundIndex + 1);
  const total = slice.reduce((sum, round) => {
    const score = round.scores.find((s) => s.playerId === playerId);
    return sum + (score?.actualWins || 0);
  }, 0);

  return Math.round(total * 10) / 10;
}

export function getRankChange(prevRank: number | undefined, currentRank: number): 'up' | 'down' | 'same' | 'new' {
  if (prevRank === undefined) return 'new';
  if (prevRank > currentRank) return 'up';
  if (prevRank < currentRank) return 'down';
  return 'same';
}

export function computeRankings(players: { playerId: string; totalScore: number }[]): { playerId: string; rank: number }[] {
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
  return sorted.map((p, i) => ({ playerId: p.playerId, rank: i + 1 }));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const MAX_MATCH_ROUNDS = 50;

export const PLAYER_COLORS = [
  '#fbbf24',
  '#f87171',
  '#4ade80',
  '#a78bfa',
];

export const PLAYER_EMOJIS = ['♠️', '♥️', '♦️', '♣️', '🃏', '🎴', '🎰', '🎲'];

export const DEFAULT_PLAYERS = [
  { name: 'North', avatar: '♠️', color: PLAYER_COLORS[0] },
  { name: 'East', avatar: '♥️', color: PLAYER_COLORS[1] },
  { name: 'South', avatar: '♦️', color: PLAYER_COLORS[2] },
  { name: 'West', avatar: '♣️', color: PLAYER_COLORS[3] },
];

export const INDIAN_TIME_ZONE = 'Asia/Kolkata';
export const INDIAN_TIME_OFFSET = '+05:30';

const hasTimeZoneOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const hasTimeComponent = /\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/;

const indianDateKeyFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: INDIAN_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function normalizeIndianTimestamp(timestamp?: string | null): string | undefined {
  if (!timestamp) return undefined;
  if (!hasTimeComponent.test(timestamp) || hasTimeZoneOffset.test(timestamp)) return timestamp;
  return `${timestamp.replace(' ', 'T')}${INDIAN_TIME_OFFSET}`;
}

export function parseIndianTimestamp(timestamp: string): Date {
  return new Date(normalizeIndianTimestamp(timestamp) ?? timestamp);
}

export function getIndianDateKey(dateStr: string): string {
  const date = parseIndianTimestamp(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr.slice(0, 10);

  const parts = indianDateKeyFormatter.formatToParts(date);
  const day = parts.find((part) => part.type === 'day')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const year = parts.find((part) => part.type === 'year')?.value;

  if (!day || !month || !year) return dateStr.slice(0, 10);
  return `${year}-${month}-${day}`;
}

export function formatMatchDate(dateStr: string): string {
  const parts = dateStr.slice(0, 10).split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: INDIAN_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatMatchLabel(
  matches: { matchDate?: string; createdAt: string; matchNumber?: number }[],
  createdAt: string,
  matchDate?: string,
  matchNumber?: number
): string {
  // Prefer the explicit match_date stored in the DB; only fall back to
  // created_at when match_date is missing (legacy rows).
  const rawDate = matchDate || (createdAt ? getIndianDateKey(createdAt) : '');
  const formattedDate = formatMatchDate(rawDate);
  if (matchNumber) return `${formattedDate}: ${matchNumber}`;
  const computedNumber =
    matches.filter(
      (m) =>
        (m.matchDate || (m.createdAt ? getIndianDateKey(m.createdAt) : '')) === rawDate &&
        parseIndianTimestamp(m.createdAt) <= parseIndianTimestamp(createdAt)
    ).length || 1;
  return `${formattedDate}: ${computedNumber}`;
}

export function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
