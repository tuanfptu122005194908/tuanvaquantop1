-- Add customer info columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS student_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email text;

-- Allow users to delete their own orders
CREATE POLICY "users_delete_own_orders"
ON public.orders
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);