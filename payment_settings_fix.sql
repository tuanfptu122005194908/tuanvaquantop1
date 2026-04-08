-- Tạo bảng payment_settings nếu chưa có
CREATE TABLE IF NOT EXISTS payment_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  bank_name TEXT,
  account_number TEXT,
  account_holder TEXT,
  qr_image_url TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thêm dữ liệu mẫu
INSERT INTO payment_settings (id, bank_name, account_number, account_holder, qr_image_url, note)
VALUES (1, 'MB Bank', '0123456789', 'NGUYEN VAN A', 'https://ywltgxtijqejxmkstmae.supabase.co/storage/v1/object/public/subject-thumbnails/payment-qr.png', 'Nội dung CK: TQMASTER [Tên môn] [Email]')
ON CONFLICT (id) DO UPDATE SET
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  account_holder = EXCLUDED.account_holder,
  qr_image_url = EXCLUDED.qr_image_url,
  note = EXCLUDED.note,
  updated_at = NOW();
