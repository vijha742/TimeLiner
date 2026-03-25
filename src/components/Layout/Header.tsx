import { Home, ZoomIn, ZoomOut, Filter, Plus, Download, Upload, Keyboard, X, BarChart3, Bell, Camera, Menu, FileText } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
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
    toggleRegionSelectionMode,
    toggleTemplatePanel,
    isTemplatePanelOpen,
    openModal,
    isMobile,
    setIsMobile
  } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const templateCount = useLiveQuery(async () => db.templates.count(), []);

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

  // Track window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setShowMobileMenu(false);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobile]);

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
    <>
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: isMobile ? 56 : 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: isMobile ? 12 : 20,
          paddingRight: isMobile ? 12 : 20,
          background: 'linear-gradient(180deg, rgba(5,5,8,0.85) 0%, rgba(5,5,8,0.4) 100%)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          zIndex: 50,
        }}
      >
        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10 }}>
          <div
            style={{
              width: isMobile ? 28 : 24,
              height: isMobile ? 28 : 24,
              borderRadius: 5,
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
            }}
          />
          {!isMobile && (
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
          )}
        </div>

        {/* Center: Navigation - Desktop only */}
        {!isMobile && (
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
        )}

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 4 }}>
          {isMobile ? (
            <>
              {/* Mobile: Primary action button */}
              <button
                onClick={() => openModal('create')}
                title="Add new event"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  border: 'none',
                  background: '#3b82f6',
                  color: '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(59,130,246,0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus style={{ width: 18, height: 18, strokeWidth: 2.2 }} />
              </button>

              {/* Mobile: Menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                title="Menu"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  border: 'none',
                  background: showMobileMenu ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)',
                  color: showMobileMenu ? '#60a5fa' : 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {showMobileMenu ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
              </button>
            </>
          ) : (
            <>
              {/* Desktop: All actions */}
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
                onClick={toggleRegionSelectionMode} 
                title={isSelectingRegion ? "Cancel selection (Esc)" : "Screenshot region (S)"} 
                active={isSelectingRegion}
              >
                {isSelectingRegion ? <X {...iconSize} /> : <Camera {...iconSize} />}
              </IconBtn>

              <div style={{ position: 'relative' }}>
                <IconBtn onClick={toggleTemplatePanel} title="Event Templates" active={isTemplatePanelOpen}>
                  <FileText {...iconSize} />
                </IconBtn>
                {(templateCount || 0) > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 14,
                    height: 14,
                    padding: '0 4px',
                    borderRadius: 99,
                    background: '#3b82f6',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 700,
                    pointerEvents: 'none',
                  }}>
                    {templateCount}
                  </span>
                )}
              </div>

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
            </>
          )}
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobile && showMobileMenu && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowMobileMenu(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 99,
              animation: 'fade-in 0.2s ease-out forwards',
            }}
          />

          {/* Menu Panel */}
          <div
            style={{
              position: 'fixed',
              top: 56,
              right: 12,
              width: 'calc(100% - 24px)',
              maxWidth: 320,
              background: 'rgba(18,18,22,0.96)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: 12,
              zIndex: 100,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              animation: 'fade-in 0.2s ease-out forwards',
            }}
          >
            {/* Navigation Section */}
            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 8,
                paddingLeft: 12,
              }}>
                Navigation
              </div>
              <MobileMenuItem onClick={() => { navigateToToday(); setShowMobileMenu(false); }}>
                <Home style={{ width: 16, height: 16 }} />
                <span>Jump to Today</span>
              </MobileMenuItem>
              <MobileMenuItem onClick={() => { zoomIn(); }}>
                <ZoomIn style={{ width: 16, height: 16 }} />
                <span>Zoom In</span>
              </MobileMenuItem>
              <MobileMenuItem onClick={() => { zoomOut(); }}>
                <ZoomOut style={{ width: 16, height: 16 }} />
                <span>Zoom Out</span>
              </MobileMenuItem>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />

            {/* Panels Section */}
            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 8,
                paddingLeft: 12,
              }}>
                View
              </div>
              <MobileMenuItem onClick={() => { toggleStatsPanel(); setShowMobileMenu(false); }} active={isStatsPanelOpen}>
                <BarChart3 style={{ width: 16, height: 16 }} />
                <span>Statistics</span>
              </MobileMenuItem>
              <MobileMenuItem onClick={() => { toggleNotificationPanel(); setShowMobileMenu(false); }} active={isNotificationPanelOpen}>
                <Bell style={{ width: 16, height: 16 }} />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 20,
                    height: 20,
                    padding: '0 6px',
                    borderRadius: 99,
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </MobileMenuItem>
              <MobileMenuItem onClick={() => { toggleFilterPanel(); setShowMobileMenu(false); }} active={isFilterPanelOpen}>
                <Filter style={{ width: 16, height: 16 }} />
                <span>Filters</span>
              </MobileMenuItem>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />

            {/* Tools Section */}
            <div>
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 8,
                paddingLeft: 12,
              }}>
                Tools
              </div>
              <MobileMenuItem 
                onClick={() => {
                  toggleRegionSelectionMode();
                  setShowMobileMenu(false);
                }}
                active={isSelectingRegion}
              >
                <Camera style={{ width: 16, height: 16 }} />
                <span>Screenshot Region</span>
              </MobileMenuItem>
              <MobileMenuItem onClick={() => { toggleTemplatePanel(); setShowMobileMenu(false); }} active={isTemplatePanelOpen}>
                <FileText style={{ width: 16, height: 16 }} />
                <span>Templates</span>
                {(templateCount || 0) > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    minWidth: 20,
                    height: 20,
                    padding: '0 6px',
                    borderRadius: 99,
                    background: '#3b82f6',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {templateCount}
                  </span>
                )}
              </MobileMenuItem>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
              <MobileMenuItem onClick={() => { fileInputRef.current?.click(); setShowMobileMenu(false); }}>
                <Upload style={{ width: 16, height: 16 }} />
                <span>Import Events</span>
              </MobileMenuItem>
              <MobileMenuItem onClick={() => { handleExport(); setShowMobileMenu(false); }}>
                <Download style={{ width: 16, height: 16 }} />
                <span>Export Events</span>
              </MobileMenuItem>
              <MobileMenuItem onClick={() => { toggleShortcutsHelp(); setShowMobileMenu(false); }}>
                <Keyboard style={{ width: 16, height: 16 }} />
                <span>Keyboard Shortcuts</span>
              </MobileMenuItem>
            </div>
          </div>
        </>
      )}
    </>
  );
};

// Mobile menu item component
const MobileMenuItem = ({ 
  onClick, 
  children, 
  active 
}: { 
  onClick: () => void; 
  children: React.ReactNode; 
  active?: boolean;
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      padding: '12px',
      borderRadius: 8,
      border: 'none',
      background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
      color: active ? '#60a5fa' : 'rgba(255,255,255,0.7)',
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 500,
      fontFamily: "'DM Sans', sans-serif",
      textAlign: 'left',
      transition: 'all 0.15s ease',
      minHeight: 44,
    }}
    onMouseDown={(e) => {
      e.currentTarget.style.background = active ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.08)';
    }}
    onMouseUp={(e) => {
      e.currentTarget.style.background = active ? 'rgba(59,130,246,0.12)' : 'transparent';
    }}
  >
    {children}
  </button>
);
