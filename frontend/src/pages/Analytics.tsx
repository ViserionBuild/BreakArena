import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell, LabelList } from 'recharts';
import { useAppStore } from '../store/useAppStore';
import PlayerAvatar from '../components/ui/PlayerAvatar';
import { Trophy, Target, Zap, ChevronDown, Users, CheckSquare, X, ArrowUpDown } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
import type { Player, Match } from '../types';

type PlayerAccuracyEntry = {
  playerId: string;
  totalRounds: number;
  greenCount: number;
  greenAccuracy: number;
  netAccuracy: number;
};

// ─── Player Stats Section with Comparison Dropdown ──────────────────────────

type PlayerStatsSectionProps = {
  players: Player[];
  matches: Match[];
  playerAccuracy: (id: string) => PlayerAccuracyEntry;
};

type SortKey = 'wins' | 'winRate' | 'matches' | 'greenAcc' | 'netAcc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'matches',  label: 'Total Matches Played' },
  { key: 'wins',     label: 'Wins' },
  { key: 'winRate',  label: 'Win %' },
  { key: 'greenAcc', label: 'Green Accuracy' },
  { key: 'netAcc',   label: 'Net Accuracy' },
];

function PlayerStatsSection({ players, matches, playerAccuracy }: PlayerStatsSectionProps) {
  const [sortKey, setSortKey] = useState<SortKey>('winRate');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const sorted = [...players]
    .filter((p) => p.isActive)
    .sort((a, b) => {
      switch (sortKey) {
        case 'matches':  return b.stats.totalMatches - a.stats.totalMatches;
        case 'wins':     return b.stats.wins - a.stats.wins;
        case 'winRate':  return b.stats.winRate - a.stats.winRate;
        case 'greenAcc': return playerAccuracy(b.id).greenAccuracy - playerAccuracy(a.id).greenAccuracy;
        case 'netAcc':   return playerAccuracy(b.id).netAccuracy - playerAccuracy(a.id).netAccuracy;
        default:         return b.stats.wins - a.stats.wins;
      }
    });

  const allIds = sorted.map((p) => p.id);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(allIds));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // When a brand-new player appears, add them to the selection
  // WITHOUT resetting the user's existing picks.
  const prevIdsRef = useRef<Set<string>>(new Set(allIds));
  useEffect(() => {
    const prev = prevIdsRef.current;
    const nowIds = new Set(allIds);
    const newlyAdded = allIds.filter((id) => !prev.has(id));
    if (newlyAdded.length > 0) {
      setSelectedIds((old) => new Set([...old, ...newlyAdded]));
    }
    prevIdsRef.current = nowIds;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allIds.join(',')]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const togglePlayer = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(allIds));
  const clearAll = () => setSelectedIds(new Set());

  const accuracyLeaderId = sorted.reduce<string | null>((best, p) => {
    const a = playerAccuracy(p.id);
    const bestAcc = best ? playerAccuracy(best).greenAccuracy : -1;
    return a.totalRounds > 0 && a.greenAccuracy > bestAcc ? p.id : best;
  }, null);

  const visible = sorted.filter((p) => selectedIds.has(p.id));
  const selCount = selectedIds.size;
  const isAllSelected = selCount === allIds.length;

  return (
    <div className="mb-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
      {/* Section header + dropdowns */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-white">Player Stats</h2>

        <div className="flex items-center gap-2">
        {/* Sort dropdown */}
        <div className="relative" ref={sortDropdownRef}>
          <button
            onClick={() => setSortDropdownOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: sortDropdownOpen ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)',
              border: sortDropdownOpen ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.1)',
              color: sortDropdownOpen ? '#fbbf24' : 'rgba(255,255,255,0.6)',
            }}
          >
            <ArrowUpDown size={13} />
            <span className="hidden sm:inline">Sort</span>
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}
            >
              {SORT_OPTIONS.find((o) => o.key === sortKey)?.label.split(' ')[0]}
            </span>
            <ChevronDown
              size={13}
              style={{ transform: sortDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            />
          </button>

          {sortDropdownOpen && (
            <div
              className="absolute right-0 mt-2 z-50 min-w-[200px] rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(15,12,30,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div
                className="px-3 py-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Sort By</span>
              </div>
              <div className="py-1">
                {SORT_OPTIONS.map((opt) => {
                  const active = sortKey === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => { setSortKey(opt.key); setSortDropdownOpen(false); }}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 transition-all text-left"
                      style={{ background: active ? 'rgba(251,191,36,0.08)' : 'transparent' }}
                    >
                      <span
                        className="text-sm font-medium"
                        style={{ color: active ? '#fbbf24' : 'rgba(255,255,255,0.55)' }}
                      >
                        {opt.label}
                      </span>
                      {active && (
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: '#fbbf24', boxShadow: '0 0 6px #fbbf24' }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Comparison dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: dropdownOpen ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.06)',
              border: dropdownOpen ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.1)',
              color: dropdownOpen ? '#a78bfa' : 'rgba(255,255,255,0.6)',
            }}
          >
            <Users size={13} />
            <span>Compare</span>
            {selCount > 0 && selCount < allIds.length && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: 'rgba(167,139,250,0.25)', color: '#a78bfa' }}
              >
                {selCount}
              </span>
            )}
            {isAllSelected && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80' }}
              >
                All
              </span>
            )}
            <ChevronDown
              size={13}
              style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            />
          </button>

          {/* Dropdown panel */}
          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 z-50 min-w-[200px] rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(15,12,30,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              {/* Select All / Clear All */}
              <div
                className="flex items-center justify-between px-3 py-2.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                <button
                  onClick={selectAll}
                  className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
                  style={{ color: isAllSelected ? 'rgba(255,255,255,0.25)' : '#4ade80' }}
                  disabled={isAllSelected}
                >
                  <CheckSquare size={12} />
                  Select All
                </button>
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
                  style={{ color: selCount === 0 ? 'rgba(255,255,255,0.25)' : '#f87171' }}
                  disabled={selCount === 0}
                >
                  <X size={11} />
                  Clear All
                </button>
              </div>

              {/* Player list */}
              <div className="py-1">
                {sorted.map((player) => {
                  const checked = selectedIds.has(player.id);
                  return (
                    <button
                      key={player.id}
                      onClick={() => togglePlayer(player.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 transition-all text-left"
                      style={{
                        background: checked ? `${player.color}12` : 'transparent',
                      }}
                    >
                      {/* Checkbox */}
                      <span
                        className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all"
                        style={{
                          background: checked ? player.color : 'rgba(255,255,255,0.08)',
                          border: checked ? `1.5px solid ${player.color}` : '1.5px solid rgba(255,255,255,0.15)',
                          boxShadow: checked ? `0 0 8px ${player.color}60` : 'none',
                        }}
                      >
                        {checked && (
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>

                      {/* Color dot + name */}
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: player.color, boxShadow: `0 0 6px ${player.color}80` }}
                      />
                      <span
                        className="text-sm font-medium flex-1"
                        style={{ color: checked ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)' }}
                      >
                        {player.name}
                      </span>

                      {/* Win rate pill */}
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                        style={{
                          background: `${player.color}18`,
                          color: checked ? player.color : 'rgba(255,255,255,0.2)',
                          border: `1px solid ${checked ? player.color + '40' : 'transparent'}`,
                        }}
                      >
                        {player.stats.winRate}%
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Footer hint */}
              <div
                className="px-3 py-2 text-[10px] text-white/20 text-center"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                {selCount === 0 ? 'No players selected' : `Showing ${selCount} of ${allIds.length} players`}
              </div>
            </div>
          )}
        </div>
        </div> {/* end flex gap-2 */}
      </div>

      {/* Player cards grid */}
      {visible.length === 0 ? (
        <div
          className="rounded-2xl py-10 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="text-3xl mb-2">👥</div>
          <div className="text-white/30 text-sm">Select players to compare</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map((player) => {
            const acc = playerAccuracy(player.id);
            const globalIdx = sorted.findIndex((p) => p.id === player.id);
            const isTopPerformer = globalIdx === 0;
            const isAccuracySpec = !isTopPerformer && player.id === accuracyLeaderId && acc.totalRounds > 0;

            const radius = 32;
            const circ = 2 * Math.PI * radius;
            const winPct = Math.min(player.stats.winRate, 100);
            const dash = (winPct / 100) * circ;

            return (
              <div
                key={player.id}
                className="rounded-2xl p-4 relative overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${player.color}25`,
                  backdropFilter: 'blur(12px)',
                  boxShadow: visible.length > 1 ? `0 0 0 0px ${player.color}30` : 'none',
                }}
              >
                {/* Badge */}
                {isTopPerformer && (
                  <span className="absolute top-3 right-3 text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                    style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                    🏆 Top Performer
                  </span>
                )}
                {isAccuracySpec && (
                  <span className="absolute top-3 right-3 text-[10px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                    Accuracy Specialist
                  </span>
                )}

                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative">
                    <PlayerAvatar avatar={player.avatar} color={player.color} name={player.name} size="sm" />
                    {globalIdx === 0 && <span className="absolute -top-1 -right-1 text-xs">👑</span>}
                  </div>
                  <span className="font-display font-bold text-white text-base">{player.name}</span>

                </div>

                {/* Matches bar */}
                {(() => {
                  const played = player.stats.totalMatches;
                  const total = matches.length;
                  const pct = total > 0 ? Math.round((played / total) * 100) : 0;
                  const filledBlocks = Math.round((played / Math.max(total, 1)) * 14);
                  return (
                    <div className="mb-3 rounded-xl px-3 py-2 flex items-center gap-3"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-white/30 shrink-0">Matches</span>
                      <div className="flex-1 flex gap-[3px] h-3 items-center">
                        {Array.from({ length: 14 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex-1 h-full rounded-sm"
                            style={{
                              background: i < filledBlocks ? player.color : 'rgba(255,255,255,0.07)',
                              opacity: i < filledBlocks ? (0.45 + (i / Math.max(filledBlocks, 1)) * 0.55) : 1,
                              boxShadow: i === filledBlocks - 1 && filledBlocks > 0 ? `0 0 5px ${player.color}90` : 'none',
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono text-white/40 shrink-0">{played}<span className="text-white/20">/{total}</span></span>
                      <span className="text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded-full"
                        style={{ background: `${player.color}20`, color: player.color, border: `1px solid ${player.color}40` }}>
                        {pct}%
                      </span>
                    </div>
                  );
                })()}

                {/* Metrics row */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Win Rate ring */}
                  <div className="rounded-xl p-2.5 flex flex-col items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Win Rate</span>
                    <svg width="76" height="76" viewBox="0 0 76 76">
                      <circle cx="38" cy="38" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
                      <circle
                        cx="38" cy="38" r={radius} fill="none"
                        stroke={player.color} strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${dash} ${circ - dash}`}
                        strokeDashoffset={circ / 4}
                        style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 4px ${player.color}80)` }}
                      />
                      <text x="38" y="41" textAnchor="middle" fontSize="13" fontWeight="700" fill="white">{winPct}%</text>
                    </svg>
                    <span className="text-[10px] text-white/30 mt-1">{player.stats.wins}W / {player.stats.totalMatches}M</span>
                  </div>

                  {/* Accuracy column */}
                  <div className="flex flex-col gap-2">
                    <div className="rounded-xl p-2.5 flex-1"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[8px] font-semibold uppercase tracking-wider text-white/40 block">Green Accuracy</span>
                          <span className="text-lg font-bold leading-tight" style={{ color: '#4ade80' }}>{acc.greenAccuracy}%</span>
                          <span className="text-[9px] text-white/30 block">{acc.greenCount} / {acc.totalRounds} Rounds</span>
                        </div>
                        <svg width="24" height="22" viewBox="0 0 24 22">
                          {[8,14,10,20,12,18,22].map((h,i) => (
                            <rect key={i} x={i*3+1} y={22-h} width="2.5" height={h} rx="1"
                              fill={i >= 4 ? '#4ade80' : 'rgba(255,255,255,0.15)'} />
                          ))}
                        </svg>
                      </div>
                    </div>
                    <div className="rounded-xl p-2.5 flex-1"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[8px] font-semibold uppercase tracking-wider text-white/40 block">Net Accuracy</span>
                          <span className="text-lg font-bold leading-tight" style={{ color: '#a78bfa' }}>{acc.netAccuracy}%</span>
                        </div>
                        <svg width="28" height="18" viewBox="0 0 28 18">
                          <polyline
                            points="0,14 5,8 10,12 15,4 20,9 25,5 28,7"
                            fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ filter: 'drop-shadow(0 0 3px #a78bfa)' }}
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Analytics() {
  const { players, matches } = useAppStore();

  // Only consider active players throughout all analytics
  const activePlayers = players.filter((p) => p.isActive);

  const completedMatches = matches.filter((m) => m.status === 'completed');

  // Fetch bid accuracy from backend (rounds data not included in list response)
  const [accuracyMap, setAccuracyMap] = useState<Map<string, PlayerAccuracyEntry>>(new Map());
  useEffect(() => {
    api<PlayerAccuracyEntry[]>('/analytics/player-accuracy')
      .then((data) => {
        setAccuracyMap(new Map(data.map((entry) => [entry.playerId, entry])));
      })
      .catch(() => { /* silently ignore — bars stay at 0 */ });
  }, [completedMatches.length]);

  const playerAccuracy = (playerId: string): PlayerAccuracyEntry =>
    accuracyMap.get(playerId) ?? { playerId, totalRounds: 0, greenCount: 0, greenAccuracy: 0, netAccuracy: 0 };

  // Win rate data — active players only
  const winRateData = activePlayers
    .sort((a, b) => b.stats.winRate - a.stats.winRate)
    .map((p) => ({
      name: p.name,
      winRate: p.stats.winRate,
      wins: p.stats.wins,
      totalMatches: p.stats.totalMatches,
      color: p.color,
      avatar: p.avatar,
    }));


  // Radar data — active players only
  const radarData = activePlayers
    .map((p) => ({
      name: p.name.substring(0, 5),
      wins: p.stats.wins,
      avgScore: Math.max(0, p.stats.averageScore),
      winRate: p.stats.winRate / 10,
      matches: p.stats.totalMatches,
    }));

  const WinRateTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; color: string; wins: number; totalMatches: number; winRate: number } }> }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="glass-card rounded-xl p-3 text-xs min-w-[120px]">
        <div className="text-white font-semibold mb-1.5">{d.name}</div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-white/40">Wins / Played</span>
          <span className="font-mono font-bold" style={{ color: d.color }}>{d.wins} / {d.totalMatches}</span>
        </div>
        <div className="flex items-center justify-between gap-3 mt-1">
          <span className="text-white/40">Win Rate</span>
          <span className="font-mono font-bold" style={{ color: d.color }}>{d.winRate.toFixed(1)}%</span>
        </div>
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
          <StatCard icon={<Zap size={18} />} label="Active Players" value={activePlayers.length} sub="registered" />
        </div>

        {activePlayers.length === 0 || activePlayers.every((p) => p.stats.totalMatches === 0) ? (
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
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={winRateData} margin={{ top: 24, right: 5, bottom: 5, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} width={30} domain={[0, 100]} unit="%" />
                  <Tooltip content={<WinRateTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="winRate" radius={[6, 6, 0, 0]}>
                    {winRateData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                    ))}
                    <LabelList
                      dataKey="winRate"
                      position="top"
                      formatter={(v: number) => `${v.toFixed(1)}%`}
                      style={{ fill: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Avg Score Chart */}
            {/* <div className="glass-card rounded-2xl p-5 mb-4 animate-slide-up" style={{ animationDelay: '0.15s' }}>
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
            </div>  */}

            {/* Player Cards — 2-column grid with comparison dropdown (active players only) */}
            <PlayerStatsSection
              players={activePlayers}
              matches={matches}
              playerAccuracy={playerAccuracy}
            />


            {/* Radar Chart — all axes normalized to 0-100 so values are comparable (active players only) */}
            {radarData.length >= 3 && (() => {
              const radarActivePlayers = activePlayers;

              const maxWins       = Math.max(...radarActivePlayers.map(p => p.stats.wins), 1);
              const maxMatches    = Math.max(...radarActivePlayers.map(p => p.stats.totalMatches), 1);
              const maxGreenAcc   = Math.max(...radarActivePlayers.map(p => playerAccuracy(p.id).greenAccuracy), 1);
              const maxNetAcc     = Math.max(...radarActivePlayers.map(p => playerAccuracy(p.id).netAccuracy), 1);

              const norm = (v: number, max: number) => Math.round((v / max) * 100);

              const radarNormData = [
                { attr: 'Wins',          ...Object.fromEntries(radarActivePlayers.map(p => [p.name, norm(p.stats.wins, maxWins)])) },
                { attr: 'Matches',       ...Object.fromEntries(radarActivePlayers.map(p => [p.name, norm(p.stats.totalMatches, maxMatches)])) },
                { attr: 'Green Accuracy',...Object.fromEntries(radarActivePlayers.map(p => [p.name, norm(playerAccuracy(p.id).greenAccuracy, maxGreenAcc)])) },
                { attr: 'Net Accuracy',  ...Object.fromEntries(radarActivePlayers.map(p => [p.name, norm(playerAccuracy(p.id).netAccuracy, maxNetAcc)])) },
              ];

              return (
                <div className="glass-card rounded-2xl p-5 mb-4 animate-slide-up" style={{ animationDelay: '0.25s' }}>
                  <h2 className="font-display text-lg font-semibold text-white mb-4">Skill Radar</h2>
                  <ResponsiveContainer width="100%" height={340}>
                    <RadarChart data={radarNormData} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="attr" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      {radarActivePlayers.map((player) => (
                        <Radar
                          key={player.id}
                          name={player.name}
                          dataKey={player.name}
                          stroke={player.color}
                          fill={player.color}
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                      ))}
                    </RadarChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {radarActivePlayers.map((p) => (
                      <div key={p.id} className="flex items-center gap-1.5 text-xs text-white/50">
                        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        {p.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
