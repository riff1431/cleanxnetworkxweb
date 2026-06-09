import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

let cachedKey: string | null = null;
let fetchPromise: Promise<string> | null = null;

export const useGoogleMapsKey = () => {
  const [apiKey, setApiKey] = useState<string | null>(cachedKey);
  const [loading, setLoading] = useState(!cachedKey);

  useEffect(() => {
    if (cachedKey) {
      setApiKey(cachedKey);
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = supabase.functions
        .invoke("get-maps-key")
        .then(({ data, error }) => {
          if (error) throw error;
          cachedKey = data.key;
          return data.key;
        })
        .catch((err) => {
          console.error("Failed to fetch Maps API key:", err);
          fetchPromise = null;
          return null;
        });
    }

    fetchPromise.then((key) => {
      setApiKey(key);
      setLoading(false);
    });
  }, []);

  return { apiKey, loading };
};
