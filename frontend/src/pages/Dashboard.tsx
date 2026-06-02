import { Trophy, Play, TrendingUp, Users, Zap, ChevronRight, Star } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import PlayerAvatar from '../components/ui/PlayerAvatar';
import BgSuits from '../components/ui/BgSuits';

export default function Dashboard() {
  const { players, matches, setPage, activeMatchId } = useAppStore();
  
  const completedMatches = matches.filter((m) => m.status === 'completed');
  const sortedPlayers = [...players].sort((a, b) => b.stats.wins - a.stats.wins);
  const recentMatches = matches.slice(0, 3);

  return (
    <div className="page-container relative">
      <BgSuits />
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6">
        
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 text-lg">♠</div>
            <span className="text-xs text-white/40 uppercase tracking-widest font-medium">Call Break</span>
          </div>
          <h1 className="font-display text-4xl font-bold gold-text leading-tight">Scoreboard</h1>
          <p className="text-white/40 text-sm mt-1">Track every trick, every win</p>
        </div>

        {/* Active Match Banner */}
        {activeMatchId && (
          <div className="mb-6 animate-scale-in">
            <button
              onClick={() => setPage('liveMatch')}
              className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 group hover:border-gold-500/30 transition-all duration-300"
              style={{ boxShadow: '0 0 30px rgba(251,191,36,0.1)' }}
            >
              <div className="w-12 h-12 rounded-xl bg-jade-400/20 border border-jade-400/30 flex items-center justify-center">
                <div className="w-3 h-3 bg-jade-400 rounded-full animate-pulse" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-xs text-jade-400 font-medium uppercase tracking-wider mb-0.5">Live Match</div>
                <div className="text-white font-semibold">Match in progress</div>
              </div>
              <ChevronRight size={18} className="text-white/30 group-hover:text-gold-400 transition-colors" />
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={() => setPage('matchSetup')}
            className="btn-primary rounded-2xl py-4 flex flex-col items-center gap-2"
          >
            <Play size={22} />
            <span>New Match</span>
          </button>
          <button
            onClick={() => setPage('history')}
            className="btn-ghost rounded-2xl py-4 flex flex-col items-center gap-2"
          >
            <Trophy size={22} />
            <span>History</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Matches', value: matches.length, icon: <Trophy size={16} />, color: 'gold' },
            { label: 'Players', value: players.length, icon: <Users size={16} />, color: 'violet' },
            { label: 'Completed', value: completedMatches.length, icon: <Star size={16} />, color: 'jade' },
          ].map(({ label, value, icon, color }, i) => (
            <div
              key={label}
              className="glass-card rounded-2xl p-4 text-center animate-slide-up"
              style={{ animationDelay: `${0.1 + i * 0.05}s` }}
            >
              <div className={`flex justify-center mb-2 ${color === 'gold' ? 'text-gold-400' : color === 'jade' ? 'text-jade-400' : 'text-violet-400'}`}>
                {icon}
              </div>
              <div className="font-display text-2xl font-bold text-white">{value}</div>
              <div className="text-[11px] text-white/40 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>

        {/* Leaderboard */}
        {players.length > 0 && (
          <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-gold-400" />
                <h2 className="font-display text-lg font-semibold text-white">Leaderboard</h2>
              </div>
              <button onClick={() => setPage('players')} className="text-xs text-gold-400/70 hover:text-gold-400 transition-colors">
                View all →
              </button>
            </div>
            <div className="glass-card rounded-2xl overflow-hidden">
              {sortedPlayers.slice(0, 4).map((player, i) => (
                <div
                  key={player.id}
                  className="flex items-center gap-4 p-4 border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors"
                >
                  <span className={`rank-badge rank-${i + 1}`}>{i + 1}</span>
                  <PlayerAvatar avatar={player.avatar} color={player.color} name={player.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{player.name}</div>
                    <div className="text-xs text-white/40">{player.stats.totalMatches} matches</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gold-400 font-semibold font-mono">{player.stats.wins}W</div>
                    <div className="text-xs text-white/40">{player.stats.winRate}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <div className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-gold-400" />
                <h2 className="font-display text-lg font-semibold text-white">Recent Matches</h2>
              </div>
            </div>
            <div className="space-y-3">
              {recentMatches.map((match) => {
                const winner = match.winnerId
                  ? players.find((p) => p.id === match.winnerId)
                  : null;
                const matchPlayers = match.players
                  .map((mp) => players.find((p) => p.id === mp.playerId))
                  .filter(Boolean);
                  
                return (
                  <div key={match.id} className="glass-card rounded-2xl p-4 flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {matchPlayers.slice(0, 4).map((p) => p && (
                        <PlayerAvatar key={p.id} avatar={p.avatar} color={p.color} name={p.name} size="sm" className="ring-2 ring-ink-900" />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/60">{match.rounds.length} rounds</div>
                      {winner && <div className="text-xs text-gold-400">{winner.name} won</div>}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${match.status === 'active' ? 'bg-jade-400/20 text-jade-400' : 'bg-white/5 text-white/40'}`}>
                      {match.status === 'active' ? 'Live' : 'Done'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="h-8" />
      </div>
    </div>
  );
}
