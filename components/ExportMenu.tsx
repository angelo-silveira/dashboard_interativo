import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Share2, Download, FileText, Image, X, Mail, ChevronRight, ArrowLeft, Smartphone } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';

interface ExportMenuProps {
  targetRef: React.RefObject<HTMLDivElement>;
  lang: Language;
  onClose: () => void;
}

type ShareChannel = 'whatsapp' | 'email' | 'download' | null;

// Helper to convert dataURL to Blob for sharing
const dataURItoBlob = (dataURI: string) => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

const ExportMenu: React.FC<ExportMenuProps> = ({ targetRef, lang, onClose }) => {
  const t = getTranslation(lang);
  const [generating, setGenerating] = useState(false);
  const [activeChannel, setActiveChannel] = useState<ShareChannel>(null);

  const processAndShare = async (format: 'jpg' | 'pdf') => {
    setGenerating(true);
    const timestamp = new Date().getTime();
    const filename = `dashboard_report_${timestamp}`;
    
    try {
      const element = targetRef.current;
      if (!element) throw new Error("Content not found");

      // 1. Prepare for Full Capture
      // Save current scroll position
      const originalScrollTop = element.scrollTop;
      const originalOverflow = element.style.overflow;
      
      // Temporarily scroll to top to assist html2canvas
      element.scrollTop = 0;

      // Generate Canvas with Full Height config
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: window.getComputedStyle(document.body).backgroundColor,
        height: element.scrollHeight, // Capture full scrollable height
        windowHeight: element.scrollHeight,
        x: 0,
        y: 0
      });

      // Restore scroll and style
      element.scrollTop = originalScrollTop;
      element.style.overflow = originalOverflow;

      // 2. Create File/Blob
      let blob: Blob;
      let file: File;

      if (format === 'jpg') {
        const jpgData = canvas.toDataURL('image/jpeg', 0.8);
        blob = dataURItoBlob(jpgData);
        file = new File([blob], `${filename}.jpg`, { type: 'image/jpeg' });
      } else {
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        const pdf = new jsPDF('l', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        blob = pdf.output('blob');
        file = new File([blob], `${filename}.pdf`, { type: 'application/pdf' });
      }

      // 3. Share or Download Logic
      
      // Check if the browser supports direct file sharing (Web Share API Level 2)
      // This works on most mobile browsers (Chrome Android, Safari iOS)
      if (activeChannel !== 'download' && navigator.canShare && navigator.canShare({ files: [file] })) {
         try {
           await navigator.share({
             files: [file],
             title: t.title,
             text: `${t.shareTitle} - ${t.execSubtitle}`
           });
           // Success - no fallback needed
         } catch (shareError) {
           console.log("Share cancelled or failed", shareError);
           // If user cancelled, we do nothing. If error, maybe fallback?
           // Usually better to just let the user retry or use download.
         }
      } else {
        // Fallback for Desktop or unsupported browsers: Download + Text Link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Open text link for context if channel is selected
        if (activeChannel === 'whatsapp') {
             const text = encodeURIComponent(`${t.shareTitle} - ${t.execSubtitle}.`);
             // Allow time for download to start before opening new tab
             setTimeout(() => window.open(`https://wa.me/?text=${text}`, '_blank'), 500);
        } else if (activeChannel === 'email') {
             const subject = encodeURIComponent(t.title);
             const body = encodeURIComponent(`${t.shareTitle}\n\n${t.shareHint}`);
             setTimeout(() => window.open(`mailto:?subject=${subject}&body=${body}`, '_blank'), 500);
        }
      }

    } catch (e) {
      console.error(e);
      alert("Error generating report");
    } finally {
      setGenerating(false);
    }
  };

  const renderChannelSelection = () => (
    <div className="grid gap-3">
      {/* WhatsApp */}
      <button 
        onClick={() => setActiveChannel('whatsapp')}
        className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-slate-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-700 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-full text-green-600 dark:text-green-400">
            <Share2 className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="font-bold text-gray-800 dark:text-gray-100 text-lg">{t.shareWA}</div>
            <div className="text-xs text-gray-400">{t.shareHint}</div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-500" />
      </button>

      {/* Email */}
      <button 
        onClick={() => setActiveChannel('email')}
        className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-slate-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-700 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-full text-purple-600 dark:text-purple-400">
            <Mail className="w-6 h-6" />
          </div>
          <div className="text-left">
             <div className="font-bold text-gray-800 dark:text-gray-100 text-lg">{t.shareEmail}</div>
             <div className="text-xs text-gray-400">{t.shareHint}</div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500" />
      </button>

      {/* Download Only */}
      <button 
        onClick={() => setActiveChannel('download')}
        className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all group mt-2"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-600 dark:text-gray-400">
            <Download className="w-6 h-6" />
          </div>
          <div className="text-left">
             <div className="font-bold text-gray-800 dark:text-gray-100 text-lg">{t.saveDevice}</div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
      </button>
    </div>
  );

  const renderFormatSelection = () => (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-2 mb-2">
        <button 
          onClick={() => setActiveChannel(null)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-gray-700 dark:text-gray-200">{t.selectFormat}</span>
      </div>

      <div className="grid gap-3">
        {/* JPG Selection */}
        <button 
          onClick={() => processAndShare('jpg')}
          disabled={generating}
          className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-200 dark:hover:border-blue-500 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Image className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-800 dark:text-gray-100">{t.downloadJPG}</div>
              <div className="text-xs text-gray-400">{t.formatJpgDesc}</div>
            </div>
          </div>
        </button>

        {/* PDF Selection */}
        <button 
          onClick={() => processAndShare('pdf')}
          disabled={generating}
          className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-slate-700 hover:border-red-200 dark:hover:border-red-500 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-800 dark:text-gray-100">{t.downloadPDF}</div>
              <div className="text-xs text-gray-400">{t.formatPdfDesc}</div>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-900/50">
        <p className="text-xs text-yellow-700 dark:text-yellow-400 text-center">
          {t.shareHint}
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-slate-700 transform transition-all">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-700/30">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-500" />
            {t.shareMenu}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full transition-colors text-gray-500 dark:text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t.shareSub}</p>

          {activeChannel === null ? renderChannelSelection() : renderFormatSelection()}
        </div>
        
        {/* Loading Overlay */}
        {generating && (
          <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center">
               <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
               <span className="text-sm font-bold text-gray-700 dark:text-gray-300 animate-pulse">{t.generating}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ExportMenu;