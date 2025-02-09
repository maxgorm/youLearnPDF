'use client';

import React, { useState } from 'react';
import PDFViewer from '../components/PDFViewer';
import Transcript from '../components/Transcript';
import type { TextBlock } from '../types/pdf';

export default function Home() {
  const [url, setUrl] = useState('');
  const [blocks, setBlocks] = useState<TextBlock[]>([]);
  const [highlightedBlock, setHighlightedBlock] = useState<TextBlock>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setBlocks([]);
    setHighlightedBlock(undefined);

    try {
      const response = await fetch('http://34.44.75.250:8000/api/v1/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setBlocks(data.blocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleTextClick = (block: TextBlock) => {
    setHighlightedBlock(block);
  };

  return (
    <main className="min-h-screen flex flex-col bg-accent relative">
      {blocks.length > 0 ? (
        <div className="flex flex-col min-h-screen max-h-screen">
          <div className="px-6 py-3">
            <h1 
              onClick={() => window.location.reload()} 
              className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors"
            >
              PDF Text Extractor
            </h1>
          </div>
          <div className="flex gap-6 px-6 pb-6" style={{ height: 'calc(100vh - 60px)' }}>
            <div className="flex-1 bg-white rounded-2xl shadow-lg overflow-hidden">
              <PDFViewer
                url={url}
                blocks={blocks}
                onTextClick={handleTextClick}
                highlightedBlock={highlightedBlock}
              />
            </div>
            <div className="w-[400px] bg-white rounded-2xl shadow-lg overflow-hidden">
              <Transcript
                blocks={blocks}
                onTextClick={handleTextClick}
                highlightedBlock={highlightedBlock}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-background rounded-[24px] shadow-2xl p-8 sm:p-12">
              <h1 className="text-4xl sm:text-5xl font-black text-center mb-8 sm:mb-12 tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700">PDF Text </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-blue-400">Extractor</span>
              </h1>
              
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Enter PDF URL here..."
                      className="w-full px-6 py-4 text-base sm:text-lg border-2 border-secondary hover:border-secondary-foreground/20 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-colors duration-200 outline-none bg-secondary/50"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-4 bg-gradient-to-r from-primary via-blue-500 to-blue-400 text-primary-foreground text-base sm:text-lg font-bold rounded-2xl hover:from-blue-600 hover:via-blue-500 hover:to-blue-400 disabled:from-blue-300 disabled:via-blue-200 disabled:to-blue-100 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:hover:scale-100 whitespace-nowrap"
                  >
                    {loading ? 'Processing...' : 'Extract Text'}
                  </button>
                </div>
                {error && (
                  <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                    {error}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
