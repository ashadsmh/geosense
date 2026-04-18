'use client';

import { useState } from 'react';

interface ExportButtonProps {
  address: string;
  reportId: string;
}

export default function ExportButton({ address, reportId }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const generatePDF = async () => {
    if (typeof window === 'undefined') return;
    
    setIsLoading(true);
    setError(false);

    try {
      // Show PDF header
      document.getElementById('pdf-header')?.style.setProperty('display', 'block');

      // Hide elements
      const elementsToHide = [
        'geosense-nav',
        'export-btn', 
        'lot-diagram-section',
        'report-stepper',
        'executive-summary-card'
      ];
      const originalDisplays: Record<string, string> = {};
      elementsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          originalDisplays[id] = el.style.display;
          el.style.display = 'none';
        }
      });

      // Temporarily disable scroll snap for PDF capture
      const htmlEl = document.documentElement;
      const originalSnap = htmlEl.style.scrollSnapType;
      htmlEl.style.scrollSnapType = 'none';
      htmlEl.style.overflow = 'visible';
      
      // Make all sections visible
      const originalSectionDisplays: Record<number, string> = {};
      document.querySelectorAll('[data-step]').forEach((el, index) => {
        originalSectionDisplays[index] = (el as HTMLElement).style.display;
        (el as HTMLElement).style.minHeight = 'auto';
        (el as HTMLElement).style.overflow = 'visible';
        (el as HTMLElement).style.setProperty('display', 'flex', 'important');
      });

      // Wait 300ms for DOM to settle
      await new Promise(r => setTimeout(r, 600));

      // Generate PDF
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = document.getElementById('geosense-report-content');
      
      const filename = `GeoSense-Report-${
        address
          .replace(/[^a-zA-Z0-9]/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 50)
      }.pdf`;
      
      const options = {
        margin: [12, 12, 12, 12],
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          scrollY: 0,
          windowWidth: 1200,
          logging: false
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        },
        pagebreak: { 
          mode: ['css', 'legacy'],
          avoid: ['.no-break', '.metric-card', 
                  '.spec-card', '.receipt-card']
        }
      };
      
      await html2pdf().set(options).from(element).save();

      // Restore hidden elements
      elementsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.display = originalDisplays[id] || '';
        }
      });
      
      // Hide PDF header again
      document.getElementById('pdf-header')?.style.setProperty('display', 'none');
      
      // Restore scroll snap
      htmlEl.style.scrollSnapType = originalSnap;
      htmlEl.style.overflow = '';
      
      // Restore section heights
      document.querySelectorAll('[data-step]').forEach((el, index) => {
        (el as HTMLElement).style.minHeight = '100vh';
        (el as HTMLElement).style.overflow = 'hidden';
        (el as HTMLElement).style.display = originalSectionDisplays[index] || '';
      });

      setIsLoading(false);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError(true);
      setIsLoading(false);
      
      // Restore elements on error
      const elementsToHide = [
        'geosense-nav',
        'export-btn', 
        'lot-diagram-section',
        'report-stepper',
        'executive-summary-card'
      ];
      elementsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.display = '';
        }
      });
      document.getElementById('pdf-header')?.style.setProperty('display', 'none');
      document.documentElement.style.scrollSnapType = 'y mandatory';
      document.documentElement.style.overflow = '';
      document.querySelectorAll('[data-step]').forEach(el => {
        (el as HTMLElement).style.minHeight = '100vh';
        (el as HTMLElement).style.overflow = 'hidden';
        (el as HTMLElement).style.display = ''; // Let react style take over
      });

      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="flex flex-col items-center relative" id="export-btn-wrapper">
      <button
        id="export-btn"
        onClick={generatePDF}
        disabled={isLoading}
        className={
          isLoading
            ? "flex items-center gap-2 text-sm font-medium text-gray-400 border border-gray-200 rounded-lg px-4 py-2 cursor-not-allowed"
            : "flex items-center gap-2 text-sm font-medium text-green-700 border border-green-700 rounded-lg px-4 py-2 hover:bg-green-50 transition-colors"
        }
      >
        {isLoading ? (
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        )}
        {isLoading ? 'Generating PDF...' : 'Export PDF'}
      </button>
      {error && (
        <span className="text-red-500 text-xs absolute -bottom-5 whitespace-nowrap">Export failed — please try again</span>
      )}
    </div>
  );
}
