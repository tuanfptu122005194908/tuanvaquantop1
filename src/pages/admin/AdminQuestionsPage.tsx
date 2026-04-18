import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { parseAnswers, formatAnswersForDisplay } from '@/lib/answerParser';
import { parseQuestions } from '@/lib/questionParser';
import { Trash2, Upload, Image, FileText, CheckCircle2, ChevronLeft, Pencil, Eye, X, Loader2, RotateCcw, Plus, GripVertical, ArrowUp, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import PDFExport from '@/components/PDFExport';

export default function AdminQuestionsPage() {
  const { examId } = useParams();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [textInput, setTextInput] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [answerInput, setAnswerInput] = useState('');
  const [parsedAnswers, setParsedAnswers] = useState<Record<number, string[]>>({});
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editQuestion, setEditQuestion] = useState<any>(null);
  const [editAnswers, setEditAnswers] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAddingQuestions, setIsAddingQuestions] = useState(false);
  const [isAddingAnswers, setIsAddingAnswers] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isClearingAllAnswers, setIsClearingAllAnswers] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => { loadData(); }, [examId]);

  const loadData = async () => {
    const { data: e } = await supabase.from('exams').select('*, subjects(name)').eq('id', parseInt(examId!)).single();
    setExam(e);
    const { data: qs } = await supabase.from('questions').select('*, answers(*)').eq('exam_id', parseInt(examId!)).order('order_index');
    setQuestions(qs || []);
  };

  // Tab A: Upload images
  const handleImageUpload = async () => {
    if (imageFiles.length === 0) return;
    setUploading(true);
    try {
      const eid = parseInt(examId!);
      const maxOrder = questions.length;

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const path = `exam-${eid}/${Date.now()}-${i}.${file.name.split('.').pop()}`;
        const { error: upErr } = await supabase.storage.from('question-images').upload(path, file);
        if (upErr) { toast.error(`Upload lỗi: ${file.name}`); continue; }
        const { data: urlData } = supabase.storage.from('question-images').getPublicUrl(path);

        const { data: q } = await supabase.from('questions').insert({
          exam_id: eid, image_url: urlData.publicUrl, order_index: maxOrder + i + 1
        }).select().single();

        if (q) {
          await supabase.from('answers').insert(
            ['A', 'B', 'C', 'D', 'E', 'F'].map(label => ({ question_id: q.id, label, content: null, is_correct: false }))
          );
        }
      }
      toast.success(`Đã upload ${imageFiles.length} câu hỏi`);
      setImageFiles([]);
      loadData();
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Có lỗi khi upload hình ảnh');
    } finally {
      setUploading(false);
    }
  };

  // Tab B: Paste text
  const handleParseText = () => {
    const parsed = parseQuestions(textInput);
    setParsedQuestions(parsed);
  };

  const confirmTextQuestions = async () => {
    setIsAddingQuestions(true);
    try {
      const eid = parseInt(examId!);
      
      for (const pq of parsedQuestions) {
        const { data: q } = await supabase.from('questions').insert({
          exam_id: eid, question_text: pq.question_text, order_index: pq.order_index,
        }).select().single();
        
        if (q) {
          // Extract available answers from raw text for this specific question
          const questionBlocks = textInput.split(/Câu\s*(\d+)\s*[:：.]?\s*/i);
          const questionIndex = pq.order_index;
          let availableLabels: string[] = [];
          let answerContents: Record<string, string> = {};
          
          // Find the content block for this question
          const contentIndex = questionBlocks.findIndex((block, idx) => 
            idx > 0 && parseInt(questionBlocks[idx]) === questionIndex
          );
          
          if (contentIndex > 0 && questionBlocks[contentIndex + 1]) {
            const content = questionBlocks[contentIndex + 1].trim();
            const lines = content.split('\n').map(line => line.trim()).filter(line => line);
            
            for (const line of lines) {
              // Check if line starts with answer option (A-Z) with dot or parenthesis
              if (/^[A-Z]\s*[\.\)]/.test(line)) {
                const label = line.charAt(0); // Get first character (A, B, C, etc.)
                const answerContent = line.replace(/^[A-Z]\s*[\.\)]\s*/, '').trim(); // Remove "A.", "B)", etc.
                
                if (!availableLabels.includes(label)) {
                  availableLabels.push(label);
                  answerContents[label] = answerContent;
                }
              }
            }
          }
          
          // If no answers found in text, create default A-D with null content
          if (availableLabels.length === 0) {
            availableLabels = ['A', 'B', 'C', 'D'];
            availableLabels.forEach(label => {
              answerContents[label] = null;
            });
          }
          
          // Create answers based on detected labels and content
          await supabase.from('answers').insert(
            availableLabels.map(label => ({ 
              question_id: q.id, 
              label, 
              content: answerContents[label], 
              is_correct: false 
            }))
          );
        }
      }
      
      toast.success(`Đã thêm ${parsedQuestions.length} câu`);
      setTextInput(''); setParsedQuestions([]);
      loadData();
    } catch (error) {
      console.error('Error adding questions:', error);
      toast.error('Có lỗi khi thêm câu hỏi');
    } finally {
      setIsAddingQuestions(false);
    }
  };

  // Smart answer parser
  const handleParseAnswers = () => {
    const parsed = parseAnswers(answerInput);
    setParsedAnswers(parsed);
  };

  const confirmAnswers = async () => {
    setIsAddingAnswers(true);
    try {
      let updated = 0;
      let invalidAnswers: string[] = [];
      
      for (const [qIndex, correctLabels] of Object.entries(parsedAnswers)) {
        const q = questions[parseInt(qIndex) - 1];
        if (!q) continue;
        
        // Get available answers for this question
        const availableAnswers = (q.answers as any[]) || [];
        const availableLabels = availableAnswers.map(a => a.label);
        
        // Check if all correct answers exist in database
        for (const correctLabel of correctLabels) {
          if (!availableLabels.includes(correctLabel)) {
            invalidAnswers.push(`Câu ${qIndex}: đáp án ${correctLabel} không tồn tại (có sẵn: [${availableLabels.join(', ')}])`);
          }
        }
        
        // First, set all answers to false
        await supabase.from('answers').update({ is_correct: false }).eq('question_id', q.id);
        
        // Then, set correct answers to true (handle multiple correct answers)
        for (const correctLabel of correctLabels) {
          if (availableLabels.includes(correctLabel)) {
            const { data } = await supabase.from('answers').update({ is_correct: true }).eq('question_id', q.id).eq('label', correctLabel).select();
            if (data && data.length > 0) updated++;
          }
        }
      }
      
      // Show error message for invalid answers
      if (invalidAnswers.length > 0) {
        toast.error(`Đáp án không hợp lệ:\n${invalidAnswers.join('\n')}`);
        return;
      }
      
      toast.success(`Đã cập nhật ${updated} đáp án đúng`);
      setAnswerInput(''); setParsedAnswers({});
      loadData();
    } catch (error) {
      console.error('Error updating answers:', error);
      toast.error('Có lỗi khi cập nhật đáp án');
    } finally {
      setIsAddingAnswers(false);
    }
  };

  const deleteQuestion = async (id: number) => {
    if (!confirm('Xóa câu hỏi này?')) return;
    setIsDeleting(id);
    try {
      await supabase.from('questions').delete().eq('id', id);
      toast.success('Đã xóa câu hỏi');
      loadData();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Có lỗi khi xóa câu hỏi');
    } finally {
      setIsDeleting(null);
    }
  };

  const deleteAllQuestions = async () => {
    if (questions.length === 0) {
      toast.info('Không có câu hỏi nào để xóa');
      return;
    }
    
    if (!confirm(`Xóa toàn bộ ${questions.length} câu hỏi của đề thi này? Hành động này không thể hoàn tác!`)) return;
    
    setIsDeletingAll(true);
    try {
      // Delete all questions and their answers (cascade delete)
      const { error } = await supabase.from('questions').delete().eq('exam_id', parseInt(examId!));
      
      if (error) {
        console.error('Error deleting all questions:', error);
        toast.error('Có lỗi khi xóa câu hỏi');
        return;
      }
      
      toast.success(`Đã xóa toàn bộ ${questions.length} câu hỏi`);
      loadData();
    } catch (error) {
      console.error('Error deleting all questions:', error);
      toast.error('Có lỗi khi xóa câu hỏi');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const clearAllAnswers = async () => {
    if (questions.length === 0) {
      toast.info('Không có câu hỏi nào để xóa đáp án');
      return;
    }
    
    if (!confirm(`Xóa toàn bộ đáp án của ${questions.length} câu hỏi? Hành động này sẽ đặt tất cả đáp án về trạng thái chưa chọn và không thể hoàn tác!`)) return;
    
    setIsClearingAllAnswers(true);
    try {
      let updated = 0;
      
      // Set all answers to false for all questions
      for (const q of questions) {
        const { error } = await supabase.from('answers').update({ is_correct: false }).eq('question_id', q.id);
        if (error) {
          console.error(`Error clearing answers for question ${q.id}:`, error);
        } else {
          updated++;
        }
      }
      
      toast.success(`Đã xóa đáp án của ${updated} câu hỏi`);
      loadData();
    } catch (error) {
      console.error('Error clearing all answers:', error);
      toast.error('Có lỗi khi xóa đáp án');
    } finally {
      setIsClearingAllAnswers(false);
    }
  };

  // Edit question answers inline
  const openEditQuestion = (q: any) => {
    setEditQuestion(q);
    const sorted = [...(q.answers as any[])].sort((a, b) => a.label.localeCompare(b.label));
    setEditAnswers(sorted);
  };

  const addNewAnswer = async () => {
    if (!editQuestion) return;
    
    // Get existing labels
    const existingLabels = editAnswers.map(a => a.label);
    
    // Find next available label (A-Z)
    let nextLabel = 'A';
    for (let i = 0; i < 26; i++) {
      const label = String.fromCharCode(65 + i); // A-Z
      if (!existingLabels.includes(label)) {
        nextLabel = label;
        break;
      }
    }
    
    // Insert new answer
    const { data: newAnswer } = await supabase.from('answers').insert({
      question_id: editQuestion.id,
      label: nextLabel,
      content: null,
      is_correct: false
    }).select().single();
    
    if (newAnswer) {
      setEditAnswers(prev => [...prev, newAnswer].sort((a, b) => a.label.localeCompare(b.label)));
      toast.success(`Đã thêm đáp án ${nextLabel}`);
    }
  };

  const saveEditAnswers = async () => {
    setIsSavingEdit(true);
    try {
      for (const ans of editAnswers) {
        await supabase.from('answers').update({ content: ans.content, is_correct: ans.is_correct }).eq('id', ans.id);
      }
      toast.success('Đã lưu đáp án');
      setEditQuestion(null);
      loadData();
    } catch (error) {
      console.error('Error saving answers:', error);
      toast.error('Có lỗi khi lưu đáp án');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const toggleCorrect = (answerId: number) => {
    setEditAnswers(prev => prev.map(a => a.id === answerId ? { ...a, is_correct: !a.is_correct } : a));
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    const newQuestions = [...questions];
    const draggedQuestion = newQuestions[draggedIndex];
    
    // Remove from old position
    newQuestions.splice(draggedIndex, 1);
    // Insert at new position
    newQuestions.splice(dropIndex, 0, draggedQuestion);
    
    // Update order_index for all questions
    const updates = newQuestions.map((q, index) => ({
      id: q.id,
      order_index: index
    }));
    
    setIsReordering(true);
    try {
      // Update all questions with new order using individual updates
      for (let i = 0; i < newQuestions.length; i++) {
        const { error } = await supabase
          .from('questions')
          .update({ order_index: i })
          .eq('id', newQuestions[i].id);
        
        if (error) throw error;
      }
      
      setQuestions(newQuestions);
      toast.success('Đã sắp xếp lại câu hỏi thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi sắp xếp câu hỏi');
    } finally {
      setIsReordering(false);
      setDraggedIndex(null);
    }
  };

  // Move question to top
  const moveToTop = async (index: number) => {
    if (index === 0) return; // Already at top
    
    const question = questions[index];
    const otherQuestions = questions.filter((_, i) => i !== index);
    const newQuestions = [question, ...otherQuestions];
    
    setIsReordering(true);
    try {
      // Update all questions with new order
      for (let i = 0; i < newQuestions.length; i++) {
        const { error } = await supabase
          .from('questions')
          .update({ order_index: i })
          .eq('id', newQuestions[i].id);
        
        if (error) throw error;
      }
      
      setQuestions(newQuestions);
      toast.success(`Đã đưa câu ${index + 1} lên vị trí số 1!`);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi sắp xếp câu hỏi');
    } finally {
      setIsReordering(false);
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (questions.length === 0) {
      toast.error('Không có câu hỏi nào để xuất PDF');
      return;
    }

    setIsExportingPDF(true);
    try {
      const { exportToPDF } = PDFExport({ exam, questions, includeAnswers: true });
      await exportToPDF();
      toast.success('Đã xuất PDF thành công!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Có lỗi khi xuất PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (!exam) return <div className="p-6"><p className="text-muted-foreground">Đang tải...</p></div>;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/exams">
          <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{(exam.subjects as any)?.name}</p>
          <h1 className="text-xl font-bold">{exam.title}</h1>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button 
            onClick={handleExportPDF}
            disabled={isExportingPDF || questions.length === 0}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {isExportingPDF ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xuất PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Xuất PDF
              </>
            )}
          </Button>
          <Badge variant="secondary">{questions.length} câu hỏi</Badge>
        </div>
      </div>

      {/* Add questions tabs */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Thêm câu hỏi</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="upload">
            <TabsList>
              <TabsTrigger value="upload" className="gap-2"><Image className="h-4 w-4" /> Upload ảnh</TabsTrigger>
              <TabsTrigger value="text" className="gap-2"><FileText className="h-4 w-4" /> Paste text</TabsTrigger>
              <TabsTrigger value="answers" className="gap-2"><CheckCircle2 className="h-4 w-4" /> Nhập đáp án</TabsTrigger>
            </TabsList>

            {/* Tab A: Image upload */}
            <TabsContent value="upload" className="space-y-3 mt-4">
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                  imageFiles.length > 0 ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                  setImageFiles(prev => [...prev, ...files]);
                }}
              >
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">Kéo & thả ảnh vào đây</p>
                <p className="text-xs text-muted-foreground mb-3">hoặc</p>
                <Label htmlFor="image-upload">
                  <Button variant="outline" size="sm" asChild>
                    <span>Chọn ảnh</span>
                  </Button>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => setImageFiles(Array.from(e.target.files || []))}
                />
              </div>

              {imageFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{imageFiles.length} ảnh đã chọn:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {imageFiles.map((f, i) => (
                      <div key={i} className="relative group">
                        <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-20 object-cover rounded-lg border" />
                        <button
                          onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleImageUpload} disabled={uploading} className="gap-2" style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
                    {uploading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />
                        Đang upload hình ảnh...
                      </>
                    ) : (
                      <><Upload className="h-4 w-4" />
                        Upload {imageFiles.length} hình ảnh
                      </>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Tab B: Paste text */}
            <TabsContent value="text" className="space-y-3 mt-4">
              <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
                <p className="font-semibold">📝 Format Câu Hỏi Mới:</p>
                <p><strong>Ví dụ:</strong></p>
                <code className="bg-muted px-1 rounded block p-2 text-xs">
                  Câu 1: Nội dung câu hỏi thứ nhất<br/>
                  A<br/>
                  B<br/>
                  C<br/>
                  D<br/><br/>
                  Câu 2: Nội dung câu hỏi thứ hai<br/>
                  A<br/>
                  B<br/>
                  C<br/>
                  D
                </code>
                <p className="text-blue-600">💡 Tự động nhận dạng câu hỏi và đáp án!</p>
              </div>
              <Textarea
                placeholder="Câu 1: Nội dung câu hỏi&#10;A&#10;B&#10;C&#10;D&#10;&#10;Câu 2: Nội dung câu hỏi&#10;A&#10;B&#10;C&#10;D"
                rows={8}
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                className="font-mono text-sm"
              />
              <Button onClick={handleParseText} variant="outline" disabled={!textInput.trim()}>
                Parse câu hỏi
              </Button>
              {parsedQuestions.length > 0 && (
                <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                  <p className="text-sm font-medium">Preview — {parsedQuestions.length} câu:</p>
                  <div className="space-y-1 max-h-48 overflow-auto">
                    {parsedQuestions.map((pq, i) => (
                      <div key={i} className="text-sm border rounded p-2 bg-card">
                        <span className="font-medium text-primary">Câu {pq.order_index}:</span>{' '}
                        {pq.question_text.slice(0, 150)}{pq.question_text.length > 150 && '...'}
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={confirmTextQuestions} 
                    disabled={isAddingQuestions}
                    style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}
                    className="disabled:opacity-50"
                  >
                    {isAddingQuestions ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang thêm câu hỏi...
                      </>
                    ) : (
                      `Xác nhận thêm ${parsedQuestions.length} câu`
                    )}
                  </Button>
                </div>
              )}
              
              {/* Available answers display */}
              {parsedQuestions.length > 0 && (
                <div className="space-y-2 border rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Đáp án đã phát hiện:</p>
                  <div className="space-y-1 max-h-32 overflow-auto">
                    {parsedQuestions.map((pq, i) => {
                      // Try to find corresponding question in existing questions first
                      const existingQuestion = questions.find(q => q.order_index === pq.order_index);
                      let availableLabels: string[] = [];
                      
                      if (existingQuestion?.answers && existingQuestion.answers.length > 0) {
                        // Use database answers if they exist
                        availableLabels = existingQuestion.answers.map(a => a.label).sort();
                      } else {
                        // Extract answers from raw text input using the original question blocks
                        const questionBlocks = textInput.split(/Câu\s*(\d+)\s*[:：.]?\s*/i);
                        const questionIndex = pq.order_index;
                        
                        // Find the content block for this question
                        const contentIndex = questionBlocks.findIndex((block, idx) => 
                          idx > 0 && parseInt(questionBlocks[idx]) === questionIndex
                        );
                        
                        if (contentIndex > 0 && questionBlocks[contentIndex + 1]) {
                          const content = questionBlocks[contentIndex + 1].trim();
                          const lines = content.split('\n').map(line => line.trim()).filter(line => line);
                          
                          for (const line of lines) {
                            // Check if line starts with answer option (A-Z) with dot or parenthesis
                            if (/^[A-Z]\s*[\.\)]/.test(line)) {
                              const label = line.charAt(0); // Get first character (A, B, C, etc.)
                              if (!availableLabels.includes(label)) {
                                availableLabels.push(label);
                              }
                            }
                          }
                        }
                        availableLabels.sort();
                      }
                      
                      // Show all available answers
                      return (
                        <div key={i} className="text-sm border rounded p-2 bg-white dark:bg-gray-800">
                          <span className="font-medium text-blue-600 dark:text-blue-400">Câu {pq.order_index}:</span>
                          <span className="ml-2">
                            {availableLabels.length > 0 ? (
                              <span className="font-mono text-xs">
                                [{availableLabels.join(', ')}]
                                {availableLabels.length > 4 && (
                                  <span className="text-orange-500 text-xs ml-1">({availableLabels.length} lựa chọn)</span>
                                )}
                                {!existingQuestion && (
                                  <span className="text-green-500 text-xs ml-1">(từ đề)</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">Chưa có đáp án</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab C: Smart answer parser */}
            <TabsContent value="answers" className="space-y-3 mt-4">
              <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold">📝 Hướng dẫn Format Câu Hỏi:</p>
                <p><strong>Format câu hỏi:</strong></p>
                <p>• <code className="bg-muted px-1 rounded">Câu 1:</code> (tiêu đề câu hỏi)</p>
                <p>• <code className="bg-muted px-1 rounded">A</code> (đáp án A ở dòng mới)</p>
                <p>• <code className="bg-muted px-1 rounded">B</code> (đáp án B ở dòng mới)</p>
                <p>• <code className="bg-muted px-1 rounded">C</code> (đáp án C ở dòng mới)</p>
                <p>• <code className="bg-muted px-1 rounded">D</code> (đáp án D ở dòng mới)</p>
                <p>• <code className="bg-muted px-1 rounded">A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z</code> (đáp án mở rộng)</p>
                <p className="text-yellow-600">💡 Hỗ trợ đến đáp án Z (26 lựa chọn)!</p>
                
                <p><strong>Format đáp án đúng:</strong></p>
                <p>• <code className="bg-muted px-1 rounded">1A 2B 3C</code> (câu 1 đúng A, câu 2 đúng B, câu 3 đúng C)</p>
                <p>• <code className="bg-muted px-1 rounded">1AB 2CD</code> (câu 1 đúng A+B, câu 2 đúng C+D)</p>
                <p>• <code className="bg-muted px-1 rounded">1:A 1:B 2:C</code> (câu 1 đúng A+B, câu 2 đúng C)</p>
                <p>• <code className="bg-muted px-1 rounded">5E 6F 7G</code> (hỗ trợ đáp án E, F, G)</p>
                <p className="text-green-600">✅ Hỗ trợ nhiều đáp án đúng cho mỗi câu!</p>
                
                <p><strong>💡 Mẹo nhập đáp án:</strong></p>
                <p>1. Parse câu hỏi trước để xem đáp án có sẵn</p>
                <p>2. Kiểm tra "Đáp án đã phát hiện" để biết các lựa chọn hợp lệ</p>
                <p>3. Chỉ nhập đáp án có trong danh sách [A, B, C, D, E, ...]</p>
              </div>
              <Textarea
                placeholder="Nhập đáp án đúng: 1A 2B 3C 4D 5E 6F 7G 8H 9I 10J 11K..."
                rows={4}
                value={answerInput}
                onChange={e => setAnswerInput(e.target.value)}
                className="font-mono text-sm"
              />
              <Button onClick={handleParseAnswers} variant="outline" disabled={!answerInput.trim()}>
                Parse đáp án
              </Button>
              {Object.keys(parsedAnswers).length > 0 && (
                <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                  <p className="text-sm font-medium">Preview — {Object.keys(parsedAnswers).length} câu:</p>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                    {Object.entries(parsedAnswers).map(([q, answers]) => (
                      <div key={q} className="border rounded-md p-1.5 text-center text-xs bg-card">
                        <div className="text-muted-foreground">C{q}</div>
                        <div className="font-bold text-primary text-xs">
                          {answers.join('+')}
                        </div>
                        {answers.length > 1 && (
                          <div className="text-xs text-orange-500">nhiều</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={confirmAnswers} 
                    disabled={isAddingAnswers}
                    style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}
                    className="disabled:opacity-50"
                  >
                    {isAddingAnswers ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang cập nhật đáp án...
                      </>
                    ) : (
                      `Xác nhận ${Object.keys(parsedAnswers).length} câu`
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Questions list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Danh sách câu hỏi ({questions.length})</h2>
          <div className="flex gap-2">
            {questions.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearAllAnswers}
                disabled={isClearingAllAnswers}
                className="gap-2"
              >
                {isClearingAllAnswers ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xóa đáp án...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Xóa đáp án
                  </>
                )}
              </Button>
            )}
            {questions.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={deleteAllQuestions}
                disabled={isDeletingAll}
                className="gap-2"
              >
                {isDeletingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Xóa toàn bộ
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {isReordering && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-700 dark:text-blue-300">Đang sắp xếp lại câu hỏi...</span>
            </div>
          )}
          {questions.map((q, i) => (
            <Card 
              key={q.id} 
              className={cn(
                "border shadow-sm hover-scale cursor-move transition-all",
                dragOverIndex === i && "border-blue-400 bg-blue-50 dark:bg-blue-950/20",
                draggedIndex === i && "opacity-50"
              )}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, i)}
            >
              <CardContent className="p-3 flex items-start gap-3">
                <div className="shrink-0 flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))', color: 'white' }}>
                    {i + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  {q.image_url && (
                    <img
                      src={q.image_url} alt=""
                      className="max-h-28 rounded-lg mb-2 cursor-pointer hover:opacity-90 border shadow-sm"
                      onClick={() => setPreviewImage(q.image_url)}
                    />
                  )}
                  {q.question_text && <p className="text-sm line-clamp-2">{q.question_text}</p>}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {(q.answers as any[])?.sort((a: any, b: any) => a.label.localeCompare(b.label)).map((ans: any) => (
                      <Badge
                        key={ans.id}
                        variant={ans.is_correct ? 'default' : 'outline'}
                        className={ans.is_correct ? 'bg-green-500 border-green-500 text-white' : 'text-muted-foreground'}
                      >
                        {ans.label}{ans.content ? `: ${ans.content.slice(0, 25)}` : ''}
                        {ans.is_correct && ' ✓'}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {i > 0 && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200" 
                      onClick={() => moveToTop(i)}
                      disabled={isReordering}
                      title="Đưa lên vị trí số 1"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openEditQuestion(q)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10" 
                    onClick={() => deleteQuestion(q.id)}
                    disabled={isDeleting === q.id}
                  >
                    {isDeleting === q.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {questions.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-10 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3" />
                <p>Chưa có câu hỏi. Hãy thêm câu hỏi bằng các tab ở trên.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit question dialog */}
      <Dialog open={!!editQuestion} onOpenChange={() => setEditQuestion(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sửa câu hỏi & đáp án</DialogTitle>
          </DialogHeader>
          {editQuestion && (
            <div className="space-y-4">
              {editQuestion.image_url && (
                <img src={editQuestion.image_url} alt="" className="max-w-full rounded-lg border" />
              )}
              {editQuestion.question_text && (
                <p className="text-sm font-medium p-3 bg-muted/50 rounded-lg">{editQuestion.question_text}</p>
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Đáp án (click để đặt đúng):</p>
                  <Button size="sm" variant="outline" onClick={addNewAnswer} className="text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Thêm đáp án
                  </Button>
                </div>
                {editAnswers.map(ans => (
                  <div key={ans.id} className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCorrect(ans.id)}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all shrink-0",
                        ans.is_correct ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/30 text-muted-foreground hover:border-primary"
                      )}
                    >
                      {ans.label}
                    </button>
                    <Input
                      value={ans.content || ''}
                      onChange={e => setEditAnswers(prev => prev.map(a => a.id === ans.id ? { ...a, content: e.target.value } : a))}
                      placeholder={`Nội dung đáp án ${ans.label}...`}
                      className="text-sm h-9"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Đáp án đang đúng: <strong>{editAnswers.filter(a => a.is_correct).map(a => a.label).join(', ') || 'Chưa chọn'}</strong></p>
              <div className="flex gap-2">
                <Button 
                    onClick={saveEditAnswers} 
                    className="flex-1" 
                    disabled={isSavingEdit}
                    style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}
                  >
                    {isSavingEdit ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu thay đổi'
                    )}
                  </Button>
                <Button variant="outline" onClick={() => setEditQuestion(null)}>Hủy</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image preview dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Xem ảnh câu hỏi</DialogTitle></DialogHeader>
          {previewImage && <img src={previewImage} alt="" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
