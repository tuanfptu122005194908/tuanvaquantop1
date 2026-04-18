import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Image, FileUp, Link2, Youtube, BookOpen, Search, X, ChevronDown, ChevronRight } from 'lucide-react';

type ContentType = 'images' | 'files' | 'link' | 'youtube';

interface TheoryItem {
  id: number;
  title: string;
  description: string | null;
  content_type: string;
  subject_id: number | null;
  image_urls: string[] | null;
  file_url: string | null;
  link_url: string | null;
  created_at: string | null;
  subjects?: { name: string } | null;
}

const contentTypeConfig: Record<ContentType, { label: string; icon: any; color: string }> = {
  images: { label: 'Hình ảnh', icon: Image, color: 'bg-blue-100 text-blue-700' },
  files: { label: 'Tài liệu', icon: FileUp, color: 'bg-green-100 text-green-700' },
  link: { label: 'Liên kết web', icon: Link2, color: 'bg-orange-100 text-orange-700' },
  youtube: { label: 'Video YouTube', icon: Youtube, color: 'bg-red-100 text-red-700' },
};

export default function AdminTheoryPage() {
  const { profile } = useAuthStore();
  const [theories, setTheories] = useState<TheoryItem[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TheoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openSubjects, setOpenSubjects] = useState<Set<number>>(new Set());

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<ContentType>('images');
  const [subjectId, setSubjectId] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingFileUrl, setExistingFileUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: t }, { data: s }] = await Promise.all([
      supabase.from('theory_exams').select('*, subjects(name)').order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').eq('is_active', true).order('order_index'),
    ]);
    setTheories((t as TheoryItem[]) || []);
    const subjectsList = s || [];
    setSubjects(subjectsList);
    // Don't open subjects by default - users need to click to expand
    setOpenSubjects(new Set());
    setLoading(false);
  };

  const openCreate = (presetSubjectId?: number) => {
    setEditing(null);
    setTitle(''); setDescription(''); setContentType('images');
    setSubjectId(presetSubjectId?.toString() || '');
    setLinkUrl(''); setImageFiles([]); setDocFiles([]);
    setExistingImages([]); setExistingFileUrl('');
    setDialogOpen(true);
  };

  const openEdit = (item: TheoryItem) => {
    setEditing(item);
    setTitle(item.title);
    setDescription(item.description || '');
    setContentType(item.content_type as ContentType);
    setSubjectId(item.subject_id?.toString() || '');
    setLinkUrl(item.link_url || '');
    setExistingImages(item.image_urls || []);
    setExistingFileUrl(item.file_url || '');
    setImageFiles([]); setDocFiles([]);
    setDialogOpen(true);
  };

  const uploadFiles = async (files: File[], folder: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('theory-files').upload(path, file);
      if (error) { toast.error(`Lỗi upload: ${file.name}`); continue; }
      const { data: { publicUrl } } = supabase.storage.from('theory-files').getPublicUrl(path);
      urls.push(publicUrl);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!title.trim() || !subjectId) {
      toast.error('Vui lòng nhập tiêu đề và chọn môn học');
      return;
    }
    setSubmitting(true);
    try {
      let image_urls: string[] | null = null;
      let file_url: string | null = null;
      let link_url: string | null = null;

      if (contentType === 'images') {
        const newUrls = imageFiles.length > 0 ? await uploadFiles(imageFiles, 'images') : [];
        image_urls = [...existingImages, ...newUrls];
        if (image_urls.length === 0) { toast.error('Vui lòng tải ít nhất 1 ảnh'); setSubmitting(false); return; }
      } else if (contentType === 'files') {
        if (docFiles.length > 0) {
          const urls = await uploadFiles(docFiles, 'files');
          file_url = urls.join(',');
        } else if (existingFileUrl) {
          file_url = existingFileUrl;
        } else {
          toast.error('Vui lòng tải ít nhất 1 file'); setSubmitting(false); return;
        }
      } else if (contentType === 'link' || contentType === 'youtube') {
        if (!linkUrl.trim()) { toast.error('Vui lòng nhập URL'); setSubmitting(false); return; }
        link_url = linkUrl.trim();
      }

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        content_type: contentType,
        subject_id: parseInt(subjectId),
        image_urls, file_url, link_url,
        created_by: profile?.id || null,
      };

      if (editing) {
        const { error } = await supabase.from('theory_exams').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast.success('Đã cập nhật lý thuyết');
      } else {
        const { error } = await supabase.from('theory_exams').insert(payload);
        if (error) throw error;
        toast.success('Đã thêm lý thuyết mới');
      }
      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi lưu dữ liệu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('theory_exams').delete().eq('id', id);
    if (error) { toast.error('Lỗi xóa'); return; }
    toast.success('Đã xóa');
    loadData();
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleSubject = (id: number) => {
    setOpenSubjects(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filtered = theories.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group subjects by kì
  const kiGroups: Record<number, any[]> = {};
  subjects.forEach(s => {
    const ki = s.order_index || 0;
    if (!kiGroups[ki]) kiGroups[ki] = [];
    kiGroups[ki].push(s);
  });
  const kiKeys = Object.keys(kiGroups).map(Number).sort((a, b) => a - b);

  // Group theories by subject
  const groupedBySubject = subjects.map(subject => ({
    subject,
    items: filtered.filter(t => t.subject_id === subject.id),
  }));

  const noSubjectItems = filtered.filter(t => !t.subject_id || !subjects.find(s => s.id === t.subject_id));

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

  const ContentTypeIcon = ({ type }: { type: string }) => {
    const config = contentTypeConfig[type as ContentType];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge variant="secondary" className={`${config.color} gap-1`}>
        <Icon className="h-3 w-3" /> {config.label}
      </Badge>
    );
  };

  const TheoryCard = ({ item }: { item: TheoryItem }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{item.title}</h3>
          </div>
          <div className="flex gap-1 ml-2 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xóa lý thuyết?</AlertDialogTitle>
                  <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive text-destructive-foreground">Xóa</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <ContentTypeIcon type={item.content_type} />
        {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
        {item.content_type === 'images' && item.image_urls && item.image_urls.length > 0 && (
          <div className="flex gap-1 overflow-hidden">
            {item.image_urls.slice(0, 3).map((url, i) => (
              <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-lg" />
            ))}
            {item.image_urls.length > 3 && (
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">
                +{item.image_urls.length - 3}
              </div>
            )}
          </div>
        )}
        {item.content_type === 'youtube' && item.link_url && (
          <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
            <Youtube className="h-3 w-3 text-red-500" /> {item.link_url}
          </div>
        )}
        {item.content_type === 'link' && item.link_url && (
          <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
            <Link2 className="h-3 w-3" /> {item.link_url}
          </div>
        )}
        {item.content_type === 'files' && item.file_url && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <FileUp className="h-3 w-3" /> {item.file_url.split(',').length} file(s)
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Lý thuyết</h1>
          <p className="text-sm text-muted-foreground">Thêm ảnh, tài liệu, liên kết, video cho từng môn học</p>
        </div>
        <Button onClick={() => openCreate()} className="gap-2 gradient-sakura text-white">
          <Plus className="h-4 w-4" /> Thêm lý thuyết
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Tìm kiếm..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : (
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
                        {kiGroups[ki].length} môn
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {kiGroups[ki].reduce((sum, s) => sum + (s.id ? groupedBySubject.find(g => g.subject.id === s.id)?.items.length || 0 : 0), 0)} lý thuyết
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {kiGroups[ki].map(subject => {
                    const subTheories = groupedBySubject.find(g => g.subject.id === subject.id)?.items || [];
                    return (
                      <Collapsible key={subject.id} open={openSubjects.has(subject.id)} onOpenChange={() => toggleSubject(subject.id)}>
                        <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
                          <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
                            {openSubjects.has(subject.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <span className="font-semibold">{subject.name}</span>
                            <Badge variant="secondary" className="ml-2">{subTheories.length}</Badge>
                          </CollapsibleTrigger>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => openCreate(subject.id)}>
                            <Plus className="h-3 w-3" /> Thêm
                          </Button>
                        </div>
                        <CollapsibleContent>
                          {subTheories.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-4 text-center">Chưa có lý thuyết nào cho môn này.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                              {subTheories.map(item => <TheoryCard key={item.id} item={item} />)}
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {noSubjectItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-muted-foreground mb-3">Không xác định môn</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {noSubjectItems.map(item => <TheoryCard key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Chưa có lý thuyết nào.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Chỉnh sửa lý thuyết' : 'Thêm lý thuyết mới'}</DialogTitle>
            <DialogDescription>Điền thông tin lý thuyết bên dưới</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Môn học *</label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue placeholder="Chọn môn học" /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tiêu đề *</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nhập tiêu đề" />
            </div>
            <div>
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả ngắn (tùy chọn)" rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium">Loại nội dung *</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {(Object.entries(contentTypeConfig) as [ContentType, typeof contentTypeConfig[ContentType]][]).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button key={key} type="button" onClick={() => setContentType(key)}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                        contentType === key ? 'border-primary bg-primary/5 text-primary' : 'border-muted hover:bg-muted/50'
                      }`}>
                      <Icon className="h-4 w-4" /> {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {contentType === 'images' && (
              <div>
                <label className="text-sm font-medium">Tải ảnh lên</label>
                {existingImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 mb-2">
                    {existingImages.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg" />
                        <button onClick={() => removeExistingImage(i)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Input type="file" accept="image/*" multiple onChange={e => setImageFiles(Array.from(e.target.files || []))} />
                {imageFiles.length > 0 && <p className="text-xs text-muted-foreground mt-1">{imageFiles.length} ảnh mới được chọn</p>}
              </div>
            )}
            {contentType === 'files' && (
              <div>
                <label className="text-sm font-medium">Tải file lên</label>
                {existingFileUrl && <p className="text-xs text-muted-foreground mt-1 mb-2">Đã có {existingFileUrl.split(',').length} file. Upload mới sẽ thay thế.</p>}
                <Input type="file" multiple onChange={e => setDocFiles(Array.from(e.target.files || []))} />
                {docFiles.length > 0 && <p className="text-xs text-muted-foreground mt-1">{docFiles.length} file mới được chọn</p>}
              </div>
            )}
            {contentType === 'link' && (
              <div>
                <label className="text-sm font-medium">URL trang web</label>
                <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://example.com" />
              </div>
            )}
            {contentType === 'youtube' && (
              <div>
                <label className="text-sm font-medium">URL YouTube</label>
                <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
              </div>
            )}

            <Button onClick={handleSubmit} disabled={submitting} className="w-full gradient-sakura text-white">
              {submitting ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
