"use client";

import React, { useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Download,
  Maximize2,
  Minimize2
} from "lucide-react";
import { BookAITutorDrawer } from "./BookAITutorDrawer";

export interface BookItem {
  id: string;
  title: string;
  author?: string;
  edition?: string;
  subject: string;
  exam_type: string;
  category: string;
  total_pages: number;
  file_name?: string;
  pdf_url?: string;
}

interface BookReaderModalProps {
  book: BookItem;
  onClose: () => void;
}

export const BookReaderModal: React.FC<BookReaderModalProps> = ({ book, onClose }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showAITutor, setShowAITutor] = useState<boolean>(false);

  const totalPages = book.total_pages || 1;
  const pdfSource = `http://localhost:8000/api/books/${book.id}/pdf#page=${currentPage}&toolbar=1&navpanes=1`;

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
      setCurrentPage(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-md flex flex-col h-screen w-screen overflow-hidden text-neutral-100 font-sans animate-in fade-in duration-200">
      
      {/* Top Navigation Bar */}
      <header className="h-14 bg-neutral-900 border-b border-neutral-800 px-3 sm:px-4 flex items-center justify-between shrink-0 shadow-md">
        
        {/* Left: Book Meta */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold truncate text-white max-w-[140px] sm:max-w-[280px] md:max-w-[420px]">
              {book.title}
            </h2>
            <p className="text-[10px] text-neutral-400 truncate">
              {book.author ? `${book.author} • ` : ""}Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>

        {/* Center: Quick Page Jump */}
        <div className="flex items-center gap-1 sm:gap-2 bg-neutral-950/80 border border-neutral-800 rounded-lg px-2 py-1">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-0.5 sm:p-1 rounded hover:bg-neutral-800 text-neutral-300 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <div className="flex items-center gap-1 text-[11px] sm:text-xs">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={handlePageInputChange}
              className="w-9 sm:w-11 bg-neutral-800 border border-neutral-700 rounded px-1 py-0.5 text-center text-white font-mono text-xs focus:outline-none focus:border-amber-500"
            />
            <span className="text-neutral-500 text-[10px] sm:text-xs">/ {totalPages}</span>
          </div>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-0.5 sm:p-1 rounded hover:bg-neutral-800 text-neutral-300 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Toggle AI Tutor */}
          <button
            type="button"
            onClick={() => setShowAITutor((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              showAITutor
                ? "bg-amber-500 text-neutral-950 border-amber-400 shadow-md shadow-amber-500/20"
                : "bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showAITutor ? "Hide AI Tutor" : "Ask AI Tutor"}</span>
          </button>

          {/* Download Original PDF */}
          <a
            href={`http://localhost:8000/api/books/${book.id}/pdf`}
            download={book.file_name || "book.pdf"}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-all hidden md:flex cursor-pointer"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Close Modal */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-500/20 hover:text-red-400 text-neutral-400 border border-neutral-700 transition-all cursor-pointer"
            title="Close Reader"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Dual-Pane Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left/Main Pane: Authentic PDF Viewer */}
        <div
          className={`h-full flex flex-col bg-neutral-950 transition-all duration-300 ${
            showAITutor ? "w-full lg:w-[62%] xl:w-[67%]" : "w-full"
          }`}
        >
          <div className="flex-1 w-full h-full relative bg-neutral-900/50">
            <iframe
              src={pdfSource}
              className="w-full h-full border-0 bg-neutral-950"
              title={book.title}
            />
          </div>
        </div>

        {/* Right Pane: AI Tutor Sidecar (Desktop: Split Screen, Mobile/Tablet: Slide-Over Drawer) */}
        {showAITutor && (
          <div className="fixed inset-y-14 right-0 z-40 w-full sm:w-[420px] lg:static lg:w-[38%] xl:w-[33%] lg:h-full shadow-2xl bg-neutral-950 border-l border-neutral-800 transition-all duration-300">
            <div className="h-full flex flex-col">
              <div className="lg:hidden flex items-center justify-between p-3 border-b border-neutral-800 bg-neutral-900">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Tutor Sidecar
                </span>
                <button
                  type="button"
                  onClick={() => setShowAITutor(false)}
                  className="p-1 rounded-lg bg-neutral-800 text-neutral-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <BookAITutorDrawer
                  bookId={book.id}
                  bookTitle={book.title}
                  currentPage={currentPage}
                  totalPages={totalPages}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BookReaderModal;
