"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AssistantMessageProps {
  content: string;
  isInitial?: boolean;
}

/**
 * Display AI assistant questions with proper markdown rendering
 * No chat bubble - just styled text content inline with form
 */
export function AssistantMessage({ content, isInitial = false }: AssistantMessageProps) {
  return (
    <div className={`prose prose-sm max-w-none mb-4 ${isInitial ? 'mb-6' : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          strong: ({ node, ...props }) => (
            <span className="font-semibold text-gray-900" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside space-y-1 my-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-1 my-2" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-gray-700 my-2 leading-relaxed" {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold text-gray-900 mb-3" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold text-gray-900 mb-2" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold text-gray-900 mb-2" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
