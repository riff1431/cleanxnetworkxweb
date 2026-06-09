import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  reference_id: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TopUpRequest {
  id: string;
  user_id: string;
  wallet_id: string;
  amount: number;
  payment_method: string;
  status: string;
  rejection_reason: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useWallet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    if (!user) return;
    try {
      // Try to get existing wallet
      let { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // Create wallet if it doesn't exist
      if (!data) {
        const { data: newWallet, error: createError } = await supabase
          .from("wallets")
          .insert({ user_id: user.id })
          .select()
          .single();
        if (createError) throw createError;
        data = newWallet;
      }

      setWallet(data as Wallet);
    } catch (err) {
      console.error("Error fetching wallet:", err);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions((data || []) as WalletTransaction[]);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  const fetchTopUpRequests = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("wallet_topup_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTopUpRequests((data || []) as TopUpRequest[]);
    } catch (err) {
      console.error("Error fetching top-up requests:", err);
    }
  };

  const requestTopUp = async (amount: number, paymentMethod: string = "bank_transfer") => {
    if (!user || !wallet) return;
    try {
      const { error } = await supabase
        .from("wallet_topup_requests")
        .insert({
          user_id: user.id,
          wallet_id: wallet.id,
          amount,
          payment_method: paymentMethod,
        });

      if (error) throw error;
      toast({ title: "Top-up request submitted", description: "Your request will be verified by admin." });
      await fetchTopUpRequests();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const refetch = async () => {
    setLoading(true);
    await Promise.all([fetchWallet(), fetchTransactions(), fetchTopUpRequests()]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user]);

  return {
    wallet,
    transactions,
    topUpRequests,
    loading,
    requestTopUp,
    refetch,
  };
};
