const playerService = require('../services/playerService');
const { sendSuccess, sendError } = require('../utils/response');

const listPlayers = async (req, res, next) => {
  try {
    const players = await playerService.getAllPlayers(req.groupId);
    sendSuccess(res, players, 'Players fetched');
  } catch (err) {
    next(err);
  }
};

const getPlayer = async (req, res, next) => {
  try {
    const player = await playerService.getPlayerById(req.params.id, req.groupId);
    if (!player) return sendError(res, 'Player not found', 404);
    sendSuccess(res, player);
  } catch (err) {
    next(err);
  }
};

const createPlayer = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const player = await playerService.createPlayer({ name, avatar, groupId: req.groupId });
    sendSuccess(res, player, 'Player created', 201);
  } catch (err) {
    next(err);
  }
};

const updatePlayer = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const player = await playerService.updatePlayer(req.params.id, { name, avatar }, req.groupId);
    if (!player) return sendError(res, 'Player not found', 404);
    sendSuccess(res, player, 'Player updated');
  } catch (err) {
    next(err);
  }
};

const deletePlayer = async (req, res, next) => {
  try {
    await playerService.deletePlayer(req.params.id, req.groupId);
    sendSuccess(res, null, 'Player deactivated');
  } catch (err) {
    next(err);
  }
};

const reactivatePlayer = async (req, res, next) => {
  try {
    await playerService.reactivatePlayer(req.params.id, req.groupId);
    sendSuccess(res, null, 'Player reactivated');
  } catch (err) {
    next(err);
  }
};

const getPlayerStats = async (req, res, next) => {
  try {
    const stats = await playerService.getPlayerStats(req.params.id);
    sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listPlayers,
  getPlayer,
  createPlayer,
  updatePlayer,
  deletePlayer,
  reactivatePlayer,
  getPlayerStats,
};

