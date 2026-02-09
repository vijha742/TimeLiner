import type { EventInstance } from '../types';

export interface PositionedEvent extends EventInstance {
  x: number;        // pixel X position on timeline
  stemDir: 1 | -1;  // 1 = label above, -1 = label below
  stemLen: number;   // stem length in px (always positive)
  barWidth?: number; // pixel width for duration events
}

const STEM_BASE = 50;       // minimum stem length
const STEM_LANE_STEP = 50;  // extra length per lane to avoid overlaps
const PIN_HITBOX = 30;      // horizontal space reserved per pin for overlap detection

export const positionEvents = (
  events: EventInstance[],
  centerX: number,
  _centerY: number,
  scale: number,
  currentDate: Date
): PositionedEvent[] => {
  // Sort by date so alternation looks natural
  const sorted = [...events].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );

  const positioned: PositionedEvent[] = [];

  // Track occupied horizontal ranges per side per lane
  const aboveLanes: { start: number; end: number }[][] = [[]];
  const belowLanes: { start: number; end: number }[][] = [[]];

  sorted.forEach((event, index) => {
    const startMs = event.startDate.getTime();
    const endMs = event.endDate ? event.endDate.getTime() : startMs;

    const x = centerX + (startMs - currentDate.getTime()) * scale;
    const endX = centerX + (endMs - currentDate.getTime()) * scale;
    const barWidth = event.type === 'duration' ? Math.max(0, endX - x) : 0;

    // Alternate above/below
    const isAbove = index % 2 === 0;
    const lanes = isAbove ? aboveLanes : belowLanes;

    // Find first lane without horizontal overlap
    let lane = 0;
    let placed = false;
    const pinLeft = x - PIN_HITBOX;
    const pinRight = x + Math.max(PIN_HITBOX, barWidth);

    while (!placed) {
      if (lane >= lanes.length) lanes.push([]);
      const occupied = lanes[lane];
      const overlaps = occupied.some(
        (o) => !(pinRight < o.start || pinLeft > o.end)
      );
      if (!overlaps) {
        occupied.push({ start: pinLeft, end: pinRight });
        placed = true;
      } else {
        lane++;
      }
    }

    positioned.push({
      ...event,
      x,
      stemDir: isAbove ? 1 : -1,      // 1 = above (label goes up)
      stemLen: STEM_BASE + lane * STEM_LANE_STEP,
      barWidth: barWidth > 0 ? barWidth : undefined,
    });
  });

  return positioned;
};

export const isEventVisible = (
  event: PositionedEvent,
  viewportWidth: number,
): boolean => {
  const margin = 60;
  const right = event.x + (event.barWidth || 0);
  return right >= -margin && event.x <= viewportWidth + margin;
};
