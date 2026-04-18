-- Add price to subjects for direct purchase
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS price numeric NOT NULL DEFAULT 0;

-- Add subject reference to orders for direct subject purchasing
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subject_id integer REFERENCES public.subjects(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subject_name text;