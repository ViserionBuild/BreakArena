import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { matchesApi, playersApi, roundsApi, groupsApi } from '../api';
import { isPlaceholderRoundId } from '../api/mappers';
import { ApiError } from '../api/client';
import { Group, Player, Match, Page } from '../types';

interface AppState {
  currentPage: Page;
  setPage: (page: Page) => void;
  selectedHistoryMatchId: string | null;
  setSelectedHistoryMatchId: (matchId: string | null) => void;

  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  clearError: () => void;

  // ── Group auth ──
  currentGroup: Group | null;
  groupToken: string | null;
  groupSignIn: (name: string, passcode: string) => Promise<void>;
  groupCreate: (name: string, passcode: string) => Promise<void>;
  groupResetPasscode: (name: string, current: string, next: string) => Promise<void>;
  groupSignOut: () => void;

  players: Player[];
  matches: Match[];
  activeMatchId: string | null;
  setActiveMatchId: (matchId: string | null) => void;

  initialize: () => Promise<void>;
  refreshPlayers: () => Promise<void>;
  refreshMatches: () => Promise<void>;
  fetchMatch: (matchId: string) => Promise<Match | null>;

  addPlayer: (name: string, avatar: string) => Promise<void>;
  updatePlayer: (id: string, name: string, avatar: string) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  reactivatePlayer: (id: string) => Promise<void>;

  createMatch: (playerIds: string[], totalRounds?: number) => Promise<string>;
  initializeMatchRounds: (matchId: string) => Promise<void>;
  updateRoundScore: (
    matchId: string,
    roundId: string,
    playerId: string,
    bid: number,
    actualWins: number
  ) => Promise<void>;
  undoLastRound: (matchId: string) => Promise<void>;
  redoLastRound: (matchId: string) => Promise<void>;
  deleteRound: (matchId: string, roundId: string) => Promise<void>;
  increaseMatchRounds: (matchId: string) => Promise<void>;
  reduceMatchRounds: (matchId: string) => Promise<void>;
  endMatch: (matchId: string) => Promise<void>;
  resumeMatch: (matchId: string) => Promise<void>;
  deleteMatch: (matchId: string) => Promise<void>;

  getActiveMatch: () => Match | null;
  getPlayer: (id: string) => Player | undefined;
}

const mergeMatch = (matches: Match[], match: Match): Match[] => {
  const exists = matches.some((entry) => entry.id === match.id);
  if (!exists) return [match, ...matches];
  return matches.map((entry) => (entry.id === match.id ? match : entry));
};

const isLiveMatch = (match: Match): boolean => match.status === 'active' || match.status === 'paused';

const getSelectedLiveMatchId = (matches: Match[], selectedMatchId: string | null): string | null => {
  const selectedMatch = selectedMatchId ? matches.find((match) => match.id === selectedMatchId) : null;
  if (selectedMatch && isLiveMatch(selectedMatch)) return selectedMatch.id;
  return matches.find(isLiveMatch)?.id ?? null;
};

const getErrorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentPage: 'groupAuth',
      setPage: (page) => set({ currentPage: page }),
      selectedHistoryMatchId: null,
      setSelectedHistoryMatchId: (matchId) => set({ selectedHistoryMatchId: matchId }),

      isLoading: false,
      isSaving: false,
      error: null,
      clearError: () => set({ error: null }),

      // ── Group auth ──
      currentGroup: null,
      groupToken: null,

      groupSignIn: async (name, passcode) => {
        set({ isSaving: true, error: null });
        try {
          const { group, token } = await groupsApi.signIn(name, passcode);
          set({ currentGroup: group, groupToken: token, isSaving: false, currentPage: 'dashboard' });
          await get().initialize();
        } catch (error) {
          set({ isSaving: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      groupCreate: async (name, passcode) => {
        set({ isSaving: true, error: null });
        try {
          const { group, token } = await groupsApi.create(name, passcode);
          set({ currentGroup: group, groupToken: token, isSaving: false, currentPage: 'dashboard' });
          await get().initialize();
        } catch (error) {
          set({ isSaving: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      groupResetPasscode: async (name, current, next) => {
        set({ isSaving: true, error: null });
        try {
          const { group, token } = await groupsApi.resetPasscode(name, current, next);
          set({ currentGroup: group, groupToken: token, isSaving: false });
        } catch (error) {
          set({ isSaving: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      groupSignOut: () => {
        set({
          currentGroup: null,
          groupToken: null,
          currentPage: 'groupAuth',
          players: [],
          matches: [],
          activeMatchId: null,
        });
      },

      players: [],
      matches: [],
      activeMatchId: null,
      setActiveMatchId: (matchId) => set({ activeMatchId: matchId }),

      initialize: async () => {
        set({ isLoading: true, error: null });
        try {
          const [players, matches] = await Promise.all([
            playersApi.list(),
            matchesApi.list({ limit: 100 }),
          ]);
          set({
            players,
            matches,
            activeMatchId: getSelectedLiveMatchId(matches, get().activeMatchId),
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false, error: getErrorMessage(error) });
        }
      },

      refreshPlayers: async () => {
        try {
          const players = await playersApi.list();
          set({ players, error: null });
        } catch (error) {
          set({ error: getErrorMessage(error) });
        }
      },

      refreshMatches: async () => {
        try {
          const matches = await matchesApi.list({ limit: 100 });
          set({
            matches,
            activeMatchId: getSelectedLiveMatchId(matches, get().activeMatchId),
            error: null,
          });
        } catch (error) {
          set({ error: getErrorMessage(error) });
        }
      },

      fetchMatch: async (matchId) => {
        try {
          const match = await matchesApi.get(matchId);
          set((state) => ({
            matches: mergeMatch(state.matches, match),
            error: null,
          }));
          return match;
        } catch (error) {
          set({ error: getErrorMessage(error) });
          return null;
        }
      },

      addPlayer: async (name, avatar) => {
        set({ isSaving: true, error: null });
        try {
          const player = await playersApi.create(name, avatar);
          set((state) => ({
            players: [...state.players, player].sort((a, b) => a.name.localeCompare(b.name)),
            isSaving: false,
          }));
        } catch (error) {
          set({ isSaving: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      updatePlayer: async (id, name, avatar) => {
        set({ isSaving: true, error: null });
        try {
          const player = await playersApi.update(id, name, avatar);
          set((state) => ({
            players: state.players
              .map((entry) => (entry.id === id ? player : entry))
              .sort((a, b) => a.name.localeCompare(b.name)),
            isSaving: false,
          }));
        } catch (error) {
          set({ isSaving: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      deletePlayer: async (id) => {
        set({ isSaving: true, error: null });
        try {
          await playersApi.delete(id);
          // Soft-delete: keep the player in the store but mark inactive
          set((state) => ({
            players: state.players.map((player) =>
              player.id === id ? { ...player, isActive: false } : player
            ),
            isSaving: false,
          }));
        } catch (error) {
          set({ isSaving: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      reactivatePlayer: async (id) => {
        set({ isSaving: true, error: null });
        try {
          await playersApi.reactivate(id);
          set((state) => ({
            players: state.players.map((player) =>
              player.id === id ? { ...player, isActive: true } : player
            ),
            isSaving: false,
          }));
        } catch (error) {
          set({ isSaving: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      createMatch: async (playerIds, totalRounds = 10) => {
        set({ isSaving: true, error: null });
        try {
          const match = await matchesApi.create(playerIds, totalRounds);
          set((state) => ({
            matches: [match, ...state.matches.filter((entry) => entry.id !== match.id)],
            activeMatchId: match.id,
            selectedHistoryMatchId: null,
            isSaving: false,
          }));
          return match.id;
        } catch (error) {
          set({ isSaving: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      initializeMatchRounds: async (matchId: string) => {
        await get().fetchMatch(matchId);
      },

      updateRoundScore: async (matchId, roundId, playerId, bid, actualWins) => {
        const match = get().matches.find((entry) => entry.id === matchId);
        if (!match) return;

        const round = match.rounds.find((entry) => entry.id === roundId);
        if (!round) return;

        const playerScores = round.scores.map((score) => ({
          user_id: score.playerId,
          bid: score.playerId === playerId ? bid : score.bid,
          actual_wins: score.playerId === playerId ? actualWins : score.actualWins,
        }));

        set({ isSaving: true, error: null });
        try {
          const updatedMatch = await roundsApi.saveRoundScores(match, roundId, playerScores);
          set((state) => ({
            matches: mergeMatch(state.matches, updatedMatch),
            isSaving: false,
          }));
        } catch (error) {
          set({ isSaving: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      undoLastRound: async (matchId) => {
        const match = get().matches.find((entry) => entry.id === matchId);
        if (!match || match.rounds.length === 0) return;

        const lastRoundIndex = [...match.rounds]
          .reverse()
          .findIndex((round) => round.scores.some((score) => score.bid !== 0 || score.actualWins !== 0));

        if (lastRoundIndex === -1) return;

        const targetRound = match.rounds[match.rounds.length - 1 - lastRoundIndex];
        const playerScores = targetRound.scores.map((score) => ({
          user_id: score.playerId,
          bid: 0,
          actual_wins: 0,
        }));

        set({ isSaving: true, error: null });
        try {
          if (isPlaceholderRoundId(targetRound.id)) {
            await roundsApi.saveRoundScores(match, targetRound.id, playerScores);
          } else {
            await roundsApi.updateRound(targetRound.id, playerScores);
          }
          await get().fetchMatch(matchId);
          set({ isSaving: false });
        } catch (error) {
          set({ isSaving: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      redoLastRound: async (_matchId) => {
        // Not implemented on backend yet
      },

      deleteRound: async (_matchId, roundId) => {
        if (isPlaceholderRoundId(roundId)) return;

        set({ isSaving: true, error: null });
        try {
          const match = await roundsApi.deleteRound(roundId);
          set((state) => ({
            matches: mergeMatch(state.matches, match),
            isSaving: false,
          }));
        } catch (error) {
          set({ isSaving: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      increaseMatchRounds: async (matchId) => {
        const match = get().matches.find((entry) => entry.id === matchId);
        if (!match?.totalRounds) return;

        set({ isSaving: true, error: null });
        try {
          const updatedMatch = await matchesApi.updateTotalRounds(matchId, match.totalRounds + 1);
          set((state) => ({
            matches: mergeMatch(state.matches, updatedMatch),
            isSaving: false,
          }));
        } catch (error) {
          set({ isSaving: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      reduceMatchRounds: async (matchId) => {
        const match = get().matches.find((entry) => entry.id === matchId);
        if (!match?.totalRounds || match.totalRounds <= 1) return;

        set({ isSaving: true, error: null });
        try {
          const updatedMatch = await matchesApi.reduceTotalRounds(matchId);
          set((state) => ({
            matches: mergeMatch(state.matches, updatedMatch),
            isSaving: false,
          }));
        } catch (error) {
          set({ isSaving: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      endMatch: async (matchId) => {
        set({ isSaving: true, error: null });
        try {
          const match = await matchesApi.complete(matchId);
          const players = await playersApi.list();
          set((state) => ({
            matches: mergeMatch(state.matches, match),
            players,
            activeMatchId: state.activeMatchId === matchId ? null : state.activeMatchId,
            isSaving: false,
          }));
        } catch (error) {
          set({ isSaving: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      resumeMatch: async (matchId) => {
        set({ isSaving: true, error: null });
        try {
          const resumedMatch = await matchesApi.resume(matchId);
          const matches = await matchesApi.list({ limit: 100 });
          const normalizedMatches = matches.map((match) => {
            if (match.id === resumedMatch.id) return resumedMatch;
            return match;
          });

          set({
            matches: mergeMatch(normalizedMatches, resumedMatch),
            activeMatchId: matchId,
            selectedHistoryMatchId: null,
            currentPage: 'liveMatch',
            isSaving: false,
          });
        } catch (error) {
          set({ isSaving: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      deleteMatch: async (matchId) => {
        set({ isSaving: true, error: null });
        try {
          await matchesApi.delete(matchId);
          set((state) => ({
            matches: state.matches.filter((match) => match.id !== matchId),
            activeMatchId: state.activeMatchId === matchId ? null : state.activeMatchId,
            selectedHistoryMatchId:
              state.selectedHistoryMatchId === matchId ? null : state.selectedHistoryMatchId,
            isSaving: false,
          }));
        } catch (error) {
          set({ isSaving: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      getActiveMatch: () => {
        const { matches, activeMatchId } = get();
        return matches.find((match) => match.id === activeMatchId) || null;
      },

      getPlayer: (id) => get().players.find((player) => player.id === id),
    }),
    {
      name: 'callbreak-ui',
      partialize: (state) => ({
        currentPage: state.currentPage,
        selectedHistoryMatchId: state.selectedHistoryMatchId,
        currentGroup: state.currentGroup,
        groupToken: state.groupToken,
      }),
    }
  )
);
