import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Bell, BellOff, Check, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '../../services/db';
import { notificationService } from '../../services/notificationService';
import { useUIStore } from '../../stores/uiStore';

export const NotificationPanel = () => {
  const { isNotificationPanelOpen, toggleNotificationPanel } = useUIStore();
  const [permission, setPermission] = useState<NotificationPermission>(
    notificationService.getPermission()
  );

  const notifications = useLiveQuery(() => 
    db.notifications.orderBy('time').reverse().toArray(),
    []
  );

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  useEffect(() => {
    // Initialize notification service
    if (permission === 'granted') {
      notificationService.init();
    }
  }, [permission]);

  const handleRequestPermission = async () => {
    const result = await notificationService.requestPermission();
    setPermission(result);
  };

  const handleMarkAsRead = async (id: string) => {
    const notification = notifications?.find(n => n.id === id);
    if (notification) {
      await db.notifications.update(id, { isRead: true });
    }
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
  };

  const handleDelete = async (id: string) => {
    await notificationService.deleteNotification(id);
  };

  const handleClearAll = async () => {
    if (confirm('Clear all notifications?')) {
      await notificationService.clearAll();
    }
  };

  if (!isNotificationPanelOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 380,
        height: '100vh',
        background: 'rgba(12,12,16,0.97)',
        backdropFilter: 'blur(16px)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slide-in-right 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell style={{ width: 18, height: 18, color: '#3b82f6' }} />
          <span style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.01em',
          }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span style={{
              padding: '2px 7px',
              borderRadius: 99,
              background: '#3b82f6',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={toggleNotificationPanel}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 6,
            border: 'none',
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
          }}
        >
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Permission Request */}
      {permission !== 'granted' && (
        <div style={{
          margin: '16px 20px',
          padding: 16,
          borderRadius: 8,
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertCircle style={{ width: 18, height: 18, color: '#3b82f6', marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#60a5fa',
                marginBottom: 6,
              }}>
                {permission === 'denied' 
                  ? 'Notifications Blocked' 
                  : 'Enable Notifications'}
              </p>
              <p style={{
                fontSize: 11,
                color: 'rgba(96,165,250,0.8)',
                lineHeight: 1.5,
                marginBottom: 10,
              }}>
                {permission === 'denied'
                  ? 'You\'ve blocked notifications. Please enable them in your browser settings.'
                  : 'Get notified about upcoming events. We\'ll ask for permission to show browser notifications.'}
              </p>
              {permission !== 'denied' && (
                <button
                  onClick={handleRequestPermission}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#3b82f6',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
                  onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
                >
                  Enable Notifications
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {notifications && notifications.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 8,
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}>
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
              color: unreadCount > 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
              fontSize: 11,
              fontWeight: 600,
              cursor: unreadCount > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              if (unreadCount > 0) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={e => {
              if (unreadCount > 0) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
              }
            }}
          >
            <Check style={{ width: 12, height: 12 }} />
            Mark all read
          </button>
          <button
            onClick={handleClearAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
              e.currentTarget.style.color = '#f87171';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            <Trash2 style={{ width: 12, height: 12 }} />
            Clear all
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px',
      }}>
        {!notifications || notifications.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            padding: '40px 20px',
          }}>
            <BellOff style={{ width: 40, height: 40, color: 'rgba(255,255,255,0.15)', marginBottom: 16 }} />
            <p style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.4)',
              marginBottom: 6,
            }}>
              No notifications
            </p>
            <p style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.25)',
              lineHeight: 1.5,
            }}>
              You'll see reminders for your events here
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: notification.isRead 
                    ? 'rgba(255,255,255,0.02)' 
                    : 'rgba(59,130,246,0.06)',
                  border: notification.isRead
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid rgba(59,130,246,0.15)',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
                onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                onMouseEnter={e => {
                  e.currentTarget.style.background = notification.isRead
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(59,130,246,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = notification.isRead
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(59,130,246,0.06)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: notification.isRead ? 'rgba(255,255,255,0.6)' : '#fff',
                    flex: 1,
                    marginRight: 8,
                  }}>
                    {notification.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      border: 'none',
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                      e.currentTarget.style.color = '#f87171';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
                    }}
                  >
                    <X style={{ width: 12, height: 12 }} />
                  </button>
                </div>
                <p style={{
                  fontSize: 11,
                  color: notification.isRead ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.5)',
                  lineHeight: 1.4,
                  marginBottom: 6,
                }}>
                  {notification.message}
                </p>
                <div style={{
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'rgba(255,255,255,0.25)',
                }}>
                  {format(notification.time, 'MMM d, yyyy • h:mm a')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
