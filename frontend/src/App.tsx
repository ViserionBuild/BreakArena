import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import AppSidebar from './components/ui/AppSidebar';
import GroupAuth from './pages/GroupAuth';
import Dashboard from './pages/Dashboard';
import PlayerManagement from './pages/PlayerManagement';
import MatchSetup from './pages/MatchSetup';
import LiveMatch from './pages/LiveMatch';
import MatchHistory from './pages/MatchHistory';
import Analytics from './pages/Analytics';

export default function App() {
  const { currentPage, currentGroup, groupToken, initialize, isLoading, error, clearError } = useAppStore();

  // On mount: if we have a persisted token, restore data.
  // If the token is invalid the API will fail gracefully.
  useEffect(() => {
    if (currentGroup && groupToken) {
      initialize();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Not authenticated → full-screen auth gate
  if (!currentGroup || !groupToken || currentPage === 'groupAuth') {
    return <GroupAuth />;
  }

  const pages = {
    dashboard:  <Dashboard />,
    players:    <PlayerManagement />,
    matchSetup: <MatchSetup />,
    liveMatch:  <LiveMatch />,
    history:    <MatchHistory />,
    analytics:  <Analytics />,
  } as Record<string, JSX.Element>;

  return (
    <div className="app-shell bg-ink-950">
      <AppSidebar />
      <main className="app-main">
        {isLoading ? (
          <div className="page-container flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3 animate-pulse">♠</div>
              <div className="text-white/40 text-sm">Loading from server...</div>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="fixed top-4 right-4 z-50 max-w-sm glass-card rounded-xl px-4 py-3 flex items-start gap-3 border border-crimson-500/30">
                <div className="flex-1 text-sm text-crimson-300">{error}</div>
                <button
                  onClick={clearError}
                  className="text-white/40 hover:text-white text-xs shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}
            <div key={currentPage} className="page-enter min-h-screen">
              {pages[currentPage] ?? <Dashboard />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
