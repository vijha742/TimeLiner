import { useEffect } from 'react';
import { useTimelineStore } from '../stores/timelineStore';
import { useUIStore } from '../stores/uiStore';
import { addDays, addWeeks, addMonths } from 'date-fns';

export const useKeyboardShortcuts = () => {
  const { zoomIn, zoomOut, navigateToToday, currentDate, setCurrentDate } = useTimelineStore();
  const { openModal, toggleFilterPanel, toggleShortcutsHelp } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input/textarea/select
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const { ctrlKey, metaKey, shiftKey, key } = e;
      const mod = ctrlKey || metaKey;

      // Zoom shortcuts
      if (key === '+' || key === '=') {
        e.preventDefault();
        zoomIn();
        return;
      }

      if (key === '-' || key === '_') {
        e.preventDefault();
        zoomOut();
        return;
      }

      // Navigation shortcuts
      if (key === 'Home') {
        e.preventDefault();
        navigateToToday();
        return;
      }

      // Arrow key navigation
      if (key === 'ArrowLeft') {
        e.preventDefault();
        if (mod) {
          // Ctrl/Cmd + Left: Go back 1 year
          setCurrentDate(addMonths(currentDate, -12));
        } else if (shiftKey) {
          // Shift + Left: Go back 1 month
          setCurrentDate(addMonths(currentDate, -1));
        } else {
          // Left: Go back 1 week
          setCurrentDate(addWeeks(currentDate, -1));
        }
        return;
      }

      if (key === 'ArrowRight') {
        e.preventDefault();
        if (mod) {
          // Ctrl/Cmd + Right: Go forward 1 year
          setCurrentDate(addMonths(currentDate, 12));
        } else if (shiftKey) {
          // Shift + Right: Go forward 1 month
          setCurrentDate(addMonths(currentDate, 1));
        } else {
          // Right: Go forward 1 week
          setCurrentDate(addWeeks(currentDate, 1));
        }
        return;
      }

      if (key === 'ArrowUp') {
        e.preventDefault();
        // Up: Go back 1 day
        setCurrentDate(addDays(currentDate, -1));
        return;
      }

      if (key === 'ArrowDown') {
        e.preventDefault();
        // Down: Go forward 1 day
        setCurrentDate(addDays(currentDate, 1));
        return;
      }

      // Action shortcuts
      if (mod && (key === 'n' || key === 'N')) {
        e.preventDefault();
        openModal('create');
        return;
      }

      if (mod && (key === 'f' || key === 'F')) {
        e.preventDefault();
        toggleFilterPanel();
        return;
      }

      if (key === '?' || (shiftKey && key === '/')) {
        e.preventDefault();
        toggleShortcutsHelp();
        return;
      }

      // Quick create with N key (without modifier)
      if ((key === 'n' || key === 'N') && !mod) {
        e.preventDefault();
        openModal('create');
        return;
      }

      // Escape handled by individual modals via their own useEffect hooks
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, navigateToToday, currentDate, setCurrentDate, openModal, toggleFilterPanel, toggleShortcutsHelp]);
};
