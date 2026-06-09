import { useChatConversations, ConversationWithDetails } from "@/hooks/useChatConversations";
import { useGlobalOnlineStatus } from "@/hooks/useChatPresence";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import OnlineStatusDot from "./OnlineStatusDot";

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  isAdmin?: boolean;
}

const ConversationList = ({ selectedId, onSelect, isAdmin }: ConversationListProps) => {
  const { data: conversations = [], isLoading } = useChatConversations();
  const onlineUsers = useGlobalOnlineStatus();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) =>
      c.other_user_name.toLowerCase().includes(q) ||
      c.last_message_preview?.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          {isAdmin ? "All Conversations" : "Messages"}
        </h2>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No conversations</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search ? "No results found" : "Start a conversation from a service listing"}
            </p>
          </div>
        ) : (
          filtered.map((conv) => {
            const otherId = conv.customer_id === conv.provider_id ? conv.provider_id : 
              (onlineUsers.has(conv.customer_id) ? conv.customer_id : conv.provider_id);
            // Determine which user is "other" — we need the auth user's ID
            const isOtherOnline = onlineUsers.has(conv.customer_id) || onlineUsers.has(conv.provider_id);
            return (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isSelected={selectedId === conv.id}
                onClick={() => onSelect(conv.id)}
                isOnline={isOtherOnline}
              />
            );
          })
        )}
      </div>
    </>
  );
};

const ConversationItem = ({
  conversation,
  isSelected,
  onClick,
  isOnline,
}: {
  conversation: ConversationWithDetails;
  isSelected: boolean;
  onClick: () => void;
  isOnline: boolean;
}) => {
  const timeAgo = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })
    : "";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50",
        isSelected && "bg-primary/5 border-l-2 border-primary"
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.other_user_avatar || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {conversation.other_user_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <OnlineStatusDot
          online={isOnline}
          className="absolute -bottom-0.5 -right-0.5"
          size="sm"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm text-foreground truncate">
            {conversation.other_user_name}
          </span>
          <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {conversation.last_message_preview || "No messages yet"}
        </p>
      </div>

      {conversation.unread_count > 0 && (
        <Badge className="bg-primary text-primary-foreground text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full px-1.5">
          {conversation.unread_count}
        </Badge>
      )}
    </button>
  );
};

export default ConversationList;
