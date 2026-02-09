import { useEffect } from 'react';
import { Header } from './components/Layout/Header';
import { TimelineCanvas } from './components/Timeline/TimelineCanvas';
import { EventModal } from './components/Events/EventModal';
import { ShortcutsHelp } from './components/Layout/ShortcutsHelp';
import { FilterPanel } from './components/Filters/FilterPanel';
import { StatsPanel } from './components/Stats/StatsPanel';
import { NotificationPanel } from './components/Notifications/NotificationPanel';
import { initializeDefaultTags } from './services/db';
import { createSampleData } from './services/sampleData';
import { useKeyboardShortcuts } from './utils/useKeyboardShortcuts';

function App() {
  // Initialize database on mount
  useEffect(() => {
    const init = async () => {
      await initializeDefaultTags();
      await createSampleData();
    };
    
    init().catch(console.error);
  }, []);

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="w-screen h-screen dot-pattern overflow-hidden">
      <Header />
      
      <main className="w-full h-full pt-16">
        <TimelineCanvas />
      </main>

      <EventModal />
      <ShortcutsHelp />
      <FilterPanel />
      <StatsPanel />
      <NotificationPanel />
    </div>
  );
}

export default App;
