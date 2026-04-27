import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAuctions() {
  return useQuery({
    queryKey: ['auctions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auctions')
        .select('*')
        .in('status', ['active', 'ended', 'coming_soon'])
        .order('ends_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 5000,
  });
}

export function useAuctionBids(auctionId: string) {
  return useQuery({
    queryKey: ['bids', auctionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bids')
        .select('*, profiles!bids_user_id_fkey(display_name)')
        .eq('auction_id', auctionId)
        .order('amount', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 3000,
  });
}
