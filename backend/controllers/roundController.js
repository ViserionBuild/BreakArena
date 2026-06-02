const roundService = require('../services/roundService');
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
    await roundService.deleteRound(req.params.id);
    sendSuccess(res, null, 'Round deleted');
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

module.exports = { createRound, updateRound, deleteRound, getRoundsForMatch };
