import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Shield, Plus, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="container max-w-5xl space-y-6 py-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Kelola lelang, top-up, dan transaksi</p>
        </div>
      </div>

      <Tabs defaultValue="auctions">
        <TabsList>
          <TabsTrigger value="auctions">Lelang</TabsTrigger>
          <TabsTrigger value="topups">Top-Up</TabsTrigger>
          <TabsTrigger value="transactions">Transaksi</TabsTrigger>
        </TabsList>

        <TabsContent value="auctions"><AdminAuctions /></TabsContent>
        <TabsContent value="topups"><AdminTopUps /></TabsContent>
        <TabsContent value="transactions"><AdminTransactions /></TabsContent>
      </Tabs>
    </div>
  );
}

function AdminAuctions() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', image_url: '', start_price: 1, bid_increment: 1,
    ends_at: '', license_key: '', license_url: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const { data: auctions } = useQuery({
    queryKey: ['admin-auctions'],
    queryFn: async () => {
      const { data } = await supabase.from('auctions').select('*').order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const handleCreate = async () => {
    if (!form.title || !form.ends_at) { toast.error('Judul dan waktu akhir wajib diisi'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('auctions').insert({
      title: form.title,
      description: form.description || null,
      image_url: form.image_url || null,
      start_price: form.start_price,
      bid_increment: form.bid_increment,
      ends_at: new Date(form.ends_at).toISOString(),
      license_key: form.license_key || null,
      license_url: form.license_url || null,
      status: 'active' as any,
      current_price: 0,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Lelang dibuat!');
      queryClient.invalidateQueries({ queryKey: ['admin-auctions'] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      setCreateOpen(false);
      setForm({ title: '', description: '', image_url: '', start_price: 1, bid_increment: 1, ends_at: '', license_key: '', license_url: '' });
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4 pt-4">
      <Button onClick={() => setCreateOpen(true)} className="gradient-primary text-primary-foreground">
        <Plus className="mr-2 h-4 w-4" /> Buat Lelang Baru
      </Button>

      <div className="space-y-3">
        {auctions?.map((a: any) => (
          <Card key={a.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-display font-semibold text-card-foreground">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  Harga: {a.current_price || a.start_price} Koin · Berakhir: {format(new Date(a.ends_at), 'dd MMM yyyy HH:mm')}
                </p>
              </div>
              <Badge variant={a.status === 'active' ? 'default' : 'secondary'}>{a.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Buat Lelang Baru</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Judul</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Deskripsi</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div><Label>URL Gambar</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Harga Awal (Koin)</Label><Input type="number" min={1} value={form.start_price} onChange={(e) => setForm({ ...form, start_price: Number(e.target.value) })} /></div>
              <div><Label>Kelipatan Bid</Label><Input type="number" min={1} value={form.bid_increment} onChange={(e) => setForm({ ...form, bid_increment: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Waktu Berakhir</Label><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
            <div><Label>Kode Lisensi (opsional)</Label><Input value={form.license_key} onChange={(e) => setForm({ ...form, license_key: e.target.value })} /></div>
            <div><Label>URL Lisensi (opsional)</Label><Input value={form.license_url} onChange={(e) => setForm({ ...form, license_url: e.target.value })} placeholder="https://..." /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={submitting} className="gradient-primary text-primary-foreground">
              {submitting ? 'Membuat...' : 'Buat Lelang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminTopUps() {
  const queryClient = useQueryClient();
  const { data: topUps } = useQuery({
    queryKey: ['admin-topups'],
    queryFn: async () => {
      const { data } = await supabase
        .from('top_up_requests')
        .select('*, profiles!top_up_requests_user_id_fkey(display_name)')
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const handleApprove = async (tu: any) => {
    // Update top-up status
    const { error: tuError } = await supabase
      .from('top_up_requests')
      .update({ status: 'approved' as any })
      .eq('id', tu.id);
    if (tuError) { toast.error(tuError.message); return; }

    // Add coins to wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', tu.user_id)
      .single();
    if (wallet) {
      await supabase
        .from('wallets')
        .update({ balance: wallet.balance + tu.amount })
        .eq('user_id', tu.user_id);
    }

    toast.success('Top-up disetujui!');
    queryClient.invalidateQueries({ queryKey: ['admin-topups'] });
  };

  const handleReject = async (id: string) => {
    await supabase.from('top_up_requests').update({ status: 'rejected' as any }).eq('id', id);
    toast.success('Top-up ditolak');
    queryClient.invalidateQueries({ queryKey: ['admin-topups'] });
  };

  return (
    <div className="space-y-3 pt-4">
      {topUps?.map((tu: any) => (
        <Card key={tu.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display font-semibold text-card-foreground">{(tu.profiles as any)?.display_name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">{tu.amount.toLocaleString()} Koin · {format(new Date(tu.created_at), 'dd MMM yyyy HH:mm')}</p>
                {tu.proof_url && (
                  <a href={tu.proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Eye className="h-3 w-3" /> Lihat Bukti
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2">
                {tu.status === 'pending' ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleReject(tu.id)}>
                      <XCircle className="mr-1 h-4 w-4" /> Tolak
                    </Button>
                    <Button size="sm" onClick={() => handleApprove(tu)} className="gradient-primary text-primary-foreground">
                      <CheckCircle className="mr-1 h-4 w-4" /> Setujui
                    </Button>
                  </>
                ) : (
                  <Badge variant={tu.status === 'approved' ? 'default' : 'destructive'}>
                    {tu.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {(!topUps || topUps.length === 0) && (
        <p className="py-10 text-center text-sm text-muted-foreground">Belum ada permintaan top-up</p>
      )}
    </div>
  );
}

function AdminTransactions() {
  const { data: transactions } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*, auctions(title), profiles!transactions_winner_id_fkey(display_name)')
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const statusColor = (s: string) => {
    switch (s) {
      case 'warranty': return 'secondary';
      case 'completed': return 'default';
      case 'complained': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-3 pt-4">
      {transactions?.map((tx: any) => (
        <Card key={tx.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display font-semibold text-card-foreground">{tx.auctions?.title}</p>
                <p className="text-sm text-muted-foreground">
                  Pemenang: {(tx.profiles as any)?.display_name} · {tx.final_price.toLocaleString()} Koin
                </p>
                {tx.status === 'warranty' && (
                  <p className="text-xs text-muted-foreground">
                    Garansi: {format(new Date(tx.warranty_ends_at), 'dd MMM yyyy HH:mm')}
                  </p>
                )}
                {tx.complaint_note && (
                  <p className="mt-1 text-sm text-destructive">Komplain: {tx.complaint_note}</p>
                )}
              </div>
              <Badge variant={statusColor(tx.status) as any}>
                {tx.status === 'warranty' ? 'Garansi' : tx.status === 'completed' ? 'Selesai' : tx.status === 'complained' ? 'Dikomplain' : tx.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
      {(!transactions || transactions.length === 0) && (
        <p className="py-10 text-center text-sm text-muted-foreground">Belum ada transaksi</p>
      )}
    </div>
  );
}
