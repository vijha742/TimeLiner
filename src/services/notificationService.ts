import { db } from './db';
import type { EventNotification } from '../types';

class NotificationService {
  private checkInterval: number | null = null;
  private isInitialized = false;
  private permission: NotificationPermission = 'default';

  async init() {
    if (this.isInitialized) return;

    // Request notification permission
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      
      if (this.permission === 'granted') {
        // Start checking for upcoming reminders
        this.startChecking();
        this.isInitialized = true;
      }
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    this.permission = await Notification.requestPermission();
    
    if (this.permission === 'granted' && !this.isInitialized) {
      this.startChecking();
      this.isInitialized = true;
    }

    return this.permission;
  }

  getPermission(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  private startChecking() {
    // Check every 30 seconds for reminders
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, 30000);

    // Also check immediately
    this.checkReminders();
  }

  private async checkReminders() {
    try {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      // Get all events with reminders
      const events = await db.events
        .filter(event => 
          !!event.remindAt && 
          event.remindAt >= now && 
          event.remindAt <= fiveMinutesFromNow
        )
        .toArray();

      // Check which notifications we've already shown
      const existingNotifications = await db.notifications.toArray();
      const shownEventIds = new Set(existingNotifications.map(n => n.eventId));

      for (const event of events) {
        if (!shownEventIds.has(event.id)) {
          await this.showNotification(event.id, event.title, event.description);
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  async showNotification(eventId: string, title: string, description?: string) {
    if (this.permission !== 'granted') return;

    try {
      const event = await db.events.get(eventId);
      if (!event) return;

      // Create browser notification
      const notification = new Notification(`⏰ ${title}`, {
        body: description || 'Event reminder',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: eventId,
        requireInteraction: false,
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        // Mark as read
        this.markAsRead(eventId);
      };

      // Store notification in DB
      await this.createNotification({
        eventId,
        title,
        message: description || 'Event reminder',
        time: event.remindAt || new Date(),
        isRead: false,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  async createNotification(data: Omit<EventNotification, 'id'>): Promise<string> {
    const notification: EventNotification = {
      id: crypto.randomUUID(),
      ...data,
    };

    await db.notifications.add(notification);
    return notification.id;
  }

  async markAsRead(eventId: string) {
    const notifications = await db.notifications
      .filter(n => n.eventId === eventId)
      .toArray();

    for (const notification of notifications) {
      await db.notifications.update(notification.id, { isRead: true });
    }
  }

  async markAllAsRead() {
    const notifications = await db.notifications.toArray();
    
    for (const notification of notifications) {
      await db.notifications.update(notification.id, { isRead: true });
    }
  }

  async deleteNotification(id: string) {
    await db.notifications.delete(id);
  }

  async clearAll() {
    await db.notifications.clear();
  }

  async getUnreadCount(): Promise<number> {
    const unread = await db.notifications
      .filter(n => !n.isRead)
      .count();
    return unread;
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isInitialized = false;
  }
}

export const notificationService = new NotificationService();
