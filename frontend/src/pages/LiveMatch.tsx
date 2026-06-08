import { useEffect, useState } from 'react';
import { Undo2, Flag, Redo2, Plus, Minus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { MAX_MATCH_ROUNDS } from '../utils';
import RoundScoreTable from '../components/scoreboard/RoundScoreTable';
import MatchRankingTable from '../components/scoreboard/MatchRankingTable';
import ScoreGraph from '../components/graphs/ScoreGraph';

export default function LiveMatch() {
  const {
    getActiveMatch,
    players,
    initializeMatchRounds,
    updateRoundScore,
    deleteRound,
    undoLastRound,
    redoLastRound,
    endMatch,
    increaseMatchRounds,
    reduceMatchRounds,
    setPage,
    matches,
    fetchMatch,
    isSaving,
  } = useAppStore();
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const match = getActiveMatch() || matches.find((m) => m.status === 'active' || m.status === 'paused') || null;

  useEffect(() => {
    if (match?.id) {
      fetchMatch(match.id);
      if (match.totalRounds) initializeMatchRounds(match.id);
    }
  }, [fetchMatch, initializeMatchRounds, match?.id, match?.totalRounds]);

  if (!match) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🃏</div>
          <div className="text-white/40 text-lg mb-4">No active match</div>
          <button onClick={() => setPage('matchSetup')} className="btn-primary rounded-xl px-6 py-3">
            Start New Match
          </button>
        </div>
      </div>
    );
  }

  const isRoundCompleted = (round: (typeof match.rounds)[number]) =>
    round.scores.length === 4 && round.scores.every((score) => score.actualWins !== 0);

  const completedRounds = match.totalRounds
    ? match.rounds.filter(isRoundCompleted).length
    : match.rounds.length;
  const progress = match.totalRounds ? (completedRounds / match.totalRounds) * 100 : 0;
  const atMaxRounds = (match.totalRounds ?? 0) >= MAX_MATCH_ROUNDS;
  const atMinRounds = (match.totalRounds ?? 0) <= 1;

  const handleAddRound = async () => {
    try {
      await increaseMatchRounds(match.id);
    } catch {
      // Error surfaced via global store banner
    }
  };

  const handleReduceRound = async () => {
    const lastRound = match.rounds[match.rounds.length - 1];
    const hasScores = lastRound?.scores.some((score) => score.bid !== 0 || score.actualWins !== 0);
    if (hasScores && !window.confirm(`Delete round ${lastRound.roundNumber}? This cannot be undone.`)) return;

    try {
      await reduceMatchRounds(match.id);
    } catch {
      // Error surfaced via global store banner
    }
  };

  const handleEndMatch = async () => {
    try {
      await endMatch(match.id);
      setShowEndConfirm(false);
      setPage('history');
    } catch {
      setShowEndConfirm(false);
    }
  };

  return (
    <div className="page-container">
      <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-8 pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-jade-400 rounded-full animate-pulse" />
              <span className="text-xs text-jade-400 uppercase tracking-wider font-medium">Live</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              Live Match Table
            </h1>
            <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
              <span>Rounds completed: {completedRounds}/{match.totalRounds || '∞'}</span>
              {match.totalRounds && (
                <div className="inline-flex items-center gap-1">
                  <button
                    onClick={handleReduceRound}
                    disabled={isSaving || atMinRounds}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-0.5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title={atMinRounds ? 'Minimum 1 round' : 'Reduce round'}
                  >
                    <Minus size={12} />
                    <span>Reduce round</span>
                  </button>
                  <button
                    onClick={handleAddRound}
                    disabled={isSaving || atMaxRounds}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-0.5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title={atMaxRounds ? `Maximum ${MAX_MATCH_ROUNDS} rounds` : 'Add round'}
                  >
                    <Plus size={12} />
                    <span>Add round</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => undoLastRound(match.id)}
              disabled={match.rounds.length === 0}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-20 transition-all"
              title="Undo last round"
            >
              <Undo2 size={18} />
            </button>
            <button
              onClick={() => redoLastRound(match.id)}
              disabled={match.rounds.length === 0}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-20 transition-all"
              title="Redo last round"
            >
              <Redo2 size={18} />
            </button>
            <button
              onClick={() => setShowEndConfirm(true)}
              className="w-10 h-10 rounded-xl bg-crimson-500/10 hover:bg-crimson-500/20 flex items-center justify-center text-crimson-400 transition-all"
              title="End match"
            >
              <Flag size={18} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {match.totalRounds && (
          <div className="h-1 bg-white/5 rounded-full mb-6 overflow-hidden">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}

        <div className="match-detail-grid">
          <RoundScoreTable
            match={match}
            players={players}
            updateRoundScore={updateRoundScore}
            deleteRound={deleteRound}
          />
          <aside className="match-side-panel">
            <MatchRankingTable match={match} players={players} />
          </aside>
        </div>

        <ScoreGraph match={match} players={players} />

        <div className="h-8" />
      </div>

      {/* End Match Confirm */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-card rounded-3xl p-6 w-full max-w-sm animate-scale-in">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🏁</div>
              <h2 className="font-display text-xl font-bold text-white mb-2">End Match?</h2>
              <p className="text-white/40 text-sm">This will finalize scores and update player stats.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEndConfirm(false)} className="btn-ghost flex-1 rounded-xl">Cancel</button>
              <button onClick={handleEndMatch} className="flex-1 bg-crimson-600 hover:bg-crimson-500 text-white rounded-xl py-3 font-semibold transition-all">
                End Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
