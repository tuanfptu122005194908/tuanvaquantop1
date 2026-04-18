import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Package, Clock, Tag, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', subject_id: '', price: '', duration_days: '', description: '', features: ''
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [p, s] = await Promise.all([
      supabase.from('plans').select('*, subjects(name)').order('price'),
      supabase.from('subjects').select('*').eq('is_active', true).order('name'),
    ]);
    setPlans(p.data || []);
    setSubjects(s.data || []);
  };

  const savePlan = async () => {
    if (!form.name || !form.price || !form.duration_days) {
      toast.error('Vui lòng điền tên, giá và thời hạn');
      return;
    }
    const payload = {
      name: form.name,
      subject_id: form.subject_id ? parseInt(form.subject_id) : null,
      price: parseInt(form.price),
      duration_days: parseInt(form.duration_days),
      description: form.description || null,
      features: form.features ? form.features.split('\n').map(f => f.trim()).filter(Boolean) : null,
    };
    if (editPlan) {
      await supabase.from('plans').update(payload).eq('id', editPlan.id);
      toast.success('Đã cập nhật gói học');
    } else {
      await supabase.from('plans').insert(payload);
      toast.success('Đã tạo gói học mới');
    }
    setShowForm(false); setEditPlan(null);
    setForm({ name: '', subject_id: '', price: '', duration_days: '', description: '', features: '' });
    loadData();
  };

  const toggleActive = async (plan: any) => {
    await supabase.from('plans').update({ is_active: !plan.is_active }).eq('id', plan.id);
    loadData();
  };

  const openEdit = (plan: any) => {
    setEditPlan(plan);
    setForm({
      name: plan.name,
      subject_id: plan.subject_id ? String(plan.subject_id) : '',
      price: String(plan.price),
      duration_days: String(plan.duration_days),
      description: plan.description || '',
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
    });
    setShowForm(true);
  };

  const gradients = [
    'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))',
    'linear-gradient(135deg, hsl(160,55%,45%), hsl(170,65%,38%))',
    'linear-gradient(135deg, hsl(25,90%,65%), hsl(25,90%,52%))',
    'linear-gradient(135deg, hsl(280,65%,55%), hsl(310,60%,52%))',
    'linear-gradient(135deg, hsl(0,65%,52%), hsl(20,80%,55%))',
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Gói học</h1>
          <p className="text-sm text-muted-foreground">{plans.length} gói học</p>
        </div>
        <Button
          onClick={() => {
            setEditPlan(null);
            setForm({ name: '', subject_id: '', price: '', duration_days: '', description: '', features: '' });
            setShowForm(true);
          }}
          style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Thêm gói
        </Button>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p, idx) => (
          <Card key={p.id} className={cn("border shadow-sm overflow-hidden", !p.is_active && "opacity-60")}>
            <div className="h-1.5" style={{ background: gradients[idx % gradients.length] }} />
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{p.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Package className="h-3 w-3" />
                    {(p.subjects as any)?.name || 'Combo nhiều môn'}
                  </p>
                </div>
                <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black">{Number(p.price).toLocaleString('vi')}</span>
                <span className="text-sm text-muted-foreground">₫</span>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Clock className="h-3 w-3" /> {p.duration_days} ngày
                </Badge>
                <Badge variant={p.is_active ? 'outline' : 'secondary'} className={cn("text-xs", p.is_active ? "text-green-600 border-green-300" : "")}>
                  {p.is_active ? '✓ Đang hiện' : '○ Ẩn'}
                </Badge>
              </div>

              {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}

              {Array.isArray(p.features) && p.features.length > 0 && (
                <ul className="space-y-1">
                  {(p.features as string[]).slice(0, 3).map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs">
                      <Check className="h-3 w-3 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                  {p.features.length > 3 && (
                    <li className="text-xs text-muted-foreground pl-4">+{p.features.length - 3} tính năng khác</li>
                  )}
                </ul>
              )}

              <Button size="sm" variant="outline" className="w-full gap-1" onClick={() => openEdit(p)}>
                <Pencil className="h-3 w-3" /> Chỉnh sửa
              </Button>
            </CardContent>
          </Card>
        ))}

        {plans.length === 0 && (
          <div className="col-span-3">
            <Card className="border-dashed">
              <CardContent className="p-10 text-center">
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Chưa có gói học nào. Tạo gói học đầu tiên!</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Form dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {editPlan ? 'Sửa gói học' : 'Tạo gói học mới'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Tên gói *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Gói Toán 3 tháng" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Môn học</Label>
              <Select value={form.subject_id} onValueChange={v => setForm({ ...form, subject_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn môn (tùy chọn — bỏ trống = Combo)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không chọn (Combo)</SelectItem>
                  {subjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium flex items-center gap-1"><Tag className="h-3 w-3" />Giá (VND) *</Label>
                <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                  placeholder="VD: 299000" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-1"><Clock className="h-3 w-3" />Thời hạn (ngày) *</Label>
                <Input type="number" value={form.duration_days} onChange={e => setForm({ ...form, duration_days: e.target.value })}
                  placeholder="VD: 90" className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Mô tả</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả ngắn về gói học..." rows={2} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Tính năng nổi bật (mỗi dòng 1 tính năng)</Label>
              <Textarea value={form.features} onChange={e => setForm({ ...form, features: e.target.value })}
                placeholder="Học tất cả đề&#10;Làm bài không giới hạn&#10;Xem đáp án ngay sau khi nộp" rows={3} className="mt-1 font-mono text-xs" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={savePlan} className="flex-1"
                style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
                {editPlan ? 'Lưu thay đổi' : 'Tạo gói học'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
