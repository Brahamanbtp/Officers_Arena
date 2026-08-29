"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";

interface MapViewerProps {
  src: string;
  alt?: string;
  caption?: string;
}

export const MapViewer: React.FC<MapViewerProps> = ({ src, alt = "Map/Figure Reference", caption }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [scale, setScale] = useState(1);

  // Esc key closes the zoomed state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsZoomed(false);
        setScale(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.max(prev - 0.5, 1));
  };

  return (
    <div className="my-6 map-viewer-container">
      {/* Thumbnail view */}
      <div 
        onClick={() => setIsZoomed(true)}
        className="relative group border rounded-xl overflow-hidden cursor-zoom-in bg-neutral-900/10 border-neutral-200 dark:border-neutral-800 transition-all duration-300 hover:shadow-lg hover:border-neutral-300"
      >
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-auto max-h-80 object-contain mx-auto transition-transform duration-500 group-hover:scale-[1.02]"
        />
        
        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
          <div className="px-4 py-2 bg-black/70 backdrop-blur-md rounded-full text-white text-xs font-semibold tracking-wider uppercase flex items-center gap-2">
            <Maximize2 className="w-3.5 h-3.5" />
            Tactical Analysis Zoom
          </div>
        </div>
      </div>
      
      {caption && (
        <p className="mt-2 text-center text-xs text-neutral-500 font-sans tracking-wide italic">
          {caption}
        </p>
      )}

      {/* Fullscreen interactive zoom overlay */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsZoomed(false);
              setScale(1);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 cursor-zoom-out"
          >
            {/* Control Panel */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
              <button
                onClick={handleZoomIn}
                className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors border border-neutral-700"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors border border-neutral-700"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsZoomed(false);
                  setScale(1);
                }}
                className="p-2.5 bg-red-950/80 hover:bg-red-900/80 text-red-200 rounded-lg transition-colors border border-red-800/50 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
              >
                <Minimize2 className="w-4 h-4" />
                Close
              </button>
            </div>

            {/* Panning / Zoomed Frame */}
            <motion.div
              drag
              dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
              dragElastic={0.1}
              style={{ scale }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[85vh] flex items-center justify-center pointer-events-auto"
            >
              <motion.img
                layoutId={`map-image-${src}`}
                src={src}
                alt={alt}
                className="max-w-full max-h-[80vh] object-contain select-none shadow-2xl rounded-lg"
              />
            </motion.div>

            {/* Bottom Caption Info */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10 px-6 py-2 bg-neutral-900/80 backdrop-blur-md rounded-full border border-neutral-800">
              <span className="text-white text-xs font-sans tracking-wide">
                {caption || alt} (Drag to pan, use top controls to adjust scale)
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
