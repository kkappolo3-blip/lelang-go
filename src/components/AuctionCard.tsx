import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CountdownTimer } from '@/components/CountdownTimer';
import { BidModal } from '@/components/BidModal';
import { Gavel, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';

interface AuctionCardProps {
  auction: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    start_price: number;
    current_price: number;
    bid_increment: number;
    status: string;
    ends_at: string;
  };
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const [bidOpen, setBidOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isActive = auction.status === 'active';
  const isComingSoon = auction.status === 'coming_soon';
  const price = auction.current_price || auction.start_price;

  const handleBid = () => {
    if (!user) { navigate('/auth'); return; }
    setBidOpen(true);
  };

  return (
    <>
      <Card className="group overflow-hidden border bg-card transition-all hover:shadow-lg">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {auction.image_url ? (
            <img src={auction.image_url} alt={auction.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Gavel className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className={isActive ? 'absolute right-3 top-3 gradient-primary border-0 text-primary-foreground' : 'absolute right-3 top-3'}
          >
            {isActive ? 'LIVE' : 'Selesai'}
          </Badge>
        </div>

        <CardHeader className="pb-2">
          <h3 className="font-display text-lg font-semibold leading-tight text-card-foreground line-clamp-2">{auction.title}</h3>
          {auction.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{auction.description}</p>
          )}
        </CardHeader>

        <CardContent className="space-y-3 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Harga saat ini</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-display text-xl font-bold text-primary">{price.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">Koin</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Sisa waktu</p>
              <CountdownTimer endsAt={auction.ends_at} className="text-sm" />
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            onClick={handleBid}
            disabled={!isActive}
            className="w-full gradient-primary text-primary-foreground font-semibold"
          >
            <Gavel className="mr-2 h-4 w-4" />
            {isActive ? 'Bid Sekarang' : 'Lelang Berakhir'}
          </Button>
        </CardFooter>
      </Card>

      <BidModal
        open={bidOpen}
        onClose={() => setBidOpen(false)}
        auction={auction}
      />
    </>
  );
}
