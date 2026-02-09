import { create } from 'zustand';
import type { EventType, FilterState } from '../types';

interface FilterStore extends FilterState {
  // Actions
  setSearchQuery: (query: string) => void;
  toggleTag: (tagId: string) => void;
  toggleEventType: (type: EventType) => void;
  setDateRange: (start: Date, end: Date) => void;
  clearDateRange: () => void;
  clearAllFilters: () => void;
  setShowCompleted: (show: boolean) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  searchQuery: '',
  selectedTags: [],
  selectedEventTypes: [],
  dateRange: undefined,
  showCompleted: true,
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  toggleTag: (tagId) => set((state) => {
    const isSelected = state.selectedTags.includes(tagId);
    return {
      selectedTags: isSelected
        ? state.selectedTags.filter(id => id !== tagId)
        : [...state.selectedTags, tagId]
    };
  }),
  
  toggleEventType: (type) => set((state) => {
    const isSelected = state.selectedEventTypes.includes(type);
    return {
      selectedEventTypes: isSelected
        ? state.selectedEventTypes.filter(t => t !== type)
        : [...state.selectedEventTypes, type]
    };
  }),
  
  setDateRange: (start, end) => set({ dateRange: { start, end } }),
  
  clearDateRange: () => set({ dateRange: undefined }),
  
  clearAllFilters: () => set({
    searchQuery: '',
    selectedTags: [],
    selectedEventTypes: [],
    dateRange: undefined
  }),
  
  setShowCompleted: (show) => set({ showCompleted: show })
}));
