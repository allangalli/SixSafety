"use client";

import type { Message } from "@/lib/actions";

interface ConversationViewProps {
  messages: Message[];
}

export function ConversationView({ messages }: ConversationViewProps) {
  // Filter out system messages
  const visibleMessages = messages.filter((msg) => msg.role !== "system");

  if (visibleMessages.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Conversation History</h3>
      <div className="space-y-4">
        {visibleMessages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
