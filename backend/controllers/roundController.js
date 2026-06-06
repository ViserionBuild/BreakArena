const supabase = require('../database/supabase');
const roundService = require('../services/roundService');
const matchService = require('../services/matchService');
const { sendSuccess, sendError } = require('../utils/response');

const createRound = async (req, res, next) => {
  try {
    const { match_id, player_scores } = req.body;
    const result = await roundService.createRound(match_id, player_scores);
    sendSuccess(res, result, 'Round created', 201);
  } catch (err) {
    next(err);
  }
};

const updateRound = async (req, res, next) => {
  try {
    const { player_scores } = req.body;
    const scores = await roundService.updateRound(req.params.id, player_scores);
    sendSuccess(res, scores, 'Round updated');
  } catch (err) {
    next(err);
  }
};

const deleteRound = async (req, res, next) => {
  try {
    const matchId = await roundService.deleteRound(req.params.id);
    const match = await matchService.getMatchById(matchId);
    sendSuccess(res, match, 'Round deleted');
  } catch (err) {
    next(err);
  }
};

const getRoundsForMatch = async (req, res, next) => {
  try {
    const { match_id } = req.query;
    if (!match_id) return sendError(res, 'match_id query param required', 400);
    const rounds = await roundService.getRoundsByMatch(match_id);
    sendSuccess(res, rounds);
  } catch (err) {
    next(err);
  }
};

const patchRoundScore = async (req, res, next) => {
  try {
    const { bid, actual_wins } = req.body;
    await roundService.patchRoundScore(
      req.params.id,
      req.params.userId,
      Number(bid),
      Number(actual_wins)
    );

    const { data: round, error } = await supabase
      .from('rounds')
      .select('match_id')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    const match = await matchService.getMatchById(round.match_id);
    sendSuccess(res, match, 'Score updated');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRound,
  updateRound,
  patchRoundScore,
  deleteRound,
  getRoundsForMatch,
};
