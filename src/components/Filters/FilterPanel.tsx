import { useState, useEffect } from 'react';
import { X, Search, Calendar, Tag as TagIcon, Filter as FilterIcon } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useFilterStore } from '../../stores/filterStore';
import { useUIStore } from '../../stores/uiStore';
import { db } from '../../services/db';
import type { EventType } from '../../types';

const EVENT_TYPE_LABELS: Record<EventType, { label: string; icon: string }> = {
  point: { label: 'Point Events', icon: '📍' },
  duration: { label: 'Duration Events', icon: '⏱️' },
  milestone: { label: 'Milestones', icon: '🎯' },
  recurring: { label: 'Recurring Events', icon: '🔄' }
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: '#fff',
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
};

export const FilterPanel = () => {
  const { isFilterPanelOpen, toggleFilterPanel } = useUIStore();
  const {
    searchQuery,
    selectedTags,
    selectedEventTypes,
    dateRange,
    setSearchQuery,
    toggleTag,
    toggleEventType,
    setDateRange,
    clearDateRange,
    clearAllFilters
  } = useFilterStore();

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [startDate, setStartDate] = useState<string>(
    dateRange?.start ? dateRange.start.toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState<string>(
    dateRange?.end ? dateRange.end.toISOString().split('T')[0] : ''
  );

  const tags = useLiveQuery(() => db.tags.toArray(), []);

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput, setSearchQuery]);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      if (start <= end) setDateRange(start, end);
    }
  }, [startDate, endDate, setDateRange]);

  const handleClearDateRange = () => {
    setStartDate('');
    setEndDate('');
    clearDateRange();
  };

  const handleClearAll = () => {
    setSearchInput('');
    setStartDate('');
    setEndDate('');
    clearAllFilters();
  };

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    selectedTags.length +
    selectedEventTypes.length +
    (dateRange ? 1 : 0);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFilterPanelOpen) toggleFilterPanel();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFilterPanelOpen, toggleFilterPanel]);

  if (!isFilterPanelOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={toggleFilterPanel}
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
          right: 0,
          height: '100%',
          width: 340,
          background: 'rgba(12,12,16,0.96)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          zIndex: 50,
          overflowY: 'auto',
          animation: 'slide-in-right 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FilterIcon style={{ width: 18, height: 18, color: '#60a5fa' }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
                Filters
              </span>
            </div>
            <button
              onClick={toggleFilterPanel}
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

          {activeFilterCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
              </span>
              <button
                onClick={handleClearAll}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#60a5fa',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: 4,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Search */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 8,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              Search Events
            </label>
            <div style={{ position: 'relative' }}>
              <Search style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 14,
                height: 14,
                color: 'rgba(255,255,255,0.3)',
                pointerEvents: 'none',
              }} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title or description..."
                style={{ ...inputStyle, paddingLeft: 36 }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 8,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              <Calendar style={{ width: 13, height: 13 }} />
              Date Range
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontWeight: 600 }}>
                  From
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontWeight: 600 }}>
                  To
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={handleClearDateRange}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#60a5fa',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 0',
                    textAlign: 'left',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#93c5fd'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#60a5fa'; }}
                >
                  Clear date range
                </button>
              )}
            </div>
          </div>

          {/* Event Types */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 8,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              Event Types
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((type) => {
                const { label, icon } = EVENT_TYPE_LABELS[type];
                const isSelected = selectedEventTypes.includes(type);

                return (
                  <label
                    key={type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleEventType(type)}
                      style={{
                        width: 16,
                        height: 16,
                        cursor: 'pointer',
                        accentColor: '#3b82f6',
                      }}
                    />
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                      {label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 8,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              <TagIcon style={{ width: 13, height: 13 }} />
              Tags
            </label>
            {tags && tags.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <label
                      key={tag.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTag(tag.id)}
                        style={{
                          width: 16,
                          height: 16,
                          cursor: 'pointer',
                          accentColor: '#3b82f6',
                        }}
                      />
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: tag.color,
                          boxShadow: `0 0 0 2px ${tag.color}30`,
                        }}
                      />
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                        {tag.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>No tags available</p>
            )}
          </div>

          {/* Info message */}
          {activeFilterCount > 0 && (
            <div
              style={{
                padding: 14,
                borderRadius: 6,
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.15)',
              }}
            >
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                Filters are applied to all events on the timeline. Only matching events will be displayed.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
