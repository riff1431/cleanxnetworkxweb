import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Subscribes the current user to Web Push notifications.
 * Fetches the VAPID public key from an edge function, requests
 * push permission, and stores the subscription in the database.
 */
export function usePushSubscription() {
  const { user } = useAuth();
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!user || subscribedRef.current) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const subscribe = async () => {
      try {
        // 1. Get VAPID public key
        const { data, error } = await supabase.functions.invoke("get-vapid-key");
        if (error || !data?.publicKey) {
          console.warn("[Push] Could not fetch VAPID key:", error);
          return;
        }

        const vapidPublicKey = data.publicKey;

        // 2. Wait for service worker
        const registration = await navigator.serviceWorker.ready;

        // 3. Check existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          // Request permission
          const permission = await Notification.requestPermission();
          if (permission !== "granted") return;

          // Subscribe
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
          });
        }

        // 4. Save subscription to database
        const subJson = subscription.toJSON();
        const { error: dbError } = await supabase
          .from("push_subscriptions")
          .upsert(
            {
              user_id: user.id,
              endpoint: subJson.endpoint!,
              p256dh: subJson.keys!.p256dh,
              auth: subJson.keys!.auth,
            },
            { onConflict: "user_id,endpoint" }
          );

        if (dbError) {
          console.warn("[Push] Failed to save subscription:", dbError);
        } else {
          subscribedRef.current = true;
          console.log("[Push] Subscribed successfully");
        }
      } catch (err) {
        console.warn("[Push] Subscription error:", err);
      }
    };

    subscribe();
  }, [user]);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
