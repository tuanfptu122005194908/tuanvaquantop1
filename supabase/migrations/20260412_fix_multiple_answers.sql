-- Fix constraint to support multiple answers per question
-- Drop the old UNIQUE(attempt_id, question_id) constraint
ALTER TABLE public.attempt_answers
DROP CONSTRAINT attempt_answers_attempt_id_question_id_key;

-- Add new UNIQUE constraint that allows multiple answers per question but prevents duplicates of the same answer
ALTER TABLE public.attempt_answers
ADD UNIQUE (
    attempt_id,
    question_id,
    answer_id
);