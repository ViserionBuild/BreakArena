import { Trash2, Trophy, Calendar, Clock, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import PlayerAvatar from '../components/ui/PlayerAvatar';
import { useState } from 'react';
import { Match } from '../types';
import ScoreGraph from '../components/graphs/ScoreGraph';

export default function MatchHistory() {
  const { matches, players, deleteMatch, setPage, activeMatchId } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedMatches = [...matches].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getDuration = (match: Match) => {
    if (!match.endedAt) return null;
    const ms = new Date(match.endedAt).getTime() - new Date(match.createdAt).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

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

  return (
    <div className="page-container">
      <div className="max-w-lg mx-auto px-4 pt-6">
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
            const isExpanded = expandedId === match.id;

            return (
              <div
                key={match.id}
                className="glass-card rounded-2xl overflow-hidden animate-slide-up"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                {/* Match header */}
                <button
                  className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/2 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : match.id)}
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
                      {formatDate(match.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {winner && (
                      <div className="text-right">
                        <div className="text-xs text-gold-400/60 mb-0.5">Winner</div>
                        <div className="text-sm font-semibold text-gold-400">{winner.name}</div>
                      </div>
                    )}
                    <ChevronRight size={16} className={`text-white/30 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-4 animate-fade-in">
                    {/* Scoreboard */}
                    <div className="space-y-2 mb-4">
                      {matchPlayers.map(({ playerId, player, totalScore, rank }) => player && (
                        <div key={playerId} className="flex items-center gap-3">
                          <span className={`rank-badge rank-${rank}`}>{rank}</span>
                          <PlayerAvatar avatar={player.avatar} color={player.color} name={player.name} size="sm" />
                          <span className="flex-1 text-white text-sm">{player.name}</span>
                          <span className={`font-mono font-bold text-sm ${totalScore > 0 ? 'text-jade-400' : 'text-crimson-400'}`}>
                            {totalScore > 0 ? '+' : ''}{totalScore.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Graph */}
                    {match.rounds.length > 1 && (
                      <div className="mb-4">
                        <div className="text-xs text-white/30 uppercase tracking-wider mb-2">Score Progression</div>
                        <ScoreGraph match={match} players={players} />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {match.status === 'active' && match.id === activeMatchId && (
                        <button onClick={() => setPage('liveMatch')} className="btn-primary flex-1 rounded-xl py-2.5 text-sm flex items-center justify-center gap-2">
                          Continue Match
                        </button>
                      )}
                      <button
                        onClick={() => deleteMatch(match.id)}
                        className="btn-danger rounded-xl py-2.5 px-4 flex items-center gap-2 text-sm"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
