import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Maximize2, 
  Minimize2, 
  FileText, 
  ExternalLink,
  AlertCircle,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatFileSize } from './DocumentViewer';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileSize
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Helper to determine if file is PDF or image
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || fileUrl.startsWith('data:image/');
  const isPdf = ext === 'pdf' || fileUrl.includes('application/pdf') || fileUrl.startsWith('data:application/pdf');

  // Convert Data URL to ObjectURL if necessary to bypass browser restrictions on data: URLs in iframes/links
  useEffect(() => {
    if (!isOpen || !fileUrl) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      return;
    }

    setLoadError(false);

    if (fileUrl.startsWith('data:')) {
      try {
        const parts = fileUrl.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : (isPdf ? 'application/pdf' : 'application/octet-stream');
        const byteCharacters = atob(parts[1]);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, { type: mimeType });
        const objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);

        return () => {
          URL.revokeObjectURL(objectUrl);
        };
      } catch (err) {
        console.error('Error creating Blob URL from Data URL:', err);
        setBlobUrl(fileUrl);
      }
    } else {
      setBlobUrl(fileUrl);
    }
  }, [isOpen, fileUrl, isPdf]);

  const effectiveUrl = blobUrl || fileUrl;

  const handleDownload = () => {
    if (!effectiveUrl) return;
    try {
      const link = document.createElement('a');
      link.href = effectiveUrl;
      link.download = fileName || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.open(effectiveUrl, '_blank');
    }
  };

  const handlePrint = () => {
    if (isImage) {
      const win = window.open('');
      if (win) {
        win.document.write(`<img src="${effectiveUrl}" style="max-width:100%;" onload="window.print();window.close()" />`);
        win.document.close();
      }
    } else {
      handleDownload();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 border border-gray-200 dark:border-gray-800 ${
            isFullscreen 
              ? 'fixed inset-2 sm:inset-4 z-50' 
              : 'w-full max-w-5xl h-[88vh]'
          }`}
        >
          {/* Header Bar */}
          <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-xl shrink-0 ${isPdf ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'}`}>
                <FileText size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase text-white ${isPdf ? 'bg-red-600' : 'bg-indigo-600'}`}>
                    {isPdf ? 'PDF' : ext.toUpperCase() || 'DOCUMENT'}
                  </span>
                  {fileSize && (
                    <span className="text-xs text-gray-400 font-medium truncate">
                      {formatFileSize(fileSize)}
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate max-w-xs sm:max-w-md md:max-w-xl" title={fileName}>
                  {fileName}
                </h3>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-sm cursor-pointer"
                title="Télécharger"
              >
                <Download size={15} />
                <span className="hidden sm:inline">Télécharger</span>
              </button>

              <button
                onClick={handlePrint}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer hidden sm:flex"
                title="Imprimer"
              >
                <Printer size={18} />
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer hidden sm:flex"
                title={isFullscreen ? "Réduire" : "Plein écran"}
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>

              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
                title="Fermer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Main Viewer Body */}
          <div className="flex-1 bg-gray-100 dark:bg-gray-950 p-2 sm:p-4 overflow-hidden flex items-center justify-center">
            {loadError ? (
              <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl max-w-md shadow-md border border-gray-200 dark:border-gray-700">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  Aperçu direct indisponible
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Le document est prêt. Vous pouvez le télécharger ou l'ouvrir directement sur votre appareil.
                </p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download size={16} />
                  Télécharger le document
                </button>
              </div>
            ) : isImage ? (
              <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                <img
                  src={effectiveUrl}
                  alt={fileName}
                  className="max-h-full max-w-full object-contain rounded-xl shadow-lg border border-gray-200 dark:border-gray-800"
                  onError={() => setLoadError(true)}
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-800 relative">
                <iframe
                  src={`${effectiveUrl}#toolbar=1&navpanes=0&view=FitH`}
                  className="w-full h-full border-0"
                  title={fileName}
                  onError={() => setLoadError(true)}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default PDFViewerModal;
