export interface ApiPlayerStats {
  player_id: string;
  total_matches: number;
  matches_won: number;
  win_percentage: number;
  total_rounds: number;
  total_score: number;
  avg_score_per_round: number;
}

export interface ApiPlayer {
  id: string;
  name: string;
  avatar: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  stats?: ApiPlayerStats;
}

export interface ApiMatchPlayer {
  id: string;
  name: string;
  avatar: string | null;
  color: string;
  seat: number;
  total_score: number;
}

export interface ApiRound {
  id: string;
  round_number: number;
  created_at?: string;
  p1_bid: number;
  p1_actual_wins: number;
  p1_total_score: number;
  p2_bid: number;
  p2_actual_wins: number;
  p2_total_score: number;
  p3_bid: number;
  p3_actual_wins: number;
  p3_total_score: number;
  p4_bid: number;
  p4_actual_wins: number;
  p4_total_score: number;
}

export interface ApiMatch {
  id: string;
  status: 'active' | 'paused' | 'completed';
  winner_id: string | null;
  match_date: string;
  match_number: number;
  total_rounds: number;
  created_at: string;
  ended_at: string | null;
  p1_id?: string;
  p2_id?: string;
  p3_id?: string;
  p4_id?: string;
  p1_total_score?: number;
  p2_total_score?: number;
  p3_total_score?: number;
  p4_total_score?: number;
  players?: ApiMatchPlayer[];
  rounds?: ApiRound[];
}

export interface ApiMatchList {
  matches: ApiMatch[];
  total: number;
  page: number;
  limit: number;
}
