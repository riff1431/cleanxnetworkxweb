import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import ConversationList from "./ConversationList";
import ChatRoom from "./ChatRoom";

interface ChatLayoutProps {
  /** Admin mode: read-only view of all conversations */
  isAdmin?: boolean;
  /** Pre-select a conversation on mount */
  initialConversationId?: string | null;
}

const ChatLayout = ({ isAdmin = false, initialConversationId = null }: ChatLayoutProps) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialConversationId);
  const isMobile = useIsMobile();

  // Sync with initialConversationId when it changes (e.g. URL query param update)
  useEffect(() => {
    if (initialConversationId) {
      setSelectedConversationId(initialConversationId);
    }
  }, [initialConversationId]);
  const showInbox = isMobile ? !selectedConversationId : true;
  const showChat = isMobile ? !!selectedConversationId : true;

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-0 rounded-xl border border-border bg-card overflow-hidden">
      {/* Inbox */}
      {showInbox && (
        <div
          className={cn(
            "flex flex-col border-r border-border bg-background",
            isMobile ? "w-full" : "w-[340px] shrink-0"
          )}
        >
          <ConversationList
            selectedId={selectedConversationId}
            onSelect={setSelectedConversationId}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {/* Chat Room */}
      {showChat && (
        <div className="flex-1 flex flex-col min-w-0">
          <ChatRoom
            conversationId={selectedConversationId}
            onBack={isMobile ? () => setSelectedConversationId(null) : undefined}
            isAdmin={isAdmin}
          />
        </div>
      )}
    </div>
  );
};

export default ChatLayout;
