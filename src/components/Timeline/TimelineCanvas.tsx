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
  const { 
    openModal, 
    isMobile,
    isSelectingRegion,
    regionStart,
    regionEnd,
    startRegionSelection,
    updateRegionSelection,
    cancelRegionSelection
  } = useUIStore();
  const filterState = useFilterStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isSelectingDrag, setIsSelectingDrag] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, date: currentDate });
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);

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

  const getRelativeX = (clientX: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return clientX - (rect?.left ?? 0);
  };

  // --- mouse handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    // If in region selection mode, start selecting
    if (isSelectingRegion) {
      const relativeX = getRelativeX(e.clientX);
      const clickX = relativeX - centerX;
      const clickedDate = pixelsToDate(clickX, currentDate, zoomConfig.scale);
      startRegionSelection(relativeX, clickedDate);
      setIsSelectingDrag(true);
      return;
    }
    
    // Otherwise, normal panning
    setIsDragging(true);
    setDragStart({ x: e.clientX, date: currentDate });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    // Update region selection if selecting
    if (isSelectingRegion && isSelectingDrag) {
      const relativeX = getRelativeX(e.clientX);
      const clickX = relativeX - centerX;
      const clickedDate = pixelsToDate(clickX, currentDate, zoomConfig.scale);
      updateRegionSelection(relativeX, clickedDate);
      return;
    }
    
    // Otherwise, normal panning
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaMs = -deltaX / zoomConfig.scale;
    useTimelineStore
      .getState()
      .setCurrentDate(new Date(dragStart.date.getTime() + deltaMs));
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    // End region selection if selecting
    if (isSelectingRegion && isSelectingDrag) {
      const relativeX = getRelativeX(e.clientX);
      const clickX = relativeX - centerX;
      const clickedDate = pixelsToDate(clickX, currentDate, zoomConfig.scale);
      updateRegionSelection(relativeX, clickedDate);
      // Don't call endRegionSelection() here - keep the selection mode active
      // so the overlay stays visible until the user closes the modal
      setIsSelectingDrag(false);
      return;
    }
    
    // Otherwise, normal pan end
    if (isDragging)
      setDragStart({ x: 0, date: useTimelineStore.getState().currentDate });
    setIsDragging(false);
  };
  const handleDoubleClick = (e: React.MouseEvent) => {
    // Disable double-click when in region selection mode
    if (isSelectingRegion) return;
    
    const clickX = e.clientX - centerX;
    const clickedDate = pixelsToDate(clickX, currentDate, zoomConfig.scale);
    openModal('create', undefined, clickedDate);
  };
  
  // Only end panning when mouse leaves, NOT region selection
  const handleMouseLeave = () => {
    if (isDragging) {
      setDragStart({ x: 0, date: useTimelineStore.getState().currentDate });
      setIsDragging(false);
    }
    // Note: We do NOT end region selection here - it should stay active until user releases mouse
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) useTimelineStore.getState().zoomIn();
    else useTimelineStore.getState().zoomOut();
  };

  // --- touch handlers for mobile ---
  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent native mobile zoom/scroll
    
    if (e.touches.length === 1) {
      // Check if in region selection mode
      if (isSelectingRegion) {
        const relativeX = getRelativeX(e.touches[0].clientX);
        const clickX = relativeX - centerX;
        const clickedDate = pixelsToDate(clickX, currentDate, zoomConfig.scale);
        startRegionSelection(relativeX, clickedDate);
        setIsSelectingDrag(true);
        setInitialPinchDistance(null);
        return;
      }
      
      // Single touch: pan
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, date: currentDate });
      setInitialPinchDistance(null);
    } else if (e.touches.length === 2) {
      // Two fingers: pinch to zoom
      setIsDragging(false);
      setInitialPinchDistance(getTouchDistance(e.touches));
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent native mobile zoom/scroll
    
    if (e.touches.length === 1) {
      // Check if in region selection mode
      if (isSelectingRegion && isSelectingDrag) {
        const relativeX = getRelativeX(e.touches[0].clientX);
        const clickX = relativeX - centerX;
        const clickedDate = pixelsToDate(clickX, currentDate, zoomConfig.scale);
        updateRegionSelection(relativeX, clickedDate);
        return;
      }
      
      // Single touch: pan
      if (isDragging) {
        const deltaX = e.touches[0].clientX - dragStart.x;
        const deltaMs = -deltaX / zoomConfig.scale;
        useTimelineStore
          .getState()
          .setCurrentDate(new Date(dragStart.date.getTime() + deltaMs));
      }
    } else if (e.touches.length === 2 && initialPinchDistance !== null) {
      // Two fingers: pinch to zoom
      const currentDistance = getTouchDistance(e.touches);
      const distanceRatio = currentDistance / initialPinchDistance;
      
      // Zoom threshold to prevent jittery behavior
      if (distanceRatio > 1.1) {
        // Pinch out - zoom in
        useTimelineStore.getState().zoomIn();
        setInitialPinchDistance(currentDistance);
      } else if (distanceRatio < 0.9) {
        // Pinch in - zoom out
        useTimelineStore.getState().zoomOut();
        setInitialPinchDistance(currentDistance);
      }
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent native mobile zoom/scroll
    
    if (e.touches.length === 0) {
      // End region selection if selecting
      if (isSelectingRegion && isSelectingDrag && regionStart) {
        const relativeX = regionEnd?.x ?? regionStart.x;
        const clickX = relativeX - centerX;
        const clickedDate = pixelsToDate(clickX, currentDate, zoomConfig.scale);
        updateRegionSelection(relativeX, clickedDate);
        // Don't call endRegionSelection() here - keep the selection mode active
        setIsSelectingDrag(false);
        return;
      }
      
      // All touches ended
      if (isDragging)
        setDragStart({ x: 0, date: useTimelineStore.getState().currentDate });
      setIsDragging(false);
      setInitialPinchDistance(null);
    } else if (e.touches.length === 1 && !isDragging) {
      // Went from 2 touches to 1 - resume panning
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, date: useTimelineStore.getState().currentDate });
      setInitialPinchDistance(null);
    }
  };

  useEffect(() => {
    const onResize = () =>
      useTimelineStore
        .getState()
        .setViewportSize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Handle Escape key to cancel region selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSelectingRegion) {
        setIsSelectingDrag(false);
        cancelRegionSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelectingRegion, cancelRegionSelection]);

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
      data-timeline-canvas="true"
      className="relative w-full h-full overflow-hidden select-none touch-manipulation"
      style={{ 
        cursor: isSelectingRegion 
          ? 'crosshair' 
          : (isDragging ? 'grabbing' : 'grab'),
        touchAction: 'none' 
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
              fontSize: isMobile ? '9px' : '10px',
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

      {/* ===== Region Selection Overlay ===== */}
      {isSelectingRegion && regionStart && (
        <>
          {/* Selection rectangle */}
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(regionStart.x, regionEnd?.x || regionStart.x)}px`,
              top: 0,
              width: `${Math.abs((regionEnd?.x || regionStart.x) - regionStart.x)}px`,
              height: `${viewportHeight}px`,
              background: 'rgba(59, 130, 246, 0.15)',
              border: '2px solid rgba(59, 130, 246, 0.5)',
              zIndex: 50,
              pointerEvents: 'none',
            }}
          />
          
          {/* Start date label */}
          <div
            style={{
              position: 'absolute',
              left: `${regionStart.x}px`,
              top: `${centerY + 50}px`,
              transform: 'translateX(-50%)',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#3b82f6',
              background: 'rgba(10, 10, 10, 0.9)',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(59, 130, 246, 0.5)',
              zIndex: 51,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {formatDateForZoom(regionStart.date, zoomConfig.tickInterval)}
          </div>
          
          {/* End date label (if dragging) */}
          {regionEnd && (
            <div
              style={{
                position: 'absolute',
                left: `${regionEnd.x}px`,
                top: `${centerY + 50}px`,
                transform: 'translateX(-50%)',
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                color: '#3b82f6',
                background: 'rgba(10, 10, 10, 0.9)',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(59, 130, 246, 0.5)',
                zIndex: 51,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {formatDateForZoom(regionEnd.date, zoomConfig.tickInterval)}
            </div>
          )}
          
          {/* Instruction text */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              color: '#3b82f6',
              background: 'rgba(10, 10, 10, 0.95)',
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid rgba(59, 130, 246, 0.5)',
              zIndex: 51,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Click and drag to select region • Press ESC to cancel
          </div>
        </>
      )}
    </div>
  );
};
