import { format, startOfHour, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

// Format dates based on zoom level
export const formatDateForZoom = (date: Date, tickInterval: string): string => {
  switch (tickInterval) {
    case 'hour':
      return format(date, 'HH:mm');
    case '6hours':
      return format(date, 'HH:mm');
    case 'day':
      return format(date, 'MMM d');
    case 'week':
      return format(date, 'MMM d');
    case 'month':
      return format(date, 'MMM yyyy');
    case '6months':
      return format(date, 'MMM yyyy');
    case 'year':
      return format(date, 'yyyy');
    default:
      return format(date, 'MMM d, yyyy');
  }
};

// Get next tick date based on interval
export const getNextTick = (date: Date, tickInterval: string): Date => {
  const d = new Date(date);
  
  switch (tickInterval) {
    case 'hour':
      d.setHours(d.getHours() + 1);
      return startOfHour(d);
    case '6hours':
      d.setHours(d.getHours() + 6);
      return startOfHour(d);
    case 'day':
      d.setDate(d.getDate() + 1);
      return startOfDay(d);
    case 'week':
      d.setDate(d.getDate() + 7);
      return startOfWeek(d);
    case 'month':
      d.setMonth(d.getMonth() + 1);
      return startOfMonth(d);
    case '6months':
      d.setMonth(d.getMonth() + 6);
      return startOfMonth(d);
    case 'year':
      d.setFullYear(d.getFullYear() + 1);
      return startOfYear(d);
    default:
      return d;
  }
};

// Round date to nearest interval
export const roundToInterval = (date: Date, tickInterval: string): Date => {
  switch (tickInterval) {
    case 'hour':
    case '6hours':
      return startOfHour(date);
    case 'day':
    case 'week':
      return startOfDay(date);
    case 'month':
    case '6months':
      return startOfMonth(date);
    case 'year':
      return startOfYear(date);
    default:
      return date;
  }
};

// Check if two dates are on the same day
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Get date range string
export const getDateRangeString = (start: Date, end: Date): string => {
  if (isSameDay(start, end)) {
    return format(start, 'MMM d, yyyy');
  }
  
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }
  
  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
};
