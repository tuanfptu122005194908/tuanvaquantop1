
-- Create coupons table
CREATE TABLE public.coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR NOT NULL UNIQUE,
  discount_type VARCHAR NOT NULL DEFAULT 'percent', -- 'percent' or 'fixed'
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC NOT NULL DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone authenticated can view active coupons"
ON public.coupons FOR SELECT TO authenticated
USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can insert coupons"
ON public.coupons FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update coupons"
ON public.coupons FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete coupons"
ON public.coupons FOR DELETE
USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add discount columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC NOT NULL DEFAULT 0;
