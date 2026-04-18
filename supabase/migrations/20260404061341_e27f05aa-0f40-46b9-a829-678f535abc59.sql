
CREATE OR REPLACE FUNCTION handle_order_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    INSERT INTO user_subscriptions (user_id, subject_id, order_id, start_date, end_date)
    SELECT NEW.user_id, p.subject_id, NEW.id, CURRENT_DATE, CURRENT_DATE + p.duration_days
    FROM order_items oi JOIN plans p ON p.id = oi.plan_id
    WHERE oi.order_id = NEW.id AND p.subject_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
