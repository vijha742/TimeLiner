import { db } from './db';
import type { EventTemplate, TimelineEvent, EventType } from '../types';

/**
 * Create a new event template
 */
export async function createTemplate(template: Omit<EventTemplate, 'id' | 'createdAt'>): Promise<string> {
  const newTemplate: EventTemplate = {
    ...template,
    id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
  };

  await db.templates.add(newTemplate);
  return newTemplate.id;
}

/**
 * Update an existing template
 */
export async function updateTemplate(
  id: string,
  updates: Partial<Omit<EventTemplate, 'id' | 'createdAt'>>
): Promise<void> {
  await db.templates.update(id, updates);
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string): Promise<void> {
  await db.templates.delete(id);
}

/**
 * Get all templates
 */
export async function getAllTemplates(): Promise<EventTemplate[]> {
  return await db.templates.toArray();
}

/**
 * Get a single template by ID
 */
export async function getTemplate(id: string): Promise<EventTemplate | undefined> {
  return await db.templates.get(id);
}

/**
 * Apply a template to create a new event
 * @param templateId - ID of the template to apply
 * @param date - Date for the new event (overrides template defaults)
 */
export async function applyTemplate(templateId: string, date: Date): Promise<Partial<TimelineEvent>> {
  const template = await getTemplate(templateId);
  
  if (!template) {
    throw new Error(`Template with ID ${templateId} not found`);
  }

  // Calculate end date for duration events
  const endDate = template.type === 'duration' && template.defaultDuration
    ? new Date(date.getTime() + template.defaultDuration * 60 * 1000)
    : undefined;

  // Return partial event data (without id, createdAt, updatedAt)
  return {
    title: template.name,
    description: template.defaultDescription || '',
    type: template.type,
    startDate: date,
    endDate,
    tags: template.defaultTags,
  };
}

/**
 * Create a template from an existing event
 */
export async function createTemplateFromEvent(
  event: TimelineEvent,
  templateName: string
): Promise<string> {
  // Calculate duration in minutes for duration events
  const defaultDuration = event.endDate
    ? Math.round((event.endDate.getTime() - event.startDate.getTime()) / (60 * 1000))
    : undefined;

  return await createTemplate({
    name: templateName,
    type: event.type,
    defaultDuration,
    defaultTags: event.tags,
    defaultDescription: event.description,
  });
}

/**
 * Get templates by type
 */
export async function getTemplatesByType(type: EventType): Promise<EventTemplate[]> {
  return await db.templates.where('type').equals(type).toArray();
}

/**
 * Get template count
 */
export async function getTemplateCount(): Promise<number> {
  return await db.templates.count();
}
