import { create } from 'zustand';
import type { ModalType, ModalState } from '../types';

interface UIStore extends ModalState {
  // Modal actions
  openModal: (type: ModalType, eventId?: string, initialDate?: Date) => void;
  closeModal: () => void;
  
  // Region selection for screenshots/export
  isSelectingRegion: boolean;
  regionStart: { x: number; date: Date } | null;
  regionEnd: { x: number; date: Date } | null;
  toggleRegionSelectionMode: () => void;
  startRegionSelection: (x: number, date: Date) => void;
  updateRegionSelection: (x: number, date: Date) => void;
  endRegionSelection: () => void;
  cancelRegionSelection: () => void;
  
  // Sidebar/Panel states
  isFilterPanelOpen: boolean;
  isStatsPanelOpen: boolean;
  isNotificationPanelOpen: boolean;
  isTemplatePanelOpen: boolean;
  toggleFilterPanel: () => void;
  toggleStatsPanel: () => void;
  toggleNotificationPanel: () => void;
  toggleTemplatePanel: () => void;
  
  // Keyboard shortcuts help
  showShortcutsHelp: boolean;
  toggleShortcutsHelp: () => void;
  
  // Mobile detection
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Modal state
  type: null,
  eventId: undefined,
  initialDate: undefined,
  isOpen: false,
  
  openModal: (type, eventId, initialDate) => 
    set({ type, eventId, initialDate, isOpen: true }),
  
  closeModal: () => 
    set({ type: null, eventId: undefined, initialDate: undefined, isOpen: false }),
  
  // Region selection
  isSelectingRegion: false,
  regionStart: null,
  regionEnd: null,
  
  toggleRegionSelectionMode: () =>
    set((state) => ({
      isSelectingRegion: !state.isSelectingRegion,
      regionStart: null,
      regionEnd: null,
    })),
  
  startRegionSelection: (x, date) => 
    set({ regionStart: { x, date }, regionEnd: null }),
  
  updateRegionSelection: (x, date) => 
    set({ regionEnd: { x, date } }),
  
  endRegionSelection: () => 
    set({ isSelectingRegion: false }),
  
  cancelRegionSelection: () => 
    set({ isSelectingRegion: false, regionStart: null, regionEnd: null }),
  
  // Panels
  isFilterPanelOpen: false,
  isStatsPanelOpen: false,
  isNotificationPanelOpen: false,
  isTemplatePanelOpen: false,
  
  toggleFilterPanel: () => 
    set((state) => ({ isFilterPanelOpen: !state.isFilterPanelOpen })),
  
  toggleStatsPanel: () => 
    set((state) => ({ isStatsPanelOpen: !state.isStatsPanelOpen })),
  
  toggleNotificationPanel: () =>
    set((state) => ({ isNotificationPanelOpen: !state.isNotificationPanelOpen })),
  
  toggleTemplatePanel: () =>
    set((state) => ({ isTemplatePanelOpen: !state.isTemplatePanelOpen })),
  
  // Shortcuts help
  showShortcutsHelp: false,
  
  toggleShortcutsHelp: () => 
    set((state) => ({ showShortcutsHelp: !state.showShortcutsHelp })),
  
  // Mobile detection
  isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  
  setIsMobile: (isMobile) =>
    set({ isMobile })
}));
