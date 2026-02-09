import type { EventInstance, FilterState } from '../types';

/**
 * Apply filters to event instances
 */
export const applyFilters = (
  events: EventInstance[],
  filters: FilterState
): EventInstance[] => {
  let filtered = [...events];

  // Filter by search query
  if (filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(event =>
      event.title.toLowerCase().includes(query) ||
      (event.description && event.description.toLowerCase().includes(query))
    );
  }

  // Filter by event types
  if (filters.selectedEventTypes.length > 0) {
    filtered = filtered.filter(event =>
      filters.selectedEventTypes.includes(event.type)
    );
  }

  // Filter by tags
  if (filters.selectedTags.length > 0) {
    filtered = filtered.filter(event =>
      event.tags.some(tagId => filters.selectedTags.includes(tagId))
    );
  }

  // Filter by date range
  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    filtered = filtered.filter(event => {
      const eventStart = event.startDate;
      const eventEnd = event.endDate || eventStart;
      
      // Event overlaps with filter range if:
      // event start is before filter end AND event end is after filter start
      return eventStart <= end && eventEnd >= start;
    });
  }

  return filtered;
};

/**
 * Check if any filters are active
 */
export const hasActiveFilters = (filters: FilterState): boolean => {
  return !!(
    filters.searchQuery.trim() ||
    filters.selectedEventTypes.length > 0 ||
    filters.selectedTags.length > 0 ||
    filters.dateRange
  );
};

/**
 * Get filter summary text
 */
export const getFilterSummary = (filters: FilterState): string => {
  const parts: string[] = [];

  if (filters.searchQuery.trim()) {
    parts.push(`"${filters.searchQuery}"`);
  }

  if (filters.selectedEventTypes.length > 0) {
    parts.push(`${filters.selectedEventTypes.length} type${filters.selectedEventTypes.length !== 1 ? 's' : ''}`);
  }

  if (filters.selectedTags.length > 0) {
    parts.push(`${filters.selectedTags.length} tag${filters.selectedTags.length !== 1 ? 's' : ''}`);
  }

  if (filters.dateRange) {
    parts.push('date range');
  }

  return parts.join(', ');
};
