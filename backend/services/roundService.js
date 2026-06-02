const supabase = require('../database/supabase');
const { calculateRoundScore } = require('../utils/scoring');

/**
 * Create a new round for a match and insert score entries for each player.
 *
 * @param {string} matchId
 * @param {Array<{ user_id: string, bid: number, actual_wins: number }>} playerScores
 */
const createRound = async (matchId, playerScores) => {
  // 1. Determine next round number
  const { data: existing, error: countError } = await supabase
    .from('rounds')
    .select('round_number')
    .eq('match_id', matchId)
    .order('round_number', { ascending: false })
    .limit(1);

  if (countError) throw countError;

  const nextRoundNumber = existing.length > 0 ? existing[0].round_number + 1 : 1;

  // 2. Insert round
  const { data: round, error: roundError } = await supabase
    .from('rounds')
    .insert({ match_id: matchId, round_number: nextRoundNumber })
    .select()
    .single();

  if (roundError) throw roundError;

  // 3. Calculate and insert round_scores
  const scoreRows = playerScores.map(({ user_id, bid, actual_wins }) => ({
    round_id: round.id,
    user_id,
    bid,
    actual_wins,
    score: calculateRoundScore(bid, actual_wins),
  }));

  const { data: scores, error: scoreError } = await supabase
    .from('round_scores')
    .insert(scoreRows)
    .select();

  if (scoreError) throw scoreError;

  return { round, scores };
};

/**
 * Update scores for an existing round (undo / correction).
 * Replaces all round_scores for the given round.
 *
 * @param {string} roundId
 * @param {Array<{ user_id: string, bid: number, actual_wins: number }>} playerScores
 */
const updateRound = async (roundId, playerScores) => {
  // Delete existing scores for this round
  const { error: deleteError } = await supabase
    .from('round_scores')
    .delete()
    .eq('round_id', roundId);

  if (deleteError) throw deleteError;

  // Re-insert corrected scores
  const scoreRows = playerScores.map(({ user_id, bid, actual_wins }) => ({
    round_id: roundId,
    user_id,
    bid,
    actual_wins,
    score: calculateRoundScore(bid, actual_wins),
  }));

  const { data: scores, error: insertError } = await supabase
    .from('round_scores')
    .insert(scoreRows)
    .select();

  if (insertError) throw insertError;
  return scores;
};

/**
 * Delete a round and its scores (undo last round).
 */
const deleteRound = async (roundId) => {
  // round_scores will cascade-delete via FK constraint
  const { error } = await supabase.from('rounds').delete().eq('id', roundId);
  if (error) throw error;
  return true;
};

/**
 * Get all rounds with scores for a match.
 */
const getRoundsByMatch = async (matchId) => {
  const { data, error } = await supabase
    .from('rounds')
    .select(
      `
      id, round_number, created_at,
      round_scores ( id, user_id, bid, actual_wins, score )
    `
    )
    .eq('match_id', matchId)
    .order('round_number', { ascending: true });

  if (error) throw error;
  return data;
};

module.exports = {
  createRound,
  updateRound,
  deleteRound,
  getRoundsByMatch,
};
