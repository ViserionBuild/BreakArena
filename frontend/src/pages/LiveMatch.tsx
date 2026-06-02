import { useState } from 'react';
import { Plus, Undo2, Flag, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import PlayerAvatar from '../components/ui/PlayerAvatar';
import ScoreEntry from '../components/scoreboard/ScoreEntry';
import ScoreGraph from '../components/graphs/ScoreGraph';
import { calculateCallBreakScore } from '../utils';

export default function LiveMatch() {
  const { getActiveMatch, players, addRound, undoLastRound, endMatch, setPage, activeMatchId, matches } = useAppStore();
  const [showEntry, setShowEntry] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showRounds, setShowRounds] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const match = getActiveMatch() || matches.find((m) => m.status === 'active') || null;

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

  const matchPlayers = match.players
    .map((mp) => {
      const player = players.find((p) => p.id === mp.playerId);
      return player ? { ...mp, player } : null;
    })
    .filter(Boolean) as Array<(typeof match.players)[0] & { player: (typeof players)[0] }>;

  const sortedByRank = [...matchPlayers].sort((a, b) => a.rank - b.rank);
  const roundNum = match.rounds.length + 1;
  const progress = match.totalRounds ? (match.rounds.length / match.totalRounds) * 100 : 0;

  const handleSubmitRound = (scores: { playerId: string; bid: number; actualWins: number; score: number }[]) => {
    addRound(match.id, scores);
    setShowEntry(false);
  };

  const handleEndMatch = () => {
    endMatch(match.id);
    setShowEndConfirm(false);
    setPage('history');
  };

  return (
    <div className="page-container">
      <div className="max-w-lg mx-auto px-4 pt-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-jade-400 rounded-full animate-pulse" />
              <span className="text-xs text-jade-400 uppercase tracking-wider font-medium">Live</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              Round {match.rounds.length}/{match.totalRounds || '∞'}
            </h1>
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

        {/* Rankings */}
        <div className="space-y-3 mb-6">
          {sortedByRank.map((mp, displayIdx) => {
            const rankChange = mp.prevRank !== undefined
              ? mp.prevRank > mp.rank ? 'up' : mp.prevRank < mp.rank ? 'down' : 'same'
              : 'same';

            return (
              <div
                key={mp.playerId}
                className="glass-card rounded-2xl p-4 flex items-center gap-4 transition-all duration-500 animate-slide-in-right"
                style={{
                  animationDelay: `${displayIdx * 0.05}s`,
                  boxShadow: mp.rank === 1 ? `0 0 30px ${mp.player.color}20` : 'none',
                  borderColor: mp.rank === 1 ? `${mp.player.color}25` : 'rgba(255,255,255,0.07)',
                }}
              >
                <span className={`rank-badge rank-${mp.rank}`}>{mp.rank}</span>

                <PlayerAvatar
                  avatar={mp.player.avatar}
                  color={mp.player.color}
                  name={mp.player.name}
                  size="md"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white truncate">{mp.player.name}</span>
                    {rankChange === 'up' && <TrendingUp size={14} className="text-jade-400 flex-shrink-0" />}
                    {rankChange === 'down' && <TrendingDown size={14} className="text-crimson-400 flex-shrink-0" />}
                    {mp.rank === 1 && match.rounds.length > 0 && <Trophy size={13} className="text-gold-400 flex-shrink-0" />}
                  </div>
                  {/* Last round score */}
                  {match.rounds.length > 0 && (() => {
                    const lastRound = match.rounds[match.rounds.length - 1];
                    const lastScore = lastRound.scores.find((s) => s.playerId === mp.playerId);
                    if (!lastScore) return null;
                    const s = calculateCallBreakScore(lastScore.bid, lastScore.actualWins);
                    return (
                      <div className={`text-xs mt-0.5 ${s >= 0 ? 'text-jade-400' : 'text-crimson-400'}`}>
                        Last: {s > 0 ? '+' : ''}{s.toFixed(1)} (bid {lastScore.bid}, got {lastScore.actualWins})
                      </div>
                    );
                  })()}
                </div>

                <div className="text-right">
                  <div className={`font-display text-2xl font-bold font-mono ${
                    mp.totalScore > 0 ? 'text-jade-400' : mp.totalScore < 0 ? 'text-crimson-400' : 'text-white/60'
                  }`}>
                    {mp.totalScore > 0 ? '+' : ''}{mp.totalScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-white/30">total</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Graph toggle */}
        <button
          onClick={() => setShowGraph(!showGraph)}
          className="w-full glass-card rounded-2xl p-4 flex items-center justify-between mb-3 hover:border-white/20 transition-all"
        >
          <span className="text-sm text-white/60">Score Progression</span>
          {showGraph ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
        </button>

        {showGraph && (
          <div className="glass-card rounded-2xl p-4 mb-3 animate-scale-in">
            <ScoreGraph match={match} players={players} />
          </div>
        )}

        {/* Round history toggle */}
        {match.rounds.length > 0 && (
          <>
            <button
              onClick={() => setShowRounds(!showRounds)}
              className="w-full glass-card rounded-2xl p-4 flex items-center justify-between mb-3 hover:border-white/20 transition-all"
            >
              <span className="text-sm text-white/60">Round History ({match.rounds.length})</span>
              {showRounds ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
            </button>

            {showRounds && (
              <div className="glass-card rounded-2xl overflow-hidden mb-3 animate-scale-in">
                <div className="overflow-x-auto">
                  <table className="w-full score-table text-sm">
                    <thead>
                      <tr>
                        <th className="text-left pl-4">Round</th>
                        {matchPlayers.map((mp) => (
                          <th key={mp.playerId}>
                            <span style={{ color: mp.player.color }}>{mp.player.avatar}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {match.rounds.map((round) => (
                        <tr key={round.id}>
                          <td className="text-left pl-4 text-white/50 font-mono text-xs">R{round.roundNumber}</td>
                          {matchPlayers.map((mp) => {
                            const rs = round.scores.find((s) => s.playerId === mp.playerId);
                            if (!rs) return <td key={mp.playerId}>-</td>;
                            const s = calculateCallBreakScore(rs.bid, rs.actualWins);
                            return (
                              <td key={mp.playerId} className={`font-mono text-xs ${s >= 0 ? 'text-jade-400' : 'text-crimson-400'}`}>
                                {s > 0 ? '+' : ''}{s.toFixed(1)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr>
                        <td className="text-left pl-4 text-white/50 font-mono text-xs font-bold">Total</td>
                        {matchPlayers.map((mp) => (
                          <td key={mp.playerId} className={`font-mono text-xs font-bold ${mp.totalScore >= 0 ? 'text-gold-400' : 'text-crimson-400'}`}>
                            {mp.totalScore > 0 ? '+' : ''}{mp.totalScore.toFixed(1)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Add Round Button */}
        <button
          onClick={() => setShowEntry(true)}
          className="btn-primary w-full rounded-2xl py-5 text-lg font-semibold flex items-center justify-center gap-3 mb-4"
        >
          <Plus size={24} />
          Add Round {roundNum}
        </button>

        <div className="h-8" />
      </div>

      {/* Score Entry Modal */}
      {showEntry && (
        <ScoreEntry
          players={matchPlayers.map((mp) => mp.player)}
          onSubmit={handleSubmitRound}
          onCancel={() => setShowEntry(false)}
          roundNumber={roundNum}
        />
      )}

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
