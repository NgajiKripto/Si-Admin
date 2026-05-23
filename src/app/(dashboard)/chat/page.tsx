"use client";

import { useState, useCallback } from "react";
import ConversationList from "./components/ConversationList";
import MessageView from "./components/MessageView";
import MessageInput from "./components/MessageInput";

export default function ChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMessageSent = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="flex h-[calc(100vh-7rem)] rounded-lg border bg-card overflow-hidden">
      {/* Left Panel - Conversation List */}
      <div className="w-80 flex-shrink-0">
        <ConversationList
          selectedId={selectedConversation}
          onSelect={setSelectedConversation}
        />
      </div>

      {/* Right Panel - Message View */}
      <div className="flex flex-1 flex-col">
        <MessageView
          key={refreshKey}
          conversationId={selectedConversation}
        />
        <MessageInput
          conversationId={selectedConversation}
          onMessageSent={handleMessageSent}
        />
      </div>
    </div>
  );
}
