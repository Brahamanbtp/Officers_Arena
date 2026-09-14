import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import "katex/dist/katex.min.css";

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * MathRenderer compiles markdown and renders block & inline LaTeX equations.
 * Wrapped in React.memo to prevent expensive re-renders on timer ticks.
 */
export const MathRenderer: React.FC<MathRendererProps> = React.memo(({ content, className = "", inline = false }) => {
  // Pre-process content to ensure loose TeX symbols are wrapped in $ ... $ and FormFeed/mangled TeX is repaired
  const formattedContent = React.useMemo(() => {
    if (!content) return "";
    let processed = content;
    
    // 1. Repair control character and escape artifacts
    processed = processed.replace(/(\\?[\x09\t]|\\+\s*)(?=ext\{|ext\b)/g, "\\text");
    processed = processed.replace(/(\\?[\x09\t]|\\+\s*)(?=heta\b)/g, "\\theta");
    processed = processed.replace(/(\\?[\x09\t]|\\+\s*)(?=an\b)/g, "\\tan");
    processed = processed.replace(/(\\?[\x09\t]|\\+\s*)(?=riangle\b)/g, "\\triangle");
    processed = processed.replace(/(\\?[\x09\t]|\\+\s*)(?=imes\b)/g, "\\times");
    processed = processed.replace(/(\\?[\x09\t]|\\+\s*)(?=au\b)/g, "\\tau");

    processed = processed.replace(/\\+\s*ext\{/g, "\\text{");
    processed = processed.replace(/\\+\s*ext\b/g, "\\text");
    processed = processed.replace(/\\+\s*heta\b/g, "\\theta");
    processed = processed.replace(/\\+\s*an\b/g, "\\tan");
    processed = processed.replace(/\\+\s*riangle\b/g, "\\triangle");
    processed = processed.replace(/\\+\s*imes\b/g, "\\times");
    processed = processed.replace(/\\+\s*au\b/g, "\\tau");

    // Carriage return (\x0d / \r) artifacts
    processed = processed.replace(/\\+\s*ight\b/g, "\\right");
    processed = processed.replace(/\\+\s*ho\b/g, "\\rho");

    // FormFeed (\x0c / \f) artifacts
    processed = processed.replace(/\\+\s*rac(?=\{|\b)/g, "\\frac");
    processed = processed.replace(/\\f\\frac/g, "\\frac");
    processed = processed.replace(/\x0c/g, "");

    // Backspace (\x08 / \b) artifacts: \beta -> \x08eta
    processed = processed.replace(/[\x08]eta\b/g, "\\beta");
    processed = processed.replace(/\\+\s*egin\b/g, "\\begin");

    // Bell (\x07 / \a) artifacts
    processed = processed.replace(/\\+\s*lpha\b/g, "\\alpha");
    processed = processed.replace(/\\+\s*ngle\b/g, "\\angle");

    // Remove control bytes
    processed = processed.replace(/\x09/g, " ").replace(/\x0d/g, "").replace(/\x08/g, "").replace(/\x07/g, "");

    // 2. Repair mangled English words
    processed = processed.replace(/\bW\s+or\s+d\b/g, "Word");
    processed = processed.replace(/\bw\s+or\s+d\b/g, "word");
    processed = processed.replace(/\bch\s+or\s+d\b/g, "chord");
    processed = processed.replace(/\bf\s+or\s+m\b/g, "form");
    processed = processed.replace(/\bst\s+or\s+m\b/g, "storm");
    processed = processed.replace(/\bsnowst\s+or\s+m\b/g, "snowstorm");
    processed = processed.replace(/\bthunderst\s+or\s+m\b/g, "thunderstorm");
    processed = processed.replace(/\bm\s+or\s+e\b/g, "more");
    processed = processed.replace(/\bbef\s+or\s+e\b/g, "before");
    processed = processed.replace(/\bst\s+or\s+e\b/g, "store");
    processed = processed.replace(/\bimpor\s*(\$\\tant\$|\\?\s*tant)\b/g, "important");
    processed = processed.replace(/\bimpor\s*(\$\\tance\$|\\?\s*tance)\b/g, "importance");
    processed = processed.replace(/\brec\s*(\$\\tangular\$|\\?\s*tangular)\b/g, "rectangular");
    processed = processed.replace(/\brec\s*(\$\\tangle\$|\\?\s*tangle)\b/g, "rectangle");
    processed = processed.replace(/\bdis\s*(\$\\tance\$|\\?\s*tance)\b/g, "distance");
    processed = processed.replace(/\bdis\s*(\$\\tances\$|\\?\s*tances)\b/g, "distances");
    processed = processed.replace(/\binter\s*(\$\\section\$|\\?\s*section)\b/g, "intersection");
    processed = processed.replace(/\binter\s*(\$\\sects\$|\\?\s*sects)\b/g, "intersects");
    processed = processed.replace(/\binter\s*(\$\\sect\$|\\?\s*sect)\b/g, "intersect");
    processed = processed.replace(/\bunders\s*(\$\\tand\$|\\?\s*tand)\b/g, "understand");
    processed = processed.replace(/\bunders\s*(\$\\tanding\$|\\?\s*tanding)\b/g, "understanding");
    processed = processed.replace(/\bu\s*(\$\\sing\$|\\?\s*sing)\b/g, "using");
    processed = processed.replace(/\btraver\s*(\$\\sing\$|\\?\s*sing)\b/g, "traversing");
    processed = processed.replace(/\$\s*\\text\{ends\}\s*\$/g, "extends");
    processed = processed.replace(/\bextm\b/g, "m");
    processed = processed.replace(/\bextcm\b/g, "cm");

    // 3. Repair unescaped frac/sqrt expressions
    processed = processed.replace(/(?<!\\)\bfrac\s*1?\s*sqrt\s*(\d+)\s*([\+\-])\s*sqrt\s*(\d+)/g, "\\frac{1}{\\sqrt{$1} $2 \\sqrt{$3}}");
    processed = processed.replace(/(?<!\\)\bsqrt\s*(\d+)/g, "\\sqrt{$1}");
    processed = processed.replace(/(?<!\\)\bfrac\b/g, "\\frac");

    // Fix \text units and spacing
    processed = processed.replace(/(\\text\{|\b)(\d+)\s*\\?\s*text\{\s*([a-zA-Z]+)\s*\}/g, "$2 \\text{$3}");
    processed = processed.replace(/(\d+)\s*\\?\s*ext\{\s*([a-zA-Z]+)\s*\}/g, "$1 \\text{$2}");
    processed = processed.replace(/\\?\s*text\{\s*m\s*\}/g, "\\text{m}");
    processed = processed.replace(/\\?\s*text\{\s*cm\s*\}/g, "\\text{cm}");

    // Repair OCR mangled fractions
    processed = processed.replace(/\\frac\s*(\d+)\s*([A-Za-z]+)\s*(\d+)/g, "\\frac{$1 $2}{$3}");
    processed = processed.replace(/\\frac\s*(\d+)\s*(\d+)/g, "\\frac{$1}{$2}");

    // Fix OCR 'andy' / 'and' / 'or' concatenation
    processed = processed.replace(/([a-zA-Z0-9\.]+)\s*and([a-zA-Z])\b/g, "$1 and $2");
    processed = processed.replace(/([a-zA-Z0-9\.]+)\s*or([a-zA-Z])\b/g, "$1 or $2");

    // Degree & circ fixes
    processed = processed.replace(/\^\{?circ\}?/g, "^{\\circ}");
    processed = processed.replace(/(\d+)\s*\\?circ\b/g, "$1^{\\circ}");

    // Fix coso / cos o -> \cos 0
    processed = processed.replace(/\\?cos\s*o\b/gi, "\\cos 0");

    // Trig function backslashes & spacing
    processed = processed.replace(/([a-zA-Z0-9])\\?(sin|cos|tan|cot|sec|cosec|log)/g, "$1 \\$2");
    processed = processed.replace(/\\(sin|cos|tan|cot|sec|cosec|log)(\d+)/g, "\\$1 $2");

    // 4. Unwrap plain text in single dollars or split options containing 'and'/'or'
    if (processed.startsWith("$") && processed.endsWith("$") && processed.split("$").length === 3) {
      const inner = processed.slice(1, -1).trim();
      const hasTexKeywords = /\\(angle|frac|degree|pi|theta|sqrt|triangle|text|log|circ)\b/.test(inner);
      const hasMathOperators = /[\^_\=\+\/\(\)]/.test(inner);
      if (/^[A-Za-z0-9\s\-\(\),]+$/.test(inner) && !hasTexKeywords && !hasMathOperators) {
        return inner;
      }
      if (inner.includes(" and ")) {
        const parts = inner.split(" and ");
        return parts.map(p => `$${p.trim()}$`).join(" and ");
      }
      if (inner.includes(" or ")) {
        const parts = inner.split(" or ");
        return parts.map(p => `$${p.trim()}$`).join(" or ");
      }
    }

    // 5. Auto-wrap unescaped \angle, \frac, \degree, \pi, \theta if not inside dollars
    const texRegex = /(\\angle|\\frac|\\degree|\\pi|\\theta|\\sqrt|\\triangle|\\text|\\log|\\cos|\\sin|\\tan|\\cot)\b/;
    if (texRegex.test(processed) && !processed.includes("$")) {
      processed = `$${processed.trim()}$`;
    }

    return processed;
  }, [content]);

  return (
    <div className={`prose dark:prose-invert max-w-none math-renderer ${inline ? "inline-block" : ""} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" />
          ),
          p: ({ node, ...props }) => (
            <p {...props} className={`${inline ? "m-0 mb-0 inline" : "mb-4"} leading-relaxed font-inherit`} />
          ),
          span: ({ node, className, ...props }) => {
            const isKatex = className?.includes("katex");
            const combinedClassName = `${className || ""} ${isKatex ? "font-serif inline-block mx-0.5" : ""}`.trim();
            return <span {...props} className={combinedClassName} />;
          }
        }}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
});

MathRenderer.displayName = "MathRenderer";
