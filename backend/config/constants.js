module.exports = {
  MATCH_STATUS: {
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
  },

  PLAYERS_PER_MATCH: 4,

  MIN_BID: 0,
  MAX_BID: 13,
  MIN_ACTUAL_WINS: -13,
  MAX_ACTUAL_WINS: 13,
  DEFAULT_TOTAL_ROUNDS: 10,
  MAX_TOTAL_ROUNDS: 50,

  PLAYER_COLORS: ['#fbbf24', '#f87171', '#4ade80', '#a78bfa'],

  SCORING: {
    // If player wins >= their bid: +bid points
    // If player wins < their bid: -bid points
    // Each extra trick over bid: +0.1 points (common variant)
    EXTRA_TRICK_BONUS: 0.1,
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
};
