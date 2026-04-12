
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TYPE public.auction_status AS ENUM ('draft', 'active', 'ended', 'completed');
CREATE TYPE public.transaction_status AS ENUM ('warranty', 'completed', 'complained', 'refunded');
CREATE TYPE public.topup_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  hold_balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System update wallet" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), NEW.phone);
  INSERT INTO public.wallets (user_id, balance, hold_balance)
  VALUES (NEW.id, 0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.top_up_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  proof_url TEXT,
  status public.topup_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.top_up_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own top-ups" ON public.top_up_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create top-ups" ON public.top_up_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_topups_updated_at BEFORE UPDATE ON public.top_up_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  start_price INTEGER NOT NULL DEFAULT 1,
  current_price INTEGER NOT NULL DEFAULT 0,
  bid_increment INTEGER NOT NULL DEFAULT 1,
  winner_id UUID REFERENCES auth.users(id),
  status public.auction_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  license_key TEXT,
  license_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auctions viewable by everyone" ON public.auctions FOR SELECT USING (true);
CREATE TRIGGER update_auctions_updated_at BEFORE UPDATE ON public.auctions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  is_winning BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bids viewable by everyone" ON public.bids FOR SELECT USING (true);
CREATE POLICY "Auth users can bid" ON public.bids FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.auctions(id),
  winner_id UUID NOT NULL REFERENCES auth.users(id),
  final_price INTEGER NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'warranty',
  warranty_ends_at TIMESTAMPTZ NOT NULL,
  complained_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  complaint_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Winners view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = winner_id);
CREATE POLICY "Winners update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = winner_id);
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE user_id = _user_id), false);
$$;

CREATE POLICY "Admin view all top-ups" ON public.top_up_requests FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin update top-ups" ON public.top_up_requests FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin insert auctions" ON public.auctions FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admin update auctions" ON public.auctions FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin delete auctions" ON public.auctions FOR DELETE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin view all transactions" ON public.transactions FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin update transactions" ON public.transactions FOR UPDATE USING (public.is_admin(auth.uid()));

INSERT INTO storage.buckets (id, name, public) VALUES ('proofs', 'proofs', true);
CREATE POLICY "Anyone can view proofs" ON storage.objects FOR SELECT USING (bucket_id = 'proofs');
CREATE POLICY "Auth users upload proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'proofs' AND auth.uid() IS NOT NULL);
