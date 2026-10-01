'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, ZoomIn, ZoomOut, CheckCircle2, Bookmark, ShieldCheck, ExternalLink, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface CitationBox {
  id: string;
  page: number;
  sentence: string;
  source: string;
  chapter: string;
  boundingBox: {
    top: number; // percentage
    left: number; // percentage
    width: number; // percentage
    height: number; // percentage
  };
  relevanceExplanation: string;
  pyqFrequency: number;
}

const SAMPLE_CITATIONS: CitationBox[] = [
  {
    id: 'cit-1',
    page: 42,
    source: 'M. Laxmikanth - Indian Polity (7th Ed.)',
    chapter: 'Chapter 7: Fundamental Rights (Article 21)',
    sentence: 'The Supreme Court in the Menaka Gandhi case (1978) overruled the Gopalan case (1950) by taking a wider interpretation of Article 21, holding that the right to life and personal liberty of a person can be deprived by a law provided the procedure prescribed by that law is reasonable, fair and just (Due Process of Law).',
    boundingBox: { top: 28, left: 10, width: 80, height: 14 },
    relevanceExplanation: 'Canonical source for Prelims 2018 Q.21 on "Due Process of Law vs Procedure Established by Law".',
    pyqFrequency: 6
  },
  {
    id: 'cit-2',
    page: 118,
    source: 'M. Laxmikanth - Indian Polity (7th Ed.)',
    chapter: 'Chapter 14: Center-State Relations (Article 356)',
    sentence: 'In the S.R. Bommai case (1994), the Supreme Court laid down propositions regarding President Rule: The presidential proclamation is subject to judicial review, and the satisfaction of the President must be based on relevant material.',
    boundingBox: { top: 52, left: 12, width: 76, height: 16 },
    relevanceExplanation: 'Crucial citation for Mains GS2 Federalism and Judicial Review safeguards against Article 356 misuse.',
    pyqFrequency: 9
  },
  {
    id: 'cit-3',
    page: 204,
    source: 'Ramesh Singh - Indian Economy (15th Ed.)',
    chapter: 'Chapter 12: Monetary Policy & Inflation',
    sentence: 'Under the Flexible Inflation Targeting (FIT) framework established in 2016, the Reserve Bank of India has statutory mandate to maintain CPI headline inflation at 4% with a tolerance band of +/- 2% over a 5-year cycle.',
    boundingBox: { top: 35, left: 8, width: 84, height: 13 },
    relevanceExplanation: 'Direct benchmark tested in UPSC CSE Prelims 2020 & CDS 2022-II.',
    pyqFrequency: 5
  }
];

export const InteractivePdfHighlighter: React.FC = () => {
  const [selectedCitation, setSelectedCitation] = useState<CitationBox>(SAMPLE_CITATIONS[0]);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<'source' | 'verification'>('source');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-base tracking-tight">Zero-Hallucination Textbook Highlighter</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> 100% Verified
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">Pixel-accurate sentence bounding boxes from standard UPSC reference editions</p>
          </div>
        </div>

        {/* Citation Selector Tabs */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          {SAMPLE_CITATIONS.map((cit, idx) => (
            <button
              key={cit.id}
              onClick={() => setSelectedCitation(cit)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCitation.id === cit.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Doc #{idx + 1}: P.{cit.page}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[500px]">
        {/* Left / Center PDF Page Simulation */}
        <div className="lg:col-span-7 bg-slate-950/60 p-6 flex flex-col items-center justify-center border-r border-slate-800/80 relative">
          {/* Zoom controls */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg z-10 text-xs text-slate-300">
            <button 
              onClick={() => setZoomLevel(prev => Math.max(80, prev - 10))}
              className="p-1 hover:text-white"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] px-1">{zoomLevel}%</span>
            <button 
              onClick={() => setZoomLevel(prev => Math.min(130, prev + 10))}
              className="p-1 hover:text-white"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Virtual Simulated Book Page */}
          <div 
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
            className="w-full max-w-[480px] bg-amber-50/95 text-slate-900 rounded-lg p-8 shadow-2xl border border-amber-200/60 relative transition-transform duration-200 select-none"
          >
            {/* Page Header */}
            <div className="border-b border-amber-200 pb-2 mb-4 flex justify-between items-center text-[10px] font-serif text-slate-500">
              <span>{selectedCitation.source}</span>
              <span>Page {selectedCitation.page}</span>
            </div>

            {/* Simulated Textbook Text with Glowing Bounding Box */}
            <div className="space-y-3 font-serif text-[11px] leading-relaxed text-slate-700 relative">
              <p className="opacity-40">
                The Constitution of India guarantees fundamental safeguards against arbitrary state action. In historical jurisprudence, various landmark interpretations have expanded the horizons of personal liberties...
              </p>

              {/* Highlighted Bounding Box Target */}
              <div className="relative my-2">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={selectedCitation.id}
                  className="p-2.5 rounded bg-amber-200/80 border-2 border-amber-500 text-slate-950 font-medium shadow-md relative"
                >
                  <div className="absolute -top-2.5 -right-2 bg-amber-500 text-slate-950 font-sans font-bold text-[9px] px-1.5 py-0.5 rounded shadow">
                    Verified Citation
                  </div>
                  {selectedCitation.sentence}
                </motion.div>
              </div>

              <p className="opacity-40">
                Subsequent benches consistently reiterated this principle in numerous constitutional judgments, ensuring that neither the executive nor legislature encroaches upon fundamental rights without satisfying procedural fairness.
              </p>
            </div>

            {/* Page Footer */}
            <div className="mt-8 pt-3 border-t border-amber-200 text-center font-serif text-[9px] text-slate-400">
              — {selectedCitation.chapter} —
            </div>
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="lg:col-span-5 p-6 bg-slate-900/50 flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">Context & Ground Truth</span>
              <h4 className="text-white font-bold text-base mt-1">{selectedCitation.chapter}</h4>
              <p className="text-slate-400 text-xs mt-1">{selectedCitation.source}</p>
            </div>

            {/* Citation Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                Exact Textual Match
              </div>
              <p className="text-slate-300 text-xs italic leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                "{selectedCitation.sentence}"
              </p>
            </div>

            {/* Examination Relevance */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 mb-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Why This Citation Matters
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                {selectedCitation.relevanceExplanation}
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] border-t border-amber-500/20 pt-2">
                <span className="text-slate-400">Historical PYQ Frequency:</span>
                <span className="font-bold text-amber-400">{selectedCitation.pyqFrequency} Questions</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 mt-4 flex items-center justify-between">
            <span className="text-slate-500 text-xs">Page {selectedCitation.page} of 984</span>
            <button className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700">
              <span>Open in Full Reader</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
