
-- Drop old constraint
ALTER TABLE public.theory_exams DROP CONSTRAINT IF EXISTS theory_exams_content_type_check;

-- Add new constraint with correct values
ALTER TABLE public.theory_exams ADD CONSTRAINT theory_exams_content_type_check
  CHECK (content_type IN ('images', 'files', 'link', 'youtube'));

-- Drop old permissive SELECT policy
DROP POLICY IF EXISTS "theory_exams_select" ON public.theory_exams;

-- Create new SELECT policy: admin sees all, users only see purchased subjects
CREATE POLICY "theory_exams_select" ON public.theory_exams
  FOR SELECT
  USING (
    is_admin(auth.uid())
    OR has_subject_access(auth.uid(), subject_id::integer)
  );
