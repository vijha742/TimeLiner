import { Home, ZoomIn, ZoomOut, Filter, Plus, Download, Upload, Keyboard, X, BarChart3, Bell, Camera } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useTimelineStore } from '../../stores/timelineStore';
import { useUIStore } from '../../stores/uiStore';
import { db } from '../../services/db';
import { notificationService } from '../../services/notificationService';
import type { TimelineExport } from '../../types';

const IconBtn = ({
  onClick,
  title,
  children,
  active,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
}) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 32,
      borderRadius: 6,
      border: 'none',
      background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
      color: active ? '#60a5fa' : 'rgba(255,255,255,0.5)',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
      }
    }}
  >
    {children}
  </button>
);

export const Header = () => {
  const { navigateToToday, zoomIn, zoomOut } = useTimelineStore();
  const { 
    toggleFilterPanel, 
    isFilterPanelOpen, 
    toggleShortcutsHelp, 
    toggleStatsPanel, 
    isStatsPanelOpen, 
    toggleNotificationPanel, 
    isNotificationPanelOpen, 
    isSelectingRegion,
    startRegionSelection,
    cancelRegionSelection,
    openModal 
  } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Initialize notification service
    notificationService.init();

    // Update unread count periodically
    const updateUnread = async () => {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    };

    updateUnread();
    const interval = setInterval(updateUnread, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleExport = async () => {
    try {
      const events = await db.events.toArray();
      const tags = await db.tags.toArray();

      const exportData: TimelineExport = {
        version: '1.0.0',
        exportDate: new Date(),
        events,
        tags
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeline-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export timeline data');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data: TimelineExport = JSON.parse(text);

      if (!data.events || !data.tags) {
        throw new Error('Invalid file format');
      }

      const confirmed = confirm(
        `This will import ${data.events.length} events and ${data.tags.length} tags. Continue?`
      );
      if (!confirmed) return;

      for (const tag of data.tags) {
        const existing = await db.tags.get(tag.id);
        if (!existing) {
          await db.tags.add({ ...tag, createdAt: new Date(tag.createdAt) });
        }
      }

      for (const event of data.events) {
        await db.events.add({
          ...event,
          startDate: new Date(event.startDate),
          endDate: event.endDate ? new Date(event.endDate) : undefined,
          recurrence: event.recurrence
            ? { ...event.recurrence, endDate: event.recurrence.endDate ? new Date(event.recurrence.endDate) : undefined }
            : undefined,
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt),
        });
      }

      alert('Import successful!');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import timeline data. Please check the file format.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const iconSize = { width: 15, height: 15, strokeWidth: 1.8 };

  return (
    <header
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 20,
        paddingRight: 20,
        background: 'linear-gradient(180deg, rgba(5,5,8,0.85) 0%, rgba(5,5,8,0.4) 100%)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        zIndex: 50,
      }}
    >
      {/* Left: Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 5,
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
          }}
        />
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: '-0.02em',
          }}
        >
          Timeline
        </span>
      </div>

      {/* Center: Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '3px',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <IconBtn onClick={zoomOut} title="Zoom out (-)">
          <ZoomOut {...iconSize} />
        </IconBtn>
        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.06)', margin: '0 2px' }} />
        <IconBtn onClick={zoomIn} title="Zoom in (+)">
          <ZoomIn {...iconSize} />
        </IconBtn>
        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.06)', margin: '0 2px' }} />
        <button
          onClick={navigateToToday}
          title="Jump to today (Home)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            borderRadius: 5,
            border: 'none',
            background: 'transparent',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: '0.02em',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
          }}
        >
          <Home style={{ width: 13, height: 13, strokeWidth: 1.8 }} />
          Today
        </button>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Stats button */}
        <IconBtn onClick={toggleStatsPanel} title="Statistics" active={isStatsPanelOpen}>
          <BarChart3 {...iconSize} />
        </IconBtn>

        {/* Notifications button with badge */}
        <div style={{ position: 'relative' }}>
          <IconBtn onClick={toggleNotificationPanel} title="Notifications" active={isNotificationPanelOpen}>
            <Bell {...iconSize} />
          </IconBtn>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -2,
              right: -2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 99,
              background: '#ef4444',
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
              pointerEvents: 'none',
              boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>

        {/* New event -- primary action, stands out */}
        <button
          onClick={() => openModal('create')}
          title="Add new event (N)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 14px',
            borderRadius: 6,
            border: 'none',
            background: '#3b82f6',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: '0.01em',
            boxShadow: '0 2px 10px rgba(59,130,246,0.3)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2563eb';
            e.currentTarget.style.boxShadow = '0 3px 14px rgba(59,130,246,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#3b82f6';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(59,130,246,0.3)';
          }}
        >
          <Plus style={{ width: 14, height: 14, strokeWidth: 2.2 }} />
          New
        </button>

        <div style={{ width: 8 }} />

        <IconBtn 
          onClick={() => {
            if (isSelectingRegion) {
              cancelRegionSelection();
            } else {
              startRegionSelection(0, new Date());
            }
          }} 
          title={isSelectingRegion ? "Cancel selection (Esc)" : "Screenshot region (S)"} 
          active={isSelectingRegion}
        >
          {isSelectingRegion ? <X {...iconSize} /> : <Camera {...iconSize} />}
        </IconBtn>

        <IconBtn onClick={toggleFilterPanel} title="Filters (Ctrl+F)" active={isFilterPanelOpen}>
          {isFilterPanelOpen ? <X {...iconSize} /> : <Filter {...iconSize} />}
        </IconBtn>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
        <IconBtn onClick={() => fileInputRef.current?.click()} title="Import events">
          <Upload {...iconSize} />
        </IconBtn>
        <IconBtn onClick={handleExport} title="Export events">
          <Download {...iconSize} />
        </IconBtn>
        <IconBtn onClick={toggleShortcutsHelp} title="Keyboard shortcuts (?)">
          <Keyboard {...iconSize} />
        </IconBtn>
      </div>
    </header>
  );
};
