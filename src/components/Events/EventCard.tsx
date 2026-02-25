import { useState } from 'react';
import { Clock, Calendar, Flag, Repeat } from 'lucide-react';
import type { PositionedEvent } from '../../utils/eventPositioning';
import { format, differenceInMilliseconds } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { updateEvent } from '../../services/eventService';
import { useTimelineStore } from '../../stores/timelineStore';
import { useUIStore } from '../../stores/uiStore';
import { getZoomConfig } from '../../utils/zoomLevels';

interface EventCardProps {
  event: PositionedEvent;
  centerY: number;
  onClick?: () => void;
}

const PIN_RADIUS = 6;

export const EventCard = ({ event, centerY, onClick }: EventCardProps) => {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; originalDate: Date } | null>(null);

  const { zoomLevel } = useTimelineStore();
  const { isMobile } = useUIStore();
  const zoomConfig = getZoomConfig(zoomLevel);

  const tags = useLiveQuery(
    async () => {
      if (event.tags.length === 0) return [];
      return await db.tags.where('id').anyOf(event.tags).toArray();
    },
    [event.tags]
  );

  const tagColor = tags?.[0]?.color || '#6366f1';
  const above = event.stemDir === 1;

  const pinCX = event.x;
  const pinCY = centerY;
  const stemEndY = above ? centerY - event.stemLen : centerY + event.stemLen;

  const getIcon = () => {
    const s = { width: 12, height: 12, strokeWidth: 2 };
    switch (event.type) {
      case 'point': return <Clock {...s} />;
      case 'duration': return <Calendar {...s} />;
      case 'milestone': return <Flag {...s} />;
      case 'recurring': return <Repeat {...s} />;
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent) => {
    // Don't allow dragging recurring instances (only edit the parent)
    if (event.originalEventId) return;

    e.stopPropagation();
    setDragging(true);
    setDragStart({ x: e.clientX, originalDate: event.startDate });
  };

  const handleDragMove = () => {
    if (!dragging || !dragStart) return;
    // Visual feedback handled by transform
  };

  const handleDragEnd = async (e: React.MouseEvent) => {
    if (!dragging || !dragStart) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaMs = deltaX / zoomConfig.scale;

    const newStartDate = new Date(dragStart.originalDate.getTime() + deltaMs);

    // Calculate duration if event has endDate
    let newEndDate: Date | undefined;
    if (event.endDate) {
      const duration = differenceInMilliseconds(event.endDate, event.startDate);
      newEndDate = new Date(newStartDate.getTime() + duration);
    }

    // Update event in database
    try {
      await updateEvent(event.id, {
        startDate: newStartDate,
        endDate: newEndDate,
      });
    } catch (err) {
      console.error('Failed to update event position:', err);
    }

    setDragging(false);
    setDragStart(null);
  };

  const handleDragCancel = () => {
    setDragging(false);
    setDragStart(null);
  };

  // Calculate drag offset for visual feedback
  const dragOffsetX = dragging && dragStart ? (window.event as any)?.clientX - dragStart.x : 0;

  return (
    <div
      style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0 }}
      onMouseEnter={() => !dragging && setHovered(true)}
      onMouseLeave={() => !dragging && setHovered(false)}
    >
      {/* Duration bar */}
      {event.barWidth != null && event.barWidth > 0 && (
        <div
          style={{
            position: 'absolute',
            left: `${pinCX + (dragging ? dragOffsetX : 0)}px`,
            top: `${pinCY - 2}px`,
            width: `${event.barWidth}px`,
            height: '4px',
            borderRadius: '2px',
            backgroundColor: tagColor,
            opacity: hovered ? 0.55 : 0.2,
            transition: dragging ? 'none' : 'opacity 0.2s ease',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Stem */}
      <div
        style={{
          position: 'absolute',
          left: `${pinCX + (dragging ? dragOffsetX : 0)}px`,
          top: `${Math.min(pinCY, stemEndY)}px`,
          width: '1px',
          height: `${event.stemLen}px`,
          marginLeft: '0px',
          background: `linear-gradient(${above ? '0deg' : '180deg'}, ${tagColor}00, ${tagColor}88)`,
          opacity: hovered ? 0.9 : 0.3,
          transition: dragging ? 'none' : 'opacity 0.2s ease',
          zIndex: 6,
          pointerEvents: 'none',
        }}
      />

      {/* Pin dot */}
      <div
        onClick={() => {
          if (!dragging && onClick) onClick();
        }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={() => {
          if (dragging) handleDragCancel();
        }}
        style={{
          position: 'absolute',
          left: `${pinCX - PIN_RADIUS + (dragging ? dragOffsetX : 0)}px`,
          top: `${pinCY - PIN_RADIUS}px`,
          width: `${PIN_RADIUS * 2}px`,
          height: `${PIN_RADIUS * 2}px`,
          borderRadius: '50%',
          backgroundColor: tagColor,
          border: hovered || dragging ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(0,0,0,0.5)',
          cursor: event.originalEventId ? 'pointer' : (dragging ? 'grabbing' : 'grab'),
          zIndex: hovered || dragging ? 30 : 10,
          boxShadow: hovered || dragging
            ? `0 0 0 3px ${tagColor}30, 0 0 14px ${tagColor}50`
            : `0 1px 4px rgba(0,0,0,0.5)`,
          transition: dragging ? 'none' : 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
          transform: (hovered && !dragging) ? 'scale(1.4)' : dragging ? 'scale(1.2)' : 'scale(1)',
        }}
      />

      {/* Label at end of stem */}
      <div
        style={{
          position: 'absolute',
          left: `${pinCX + (dragging ? dragOffsetX : 0)}px`,
          top: above ? `${stemEndY - 8}px` : `${stemEndY - 4}px`,
          transform: 'translateX(-50%)',
          zIndex: hovered || dragging ? 25 : 7,
          pointerEvents: 'none',
          transition: dragging ? 'none' : 'opacity 0.2s ease',
          opacity: hovered || dragging ? 1 : 0.55,
        }}
      >
        <div
          style={{
            maxWidth: isMobile ? '100px' : '120px',
            padding: '2px 6px',
            borderRadius: '3px',
            backgroundColor: hovered || dragging ? 'rgba(20,20,25,0.92)' : 'transparent',
            border: hovered || dragging ? `1px solid ${tagColor}40` : '1px solid transparent',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: isMobile ? '9px' : '10px',
            fontWeight: 600,
            letterSpacing: '0.01em',
            color: hovered || dragging ? '#fff' : 'rgba(255,255,255,0.6)',
            transition: dragging ? 'none' : 'all 0.2s ease',
          }}
        >
          {event.title}
        </div>
      </div>

      {/* Tooltip on hover (not during drag) */}
      {hovered && !dragging && (
        <div
          style={{
            position: 'absolute',
            left: `${pinCX}px`,
            top: above
              ? `${stemEndY - 32}px`
              : `${stemEndY + 24}px`,
            transform: 'translateX(-50%)',
            zIndex: 50,
            pointerEvents: 'none',
            animation: 'tooltip-in 0.15s ease-out forwards',
          }}
        >
          <div
            style={{
              width: isMobile ? '200px' : '260px',
              padding: isMobile ? '12px' : '14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(10, 10, 14, 0.96)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.04)`,
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
              <div
                style={{
                  padding: '5px',
                  borderRadius: '5px',
                  backgroundColor: `${tagColor}15`,
                  color: tagColor,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {getIcon()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: isMobile ? '12px' : '13px',
                  fontWeight: 700,
                  color: '#fff',
                  lineHeight: 1.35,
                  letterSpacing: '-0.01em',
                }}>
                  {event.title}
                </div>
                {event.description && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.4)',
                      marginTop: '4px',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {event.description}
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 0 10px 0' }} />

            {/* Date */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
                color: 'rgba(255,255,255,0.35)',
                marginBottom: tags && tags.length > 0 ? '10px' : 0,
              }}
            >
              <Clock style={{ width: 12, height: 12, opacity: 0.5 }} />
              {event.type === 'duration' && event.endDate
                ? `${format(event.startDate, 'MMM d, yyyy')} — ${format(event.endDate, 'MMM d, yyyy')}`
                : format(event.startDate, 'MMM d, yyyy  ·  h:mm a')}
            </div>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    style={{
                      fontSize: '9px',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '99px',
                      backgroundColor: `${tag.color}12`,
                      color: tag.color,
                      border: `1px solid ${tag.color}25`,
                      letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Recurring badge */}
            {event.originalEventId && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.25)',
                  marginTop: '10px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <Repeat style={{ width: 11, height: 11 }} />
                Recurring event (cannot drag)
              </div>
            )}

            {/* Drag hint */}
            {!event.originalEventId && (
              <div
                style={{
                  marginTop: '10px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.25)',
                  textAlign: 'center',
                }}
              >
                💡 Drag pin to change date
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dragging indicator */}
      {dragging && (
        <div
          style={{
            position: 'absolute',
            left: `${pinCX + dragOffsetX}px`,
            top: `${pinCY + 20}px`,
            transform: 'translateX(-50%)',
            zIndex: 40,
            pointerEvents: 'none',
            padding: '4px 10px',
            borderRadius: '4px',
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.3)',
            fontSize: '10px',
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            color: '#60a5fa',
            whiteSpace: 'nowrap',
          }}
        >
          {format(new Date(event.startDate.getTime() + dragOffsetX / zoomConfig.scale), 'MMM d, yyyy')}
        </div>
      )}
    </div>
  );
};
