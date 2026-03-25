import { useState } from 'react';
import { X, Download, Copy, Check } from 'lucide-react';
import { toPng, toJpeg, toSvg } from 'html-to-image';
import { useUIStore } from '../../stores/uiStore';
import { formatDateForZoom } from '../../utils/dateUtils';
import { getAllEventInstances } from '../../services/eventService';
import { exportTimelineToPDF } from '../../services/pdfExportService';

type ExportFormat = 'png' | 'jpeg' | 'svg' | 'pdf';
type ExportQuality = 'standard' | 'high' | 'ultra';
type PdfPageSize = 'a4' | 'letter';
type PdfOrientation = 'portrait' | 'landscape';

const QUALITY_SETTINGS = {
  standard: { scale: 1, quality: 0.8 },
  high: { scale: 2, quality: 0.9 },
  ultra: { scale: 3, quality: 0.95 },
};

export const ExportImageModal = () => {
  const { regionStart, regionEnd, cancelRegionSelection } = useUIStore();
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState<ExportQuality>('high');
  const [pdfPageSize, setPdfPageSize] = useState<PdfPageSize>('a4');
  const [pdfOrientation, setPdfOrientation] = useState<PdfOrientation>('landscape');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpen = regionStart !== null && regionEnd !== null;

  if (!isOpen || !regionStart || !regionEnd) return null;

  const handleClose = () => {
    cancelRegionSelection();
    setError(null);
    setCopied(false);
  };

  const getFilename = () => {
    const startStr = formatDateForZoom(regionStart.date, 'day').replace(/[/\\:]/g, '-');
    const endStr = formatDateForZoom(regionEnd.date, 'day').replace(/[/\\:]/g, '-');
    const timestamp = new Date().getTime();
    return `timeline-${startStr}-to-${endStr}-${timestamp}.${format}`;
  };

  const captureTimeline = async (): Promise<string> => {
    const timelineElement = document.querySelector('[data-timeline-canvas]') as HTMLElement;
    if (!timelineElement) {
      throw new Error('Timeline element not found');
    }

    const settings = QUALITY_SETTINGS[quality];
    
    try {
      // Wait for fonts to load before capturing
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // First try without skipFonts to see if it works
      const basicOptions = {
        quality: settings.quality,
        pixelRatio: settings.scale,
        cacheBust: true,
      };

      switch (format) {
        case 'png':
          return await toPng(timelineElement, basicOptions);
        case 'jpeg':
          return await toJpeg(timelineElement, basicOptions);
        case 'svg':
          return await toSvg(timelineElement, basicOptions);
        default:
          throw new Error('Unsupported format');
      }
    } catch (err) {
      console.error('Capture failed:', err);
      
      // If it fails, try with skipFonts
      try {
        const skipFontsOptions = {
          quality: settings.quality,
          pixelRatio: settings.scale,
          cacheBust: true,
          skipFonts: true,
        };
        
        switch (format) {
          case 'png':
            return await toPng(timelineElement, skipFontsOptions);
          case 'jpeg':
            return await toJpeg(timelineElement, skipFontsOptions);
          case 'svg':
            return await toSvg(timelineElement, skipFontsOptions);
          default:
            throw new Error('Unsupported format');
        }
      } catch (fallbackErr) {
        // If still fails, try with embedded fonts disabled and different approach
        console.error('Fallback capture also failed:', fallbackErr);
        
        try {
          // Create a clone of the element with simplified styles
          const clone = timelineElement.cloneNode(true) as HTMLElement;
          clone.style.position = 'absolute';
          clone.style.left = '-9999px';
          clone.style.top = '0';
          clone.style.width = `${timelineElement.offsetWidth}px`;
          clone.style.height = `${timelineElement.offsetHeight}px`;
          document.body.appendChild(clone);
          
          const simpleOptions = {
            quality: settings.quality,
            pixelRatio: settings.scale,
            cacheBust: true,
          };
          
          let result: string;
          switch (format) {
            case 'png':
              result = await toPng(clone, simpleOptions);
              break;
            case 'jpeg':
              result = await toJpeg(clone, simpleOptions);
              break;
            case 'svg':
              result = await toSvg(clone, simpleOptions);
              break;
            default:
              throw new Error('Unsupported format');
          }
          
          document.body.removeChild(clone);
          return result;
        } catch (cloneErr) {
          throw new Error(`Failed to capture timeline: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    }
  };

  const handleDownload = async () => {
    setIsExporting(true);
    setError(null);

    try {
      if (format === 'pdf') {
        const start = regionStart.date <= regionEnd.date ? regionStart.date : regionEnd.date;
        const end = regionStart.date <= regionEnd.date ? regionEnd.date : regionStart.date;
        const events = await getAllEventInstances(start, end);
        exportTimelineToPDF(start, end, events, {
          pageSize: pdfPageSize,
          orientation: pdfOrientation,
        });
        setTimeout(handleClose, 500);
        return;
      }

      const dataUrl = await captureTimeline();
      
      // Create download link
      const link = document.createElement('a');
      link.download = getFilename();
      link.href = dataUrl;
      link.click();

      // Close modal after successful download
      setTimeout(handleClose, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export image');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const dataUrl = await captureTimeline();
      
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      if (format === 'pdf') {
        setError('Copy to clipboard is not supported for PDF. Use Download instead.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to copy to clipboard');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
        }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 500,
          background: '#1a1a1a',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          zIndex: 1001,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            Export Timeline Image
          </h2>
          <button
            onClick={handleClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          {/* Date range info */}
          <div
            style={{
              padding: 12,
              marginBottom: 24,
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#60a5fa',
            }}
          >
            {formatDateForZoom(regionStart.date, 'day')} → {formatDateForZoom(regionEnd.date, 'day')}
          </div>

          {/* Format selection */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              Format
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['png', 'jpeg', 'svg', 'pdf'] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 6,
                    border: format === fmt ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: format === fmt ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: format === fmt ? '#60a5fa' : 'rgba(255, 255, 255, 0.6)',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (format !== fmt) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (format !== fmt) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                    }
                  }}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Quality selection (not for SVG) */}
          {(format === 'png' || format === 'jpeg') && (
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                Quality
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['standard', 'high', 'ultra'] as ExportQuality[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 6,
                      border: quality === q ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: quality === q ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: quality === q ? '#60a5fa' : 'rgba(255, 255, 255, 0.6)',
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (quality !== q) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (quality !== q) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                      }
                    }}
                  >
                    {q}
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 10,
                        opacity: 0.6,
                      }}
                    >
                      {q === 'standard' ? '1x' : q === 'high' ? '2x' : '3x'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {format === 'pdf' && (
            <div style={{ marginBottom: 24, display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  Page Size
                </label>
                <select
                  value={pdfPageSize}
                  onChange={(e) => setPdfPageSize(e.target.value as PdfPageSize)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: 13,
                  }}
                >
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  Orientation
                </label>
                <select
                  value={pdfOrientation}
                  onChange={(e) => setPdfOrientation(e.target.value as PdfOrientation)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: 13,
                  }}
                >
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div
              style={{
                padding: 12,
                marginBottom: 16,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                color: '#f87171',
              }}
            >
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleDownload}
              disabled={isExporting}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 8,
                border: 'none',
                background: isExporting ? 'rgba(59, 130, 246, 0.5)' : '#3b82f6',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: isExporting ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                opacity: isExporting ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isExporting) {
                  e.currentTarget.style.background = '#2563eb';
                }
              }}
              onMouseLeave={(e) => {
                if (!isExporting) {
                  e.currentTarget.style.background = '#3b82f6';
                }
              }}
            >
              {isExporting ? (
                <>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download style={{ width: 16, height: 16 }} />
                  <span>Download</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyToClipboard}
              disabled={isExporting || format === 'pdf'}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: copied ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                color: copied ? '#4ade80' : 'rgba(255, 255, 255, 0.8)',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: isExporting || format === 'pdf' ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                opacity: isExporting || format === 'pdf' ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isExporting && !copied) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isExporting && !copied) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
            >
              {copied ? (
                <>
                  <Check style={{ width: 16, height: 16 }} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy style={{ width: 16, height: 16 }} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
