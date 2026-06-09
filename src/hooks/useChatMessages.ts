import { useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  attachment_url: string | null;
  read_at: string | null;
  created_at: string;
}

const PAGE_SIZE = 30;

export function useChatMessages(conversationId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["chat-messages", conversationId],
    enabled: !!conversationId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      return (data || []) as ChatMessage[];
    },
  });

  // Mark messages as read
  useEffect(() => {
    if (!conversationId || !user || !query.data?.length) return;

    const unread = query.data.filter(
      (m) => m.sender_id !== user.id && !m.read_at
    );

    if (unread.length > 0) {
      const ids = unread.map((m) => m.id);
      supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", ids)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
        });
    }
  }, [conversationId, user, query.data, queryClient]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          queryClient.setQueryData(
            ["chat-messages", conversationId],
            (old: ChatMessage[] | undefined) => {
              if (!old) return [newMsg];
              if (old.find((m) => m.id === newMsg.id)) return old;
              return [...old, newMsg];
            }
          );

          // Mark as read if from other user
          if (newMsg.sender_id !== user.id) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMsg.id)
              .then(() => {
                queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
              });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as ChatMessage;
          queryClient.setQueryData(
            ["chat-messages", conversationId],
            (old: ChatMessage[] | undefined) => {
              if (!old) return old;
              return old.map((m) => (m.id === updated.id ? updated : m));
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, queryClient]);

  const sendMessage = useCallback(
    async (text: string, attachmentUrl?: string) => {
      if (!conversationId || !user || !text.trim()) return;

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        text: text.trim(),
        attachment_url: attachmentUrl || null,
      });

      if (error) throw error;
    },
    [conversationId, user]
  );

  return { ...query, sendMessage };
}
