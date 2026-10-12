"use client";

import type { ConversationMessage } from '@/lib/contexts/SurveyContext';
import { UserResponseEcho } from './UserResponseEcho';
import { SectionHeader } from './SectionHeader';
import { AssistantMessage } from './AssistantMessage';
import { RealtimeSummary } from './RealtimeSummary';
import type { SurveyResponse } from '@/lib/schemas/ui-schema';
import { useAutoScroll } from '@/lib/hooks/useAutoScroll';

interface ConversationContainerProps {
  messages: ConversationMessage[];
  summary: string | null;
  children?: React.ReactNode;
}

/**
 * Main container for conversational scroll interface
 * Manages auto-scroll behavior and renders all conversation history
 */
export function ConversationContainer({
  messages,
  summary,
  children,
}: ConversationContainerProps) {
  const { scrollRef, handleScroll } = useAutoScroll(messages.length);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="max-h-[calc(100vh-300px)] overflow-y-auto px-4 py-6 bg-white rounded-lg shadow-sm"
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Render all conversation messages */}
        {messages.map(msg => {
          switch (msg.type) {
            case 'assistant':
              return (
                <AssistantMessage
                  key={msg.id}
                  content={msg.content as string}
                />
              );

            case 'user-response':
              return (
                <UserResponseEcho
                  key={msg.id}
                  response={msg.content as SurveyResponse}
                  questionLabels={msg.metadata?.questionLabels}
                />
              );

            case 'section-header':
              return (
                <SectionHeader
                  key={msg.id}
                  title={msg.content as string}
                />
              );

            case 'summary':
              return (
                <RealtimeSummary
                  key={msg.id}
                  summary={msg.content as string}
                  visible={true}
                />
              );

            default:
              return null;
          }
        })}

        {/* Current summary (if exists) */}
        {summary && (
          <RealtimeSummary
            summary={summary}
            visible={true}
          />
        )}

        {/* Active question form (passed as children) */}
        {children}
      </div>
    </div>
  );
}
