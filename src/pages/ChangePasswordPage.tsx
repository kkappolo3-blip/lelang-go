import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { KeyRound, Loader2 } from 'lucide-react';

export default function ChangePasswordPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password minimal 8 karakter');
      return;
    }
    if (password !== confirm) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes('compromised') || error.message.includes('pwned')
        ? 'Password ini pernah bocor di kebocoran data publik. Pilih password lain.'
        : error.message);
      return;
    }
    toast.success('Password berhasil diperbarui');
    setPassword(''); setConfirm('');
    navigate('/');
  };

  return (
    <div className="container max-w-md py-10">
      <Card>
        <CardHeader>
          <div className="mb-2 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <CardTitle>Ganti Password</CardTitle>
          </div>
          <CardDescription>Masuk sebagai {user.email}. Pilih password baru yang kuat.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Password baru</Label>
              <Input id="new-password" type="password" autoComplete="new-password" minLength={8}
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Konfirmasi password</Label>
              <Input id="confirm-password" type="password" autoComplete="new-password" minLength={8}
                value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Perbarui Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
