import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Player, Match } from '../../types';
import { calculateCallBreakScore } from '../../utils';

interface ScoreGraphProps {
  match: Match;
  players: Player[];
}

export default function ScoreGraph({ match, players }: ScoreGraphProps) {
  if (match.rounds.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-white/20 text-sm">
        Scores will appear after Round 1
      </div>
    );
  }

  // Build cumulative data
  const data = match.rounds.map((round, i) => {
    const point: Record<string, number | string> = { round: `R${round.roundNumber}` };
    
    match.players.forEach((mp) => {
      const cumulative = match.rounds.slice(0, i + 1).reduce((sum, r) => {
        const rs = r.scores.find((s) => s.playerId === mp.playerId);
        if (!rs) return sum;
        return sum + calculateCallBreakScore(rs.bid, rs.actualWins);
      }, 0);
      
      const player = players.find((p) => p.id === mp.playerId);
      if (player) point[player.name] = Math.round(cumulative * 10) / 10;
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

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="round" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={30} />
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
  );
}
