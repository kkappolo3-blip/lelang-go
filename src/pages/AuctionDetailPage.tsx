import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuctionBids } from '@/hooks/useAuctions';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CountdownTimer } from '@/components/CountdownTimer';
import { BidModal } from '@/components/BidModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gavel, TrendingUp, Users, Clock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bidOpen, setBidOpen] = useState(false);

  const { data: auction, isLoading } = useQuery({
    queryKey: ['auction', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auctions')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
    enabled: !!id,
  });

  const { data: bids, isLoading: bidsLoading } = useAuctionBids(id ?? '');

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!auction) {
    return (
      <main className="container py-16 text-center">
        <Gavel className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <h1 className="mt-4 font-display text-2xl font-bold">Lelang tidak ditemukan</h1>
        <Button asChild className="mt-6"><Link to="/">Kembali ke Beranda</Link></Button>
      </main>
    );
  }

  const isActive = auction.status === 'active';
  const isComingSoon = auction.status === 'coming_soon';
  const price = auction.current_price || auction.start_price;

  const handleBid = () => {
    if (!user) { navigate('/auth'); return; }
    setBidOpen(true);
  };

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Lelang', href: '/' },
        { label: auction.title, href: `/lelang/${auction.id}` },
      ]} />

      <main className="container space-y-8 py-6 pb-16">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
            {auction.image_url ? (
              <img src={auction.image_url} alt={auction.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center"><Gavel className="h-16 w-16 text-muted-foreground/30" /></div>
            )}
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className={isActive ? 'absolute right-4 top-4 gradient-primary border-0 text-primary-foreground' : 'absolute right-4 top-4'}
            >
              {isActive ? 'LIVE' : isComingSoon ? 'Akan Datang' : 'Selesai'}
            </Badge>
          </div>

          {/* Info */}
          <div className="space-y-6">
            <header>
              <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">{auction.title}</h1>
              {auction.description && (
                <p className="mt-3 text-muted-foreground">{auction.description}</p>
              )}
            </header>

            <Card>
              <CardContent className="grid grid-cols-2 gap-4 p-5">
                <div>
                  <p className="text-xs text-muted-foreground">Harga saat ini</p>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="font-display text-2xl font-bold text-primary">{price.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">Koin</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isComingSoon ? 'Status' : 'Sisa waktu'}</p>
                  {isComingSoon ? (
                    <span className="font-medium">Belum dibuka</span>
                  ) : (
                    <CountdownTimer endsAt={auction.ends_at} className="font-display text-lg font-semibold" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Harga awal</p>
                  <p className="font-semibold">{auction.start_price.toLocaleString()} Koin</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kelipatan bid</p>
                  <p className="font-semibold">{auction.bid_increment.toLocaleString()} Koin</p>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleBid}
              disabled={!isActive}
              size="lg"
              className="w-full gradient-primary text-primary-foreground font-semibold"
            >
              <Gavel className="mr-2 h-5 w-5" />
              {isActive ? 'Bid Sekarang' : isComingSoon ? 'Akan Datang' : 'Lelang Berakhir'}
            </Button>

            <div className="flex items-start gap-2 rounded-lg bg-accent/50 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 flex-shrink-0 text-primary" />
              <span>Dilindungi escrow garansi 72 jam. Anti-sniper aktif: bid di 5 menit terakhir akan memperpanjang waktu 2 menit.</span>
            </div>
          </div>
        </div>

        {/* Bid History */}
        <section aria-label="Riwayat bid">
          <header className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Riwayat Bid</h2>
              <p className="text-sm text-muted-foreground">{bids?.length ?? 0} bid masuk untuk lelang ini</p>
            </div>
          </header>

          <Card>
            <CardContent className="p-0">
              {bidsLoading ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}
                </div>
              ) : bids && bids.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Pengguna</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead className="text-right">Waktu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bids.map((bid: any, idx: number) => (
                      <TableRow key={bid.id}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {(bid.profiles as any)?.display_name || 'Anonim'}
                            {idx === 0 && <Badge className="gradient-primary border-0 text-primary-foreground text-[10px]">TERTINGGI</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-display font-semibold text-primary">
                          {bid.amount.toLocaleString()} Koin
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          <div className="flex items-center justify-end gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true, locale: idLocale })}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center">
                  <Gavel className="mx-auto h-10 w-10 text-muted-foreground/30" />
                  <p className="mt-3 text-muted-foreground">Belum ada bid. Jadilah yang pertama!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <BidModal
        open={bidOpen}
        onClose={() => setBidOpen(false)}
        auction={auction as any}
      />
    </>
  );
}
