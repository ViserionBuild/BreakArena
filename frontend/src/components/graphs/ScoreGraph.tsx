import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Player, Match } from '../../types';
import { computePlayerActualTotal } from '../../utils';
import PlayerAvatar from '../ui/PlayerAvatar';

interface ScoreGraphProps {
  match: Match;
  players: Player[];
}

export default function ScoreGraph({ match, players }: ScoreGraphProps) {
  if (match.rounds.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-5 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-gold-400" />
          <h2 className="font-display text-lg font-semibold text-white">Cumulative Actual Total</h2>
        </div>
        <div className="flex items-center justify-center h-48 text-white/20 text-sm">
          Scores will appear after Round 1
        </div>
      </div>
    );
  }

  const data = match.rounds.map((round, roundIndex) => {
    const point: Record<string, number | string> = { round: `R${round.roundNumber}` };

    match.players.forEach((mp) => {
      const player = players.find((p) => p.id === mp.playerId);
      if (player) {
        point[player.name] = computePlayerActualTotal(match.rounds, mp.playerId, roundIndex);
      }
    });

    return point;
  });

  const CustomTooltip = ({ active, payload, label }: {active?: boolean, payload?: Array<{color: string; name: string; value: number}>, label?: string}) => {
    if (!active || !payload?.length) return null;
    const sorted = [...payload].sort((a, b) => b.value - a.value);
    return (
      <div className="glass-card rounded-xl p-3 text-xs min-w-[140px]">
        <div className="text-white/40 mb-2 font-mono">{label}</div>
        {sorted.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
              <span className="text-white/70">{entry.name}</span>
            </div>
            <span className={`font-mono font-bold ${entry.value >= 0 ? 'text-jade-400' : 'text-crimson-400'}`}>
              {entry.value > 0 ? '+' : ''}{entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const legendPlayers = match.players
    .map((mp) => players.find((p) => p.id === mp.playerId))
    .filter((p): p is Player => Boolean(p));

  return (
    <div className="glass-card rounded-3xl p-5 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} className="text-gold-400" />
        <h2 className="font-display text-lg font-semibold text-white">Cumulative Actual Total</h2>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 24, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="round"
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'Round Number', position: 'insideBottom', offset: -12, fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            width={36}
            label={{ value: 'Actual Total', angle: -90, position: 'insideLeft', offset: 12, fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
          {match.players.map((mp) => {
            const player = players.find((p) => p.id === mp.playerId);
            if (!player) return null;
            return (
              <Line
                key={mp.playerId}
                type="monotone"
                dataKey={player.name}
                stroke={player.color}
                strokeWidth={2.5}
                dot={{ fill: player.color, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: player.color, stroke: '#0a0a0f', strokeWidth: 2 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap justify-center gap-4 mt-2 pt-3 border-t border-white/5">
        {legendPlayers.map((player) => (
          <div key={player.id} className="flex items-center gap-2 text-xs text-white/60">
            <span className="w-3 h-0.5 rounded-full shrink-0" style={{ background: player.color }} />
            <PlayerAvatar avatar={player.avatar} color={player.color} name={player.name} size="sm" />
            <span className="font-medium text-white/80">{player.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
