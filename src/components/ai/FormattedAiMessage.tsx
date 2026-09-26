"use client";

import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface FormattedAiMessageProps {
  content: string;
  className?: string;
}

/**
 * Preprocesses raw LLM content to ensure seamless Markdown + KaTeX rendering:
 * 1. Resolves escaped dollar signs (\$$ or \$)
 * 2. Normalizes LaTeX brackets \[ ... \] to display math ($$...$$)
 * 3. Normalizes LaTeX parentheses \( ... \) to inline math ($...$)
 * 4. Ensures standalone single-line $$equation$$ gets newline padding for remark-math display block parsing
 * 5. Streaming safety: repairs unclosed single $ at end of partial text
 */
function preprocessContent(content: string): string {
  if (!content) return "";
  let text = content;

  // Unescape double/single escaped dollar signs from LLMs
  text = text.replace(/\\(\$\$?)/g, "$1");

  // Standardize LaTeX display block syntax: \[ ... \] -> $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n\n$$\n${math.trim()}\n$$\n\n`);

  // Standardize LaTeX inline syntax: \( ... \) -> $ ... $
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);

  // Ensure single-line $$equation$$ gets isolated with newlines for block parsing
  text = text.replace(/(?:^|\n)\s*\$\$([^\n$]+)\$\$\s*(?:\n|$)/g, (_, math) => `\n\n$$\n${math.trim()}\n$$\n\n`);

  // Streaming safety: If text ends with an odd count of unclosed '$', temporarily close it to prevent parser errors
  const dollarCount = (text.match(/(?<!\\)\$/g) || []).length;
  if (dollarCount % 2 !== 0 && !text.endsWith("$$")) {
    text = `${text}$`;
  }

  return text;
}

/**
 * Secure URL validator: permits only safe http, https, mailto, and relative/anchor links.
 * Blocks javascript:, data:, vbscript: to completely prevent XSS.
 */
function sanitizeUrl(url?: string): string {
  if (!url) return "#";
  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }
  return "#";
}

export const FormattedAiMessage = memo(function FormattedAiMessage({
  content,
  className = ""
}: FormattedAiMessageProps) {
  const processed = preprocessContent(content);

  return (
    <div className={`formatted-ai-content font-sans text-sm leading-relaxed text-slate-200 ${className}`}>
      {/* KaTeX Display Equation OLED Dark Glass Card Styling */}
      <style jsx global>{`
        .formatted-ai-content .katex-display {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          margin: 1.25rem 0 !important;
          padding: 1rem 1.5rem !important;
          background: rgba(10, 10, 10, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-radius: 0.875rem !important;
          box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.8), 0 0 15px rgba(255, 255, 255, 0.02) !important;
          overflow-x: auto !important;
          color: #ffffff !important;
        }
        .formatted-ai-content .katex {
          font-size: 1.05em !important;
          color: #f1f5f9 !important;
        }
      `}</style>

      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          [
            rehypeKatex,
            {
              throwOnError: false,
              errorColor: "#38bdf8",
              strict: false
            }
          ]
        ]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-white mt-4 mb-2 pb-1 border-b border-white/10 tracking-tight" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-lg sm:text-xl font-serif font-bold text-white mt-3.5 mb-2 tracking-tight flex items-center gap-2" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-base font-semibold text-slate-100 mt-3 mb-1.5" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-sm font-semibold text-slate-200 mt-2.5 mb-1" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-3 leading-relaxed text-slate-200 last:mb-0 text-[13.5px] sm:text-[14px]" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-white tracking-wide" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-slate-300" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-5 mb-3 space-y-1.5 text-slate-200 text-[13.5px]" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-slate-200 text-[13.5px]" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-2 border-slate-500 bg-white/[0.04] pl-3.5 py-1.5 my-3 rounded-r text-slate-300 italic" {...props} />
          ),
          code: ({ node, inline, className: codeClass, children, ...props }: any) => {
            const isInline = !codeClass && !String(children).includes("\n");
            if (isInline) {
              return (
                <code className="bg-white/[0.07] text-slate-200 border border-white/10 rounded px-1.5 py-0.5 font-mono text-xs" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-black border border-white/10 rounded-xl p-3 my-3 overflow-x-auto font-mono text-xs text-slate-100 shadow-inner max-w-full">
                <code {...props}>{children}</code>
              </pre>
            );
          },
          a: ({ node, href, children, ...props }) => {
            const safeHref = sanitizeUrl(href);
            return (
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline decoration-cyan-500/40 underline-offset-2 hover:text-cyan-300 transition-colors"
                {...props}
              >
                {children}
              </a>
            );
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-white/10">
              <table className="w-full text-xs text-left border-collapse" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="bg-zinc-900 text-white border border-white/10 px-3 py-2 font-semibold" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-white/10 px-3 py-1.5 text-slate-300" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-4 border-white/10" {...props} />
          )
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
});

export default FormattedAiMessage;
