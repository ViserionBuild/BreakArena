const supabase = require('../database/supabase');
const { calculateRankings, buildScoreHistory } = require('../utils/scoring');

/**
 * Return cumulative score progression and rank history for a match.
 * Used to power the frontend graphs.
 */
const getMatchAnalytics = async (matchId) => {
  // Fetch match row to get the 4 players (stored as p1_id..p4_id)
  const { data: matchRow, error: mError } = await supabase
    .from('matches')
    .select('p1_id, p2_id, p3_id, p4_id, p1:p1_id(id,name,avatar), p2:p2_id(id,name,avatar), p3:p3_id(id,name,avatar), p4:p4_id(id,name,avatar)')
    .eq('id', matchId)
    .single();

  if (mError) throw mError;

  const matchPlayers = [
    { seat_order: 1, user_id: matchRow.p1_id, users: matchRow.p1 },
    { seat_order: 2, user_id: matchRow.p2_id, users: matchRow.p2 },
    { seat_order: 3, user_id: matchRow.p3_id, users: matchRow.p3 },
    { seat_order: 4, user_id: matchRow.p4_id, users: matchRow.p4 },
  ].filter((p) => p.user_id);

  const playerIds = matchPlayers.map((p) => p.user_id);

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
      round_scores ( score, rounds ( match_id, matches ( status, winner_id ) ) )
    `
    );

  if (error) throw error;

  const leaderboard = data.map((player) => {
    // Collect unique matches this player participated in via their round scores
    const matchMap = {};
    player.round_scores.forEach((rs) => {
      const m = rs.rounds?.matches;
      const mid = rs.rounds?.match_id;
      if (mid && m) matchMap[mid] = m;
    });

    const allMatches = Object.values(matchMap);
    const completedMatches = allMatches.filter((m) => m.status === 'completed');
    const wins = completedMatches.filter((m) => m.winner_id === player.id).length;
    const totalScore = player.round_scores.reduce(
      (sum, rs) => sum + (rs.score ?? 0),
      0
    );
    const totalMatches = allMatches.length;

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
