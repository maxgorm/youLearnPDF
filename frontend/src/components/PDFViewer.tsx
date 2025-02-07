import React, { useEffect, useRef, useState } from 'react';
import type { TextBlock } from '../types/pdf';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFViewerProps {
  url: string;
  blocks: TextBlock[];
  onTextClick: (block: TextBlock) => void;
  highlightedBlock?: TextBlock;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url, blocks, onTextClick, highlightedBlock }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [numPages, setNumPages] = useState(0);
  const [renderTask, setRenderTask] = useState<pdfjsLib.RenderTask | null>(null);

  // Load the PDF document
  useEffect(() => {
    const loadPDF = async () => {
      try {
        const doc = await pdfjsLib.getDocument(url).promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };
    loadPDF();
  }, [url]);

  // Render the current page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        // Cancel any ongoing render task
        if (renderTask) {
          await renderTask.cancel();
        }

        const page = await pdfDoc.getPage(currentPageNum);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Clear previous content
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Render PDF page
        const newRenderTask = page.render({
          canvasContext: context,
          viewport: viewport,
        });

        setRenderTask(newRenderTask);

        await newRenderTask.promise;

        // Draw bounding box if there's a highlighted block
        if (highlightedBlock && highlightedBlock.page === currentPageNum) {
          const [x0, y0, x1, y1] = highlightedBlock.bbox;
          
          // Get page dimensions
          const { width: pageWidth, height: pageHeight } = viewport;
          
          // Get page dimensions from mediaBox
          const [, , pageOrigWidth, pageOrigHeight] = page.view;
          
          // Convert coordinates to viewport scale
          const scaledX0 = x0 / pageOrigWidth * pageWidth;
          const scaledX1 = x1 / pageOrigWidth * pageWidth;
          // Y coordinates are already in top-down system (y=0 at top)
          const scaledY0 = y0 / pageOrigHeight * pageHeight;
          const scaledY1 = y1 / pageOrigHeight * pageHeight;

          // Calculate dimensions
          const boxWidth = scaledX1 - scaledX0;
          const boxHeight = scaledY1 - scaledY0;

          // Save context state
          context.save();

          // Draw semi-transparent highlight
          context.fillStyle = 'rgba(0, 123, 255, 0.2)';
          context.fillRect(
            scaledX0,
            scaledY0, // Start from top (Y0)
            boxWidth,
            boxHeight
          );

          // Draw border
          context.strokeStyle = 'rgba(0, 123, 255, 0.5)';
          context.lineWidth = 2;
          context.strokeRect(
            scaledX0,
            scaledY0,
            boxWidth,
            boxHeight
          );

          // Restore context state
          context.restore();
        }
      } catch (error) {
        if (error instanceof Error && error.message !== 'Rendering cancelled') {
          console.error('Error rendering page:', error);
        }
      }
    };

    renderPage();

    // Cleanup function to cancel render task
    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPageNum, scale, highlightedBlock]);

  // Update page when highlighted block changes
  useEffect(() => {
    if (highlightedBlock && highlightedBlock.page !== currentPageNum) {
      setCurrentPageNum(highlightedBlock.page);
    }
  }, [highlightedBlock]);

  // Handle zoom in/out
  const handleZoom = (delta: number) => {
    setScale(prevScale => Math.max(0.5, Math.min(3, prevScale + delta)));
  };

  // Handle page navigation
  const handlePageChange = (delta: number) => {
    setCurrentPageNum(prev => Math.max(1, Math.min(numPages, prev + delta)));
  };

  return (
    <div className="h-full w-full bg-white rounded-lg overflow-hidden relative" ref={containerRef}>
      <div className="absolute top-4 right-4 space-x-2 z-10 flex items-center">
        <div className="flex items-center space-x-2 mr-4">
          <button
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            onClick={() => handlePageChange(-1)}
            disabled={currentPageNum <= 1}
          >
            ←
          </button>
          <span className="text-sm">
            {currentPageNum} / {numPages}
          </span>
          <button
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            onClick={() => handlePageChange(1)}
            disabled={currentPageNum >= numPages}
          >
            →
          </button>
        </div>
        <button
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
          onClick={() => handleZoom(0.1)}
        >
          +
        </button>
        <button
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
          onClick={() => handleZoom(-0.1)}
        >
          -
        </button>
      </div>
      <div className="h-full w-full overflow-auto">
        <canvas ref={canvasRef} className="mx-auto" />
      </div>
    </div>
  );
};

export default PDFViewer;
