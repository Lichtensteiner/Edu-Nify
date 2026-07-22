import React from 'react';
import { FileText, FileSpreadsheet, FileCode, File, Download, ExternalLink } from 'lucide-react';

interface DocumentViewerProps {
  url: string;
  name: string;
  size?: number;
  format?: string;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Document';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ url, name, size, format }) => {
  const ext = (format || name.split('.').pop() || '').toLowerCase();

  const getDocColorAndIcon = () => {
    switch (ext) {
      case 'pdf':
        return {
          bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900',
          badge: 'bg-red-600 text-white',
          text: 'PDF',
          icon: <FileText className="text-red-600 dark:text-red-400" size={24} />
        };
      case 'doc':
      case 'docx':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
          badge: 'bg-blue-600 text-white',
          text: 'DOC',
          icon: <FileText className="text-blue-600 dark:text-blue-400" size={24} />
        };
      case 'xls':
      case 'xlsx':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
          badge: 'bg-emerald-600 text-white',
          text: 'XLS',
          icon: <FileSpreadsheet className="text-emerald-600 dark:text-emerald-400" size={24} />
        };
      case 'ppt':
      case 'pptx':
        return {
          bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900',
          badge: 'bg-orange-600 text-white',
          text: 'PPT',
          icon: <FileCode className="text-orange-600 dark:text-orange-400" size={24} />
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
          badge: 'bg-gray-600 text-white',
          text: ext.toUpperCase() || 'FILE',
          icon: <File className="text-gray-600 dark:text-gray-400" size={24} />
        };
    }
  };

  const docStyle = getDocColorAndIcon();

  return (
    <div className={`flex items-center justify-between p-3.5 rounded-xl border ${docStyle.bg} transition-all hover:shadow-sm`}>
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900 shadow-xs shrink-0 flex items-center justify-center">
          {docStyle.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${docStyle.badge} tracking-wider uppercase`}>
              {docStyle.text}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
              {formatFileSize(size)}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={name}>
            {name}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          download={name}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold transition-colors shadow-xs"
          title="Télécharger ou ouvrir"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Télécharger</span>
        </a>
      </div>
    </div>
  );
};
