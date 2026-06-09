import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface PresenceState {
  user_id: string;
  is_typing: boolean;
  online_at: string;
}

/**
 * Hook for managing typing indicators and online status
 * using Supabase Realtime Presence per conversation.
 */
export function useChatPresence(conversationId: string | null) {
  const { user } = useAuth();
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase.channel(`presence-${conversationId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceState>();
        // Check all keys except our own
        let isOnline = false;
        let isTyping = false;

        for (const key of Object.keys(state)) {
          if (key === user.id) continue;
          isOnline = true;
          const presences = state[key] as unknown as PresenceState[];
          if (presences?.some((p) => p.is_typing)) {
            isTyping = true;
          }
        }

        setPartnerOnline(isOnline);
        setPartnerTyping(isTyping);
      })
      .on("presence", { event: "join" }, ({ key }) => {
        if (key !== user.id) setPartnerOnline(true);
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key !== user.id) {
          setPartnerOnline(false);
          setPartnerTyping(false);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            is_typing: false,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, user]);

  const setTyping = useCallback(
    (typing: boolean) => {
      if (!channelRef.current || !user) return;

      channelRef.current.track({
        user_id: user.id,
        is_typing: typing,
        online_at: new Date().toISOString(),
      });

      // Auto-clear typing after 3 seconds
      if (typing) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          channelRef.current?.track({
            user_id: user.id,
            is_typing: false,
            online_at: new Date().toISOString(),
          });
        }, 3000);
      }
    },
    [user]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  return { partnerTyping, partnerOnline, setTyping };
}

/**
 * Global online-status hook: tracks which users are online
 * across all conversations via a shared presence channel.
 */
export function useGlobalOnlineStatus() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel("global-online", {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineUsers(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user]);

  return onlineUsers;
}
