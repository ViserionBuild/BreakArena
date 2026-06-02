import React from 'react';
import { LayoutDashboard, Users, Trophy, Clock, BarChart2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Page } from '../../types';

const navItems: { page: Page; icon: React.ReactNode; label: string }[] = [
  { page: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
  { page: 'players', icon: <Users size={20} />, label: 'Players' },
  { page: 'liveMatch', icon: <Trophy size={20} />, label: 'Match' },
  { page: 'history', icon: <Clock size={20} />, label: 'History' },
  { page: 'analytics', icon: <BarChart2 size={20} />, label: 'Stats' },
];

export default function BottomNav() {
  const { currentPage, setPage, activeMatchId } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map(({ page, icon, label }) => {
          const isActive = currentPage === page;
          const isMatch = page === 'liveMatch';
          
          return (
            <button
              key={page}
              onClick={() => setPage(page)}
              className={`nav-item relative ${isActive ? 'active' : ''}`}
            >
              {isMatch ? (
                <div className={`relative p-3 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-gold-500 text-ink-950 shadow-lg' 
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
                style={isActive ? { boxShadow: '0 0 20px rgba(251,191,36,0.5)' } : {}}>
                  {icon}
                  {activeMatchId && !isActive && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-jade-400 rounded-full animate-pulse" />
                  )}
                </div>
              ) : (
                <>
                  <div className={`transition-all duration-200 ${isActive ? 'scale-110' : ''}`}>
                    {icon}
                  </div>
                  <span className="text-[10px] font-medium">{label}</span>
                  {isActive && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold-400 rounded-full" />
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
