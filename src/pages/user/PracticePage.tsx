import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Clock, BookOpen, CheckCircle2, Send, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

function useTimer(initialSeconds: number | null, onExpire: () => void) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialSeconds === null) return;
    setRemaining(initialSeconds);
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalRef.current!);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [initialSeconds]);

  return remaining;
}

export default function PracticePage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [step, setStep] = useState<'confirm' | 'practice' | 'submitting'>('confirm');
  const [attemptId, setAttemptId] = useState<number | null>(null);
  // Multi-answer: question_id -> Set of selected answer_ids
  const [answers, setAnswers] = useState<Record<number, Set<number>>>({});
  const [loading, setLoading] = useState(true);
  const [activeQ, setActiveQ] = useState<number>(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const durationSeconds = exam?.duration_minutes ? exam.duration_minutes * 60 : null;
  const remaining = useTimer(
    step === 'practice' ? durationSeconds : null,
    () => { 
      if (step === 'practice' && attemptId) {
        // Auto-save current answers before submitting when time expires
        console.log('Time expired, auto-submitting with current answers:', answers);
        toast.info('Hêt giò! Bài thi dang tu dông nôp...');
        submitAttempt(); 
      } else if (step === 'practice' && !attemptId) {
        console.log('Time expired but no attemptId, cannot submit');
        toast.error('Hêt giò! Vui lòng bât dâu làm bài.');
        setStep('confirm');
      }
    }
  );

  useEffect(() => { loadExam(); }, [examId]);

  const loadExam = async () => {
    setLoading(true);
    const { data: examData } = await supabase
      .from('exams')
      .select('*, subjects(name)')
      .eq('id', parseInt(examId!))
      .single();
    setExam(examData);
    const { data: qs } = await supabase
      .from('questions')
      .select('*, answers(*)')
      .eq('exam_id', parseInt(examId!))
      .order('order_index');
    setQuestions(qs || []);
    setLoading(false);
  };

  const startPractice = async () => {
    try {
      const { data, error } = await supabase.from('attempts').insert({
        user_id: profile!.id,
        exam_id: parseInt(examId!),
        status: 'in_progress',
        started_at: new Date().toISOString(),
      }).select().single();
      
      if (error) { 
        toast.error('Không có bài thi nào'); 
        return; 
      }
      
      // Only set step to practice after successful attempt creation
      setStep('practice');
      setAttemptId(data.id);
      
      console.log('Practice started with attemptId:', data.id);
      
      // Load saved answers from localStorage
      const savedAnswers = localStorage.getItem(`practice_${examId}_answers`);
      if (savedAnswers) {
        try {
          const parsed = JSON.parse(savedAnswers);
          const loadedAnswers: Record<number, Set<number>> = {};
          Object.entries(parsed).forEach(([questionId, answerIds]) => {
            loadedAnswers[parseInt(questionId)] = new Set(answerIds as number[]);
          });
          setAnswers(loadedAnswers);
          console.log('Loaded saved answers from localStorage:', loadedAnswers);
        } catch (e) {
          console.error('Error loading saved answers:', e);
        }
      }
    } catch (error) {
      console.error('Error starting practice:', error);
      toast.error('Không có bài thi nào');
    }
  };

  // Toggle một đáp án — cho phép chọn nhiều
  const toggleAnswer = (questionId: number, answerId: number) => {
    setAnswers(prev => {
      const cur = new Set(prev[questionId] || []);
      if (cur.has(answerId)) cur.delete(answerId);
      else cur.add(answerId);
      return { ...prev, [questionId]: cur };
    });
    
    // Auto-save to localStorage
    const currentAnswers = { ...answers };
    const cur = new Set(currentAnswers[questionId] || []);
    if (cur.has(answerId)) cur.delete(answerId);
    else cur.add(answerId);
    currentAnswers[questionId] = cur;
    localStorage.setItem(`practice_${examId}_answers`, JSON.stringify(
      Object.fromEntries(
        Object.entries(currentAnswers).map(([k, v]) => [k, Array.from(v)])
      )
    ));
  };

  // Auto-save answers every 30 seconds
  useEffect(() => {
    if (step !== 'practice' || !attemptId) return;
    
    const interval = setInterval(() => {
      const answersToSave = Object.fromEntries(
        Object.entries(answers).map(([k, v]) => [k, Array.from(v)])
      );
      localStorage.setItem(`practice_${examId}_answers`, JSON.stringify(answersToSave));
      console.log('Auto-saved answers:', Object.keys(answers).length, 'questions answered');
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [step, attemptId, answers, examId]);

  // Save answers when component unmounts
  useEffect(() => {
    return () => {
      if (step === 'practice' && Object.keys(answers).length > 0) {
        const answersToSave = Object.fromEntries(
          Object.entries(answers).map(([k, v]) => [k, Array.from(v)])
        );
        localStorage.setItem(`practice_${examId}_answers`, JSON.stringify(answersToSave));
        console.log('Saved answers on unmount');
      }
    };
  }, [step, answers, examId]);

  const submitAttempt = async () => {
    console.log('submitAttempt called, attemptId:', attemptId, 'step:', step);
    if (!attemptId) {
      console.error('No attemptId, cannot submit');
      return;
    }
    console.log('Setting step to submitting...');
    setStep('submitting');
    try {
      const attemptAnswersData: any[] = [];

      questions.forEach(q => {
        const selectedIds = answers[q.id] ? Array.from(answers[q.id]) : [];
        const correctIds = (q.answers as any[]).filter((a: any) => a.is_correct).map((a: any) => a.id);

        // Đúng khi selected set === correct set (thứ tự không quan trọng)
        const selectedSet = new Set(selectedIds);
        const correctSet = new Set(correctIds);
        const isFullyCorrect =
          selectedSet.size === correctSet.size &&
          [...selectedSet].every(id => correctSet.has(id));

        if (selectedIds.length === 0) {
          // Không chọn câu nào
          attemptAnswersData.push({
            attempt_id: attemptId,
            question_id: q.id,
            answer_id: null,
            is_correct: false,
          });
        } else {
          // Ghi nhận tất cả lựa chọn — dùng answer_id của lựa chọn đầu để đặt is_correct
          selectedIds.forEach((aid, idx) => {
            attemptAnswersData.push({
              attempt_id: attemptId,
              question_id: q.id,
              answer_id: aid,
              is_correct: idx === 0 ? isFullyCorrect : false, // chỉ câu đầu mang is_correct
            });
          });
        }
      });

      await supabase.from('attempt_answers').insert(attemptAnswersData);

      const totalQuestions = questions.length;
      // Tính số câu đúng: mỗi question_id có is_correct = true ở record đầu
      const correctCount = questions.filter(q => {
        const selectedIds = answers[q.id] ? Array.from(answers[q.id]) : [];
        if (selectedIds.length === 0) return false;
        const correctIds = new Set((q.answers as any[]).filter((a: any) => a.is_correct).map((a: any) => a.id));
        const selectedSet = new Set(selectedIds);
        return selectedSet.size === correctIds.size && [...selectedSet].every(id => correctIds.has(id));
      }).length;

      const score = Math.round((correctCount / totalQuestions) * 10 * 100) / 100;
      
      console.log('Score calculation:', {
        totalQuestions,
        correctCount,
        score,
        answersCount: Object.keys(answers).length
      });

      await supabase.from('attempts').update({
        score, total_questions: totalQuestions, correct_count: correctCount,
        status: 'submitted', submitted_at: new Date().toISOString(),
      }).eq('id', attemptId);

      // Tự động xoá các bài cũ hơn, chỉ giữ 5 bài gần nhất
      const { data: allAttempts } = await supabase
        .from('attempts')
        .select('id')
        .eq('user_id', profile!.id)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });
      
      if (allAttempts && allAttempts.length > 5) {
        // Lấy 5 bài gần nhất và xoá các bài còn lại
        const attemptsToKeep = allAttempts.slice(0, 5);
        const attemptsToDelete = allAttempts.slice(5);
        
        if (attemptsToDelete.length > 0) {
          const idsToDelete = attemptsToDelete.map(a => a.id);
          await supabase
            .from('attempts')
            .delete()
            .in('id', idsToDelete);
        }
      }

      // Clear saved answers from localStorage
      localStorage.removeItem(`practice_${examId}_answers`);

      navigate(`/result/${attemptId}`);
    } catch (error) {
      console.error('Error in submitAttempt:', error);
      toast.error('Có lỗi khi nộp bài');
      setStep('practice');
    }
  };

  if (loading) {
    return <div className="container py-8 max-w-lg mx-auto"><div className="skeleton h-64 rounded-xl" /></div>;
  }
  if (!exam) return <div className="container py-6"><p>Không tìm thấy đề thi.</p></div>;

  // ──────── CONFIRM SCREEN ────────
  if (step === 'confirm') {
    return (
      <div className="container py-8 animate-slide-up">
        <div className="max-w-lg mx-auto">
          <Card className="border shadow-lg overflow-hidden">
            <div className="h-2" style={{ background: 'linear-gradient(90deg, hsl(330,65%,60%), hsl(270,55%,60%))' }} />
            <CardContent className="p-8 space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">{exam.title}</h1>
                {exam.description && <p className="text-muted-foreground text-sm">{exam.description}</p>}
              </div>
              <div className="flex justify-center gap-3">
                <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1">
                  <BookOpen className="h-3.5 w-3.5" /> {questions.length} câu
                </Badge>
                {exam.duration_minutes && (
                  <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1">
                    <Clock className="h-3.5 w-3.5" /> {exam.duration_minutes} phút
                  </Badge>
                )}
              </div>
              <div className="bg-muted/40 rounded-xl p-4 text-sm text-muted-foreground text-left space-y-1.5">
                <p>• Mỗi câu có thể có nhiều đáp án đúng</p>
                <p>• Chỉ tính đúng khi chọn <strong>đúng và đủ</strong> tất cả đáp án</p>
                {exam.duration_minutes && <p>• Thời gian: {exam.duration_minutes} phút</p>}
              </div>
              <Button onClick={startPractice} size="lg" className="w-full h-12 font-semibold"
                style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
                Bắt đầu làm bài →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).filter(qid => (answers[parseInt(qid)]?.size || 0) > 0).length;
  const unansweredCount = questions.length - answeredCount;
  const progress = (answeredCount / questions.length) * 100;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const goToPrevious = () => {
    if (activeQ > 0) setActiveQ(activeQ - 1);
  };

  const goToNext = () => {
    if (activeQ < questions.length - 1) setActiveQ(activeQ + 1);
  };

  const goToQuestion = (index: number) => {
    setActiveQ(index);
  };

  const handleSubmitClick = () => {
    setShowSubmitDialog(true);
  };

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 px-6 pt-6">
        <h1 className="font-bold text-lg flex-1 truncate min-w-32">{exam.title}</h1>
        {remaining !== null && (
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-sm border",
            remaining < 300 ? "text-destructive border-destructive/30 bg-destructive/5" : "border-border"
          )}>
            <Clock className="h-4 w-4" />
            {formatTime(remaining)}
          </div>
        )}
        <Badge variant="secondary" className="text-sm">{answeredCount}/{questions.length}</Badge>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-5">
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question Navigation */}
      <div className="flex gap-6 px-6">
        {/* Sidebar */}
        <div className="hidden md:block w-24 shrink-0">
          <div className="sticky top-4 border rounded-xl p-2 bg-card shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {answeredCount}/{questions.length} câu
            </p>
            <div className="grid grid-cols-3 gap-1">
              {questions.map((q, i) => {
                const sel = answers[q.id];
                const done = sel && sel.size > 0;
                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(i)}
                    className={cn(
                      "h-5 w-5 flex items-center justify-center text-xs rounded-lg border font-medium transition-all",
                      activeQ === i
                        ? "border-primary text-primary bg-primary/10"
                        : done
                        ? "border-primary text-primary bg-primary/10"
                        : "hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    {done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Câu {activeQ + 1} / {questions.length}
              </p>
            </div>
          </div>
          <Button className="w-full gap-2 mt-3" onClick={handleSubmitClick}
              style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
              <Send className="h-4 w-4" /> Nộp bài
            </Button>
        </div>

        {/* Main Content - Carousel */}
        <div className="flex-1">
          <Card className="border shadow-sm">
            <CardContent className="p-0">
              {/* Navigation Buttons */}
              <div className="flex items-center justify-between p-4 border-b">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  disabled={activeQ === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Câu trước
                </Button>
                
                <span className="text-sm font-medium text-muted-foreground">
                  Câu {activeQ + 1} / {questions.length}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  disabled={activeQ === questions.length - 1}
                  className="gap-2"
                >
                  Câu tiếp
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Question Content - Dynamic Layout */}
              <div className="p-6">
                {!questions[activeQ] ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Không tìm câu câu này</p>
                  </div>
                ) : questions[activeQ]?.image_url ? (
                  // Image question: 2 column layout
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-1">
                    {/* Left Column - Image (11/12 width) */}
                    <div className="lg:col-span-11 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          answers[questions[activeQ]?.id]?.size ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}>
                          {activeQ + 1}
                        </span>
                        <h3 className="font-medium">Câu hỏi</h3>
                      </div>
                      
                      {questions[activeQ]?.question_text && (
                        <p className="text-sm leading-relaxed font-medium p-3 bg-muted/30 rounded-lg">
                          {questions[activeQ]?.question_text}
                        </p>
                      )}
                      
                      {questions[activeQ]?.image_url && (
                        <div className="relative group">
                          <img
                            src={questions[activeQ]?.image_url}
                            alt={`Câu ${activeQ + 1}`}
                            className="w-full rounded-lg border shadow-sm cursor-pointer transition-transform hover:scale-[1.02] max-h-[92vh] object-contain"
                            onClick={() => window.open(questions[activeQ]?.image_url, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-lg pointer-events-none flex items-center justify-center">
                            <ZoomIn className="h-8 w-8 text-white/0 group-hover:text-white/80 transition-all" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Answers (1/12 width = 96px) */}
                    <div className="w-24 space-y-2">
                      <div className="flex items-center gap-1">
                        <h3 className="font-medium text-xs">Đáp án</h3>
                      </div>
                      
                      <div className="space-y-1">
                        {[...(questions[activeQ]?.answers as any[])].sort((a, b) => a.label.localeCompare(b.label)).map((ans: any) => {
                          const isSelected = answers[questions[activeQ]?.id]?.has(ans.id);
                          return (
                            <button
                              key={ans.id}
                              onClick={() => { toggleAnswer(questions[activeQ]?.id!, ans.id); }}
                              className={cn(
                                "flex items-center gap-1 p-1 rounded-lg border transition-all w-full",
                                isSelected
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                              )}
                            >
                              <span className={cn(
                                "shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold border",
                                isSelected
                                  ? "bg-primary border-primary text-white"
                                  : "border-muted-foreground/30 text-muted-foreground"
                              )}>
                                {ans.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Text question: full width layout
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        answers[questions[activeQ]?.id]?.size ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {activeQ + 1}
                      </span>
                      <h3 className="font-medium">Câu hỏi</h3>
                    </div>
                    
                    {questions[activeQ]?.question_text && (
                      <p className="text-base leading-relaxed font-medium p-4 bg-muted/30 rounded-lg">
                        {questions[activeQ].question_text}
                      </p>
                    )}
                    
                    {/* Answer labels grid - full width */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[...(questions[activeQ]?.answers as any[])].sort((a, b) => a.label.localeCompare(b.label)).map((ans: any) => {
                        const isSelected = answers[questions[activeQ]?.id]?.has(ans.id);
                        return (
                          <button
                            key={ans.id}
                            onClick={() => { toggleAnswer(questions[activeQ]?.id!, ans.id); }}
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all text-left",
                              isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                            )}
                          >
                            <span className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border-2 shrink-0 transition-all",
                              isSelected
                                ? "bg-primary border-primary text-white"
                                : "border-muted-foreground/30 text-muted-foreground"
                            )}>
                              {ans.label}
                            </span>
                            {ans.content && (
                              <span className="text-xs font-medium text-muted-foreground">{ans.content}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Navigation */}
              <div className="flex items-center justify-between p-4 border-t md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  disabled={activeQ === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-sm font-medium text-muted-foreground">
                  {activeQ + 1} / {questions.length}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  disabled={activeQ === questions.length - 1}
                  className="gap-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mobile submit */}
          <div className="md:hidden sticky bottom-4 pt-2">
            <Button className="w-full h-12 font-semibold shadow-xl gap-2" onClick={handleSubmitClick}
              style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
              <Send className="h-4 w-4" /> Nộp bài ({answeredCount}/{questions.length})
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận nộp bài?</AlertDialogTitle>
            <AlertDialogDescription>
              {unansweredCount > 0
                ? `Bạn còn ${unansweredCount} câu chưa chọn đáp án. Câu bỏ qua sẽ tính là sai.`
                : 'Bạn đã làm tất cả câu! Xác nhận nộp bài?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Làm tiếp</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowSubmitDialog(false); submitAttempt(); }}>Nộp bài</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
