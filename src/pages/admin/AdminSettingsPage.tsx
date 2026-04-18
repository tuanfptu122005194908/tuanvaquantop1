import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Settings, Upload, X, CreditCard } from 'lucide-react';

export default function AdminSettingsPage() {
  const [form, setForm] = useState({ bank_name: '', account_number: '', account_holder: '', qr_image_url: '', note: '' });
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('payment_settings').select('*').eq('id', 1).single();
    if (data) {
      setForm({
        bank_name: data.bank_name || '',
        account_number: data.account_number || '',
        account_holder: data.account_holder || '',
        qr_image_url: data.qr_image_url || '',
        note: data.note || '',
      });
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    let qrUrl = form.qr_image_url;

    if (qrFile) {
      const path = `payment-qr/${Date.now()}.${qrFile.name.split('.').pop()}`;
      const { error: upErr } = await supabase.storage.from('subject-thumbnails').upload(path, qrFile);
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('subject-thumbnails').getPublicUrl(path);
        qrUrl = urlData.publicUrl;
      } else {
        toast.error('Upload QR thất bại');
      }
    }

    const { error } = await supabase.from('payment_settings').update({
      bank_name: form.bank_name,
      account_number: form.account_number,
      account_holder: form.account_holder,
      qr_image_url: qrUrl,
      note: form.note,
    }).eq('id', 1);

    if (error) {
      toast.error('Lỗi lưu cài đặt: ' + error.message);
    } else {
      toast.success('Đã lưu thông tin thanh toán');
      setForm(prev => ({ ...prev, qr_image_url: qrUrl }));
      setQrFile(null);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="p-6">
      <div className="skeleton h-8 w-48 rounded mb-4" />
      <div className="skeleton h-64 rounded-xl" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" /> Cài đặt hệ thống
        </h1>
        <p className="text-sm text-muted-foreground">Quản lý thông tin thanh toán và cấu hình</p>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Thông tin thanh toán
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tên ngân hàng</Label>
              <Input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })}
                placeholder="VD: MB Bank, Vietcombank..." className="mt-1" />
            </div>
            <div>
              <Label>Số tài khoản</Label>
              <Input value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })}
                placeholder="VD: 0123456789" className="mt-1" />
            </div>
            <div>
              <Label>Chủ tài khoản</Label>
              <Input value={form.account_holder} onChange={e => setForm({ ...form, account_holder: e.target.value })}
                placeholder="VD: NGUYEN VAN A" className="mt-1" />
            </div>
          </div>

          <div>
            <Label>Ghi chú thanh toán</Label>
            <Textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
              placeholder="VD: Nội dung CK: TQMASTER [Tên môn] [Email]" rows={2} className="mt-1" />
          </div>

          <div>
            <Label>Mã QR thanh toán</Label>
            <div className="mt-1">
              <input type="file" accept="image/*" className="hidden" id="qr-upload"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setQrFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => setForm(prev => ({ ...prev, qr_image_url: reader.result as string }));
                    reader.readAsDataURL(file);
                  }
                }} />
              {form.qr_image_url ? (
                <div className="relative w-48">
                  <img src={form.qr_image_url} alt="QR" className="w-48 h-48 object-contain rounded-lg border" />
                  <button onClick={() => { setQrFile(null); setForm(prev => ({ ...prev, qr_image_url: '' })); }}
                    className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label htmlFor="qr-upload"
                  className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Upload mã QR</p>
                </label>
              )}
            </div>
          </div>

          <Button onClick={saveSettings} disabled={saving}
            style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
            {saving ? 'Đang lưu...' : 'Lưu thông tin thanh toán'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}