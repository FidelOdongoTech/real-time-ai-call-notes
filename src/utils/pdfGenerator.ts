import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { Call } from '../types';

// Format number with Kenyan locale
const formatKES = (amount: number) => {
  return new Intl.NumberFormat('en-KE').format(amount);
};

export function generatePDF(call: Call): void {
  const doc = new jsPDF();
  const { customer, extraction, summary, duration, startedAt, endedAt, transcript } = call;

  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const darkColor: [number, number, number] = [31, 41, 55];
  const grayColor: [number, number, number] = [107, 114, 128];
  const greenColor: [number, number, number] = [34, 197, 94];
  const yellowColor: [number, number, number] = [234, 179, 8];
  const redColor: [number, number, number] = [239, 68, 68];

  let yPos = 20;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - (margin * 2);

  // Helper function to add text
  const addText = (text: string, x: number, y: number, options: { 
    fontSize?: number; 
    color?: [number, number, number]; 
    bold?: boolean;
    maxWidth?: number;
  } = {}) => {
    const { fontSize = 10, color = darkColor, bold = false } = options;
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    
    if (options.maxWidth) {
      const lines = doc.splitTextToSize(text, options.maxWidth);
      doc.text(lines, x, y);
      return lines.length * (fontSize * 0.4);
    }
    doc.text(text, x, y);
    return fontSize * 0.4;
  };

  // Check if we need a new page
  const checkNewPage = (neededSpace: number) => {
    if (yPos + neededSpace > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Call Session Summary', margin, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('CallNotes AI - Real-Time Transcription System', margin, 30);

  doc.setFontSize(10);
  doc.text(format(startedAt, 'MMMM d, yyyy'), pageWidth - margin, 25, { align: 'right' });

  yPos = 55;

  // Customer Info Box
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, yPos - 5, contentWidth, 35, 3, 3, 'F');

  addText('CUSTOMER INFORMATION', margin + 5, yPos + 3, { fontSize: 8, color: grayColor, bold: true });
  yPos += 10;

  doc.setDrawColor(229, 231, 235);
  doc.line(margin + 5, yPos, margin + contentWidth - 10, yPos);
  yPos += 8;

  // Customer details grid
  const colWidth = contentWidth / 4;
  addText('Name:', margin + 5, yPos, { fontSize: 8, color: grayColor });
  addText(customer.name, margin + 5, yPos + 5, { fontSize: 10, bold: true });

  addText('Phone:', margin + 5 + colWidth, yPos, { fontSize: 8, color: grayColor });
  addText(customer.phone, margin + 5 + colWidth, yPos + 5, { fontSize: 10 });

  addText('Account:', margin + 5 + colWidth * 2, yPos, { fontSize: 8, color: grayColor });
  addText(customer.accountNumber, margin + 5 + colWidth * 2, yPos + 5, { fontSize: 10 });

  addText('Debt Amount:', margin + 5 + colWidth * 3, yPos, { fontSize: 8, color: grayColor });
  addText(`KES ${formatKES(customer.debtAmount)}`, margin + 5 + colWidth * 3, yPos + 5, { fontSize: 10, color: redColor, bold: true });

  yPos += 25;

  // Session Details
  addText('SESSION DETAILS', margin, yPos, { fontSize: 12, bold: true });
  yPos += 8;

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins} min ${s} sec`;
  };

  const sentimentColor = extraction.sentiment === 'positive' ? greenColor : 
                         extraction.sentiment === 'negative' ? redColor : grayColor;

  const detailsText = [
    `Date: ${format(startedAt, 'MMMM d, yyyy')}`,
    `Time: ${format(startedAt, 'h:mm a')} - ${endedAt ? format(endedAt, 'h:mm a') : 'N/A'}`,
    `Duration: ${formatDuration(duration)}`,
  ];

  detailsText.forEach(text => {
    addText(text, margin, yPos, { fontSize: 10, color: grayColor });
    yPos += 5;
  });

  addText(`Sentiment: `, margin, yPos, { fontSize: 10, color: grayColor });
  addText(`${extraction.sentiment.toUpperCase()} (${extraction.sentimentScore}%)`, margin + 25, yPos, { 
    fontSize: 10, 
    color: sentimentColor, 
    bold: true 
  });
  yPos += 12;

  // Transcript Section
  checkNewPage(50);
  addText('FULL TRANSCRIPT', margin, yPos, { fontSize: 12, bold: true });
  yPos += 8;

  doc.setFillColor(249, 250, 251);
  const transcriptText = transcript.map(t => t.text).join('\n\n');
  const transcriptLines = doc.splitTextToSize(transcriptText || 'No transcript recorded', contentWidth - 10);
  const transcriptHeight = Math.min(transcriptLines.length * 4.5, 60);
  
  doc.roundedRect(margin, yPos - 3, contentWidth, transcriptHeight + 10, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...darkColor);
  
  let transcriptY = yPos + 3;
  const maxTranscriptLines = Math.min(transcriptLines.length, 12);
  for (let i = 0; i < maxTranscriptLines; i++) {
    doc.text(transcriptLines[i], margin + 5, transcriptY);
    transcriptY += 4.5;
  }
  if (transcriptLines.length > 12) {
    doc.setTextColor(...grayColor);
    doc.text(`... and ${transcriptLines.length - 12} more lines`, margin + 5, transcriptY);
  }
  
  yPos += transcriptHeight + 15;

  // Summary
  if (summary) {
    checkNewPage(40);
    addText('AI-GENERATED SUMMARY', margin, yPos, { fontSize: 12, bold: true });
    yPos += 8;

    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(...primaryColor);
    const summaryLines = doc.splitTextToSize(summary.summaryText, contentWidth - 15);
    const summaryHeight = summaryLines.length * 5 + 10;
    doc.roundedRect(margin, yPos - 3, contentWidth, summaryHeight, 2, 2, 'F');
    doc.setLineWidth(0.5);
    doc.line(margin, yPos - 3, margin, yPos - 3 + summaryHeight);

    doc.setFontSize(10);
    doc.setTextColor(...darkColor);
    let summaryY = yPos + 3;
    summaryLines.forEach((line: string) => {
      doc.text(line, margin + 8, summaryY);
      summaryY += 5;
    });

    yPos += summaryHeight + 10;
  }

  // Extraction Results - Three columns
  checkNewPage(80);
  addText('EXTRACTION RESULTS', margin, yPos, { fontSize: 12, bold: true });
  yPos += 10;

  const boxWidth = (contentWidth - 10) / 3;
  const boxStartY = yPos;

  // Promises Box
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, boxStartY, boxWidth, 50, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...greenColor);
  doc.setFont('helvetica', 'bold');
  doc.text('PROMISES MADE', margin + 5, boxStartY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkColor);
  
  let promiseY = boxStartY + 15;
  if (extraction.promises.length > 0) {
    extraction.promises.slice(0, 3).forEach(promise => {
      const text = promise.amount 
        ? `• KES ${formatKES(promise.amount)}`
        : `• ${promise.description.slice(0, 30)}...`;
      doc.text(text, margin + 5, promiseY, { maxWidth: boxWidth - 10 });
      promiseY += 8;
    });
  } else {
    doc.setTextColor(...grayColor);
    doc.text('No promises made', margin + 5, promiseY);
  }

  // Objections Box
  doc.setFillColor(254, 252, 232);
  doc.roundedRect(margin + boxWidth + 5, boxStartY, boxWidth, 50, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...yellowColor);
  doc.setFont('helvetica', 'bold');
  doc.text('OBJECTIONS RAISED', margin + boxWidth + 10, boxStartY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkColor);
  
  let objectionY = boxStartY + 15;
  if (extraction.objections.length > 0) {
    extraction.objections.slice(0, 3).forEach(obj => {
      const text = `• [${obj.severity.toUpperCase()}] ${obj.type.replace('_', ' ')}`;
      doc.text(text, margin + boxWidth + 10, objectionY, { maxWidth: boxWidth - 10 });
      objectionY += 8;
    });
  } else {
    doc.setTextColor(...grayColor);
    doc.text('No objections raised', margin + boxWidth + 10, objectionY);
  }

  // Agreements Box
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin + boxWidth * 2 + 10, boxStartY, boxWidth, 50, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('AGREEMENTS REACHED', margin + boxWidth * 2 + 15, boxStartY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkColor);
  
  let agreementY = boxStartY + 15;
  if (extraction.agreements.length > 0) {
    extraction.agreements.slice(0, 3).forEach(agr => {
      const text = `• ${agr.type.replace('_', ' ')}`;
      doc.text(text, margin + boxWidth * 2 + 15, agreementY, { maxWidth: boxWidth - 10 });
      agreementY += 8;
    });
  } else {
    doc.setTextColor(...grayColor);
    doc.text('No agreements reached', margin + boxWidth * 2 + 15, agreementY);
  }

  yPos = boxStartY + 60;

  // Next Actions
  if (summary && summary.nextActions.length > 0) {
    checkNewPage(40);
    addText('RECOMMENDED NEXT ACTIONS', margin, yPos, { fontSize: 12, bold: true });
    yPos += 10;

    summary.nextActions.forEach((action, i) => {
      doc.setFillColor(238, 242, 255);
      doc.roundedRect(margin, yPos - 3, contentWidth, 8, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setTextColor(...darkColor);
      doc.text(`${i + 1}. ${action}`, margin + 5, yPos + 2);
      yPos += 10;
    });
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(
    `Generated by CallNotes AI on ${format(new Date(), 'MMMM d, yyyy h:mm a')}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  // Save the PDF
  const fileName = `call-summary-${customer.name.replace(/\s+/g, '-')}-${format(startedAt, 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
