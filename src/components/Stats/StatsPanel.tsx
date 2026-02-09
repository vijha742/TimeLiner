import { useState, useEffect } from 'react';
import { X, BarChart3, Calendar, Tag as TagIcon, TrendingUp, Clock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useUIStore } from '../../stores/uiStore';
import { db } from '../../services/db';
import { isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import type { EventType } from '../../types';

export const StatsPanel = () => {
  const { isStatsPanelOpen, toggleStatsPanel } = useUIStore();

  const events = useLiveQuery(() => db.events.toArray(), []);
  const tags = useLiveQuery(() => db.tags.toArray(), []);

  const [stats, setStats] = useState<{
    total: number;
    byType: Record<EventType, number>;
    byTag: Record<string, number>;
    upcoming: number;
    past: number;
    today: number;
  }>({
    total: 0,
    byType: { point: 0, duration: 0, milestone: 0, recurring: 0 },
    byTag: {},
    upcoming: 0,
    past: 0,
    today: 0,
  });

  useEffect(() => {
    if (!events) return;

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const byType: Record<EventType, number> = { point: 0, duration: 0, milestone: 0, recurring: 0 };
    const byTag: Record<string, number> = {};

    let upcoming = 0;
    let past = 0;
    let today = 0;

    events.forEach((event) => {
      // Count by type
      byType[event.type]++;

      // Count by tag
      event.tags.forEach((tagId) => {
        byTag[tagId] = (byTag[tagId] || 0) + 1;
      });

      // Count by time relative to now
      const eventStart = event.startDate;
      const eventEnd = event.endDate || eventStart;

      if (isAfter(eventStart, todayEnd)) {
        upcoming++;
      } else if (isBefore(eventEnd, todayStart)) {
        past++;
      } else {
        today++;
      }
    });

    setStats({
      total: events.length,
      byType,
      byTag,
      upcoming,
      past,
      today,
    });
  }, [events]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isStatsPanelOpen) toggleStatsPanel();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isStatsPanelOpen, toggleStatsPanel]);

  if (!isStatsPanelOpen) return null;

  const typeIcons = {
    point: '📍',
    duration: '⏱️',
    milestone: '🎯',
    recurring: '🔄',
  };

  const typeLabels = {
    point: 'Point Events',
    duration: 'Duration Events',
    milestone: 'Milestones',
    recurring: 'Recurring Events',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={toggleStatsPanel}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(6px)',
          zIndex: 40,
          animation: 'fade-in 0.15s ease-out',
        }}
      />

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100%',
          width: 340,
          background: 'rgba(12,12,16,0.96)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          zIndex: 50,
          overflowY: 'auto',
          animation: 'slide-in-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            padding: '18px 20px',
            background: 'rgba(12,12,16,0.98)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BarChart3 style={{ width: 18, height: 18, color: '#60a5fa' }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
                Statistics
              </span>
            </div>
            <button
              onClick={toggleStatsPanel}
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
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.05))',
                border: '1px solid rgba(59,130,246,0.2)',
              }}
            >
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 6 }}>
                TOTAL EVENTS
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#60a5fa' }}>
                {stats.total}
              </div>
            </div>

            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))',
                border: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 6 }}>
                UPCOMING
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>
                {stats.upcoming}
              </div>
            </div>
          </div>

          {/* Timeline Status */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 12,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              <Clock style={{ width: 13, height: 13 }} />
              Timeline Status
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Today</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fbbf24' }}>{stats.today}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Past</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{stats.past}</span>
              </div>
            </div>
          </div>

          {/* By Type */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 12,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              <Calendar style={{ width: 13, height: 13 }} />
              By Event Type
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(Object.keys(stats.byType) as EventType[]).map((type) => (
                <div
                  key={type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{typeIcons[type]}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                      {typeLabels[type]}
                    </span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                    {stats.byType[type]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* By Tag */}
          {tags && tags.length > 0 && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                marginBottom: 12,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                <TagIcon style={{ width: 13, height: 13 }} />
                By Tag
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {tags
                  .filter((tag) => stats.byTag[tag.id] > 0)
                  .sort((a, b) => (stats.byTag[b.id] || 0) - (stats.byTag[a.id] || 0))
                  .map((tag) => (
                    <div
                      key={tag.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 6,
                        background: 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: tag.color,
                            boxShadow: `0 0 0 2px ${tag.color}30`,
                          }}
                        />
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                          {tag.name}
                        </span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                        {stats.byTag[tag.id] || 0}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {stats.total === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <TrendingUp style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.2)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                No events yet. Create your first event to see statistics.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
