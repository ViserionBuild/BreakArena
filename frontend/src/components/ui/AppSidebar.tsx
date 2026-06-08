import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  BarChart2,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
  Trophy,
  Users,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatMatchLabel, parseIndianTimestamp } from '../../utils';
import { Match, Page } from '../../types';

const topNav: { page: Page; icon: ReactNode; label: string }[] = [
  { page: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { page: 'players', icon: <Users size={18} />, label: 'Players' },
  { page: 'analytics', icon: <BarChart2 size={18} />, label: 'Stats' },
];

export default function AppSidebar() {
  const {
    currentPage,
    setPage,
    matches,
    players,
    activeMatchId,
    setActiveMatchId,
    selectedHistoryMatchId,
    setSelectedHistoryMatchId,
    currentGroup,
    groupSignOut,
  } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);

  const liveMatches = matches
    .filter((match) => match.status === 'active' || match.status === 'paused')
    .sort((a, b) => parseIndianTimestamp(b.createdAt).getTime() - parseIndianTimestamp(a.createdAt).getTime());
  const pastMatches = matches
    .filter((match) => match.status === 'completed')
    .sort((a, b) => parseIndianTimestamp(b.createdAt).getTime() - parseIndianTimestamp(a.createdAt).getTime());

  const goToPage = (page: Page) => {
    setSelectedHistoryMatchId(null);
    setPage(page);
  };

  const openMatch = (match: Match) => {
    if (match.status === 'active' || match.status === 'paused') {
      setActiveMatchId(match.id);
      setSelectedHistoryMatchId(null);
      setPage('liveMatch');
      return;
    }
    setSelectedHistoryMatchId(match.id);
    setPage('history');
  };

  const getMatchSubtext = (match: Match) => {
    const winner = match.winnerId ? players.find((player) => player.id === match.winnerId) : null;
    if (winner) return `${winner.name} won`;
    return `${match.totalRounds ?? match.rounds.length} rounds`;
  };

  return (
    <aside className={`app-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-white/5">
        <button
          onClick={() => goToPage('dashboard')}
          className={`min-w-0 flex items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-white/5 transition-colors ${collapsed ? 'justify-center' : 'flex-1'}`}
          title="Dashboard"
        >
          <div className="w-8 h-8 rounded-lg bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 text-base">♠</div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">BreakArena</div>
              <div className="text-[10px] uppercase tracking-widest text-white/35">Call Break</div>
            </div>
          )}
        </button>
        <button
          onClick={() => setCollapsed((value) => !value)}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/45 hover:text-white transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      <div className="p-3 border-b border-white/5">
        <div className="space-y-1">
          {topNav.map(({ page, icon, label }) => {
            const active = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`sidebar-button ${active ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
                title={label}
              >
                {icon}
                {!collapsed && <span>{label}</span>}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => goToPage('matchSetup')}
          className={`mt-3 w-full btn-primary rounded-xl py-2.5 px-3 flex items-center justify-center gap-2 ${collapsed ? 'px-0' : ''}`}
          title="New Match"
        >
          <Plus size={17} />
          {!collapsed && <span>New Match</span>}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
        {liveMatches.length > 0 && (
          <div className="mb-5">
            {!collapsed && <div className="sidebar-section-label">Live Matches</div>}
            <div className="space-y-1">
              {liveMatches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => openMatch(match)}
                  className={`sidebar-match ${currentPage === 'liveMatch' && activeMatchId === match.id ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                  title={formatMatchLabel(matches, match.createdAt, match.matchDate, match.matchNumber)}
                >
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-jade-400/15 text-jade-400">
                    <Play size={15} />
                    {match.status === 'active' && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-jade-400" />}
                  </span>
                  {!collapsed && (
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm text-white">{formatMatchLabel(matches, match.createdAt, match.matchDate, match.matchNumber)}</span>
                      <span className={`block truncate text-xs ${match.status === 'active' ? 'text-jade-400/70' : 'text-white/35'}`}>
                        {match.status === 'active' ? 'Live' : 'Paused'}
                      </span>
                    </span>
                  )}
                  {!collapsed && <ChevronRight size={14} className="text-white/25" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          {!collapsed && <div className="sidebar-section-label">Past Matches</div>}
          <div className="space-y-1">
            {pastMatches.length === 0 && !collapsed && (
              <div className="px-2 py-3 text-xs text-white/30">No completed matches yet</div>
            )}
            {pastMatches.map((match) => {
              const active = currentPage === 'history' && selectedHistoryMatchId === match.id;
              return (
                <button
                  key={match.id}
                  onClick={() => openMatch(match)}
                  className={`sidebar-match ${active ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                  title={formatMatchLabel(matches, match.createdAt, match.matchDate, match.matchNumber)}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-gold-400">
                    <Trophy size={15} />
                  </span>
                  {!collapsed && (
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm text-white/85">{formatMatchLabel(matches, match.createdAt, match.matchDate, match.matchNumber)}</span>
                      <span className="block truncate text-xs text-white/35">{getMatchSubtext(match)}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Group footer */}
      <div className={`border-t border-white/5 px-3 py-3 ${
        collapsed ? 'flex justify-center' : 'space-y-1'
      }`}>
        {!collapsed && currentGroup && (
          <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
            <div className="w-6 h-6 rounded-md bg-gold-500/20 flex items-center justify-center text-gold-400 text-xs font-bold shrink-0">
              {currentGroup.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white/70 truncate">{currentGroup.name}</div>
              <div className="text-[10px] text-white/30">Group</div>
            </div>
          </div>
        )}
        <button
          onClick={groupSignOut}
          className={`sidebar-button text-crimson-400/60 hover:text-crimson-400 hover:bg-crimson-500/10 ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Sign out"
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      <button
        onClick={() => setCollapsed((value) => !value)}
        className="hidden md:flex absolute -right-3 top-20 h-8 w-6 items-center justify-center rounded-r-lg border border-l-0 border-white/10 bg-ink-800 text-white/40 hover:text-white"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
