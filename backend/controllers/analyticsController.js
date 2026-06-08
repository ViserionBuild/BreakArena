const analyticsService = require('../services/analyticsService');
const { sendSuccess } = require('../utils/response');

const getMatchAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getMatchAnalytics(req.params.matchId);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

const getGlobalLeaderboard = async (req, res, next) => {
  try {
    const data = await analyticsService.getGlobalLeaderboard(req.groupId);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

const getPlayerBidAccuracy = async (req, res, next) => {
  try {
    const data = await analyticsService.getPlayerBidAccuracy(req.groupId);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMatchAnalytics, getGlobalLeaderboard, getPlayerBidAccuracy };

