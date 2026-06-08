export interface Player {
  id: string;
  name: string;
  avatar: string; // emoji
  color: string;
  isActive: boolean;
  createdAt: string;
  stats: PlayerStats;
}

export interface PlayerStats {
  totalMatches: number;
  wins: number;
  totalScore: number;
  averageScore: number;
  winRate: number;
}

export interface Match {
  id: string;
  players: MatchPlayer[];
  rounds: Round[];
  status: 'active' | 'paused' | 'completed';
  winnerId?: string;
  matchDate: string;
  matchNumber: number;
  createdAt: string;
  endedAt?: string;
  totalRounds?: number;
}

export interface MatchPlayer {
  playerId: string;
  seatOrder: number;
  totalScore: number;
  rank: number;
  prevRank?: number;
}

export interface Round {
  id: string;
  roundNumber: number;
  scores: RoundScore[];
}

export interface RoundScore {
  playerId: string;
  bid: number;
  actualWins: number;
  score: number;
}

export interface Group {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Page = 'groupAuth' | 'dashboard' | 'players' | 'matchSetup' | 'liveMatch' | 'history' | 'analytics';
