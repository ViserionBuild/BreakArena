const supabase = require('../database/supabase');
const { PLAYER_COLORS } = require('../config/constants');

const TABLE = 'users';

const mapStats = (row) => ({
  player_id: row.player_id,
  total_matches: Number(row.total_matches ?? 0),
  matches_won: Number(row.matches_won ?? 0),
  win_percentage: Number(row.win_percentage ?? 0),
  total_rounds: Number(row.total_rounds ?? 0),
  total_score: Number(row.total_score ?? 0),
  avg_score_per_round: Number(row.avg_score_per_round ?? 0),
});

const getAllPlayers = async () => {
  const { data: players, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;

  const { data: statsRows, error: statsError } = await supabase
    .from('v_player_stats')
    .select('*');

  if (statsError) {
    const withStats = await Promise.all(
      players.map(async (player) => ({
        ...player,
        stats: await getPlayerStats(player.id),
      }))
    );
    return withStats;
  }

  const statsById = Object.fromEntries(
    (statsRows ?? []).map((row) => [row.player_id, mapStats(row)])
  );

  return players.map((player) => ({
    ...player,
    stats: statsById[player.id] ?? {
      player_id: player.id,
      total_matches: 0,
      matches_won: 0,
      win_percentage: 0,
      total_rounds: 0,
      total_score: 0,
      avg_score_per_round: 0,
    },
  }));
};

const getPlayerById = async (id) => {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) throw error;
  const stats = await getPlayerStats(id);
  return { ...data, stats };
};

const pickColor = async () => {
  const { count, error } = await supabase.from(TABLE).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return PLAYER_COLORS[(count ?? 0) % PLAYER_COLORS.length];
};

const createPlayer = async ({ name, avatar = null, color = null }) => {
  const playerColor = color || (await pickColor());

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ name, avatar, color: playerColor })
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    stats: {
      player_id: data.id,
      total_matches: 0,
      matches_won: 0,
      win_percentage: 0,
      total_rounds: 0,
      total_score: 0,
      avg_score_per_round: 0,
    },
  };
};

const updatePlayer = async (id, updates) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  const stats = await getPlayerStats(id);
  return { ...data, stats };
};

const deletePlayer = async (id) => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
};

const getPlayerStats = async (playerId) => {
  const { data, error } = await supabase
    .from('v_player_stats')
    .select('*')
    .eq('player_id', playerId)
    .maybeSingle();

  if (!error && data) return mapStats(data);

  // Fallback: count stats manually from matches + round_scores
  const { data: playerMatches, error: pmError } = await supabase
    .from('matches')
    .select('id, status, winner_id')
    .or(`p1_id.eq.${playerId},p2_id.eq.${playerId},p3_id.eq.${playerId},p4_id.eq.${playerId}`);

  if (pmError) throw pmError;

  const totalMatches = playerMatches.length;
  const completedMatches = playerMatches.filter((m) => m.status === 'completed');
  const wins = completedMatches.filter((m) => m.winner_id === playerId).length;

  const { data: scoreRows, error: scoreError } = await supabase
    .from('round_scores')
    .select('score')
    .eq('user_id', playerId);

  if (scoreError) throw scoreError;

  const totalScore = scoreRows.reduce((sum, r) => sum + Number(r.score ?? 0), 0);
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
