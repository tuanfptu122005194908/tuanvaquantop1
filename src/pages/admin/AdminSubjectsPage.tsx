import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, BookOpen, GraduationCap, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const KI_COLORS: Record<number, string> = {
  1: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))',
  2: 'linear-gradient(135deg, hsl(160,55%,45%), hsl(170,65%,38%))',
  3: 'linear-gradient(135deg, hsl(25,90%,65%), hsl(25,90%,52%))',
  4: 'linear-gradient(135deg, hsl(280,65%,55%), hsl(310,60%,52%))',
  5: 'linear-gradient(135deg, hsl(0,65%,52%), hsl(20,80%,55%))',
  6: 'linear-gradient(135deg, hsl(195,75%,45%), hsl(215,70%,50%))',
  7: 'linear-gradient(135deg, hsl(330,65%,50%), hsl(350,70%,55%))',
  8: 'linear-gradient(135deg, hsl(90,60%,40%), hsl(110,65%,38%))',
};

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editSubject, setEditSubject] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', thumbnail: '', order_index: 1, price: '' });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '', subject_id: 0, order_index: 1 });
  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [s, c] = await Promise.all([
      supabase.from('subjects').select('*').order('order_index'),
      supabase.from('categories').select('*').order('order_index'),
    ]);
    setSubjects(s.data || []);
    setCategories(c.data || []);
  };

  const saveSubject = async () => {
    if (!form.name.trim()) { toast.error('Nhập tên môn học'); return; }
    
    // Upload thumbnail if exists
    let thumbnailUrl = form.thumbnail;
    if (thumbnailFile) {
      setUploadingThumbnail(true);
      try {
        const path = `subjects/${Date.now()}.${thumbnailFile.name.split('.').pop()}`;
        const { error: upErr } = await supabase.storage.from('subject-thumbnails').upload(path, thumbnailFile);
        if (upErr) {
          console.error('Upload error:', upErr);
          // If bucket doesn't exist, create it or use fallback
          if (upErr.message.includes('bucket') || upErr.message.includes('not found')) {
            toast.warning('Bucket storage chưa sẵn có, sử dụng preview tạm thời');
            thumbnailUrl = form.thumbnail; // Use data URL as fallback
          } else {
            toast.error(`Upload thumbnail lỗi: ${upErr.message}`);
            setUploadingThumbnail(false);
            return;
          }
        } else {
          const { data: urlData } = supabase.storage.from('subject-thumbnails').getPublicUrl(path);
          thumbnailUrl = urlData.publicUrl;
        }
      } catch (error) {
        console.error('Storage error:', error);
        toast.warning('Lỗi storage, sử dụng preview tạm thời');
        thumbnailUrl = form.thumbnail;
      }
      setUploadingThumbnail(false);
    }
    
    const subjectData = { ...form, thumbnail: thumbnailUrl, price: form.price ? parseInt(form.price) : 0 };
    
    try {
      if (editSubject) {
        await supabase.from('subjects').update(subjectData).eq('id', editSubject.id);
        toast.success('Đã cập nhật môn học');
      } else {
        await supabase.from('subjects').insert(subjectData);
        toast.success('Đã tạo môn học mới');
      }
      setShowForm(false); setEditSubject(null);
    setForm({ name: '', description: '', thumbnail: '', order_index: 1, price: '' });
      setThumbnailFile(null);
      loadData();
    } catch (error) {
      console.error('Save subject error:', error);
      toast.error('Lỗi khi lưu môn học: ' + error.message);
    }
  };

  const deleteSubject = async (id: number) => {
    if (!confirm('Xóa môn này sẽ xóa tất cả dữ liệu liên quan?')) return;
    await supabase.from('subjects').delete().eq('id', id);
    toast.success('Đã xóa');
    loadData();
  };

  const toggleActive = async (s: any) => {
    await supabase.from('subjects').update({ is_active: !s.is_active }).eq('id', s.id);
    loadData();
  };

  const saveCategory = async () => {
    if (!catForm.name.trim()) { toast.error('Nhập tên kỳ/danh mục'); return; }
    await supabase.from('categories').insert(catForm);
    toast.success('Đã thêm kỳ/danh mục');
    setShowCatForm(false);
    loadData();
  };

  const deleteCategory = async (id: number) => {
    await supabase.from('categories').delete().eq('id', id);
    toast.success('Đã xóa');
    loadData();
  };

  // Group subjects by order_index (kì học)
  const kiGroups: Record<number, any[]> = {};
  subjects.forEach(s => {
    const ki = s.order_index || 0;
    if (!kiGroups[ki]) kiGroups[ki] = [];
    kiGroups[ki].push(s);
  });
  const kiKeys = Object.keys(kiGroups).map(Number).sort((a, b) => a - b);

  const kiList = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Môn học & Kì</h1>
          <p className="text-sm text-muted-foreground">
            {subjects.length} môn — {kiKeys.length} kì học
          </p>
        </div>
        <Button
          onClick={() => {
            setEditSubject(null);
            setForm({ name: '', description: '', thumbnail: '', order_index: 1, price: '' });
            setShowForm(true);
          }}
          style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Thêm môn học
        </Button>
      </div>

      {/* Subjects grouped by kì */}
      <div className="space-y-8">
        {kiKeys.map(ki => (
          <div key={ki} className="bg-card rounded-xl border shadow-sm overflow-hidden">
            {/* Kì header */}
            <div className="p-6 border-b bg-gradient-to-r from-muted/50 to-muted/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg"
                  style={{ background: KI_COLORS[ki] || KI_COLORS[1] }}>
                  {ki > 0 ? ki : '?'}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{ki > 0 ? `Kì ${ki}` : 'Chưa phân kì'}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      {kiGroups[ki].length} môn học
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {kiGroups[ki].filter(s => s.is_active).length} active • {kiGroups[ki].filter(s => !s.is_active).length} ẩn
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {kiGroups[ki].map(s => (
                  <Card key={s.id} className="border shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-1" style={{ background: KI_COLORS[ki] || KI_COLORS[1] }} />
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                          style={{ background: KI_COLORS[ki] || KI_COLORS[1] }}>
                          <BookOpen className="h-5 w-5" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-sm">{s.name}</h3>
                            <Badge variant={s.is_active ? 'outline' : 'secondary'} className={cn("text-xs", s.is_active ? "text-green-600 border-green-300" : "")}>
                              {s.is_active ? 'Active' : 'Ẩn'}
                            </Badge>
                          </div>
                          {s.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{s.description}</p>}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {categories.filter(c => c.subject_id === s.id).length} kỳ
                            </span>
                            <span className="font-semibold" style={{ color: 'hsl(330,65%,55%)' }}>
                              {Number(s.price) > 0 ? `${Number(s.price).toLocaleString('vi')}₫` : 'Chưa set giá'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 shrink-0">
                          <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} />
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline"
                              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                              className="gap-1 h-7 px-2">
                              {expanded === s.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            </Button>
                            <Button size="sm" variant="ghost"
                              onClick={() => { 
                                setEditSubject(s); 
                                setForm({ name: s.name, description: s.description || '', thumbnail: s.thumbnail || '', order_index: s.order_index || 1, price: s.price ? String(s.price) : '' }); 
                                setThumbnailFile(null);
                                setShowForm(true); 
                              }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteSubject(s.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded: categories/kỳ */}
                      {expanded === s.id && (
                        <div className="mt-4 pl-4 border-l-2 border-muted space-y-2 animate-slide-down">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kỳ / Danh mục</p>
                            <Button size="sm" variant="outline" className="gap-1 h-6 text-xs px-2"
                              onClick={() => { setCatForm({ name: '', description: '', subject_id: s.id, order_index: 1 }); setShowCatForm(true); }}>
                              <Plus className="h-3 w-3" /> Thêm
                            </Button>
                          </div>
                          {categories.filter(c => c.subject_id === s.id).length === 0 ? (
                            <div className="text-center py-3 bg-muted/20 rounded-lg">
                              <p className="text-xs text-muted-foreground italic">Chưa có kỳ nào</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {categories.filter(c => c.subject_id === s.id).map(c => (
                                <div key={c.id} className="flex items-center justify-between text-xs bg-muted/30 rounded-md p-2">
                                  <div>
                                    <p className="font-medium">{c.name}</p>
                                    {c.description && <p className="text-muted-foreground">{c.description}</p>}
                                  </div>
                                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-6 w-6 p-0"
                                    onClick={() => deleteCategory(c.id)}>
                                    <Trash2 className="h-2.5 w-2.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ))}

        {subjects.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Chưa có môn học nào. Tạo môn đầu tiên!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Subject form dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {editSubject ? 'Sửa môn học' : 'Thêm môn học'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Tên môn học *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Toán Giải tích 1" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5" />
                Kì học *
              </Label>
              <div className="grid grid-cols-5 gap-2 mt-1">
                {kiList.map(k => (
                  <button key={k}
                    onClick={() => setForm({ ...form, order_index: k })}
                    className={cn(
                      "h-9 rounded-lg border text-sm font-semibold transition-all",
                      form.order_index === k
                        ? "text-white border-transparent"
                        : "border-border hover:border-primary hover:text-primary"
                    )}
                    style={form.order_index === k ? { background: KI_COLORS[k] || KI_COLORS[1] } : {}}>
                    Kì {k}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Giá (VND)</Label>
              <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="VD: 299000 (0 = liên hệ)" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Mô tả</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả ngắn về môn học..." rows={2} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Thumbnail môn học</Label>
              <div className="mt-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setThumbnailFile(file);
                      // Create preview
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setForm({ ...form, thumbnail: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                  id="thumbnail-upload"
                />
                <label
                  htmlFor="thumbnail-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {thumbnailFile || form.thumbnail ? (
                    <div className="relative w-full h-full">
                      <img
                        src={form.thumbnail}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setThumbnailFile(null);
                          setForm({ ...form, thumbnail: '' });
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={saveSubject} className="flex-1" disabled={uploadingThumbnail}
                style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
                {uploadingThumbnail ? 'Đang tải ảnh lên...' : (editSubject ? 'Lưu thay đổi' : 'Tạo môn học')}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category/kỳ form dialog */}
      <Dialog open={showCatForm} onOpenChange={setShowCatForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Thêm Kỳ / Danh mục</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Tên kỳ *</Label>
              <Input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                placeholder="VD: Giữa kỳ 1, Cuối kỳ 1..." className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Mô tả</Label>
              <Textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                placeholder="Mô tả (tùy chọn)" rows={2} className="mt-1" />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveCategory} className="flex-1"
                style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
                Lưu
              </Button>
              <Button variant="outline" onClick={() => setShowCatForm(false)}>Hủy</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
