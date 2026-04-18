import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
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
import { Plus, Pencil, ChevronDown, ChevronRight, BookOpen, FileText, Layers, Trash2, Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Đề FE': { bg: 'bg-red-100 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-300 dark:border-red-700' },
  'Đề PE': { bg: 'bg-yellow-100 dark:bg-yellow-950/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-300 dark:border-yellow-700' },
  'Đề PT': { bg: 'bg-blue-100 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-700' },
};

const CATEGORY_BAR_COLORS: Record<string, string> = {
  'Đề FE': '#ef4444',
  'Đề PE': '#eab308',
  'Đề PT': '#3b82f6',
};

export default function AdminExamsPage() {
  const { profile } = useAuthStore();
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editExam, setEditExam] = useState<any>(null);
  const [form, setForm] = useState({ title: '', subject_id: '', category_id: '', description: '', duration_minutes: '' });
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [examImages, setExamImages] = useState<File[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [e, s, c] = await Promise.all([
      supabase.from('exams').select('*').order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').order('order_index'),
      supabase.from('categories').select('*'),
    ]);
    
    // Join data manually in frontend
    const examsWithDetails = (e.data || []).map(exam => ({
      ...exam,
      subjects: s.data?.find(sub => sub.id === exam.subject_id),
      categories: c.data?.find(cat => cat.id === exam.category_id)
    }));
    
    setExams(examsWithDetails);
    setSubjects(s.data || []);
    setCategories(c.data || []);
  };

  const saveExam = async () => {
    if (!form.title.trim() || !form.subject_id) {
      toast.error('Vui lòng nhập tiêu đề và chọn môn');
      return;
    }

    let categoryId: number | null = null;
    if (form.category_id && ['pe', 'pt', 'fe'].includes(form.category_id)) {
      const catName = form.category_id === 'pe' ? 'Đề PE' : form.category_id === 'pt' ? 'Đề PT' : 'Đề FE';
      const existing = categories.find(c => c.subject_id === parseInt(form.subject_id) && c.name === catName);
      if (existing) {
        categoryId = existing.id;
      } else {
        const { data: newCat } = await supabase.from('categories').insert({
          name: catName, subject_id: parseInt(form.subject_id), order_index: form.category_id === 'pe' ? 1 : form.category_id === 'pt' ? 2 : 3
        }).select().single();
        if (newCat) categoryId = newCat.id;
      }
    } else if (form.category_id) {
      categoryId = parseInt(form.category_id);
    }

    // Upload file if selected and it's a PE exam
    let fileUrl = editExam?.file_upload || null;
    if (selectedFile && form.category_id === 'pe') {
      setUploadingFile(true);
      try {
        const fileName = `exam-${Date.now()}-${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('exam-files')
          .upload(fileName, selectedFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from('exam-files')
          .getPublicUrl(fileName);

        fileUrl = urlData.publicUrl;
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error('Lỗi khi tải lên file');
        setUploadingFile(false);
        return;
      }
      setUploadingFile(false);
    }

    // Upload images if selected and it's a PE exam
    if (examImages.length > 0 && form.category_id === 'pe') {
      setUploadingFile(true);
      try {
        // First create the exam to get the ID
        let examId = editExam?.id;
        if (!examId) {
          const { data: newExam } = await supabase.from('exams').insert({
            title: form.title,
            subject_id: parseInt(form.subject_id),
            category_id: categoryId,
            description: form.description || null,
            duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
            file_upload: fileUrl,
            created_by: profile!.id,
          }).select('id').single();
          examId = newExam.id;
        }

        // Upload images and create questions
        for (let i = 0; i < examImages.length; i++) {
          const image = examImages[i];
          const fileName = `exam-${examId}-q${i + 1}-${Date.now()}.${image.name.split('.').pop()}`;
          
          const { error: uploadError } = await supabase.storage
            .from('question-images')
            .upload(fileName, image);

          if (uploadError) {
            throw uploadError;
          }

          const { data: urlData } = supabase.storage
            .from('question-images')
            .getPublicUrl(fileName);

          // Create question with image
          await supabase.from('questions').insert({
            exam_id: examId,
            image_url: urlData.publicUrl,
            order_index: i + 1,
          });
        }

        setUploadingFile(false);
      } catch (error) {
        console.error('Error uploading images:', error);
        toast.error('Lỗi khi tải lên ảnh');
        setUploadingFile(false);
        return;
      }
    }

    const payload = {
      title: form.title,
      subject_id: parseInt(form.subject_id),
      category_id: categoryId,
      description: form.description || null,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      file_upload: fileUrl,
      created_by: profile!.id,
    };

    if (editExam && (form.category_id !== 'pe' || examImages.length === 0)) {
      await supabase.from('exams').update(payload).eq('id', editExam.id);
      toast.success('Đã cập nhật');
    } else if (!editExam) {
      await supabase.from('exams').insert(payload);
      toast.success('Đã tạo đề');
    }

    setShowForm(false);
    setEditExam(null);
    setSelectedFile(null);
    setExamImages([]);
    loadData();
  };

  const togglePublish = async (exam: any) => {
    await supabase.from('exams').update({ is_published: !exam.is_published }).eq('id', exam.id);
    loadData();
  };

  const deleteExam = async (examId: number) => {
    if (!confirm('Xoá đề thi này? Tất cả câu hỏi và đáp án liên quan cũng sẽ bị xoá.')) return;
    // Delete answers first, then questions, then exam
    const { data: questions } = await supabase.from('questions').select('id').eq('exam_id', examId);
    if (questions && questions.length > 0) {
      const qIds = questions.map(q => q.id);
      await supabase.from('answers').delete().in('question_id', qIds);
      await supabase.from('questions').delete().eq('exam_id', examId);
    }
    await supabase.from('exams').delete().eq('id', examId);
    toast.success('Đã xoá đề thi');
    loadData();
  };

  // Group subjects by kì and exams by subject
  const kiGroups: Record<number, any[]> = {};
  subjects.forEach(s => {
    const ki = s.order_index || 0;
    if (!kiGroups[ki]) kiGroups[ki] = [];
    kiGroups[ki].push(s);
  });
  const kiKeys = Object.keys(kiGroups).map(Number).sort((a, b) => a - b);

  const examsBySubject: Record<number, any[]> = {};
  exams.forEach(e => {
    if (!examsBySubject[e.subject_id]) examsBySubject[e.subject_id] = [];
    examsBySubject[e.subject_id].push(e);
  });

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

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Đề thi</h1>
          <p className="text-sm text-muted-foreground">{exams.length} đề — {subjects.length} môn — {kiKeys.length} kì</p>
        </div>
        <Button onClick={() => { setEditExam(null); setForm({ title: '', subject_id: '', category_id: '', description: '', duration_minutes: '' }); setSelectedFile(null); setExamImages([]); setShowForm(true); }}
          style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm đề
        </Button>
      </div>

      {/* Group by Kì */}
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
                      {kiGroups[ki].reduce((sum, s) => sum + (examsBySubject[s.id]?.length || 0), 0)} đề
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {kiGroups[ki].map(sub => {
                  const subExams = examsBySubject[sub.id] || [];
                  const isExpanded = expandedSubject === sub.id;
                  const catGroups: Record<string, any[]> = { 'Chưa phân loại': [] };
                  subExams.forEach(e => {
                    const catName = (e.categories as any)?.name || 'Chưa phân loại';
                    if (!catGroups[catName]) catGroups[catName] = [];
                    catGroups[catName].push(e);
                  });

                  return (
                    <Card key={sub.id} className="border shadow-sm overflow-hidden">
                      <button
                        className="w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
                        onClick={() => setExpandedSubject(isExpanded ? null : sub.id)}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                          style={{ background: KI_COLORS[ki] || KI_COLORS[1] }}>
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{sub.name}</h3>
                          <p className="text-xs text-muted-foreground">{subExams.length} đề thi</p>
                        </div>
                        <Badge variant="secondary">{subExams.length}</Badge>
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </button>

                      {isExpanded && (
                        <div className="border-t px-4 pb-4 animate-slide-down">
                          {subExams.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">Chưa có đề thi nào cho môn này</p>
                          ) : (
                            Object.entries(catGroups).filter(([, exs]) => exs.length > 0).map(([catName, catExams]) => {
                              const catColor = CATEGORY_COLORS[catName];
                              const barColor = CATEGORY_BAR_COLORS[catName];
                              return (
                                <div key={catName} className="mt-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    {barColor && <div className="w-3 h-3 rounded-full" style={{ background: barColor }} />}
                                    {!barColor && <Layers className="h-3.5 w-3.5 text-muted-foreground" />}
                                    <span className={cn("text-sm font-semibold", catColor?.text || 'text-muted-foreground')}>{catName}</span>
                                    <Badge variant="outline" className={cn("text-xs", catColor?.text, catColor?.border)}>{catExams.length}</Badge>
                                    <div className="flex-1 h-px bg-border" />
                                  </div>
                                  <div className="space-y-1.5">
                                    {catExams.map(e => (
                                      <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/30 transition-colors">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <span className="text-sm font-medium truncate">{e.title}</span>
                                            {catColor && (
                                              <Badge className={cn("text-xs border", catColor.bg, catColor.text, catColor.border)}>
                                                {catName}
                                              </Badge>
                                            )}
                                            {e.is_published ? (
                                              <Badge variant="outline" className="text-xs text-green-600 border-green-300">Published</Badge>
                                            ) : (
                                              <Badge variant="secondary" className="text-xs">Draft</Badge>
                                            )}
                                          </div>
                                          {e.description && <p className="text-xs text-muted-foreground ml-5 truncate">{e.description}</p>}
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <Switch checked={e.is_published} onCheckedChange={() => togglePublish(e)} />
                                          <Button size="sm" variant="ghost" onClick={() => {
                                            setEditExam(e);
                                            setForm({ title: e.title, subject_id: String(e.subject_id), category_id: e.category_id ? String(e.category_id) : '', description: e.description || '', duration_minutes: e.duration_minutes ? String(e.duration_minutes) : '' });
                                            setSelectedFile(null);
                                            setExamImages([]);
                                            setShowForm(true);
                                          }}>
                                            <Pencil className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => deleteExam(e.id)}>
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                          <Link to={`/admin/exams/${e.id}/questions`}>
                                            <Button size="sm" variant="outline" className="text-xs">Câu hỏi</Button>
                                          </Link>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {subjects.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Chưa có môn học nào. Tạo môn học trước!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Form dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editExam ? 'Sửa' : 'Thêm'} Đề thi</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Tiêu đề *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" /></div>
            <div><Label>Môn *</Label>
              <Select value={form.subject_id} onValueChange={v => setForm({ ...form, subject_id: v, category_id: '' })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn môn" /></SelectTrigger>
                <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Loại đề</Label>
              <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn loại đề" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pe">Đề PE (ôntập)</SelectItem>
                  <SelectItem value="pt">Đề PT</SelectItem>
                  <SelectItem value="fe">Đề FE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* PE Exam Fields - Only show for PE */}
            {form.category_id === 'pe' ? (
              <>
                {/* Image Upload for PE */}
                <div>
                  <Label>Ảnh đề thi</Label>
                  <div className="mt-1">
                    <div className="border-2 border-dashed rounded-lg p-4 text-center max-h-60 overflow-y-auto">
                      {examImages.length > 0 ? (
                        <div className="space-y-2">
                          {examImages.map((image, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <div className="flex items-center gap-2">
                                <File className="h-4 w-4 text-blue-500" />
                                <span className="text-sm">{image.name}</span>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => {
                                const newImages = examImages.filter((_, i) => i !== index);
                                setExamImages(newImages);
                              }}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <div className="pt-2">
                            <Label htmlFor="images-upload" className="cursor-pointer">
                              <Button size="sm" variant="outline" asChild>
                                <span>Thêm ảnh</span>
                              </Button>
                            </Label>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground mb-2">Chọn ảnh đề thi</p>
                          <Label htmlFor="images-upload" className="cursor-pointer">
                            <Button size="sm" variant="outline" asChild>
                              <span>Chọn ảnh</span>
                            </Button>
                          </Label>
                        </div>
                      )}
                      <Input
                        id="images-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const files = Array.from(e.target.files || []);
                          setExamImages([...examImages, ...files]);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* File Upload for PE */}
                <div>
                  <Label>File tài liệu (.zip)</Label>
                  <div className="mt-1">
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {selectedFile ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">{selectedFile.name}</span>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => setSelectedFile(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : editExam?.file_upload ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Đã có file</span>
                          </div>
                          <div>
                            <Label htmlFor="file-upload" className="cursor-pointer">
                              <Button size="sm" variant="outline" asChild>
                                <span>Thay đổi</span>
                              </Button>
                            </Label>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground mb-2">Chọn file .zip</p>
                          <Label htmlFor="file-upload" className="cursor-pointer">
                            <Button size="sm" variant="outline" asChild>
                              <span>Chọn file</span>
                            </Button>
                          </Label>
                        </div>
                      )}
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".zip,.rar,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Regular Exam Fields - Show for PT/FE */
              <>
                <div><Label>Mô tả</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
                <div><Label>Thời gian (phút)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} className="mt-1" /></div>
              </>
            )}
            
            <Button onClick={saveExam} disabled={uploadingFile} className="w-full" style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
              {uploadingFile ? 'Đang xử lý...' : 'Lưu'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
