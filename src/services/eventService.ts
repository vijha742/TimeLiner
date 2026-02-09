import { db } from './db';
import type { TimelineEvent, EventInstance } from '../types';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

// Create a new event
export const createEvent = async (event: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const now = new Date();
  const newEvent: TimelineEvent = {
    ...event,
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now
  };
  
  await db.events.add(newEvent);
  return newEvent.id;
};

// Update an event
export const updateEvent = async (id: string, updates: Partial<TimelineEvent>): Promise<void> => {
  await db.events.update(id, {
    ...updates,
    updatedAt: new Date()
  });
};

// Delete an event
export const deleteEvent = async (id: string): Promise<void> => {
  await db.events.delete(id);
};

// Get all events
export const getAllEvents = async (): Promise<TimelineEvent[]> => {
  return await db.events.toArray();
};

// Get events in date range
export const getEventsInRange = async (start: Date, end: Date): Promise<TimelineEvent[]> => {
  return await db.events
    .where('startDate')
    .between(start, end, true, true)
    .toArray();
};

// Generate instances for recurring events
export const generateRecurringInstances = (
  event: TimelineEvent,
  rangeStart: Date,
  rangeEnd: Date
): EventInstance[] => {
  if (!event.recurrence) return [];
  
  const instances: EventInstance[] = [];
  const { frequency, interval, endDate, count } = event.recurrence;
  
  let currentDate = new Date(event.startDate);
  let instanceCount = 0;
  
  const maxIterations = count || 1000; // Safety limit
  
  while (instanceCount < maxIterations) {
    // Check if we've exceeded the recurrence end date
    if (endDate && currentDate > endDate) break;
    
    // Check if we've exceeded the count
    if (count && instanceCount >= count) break;
    
    // Check if this instance is in the visible range
    if (currentDate >= rangeStart && currentDate <= rangeEnd) {
      const duration = event.endDate 
        ? event.endDate.getTime() - event.startDate.getTime()
        : 0;
      
      instances.push({
        ...event,
        id: `${event.id}-instance-${instanceCount}`,
        originalEventId: event.id,
        instanceDate: new Date(currentDate),
        startDate: new Date(currentDate),
        endDate: duration > 0 ? new Date(currentDate.getTime() + duration) : undefined
      });
    }
    
    // Move to next instance
    switch (frequency) {
      case 'daily':
        currentDate = addDays(currentDate, interval);
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, interval);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, interval);
        break;
      case 'yearly':
        currentDate = addYears(currentDate, interval);
        break;
    }
    
    instanceCount++;
    
    // Stop if we're way past the range (optimization)
    if (currentDate > rangeEnd) break;
  }
  
  return instances;
};

// Get all event instances (including recurring) in a date range
export const getAllEventInstances = async (
  rangeStart: Date,
  rangeEnd: Date
): Promise<EventInstance[]> => {
  const allEvents = await db.events.toArray();
  const instances: EventInstance[] = [];
  
  for (const event of allEvents) {
    if (event.recurrence) {
      // Generate instances for recurring events
      const recurringInstances = generateRecurringInstances(event, rangeStart, rangeEnd);
      instances.push(...recurringInstances);
    } else {
      // Check if non-recurring event is in range
      const eventStart = event.startDate;
      const eventEnd = event.endDate || eventStart;
      
      if (eventStart <= rangeEnd && eventEnd >= rangeStart) {
        instances.push({
          ...event,
          instanceDate: event.startDate
        });
      }
    }
  }
  
  return instances.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
};

// Search events
export const searchEvents = async (query: string): Promise<TimelineEvent[]> => {
  const lowerQuery = query.toLowerCase();
  const allEvents = await db.events.toArray();
  
  return allEvents.filter(event => 
    event.title.toLowerCase().includes(lowerQuery) ||
    (event.description && event.description.toLowerCase().includes(lowerQuery))
  );
};
