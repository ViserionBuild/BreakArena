import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell } from 'recharts';
import { useAppStore } from '../store/useAppStore';
import PlayerAvatar from '../components/ui/PlayerAvatar';
import { Trophy, Target, TrendingUp, Zap } from 'lucide-react';

export default function Analytics() {
  const { players, matches } = useAppStore();

  const completedMatches = matches.filter((m) => m.status === 'completed');

  // Win rate data
  const winRateData = players
    .filter((p) => p.stats.totalMatches > 0)
    .sort((a, b) => b.stats.winRate - a.stats.winRate)
    .map((p) => ({
      name: p.name,
      winRate: p.stats.winRate,
      color: p.color,
      avatar: p.avatar,
    }));

  // Avg score data
  const avgScoreData = players
    .filter((p) => p.stats.totalMatches > 0)
    .sort((a, b) => b.stats.averageScore - a.stats.averageScore)
    .map((p) => ({
      name: p.name,
      avg: p.stats.averageScore,
      color: p.color,
    }));

  // Radar data
  const radarData = players
    .filter((p) => p.stats.totalMatches > 0)
    .map((p) => ({
      name: p.name.substring(0, 5),
      wins: p.stats.wins,
      avgScore: Math.max(0, p.stats.averageScore),
      winRate: p.stats.winRate / 10,
      matches: p.stats.totalMatches,
    }));

  const CustomTooltip = ({ active, payload }: {active?: boolean, payload?: Array<{payload: {name: string; color: string}; value: number; name: string}> }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass-card rounded-xl p-3 text-xs">
        <div className="text-white font-medium mb-1">{payload[0].payload.name}</div>
        <div className="text-gold-400 font-mono">{payload[0].value.toFixed(1)}{payload[0].name === 'winRate' ? '%' : ''}</div>
      </div>
    );
  };

  const StatCard = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) => (
    <div className="glass-card rounded-2xl p-4 text-center">
      <div className="flex justify-center mb-2 text-gold-400">{icon}</div>
      <div className="font-display text-2xl font-bold text-white">{value}</div>
      <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">{label}</div>
      {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
    </div>
  );

  return (
    <div className="page-container">
      <div className="w-full max-w-6xl mx-auto px-6 lg:px-8 pt-6">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-white">Analytics</h1>
          <p className="text-white/40 text-sm mt-1">Performance insights</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8 animate-slide-up">
          <StatCard icon={<Trophy size={18} />} label="Matches" value={matches.length} sub={`${completedMatches.length} completed`} />
          <StatCard icon={<Zap size={18} />} label="Players" value={players.length} sub="registered" />
        </div>

        {players.length === 0 || players.every((p) => p.stats.totalMatches === 0) ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📊</div>
            <div className="text-white/30">Complete matches to see analytics</div>
          </div>
        ) : (
          <>
            {/* Win Rate Chart */}
            <div className="glass-card rounded-2xl p-5 mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 mb-4">
                <Target size={16} className="text-gold-400" />
                <h2 className="font-display text-lg font-semibold text-white">Win Rate</h2>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={winRateData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} width={30} domain={[0, 100]} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="winRate" radius={[6, 6, 0, 0]}>
                    {winRateData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Avg Score Chart */}
            <div className="glass-card rounded-2xl p-5 mb-4 animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-violet-400" />
                <h2 className="font-display text-lg font-semibold text-white">Average Score</h2>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={avgScoreData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avg" radius={[0, 6, 6, 0]}>
                    {avgScoreData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Player Cards */}
            <div className="glass-card rounded-2xl p-5 mb-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="font-display text-lg font-semibold text-white mb-4">Player Stats</h2>
              <div className="space-y-4">
                {[...players].filter((p) => p.stats.totalMatches > 0).sort((a, b) => b.stats.wins - a.stats.wins).map((player, idx) => (
                  <div key={player.id} className="flex items-center gap-4">
                    <div className="relative">
                      <PlayerAvatar avatar={player.avatar} color={player.color} name={player.name} size="sm" />
                      {idx === 0 && <span className="absolute -top-1 -right-1 text-xs">👑</span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-white text-sm">{player.name}</span>
                        <span className="text-xs font-mono text-white/40">{player.stats.wins}W/{player.stats.totalMatches}M</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${player.stats.winRate}%`, background: player.color }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-white/30">win rate: {player.stats.winRate}%</span>
                        <span className="text-[10px] text-white/30">avg: {player.stats.averageScore}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar Chart */}
            {radarData.length >= 3 && (
              <div className="glass-card rounded-2xl p-5 mb-4 animate-slide-up" style={{ animationDelay: '0.25s' }}>
                <h2 className="font-display text-lg font-semibold text-white mb-4">Skill Radar</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={[
                    { attr: 'Wins', ...Object.fromEntries(players.filter(p => p.stats.totalMatches > 0).map(p => [p.name, p.stats.wins])) },
                    { attr: 'Win%', ...Object.fromEntries(players.filter(p => p.stats.totalMatches > 0).map(p => [p.name, p.stats.winRate])) },
                    { attr: 'Avg', ...Object.fromEntries(players.filter(p => p.stats.totalMatches > 0).map(p => [p.name, Math.max(0, p.stats.averageScore)])) },
                    { attr: 'Matches', ...Object.fromEntries(players.filter(p => p.stats.totalMatches > 0).map(p => [p.name, p.stats.totalMatches])) },
                  ]} cx="50%" cy="50%" outerRadius="65%">
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="attr" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    {players.filter(p => p.stats.totalMatches > 0).map((player) => (
                      <Radar key={player.id} name={player.name} dataKey={player.name} stroke={player.color} fill={player.color} fillOpacity={0.12} strokeWidth={2} />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {players.filter(p => p.stats.totalMatches > 0).map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5 text-xs text-white/50">
                      <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
