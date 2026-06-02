import { useAppStore } from './store/useAppStore';
import BottomNav from './components/ui/BottomNav';
import Dashboard from './pages/Dashboard';
import PlayerManagement from './pages/PlayerManagement';
import MatchSetup from './pages/MatchSetup';
import LiveMatch from './pages/LiveMatch';
import MatchHistory from './pages/MatchHistory';
import Analytics from './pages/Analytics';

export default function App() {
  const { currentPage } = useAppStore();

  const pages = {
    dashboard: <Dashboard />,
    players: <PlayerManagement />,
    matchSetup: <MatchSetup />,
    liveMatch: <LiveMatch />,
    history: <MatchHistory />,
    analytics: <Analytics />,
  };

  return (
    <div className="min-h-screen bg-ink-950">
      <div key={currentPage} className="page-enter">
        {pages[currentPage]}
      </div>
      <BottomNav />
    </div>
  );
}
