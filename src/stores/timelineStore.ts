import { create } from 'zustand';
import type { ZoomLevel } from '../types';
import { ZOOM_LEVELS, getZoomIndex, zoomIn as zoomInUtil, zoomOut as zoomOutUtil } from '../utils/zoomLevels';

interface TimelineStore {
  currentDate: Date;
  zoomLevel: ZoomLevel;
  zoomIndex: number;
  viewportWidth: number;
  viewportHeight: number;
  scrollOffset: number;
  
  // Actions
  setCurrentDate: (date: Date) => void;
  setViewportSize: (width: number, height: number) => void;
  setScrollOffset: (offset: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoomLevel: (level: ZoomLevel) => void;
  navigateToToday: () => void;
  moveTimeBy: (milliseconds: number) => void;
}

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  currentDate: new Date(),
  zoomLevel: 'month',
  zoomIndex: 4, // month is at index 4
  viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1920,
  viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 1080,
  scrollOffset: 0,
  
  setCurrentDate: (date) => set({ currentDate: date }),
  
  setViewportSize: (width, height) => set({ viewportWidth: width, viewportHeight: height }),
  
  setScrollOffset: (offset) => set({ scrollOffset: offset }),
  
  zoomIn: () => {
    const { zoomIndex } = get();
    const newIndex = zoomInUtil(zoomIndex);
    if (newIndex !== zoomIndex) {
      set({
        zoomIndex: newIndex,
        zoomLevel: ZOOM_LEVELS[newIndex].name
      });
    }
  },
  
  zoomOut: () => {
    const { zoomIndex } = get();
    const newIndex = zoomOutUtil(zoomIndex);
    if (newIndex !== zoomIndex) {
      set({
        zoomIndex: newIndex,
        zoomLevel: ZOOM_LEVELS[newIndex].name
      });
    }
  },
  
  setZoomLevel: (level) => {
    const index = getZoomIndex(level);
    set({
      zoomLevel: level,
      zoomIndex: index
    });
  },
  
  navigateToToday: () => set({ currentDate: new Date() }),
  
  moveTimeBy: (milliseconds) => {
    const { currentDate } = get();
    set({ currentDate: new Date(currentDate.getTime() + milliseconds) });
  }
}));
