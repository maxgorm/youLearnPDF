import React, { useMemo } from 'react';
import type { TextBlock } from '../types/pdf';

// Text processing functions
const cleanText = (text: string): string => {
  // First normalize all line breaks and whitespace
  let cleaned = text.replace(/\n+/g, ' ')  // Replace line breaks with spaces
                   .replace(/\s+/g, ' ')   // Normalize multiple spaces
                   .trim();
  
  // Format citations to ensure they're on one line and properly spaced
  cleaned = cleaned.replace(/\[\s*(\d+(?:\s*,\s*\d+)*)\s*\]/g, (match, nums) => {
    const formattedNums = nums.split(',')
                             .map((n: string) => n.trim())
                             .join(', ');
    return `[${formattedNums}]`;
  });
  
  // Fix mathematical subscripts (e.g., ht-1 -> ht₋₁)
  cleaned = cleaned.replace(/(\w+)[-](\d+)/g, (_, base, num) => {
    const subscriptMap: { [key: string]: string } = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
    };
    return `${base}${num.split('').map((d: string) => subscriptMap[d] || d).join('')}`;
  });
  
  // Final cleanup of double spaces and trim
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  
  return cleaned;
};

interface TranscriptProps {
  blocks: TextBlock[];
  onTextClick: (block: TextBlock) => void;
  highlightedBlock?: TextBlock;
}

const Transcript: React.FC<TranscriptProps> = ({ blocks, onTextClick, highlightedBlock }) => {
  // Group blocks by page
  const blocksByPage = useMemo(() => {
    const grouped = new Map<number, TextBlock[]>();
    blocks.forEach(block => {
      if (!grouped.has(block.page)) {
        grouped.set(block.page, []);
      }
      grouped.get(block.page)?.push(block);
    });
    return new Map([...grouped.entries()].sort((a, b) => a[0] - b[0]));
  }, [blocks]);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-200 px-4 py-3 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Transcript</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {Array.from(blocksByPage.entries()).map(([pageNum, pageBlocks]) => (
          <div key={pageNum} className="mb-6 last:mb-0">
            <h3 className="text-xs font-medium text-gray-500 mb-2 sticky top-0 bg-white py-2 z-10 -mx-4 px-4">
              Page {pageNum}
            </h3>
            <div className="space-y-1.5">
              {pageBlocks.map((block, index) => (
                <div
                  key={index}
                  className={`px-3 py-2 rounded cursor-pointer transition-all ${
                    highlightedBlock === block
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onTextClick(block)}
                >
                  <div className="text-gray-700 text-sm leading-relaxed">{cleanText(block.text)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Transcript;
