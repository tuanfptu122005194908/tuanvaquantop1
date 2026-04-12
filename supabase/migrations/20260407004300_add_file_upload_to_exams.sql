-- Add file_upload column to exams table for PE exams
ALTER TABLE public.exams 
ADD COLUMN file_upload TEXT;

-- Add comments
COMMENT ON COLUMN public.exams.file_upload IS 'File URL for PE exams (practice exams with file download)';

-- Create storage bucket for exam files
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-files', 'exam-files', true);

-- Add policies for exam files
CREATE POLICY "exam_files_select" ON storage.objects FOR SELECT USING (bucket_id = 'exam-files');
CREATE POLICY "exam_files_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'exam-files' AND public.is_admin(auth.uid()));
CREATE POLICY "exam_files_delete" ON storage.objects FOR DELETE USING (bucket_id = 'exam-files' AND public.is_admin(auth.uid()));
