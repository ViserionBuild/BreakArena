const groupService = require('../services/groupService');
const { sendSuccess, sendError } = require('../utils/response');

const createGroup = async (req, res, next) => {
  try {
    const result = await groupService.createGroup(req.body);
    sendSuccess(res, result, 'Group created', 201);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

const signIn = async (req, res, next) => {
  try {
    const result = await groupService.signIn(req.body);
    sendSuccess(res, result, 'Signed in');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

const resetPasscode = async (req, res, next) => {
  try {
    const result = await groupService.resetPasscode(req.body);
    sendSuccess(res, result, 'Passcode updated');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const group = await groupService.getGroupById(req.groupId);
    sendSuccess(res, { group });
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = { createGroup, signIn, resetPasscode, getMe };
