'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

export function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn('vl-markdown text-[15px] leading-relaxed text-foreground/90', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground flex items-center gap-2 first:mt-0">{children}</h3>,
          h3: ({ children }) => <h4 className="mt-4 mb-2 text-sm font-semibold text-foreground">{children}</h4>,
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1.5 marker:text-teal-600">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1.5 marker:text-teal-600 marker:font-semibold">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          a: ({ children, href }) => (
            <a href={href} className="text-teal-700 underline underline-offset-2 hover:text-teal-900" target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
          code: ({ children }) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">{children}</code>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-teal-500 pl-3 text-muted-foreground italic">{children}</blockquote>,
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border-b bg-muted/60 px-3 py-2 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-b px-3 py-2 align-top">{children}</td>,
          hr: () => <hr className="my-4 border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
