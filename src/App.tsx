import { useEffect } from 'react';
import { Header } from './components/Layout/Header';
import { TimelineCanvas } from './components/Timeline/TimelineCanvas';
import { EventModal } from './components/Events/EventModal';
import { ShortcutsHelp } from './components/Layout/ShortcutsHelp';
import { FilterPanel } from './components/Filters/FilterPanel';
import { StatsPanel } from './components/Stats/StatsPanel';
import { NotificationPanel } from './components/Notifications/NotificationPanel';
import { ExportImageModal } from './components/Timeline/ExportImageModal';
import { TemplateModal } from './components/Templates/TemplateModal';
import { initializeDefaultTags } from './services/db';
import { createSampleData } from './services/sampleData';
import { useKeyboardShortcuts } from './utils/useKeyboardShortcuts';
import { useUIStore } from './stores/uiStore';

function App() {
  const { isTemplatePanelOpen, toggleTemplatePanel } = useUIStore();
  
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
      <ExportImageModal />
      <TemplateModal isOpen={isTemplatePanelOpen} onClose={toggleTemplatePanel} />
    </div>
  );
}

export default App;
