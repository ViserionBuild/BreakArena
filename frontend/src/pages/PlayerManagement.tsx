import { useState } from 'react';
import { Plus, Edit2, Trash2, Trophy, Target, X, Check, RotateCcw, UserX } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import PlayerAvatar from '../components/ui/PlayerAvatar';

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

const ALL_AVATARS = AVATAR_GROUPS.flatMap(g => g.emojis);

interface EditState {
  id: string;
  name: string;
  avatar: string;
}

const AvatarPicker = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (emoji: string) => void;
}) => (
  <div
    className="max-h-48 overflow-y-auto pr-1 space-y-3"
    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
  >
    {AVATAR_GROUPS.map((group) => (
      <div key={group.label}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-1.5">{group.label}</p>
        <div className="flex flex-wrap gap-1.5">
          {group.emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
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

export default function PlayerManagement() {
  const { players, addPlayer, updatePlayer, deletePlayer, reactivatePlayer } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState(ALL_AVATARS[0]);
  const [editing, setEditing] = useState<EditState | null>(null);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await addPlayer(newName.trim(), newAvatar);
      setNewName('');
      setNewAvatar(ALL_AVATARS[0]);
      setShowAdd(false);
    } catch {
      // Error surfaced via global store banner
    }
  };

  const handleUpdate = async () => {
    if (!editing || !editing.name.trim()) return;
    try {
      await updatePlayer(editing.id, editing.name.trim(), editing.avatar);
      setEditing(null);
    } catch {
      // Error surfaced via global store banner
    }
  };

  const activePlayers = [...players]
    .filter((p) => p.isActive)
    .sort((a, b) => b.stats.wins - a.stats.wins);

  const inactivePlayers = [...players]
    .filter((p) => !p.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));

  const renderPlayerCard = (player: (typeof players)[0], idx: number, isActive: boolean) => (
    <div
      key={player.id}
      className={`glass-card rounded-2xl p-4 animate-slide-up transition-all ${
        isActive ? '' : 'opacity-50'
      }`}
      style={{ animationDelay: `${idx * 0.05}s` }}
    >
      {editing?.id === player.id ? (
        // Edit mode
        <div>
          <input
            type="text"
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            className="input-field mb-3"
            autoFocus
          />
          <div
            className="flex flex-wrap gap-1.5 mb-3 max-h-40 overflow-y-auto pr-1"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
          >
            {AVATAR_GROUPS.map((group) => (
              <div key={group.label} className="w-full">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-1 mt-1">{group.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setEditing({ ...editing, avatar: emoji })}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                        editing.avatar === emoji
                          ? 'bg-gold-500/30 border border-gold-500/60 scale-110'
                          : 'bg-white/5 hover:bg-white/10 hover:scale-105'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleUpdate} className="btn-primary flex-1 rounded-xl py-2 flex items-center justify-center gap-2">
              <Check size={16} /> Save
            </button>
            <button onClick={() => setEditing(null)} className="btn-ghost flex-1 rounded-xl py-2">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative">
            <PlayerAvatar avatar={player.avatar} color={player.color} name={player.name} size="md" />
            {isActive && idx < 3 && (
              <span className={`absolute -top-1 -right-1 rank-badge rank-${idx + 1} w-5 h-5 text-[10px]`}>{idx + 1}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className={`font-semibold ${isActive ? 'text-white' : 'text-white/50'}`}>
              {player.name}
            </div>
            {isActive ? (
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-xs text-white/40">
                  <Trophy size={10} className="text-gold-400" />
                  <span>{player.stats.wins}W / {player.stats.totalMatches}M</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-white/40">
                  <Target size={10} className="text-jade-400" />
                  <span>{player.stats.winRate}%</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-1">
                <UserX size={10} className="text-white/30" />
                <span className="text-xs text-white/30">Inactive · {player.stats.totalMatches}M played</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isActive ? (
              <>
                <button
                  onClick={() => setEditing({ id: player.id, name: player.name, avatar: player.avatar })}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
                  title="Edit player"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => deletePlayer(player.id)}
                  className="w-8 h-8 rounded-xl bg-crimson-500/10 hover:bg-crimson-500/20 flex items-center justify-center text-crimson-400/60 hover:text-crimson-400 transition-all"
                  title="Deactivate player"
                >
                  <Trash2 size={14} />
                </button>
              </>
            ) : (
              <button
                onClick={() => reactivatePlayer(player.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-jade-500/10 hover:bg-jade-500/20 text-jade-400/70 hover:text-jade-400 text-xs font-medium transition-all"
                title="Reactivate player"
              >
                <RotateCcw size={12} />
                Reactivate
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="page-container">
      <div className="w-full max-w-5xl mx-auto px-6 lg:px-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Players</h1>
            <p className="text-white/40 text-sm mt-1">
              {activePlayers.length} active
              {inactivePlayers.length > 0 && ` · ${inactivePlayers.length} inactive`}
            </p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary rounded-xl flex items-center gap-2 py-2.5 px-4">
            <Plus size={18} />
            <span>Add</span>
          </button>
        </div>

        {/* Add Player Form */}
        {showAdd && (
          <div className="glass-card rounded-2xl p-5 mb-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-white">New Player</h3>
              <button
                onClick={() => setShowAdd(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-4">
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="Player name..."
                className="input-field"
                autoFocus
              />
            </div>

            <div className="mb-5">
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Avatar</label>
              <AvatarPicker selected={newAvatar} onSelect={setNewAvatar} />
            </div>

            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="btn-primary w-full rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={18} />
              Add Player
            </button>
          </div>
        )}

        {/* ── Active Players ── */}
        {activePlayers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-jade-400 shadow-[0_0_6px_1px] shadow-jade-400/60" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
                Active · {activePlayers.length}
              </span>
            </div>
            <div className="space-y-3">
              {activePlayers.map((player, idx) => renderPlayerCard(player, idx, true))}
            </div>
          </div>
        )}

        {activePlayers.length === 0 && !showAdd && (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-5xl mb-4">♠️</div>
            <div className="text-white/30 text-lg">No active players</div>
            <div className="text-white/20 text-sm mt-1">Add your first player above</div>
          </div>
        )}

        {/* ── Inactive Players ── */}
        {inactivePlayers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-white/20" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/30">
                Inactive · {inactivePlayers.length}
              </span>
              <span className="text-[10px] text-white/20 ml-1">· history preserved</span>
            </div>
            <div className="space-y-3">
              {inactivePlayers.map((player, idx) => renderPlayerCard(player, idx, false))}
            </div>
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
