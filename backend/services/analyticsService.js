const supabase = require('../database/supabase');
const { calculateRankings, buildScoreHistory } = require('../utils/scoring');

/**
 * Return cumulative score progression and rank history for a match.
 * Used to power the frontend graphs.
 */
const getMatchAnalytics = async (matchId) => {
  // Fetch all match players
  const { data: matchPlayers, error: mpError } = await supabase
    .from('match_players')
    .select('user_id, seat_order, users(id, name, avatar)')
    .eq('match_id', matchId)
    .order('seat_order');

  if (mpError) throw mpError;
  const playerIds = matchPlayers.map((mp) => mp.user_id);

  // Fetch all round scores joined to round numbers
  const { data: roundScores, error: rsError } = await supabase
    .from('round_scores')
    .select('user_id, score, bid, actual_wins, rounds(round_number)')
    .in(
      'round_id',
      (
        await supabase
          .from('rounds')
          .select('id')
          .eq('match_id', matchId)
      ).data.map((r) => r.id)
    );

  if (rsError) throw rsError;

  // Flatten round_number into each score row
  const flatScores = roundScores.map((rs) => ({
    user_id: rs.user_id,
    score: rs.score,
    bid: rs.bid,
    actual_wins: rs.actual_wins,
    round_number: rs.rounds?.round_number,
  }));

  // Build cumulative history
  const scoreHistory = buildScoreHistory(flatScores, playerIds);

  // Current cumulative totals
  const totals = playerIds.map((id) => {
    const history = scoreHistory[id];
    const cumulative = history.length > 0 ? history[history.length - 1].cumulative : 0;
    return { user_id: id, cumulative_score: cumulative };
  });

  const rankings = calculateRankings(totals);

  // Build rank history per round
  const roundNumbers = [
    ...new Set(flatScores.map((s) => s.round_number)),
  ].sort((a, b) => a - b);

  const rankHistory = roundNumbers.map((roundNum) => {
    const snapshot = playerIds.map((id) => {
      const entry = scoreHistory[id].find((e) => e.round === roundNum);
      return { user_id: id, cumulative_score: entry?.cumulative ?? 0 };
    });
    const ranked = calculateRankings(snapshot);
    return { round: roundNum, rankings: ranked };
  });

  return {
    match_id: matchId,
    players: matchPlayers,
    score_history: scoreHistory,
    current_rankings: rankings,
    rank_history: rankHistory,
    total_rounds: roundNumbers.length,
  };
};

/**
 * Get global leaderboard — aggregate stats across all completed matches.
 */
const getGlobalLeaderboard = async () => {
  const { data, error } = await supabase
    .from('users')
    .select(
      `
      id, name, avatar,
      match_players (
        match_id,
        matches ( status, winner_id )
      ),
      round_scores ( score )
    `
    );

  if (error) throw error;

  const leaderboard = data.map((player) => {
    const completedMatches = player.match_players.filter(
      (mp) => mp.matches?.status === 'completed'
    );
    const wins = completedMatches.filter(
      (mp) => mp.matches?.winner_id === player.id
    ).length;
    const totalScore = player.round_scores.reduce(
      (sum, rs) => sum + (rs.score ?? 0),
      0
    );
    const totalMatches = player.match_players.length;

    return {
      player_id: player.id,
      name: player.name,
      avatar: player.avatar,
      total_matches: totalMatches,
      matches_won: wins,
      win_percentage:
        totalMatches > 0 ? +((wins / totalMatches) * 100).toFixed(1) : 0,
      total_score: +totalScore.toFixed(2),
    };
  });

  return leaderboard.sort((a, b) => b.total_score - a.total_score);
};

module.exports = { getMatchAnalytics, getGlobalLeaderboard };
