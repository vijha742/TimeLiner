import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Calendar, Clock, Flag, Repeat, Tag as TagIcon, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { useUIStore } from '../../stores/uiStore';
import { db } from '../../services/db';
import { createEvent, updateEvent, deleteEvent } from '../../services/eventService';
import type { EventType, RecurrenceFrequency, TimelineEvent } from '../../types';

/* ── shared inline styles ── */
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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.5)',
  marginBottom: 6,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

export const EventModal = () => {
  const { isOpen, type, eventId, initialDate, closeModal, isMobile } = useUIStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('point');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFrequency>('weekly');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [recurrenceCount, setRecurrenceCount] = useState<number | undefined>(undefined);

  const [remindDate, setRemindDate] = useState('');
  const [remindTime, setRemindTime] = useState('09:00');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tags = useLiveQuery(() => db.tags.toArray(), []);

  const existingEvent = useLiveQuery(
    async () => {
      if (type === 'edit' && eventId) return await db.events.get(eventId);
      return null;
    },
    [type, eventId]
  );

  useEffect(() => {
    if (existingEvent) {
      setTitle(existingEvent.title);
      setDescription(existingEvent.description || '');
      setEventType(existingEvent.type);
      setStartDate(format(existingEvent.startDate, 'yyyy-MM-dd'));
      setStartTime(format(existingEvent.startDate, 'HH:mm'));
      if (existingEvent.endDate) {
        setEndDate(format(existingEvent.endDate, 'yyyy-MM-dd'));
        setEndTime(format(existingEvent.endDate, 'HH:mm'));
      }
      setSelectedTags(existingEvent.tags);
      if (existingEvent.remindAt) {
        setRemindDate(format(existingEvent.remindAt, 'yyyy-MM-dd'));
        setRemindTime(format(existingEvent.remindAt, 'HH:mm'));
      }
      if (existingEvent.recurrence) {
        setIsRecurring(true);
        setRecurrenceFreq(existingEvent.recurrence.frequency);
        setRecurrenceInterval(existingEvent.recurrence.interval);
        if (existingEvent.recurrence.endDate) {
          setRecurrenceEndDate(format(existingEvent.recurrence.endDate, 'yyyy-MM-dd'));
        }
        setRecurrenceCount(existingEvent.recurrence.count);
      }
    } else if (initialDate) {
      setStartDate(format(initialDate, 'yyyy-MM-dd'));
    } else {
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [existingEvent, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!title.trim()) { setError('Title is required'); setLoading(false); return; }

      const start = new Date(`${startDate}T${startTime}`);
      let end: Date | undefined;
      if ((eventType === 'duration' || isRecurring) && endDate && endTime) {
        end = new Date(`${endDate}T${endTime}`);
      }

      let remind: Date | undefined;
      if (remindDate && remindTime) {
        remind = new Date(`${remindDate}T${remindTime}`);
      }

      const eventData: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        description: description.trim() || undefined,
        type: isRecurring ? 'recurring' : eventType,
        startDate: start,
        endDate: end,
        tags: selectedTags,
        remindAt: remind,
        recurrence: isRecurring ? {
          frequency: recurrenceFreq,
          interval: recurrenceInterval,
          endDate: recurrenceEndDate ? new Date(recurrenceEndDate) : undefined,
          count: recurrenceCount,
        } : undefined,
      };

      if (type === 'edit' && eventId) await updateEvent(eventId, eventData);
      else await createEvent(eventData);

      closeModal();
      resetForm();
    } catch (err) {
      setError('Failed to save event. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!eventId || !confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(eventId);
      closeModal();
      resetForm();
    } catch (err) {
      setError('Failed to delete event');
      console.error(err);
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setEventType('point');
    setStartDate(format(new Date(), 'yyyy-MM-dd')); setStartTime('09:00');
    setEndDate(''); setEndTime('10:00'); setSelectedTags([]);
    setRemindDate(''); setRemindTime('09:00');
    setIsRecurring(false); setRecurrenceFreq('weekly');
    setRecurrenceInterval(1); setRecurrenceEndDate('');
    setRecurrenceCount(undefined); setError('');
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
  };

  if (!isOpen) return null;

  const typeConfig: { type: EventType; Icon: typeof Clock; label: string }[] = [
    { type: 'point', Icon: Clock, label: 'Point' },
    { type: 'duration', Icon: Calendar, label: 'Duration' },
    { type: 'milestone', Icon: Flag, label: 'Milestone' },
    { type: 'recurring', Icon: Repeat, label: 'Recurring' },
  ];

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && closeModal()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 50,
        display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : 16,
        animation: 'fade-in 0.15s ease-out',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: isMobile ? '100%' : 560,
          maxHeight: isMobile ? '100%' : '88vh',
          height: isMobile ? '100%' : 'auto',
          overflowY: 'auto',
          borderRadius: isMobile ? 0 : 12,
          background: 'rgba(12,12,16,0.97)',
          border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.06)',
          boxShadow: isMobile ? 'none' : '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: isMobile ? '16px' : '18px 22px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            position: 'sticky', top: 0,
            background: 'rgba(12,12,16,0.98)',
            backdropFilter: 'blur(12px)',
            borderRadius: isMobile ? 0 : '12px 12px 0 0',
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
            {type === 'create' ? 'New Event' : 'Edit Event'}
          </span>
          <button
            onClick={closeModal}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 6, border: 'none',
              background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '16px' : '20px 22px', display: 'flex', flexDirection: 'column', gap: isMobile ? 18 : 20 }}>
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 6,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171', fontSize: 12, fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label style={labelStyle}>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              style={{ ...inputStyle, resize: 'none' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Event Type */}
          <div>
            <label style={labelStyle}>Event Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {typeConfig.map(({ type: t, Icon, label }) => {
                const active = eventType === t || (t === 'recurring' && isRecurring);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setEventType(t);
                      setIsRecurring(t === 'recurring');
                    }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      padding: '10px 4px', borderRadius: 6, border: 'none',
                      background: active ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
                      color: active ? '#60a5fa' : 'rgba(255,255,255,0.35)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      outline: active ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.05)',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}}
                  >
                    <Icon style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'capitalize' }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Start Date *</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
            </div>
            <div>
              <label style={labelStyle}>Start Time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
            </div>
            {(eventType === 'duration' || isRecurring) && (
              <>
                <div>
                  <label style={labelStyle}>End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>End Time</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Reminder */}
          <div>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Bell style={{ width: 12, height: 12 }} />
              Reminder
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <input 
                  type="date" 
                  value={remindDate} 
                  onChange={(e) => setRemindDate(e.target.value)} 
                  placeholder="Remind date"
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
              </div>
              <div>
                <input 
                  type="time" 
                  value={remindTime} 
                  onChange={(e) => setRemindTime(e.target.value)} 
                  disabled={!remindDate}
                  style={{ ...inputStyle, opacity: remindDate ? 1 : 0.5 }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
              </div>
            </div>
            <p style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.35)',
              marginTop: 6,
              fontStyle: 'italic',
            }}>
              Get notified before this event starts
            </p>
          </div>

          {/* Recurrence */}
          {isRecurring && (
            <div style={{
              padding: 14, borderRadius: 8,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Repeat style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.4)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Recurrence
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: 10 }}>Frequency</label>
                  <select value={recurrenceFreq} onChange={(e) => setRecurrenceFreq(e.target.value as RecurrenceFrequency)} style={inputStyle}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 10 }}>Every</label>
                  <input type="number" min="1" value={recurrenceInterval} onChange={(e) => setRecurrenceInterval(parseInt(e.target.value))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 10 }}>End Date</label>
                  <input type="date" value={recurrenceEndDate} onChange={(e) => setRecurrenceEndDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 10 }}>Count</label>
                  <input type="number" min="1" value={recurrenceCount || ''} onChange={(e) => setRecurrenceCount(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="#" style={inputStyle} />
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 5 }}>
              <TagIcon style={{ width: 12, height: 12 }} />
              Tags
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tags?.map((tag) => {
                const sel = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 99,
                      border: sel ? `1px solid ${tag.color}` : '1px solid rgba(255,255,255,0.08)',
                      background: sel ? `${tag.color}18` : 'transparent',
                      color: sel ? tag.color : 'rgba(255,255,255,0.4)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            {type === 'edit' ? (
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  padding: '7px 14px', borderRadius: 6, border: 'none',
                  background: 'rgba(239,68,68,0.08)', color: '#f87171',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
              >
                Delete
              </button>
            ) : <div />}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => { closeModal(); resetForm(); }}
                style={{
                  padding: '7px 16px', borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'transparent', color: 'rgba(255,255,255,0.5)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '7px 20px', borderRadius: 6, border: 'none',
                  background: '#3b82f6', color: '#fff',
                  fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  boxShadow: '0 2px 10px rgba(59,130,246,0.25)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#2563eb'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#3b82f6'; }}
              >
                {loading ? 'Saving...' : type === 'edit' ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
