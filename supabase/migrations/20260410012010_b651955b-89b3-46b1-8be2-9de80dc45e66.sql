-- Enable RLS on theory_exams
ALTER TABLE public.theory_exams ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "theory_exams_select" ON public.theory_exams
FOR SELECT USING (true);

CREATE POLICY "theory_exams_insert" ON public.theory_exams
FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "theory_exams_update" ON public.theory_exams
FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "theory_exams_delete" ON public.theory_exams
FOR DELETE USING (is_admin(auth.uid()));

-- Create storage bucket for theory files
INSERT INTO storage.buckets (id, name, public) VALUES ('theory-files', 'theory-files', true);

-- Storage policies
CREATE POLICY "Theory files are publicly accessible"
ON storage.objects FOR SELECT USING (bucket_id = 'theory-files');

CREATE POLICY "Admins can upload theory files"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'theory-files' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete theory files"
ON storage.objects FOR DELETE USING (bucket_id = 'theory-files' AND is_admin(auth.uid()));