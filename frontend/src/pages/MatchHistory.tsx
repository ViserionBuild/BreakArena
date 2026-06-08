import { useEffect } from 'react';
import { ArrowLeft, Trash2, Trophy, Calendar, Clock, ChevronRight, Play } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import PlayerAvatar from '../components/ui/PlayerAvatar';
import { Match } from '../types';
import { formatMatchLabel, parseIndianTimestamp } from '../utils';
import RoundScoreTable from '../components/scoreboard/RoundScoreTable';
import MatchRankingTable from '../components/scoreboard/MatchRankingTable';
import ScoreGraph from '../components/graphs/ScoreGraph';

export default function MatchHistory() {
  const {
    matches,
    players,
    deleteMatch,
    resumeMatch,
    setPage,
    activeMatchId,
    isSaving,
    selectedHistoryMatchId,
    setSelectedHistoryMatchId,
    fetchMatch,
  } = useAppStore();

  useEffect(() => {
    if (selectedHistoryMatchId) {
      fetchMatch(selectedHistoryMatchId);
    }
  }, [selectedHistoryMatchId, fetchMatch]);

  const sortedMatches = [...matches].sort((a, b) =>
    parseIndianTimestamp(b.createdAt).getTime() - parseIndianTimestamp(a.createdAt).getTime()
  );

  const getDuration = (match: Match) => {
    if (!match.endedAt) return null;
    const ms = parseIndianTimestamp(match.endedAt).getTime() - parseIndianTimestamp(match.createdAt).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const selectedMatch = selectedHistoryMatchId ? matches.find((match) => match.id === selectedHistoryMatchId) : null;

  if (sortedMatches.length === 0) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🃏</div>
          <div className="text-white/40 text-lg mb-2">No matches yet</div>
          <div className="text-white/20 text-sm mb-6">Start a new match to see history</div>
          <button onClick={() => setPage('matchSetup')} className="btn-primary rounded-xl px-6 py-3">
            New Match
          </button>
        </div>
      </div>
    );
  }

  if (selectedMatch) {
    const winner = selectedMatch.winnerId ? players.find((p) => p.id === selectedMatch.winnerId) : null;
    const duration = getDuration(selectedMatch);

    return (
      <div className="page-container">
        <div className="sticky top-0 z-20 border-b border-white/5 bg-ink-950/85 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <button
              onClick={() => setSelectedHistoryMatchId(null)}
              className="h-10 px-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 text-white/70 hover:text-white transition-all"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">History</span>
            </button>
            <div className="flex items-center gap-2">
              {selectedMatch.status === 'active' && selectedMatch.id === activeMatchId && (
                <button onClick={() => setPage('liveMatch')} className="btn-primary rounded-xl px-4 py-2 text-sm">
                  Continue
                </button>
              )}
              {selectedMatch.status === 'completed' && (
                <button
                  onClick={async () => {
                    try {
                      await resumeMatch(selectedMatch.id);
                    } catch {
                      // Error surfaced via global store banner
                    }
                  }}
                  disabled={isSaving}
                  className="btn-primary rounded-xl px-4 py-2 text-sm inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <Play size={14} />
                  Resume Match
                </button>
              )}
              <button
                onClick={async () => {
                  try {
                    await deleteMatch(selectedMatch.id);
                    setSelectedHistoryMatchId(null);
                  } catch {
                    // Error surfaced via global store banner
                  }
                }}
                className="w-10 h-10 rounded-xl bg-crimson-500/10 hover:bg-crimson-500/20 flex items-center justify-center text-crimson-400 transition-all"
                title="Delete match"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-8 pt-6">
          <div className="mb-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                selectedMatch.status === 'active' ? 'bg-jade-400/20 text-jade-400' : 'bg-white/10 text-white/40'
              }`}>
                {selectedMatch.status === 'active' ? 'Live' : 'Done'}
              </div>
              <span className="text-xs text-white/30 font-mono">{selectedMatch.rounds.length} rounds</span>
              {duration && (
                <div className="flex items-center gap-1 text-xs text-white/30">
                  <Clock size={10} />
                  {duration}
                </div>
              )}
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              Match {formatMatchLabel(matches, selectedMatch.createdAt, selectedMatch.matchDate, selectedMatch.matchNumber)}
            </h1>
            {winner && (
              <div className="text-sm text-gold-400 mt-1">Winner: {winner.name}</div>
            )}
          </div>

          <div className="match-detail-grid">
            <RoundScoreTable match={selectedMatch} players={players} readOnly />
            <aside className="match-side-panel">
              <MatchRankingTable match={selectedMatch} players={players} />
            </aside>
          </div>

          <ScoreGraph match={selectedMatch} players={players} />
          <div className="h-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="w-full max-w-5xl mx-auto px-6 lg:px-8 pt-6">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-white">History</h1>
          <p className="text-white/40 text-sm mt-1">{matches.length} matches played</p>
        </div>

        <div className="space-y-4">
          {sortedMatches.map((match, idx) => {
            const winner = match.winnerId ? players.find((p) => p.id === match.winnerId) : null;
            const matchPlayers = match.players
              .sort((a, b) => a.rank - b.rank)
              .map((mp) => ({
                ...mp,
                player: players.find((p) => p.id === mp.playerId),
              }));
            const duration = getDuration(match);

            return (
              <div
                key={match.id}
                className="glass-card rounded-2xl overflow-hidden animate-slide-up"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                {/* Match header */}
                <button
                  className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/2 transition-colors"
                  onClick={() => setSelectedHistoryMatchId(match.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        match.status === 'active' ? 'bg-jade-400/20 text-jade-400' : 'bg-white/10 text-white/40'
                      }`}>
                        {match.status === 'active' ? '● Live' : '✓ Done'}
                      </div>
                      <span className="text-xs text-white/30 font-mono">{match.rounds.length} rounds</span>
                      {duration && (
                        <div className="flex items-center gap-1 text-xs text-white/30">
                          <Clock size={10} />
                          {duration}
                        </div>
                      )}
                    </div>

                    {/* Player avatars stacked */}
                    <div className="flex -space-x-2 mb-2">
                      {matchPlayers.map(({ playerId, player, rank }) => player && (
                        <div key={playerId} className="relative">
                          <PlayerAvatar avatar={player.avatar} color={player.color} name={player.name} size="sm" className="ring-2 ring-ink-900" />
                          {rank === 1 && match.status === 'completed' && (
                            <Trophy size={10} className="absolute -top-1 -right-1 text-gold-400" />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-white/30">
                      <Calendar size={10} />
                      Date: {formatMatchLabel(matches, match.createdAt, match.matchDate, match.matchNumber)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {winner && (
                      <div className="text-right">
                        <div className="text-xs text-gold-400/60 mb-0.5">Winner</div>
                        <div className="text-sm font-semibold text-gold-400">{winner.name}</div>
                      </div>
                    )}
                    <ChevronRight size={16} className="text-white/30" />
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
