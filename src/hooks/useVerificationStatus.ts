import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type VerificationState = "not_started" | "pending" | "approved" | "rejected" | "partial";

export function useVerificationStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<VerificationState>("not_started");
  const [hasRejection, setHasRejection] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      const { data } = await supabase
        .from("provider_verification_documents")
        .select("status")
        .eq("user_id", user.id);

      if (!data || data.length === 0) {
        setStatus("not_started");
        setHasRejection(false);
      } else {
        const statuses = data.map((d) => d.status);
        const rejected = statuses.some((s) => s === "rejected");
        setHasRejection(rejected);

        if (statuses.every((s) => s === "approved")) {
          setStatus("approved");
        } else if (rejected) {
          setStatus("rejected");
        } else if (statuses.some((s) => s === "pending")) {
          setStatus("pending");
        } else {
          setStatus("partial");
        }
      }
      setLoading(false);
    };

    fetchStatus();

    // Listen for realtime changes to verification documents
    const channel = supabase
      .channel("verification-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "provider_verification_documents",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { status, hasRejection, loading };
}
