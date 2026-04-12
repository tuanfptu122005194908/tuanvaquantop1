import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, RotateCcw, ChevronLeft, ChevronRight, Trophy, TrendingUp, ZoomIn } from 'lucide-react';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { PreloadedImage } from '@/components/ui/PreloadedImage';

/* ───── Confetti helper ───── */
function launchConfetti() {
  const colors = ['#6366f1', '#8b5cf6', '#06d6a0', '#fbbf24', '#f43f5e', '#3b82f6'];
  for (let i = 0; i < 90; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-particle';
    el.style.cssText = `
      left:${Math.random() * 100}vw;
      width:${Math.random() * 10 + 5}px;
      height:${Math.random() * 10 + 5}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration:${Math.random() * 2 + 2}s;
      animation-delay:${Math.random()}s;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4500);
  }
}

export default function ResultPage() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState<any>(null);
  const [attemptAnswers, setAttemptAnswers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const confettiLaunched = { current: false };

  // Extract image URLs for preloading
  const imageUrls = useMemo(() => 
    questions
      .filter(q => q.image_url)
      .map(q => q.image_url),
    [questions]
  );

  const { loading: imagesLoading } = useImagePreloader(imageUrls);

  useEffect(() => { loadResult(); }, [attemptId]);

  const goToPrevious = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  const goToNext = () => {
    if (currentQuestion < questions.length - 1) setCurrentQuestion(currentQuestion + 1);
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestion(index);
  };

  const loadResult = async () => {
    setLoading(true);
    const { data: att } = await supabase
      .from('attempts')
      .select('*, exams(*, subjects(name))')
      .eq('id', parseInt(attemptId!))
      .single();
    setAttempt(att);

    if (att) {
      const [aaRes, qsRes] = await Promise.all([
        supabase.from('attempt_answers').select('*').eq('attempt_id', att.id),
        supabase.from('questions').select('*, answers(*)').eq('exam_id', att.exam_id).order('order_index'),
      ]);
      setAttemptAnswers(aaRes.data || []);
      setQuestions(qsRes.data || []);

      if (!confettiLaunched.current && Number(att.score) >= 8) {
        confettiLaunched.current = true;
        setTimeout(launchConfetti, 300);
      }
    }
    setLoading(false);
  };

  if (loading || imagesLoading) {
    return (
      <div className="container py-8 space-y-4">
        <div className="text-center">
          <div className="skeleton h-64 rounded-xl max-w-lg mx-auto mb-4" />
          <div className="text-muted-foreground">
            {loading ? 'Loading...' : 'Preloading images...'}
          </div>
        </div>
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-lg" />)}
      </div>
    );
  }

  if (!attempt) return <div className="container py-6"><p>Không tìm thấy kết quả.</p></div>;

  const score = Number(attempt.score);
  const percent = Math.round((attempt.correct_count / attempt.total_questions) * 100);

  const scoreGrade = score >= 9 ? { label: 'Xuất sắc!', emoji: '🏆', color: '#f59e0b' }
    : score >= 8 ? { label: 'Giỏi!', emoji: '🎉', color: '#06d6a0' }
    : score >= 6.5 ? { label: 'Khá!', emoji: '👍', color: '#3b82f6' }
    : score >= 5 ? { label: 'Trung bình', emoji: '😊', color: '#8b5cf6' }
    : { label: 'Cần cố gắng', emoji: '💪', color: '#f43f5e' };

  // Group attempt_answers by question_id
  const attemptAnswerMap: Record<number, number[]> = {};
  attemptAnswers.forEach(aa => {
    if (aa.answer_id) {
      if (!attemptAnswerMap[aa.question_id]) attemptAnswerMap[aa.question_id] = [];
      attemptAnswerMap[aa.question_id].push(aa.answer_id);
    }
  });

  const currentQ = questions[currentQuestion];
  const sortedAnswers = [...(currentQ?.answers as any[])].sort((a, b) => a.label.localeCompare(b.label));
  const correctAnswers = sortedAnswers.filter((a: any) => a.is_correct);
  const selectedIds = new Set(attemptAnswerMap[currentQ?.id] || []);
  const correctIds = new Set(correctAnswers.map((a: any) => a.id));
  const isFullyCorrect = selectedIds.size === correctIds.size && [...selectedIds].every(id => correctIds.has(id));

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Score card */}
      <div className="px-6 pt-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border shadow-lg overflow-hidden">
            <div className="h-2" style={{ background: `linear-gradient(90deg, ${scoreGrade.color}, hsl(270,55%,60%))` }} />
            <CardContent className="p-6">
              <div className="text-center space-y-3">
                <div className="text-4xl animate-bounce-in">{scoreGrade.emoji}</div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    {(attempt.exams as any)?.title}
                  </p>
                  <span className="animate-score inline-block text-5xl font-black" style={{ color: scoreGrade.color }}>
                    {score}
                  </span>
                  <span className="text-2xl font-bold text-muted-foreground">/10</span>
                </div>
                <Badge className="text-sm px-4 py-1.5 font-semibold" style={{ background: scoreGrade.color }}>
                  {scoreGrade.label}
                </Badge>

                <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xl font-bold">{attempt.correct_count}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Câu đúng</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-destructive mb-1">
                      <XCircle className="h-4 w-4" />
                      <span className="text-xl font-bold">{attempt.total_questions - attempt.correct_count}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Câu sai</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-primary mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xl font-bold">{percent}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Tỉ lệ đúng</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-3">
                  <Link to={`/practice/${attempt.exam_id}`} className="flex-1">
                    <Button variant="outline" className="w-full gap-2">
                      <RotateCcw className="h-4 w-4" /> Làm lại
                    </Button>
                  </Link>
                  <Link to={`/subjects/${(attempt.exams as any)?.subject_id}`} className="flex-1">
                    <Button className="w-full gap-2"
                      style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
                      <ChevronLeft className="h-4 w-4" /> Về trang đề
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="flex gap-6 px-6 mt-6">
        {/* Sidebar */}
        <div className="hidden md:block w-24 shrink-0">
          <div className="sticky top-4 border rounded-xl p-2 bg-card shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {attempt.correct_count}/{questions.length} đúng
            </p>
            <div className="grid grid-cols-3 gap-1">
              {questions.map((q, i) => {
                const selectedIds = new Set(attemptAnswerMap[q.id] || []);
                const correctIds = new Set((q.answers as any[]).filter((a: any) => a.is_correct).map((a: any) => a.id));
                const isFullyCorrect = selectedIds.size === correctIds.size && [...selectedIds].every(id => correctIds.has(id));
                
                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(i)}
                    className={cn(
                      "h-5 w-5 flex items-center justify-center text-xs rounded-lg border font-medium transition-all",
                      currentQuestion === i
                        ? "border-gray-400 text-gray-700 bg-white shadow-sm"
                        : isFullyCorrect
                        ? "border-green-500 text-green-500 bg-green-50"
                        : "border-red-500 text-red-500 bg-red-50"
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Câu {currentQuestion + 1} / {questions.length}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - Carousel */}
        <div className="flex-1">
          <Card className={cn(
            "border shadow-sm",
            isFullyCorrect ? "border-green-300 dark:border-green-800" : "border-red-300 dark:border-red-900"
          )}>
            <div className="h-1" style={{ background: isFullyCorrect ? '#10b981' : '#ef4444' }} />
            <CardContent className="p-0">
              {/* Navigation Buttons */}
              <div className="flex items-center justify-between p-4 border-b">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  disabled={currentQuestion === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Câu trước
                </Button>
                
                <span className="text-sm font-medium text-muted-foreground">
                  Câu {currentQuestion + 1} / {questions.length}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  disabled={currentQuestion === questions.length - 1}
                  className="gap-2"
                >
                  Câu tiếp
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Question Content - Dynamic Layout */}
              <div className="p-6">
                {currentQ?.image_url ? (
                  // Image question: 2 column layout
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-1">
                    {/* Left Column - Image (11/12 width) */}
                    <div className="lg:col-span-11 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          isFullyCorrect ? "bg-green-500 text-white" : "bg-destructive text-white"
                        )}>
                          {isFullyCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        </span>
                        <h3 className="font-medium">Câu {currentQuestion + 1}</h3>
                      </div>
                      
                      {currentQ?.question_text && (
                        <p className="text-sm leading-relaxed font-medium p-3 bg-muted/30 rounded-lg">
                          {currentQ.question_text}
                        </p>
                      )}
                      
                      {currentQ?.image_url && (
                        <div className="relative group">
                          <PreloadedImage
                            src={currentQ.image_url}
                            alt={`Câu ${currentQuestion + 1}`}
                            className="w-full rounded-lg border shadow-sm cursor-pointer transition-transform hover:scale-[1.02] max-h-[92vh] object-contain"
                            onClick={() => window.open(currentQ.image_url, '_blank')}
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
                        {sortedAnswers.map((ans: any) => {
                          const isSelected = selectedIds.has(ans.id);
                          const isCorrect = ans.is_correct;
                          return (
                            <div
                              key={ans.id}
                              className={cn(
                                "flex items-center gap-1 p-1 rounded-lg border transition-all w-full",
                                isCorrect && isSelected ? "bg-green-500 border-green-500 text-white" :
                                isCorrect ? "bg-green-100 border-green-400 text-green-700 dark:bg-green-950/40 dark:border-green-600 dark:text-green-400" :
                                isSelected ? "bg-red-100 border-red-400 text-red-700 dark:bg-red-950/40 dark:border-red-600 dark:text-red-400" :
                                "border-border text-muted-foreground"
                              )}
                            >
                              <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold border">
                                {ans.label}
                              </span>
                              {isCorrect && <span className="text-xs">✓</span>}
                            </div>
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
                        isFullyCorrect ? "bg-green-500 text-white" : "bg-destructive text-white"
                      )}>
                        {isFullyCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </span>
                      <h3 className="font-medium">Câu {currentQuestion + 1}</h3>
                    </div>
                    
                    {currentQ?.question_text && (
                      <p className="text-base leading-relaxed font-medium p-4 bg-muted/30 rounded-lg">
                        {currentQ.question_text}
                      </p>
                    )}
                    
                    {/* Answer labels grid - full width */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {sortedAnswers.map((ans: any) => {
                        const isSelected = selectedIds.has(ans.id);
                        const isCorrect = ans.is_correct;
                        return (
                          <div
                            key={ans.id}
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-bold transition-all",
                              isCorrect && isSelected ? "bg-green-500 border-green-500 text-white" :
                              isCorrect ? "bg-green-100 border-green-400 text-green-700 dark:bg-green-950/40 dark:border-green-600 dark:text-green-400" :
                              isSelected ? "bg-red-100 border-red-400 text-red-700 dark:bg-red-950/40 dark:border-red-600 dark:text-red-400" :
                              "border-border text-muted-foreground"
                            )}
                          >
                            <span className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border-2 shrink-0 transition-all",
                              isCorrect && isSelected ? "bg-white border-white text-green-500" :
                              isCorrect ? "bg-green-500 border-green-400 text-white" :
                              isSelected ? "bg-red-500 border-red-400 text-white" :
                              "border-muted-foreground/30 text-muted-foreground"
                            )}>
                              {ans.label}
                            </span>
                            {isCorrect && <span className="text-xs">✓</span>}
                            {ans.content && (
                              <span className="text-xs font-medium">{ans.content}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="px-6 pb-6">
                <div className="bg-muted/40 rounded-xl p-4 text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-20 shrink-0">Bạn chọn:</span>
                    <span className={cn("font-medium", isFullyCorrect ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                      {selectedIds.size === 0
                        ? '⏭ Bỏ qua'
                        : sortedAnswers.filter(a => selectedIds.has(a.id)).map(a => a.label).join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-20 shrink-0">Đáp án đúng:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {correctAnswers.map(a => a.label).join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Navigation */}
              <div className="flex items-center justify-between p-4 border-t md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  disabled={currentQuestion === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-sm font-medium text-muted-foreground">
                  {currentQuestion + 1} / {questions.length}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  disabled={currentQuestion === questions.length - 1}
                  className="gap-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
