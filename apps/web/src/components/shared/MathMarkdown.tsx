"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface MathMarkdownProps {
  content: string;
  className?: string;
}

export const MathMarkdown: React.FC<MathMarkdownProps> = ({ content, className = "" }) => {
  if (!content) return null;

  // Pre-process common raw latex notations if not already wrapped in $
  let processed = content;
  
  // Format statement numbers nicely if newline followed by digit and dot
  processed = processed.replace(/\\n/g, "\n");

  return (
    <div className={`prose prose-invert max-w-none text-inherit ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <span className="inline leading-relaxed">{children}</span>,
          strong: ({ children }) => <strong className="font-extrabold text-amber-400">{children}</strong>,
          em: ({ children }) => <em className="italic text-neutral-300">{children}</em>,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-neutral-800 text-amber-300 font-mono text-xs">
              {children}
            </code>
          )
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
};

export default MathMarkdown;
