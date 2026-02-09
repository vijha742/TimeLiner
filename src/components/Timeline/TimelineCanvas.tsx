import { useRef, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTimelineStore } from '../../stores/timelineStore';
import { useUIStore } from '../../stores/uiStore';
import { useFilterStore } from '../../stores/filterStore';
import { getZoomConfig, dateToPixels, pixelsToDate, getVisibleDateRange } from '../../utils/zoomLevels';
import { formatDateForZoom, getNextTick, roundToInterval } from '../../utils/dateUtils';
import { getAllEventInstances } from '../../services/eventService';
import { positionEvents, isEventVisible } from '../../utils/eventPositioning';
import { applyFilters } from '../../utils/filterUtils';
import { EventCard } from '../Events/EventCard';

export const TimelineCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { currentDate, zoomLevel, viewportWidth, viewportHeight } = useTimelineStore();
  const { openModal } = useUIStore();
  const filterState = useFilterStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, date: currentDate });

  const zoomConfig = getZoomConfig(zoomLevel);
  const centerY = viewportHeight / 2;
  const centerX = viewportWidth / 2;

  // Fetch events in visible range
  const { start, end } = getVisibleDateRange(currentDate, viewportWidth, zoomConfig.scale);

  const events = useLiveQuery(
    async () => getAllEventInstances(start, end),
    [start.getTime(), end.getTime()]
  );

  // Apply filters then position
  const filteredEvents = events ? applyFilters(events, filterState) : [];
  const positionedEvents =
    filteredEvents.length > 0
      ? positionEvents(filteredEvents, centerX, centerY, zoomConfig.scale, currentDate)
      : [];
  const visibleEvents = positionedEvents.filter((e) => isEventVisible(e, viewportWidth));

  // --- mouse handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, date: currentDate });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaMs = -deltaX / zoomConfig.scale;
    useTimelineStore
      .getState()
      .setCurrentDate(new Date(dragStart.date.getTime() + deltaMs));
  };
  const handleMouseUp = () => {
    if (isDragging)
      setDragStart({ x: 0, date: useTimelineStore.getState().currentDate });
    setIsDragging(false);
  };
  const handleDoubleClick = (e: React.MouseEvent) => {
    const clickX = e.clientX - centerX;
    const clickedDate = pixelsToDate(clickX, currentDate, zoomConfig.scale);
    openModal('create', undefined, clickedDate);
  };
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) useTimelineStore.getState().zoomIn();
    else useTimelineStore.getState().zoomOut();
  };
  useEffect(() => {
    const onResize = () =>
      useTimelineStore
        .getState()
        .setViewportSize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // --- ticks ---
  const ticks = (() => {
    const result: { date: Date; x: number; label: string }[] = [];
    const range = getVisibleDateRange(currentDate, viewportWidth, zoomConfig.scale);
    let d = roundToInterval(range.start, zoomConfig.tickInterval);
    while (d <= range.end) {
      const x = centerX + dateToPixels(d, currentDate, zoomConfig.scale);
      if (x >= -100 && x <= viewportWidth + 100)
        result.push({ date: d, x, label: formatDateForZoom(d, zoomConfig.tickInterval) });
      d = getNextTick(d, zoomConfig.tickInterval);
    }
    return result;
  })();

  // Today indicator
  const today = new Date();
  const todayX = centerX + dateToPixels(today, currentDate, zoomConfig.scale);
  const isTodayVisible = todayX >= -10 && todayX <= viewportWidth + 10;

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
    >
      {/* ===== Z-LAYER 1: Tick marks (below the line) ===== */}
      {ticks.map((tick, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: `${tick.x}px`, zIndex: 1 }}
        >
          {/* Vertical tick notch */}
          <div
            style={{
              position: 'absolute',
              left: '-0.5px',
              top: `${centerY - 16}px`,
              width: '1px',
              height: '32px',
              background: 'rgba(255,255,255,0.08)',
            }}
          />
          {/* Tick label */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: `${centerY + 28}px`,
              transform: 'translateX(-50%)',
              fontSize: '10px',
              fontWeight: 500,
              fontFamily: "'JetBrains Mono', 'DM Sans', monospace",
              color: 'rgba(255,255,255,0.22)',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}
          >
            {tick.label}
          </div>
        </div>
      ))}

      {/* ===== Z-LAYER 2: THE TIMELINE LINE ===== */}
      {/* This is the continuous baseline -- must ALWAYS be visible edge to edge */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${centerY - 1}px`,
          height: '2px',
          background: 'rgba(255, 255, 255, 0.18)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      {/* Brighter center glow on the line to give depth */}
      <div
        style={{
          position: 'absolute',
          left: '10%',
          right: '10%',
          top: `${centerY - 1}px`,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.25) 70%, transparent 100%)',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />

      {/* ===== Z-LAYER 3: Today indicator ===== */}
      {isTodayVisible && (
        <>
          {/* Today vertical line -- full height, subtle */}
          <div
            style={{
              position: 'absolute',
              left: `${todayX}px`,
              top: 0,
              width: '1px',
              height: `${viewportHeight}px`,
              background: 'linear-gradient(180deg, transparent 15%, rgba(59,130,246,0.2) 40%, rgba(59,130,246,0.3) 50%, rgba(59,130,246,0.2) 60%, transparent 85%)',
              zIndex: 4,
              pointerEvents: 'none',
            }}
          />
          {/* Diamond marker on the line */}
          <div
            style={{
              position: 'absolute',
              left: `${todayX - 5}px`,
              top: `${centerY - 5}px`,
              width: '10px',
              height: '10px',
              background: '#3b82f6',
              borderRadius: '2px',
              transform: 'rotate(45deg)',
              boxShadow: '0 0 10px rgba(59,130,246,0.5), 0 0 20px rgba(59,130,246,0.2)',
              zIndex: 15,
              pointerEvents: 'none',
            }}
          />
          {/* "TODAY" label */}
          <div
            style={{
              position: 'absolute',
              left: `${todayX}px`,
              top: `${centerY - 30}px`,
              transform: 'translateX(-50%)',
              fontSize: '9px',
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.12em',
              color: '#3b82f6',
              padding: '2px 8px',
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: '3px',
              zIndex: 15,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            TODAY
          </div>
        </>
      )}

      {/* ===== Z-LAYER 5: Event pins ===== */}
      {visibleEvents.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          centerY={centerY}
          onClick={() => openModal('edit', event.originalEventId || event.id)}
        />
      ))}

      {/* ===== HUD: Zoom level (top-right) ===== */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 20,
          fontSize: '10px',
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.2)',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        {zoomLevel.replace('-', ' ')}
      </div>

      {/* ===== HUD: Center date (bottom-center) ===== */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '11px',
          fontWeight: 500,
          fontFamily: "'JetBrains Mono', monospace",
          color: 'rgba(255,255,255,0.25)',
          letterSpacing: '0.03em',
          zIndex: 20,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {formatDateForZoom(currentDate, zoomConfig.tickInterval)}
      </div>
    </div>
  );
};
