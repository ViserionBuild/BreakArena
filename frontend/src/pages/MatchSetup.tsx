import { useState } from 'react';
import { ChevronUp, ChevronDown, Play, Info, Plus, X, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import PlayerAvatar from '../components/ui/PlayerAvatar';

/* ─── Avatar picker (same groups as PlayerManagement) ─── */
const AVATAR_GROUPS = [
  {
    label: '🐲 Dragons',
    emojis: ['🐉', '🐲', '🦕', '🦖', '🔥', '🧨', '⚡', '🌪️', '💥', '🌊', '❄️', '☄️', '🌋', '🐍', '🦎', '🦜', '🦚', '🦅', '🦇', '🪲'],
  },
  {
    label: '🍎 Fruits',
    emojis: ['🍎', '🍊', '🍋', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥝', '🍌', '🍉', '🍈', '🍏', '🫒', '🍑', '🥑', '🍆', '🌶️'],
  },
  {
    label: '🥦 Vegetables',
    emojis: ['🥦', '🥕', '🌽', '🌿', '🍄', '🧅', '🧄', '🥔', '🫛', '🥜', '🌰', '🍞', '🫚', '🌱', '🪴', '🌵', '🎋', '🍀', '🌾', '🌸'],
  },
  {
    label: '🎮 Games',
    emojis: ['🎮', '🕹️', '🎲', '🎯', '🎳', '🎱', '♟️', '🃏', '🀄', '🎰', '🧩', '🎴', '🪀', '🪁', '🎊', '🏆', '🥇', '🎖️', '🎟️', '🎪'],
  },
  {
    label: '🦸 Characters',
    emojis: ['🧑‍🚀', '🥷', '🧙‍♂️', '🧝‍♀️', '🧜‍♂️', '🧛‍♂️', '🧟‍♂️', '🧞‍♂️', '🦸', '🦹', '👺', '👹', '🤖', '👾', '🧑‍🎤', '🧑‍🎨', '🧑‍🔬', '🧑‍⚖️', '🧑‍🍳', '🧑‍🏴‍☠️'],
  },
  {
    label: '😈 Funny Faces',
    emojis: ['😈', '🤡', '💀', '👽', '🤪', '🥴', '😤', '🤯', '🥶', '🤬', '😎', '🥸', '🤓', '😏', '😒', '🙃', '🤑', '😝', '😜', '🫠'],
  },
];

const ALL_AVATARS = AVATAR_GROUPS.flatMap((g) => g.emojis);

const AvatarPicker = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (emoji: string) => void;
}) => (
  <div
    className="max-h-44 overflow-y-auto pr-1 space-y-3"
    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
  >
    {AVATAR_GROUPS.map((group) => (
      <div key={group.label}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-1.5">{group.label}</p>
        <div className="flex flex-wrap gap-1.5">
          {group.emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSelect(emoji)}
              className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                selected === emoji
                  ? 'bg-gold-500/30 border border-gold-500/60 scale-110'
                  : 'bg-white/5 border border-transparent hover:bg-white/10 hover:scale-105'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default function MatchSetup() {
  const { players, createMatch, setPage, isSaving, addPlayer } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [totalRounds, setTotalRounds] = useState(10);

  // Add-player inline form state
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState(ALL_AVATARS[0]);
  const [isAdding, setIsAdding] = useState(false);

  /* Only active players are eligible for a new match */
  const activePlayers = players.filter((p) => p.isActive);

  const togglePlayer = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const movePlayer = (idx: number, dir: 'up' | 'down') => {
    const next = [...selectedIds];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setSelectedIds(next);
  };

  const handleStart = async () => {
    if (selectedIds.length !== 4) return;
    try {
      await createMatch(selectedIds, totalRounds);
      setPage('liveMatch');
    } catch {
      // Error surfaced via global store banner
    }
  };

  const handleAddPlayer = async () => {
    if (!newName.trim()) return;
    setIsAdding(true);
    try {
      await addPlayer(newName.trim(), newAvatar);
      setNewName('');
      setNewAvatar(ALL_AVATARS[0]);
      setShowAdd(false);
    } catch {
      // Error surfaced via global store banner
    } finally {
      setIsAdding(false);
    }
  };

  const ROUND_OPTIONS = [5, 8, 10, 13, 15, 20];

  return (
    <div className="page-container">
      <div className="w-full max-w-4xl mx-auto px-6 lg:px-8 pt-6">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-white">New Match</h1>
          <p className="text-white/40 text-sm mt-1">Select exactly 4 players to begin</p>
        </div>

        {/* Round selector */}
        <div className="glass-card rounded-2xl p-5 mb-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} className="text-gold-400" />
            <span className="text-sm font-medium text-white">Total Rounds</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ROUND_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => setTotalRounds(r)}
                className={`px-4 py-2 rounded-xl text-sm font-mono font-medium transition-all ${
                  totalRounds === r
                    ? 'bg-gold-500 text-ink-950'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Player selection */}
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-lg font-semibold text-white">Select Players</h2>
              <span className={`text-sm font-mono ${selectedIds.length === 4 ? 'text-jade-400' : 'text-white/40'}`}>
                {selectedIds.length}/4
              </span>
            </div>
            {/* Add Player button */}
            <button
              onClick={() => { setShowAdd((v) => !v); setNewName(''); setNewAvatar(ALL_AVATARS[0]); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                showAdd
                  ? 'bg-white/10 text-white/60'
                  : 'bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 hover:text-gold-300'
              }`}
            >
              {showAdd ? <X size={13} /> : <Plus size={13} />}
              {showAdd ? 'Cancel' : 'Add Player'}
            </button>
          </div>

          {/* Inline Add Player Form */}
          {showAdd && (
            <div className="glass-card rounded-2xl p-4 mb-3 animate-scale-in border border-gold-500/20">
              <h3 className="text-sm font-semibold text-white mb-3">New Player</h3>

              <div className="mb-3">
                <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 block">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                  placeholder="Player name..."
                  className="input-field"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 block">Avatar</label>
                <AvatarPicker selected={newAvatar} onSelect={setNewAvatar} />
              </div>

              <button
                onClick={handleAddPlayer}
                disabled={!newName.trim() || isAdding}
                className="btn-primary w-full rounded-xl py-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={15} />
                {isAdding ? 'Adding...' : 'Add Player'}
              </button>
            </div>
          )}

          {/* Active players list */}
          <div className="space-y-2">
            {activePlayers.map((player) => {
              const isSelected = selectedIds.includes(player.id);
              const seatIdx = selectedIds.indexOf(player.id);
              const isFull = selectedIds.length === 4 && !isSelected;

              return (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  disabled={isFull}
                  className={`w-full glass-card rounded-2xl p-4 flex items-center gap-4 transition-all duration-200
                    ${isSelected ? 'border-gold-500/40' : 'opacity-60'}
                    ${isFull ? 'cursor-not-allowed opacity-30' : 'hover:border-white/20'}
                  `}
                  style={isSelected ? { boxShadow: `0 0 20px ${player.color}20` } : {}}
                >
                  <PlayerAvatar avatar={player.avatar} color={player.color} name={player.name} size="sm" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-white">{player.name}</div>
                    <div className="text-xs text-white/40">{player.stats.wins}W · {player.stats.winRate}% win rate</div>
                  </div>
                  {isSelected && (
                    <div className="w-7 h-7 rounded-full bg-gold-500 flex items-center justify-center text-ink-950 font-bold text-sm">
                      {seatIdx + 1}
                    </div>
                  )}
                  {!isSelected && !isFull && (
                    <div className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Not enough active players warning */}
          {activePlayers.length < 4 && (
            <div className="mt-3 p-3 rounded-xl bg-crimson-500/10 border border-crimson-500/20 text-crimson-400 text-sm text-center">
              {activePlayers.length === 0
                ? 'No active players. Add players above to get started.'
                : `Need ${4 - activePlayers.length} more active player${4 - activePlayers.length > 1 ? 's' : ''}. Add them above.`}
            </div>
          )}
        </div>

        {/* Seat order */}
        {selectedIds.length > 0 && (
          <div className="glass-card rounded-2xl p-5 mb-6 animate-scale-in">
            <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4">Seat Order</h3>
            <div className="space-y-2">
              {selectedIds.map((id, idx) => {
                const player = activePlayers.find((p) => p.id === id);
                if (!player) return null;
                return (
                  <div key={id} className="flex items-center gap-3">
                    <span className={`rank-badge rank-${idx + 1}`}>{idx + 1}</span>
                    <PlayerAvatar avatar={player.avatar} color={player.color} name={player.name} size="sm" />
                    <span className="flex-1 text-white text-sm">{player.name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => movePlayer(idx, 'up')} disabled={idx === 0}
                        className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-20 transition-all">
                        <ChevronUp size={14} />
                      </button>
                      <button onClick={() => movePlayer(idx, 'down')} disabled={idx === selectedIds.length - 1}
                        className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-20 transition-all">
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={selectedIds.length !== 4 || isSaving}
          className="btn-primary w-full rounded-2xl py-4 text-lg font-semibold flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed animate-slide-up"
          style={{ animationDelay: '0.1s' }}
        >
          <Play size={22} />
          {isSaving ? 'Starting...' : 'Start Match'}
        </button>

        <div className="h-8" />
      </div>
    </div>
  );
}
