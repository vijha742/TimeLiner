import Dexie, { type Table } from 'dexie';
import type { TimelineEvent, Tag, EventTemplate, EventNotification } from '../types';

export class TimelineDatabase extends Dexie {
  events!: Table<TimelineEvent, string>;
  tags!: Table<Tag, string>;
  templates!: Table<EventTemplate, string>;
  notifications!: Table<EventNotification, string>;

  constructor() {
    super('TimelineDB');
    
    this.version(1).stores({
      events: 'id, startDate, endDate, type, *tags, createdAt, updatedAt',
      tags: 'id, name, createdAt',
      templates: 'id, name, type, createdAt',
      notifications: 'id, eventId, time, isRead'
    });
  }
}

export const db = new TimelineDatabase();

// Initialize default tags on first load
export const initializeDefaultTags = async () => {
  const existingTags = await db.tags.count();
  
  if (existingTags === 0) {
    const defaultTags: Tag[] = [
      {
        id: 'tag-work',
        name: 'Work',
        color: '#6366f1', // Indigo
        createdAt: new Date()
      },
      {
        id: 'tag-personal',
        name: 'Personal',
        color: '#8b5cf6', // Purple
        createdAt: new Date()
      },
      {
        id: 'tag-health',
        name: 'Health',
        color: '#10b981', // Green
        createdAt: new Date()
      },
      {
        id: 'tag-finance',
        name: 'Finance',
        color: '#f59e0b', // Amber
        createdAt: new Date()
      },
      {
        id: 'tag-social',
        name: 'Social',
        color: '#ec4899', // Pink
        createdAt: new Date()
      },
      {
        id: 'tag-learning',
        name: 'Learning',
        color: '#3b82f6', // Blue
        createdAt: new Date()
      }
    ];

    await db.tags.bulkAdd(defaultTags);
    console.log('Default tags initialized');
  }
};
