import type { ZoomConfig, ZoomLevel } from '../types';

// Zoom level configurations
export const ZOOM_LEVELS: ZoomConfig[] = [
  {
    name: 'decade',
    scale: 0.000001, // ~3.5 years visible on 1920px screen
    tickInterval: 'year',
    minDuration: 365 * 24 * 60 * 60 * 1000 // 1 year
  },
  {
    name: 'multi-year',
    scale: 0.000003, // ~2 years visible
    tickInterval: '6months',
    minDuration: 30 * 24 * 60 * 60 * 1000 // 1 month
  },
  {
    name: 'year',
    scale: 0.00001, // ~7 months visible
    tickInterval: 'month',
    minDuration: 7 * 24 * 60 * 60 * 1000 // 1 week
  },
  {
    name: 'quarter',
    scale: 0.00004, // ~2 months visible
    tickInterval: 'week',
    minDuration: 24 * 60 * 60 * 1000 // 1 day
  },
  {
    name: 'month',
    scale: 0.00012, // ~3 weeks visible
    tickInterval: 'day',
    minDuration: 12 * 60 * 60 * 1000 // 12 hours
  },
  {
    name: 'week',
    scale: 0.0005, // ~4 days visible
    tickInterval: 'day',
    minDuration: 60 * 60 * 1000 // 1 hour
  },
  {
    name: 'day',
    scale: 0.003, // ~15 hours visible
    tickInterval: 'hour',
    minDuration: 15 * 60 * 1000 // 15 minutes
  },
];

export const getZoomConfig = (level: ZoomLevel): ZoomConfig => {
  return ZOOM_LEVELS.find(z => z.name === level) || ZOOM_LEVELS[3]; // default to quarter
};

export const getZoomIndex = (level: ZoomLevel): number => {
  return ZOOM_LEVELS.findIndex(z => z.name === level);
};

export const zoomIn = (currentIndex: number): number => {
  return Math.min(currentIndex + 1, ZOOM_LEVELS.length - 1);
};

export const zoomOut = (currentIndex: number): number => {
  return Math.max(currentIndex - 1, 0);
};

// Calculate pixel position from date
export const dateToPixels = (date: Date, centerDate: Date, scale: number): number => {
  const timeDiff = date.getTime() - centerDate.getTime();
  return timeDiff * scale;
};

// Calculate date from pixel position
export const pixelsToDate = (pixels: number, centerDate: Date, scale: number): Date => {
  const timeDiff = pixels / scale;
  return new Date(centerDate.getTime() + timeDiff);
};

// Get visible date range based on viewport
export const getVisibleDateRange = (
  centerDate: Date,
  viewportWidth: number,
  scale: number
): { start: Date; end: Date } => {
  const halfViewportMs = (viewportWidth / 2) / scale;
  return {
    start: new Date(centerDate.getTime() - halfViewportMs),
    end: new Date(centerDate.getTime() + halfViewportMs)
  };
};
