-- Make proofs bucket private
UPDATE storage.buckets SET public = false WHERE id = 'proofs';

-- Drop any overly permissive policies
DROP POLICY IF EXISTS "Public can view proofs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view proofs" ON storage.objects;
DROP POLICY IF EXISTS "Proofs are publicly accessible" ON storage.objects;

-- Owner-scoped read
CREATE POLICY "Users view own proof files"
ON storage.objects FOR SELECT
USING (bucket_id = 'proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admin can read all proofs
CREATE POLICY "Admins view all proof files"
ON storage.objects FOR SELECT
USING (bucket_id = 'proofs' AND public.has_role(auth.uid(), 'admin'));

-- Owner-scoped upload
CREATE POLICY "Users upload own proof files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Owner-scoped update/delete
CREATE POLICY "Users update own proof files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own proof files"
ON storage.objects FOR DELETE
USING (bucket_id = 'proofs' AND auth.uid()::text = (storage.foldername(name))[1]);