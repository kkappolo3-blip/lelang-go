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
        .select('*')
        .eq('auction_id', auctionId)
        .order('amount', { ascending: false })
        .limit(10);
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const userIds = [...new Set(data.map((b: any) => b.user_id))];
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);
      const map = new Map((profs ?? []).map((p: any) => [p.user_id, p.display_name]));
      return data.map((b: any) => ({ ...b, profiles: { display_name: map.get(b.user_id) ?? 'Unknown' } }));
    },
    refetchInterval: 3000,
  });
}
