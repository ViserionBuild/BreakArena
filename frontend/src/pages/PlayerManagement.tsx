import { useState } from 'react';
import { Plus, Edit2, Trash2, Trophy, Target, TrendingUp, X, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import PlayerAvatar from '../components/ui/PlayerAvatar';

const EMOJI_OPTIONS = ['♠️', '♥️', '♦️', '♣️', '🃏', '🎴', '🎲', '⚡', '🔥', '💎', '🌟', '👑'];

interface EditState {
  id: string;
  name: string;
  avatar: string;
}

export default function PlayerManagement() {
  const { players, addPlayer, updatePlayer, deletePlayer } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('♠️');
  const [editing, setEditing] = useState<EditState | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addPlayer(newName.trim(), newAvatar);
    setNewName('');
    setNewAvatar('♠️');
    setShowAdd(false);
  };

  const handleUpdate = () => {
    if (!editing || !editing.name.trim()) return;
    updatePlayer(editing.id, editing.name.trim(), editing.avatar);
    setEditing(null);
  };

  const sortedPlayers = [...players].sort((a, b) => b.stats.wins - a.stats.wins);

  return (
    <div className="page-container">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Players</h1>
            <p className="text-white/40 text-sm mt-1">{players.length} registered</p>
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
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
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
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setNewAvatar(emoji)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                      newAvatar === emoji ? 'bg-gold-500/30 border border-gold-500/60 scale-110' : 'bg-white/5 border border-transparent hover:bg-white/10'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleAdd} disabled={!newName.trim()} className="btn-primary w-full rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <Check size={18} />
              Add Player
            </button>
          </div>
        )}

        {/* Players List */}
        <div className="space-y-3">
          {sortedPlayers.map((player, idx) => (
            <div
              key={player.id}
              className="glass-card rounded-2xl p-4 animate-slide-up"
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
                  <div className="flex flex-wrap gap-2 mb-3">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setEditing({ ...editing, avatar: emoji })}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                          editing.avatar === emoji ? 'bg-gold-500/30 border border-gold-500/60' : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {emoji}
                      </button>
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
                    {idx < 3 && (
                      <span className={`absolute -top-1 -right-1 rank-badge rank-${idx + 1} w-5 h-5 text-[10px]`}>{idx + 1}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white">{player.name}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-xs text-white/40">
                        <Trophy size={10} className="text-gold-400" />
                        <span>{player.stats.wins}W / {player.stats.totalMatches}M</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/40">
                        <Target size={10} className="text-jade-400" />
                        <span>{player.stats.winRate}%</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/40">
                        <TrendingUp size={10} className="text-violet-400" />
                        <span>avg {player.stats.averageScore}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditing({ id: player.id, name: player.name, avatar: player.avatar })}
                      className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => deletePlayer(player.id)}
                      className="w-8 h-8 rounded-xl bg-crimson-500/10 hover:bg-crimson-500/20 flex items-center justify-center text-crimson-400/60 hover:text-crimson-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {players.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-5xl mb-4">♠️</div>
            <div className="text-white/30 text-lg">No players yet</div>
            <div className="text-white/20 text-sm mt-1">Add your first player above</div>
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
