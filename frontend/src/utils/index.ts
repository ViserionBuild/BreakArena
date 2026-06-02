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

export function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
