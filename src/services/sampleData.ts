import { createEvent } from './eventService';
import type { TimelineEvent } from '../types';
import { addDays, addHours, addMonths } from 'date-fns';

export const createSampleData = async () => {
  const now = new Date();
  
  // Check if we already have events
  const { db } = await import('./db');
  const existingEvents = await db.events.count();
  
  if (existingEvents > 0) {
    console.log('Sample data already exists');
    return;
  }

  const sampleEvents: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'>[] = [
    // Point events
    {
      title: 'Project kickoff meeting',
      description: 'Initial meeting to discuss project scope and timeline',
      type: 'point',
      startDate: addDays(now, -5),
      tags: ['tag-work'],
    },
    {
      title: 'Doctor appointment',
      description: 'Annual checkup',
      type: 'point',
      startDate: addDays(now, 3),
      tags: ['tag-health'],
    },
    {
      title: 'Coffee with Sarah',
      type: 'point',
      startDate: addHours(now, 2),
      tags: ['tag-social'],
    },
    
    // Duration events
    {
      title: 'Q1 Planning Sprint',
      description: 'Strategic planning for the first quarter',
      type: 'duration',
      startDate: addDays(now, -10),
      endDate: addDays(now, -5),
      tags: ['tag-work'],
    },
    {
      title: 'Beach vacation',
      description: 'Week off at the coast',
      type: 'duration',
      startDate: addDays(now, 15),
      endDate: addDays(now, 22),
      tags: ['tag-personal'],
    },
    {
      title: 'Web development course',
      description: 'Advanced React patterns and best practices',
      type: 'duration',
      startDate: addDays(now, -3),
      endDate: addDays(now, 25),
      tags: ['tag-learning'],
    },
    
    // Milestones
    {
      title: 'Product launch',
      description: 'Version 2.0 release to production',
      type: 'milestone',
      startDate: addDays(now, 30),
      tags: ['tag-work'],
    },
    {
      title: 'Mortgage payment due',
      type: 'milestone',
      startDate: addDays(now, 7),
      tags: ['tag-finance'],
    },
    
    // Recurring events
    {
      title: 'Team standup',
      description: 'Daily sync with the team',
      type: 'recurring',
      startDate: new Date(now.setHours(9, 0, 0, 0)),
      endDate: new Date(now.setHours(9, 30, 0, 0)),
      tags: ['tag-work'],
      recurrence: {
        frequency: 'daily',
        interval: 1,
        endDate: addMonths(now, 3),
      },
    },
    {
      title: 'Gym session',
      description: 'Workout routine',
      type: 'recurring',
      startDate: new Date(now.setHours(18, 0, 0, 0)),
      endDate: new Date(now.setHours(19, 30, 0, 0)),
      tags: ['tag-health'],
      recurrence: {
        frequency: 'weekly',
        interval: 1,
        count: 52, // 1 year
      },
    },
    {
      title: 'Budget review',
      description: 'Monthly financial planning',
      type: 'recurring',
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      tags: ['tag-finance'],
      recurrence: {
        frequency: 'monthly',
        interval: 1,
        count: 12,
      },
    },
    
    // More varied events
    {
      title: 'Client presentation',
      description: 'Quarterly business review with key stakeholders',
      type: 'point',
      startDate: addDays(now, 12),
      tags: ['tag-work'],
    },
    {
      title: 'Birthday party',
      type: 'duration',
      startDate: addDays(now, 20),
      endDate: addDays(now, 20),
      tags: ['tag-social', 'tag-personal'],
    },
    {
      title: 'Tax filing deadline',
      type: 'milestone',
      startDate: new Date(now.getFullYear(), 3, 15), // April 15
      tags: ['tag-finance'],
    },
  ];

  // Create all events
  for (const event of sampleEvents) {
    try {
      await createEvent(event);
    } catch (error) {
      console.error('Error creating sample event:', error);
    }
  }
  
  console.log(`Created ${sampleEvents.length} sample events`);
};
