import { jsPDF } from 'jspdf';
import type { EventInstance } from '../types';

type PDFOptions = {
  pageSize: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
};

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

const formatDateTime = (date: Date) =>
  date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const safeFilePart = (date: Date) =>
  date.toISOString().slice(0, 10);

export function getPdfFilename(startDate: Date, endDate: Date): string {
  return `timeline-${safeFilePart(startDate)}-to-${safeFilePart(endDate)}.pdf`;
}

export function exportTimelineToPDF(
  startDate: Date,
  endDate: Date,
  events: EventInstance[],
  options: PDFOptions
): void {
  const doc = new jsPDF({
    orientation: options.orientation,
    unit: 'pt',
    format: options.pageSize,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Timeline Export', margin, y);
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Range: ${formatDate(startDate)} - ${formatDate(endDate)}`, margin, y);
  y += 16;
  doc.text(`Exported: ${formatDateTime(new Date())}`, margin, y);
  y += 20;

  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Events', margin, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const sorted = [...events].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );

  if (sorted.length === 0) {
    doc.text('No events found in the selected range.', margin, y);
  } else {
    for (const event of sorted) {
      const lines = [
        `${formatDateTime(event.startDate)}  -  ${event.title}`,
        `Type: ${event.type}${event.tags.length ? ` | Tags: ${event.tags.join(', ')}` : ''}`,
      ];

      if (event.description) {
        lines.push(`Description: ${event.description}`);
      }

      if (event.endDate) {
        lines.push(`Ends: ${formatDateTime(event.endDate)}`);
      }

      const wrapped = lines.flatMap((line) =>
        doc.splitTextToSize(line, pageWidth - margin * 2)
      );

      const blockHeight = wrapped.length * 12 + 10;
      if (y + blockHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      wrapped.forEach((line) => {
        doc.text(line, margin, y);
        y += 12;
      });

      y += 6;
      doc.setDrawColor(235);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
    }
  }

  const filename = getPdfFilename(startDate, endDate);
  doc.save(filename);
}
