import { X, Command } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export const ShortcutsHelp = () => {
  const { showShortcutsHelp, toggleShortcutsHelp } = useUIStore();

  if (!showShortcutsHelp) return null;

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['Home'], description: 'Jump to today' },
        { keys: ['←'], description: 'Go back 1 week' },
        { keys: ['→'], description: 'Go forward 1 week' },
        { keys: ['↑'], description: 'Go back 1 day' },
        { keys: ['↓'], description: 'Go forward 1 day' },
        { keys: ['Shift', '←'], description: 'Go back 1 month' },
        { keys: ['Shift', '→'], description: 'Go forward 1 month' },
        { keys: ['Ctrl', '←'], description: 'Go back 1 year' },
        { keys: ['Ctrl', '→'], description: 'Go forward 1 year' },
      ],
    },
    {
      category: 'Zoom',
      items: [
        { keys: ['+'], description: 'Zoom in' },
        { keys: ['-'], description: 'Zoom out' },
        { keys: ['Scroll'], description: 'Zoom in/out (mouse wheel)' },
      ],
    },
    {
      category: 'Actions',
      items: [
        { keys: ['N'], description: 'Create new event' },
        { keys: ['Ctrl', 'N'], description: 'Create new event' },
        { keys: ['Ctrl', 'F'], description: 'Toggle filter panel' },
        { keys: ['Double Click'], description: 'Create event at date' },
        { keys: ['?'], description: 'Show keyboard shortcuts' },
        { keys: ['Esc'], description: 'Close modal' },
      ],
    },
    {
      category: 'Timeline',
      items: [
        { keys: ['Click & Drag'], description: 'Pan through time' },
      ],
    },
  ];

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && toggleShortcutsHelp()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fade-in 0.15s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 12,
          background: 'rgba(12,12,16,0.97)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            position: 'sticky',
            top: 0,
            background: 'rgba(12,12,16,0.98)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px 12px 0 0',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Command style={{ width: 22, height: 22, color: '#60a5fa' }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
              Keyboard Shortcuts
            </span>
          </div>
          <button
            onClick={toggleShortcutsHelp}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
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
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          {shortcuts.map((section, idx) => (
            <div key={idx}>
              <h3
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#60a5fa',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 14,
                }}
              >
                {section.category}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: itemIdx < section.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                      {item.description}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {item.keys.map((key, keyIdx) => (
                        <div key={keyIdx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {keyIdx > 0 && (
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>+</span>
                          )}
                          <kbd
                            style={{
                              padding: '4px 8px',
                              fontSize: 11,
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 500,
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 4,
                              color: 'rgba(255,255,255,0.8)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                            }}
                          >
                            {key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Tip */}
          <div
            style={{
              padding: 14,
              borderRadius: 6,
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.15)',
            }}
          >
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
              <strong style={{ color: '#60a5fa', fontWeight: 600 }}>Tip:</strong> Press{' '}
              <kbd
                style={{
                  padding: '2px 6px',
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  background: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(59,130,246,0.25)',
                  borderRadius: 3,
                  color: '#60a5fa',
                  fontWeight: 500,
                }}
              >
                ?
              </kbd>{' '}
              anytime to view this help panel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
