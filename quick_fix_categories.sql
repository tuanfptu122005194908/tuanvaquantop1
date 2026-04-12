-- Tạo categories cho tất cả môn học
INSERT INTO public.categories (subject_id, name) 
SELECT 
  s.id as subject_id,
  cat.name
FROM public.subjects s
CROSS JOIN (VALUES 
  ('Đề FE'),
  ('Đề PE'), 
  ('Đề PT')
) AS cat(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c 
  WHERE c.subject_id = s.id AND c.name = cat.name
);

-- Update category cho các đề thi dựa trên title
UPDATE public.exams 
SET category_id = (
  SELECT c.id 
  FROM public.categories c 
  WHERE c.subject_id = exams.subject_id
    AND (
      (LOWER(exams.title) LIKE '%final%' AND c.name = 'Đề FE') OR
      (LOWER(exams.title) LIKE '%practice%' AND c.name = 'Đề PE') OR
      (LOWER(exams.title) LIKE '%test%' AND c.name = 'Đề PT') OR
      (LOWER(exams.title) LIKE '%fe%' AND c.name = 'Đề FE') OR
      (LOWER(exams.title) LIKE '%pe%' AND c.name = 'Đề PE') OR
      (LOWER(exams.title) LIKE '%pt%' AND c.name = 'Đề PT') OR
      (LOWER(exams.title) LIKE '%re%' AND c.name = 'Đề FE')
    )
  LIMIT 1
)
WHERE category_id IS NULL;
