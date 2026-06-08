const supabase = require('../database/supabase');
const roundService = require('./roundService');
const {
  MATCH_STATUS,
  PLAYERS_PER_MATCH,
  DEFAULT_TOTAL_ROUNDS,
  MAX_TOTAL_ROUNDS,
} = require('../config/constants');
const { getIndianDateKey, getIndianDbTimestamp } = require('../utils/indianTime');

const getNextMatchNumber = async (matchDate) => {
  const { count, error } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('match_date', matchDate);

  if (error) throw error;
  return (count ?? 0) + 1;
};

/**
 * Create a new match. Players are stored as p1_id..p4_id directly on matches.
 * playerIds[0] = p1 (starts the match), playerIds[1] = p2, etc.
 * Empty round rows are pre-created up to totalRounds.
 */
const createMatch = async (playerIds, totalRounds = DEFAULT_TOTAL_ROUNDS, groupId = null) => {
  if (playerIds.length !== PLAYERS_PER_MATCH) {
    const err = new Error(`Exactly ${PLAYERS_PER_MATCH} players required`);
    err.statusCode = 400;
    throw err;
  }

  const safeTotalRounds = Math.min(Math.max(1, totalRounds), MAX_TOTAL_ROUNDS);
  const matchDate = getIndianDateKey();
  const matchNumber = await getNextMatchNumber(matchDate);

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .insert({
      status: MATCH_STATUS.ACTIVE,
      match_date: matchDate,
      match_number: matchNumber,
      total_rounds: safeTotalRounds,
      group_id: groupId,
      p1_id: playerIds[0],
      p2_id: playerIds[1],
      p3_id: playerIds[2],
      p4_id: playerIds[3],
      p1_total_score: 0,
      p2_total_score: 0,
      p3_total_score: 0,
      p4_total_score: 0,
    })
    .select()
    .single();

  if (matchError) throw matchError;

  await roundService.createEmptyRoundsUpTo(match.id, safeTotalRounds);

  return getMatchById(match.id);
};

const getMatchById = async (matchId) => {
  const { data: match, error } = await supabase
    .from('matches')
    .select(
      `
      *,
      p1:p1_id ( id, name, avatar, color ),
      p2:p2_id ( id, name, avatar, color ),
      p3:p3_id ( id, name, avatar, color ),
      p4:p4_id ( id, name, avatar, color ),
      rounds (
        id,
        round_number,
        created_at,
        p1_bid, p1_actual_wins, p1_total_score,
        p2_bid, p2_actual_wins, p2_total_score,
        p3_bid, p3_actual_wins, p3_total_score,
        p4_bid, p4_actual_wins, p4_total_score
      )
    `
    )
    .eq('id', matchId)
    .single();

  if (error) throw error;

  if (match?.rounds) {
    match.rounds.sort((a, b) => a.round_number - b.round_number);
  }

  // Normalised players array ordered by seat
  match.players = [
    match.p1 ? { ...match.p1, seat: 1, total_score: match.p1_total_score } : null,
    match.p2 ? { ...match.p2, seat: 2, total_score: match.p2_total_score } : null,
    match.p3 ? { ...match.p3, seat: 3, total_score: match.p3_total_score } : null,
    match.p4 ? { ...match.p4, seat: 4, total_score: match.p4_total_score } : null,
  ].filter(Boolean);

  return match;
};

const getAllMatches = async ({ page = 1, limit = 20, status, groupId } = {}) => {
  let query = supabase
    .from('matches')
    .select(
      `
      id, status, winner_id, match_date, match_number, total_rounds, created_at, ended_at,
      p1_id, p1_total_score,
      p2_id, p2_total_score,
      p3_id, p3_total_score,
      p4_id, p4_total_score,
      p1:p1_id ( id, name, avatar, color ),
      p2:p2_id ( id, name, avatar, color ),
      p3:p3_id ( id, name, avatar, color ),
      p4:p4_id ( id, name, avatar, color )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status) query = query.eq('status', status);
  if (groupId) query = query.eq('group_id', groupId);

  const { data, error, count } = await query;
  if (error) throw error;

  const matches = (data ?? []).map((m) => ({
    ...m,
    players: [
      m.p1 ? { ...m.p1, seat: 1, total_score: m.p1_total_score } : null,
      m.p2 ? { ...m.p2, seat: 2, total_score: m.p2_total_score } : null,
      m.p3 ? { ...m.p3, seat: 3, total_score: m.p3_total_score } : null,
      m.p4 ? { ...m.p4, seat: 4, total_score: m.p4_total_score } : null,
    ].filter(Boolean),
  }));

  return { matches, total: count, page, limit };
};

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
 * Mark a match as completed and set winner_id to whoever has the highest
 * total_score (already stored on the matches row — no round join needed).
 */
const completeMatch = async (matchId) => {
  await roundService.recomputeMatchScores(matchId);

  const { data: m, error } = await supabase
    .from('matches')
    .select('p1_id, p1_total_score, p2_id, p2_total_score, p3_id, p3_total_score, p4_id, p4_total_score')
    .eq('id', matchId)
    .single();

  if (error) throw error;

  const players = [
    { id: m.p1_id, score: Number(m.p1_total_score ?? 0) },
    { id: m.p2_id, score: Number(m.p2_total_score ?? 0) },
    { id: m.p3_id, score: Number(m.p3_total_score ?? 0) },
    { id: m.p4_id, score: Number(m.p4_total_score ?? 0) },
  ].filter((p) => p.id);

  players.sort((a, b) => b.score - a.score);

  return updateMatch(matchId, {
    status: MATCH_STATUS.COMPLETED,
    winner_id: players[0]?.id || null,
    sec_winner_id: players[1]?.id || null,
    third_winner_id: players[2]?.id || null,
    fourth_winner_id: players[3]?.id || null,
    ended_at: getIndianDbTimestamp(),
  });
};

const deleteMatch = async (matchId) => {
  const { error } = await supabase.from('matches').delete().eq('id', matchId);
  if (error) throw error;
  return true;
};

/**
 * Resume a completed or paused match back to active (live).
 * Clears winner/placement fields and ended_at.
 */
const resumeMatch = async (matchId) => {
  const { data: match, error } = await supabase
    .from('matches')
    .select('status')
    .eq('id', matchId)
    .single();

  if (error) throw error;

  if (match.status === MATCH_STATUS.ACTIVE) {
    return getMatchById(matchId);
  }

  if (match.status !== MATCH_STATUS.COMPLETED && match.status !== MATCH_STATUS.PAUSED) {
    const err = new Error('Only completed or paused matches can be resumed');
    err.statusCode = 400;
    throw err;
  }

  const { error: resumeError } = await supabase
    .from('matches')
    .update({
      status: MATCH_STATUS.ACTIVE,
      winner_id: null,
      sec_winner_id: null,
      third_winner_id: null,
      fourth_winner_id: null,
      ended_at: null,
    })
    .eq('id', matchId);

  if (resumeError) throw resumeError;

  await roundService.recomputeMatchScores(matchId);

  return getMatchById(matchId);
};

/**
 * Increase total_rounds on an in-progress match.
 * New value must be greater than the current total and at least the highest
 * round number already played.
 */
const updateMatchTotalRounds = async (matchId, totalRounds) => {
  const { data: match, error } = await supabase
    .from('matches')
    .select('status, total_rounds')
    .eq('id', matchId)
    .single();

  if (error) throw error;

  if (match.status === MATCH_STATUS.COMPLETED) {
    const err = new Error('Cannot change total rounds on a completed match');
    err.statusCode = 400;
    throw err;
  }

  const currentTotal = Number(match.total_rounds);
  const safeTotal = Math.min(Math.max(1, totalRounds), MAX_TOTAL_ROUNDS);

  if (safeTotal <= currentTotal) {
    const err = new Error(`total_rounds must be greater than current value (${currentTotal})`);
    err.statusCode = 400;
    throw err;
  }

  const { data: lastRound, error: roundError } = await supabase
    .from('rounds')
    .select('round_number')
    .eq('match_id', matchId)
    .order('round_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (roundError) throw roundError;

  const playedRounds = lastRound?.round_number ?? 0;
  if (safeTotal < playedRounds) {
    const err = new Error(`total_rounds cannot be less than rounds already played (${playedRounds})`);
    err.statusCode = 400;
    throw err;
  }

  const { error: updateError } = await supabase
    .from('matches')
    .update({ total_rounds: safeTotal })
    .eq('id', matchId);

  if (updateError) throw updateError;

  await roundService.createEmptyRoundsUpTo(matchId, safeTotal);

  return getMatchById(matchId);
};

const reduceMatchTotalRounds = async (matchId) => {
  const { data: match, error } = await supabase
    .from('matches')
    .select('status, total_rounds')
    .eq('id', matchId)
    .single();

  if (error) throw error;

  if (match.status === MATCH_STATUS.COMPLETED) {
    const err = new Error('Cannot reduce rounds on a completed match');
    err.statusCode = 400;
    throw err;
  }

  const currentTotal = Number(match.total_rounds);
  if (currentTotal <= 1) {
    const err = new Error('Match must have at least one round');
    err.statusCode = 400;
    throw err;
  }

  const { data: lastRound, error: roundError } = await supabase
    .from('rounds')
    .select('id')
    .eq('match_id', matchId)
    .order('round_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (roundError) throw roundError;

  if (lastRound) {
    await roundService.deleteRound(lastRound.id);
  }

  const { error: updateError } = await supabase
    .from('matches')
    .update({ total_rounds: currentTotal - 1 })
    .eq('id', matchId);

  if (updateError) throw updateError;

  return getMatchById(matchId);
};

module.exports = {
  createMatch,
  getMatchById,
  getAllMatches,
  updateMatch,
  completeMatch,
  deleteMatch,
  resumeMatch,
  updateMatchTotalRounds,
  reduceMatchTotalRounds,
};
