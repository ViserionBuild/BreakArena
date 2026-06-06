import { Match, Player, Round } from '../types';
import { calculateCallBreakScore, PLAYER_COLORS } from '../utils';
import { ApiMatch, ApiPlayer, ApiRound } from './types';

export const PLACEHOLDER_ROUND_PREFIX = '__placeholder__';

export function isPlaceholderRoundId(roundId: string): boolean {
  return roundId.startsWith(PLACEHOLDER_ROUND_PREFIX);
}

export function mapPlayer(api: ApiPlayer): Player {
  return {
    id: api.id,
    name: api.name,
    avatar: api.avatar || '🃏',
    color: api.color || PLAYER_COLORS[0],
    createdAt: api.created_at,
    stats: {
      totalMatches: api.stats?.total_matches ?? 0,
      wins: api.stats?.matches_won ?? 0,
      totalScore: api.stats?.total_score ?? 0,
      averageScore: api.stats?.avg_score_per_round ?? 0,
      winRate: api.stats?.win_percentage ?? 0,
    },
  };
}

function getOrderedPlayerIds(apiMatch: ApiMatch): string[] {
  if (apiMatch.players?.length) {
    return apiMatch.players
      .slice()
      .sort((a, b) => a.seat - b.seat)
      .map((player) => player.id);
  }

  return [apiMatch.p1_id, apiMatch.p2_id, apiMatch.p3_id, apiMatch.p4_id].filter(
    (id): id is string => Boolean(id)
  );
}

function getSlotValue(round: ApiRound, slot: number, field: 'bid' | 'actual_wins' | 'total_score'): number {
  const key = `p${slot}_${field}` as keyof ApiRound;
  return Number(round[key] ?? 0);
}

function mapRounds(apiMatch: ApiMatch, playerIds: string[]): Round[] {
  const prevCumulative = new Map<string, number>();
  playerIds.forEach((id) => prevCumulative.set(id, 0));

  return (apiMatch.rounds ?? [])
    .slice()
    .sort((a, b) => a.round_number - b.round_number)
    .map((round) => ({
      id: round.id,
      roundNumber: round.round_number,
      scores: playerIds.map((playerId, index) => {
        const slot = index + 1;
        const bid = getSlotValue(round, slot, 'bid');
        const actualWins = getSlotValue(round, slot, 'actual_wins');
        const cumulative = getSlotValue(round, slot, 'total_score');
        const previous = prevCumulative.get(playerId) ?? 0;
        const score =
          cumulative > 0 || bid !== 0 || actualWins !== 0
            ? cumulative - previous
            : calculateCallBreakScore(bid, actualWins);
        prevCumulative.set(playerId, cumulative);

        return {
          playerId,
          bid,
          actualWins,
          score: Math.round(score * 100) / 100,
        };
      }),
    }));
}

function padRounds(rounds: Round[], totalRounds: number, playerIds: string[]): Round[] {
  if (!totalRounds || totalRounds <= rounds.length) return rounds;

  const padded = [...rounds];
  for (let roundNumber = rounds.length + 1; roundNumber <= totalRounds; roundNumber++) {
    padded.push({
      id: `${PLACEHOLDER_ROUND_PREFIX}${roundNumber}`,
      roundNumber,
      scores: playerIds.map((playerId) => ({
        playerId,
        bid: 0,
        actualWins: 0,
        score: 0,
      })),
    });
  }

  return padded;
}

function mapMatchPlayers(apiMatch: ApiMatch, playerIds: string[]): Match['players'] {
  const ranked = playerIds
    .map((playerId, index) => {
      const apiPlayer = apiMatch.players?.find((player) => player.id === playerId);
      const slot = index + 1;
      const totalScore = Number(
        apiPlayer?.total_score ?? apiMatch[`p${slot}_total_score` as keyof ApiMatch] ?? 0
      );
      return { playerId, totalScore };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  return playerIds.map((playerId, index) => {
    const apiPlayer = apiMatch.players?.find((player) => player.id === playerId);
    const slot = index + 1;
    const totalScore = Number(
      apiPlayer?.total_score ?? apiMatch[`p${slot}_total_score` as keyof ApiMatch] ?? 0
    );

    return {
      playerId,
      seatOrder: (apiPlayer?.seat ?? slot) - 1,
      totalScore: Math.round(totalScore * 100) / 100,
      rank: ranked.findIndex((entry) => entry.playerId === playerId) + 1,
    };
  });
}

export function mapMatch(apiMatch: ApiMatch): Match {
  const playerIds = getOrderedPlayerIds(apiMatch);
  const rounds = padRounds(mapRounds(apiMatch, playerIds), apiMatch.total_rounds, playerIds);

  return {
    id: apiMatch.id,
    status: apiMatch.status,
    winnerId: apiMatch.winner_id || undefined,
    matchDate: apiMatch.match_date,
    matchNumber: apiMatch.match_number,
    createdAt: apiMatch.created_at,
    endedAt: apiMatch.ended_at || undefined,
    totalRounds: apiMatch.total_rounds,
    players: mapMatchPlayers(apiMatch, playerIds),
    rounds,
  };
}
