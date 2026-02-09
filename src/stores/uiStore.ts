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
  startRegionSelection: (x: number, date: Date) => void;
  updateRegionSelection: (x: number, date: Date) => void;
  endRegionSelection: () => void;
  cancelRegionSelection: () => void;
  
  // Sidebar/Panel states
  isFilterPanelOpen: boolean;
  isStatsPanelOpen: boolean;
  isNotificationPanelOpen: boolean;
  toggleFilterPanel: () => void;
  toggleStatsPanel: () => void;
  toggleNotificationPanel: () => void;
  
  // Keyboard shortcuts help
  showShortcutsHelp: boolean;
  toggleShortcutsHelp: () => void;
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
  
  startRegionSelection: (x, date) => 
    set({ isSelectingRegion: true, regionStart: { x, date }, regionEnd: null }),
  
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
  
  toggleFilterPanel: () => 
    set((state) => ({ isFilterPanelOpen: !state.isFilterPanelOpen })),
  
  toggleStatsPanel: () => 
    set((state) => ({ isStatsPanelOpen: !state.isStatsPanelOpen })),
  
  toggleNotificationPanel: () =>
    set((state) => ({ isNotificationPanelOpen: !state.isNotificationPanelOpen })),
  
  // Shortcuts help
  showShortcutsHelp: false,
  
  toggleShortcutsHelp: () => 
    set((state) => ({ showShortcutsHelp: !state.showShortcutsHelp }))
}));
