INSERT INTO storage.buckets (id, name, public) VALUES ('subject-thumbnails', 'subject-thumbnails', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view subject thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'subject-thumbnails');

CREATE POLICY "Admins can upload subject thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'subject-thumbnails' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update subject thumbnails" ON storage.objects FOR UPDATE USING (bucket_id = 'subject-thumbnails' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete subject thumbnails" ON storage.objects FOR DELETE USING (bucket_id = 'subject-thumbnails' AND public.is_admin(auth.uid()));