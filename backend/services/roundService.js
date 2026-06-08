const supabase = require('../database/supabase');
const { calculateRoundScore } = require('../utils/scoring');

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Given a matchId, fetch the current p*_total_score values and the
 * p*_id assignements so we know which slot (1-4) each userId maps to.
 */
const getMatchSlots = async (matchId) => {
  const { data, error } = await supabase
    .from('matches')
    .select('p1_id, p2_id, p3_id, p4_id, p1_total_score, p2_total_score, p3_total_score, p4_total_score')
    .eq('id', matchId)
    .single();
  if (error) throw error;
  return data;
};

/**
 * Re-compute cumulative match totals from all rounds and write them
 * back to matches.p*_total_score.
 *
 * Called after every insert/update to keep matches in sync.
 */
const syncMatchTotals = async (matchId) => {
  const { data: rounds, error } = await supabase
    .from('rounds')
    .select('p1_total_score, p2_total_score, p3_total_score, p4_total_score')
    .eq('match_id', matchId)
    .order('round_number', { ascending: false })
    .limit(1);

  if (error) throw error;

  // The last round already carries cumulative totals — use them directly
  const last = rounds[0] ?? { p1_total_score: 0, p2_total_score: 0, p3_total_score: 0, p4_total_score: 0 };

  const { error: updateError } = await supabase
    .from('matches')
    .update({
      p1_total_score: last.p1_total_score,
      p2_total_score: last.p2_total_score,
      p3_total_score: last.p3_total_score,
      p4_total_score: last.p4_total_score,
    })
    .eq('id', matchId);

  if (updateError) throw updateError;
};

const recomputeMatchScores = async (matchId) => {
  const slots = await getMatchSlots(matchId);
  await recomputeSubsequentRounds(matchId, 1, slots);
  await syncMatchTotals(matchId);
};

/**
 * Build a rounds INSERT/UPDATE payload from playerScores array.
 * playerScores = [{ user_id, bid, actual_wins }, ...]
 * slots = match row { p1_id, p2_id, p3_id, p4_id, p1_total_score, ... }
 * prevTotals = { p1_total_score, p2_total_score, ... } from the PREVIOUS round
 */
const buildRoundPayload = (matchId, roundNumber, playerScores, slots, prevTotals) => {
  const payload = { match_id: matchId, round_number: roundNumber };

  for (let i = 1; i <= 4; i++) {
    const playerId = slots[`p${i}_id`];
    const ps = playerScores.find((p) => p.user_id === playerId);
    const bid = ps?.bid ?? 0;
    const actual_wins = ps?.actual_wins ?? 0;
    const roundScore = calculateRoundScore(bid, actual_wins);
    const prevTotal = Number(prevTotals[`p${i}_total_score`] ?? 0);

    payload[`p${i}_bid`] = bid;
    payload[`p${i}_actual_wins`] = actual_wins;
    payload[`p${i}_total_score`] = +(prevTotal + roundScore).toFixed(2);
  }

  return payload;
};

const createEmptyRoundsUpTo = async (matchId, targetRoundCount) => {
  const slots = await getMatchSlots(matchId);
  const { data: existingRounds, error } = await supabase
    .from('rounds')
    .select('round_number, p1_total_score, p2_total_score, p3_total_score, p4_total_score')
    .eq('match_id', matchId)
    .order('round_number', { ascending: true });

  if (error) throw error;

  let prevTotals = { p1_total_score: 0, p2_total_score: 0, p3_total_score: 0, p4_total_score: 0 };

  for (let roundNumber = 1; roundNumber <= targetRoundCount; roundNumber++) {
    const existingRound = existingRounds?.find((round) => round.round_number === roundNumber);
    if (existingRound) {
      prevTotals = existingRound;
      continue;
    }

    const payload = buildRoundPayload(matchId, roundNumber, [], slots, prevTotals);
    const { data: insertedRound, error: insertError } = await supabase
      .from('rounds')
      .insert(payload)
      .select('round_number, p1_total_score, p2_total_score, p3_total_score, p4_total_score')
      .single();

    if (insertError) throw insertError;
    prevTotals = insertedRound;
  }

  await recomputeMatchScores(matchId);
};

// ─────────────────────────────────────────────────────────────
// Service functions
// ─────────────────────────────────────────────────────────────

/**
 * Create a new round for a match with scores for all 4 players.
 * playerScores = [{ user_id, bid, actual_wins }, ...]
 */
const createRound = async (matchId, playerScores) => {
  // Get the last round number so we know what comes next
  const { data: existing, error: countError } = await supabase
    .from('rounds')
    .select('round_number, p1_total_score, p2_total_score, p3_total_score, p4_total_score')
    .eq('match_id', matchId)
    .order('round_number', { ascending: false })
    .limit(1);

  if (countError) throw countError;

  const nextRoundNumber = existing.length > 0 ? existing[0].round_number + 1 : 1;
  const prevTotals = existing[0] ?? { p1_total_score: 0, p2_total_score: 0, p3_total_score: 0, p4_total_score: 0 };

  const slots = await getMatchSlots(matchId);
  const payload = buildRoundPayload(matchId, nextRoundNumber, playerScores, slots, prevTotals);

  const { data: round, error: roundError } = await supabase
    .from('rounds')
    .insert(payload)
    .select()
    .single();

  if (roundError) throw roundError;

  await syncMatchTotals(matchId);
  return round;
};

/**
 * Fully replace all scores in an existing round.
 * Recalculates running totals for all subsequent rounds.
 */
const updateRound = async (roundId, playerScores) => {
  // Fetch the round being updated so we know its match and position
  const { data: thisRound, error: fetchError } = await supabase
    .from('rounds')
    .select('match_id, round_number')
    .eq('id', roundId)
    .single();

  if (fetchError) throw fetchError;

  const { match_id: matchId, round_number: roundNumber } = thisRound;
  const slots = await getMatchSlots(matchId);

  // Get the previous round's cumulative totals
  const { data: prev, error: prevError } = await supabase
    .from('rounds')
    .select('p1_total_score, p2_total_score, p3_total_score, p4_total_score')
    .eq('match_id', matchId)
    .eq('round_number', roundNumber - 1)
    .maybeSingle();

  if (prevError) throw prevError;

  const prevTotals = prev ?? { p1_total_score: 0, p2_total_score: 0, p3_total_score: 0, p4_total_score: 0 };
  const payload = buildRoundPayload(matchId, roundNumber, playerScores, slots, prevTotals);
  delete payload.match_id;
  delete payload.round_number;

  const { data: updated, error: updateError } = await supabase
    .from('rounds')
    .update(payload)
    .eq('id', roundId)
    .select()
    .single();

  if (updateError) throw updateError;

  // Recompute all subsequent rounds so their cumulative totals stay correct
  await recomputeSubsequentRounds(matchId, roundNumber + 1, slots);
  await syncMatchTotals(matchId);
  return updated;
};

/**
 * Recompute p*_total_score for all rounds after a given round_number
 * so the running totals stay consistent when an earlier round is edited.
 */
const recomputeSubsequentRounds = async (matchId, fromRoundNumber, slots) => {
  const { data: rounds, error } = await supabase
    .from('rounds')
    .select('*')
    .eq('match_id', matchId)
    .gte('round_number', fromRoundNumber)
    .order('round_number', { ascending: true });

  if (error) throw error;
  if (!rounds.length) return;

  // Seed from the round just before fromRoundNumber
  const { data: prevRow, error: pErr } = await supabase
    .from('rounds')
    .select('p1_total_score, p2_total_score, p3_total_score, p4_total_score')
    .eq('match_id', matchId)
    .eq('round_number', fromRoundNumber - 1)
    .maybeSingle();

  if (pErr) throw pErr;

  let running = {
    p1_total_score: Number(prevRow?.p1_total_score ?? 0),
    p2_total_score: Number(prevRow?.p2_total_score ?? 0),
    p3_total_score: Number(prevRow?.p3_total_score ?? 0),
    p4_total_score: Number(prevRow?.p4_total_score ?? 0),
  };

  for (const r of rounds) {
    const updates = {};
    for (let i = 1; i <= 4; i++) {
      const roundScore = calculateRoundScore(r[`p${i}_bid`], r[`p${i}_actual_wins`]);
      running[`p${i}_total_score`] = +(running[`p${i}_total_score`] + roundScore).toFixed(2);
      updates[`p${i}_total_score`] = running[`p${i}_total_score`];
    }
    const { error: uErr } = await supabase.from('rounds').update(updates).eq('id', r.id);
    if (uErr) throw uErr;
  }
};

/**
 * Patch a single player's bid/actual_wins in a round.
 * Recalculates totals for this round and all subsequent rounds.
 */
const patchRoundScore = async (roundId, userId, bid, actualWins) => {
  const { data: round, error: fetchError } = await supabase
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single();

  if (fetchError) throw fetchError;

  const { match_id: matchId, round_number: roundNumber } = round;
  const slots = await getMatchSlots(matchId);
  const slot = [1, 2, 3, 4].find((index) => slots[`p${index}_id`] === userId);

  if (!slot) {
    throw Object.assign(new Error('Player is not part of this match'), { statusCode: 400 });
  }

  // Get prev round totals
  const { data: prev } = await supabase
    .from('rounds')
    .select('p1_total_score, p2_total_score, p3_total_score, p4_total_score')
    .eq('match_id', matchId)
    .eq('round_number', roundNumber - 1)
    .maybeSingle();

  const prevTotals = prev ?? { p1_total_score: 0, p2_total_score: 0, p3_total_score: 0, p4_total_score: 0 };

  // Rebuild all 4 slots with the patched values for the target slot
  const syntheticScores = [1, 2, 3, 4].map((i) => ({
    user_id: slots[`p${i}_id`],
    bid: i === slot ? bid : round[`p${i}_bid`],
    actual_wins: i === slot ? actualWins : round[`p${i}_actual_wins`],
  }));

  const payload = buildRoundPayload(matchId, roundNumber, syntheticScores, slots, prevTotals);
  delete payload.match_id;
  delete payload.round_number;

  const { data: updated, error: updateError } = await supabase
    .from('rounds')
    .update(payload)
    .eq('id', roundId)
    .select()
    .single();

  if (updateError) throw updateError;

  await recomputeSubsequentRounds(matchId, roundNumber + 1, slots);
  await syncMatchTotals(matchId);
  return updated;
};

const deleteRound = async (roundId) => {
  const { data: round, error: fetchError } = await supabase
    .from('rounds')
    .select('match_id, round_number')
    .eq('id', roundId)
    .single();

  if (fetchError) throw fetchError;

  const { error } = await supabase.from('rounds').delete().eq('id', roundId);
  if (error) throw error;

  const { data: subsequent, error: subErr } = await supabase
    .from('rounds')
    .select('id, round_number')
    .eq('match_id', round.match_id)
    .gt('round_number', round.round_number)
    .order('round_number', { ascending: true });

  if (subErr) throw subErr;

  for (const row of subsequent ?? []) {
    const { error: renumErr } = await supabase
      .from('rounds')
      .update({ round_number: row.round_number - 1 })
      .eq('id', row.id);
    if (renumErr) throw renumErr;
  }

  const slots = await getMatchSlots(round.match_id);
  await recomputeSubsequentRounds(round.match_id, round.round_number, slots);
  await syncMatchTotals(round.match_id);
  return round.match_id;
};

const getRoundsByMatch = async (matchId) => {
  const { data, error } = await supabase
    .from('rounds')
    .select('*')
    .eq('match_id', matchId)
    .order('round_number', { ascending: true });

  if (error) throw error;
  return data;
};

module.exports = {
  createRound,
  updateRound,
  patchRoundScore,
  deleteRound,
  getRoundsByMatch,
  recomputeMatchScores,
  createEmptyRoundsUpTo,
};
