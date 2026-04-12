import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Coins, Upload, ArrowUpCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function WalletPage() {
  const { user, loading } = useAuth();
  const { data: wallet } = useWallet();
  const queryClient = useQueryClient();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [amount, setAmount] = useState(10);
  const [proof, setProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: topUps } = useQuery({
    queryKey: ['top-ups', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('top_up_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const handleTopUp = async () => {
    if (!user || !proof) return;
    setSubmitting(true);
    try {
      const ext = proof.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('proofs').upload(path, proof);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('proofs').getPublicUrl(path);

      const { error } = await supabase.from('top_up_requests').insert({
        user_id: user.id,
        amount,
        proof_url: publicUrl,
      });
      if (error) throw error;

      toast.success('Permintaan top-up dikirim! Tunggu konfirmasi admin.');
      queryClient.invalidateQueries({ queryKey: ['top-ups'] });
      setTopUpOpen(false);
      setAmount(10);
      setProof(null);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim top-up');
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const presetAmounts = [10, 25, 50, 100, 250, 500];

  return (
    <div className="container max-w-2xl space-y-6 py-8">
      <Card className="overflow-hidden border-0 gradient-primary">
        <CardContent className="p-6">
          <p className="text-sm text-primary-foreground/70">Saldo Aktif</p>
          <div className="flex items-baseline gap-2">
            <Coins className="h-8 w-8 text-primary-foreground" />
            <span className="font-display text-4xl font-bold text-primary-foreground">{wallet?.balance.toLocaleString() ?? 0}</span>
            <span className="text-primary-foreground/70">Koin</span>
          </div>
          {wallet && wallet.hold_balance > 0 && (
            <p className="mt-1 text-sm text-primary-foreground/60">
              {wallet.hold_balance.toLocaleString()} Koin sedang di-hold untuk bid aktif
            </p>
          )}
          <Button
            onClick={() => setTopUpOpen(true)}
            className="mt-4 bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
          >
            <ArrowUpCircle className="mr-2 h-4 w-4" /> Top-Up Koin
          </Button>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-accent p-4 text-sm text-accent-foreground">
        <strong>Info:</strong> 1 Koin = Rp1.000. Transfer ke rekening/QRIS, lalu upload bukti transfer.
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Riwayat Top-Up</CardTitle>
        </CardHeader>
        <CardContent>
          {topUps && topUps.length > 0 ? (
            <div className="space-y-3">
              {topUps.map((tu: any) => (
                <div key={tu.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                  <div className="flex items-center gap-3">
                    {statusIcon(tu.status)}
                    <div>
                      <p className="font-display font-semibold text-card-foreground">{tu.amount.toLocaleString()} Koin</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(tu.created_at), 'dd MMM yyyy, HH:mm')}</p>
                    </div>
                  </div>
                  <Badge variant={tu.status === 'approved' ? 'default' : tu.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {tu.status === 'approved' ? 'Disetujui' : tu.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Belum ada riwayat top-up</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Top-Up Koin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Jumlah Koin</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {presetAmounts.map((a) => (
                  <Button
                    key={a}
                    variant={amount === a ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAmount(a)}
                    className={amount === a ? 'gradient-primary text-primary-foreground border-0' : ''}
                  >
                    {a} Koin
                  </Button>
                ))}
              </div>
              <Input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="mt-2" />
              <p className="mt-1 text-xs text-muted-foreground">Total: Rp{(amount * 1000).toLocaleString()}</p>
            </div>

            <div className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">
              <p className="font-semibold">Instruksi Transfer:</p>
              <p>Bank BCA: 1234567890 a/n Gibikey Studio</p>
              <p>QRIS: Scan kode di toko kami</p>
            </div>

            <div>
              <Label>Upload Bukti Transfer</Label>
              <Input type="file" accept="image/*" onChange={(e) => setProof(e.target.files?.[0] || null)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTopUpOpen(false)}>Batal</Button>
            <Button onClick={handleTopUp} disabled={submitting || !proof} className="gradient-primary text-primary-foreground">
              {submitting ? 'Mengirim...' : 'Kirim Permintaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
