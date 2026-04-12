import { useMyTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CountdownTimer } from '@/components/CountdownTimer';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, AlertTriangle, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function TransactionsPage() {
  const { user, loading } = useAuth();
  const { data: transactions, isLoading } = useMyTransactions();
  const queryClient = useQueryClient();
  const [complainId, setComplainId] = useState<string | null>(null);
  const [complainNote, setComplainNote] = useState('');

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const handleComplete = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'completed' as any, completed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Transaksi selesai!');
      queryClient.invalidateQueries({ queryKey: ['my-transactions'] });
    }
  };

  const handleComplain = async () => {
    if (!complainId) return;
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'complained' as any, complained_at: new Date().toISOString(), complaint_note: complainNote })
      .eq('id', complainId);
    if (error) toast.error(error.message);
    else {
      toast.success('Komplain dikirim. Admin akan meninjau.');
      queryClient.invalidateQueries({ queryKey: ['my-transactions'] });
      setComplainId(null);
      setComplainNote('');
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      warranty: { label: 'Masa Garansi', variant: 'secondary' },
      completed: { label: 'Selesai', variant: 'default' },
      complained: { label: 'Dikomplain', variant: 'destructive' },
      refunded: { label: 'Refund', variant: 'destructive' },
    };
    const s = map[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
          <ShieldCheck className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold">Transaksi Saya</h1>
          <p className="text-sm text-muted-foreground">Riwayat lelang yang kamu menangkan</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : transactions && transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map((tx: any) => (
            <Card key={tx.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-card-foreground">{tx.auctions?.title}</h3>
                      {statusBadge(tx.status)}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Harga akhir: <strong>{tx.final_price.toLocaleString()} Koin</strong></p>

                    {tx.status === 'warranty' && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Garansi berakhir:</span>
                          <CountdownTimer endsAt={tx.warranty_ends_at} className="text-sm" />
                        </div>

                        {/* License info */}
                        {tx.auctions?.license_key && (
                          <div className="rounded-lg bg-accent p-3">
                            <p className="text-xs font-medium text-accent-foreground">Kode Lisensi:</p>
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono text-accent-foreground">{tx.auctions.license_key}</code>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(tx.auctions.license_key); toast.success('Disalin!'); }}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {tx.auctions?.license_url && (
                          <a href={tx.auctions.license_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="gap-2">
                              <ExternalLink className="h-4 w-4" /> Buka Link
                            </Button>
                          </a>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button size="sm" onClick={() => handleComplete(tx.id)} className="gradient-primary text-primary-foreground">
                            <CheckCircle className="mr-1 h-4 w-4" /> Selesai
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setComplainId(tx.id)}>
                            <AlertTriangle className="mr-1 h-4 w-4" /> Komplain
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-10 text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-3 font-display text-lg font-semibold text-muted-foreground">Belum ada transaksi</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!complainId} onOpenChange={() => setComplainId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Ajukan Komplain</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Jelaskan masalah yang kamu alami dengan produk ini.</p>
            <Textarea value={complainNote} onChange={(e) => setComplainNote(e.target.value)} placeholder="Deskripsi masalah..." rows={4} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setComplainId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleComplain} disabled={!complainNote.trim()}>Kirim Komplain</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
