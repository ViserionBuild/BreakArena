const supabase = require('../database/supabase');

const TABLE = 'users';

/**
 * Fetch all players, ordered by name.
 */
const getAllPlayers = async () => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
};

/**
 * Fetch a single player by ID.
 */
const getPlayerById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Create a new player.
 * @param {{ name: string, avatar?: string }} payload
 */
const createPlayer = async ({ name, avatar = null }) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ name, avatar })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update an existing player.
 */
const updatePlayer = async (id, updates) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete a player.
 */
const deletePlayer = async (id) => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
};

/**
 * Get lifetime statistics for a player.
 * Aggregates across all their matches.
 */
const getPlayerStats = async (playerId) => {
  // Matches played
  const { data: matchPlayers, error: mpError } = await supabase
    .from('match_players')
    .select('match_id, matches(status, winner_id)')
    .eq('user_id', playerId);

  if (mpError) throw mpError;

  const totalMatches = matchPlayers.length;
  const completedMatches = matchPlayers.filter(
    (mp) => mp.matches?.status === 'completed'
  );
  const wins = completedMatches.filter(
    (mp) => mp.matches?.winner_id === playerId
  ).length;

  // Total score across all rounds
  const { data: scoreRows, error: scoreError } = await supabase
    .from('round_scores')
    .select('score, bid, actual_wins')
    .eq('user_id', playerId);

  if (scoreError) throw scoreError;

  const totalScore = scoreRows.reduce((sum, r) => sum + (r.score ?? 0), 0);
  const totalRounds = scoreRows.length;
  const avgScore = totalRounds > 0 ? +(totalScore / totalRounds).toFixed(2) : 0;

  return {
    player_id: playerId,
    total_matches: totalMatches,
    matches_won: wins,
    win_percentage: totalMatches > 0 ? +((wins / totalMatches) * 100).toFixed(1) : 0,
    total_rounds: totalRounds,
    total_score: +totalScore.toFixed(2),
    avg_score_per_round: avgScore,
  };
};

module.exports = {
  getAllPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
  getPlayerStats,
};
