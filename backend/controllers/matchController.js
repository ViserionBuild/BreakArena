const matchService = require('../services/matchService');
const { sendSuccess, sendError } = require('../utils/response');

const listMatches = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const result = await matchService.getAllMatches({
      page: Number(page),
      limit: Number(limit),
      status,
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

const getMatch = async (req, res, next) => {
  try {
    const match = await matchService.getMatchById(req.params.id);
    if (!match) return sendError(res, 'Match not found', 404);
    sendSuccess(res, match);
  } catch (err) {
    next(err);
  }
};

const createMatch = async (req, res, next) => {
  try {
    const { player_ids, total_rounds } = req.body;
    const match = await matchService.createMatch(player_ids, total_rounds);
    sendSuccess(res, match, 'Match created', 201);
  } catch (err) {
    next(err);
  }
};

const updateMatch = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (status === 'completed') {
      await matchService.completeMatch(req.params.id);
      const match = await matchService.getMatchById(req.params.id);
      return sendSuccess(res, match, 'Match completed');
    }

    const match = await matchService.updateMatch(req.params.id, { status });
    if (!match) return sendError(res, 'Match not found', 404);
    sendSuccess(res, match, 'Match updated');
  } catch (err) {
    next(err);
  }
};

const deleteMatch = async (req, res, next) => {
  try {
    await matchService.deleteMatch(req.params.id);
    sendSuccess(res, null, 'Match deleted');
  } catch (err) {
    next(err);
  }
};

const updateMatchTotalRounds = async (req, res, next) => {
  try {
    const match = await matchService.updateMatchTotalRounds(
      req.params.id,
      Number(req.body.total_rounds)
    );
    sendSuccess(res, match, 'Total rounds updated');
  } catch (err) {
    next(err);
  }
};

const resumeMatch = async (req, res, next) => {
  try {
    const match = await matchService.resumeMatch(req.params.id);
    sendSuccess(res, match, 'Match resumed');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listMatches,
  getMatch,
  createMatch,
  updateMatch,
  deleteMatch,
  updateMatchTotalRounds,
  resumeMatch,
};
