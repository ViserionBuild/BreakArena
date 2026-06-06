import { api } from './client';
import { isPlaceholderRoundId, mapMatch, mapPlayer } from './mappers';
import { ApiMatch, ApiMatchList, ApiPlayer } from './types';
import { Match, Player } from '../types';

type PlayerScorePayload = { user_id: string; bid: number; actual_wins: number };

export const playersApi = {
  list: async (): Promise<Player[]> => {
    const data = await api<ApiPlayer[]>('/players');
    return data.map(mapPlayer);
  },

  create: async (name: string, avatar: string): Promise<Player> => {
    const data = await api<ApiPlayer>('/players', {
      method: 'POST',
      body: JSON.stringify({ name, avatar }),
    });
    return mapPlayer(data);
  },

  update: async (id: string, name: string, avatar: string): Promise<Player> => {
    const data = await api<ApiPlayer>(`/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, avatar }),
    });
    return mapPlayer(data);
  },

  delete: async (id: string): Promise<void> => {
    await api<null>(`/players/${id}`, { method: 'DELETE' });
  },
};

export const matchesApi = {
  list: async (params?: { status?: string; limit?: number }): Promise<Match[]> => {
    const search = new URLSearchParams();
    if (params?.status) search.set('status', params.status);
    if (params?.limit) search.set('limit', String(params.limit));
    const query = search.toString();
    const data = await api<ApiMatchList>(`/matches${query ? `?${query}` : ''}`);
    return data.matches.map(mapMatch);
  },

  get: async (id: string): Promise<Match> => {
    const data = await api<ApiMatch>(`/matches/${id}`);
    return mapMatch(data);
  },

  create: async (playerIds: string[], totalRounds: number): Promise<Match> => {
    const data = await api<ApiMatch>('/matches', {
      method: 'POST',
      body: JSON.stringify({ player_ids: playerIds, total_rounds: totalRounds }),
    });
    return mapMatch(data);
  },

  complete: async (id: string): Promise<Match> => {
    const data = await api<ApiMatch>(`/matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'completed' }),
    });
    return mapMatch(data);
  },

  updateTotalRounds: async (id: string, totalRounds: number): Promise<Match> => {
    const data = await api<ApiMatch>(`/matches/${id}/total-rounds`, {
      method: 'PATCH',
      body: JSON.stringify({ total_rounds: totalRounds }),
    });
    return mapMatch(data);
  },

  resume: async (id: string): Promise<Match> => {
    const data = await api<ApiMatch>(`/matches/${id}/resume`, { method: 'PATCH' });
    return mapMatch(data);
  },

  delete: async (id: string): Promise<void> => {
    await api<null>(`/matches/${id}`, { method: 'DELETE' });
  },
};

export const roundsApi = {
  createRound: async (matchId: string, playerScores: PlayerScorePayload[]): Promise<void> => {
    await api('/rounds', {
      method: 'POST',
      body: JSON.stringify({ match_id: matchId, player_scores: playerScores }),
    });
  },

  updateRound: async (roundId: string, playerScores: PlayerScorePayload[]): Promise<void> => {
    await api(`/rounds/${roundId}`, {
      method: 'PUT',
      body: JSON.stringify({ player_scores: playerScores }),
    });
  },

  deleteRound: async (roundId: string): Promise<Match> => {
    const data = await api<ApiMatch>(`/rounds/${roundId}`, { method: 'DELETE' });
    return mapMatch(data);
  },

  saveRoundScores: async (
    match: Match,
    roundId: string,
    playerScores: PlayerScorePayload[]
  ): Promise<Match> => {
    const round = match.rounds.find((entry) => entry.id === roundId);
    if (!round) {
      throw new Error('Round not found');
    }

    if (isPlaceholderRoundId(roundId)) {
      const persistedRounds = match.rounds.filter((entry) => !isPlaceholderRoundId(entry.id));

      for (let roundNumber = persistedRounds.length + 1; roundNumber < round.roundNumber; roundNumber++) {
        const emptyScores = match.players.map((matchPlayer) => ({
          user_id: matchPlayer.playerId,
          bid: 0,
          actual_wins: 0,
        }));
        await roundsApi.createRound(match.id, emptyScores);
      }

      await roundsApi.createRound(match.id, playerScores);
    } else {
      await roundsApi.updateRound(roundId, playerScores);
    }

    return matchesApi.get(match.id);
  },
};

export { ApiError } from './client';
