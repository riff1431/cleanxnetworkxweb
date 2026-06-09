import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { playMessageSound } from "@/lib/sounds";

/**
 * Global hook: listens for new messages via realtime and shows
 * a browser Notification when the user is NOT on a messages page.
 * Also requests notification permission on mount.
 */
export function useMessageNotifications() {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const locationRef = useRef(location.pathname);

  // Keep pathname ref up to date without re-subscribing
  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  // Request permission once
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("global-message-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new as {
            sender_id: string;
            text: string;
            conversation_id: string;
          };

          // Ignore own messages
          if (msg.sender_id === user.id) return;

          // Skip if user is already on a messages page
          const path = locationRef.current;
          if (
            path.includes("/messages")
          ) {
            return;
          }

          // Invalidate unread count
          queryClient.invalidateQueries({ queryKey: ["unread-message-count"] });

          // Try to resolve sender name
          let senderName = "Someone";
          const { data: cleanerProfile } = await supabase
            .from("cleaner_profiles")
            .select("business_name")
            .eq("user_id", msg.sender_id)
            .maybeSingle();

          if (cleanerProfile?.business_name) {
            senderName = cleanerProfile.business_name;
          } else {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", msg.sender_id)
              .maybeSingle();
            if (profile?.full_name) senderName = profile.full_name;
          }

          // Play sound
          playMessageSound();

          // Show browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            const notification = new Notification(`New message from ${senderName}`, {
              body: msg.text?.substring(0, 100) || "Sent an attachment",
              icon: "/favicon.ico",
              tag: `msg-${msg.conversation_id}`,
            });

            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}
