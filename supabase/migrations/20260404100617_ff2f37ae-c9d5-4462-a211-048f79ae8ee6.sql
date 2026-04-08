
CREATE TABLE public.payment_settings (
  id integer PRIMARY KEY DEFAULT 1,
  bank_name text,
  account_number text,
  account_holder text,
  qr_image_url text,
  note text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view payment settings" ON public.payment_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update payment settings" ON public.payment_settings FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert payment settings" ON public.payment_settings FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.payment_settings (id, bank_name, account_number, account_holder, note) VALUES (1, '', '', '', 'Chuyển khoản theo thông tin trên');
