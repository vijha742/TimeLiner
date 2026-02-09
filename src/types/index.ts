// Event types
export type EventType = 'point' | 'duration' | 'milestone' | 'recurring';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // e.g., every 2 weeks
  endDate?: Date;
  count?: number; // number of occurrences
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  startDate: Date;
  endDate?: Date; // for duration events
  tags: string[]; // array of tag IDs
  color?: string; // override tag color if needed
  recurrence?: RecurrenceRule;
  remindAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// For displaying recurring event instances
export interface EventInstance extends Omit<TimelineEvent, 'recurrence'> {
  originalEventId?: string; // reference to parent recurring event
  instanceDate: Date; // specific occurrence date
}

// Zoom levels
export type ZoomLevel = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year' | 'multi-year' | 'decade';

export interface ZoomConfig {
  name: ZoomLevel;
  scale: number; // pixels per millisecond
  tickInterval: 'hour' | '6hours' | 'day' | 'week' | 'month' | '6months' | 'year';
  minDuration: number; // minimum duration in ms to show at this zoom
}

// Timeline state
export interface TimelineState {
  currentDate: Date; // center point of the timeline
  zoomLevel: ZoomLevel;
  zoomIndex: number; // index in ZOOM_LEVELS array
  viewportWidth: number;
  viewportHeight: number;
  scrollOffset: number; // horizontal scroll position
}

// Filter state
export interface FilterState {
  searchQuery: string;
  selectedTags: string[]; // tag IDs
  selectedEventTypes: EventType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  showCompleted: boolean;
}

// Region selection (for screenshots/export)
export interface RegionSelection {
  startDate: Date;
  endDate: Date;
  startX: number;
  endX: number;
  isSelecting: boolean;
}

// Event template
export interface EventTemplate {
  id: string;
  name: string;
  type: EventType;
  defaultDuration?: number; // in minutes
  defaultTags: string[];
  defaultDescription?: string;
  createdAt: Date;
}

// Statistics
export interface EventStatistics {
  totalEvents: number;
  byType: Record<EventType, number>;
  byTag: Record<string, number>;
  upcomingCount: number;
  completedCount: number;
}

// Export/Import formats
export interface TimelineExport {
  version: string;
  exportDate: Date;
  events: TimelineEvent[];
  tags: Tag[];
  templates?: EventTemplate[];
}

// Notification
export interface EventNotification {
  id: string;
  eventId: string;
  title: string;
  message: string;
  time: Date;
  isRead: boolean;
}

// Modal states
export type ModalType = 'create' | 'edit' | 'view' | null;

export interface ModalState {
  type: ModalType;
  eventId?: string;
  initialDate?: Date;
  isOpen: boolean;
}

// Recurring event edit mode
export type RecurringEditMode = 'this' | 'thisAndFuture' | 'all';
