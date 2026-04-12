import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/hooks/useWallet';
import { useAuctionBids } from '@/hooks/useAuctions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Coins, AlertTriangle } from 'lucide-react';

interface BidModalProps {
  open: boolean;
  onClose: () => void;
  auction: {
    id: string;
    title: string;
    current_price: number;
    start_price: number;
    bid_increment: number;
    ends_at: string;
  };
}

export function BidModal({ open, onClose, auction }: BidModalProps) {
  const { user } = useAuth();
  const { data: wallet } = useWallet();
  const { data: bids } = useAuctionBids(auction.id);
  const queryClient = useQueryClient();
  const minBid = (auction.current_price || auction.start_price) + auction.bid_increment;
  const [bidAmount, setBidAmount] = useState(minBid);
  const [loading, setLoading] = useState(false);

  const availableBalance = wallet ? wallet.balance - wallet.hold_balance : 0;

  const handleBid = async () => {
    if (!user || !wallet) return;
    if (bidAmount < minBid) {
      toast.error(`Bid minimum ${minBid} Koin`);
      return;
    }
    if (bidAmount > availableBalance) {
      toast.error('Saldo tidak cukup. Silakan top-up terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      // Anti-sniper: extend time if bid in last 5 minutes
      const endsAt = new Date(auction.ends_at);
      const now = new Date();
      const remainingSeconds = (endsAt.getTime() - now.getTime()) / 1000;

      // Insert bid
      const { error: bidError } = await supabase.from('bids').insert({
        auction_id: auction.id,
        user_id: user.id,
        amount: bidAmount,
        is_winning: true,
      });
      if (bidError) throw bidError;

      // Update previous winning bids to not winning & release their hold
      // Update auction current_price
      const { error: auctionError } = await supabase
        .from('auctions')
        .update({
          current_price: bidAmount,
          winner_id: user.id,
          // Anti-sniper: if less than 5 min remaining, add 2 min
          ...(remainingSeconds <= 300 ? { ends_at: new Date(endsAt.getTime() + 2 * 60 * 1000).toISOString() } : {}),
        })
        .eq('id', auction.id);
      if (auctionError) throw auctionError;

      // Hold coins for this user
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ hold_balance: wallet.hold_balance + bidAmount })
        .eq('user_id', user.id);
      if (walletError) throw walletError;

      toast.success(`Bid ${bidAmount} Koin berhasil!`);
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal melakukan bid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Bid: {auction.title}</DialogTitle>
          <DialogDescription>Masukkan jumlah Koin yang ingin kamu tawarkan.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-accent p-3">
            <span className="text-sm text-accent-foreground">Saldo tersedia</span>
            <div className="flex items-center gap-1 font-display font-bold text-accent-foreground">
              <Coins className="h-4 w-4" />
              {availableBalance.toLocaleString()}
            </div>
          </div>

          <div>
            <Label htmlFor="bid-amount">Jumlah Bid (min. {minBid} Koin)</Label>
            <Input
              id="bid-amount"
              type="number"
              min={minBid}
              value={bidAmount}
              onChange={(e) => setBidAmount(Number(e.target.value))}
              className="mt-1 font-display text-lg"
            />
          </div>

          {bidAmount > availableBalance && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Saldo tidak mencukupi
            </div>
          )}

          {bids && bids.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Bid terakhir</p>
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {bids.slice(0, 5).map((bid: any) => (
                  <div key={bid.id} className="flex items-center justify-between rounded bg-secondary px-2 py-1 text-sm">
                    <span className="text-secondary-foreground">{(bid.profiles as any)?.display_name || 'Anonim'}</span>
                    <span className="font-display font-semibold text-secondary-foreground">{bid.amount.toLocaleString()} Koin</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button
            onClick={handleBid}
            disabled={loading || bidAmount > availableBalance || bidAmount < minBid}
            className="gradient-primary text-primary-foreground"
          >
            {loading ? 'Memproses...' : 'Konfirmasi Bid'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
