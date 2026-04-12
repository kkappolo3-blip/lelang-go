import { useAuctions } from '@/hooks/useAuctions';
import { AuctionCard } from '@/components/AuctionCard';
import { Gavel, Zap, ShieldCheck, Clock } from 'lucide-react';

export default function Index() {
  const { data: auctions, isLoading } = useAuctions();

  return (
    <div className="space-y-10 pb-16">
      {/* Hero */}
      <section className="gradient-hero rounded-b-3xl px-4 py-16 text-center">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <h1 className="font-display text-3xl font-bold text-primary-foreground md:text-5xl">
              Marketplace Lelang
              <br />
              <span className="bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
                Digital Terpercaya
              </span>
            </h1>
            <p className="mt-4 text-primary-foreground/70">
              Dapatkan software & lisensi premium dengan harga terbaik melalui sistem lelang yang aman dan transparan.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-4">
            {[
              { icon: Zap, label: 'Real-time Bidding', desc: 'Anti-sniper system' },
              { icon: ShieldCheck, label: 'Escrow Garansi', desc: '72 jam perlindungan' },
              { icon: Clock, label: 'Auto Settlement', desc: 'Proses otomatis' },
            ].map((f) => (
              <div key={f.label} className="rounded-xl bg-primary-foreground/10 p-4 backdrop-blur-sm">
                <f.icon className="mx-auto h-6 w-6 text-teal-300" />
                <p className="mt-2 text-sm font-semibold text-primary-foreground">{f.label}</p>
                <p className="text-xs text-primary-foreground/60">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auction List */}
      <section className="container">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <Gavel className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">War Room</h2>
            <p className="text-sm text-muted-foreground">Lelang aktif saat ini</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : auctions && auctions.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-16 text-center">
            <Gavel className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 font-display text-lg font-semibold text-muted-foreground">Belum ada lelang aktif</p>
            <p className="text-sm text-muted-foreground">Nantikan lelang menarik berikutnya!</p>
          </div>
        )}
      </section>
    </div>
  );
}
