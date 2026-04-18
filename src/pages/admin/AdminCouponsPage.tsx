import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Tag, Copy } from 'lucide-react';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCoupon, setEditCoupon] = useState<any>(null);
  const [form, setForm] = useState({
    code: '', discount_type: 'percent', discount_value: '', min_order_amount: '0',
    max_uses: '', is_active: true, expires_at: '',
  });

  useEffect(() => { loadCoupons(); }, []);

  const loadCoupons = async () => {
    setLoading(true);
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditCoupon('new');
    setForm({ code: '', discount_type: 'percent', discount_value: '', min_order_amount: '0', max_uses: '', is_active: true, expires_at: '' });
  };

  const openEdit = (c: any) => {
    setEditCoupon(c);
    setForm({
      code: c.code, discount_type: c.discount_type, discount_value: String(c.discount_value),
      min_order_amount: String(c.min_order_amount || 0), max_uses: c.max_uses ? String(c.max_uses) : '',
      is_active: c.is_active, expires_at: c.expires_at ? c.expires_at.slice(0, 16) : '',
    });
  };

  const save = async () => {
    if (!form.code || !form.discount_value) { toast.error('Vui lòng điền đủ thông tin'); return; }
    const payload: any = {
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      is_active: form.is_active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };
    if (editCoupon === 'new') {
      const { error } = await supabase.from('coupons').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success('Đã tạo mã giảm giá');
    } else {
      const { error } = await supabase.from('coupons').update(payload).eq('id', editCoupon.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Đã cập nhật mã giảm giá');
    }
    setEditCoupon(null);
    loadCoupons();
  };

  const deleteCoupon = async (id: number) => {
    if (!confirm('Xoá mã giảm giá này?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    toast.success('Đã xoá');
    loadCoupons();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mã giảm giá</h1>
          <p className="text-sm text-muted-foreground">{coupons.length} mã</p>
        </div>
        <Button onClick={openCreate} className="gap-2" style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
          <Plus className="h-4 w-4" /> Tạo mã
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      ) : coupons.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Chưa có mã giảm giá nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {coupons.map(c => (
            <Card key={c.id} className="border shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
                  style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
                  <Tag className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono">{c.code}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(c.code); toast.success('Đã copy'); }}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    {!c.is_active && <Badge variant="outline" className="text-xs text-red-500 border-red-300">Tắt</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Giảm {c.discount_type === 'percent' ? `${c.discount_value}%` : `${Number(c.discount_value).toLocaleString('vi')}₫`}
                    {c.min_order_amount > 0 && ` · Đơn tối thiểu ${Number(c.min_order_amount).toLocaleString('vi')}₫`}
                    {c.max_uses && ` · ${c.used_count}/${c.max_uses} lượt`}
                    {c.expires_at && ` · Hết hạn ${new Date(c.expires_at).toLocaleDateString('vi')}`}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteCoupon(c.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editCoupon} onOpenChange={() => setEditCoupon(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCoupon === 'new' ? 'Tạo mã giảm giá' : 'Sửa mã giảm giá'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Mã giảm giá</Label>
              <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="VD: SALE50" className="mt-1 uppercase font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Loại giảm giá</Label>
                <Select value={form.discount_type} onValueChange={v => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Phần trăm (%)</SelectItem>
                    <SelectItem value="fixed">Số tiền cố định (₫)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Giá trị</Label>
                <Input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })}
                  placeholder={form.discount_type === 'percent' ? 'VD: 10' : 'VD: 50000'} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Đơn tối thiểu (₫)</Label>
                <Input type="number" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Giới hạn lượt dùng</Label>
                <Input type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} placeholder="Không giới hạn" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Ngày hết hạn</Label>
              <Input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} className="mt-1" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Kích hoạt</Label>
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
            </div>
            <Button className="w-full" onClick={save}
              style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
              {editCoupon === 'new' ? 'Tạo mã' : 'Lưu thay đổi'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
