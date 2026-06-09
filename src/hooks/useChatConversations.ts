import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ConversationWithDetails {
  id: string;
  customer_id: string;
  provider_id: string;
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
  other_user_name: string;
  other_user_avatar: string | null;
  unread_count: number;
}

export function useChatConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["chat-conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      if (!conversations?.length) return [];

      // Gather other-user IDs
      const otherIds = conversations.map((c) =>
        c.customer_id === user!.id ? c.provider_id : c.customer_id
      );
      const uniqueIds = [...new Set(otherIds)];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", uniqueIds);

      // Also fetch cleaner business names for providers
      const { data: cleanerProfiles } = await supabase
        .from("cleaner_profiles")
        .select("user_id, business_name, profile_image")
        .in("user_id", uniqueIds);

      const cleanerMap = new Map(
        (cleanerProfiles || []).map((cp) => [cp.user_id, cp])
      );

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      // Get unread counts per conversation
      const { data: unreadCounts } = await supabase
        .from("messages")
        .select("conversation_id")
        .is("read_at", null)
        .neq("sender_id", user!.id);

      const unreadMap = new Map<string, number>();
      (unreadCounts || []).forEach((m) => {
        const cid = (m as any).conversation_id;
        unreadMap.set(cid, (unreadMap.get(cid) || 0) + 1);
      });

      return conversations.map((c): ConversationWithDetails => {
        const otherId = c.customer_id === user!.id ? c.provider_id : c.customer_id;
        const profile = profileMap.get(otherId);
        const cleaner = cleanerMap.get(otherId);
        const displayName = cleaner?.business_name || profile?.full_name || "Unknown";
        const displayAvatar = cleaner?.profile_image || profile?.avatar_url || null;
        return {
          ...c,
          other_user_name: displayName,
          other_user_avatar: displayAvatar,
          unread_count: unreadMap.get(c.id) || 0,
        };
      });
    },
  });

  // Subscribe to conversation changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("conversations-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
}

export async function getOrCreateConversation(
  customerId: string,
  providerId: string
) {
  // Check existing
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("customer_id", customerId)
    .eq("provider_id", providerId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ customer_id: customerId, provider_id: providerId })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}
