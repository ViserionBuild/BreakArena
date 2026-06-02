const supabase = require('../database/supabase');
const { MATCH_STATUS, PLAYERS_PER_MATCH } = require('../config/constants');

/**
 * Create a new match and register its 4 players.
 * @param {string[]} playerIds   - Array of exactly 4 player UUIDs in seat order
 */
const createMatch = async (playerIds) => {
  if (playerIds.length !== PLAYERS_PER_MATCH) {
    const err = new Error(`Exactly ${PLAYERS_PER_MATCH} players required`);
    err.statusCode = 400;
    throw err;
  }

  // 1. Create the match
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .insert({ status: MATCH_STATUS.ACTIVE })
    .select()
    .single();

  if (matchError) throw matchError;

  // 2. Create match_players rows
  const matchPlayerRows = playerIds.map((userId, index) => ({
    match_id: match.id,
    user_id: userId,
    seat_order: index + 1,
  }));

  const { error: mpError } = await supabase
    .from('match_players')
    .insert(matchPlayerRows);

  if (mpError) throw mpError;

  return match;
};

/**
 * Get a match by ID, including its players and rounds.
 */
const getMatchById = async (matchId) => {
  const { data: match, error } = await supabase
    .from('matches')
    .select(
      `
      *,
      match_players (
        seat_order,
        users ( id, name, avatar )
      ),
      rounds (
        id,
        round_number,
        created_at,
        round_scores (
          id,
          user_id,
          bid,
          actual_wins,
          score
        )
      )
    `
    )
    .eq('id', matchId)
    .single();

  if (error) throw error;
  return match;
};

/**
 * List all matches, paginated, newest first.
 */
const getAllMatches = async ({ page = 1, limit = 20, status } = {}) => {
  let query = supabase
    .from('matches')
    .select(
      `
      id, status, winner_id, created_at, ended_at,
      match_players ( users ( id, name, avatar ) )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) throw error;
  return { matches: data, total: count, page, limit };
};

/**
 * Update match status (e.g. pause, complete).
 */
const updateMatch = async (matchId, updates) => {
  const { data, error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', matchId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Mark a match as completed and set the winner.
 * Winner = player with highest cumulative score.
 */
const completeMatch = async (matchId) => {
  // Get all round scores for this match
  const { data: rounds, error: rError } = await supabase
    .from('rounds')
    .select('round_scores ( user_id, score )')
    .eq('match_id', matchId);

  if (rError) throw rError;

  // Aggregate scores per player
  const totals = {};
  rounds.forEach((round) => {
    round.round_scores.forEach(({ user_id, score }) => {
      totals[user_id] = (totals[user_id] ?? 0) + (score ?? 0);
    });
  });

  const winnerId = Object.entries(totals).reduce(
    (best, [uid, score]) => (score > best[1] ? [uid, score] : best),
    ['', -Infinity]
  )[0];

  return updateMatch(matchId, {
    status: MATCH_STATUS.COMPLETED,
    winner_id: winnerId || null,
    ended_at: new Date().toISOString(),
  });
};

/**
 * Delete a match (and cascade-delete related rows via DB constraints).
 */
const deleteMatch = async (matchId) => {
  const { error } = await supabase.from('matches').delete().eq('id', matchId);
  if (error) throw error;
  return true;
};

module.exports = {
  createMatch,
  getMatchById,
  getAllMatches,
  updateMatch,
  completeMatch,
  deleteMatch,
};
