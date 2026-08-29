import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import "katex/dist/katex.min.css";

interface MathRendererProps {
  content: string;
  className?: string;
}

/**
 * MathRenderer compiles markdown and renders block & inline LaTeX equations.
 * Wrapped in React.memo to prevent expensive re-renders on timer ticks.
 */
export const MathRenderer: React.FC<MathRendererProps> = React.memo(({ content, className = "" }) => {
  return (
    <div className={`prose dark:prose-invert max-w-none math-renderer ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Render links nicely
          a: ({ node, ...props }) => (
            <a {...props} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" />
          ),
          // Custom styles for paragraphs
          p: ({ node, ...props }) => <p {...props} className="mb-4 leading-relaxed font-inherit" />,
          // KaTeX block wrapper styles
          span: ({ node, ...props }) => {
            const isKatex = props.className?.includes("katex");
            return <span {...props} className={isKatex ? "font-serif inline-block mx-0.5" : ""} />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

MathRenderer.displayName = "MathRenderer";
