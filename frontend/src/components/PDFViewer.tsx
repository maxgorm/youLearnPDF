import React from 'react';
import type { TextBlock } from '../types/pdf';

interface PDFViewerProps {
  url: string;
  blocks: TextBlock[];
  onTextClick: (block: TextBlock) => void;
  highlightedBlock?: TextBlock;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url }) => {
  return (
    <div className="h-full w-full bg-white rounded-lg overflow-hidden relative">
      <iframe
        src={url}
        className="w-full h-full border-0"
        title="PDF Viewer"
        style={{ minHeight: '100%' }}
      />
    </div>
  );
};

export default PDFViewer;
