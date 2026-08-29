"use client";

import React from "react";
import { MathRenderer } from "../shared/MathRenderer";
import { MapViewer } from "../shared/MapViewer";

interface QuestionRendererProps {
  text: string;
  imageUrls?: Record<string, string>; // Maps IMAGE_REF UUIDs to URLs
}

/**
 * QuestionRenderer parses question text, extracting [IMAGE_REF:uuid] tokens
 * and rendering them using the interactive Zoomable MapViewer, interleaved with LaTeX markdown.
 */
export const QuestionRenderer: React.FC<QuestionRendererProps> = ({ text, imageUrls = {} }) => {
  // Regex to match [IMAGE_REF:uuid_or_string]
  const imageRegex = /\[IMAGE_REF:([a-f0-9\-]+)\]/gi;

  // Split text by the image tag to interleave text and image components
  const parts = text.split(imageRegex);
  const matches = [...text.matchAll(imageRegex)];

  if (matches.length === 0) {
    return <MathRenderer content={text} />;
  }

  return (
    <div className="flex flex-col gap-4 question-renderer">
      {parts.map((part, index) => {
        // Even indices are text blocks
        if (index % 2 === 0) {
          if (!part.trim()) return null;
          return <MathRenderer key={`text-${index}`} content={part} />;
        }

        // Odd indices correspond to the captures from the regex (the UUID)
        const matchIndex = Math.floor(index / 2);
        const imageUuid = matches[matchIndex]?.[1];
        
        // Resolve URL from map or fallback to server route
        const imgSrc = imageUrls[imageUuid] || `/api/v1/images/${imageUuid}`;
        
        return (
          <MapViewer
            key={`img-${imageUuid}-${index}`}
            src={imgSrc}
            alt={`Tactical Exhibit (${imageUuid})`}
            caption="Reference Exhibit: Click to open tactical pan & zoom interface"
          />
        );
      })}
    </div>
  );
};
