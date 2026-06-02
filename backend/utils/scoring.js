const { SCORING } = require('../config/constants');

/**
 * Calculate the score for a single player in a single round.
 * Rules:
 *   - If actual_wins >= bid  → +bid + (extra_wins * EXTRA_TRICK_BONUS)
 *   - If actual_wins < bid   → -bid
 *
 * @param {number} bid        - How many tricks the player called
 * @param {number} actualWins - How many tricks the player actually won
 * @returns {number}          - Score for this round (can be negative)
 */
const calculateRoundScore = (bid, actualWins) => {
  if (actualWins >= bid) {
    const extraTricks = actualWins - bid;
    return bid + extraTricks * SCORING.EXTRA_TRICK_BONUS;
  }
  return -bid;
};

/**
 * Given an array of { user_id, cumulative_score }, return ranked array
 * sorted descending by score with rank positions (1-based).
 *
 * @param {Array<{ user_id: string, cumulative_score: number }>} players
 * @returns {Array<{ user_id: string, cumulative_score: number, rank: number }>}
 */
const calculateRankings = (players) => {
  const sorted = [...players].sort((a, b) => b.cumulative_score - a.cumulative_score);
  return sorted.map((player, index) => ({ ...player, rank: index + 1 }));
};

/**
 * Build cumulative score history from an ordered list of round scores.
 *
 * @param {Array<{ round_number: number, user_id: string, score: number }>} roundScores
 * @param {string[]} playerIds
 * @returns {Object} - { [user_id]: Array<{ round: number, cumulative: number }> }
 */
const buildScoreHistory = (roundScores, playerIds) => {
  const history = {};
  playerIds.forEach((id) => {
    history[id] = [];
  });

  // Group by round
  const byRound = {};
  roundScores.forEach((rs) => {
    if (!byRound[rs.round_number]) byRound[rs.round_number] = {};
    byRound[rs.round_number][rs.user_id] = rs.score;
  });

  const rounds = Object.keys(byRound)
    .map(Number)
    .sort((a, b) => a - b);

  const runningTotals = {};
  playerIds.forEach((id) => (runningTotals[id] = 0));

  rounds.forEach((roundNum) => {
    playerIds.forEach((id) => {
      runningTotals[id] += byRound[roundNum][id] ?? 0;
      history[id].push({ round: roundNum, cumulative: runningTotals[id] });
    });
  });

  return history;
};

module.exports = { calculateRoundScore, calculateRankings, buildScoreHistory };
