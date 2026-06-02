import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Player, Match, Round, RoundScore, Page } from '../types';
import { generateId, PLAYER_COLORS, computeRankings, calculateCallBreakScore } from '../utils';

interface AppState {
  // Navigation
  currentPage: Page;
  setPage: (page: Page) => void;

  // Players
  players: Player[];
  addPlayer: (name: string, avatar: string) => void;
  updatePlayer: (id: string, name: string, avatar: string) => void;
  deletePlayer: (id: string) => void;

  // Matches
  matches: Match[];
  activeMatchId: string | null;
  createMatch: (playerIds: string[], totalRounds?: number) => string;
  addRound: (matchId: string, scores: RoundScore[]) => void;
  undoLastRound: (matchId: string) => void;
  endMatch: (matchId: string) => void;
  deleteMatch: (matchId: string) => void;
  
  // Getters
  getActiveMatch: () => Match | null;
  getPlayer: (id: string) => Player | undefined;
}

const defaultPlayers: Player[] = [
  { id: '1', name: 'North', avatar: '♠️', color: PLAYER_COLORS[0], createdAt: new Date().toISOString(), stats: { totalMatches: 3, wins: 2, totalScore: 245, averageScore: 81.7, winRate: 66.7 } },
  { id: '2', name: 'East', avatar: '♥️', color: PLAYER_COLORS[1], createdAt: new Date().toISOString(), stats: { totalMatches: 3, wins: 1, totalScore: 198, averageScore: 66, winRate: 33.3 } },
  { id: '3', name: 'South', avatar: '♦️', color: PLAYER_COLORS[2], createdAt: new Date().toISOString(), stats: { totalMatches: 3, wins: 0, totalScore: 155, averageScore: 51.7, winRate: 0 } },
  { id: '4', name: 'West', avatar: '♣️', color: PLAYER_COLORS[3], createdAt: new Date().toISOString(), stats: { totalMatches: 3, wins: 0, totalScore: 132, averageScore: 44, winRate: 0 } },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentPage: 'dashboard',
      setPage: (page) => set({ currentPage: page }),

      players: defaultPlayers,

      addPlayer: (name, avatar) => {
        const id = generateId();
        const color = PLAYER_COLORS[get().players.length % PLAYER_COLORS.length];
        const player: Player = {
          id,
          name,
          avatar,
          color,
          createdAt: new Date().toISOString(),
          stats: { totalMatches: 0, wins: 0, totalScore: 0, averageScore: 0, winRate: 0 },
        };
        set((s) => ({ players: [...s.players, player] }));
      },

      updatePlayer: (id, name, avatar) => {
        set((s) => ({
          players: s.players.map((p) => (p.id === id ? { ...p, name, avatar } : p)),
        }));
      },

      deletePlayer: (id) => {
        set((s) => ({ players: s.players.filter((p) => p.id !== id) }));
      },

      matches: [],
      activeMatchId: null,

      createMatch: (playerIds, totalRounds = 10) => {
        const id = generateId();
        const match: Match = {
          id,
          players: playerIds.map((playerId, i) => ({
            playerId,
            seatOrder: i,
            totalScore: 0,
            rank: i + 1,
          })),
          rounds: [],
          status: 'active',
          createdAt: new Date().toISOString(),
          totalRounds,
        };
        set((s) => ({ matches: [match, ...s.matches], activeMatchId: id }));
        return id;
      },

      addRound: (matchId, scores) => {
        set((s) => {
          const matches = s.matches.map((m) => {
            if (m.id !== matchId) return m;

            const round: Round = {
              id: generateId(),
              roundNumber: m.rounds.length + 1,
              scores,
            };

            // Update totals
            const updatedPlayers = m.players.map((mp) => {
              const rs = scores.find((sc) => sc.playerId === mp.playerId);
              const roundScore = rs ? calculateCallBreakScore(rs.bid, rs.actualWins) : 0;
              return { ...mp, totalScore: mp.totalScore + roundScore };
            });

            // Compute rankings
            const rankings = computeRankings(updatedPlayers);
            const finalPlayers = updatedPlayers.map((mp) => {
              const newRank = rankings.find((r) => r.playerId === mp.playerId)?.rank || mp.rank;
              return { ...mp, prevRank: mp.rank, rank: newRank };
            });

            return { ...m, rounds: [...m.rounds, round], players: finalPlayers };
          });
          return { matches };
        });
      },

      undoLastRound: (matchId) => {
        set((s) => {
          const matches = s.matches.map((m) => {
            if (m.id !== matchId || m.rounds.length === 0) return m;
            const lastRound = m.rounds[m.rounds.length - 1];
            const updatedPlayers = m.players.map((mp) => {
              const rs = lastRound.scores.find((sc) => sc.playerId === mp.playerId);
              const roundScore = rs ? calculateCallBreakScore(rs.bid, rs.actualWins) : 0;
              return { ...mp, totalScore: mp.totalScore - roundScore };
            });
            const rankings = computeRankings(updatedPlayers);
            const finalPlayers = updatedPlayers.map((mp) => ({
              ...mp,
              rank: rankings.find((r) => r.playerId === mp.playerId)?.rank || mp.rank,
            }));
            return { ...m, rounds: m.rounds.slice(0, -1), players: finalPlayers };
          });
          return { matches };
        });
      },

      endMatch: (matchId) => {
        set((s) => {
          const match = s.matches.find((m) => m.id === matchId);
          if (!match) return {};
          const winner = [...match.players].sort((a, b) => b.totalScore - a.totalScore)[0];
          
          // Update player stats
          const updatedPlayers = s.players.map((p) => {
            const mp = match.players.find((mp) => mp.playerId === p.id);
            if (!mp) return p;
            const isWinner = mp.playerId === winner.playerId;
            const totalMatches = p.stats.totalMatches + 1;
            const wins = p.stats.wins + (isWinner ? 1 : 0);
            const totalScore = p.stats.totalScore + mp.totalScore;
            return {
              ...p,
              stats: {
                totalMatches,
                wins,
                totalScore,
                averageScore: Math.round((totalScore / totalMatches) * 10) / 10,
                winRate: Math.round((wins / totalMatches) * 1000) / 10,
              },
            };
          });

          const matches = s.matches.map((m) =>
            m.id === matchId
              ? { ...m, status: 'completed' as const, winnerId: winner.playerId, endedAt: new Date().toISOString() }
              : m
          );
          return { matches, players: updatedPlayers, activeMatchId: null };
        });
      },

      deleteMatch: (matchId) => {
        set((s) => ({
          matches: s.matches.filter((m) => m.id !== matchId),
          activeMatchId: s.activeMatchId === matchId ? null : s.activeMatchId,
        }));
      },

      getActiveMatch: () => {
        const { matches, activeMatchId } = get();
        return matches.find((m) => m.id === activeMatchId) || null;
      },

      getPlayer: (id) => get().players.find((p) => p.id === id),
    }),
    {
      name: 'callbreak-storage',
    }
  )
);
