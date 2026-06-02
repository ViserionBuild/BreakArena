import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Player } from '../../types';
import PlayerAvatar from '../ui/PlayerAvatar';

interface ScoreEntryProps {
  players: Player[];
  onSubmit: (scores: { playerId: string; bid: number; actualWins: number; score: number }[]) => void;
  onCancel: () => void;
  roundNumber: number;
}

interface PlayerEntry {
  playerId: string;
  bid: number;
  actualWins: number;
}

export default function ScoreEntry({ players, onSubmit, onCancel, roundNumber }: ScoreEntryProps) {
  const [entries, setEntries] = useState<PlayerEntry[]>(
    players.map((p) => ({ playerId: p.id, bid: 1, actualWins: 0 }))
  );

  const update = (playerId: string, field: 'bid' | 'actualWins', value: number) => {
    const clamped = Math.max(0, Math.min(13, value));
    setEntries((prev) =>
      prev.map((e) => (e.playerId === playerId ? { ...e, [field]: clamped } : e))
    );
  };

  const calcScore = (bid: number, actual: number) => {
    if (actual >= bid) return bid + (actual - bid) * 0.1;
    return -bid;
  };

  const totalActual = entries.reduce((s, e) => s + e.actualWins, 0);
  const isValid = totalActual === 13;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit(
      entries.map((e) => ({
        playerId: e.playerId,
        bid: e.bid,
        actualWins: e.actualWins,
        score: calcScore(e.bid, e.actualWins),
      }))
    );
  };

  const NumberPad = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(value - 1)}
        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all active:scale-95"
      >−</button>
      <span className="w-8 text-center text-white font-mono font-bold text-lg">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all active:scale-95"
      >+</button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg glass-card rounded-t-3xl p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Round {roundNumber}</h2>
            <p className="text-xs text-white/40">Enter bids and tricks won</p>
          </div>
          <button onClick={onCancel} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-4 gap-2 mb-3 text-[10px] uppercase tracking-widest text-white/30 px-1">
          <span>Player</span>
          <span className="text-center">Bid</span>
          <span className="text-center">Won</span>
          <span className="text-center">Score</span>
        </div>

        <div className="space-y-3 mb-5">
          {entries.map((entry, i) => {
            const player = players.find((p) => p.id === entry.playerId);
            if (!player) return null;
            const score = calcScore(entry.bid, entry.actualWins);
            const met = entry.actualWins >= entry.bid;

            return (
              <div key={entry.playerId} className="grid grid-cols-4 gap-2 items-center py-3 rounded-2xl bg-white/3 px-3"
                style={{ border: `1px solid ${player.color}22` }}>
                <div className="flex items-center gap-2">
                  <PlayerAvatar avatar={player.avatar} color={player.color} name={player.name} size="sm" />
                  <span className="text-white text-sm font-medium truncate">{player.name}</span>
                </div>
                <div className="flex justify-center">
                  <NumberPad value={entry.bid} onChange={(v) => update(entry.playerId, 'bid', v)} />
                </div>
                <div className="flex justify-center">
                  <NumberPad value={entry.actualWins} onChange={(v) => update(entry.playerId, 'actualWins', v)} />
                </div>
                <div className={`text-center font-mono font-bold text-sm ${met ? 'text-jade-400' : 'text-crimson-400'}`}>
                  {score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Validation */}
        <div className={`flex items-center justify-between mb-4 px-2 py-2 rounded-xl ${isValid ? 'bg-jade-400/10 border border-jade-400/20' : 'bg-crimson-400/10 border border-crimson-400/20'}`}>
          <span className="text-xs text-white/40">Total tricks won</span>
          <span className={`font-mono font-bold ${isValid ? 'text-jade-400' : 'text-crimson-400'}`}>
            {totalActual}/13 {isValid ? '✓' : '× (must = 13)'}
          </span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="btn-primary w-full rounded-2xl py-4 text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check size={20} />
          Save Round {roundNumber}
        </button>
      </div>
    </div>
  );
}
