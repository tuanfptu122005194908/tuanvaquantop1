import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { PreloadedImage } from '@/components/ui/PreloadedImage';
import { BookOpen, Clock, ChevronLeft, ChevronRight, CheckCircle2, X, ZoomIn } from 'lucide-react';

export default function StudyPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string>('');

  // Extract image URLs for preloading
  const imageUrls = useMemo(() => 
    questions
      .filter(q => q.image_url)
      .map(q => q.image_url),
    [questions]
  );

  const { loading: imagesLoading } = useImagePreloader(imageUrls);

  useEffect(() => { loadExam(); }, [examId]);

  const loadExam = async () => {
    setLoading(true);
    const { data: examData } = await supabase.from('exams').select('*, subjects(name)').eq('id', parseInt(examId!)).single();
    setExam(examData);

    const { data: qs } = await supabase
      .from('questions')
      .select('*, answers(*)')
      .eq('exam_id', parseInt(examId!))
      .order('order_index');

    setQuestions(qs || []);
    setLoading(false);
  };

  const goToPrevious = () => {
    setCurrentQuestion(prev => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1));
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestion(index);
  };

  const openZoom = (imageUrl: string) => {
    setZoomedImage(imageUrl);
    setIsZoomed(true);
  };

  const closeZoom = () => {
    setIsZoomed(false);
    setZoomedImage('');
  };

  if (loading || imagesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-muted-foreground">
            {loading ? 'Loading...' : 'Preloading images...'}
          </div>
        </div>
      </div>
    );
  }

  if (!exam) return <div className="container py-6"><p className="text-muted-foreground">Không tìm thấy đề thi.</p></div>;

  if (questions.length === 0) {
    return (
      <div className="container py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{(exam.subjects as any)?.name}</p>
            <h1 className="text-xl font-bold">{exam.title}</h1>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Chưa có câu hỏi nào trong đề này</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 px-6 pt-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{(exam.subjects as any)?.name}</p>
          <h1 className="text-xl font-bold">{exam.title}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <BookOpen className="h-3 w-3" />
            {questions.length} câu
          </Badge>
          {exam.duration_minutes && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              {exam.duration_minutes} phút
            </Badge>
          )}
          <Badge className="gap-1" style={{ background: 'hsl(150,55%,40%)' }}>
            <CheckCircle2 className="h-3 w-3" />
            Chế độ ôn tập
          </Badge>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="flex gap-6 px-6">
        {/* Sidebar */}
        <div className="hidden md:block w-24 shrink-0">
          <div className="sticky top-4 border rounded-xl p-2 bg-card shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Điều hướng</p>
            <div className="grid grid-cols-3 gap-1">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(i)}
                  className={cn(
                    "h-5 w-5 flex items-center justify-center text-xs rounded-lg border font-medium transition-all",
                    currentQuestion === i
                      ? "border-primary text-primary bg-primary/10"
                      : "hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  {i + 1}
                </button>
              ))}
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
          <Card className="border shadow-sm">
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
                {currentQ.image_url ? (
                  // Image question: 2 column layout
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-1">
                    {/* Left Column - Image (11/12 width) */}
                    <div className="lg:col-span-11 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))', color: 'white' }}>
                          {currentQuestion + 1}
                        </span>
                        <h3 className="font-medium">Câu hỏi</h3>
                      </div>
                      
                      {currentQ.question_text && (
                        <p className="text-sm leading-relaxed font-medium p-3 bg-muted/30 rounded-lg">
                          {currentQ.question_text}
                        </p>
                      )}
                      
                      {currentQ.image_url && (
                        <div className="relative group">
                          <PreloadedImage
                            src={currentQ.image_url}
                            alt={`Câu ${currentQuestion + 1}`}
                            className="w-full rounded-lg border shadow-sm cursor-pointer transition-transform hover:scale-[1.02] max-h-[92vh] object-contain"
                            onClick={() => openZoom(currentQ.image_url)}
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
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      </div>
                      
                      <div className="space-y-1">
                        {(currentQ.answers as any[])?.sort((a: any, b: any) => a.label.localeCompare(b.label)).map((ans: any) => (
                          <div
                            key={ans.id}
                            className={cn(
                              "flex items-center gap-1 p-1 rounded-lg border transition-all",
                              ans.is_correct
                                ? "bg-green-50 border-green-400 dark:bg-green-950/30 dark:border-green-600"
                                : "bg-muted/30 border-transparent"
                            )}
                          >
                            <span className={cn(
                              "shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold border",
                              ans.is_correct
                                ? "bg-green-500 text-white border-green-500"
                                : "border-muted-foreground/30 text-muted-foreground"
                            )}>
                              {ans.label}
                            </span>
                            {ans.is_correct && (
                              <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Text question: full width layout
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))', color: 'white' }}>
                        {currentQuestion + 1}
                      </span>
                      <h3 className="font-medium">Câu hỏi</h3>
                    </div>
                    
                    {currentQ.question_text && (
                      <p className="text-base leading-relaxed font-medium p-4 bg-muted/30 rounded-lg">
                        {currentQ.question_text}
                      </p>
                    )}
                    
                    {/* Answer labels grid - full width */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">Đáp án</h3>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(currentQ.answers as any[])?.sort((a: any, b: any) => a.label.localeCompare(b.label)).map((ans: any) => (
                          <div
                            key={ans.id}
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-bold transition-all",
                              ans.is_correct
                                ? "bg-green-50 border-green-400 text-green-700 dark:bg-green-950/40 dark:border-green-600 dark:text-green-400"
                                : "bg-muted/30 border-transparent"
                            )}
                          >
                            <span className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border-2 shrink-0 transition-all",
                              ans.is_correct
                                ? "bg-green-500 border-green-400 text-white"
                                : "border-muted-foreground/30 text-muted-foreground"
                            )}>
                              {ans.label}
                            </span>
                            {ans.is_correct && (
                              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 ml-1" />
                            )}
                            {ans.content && (
                              <span className="text-xs font-medium">{ans.content}</span>
                            )}
                          </div>
                        ))}
                      </div>
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

      {/* Image Zoom Modal */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={closeZoom}>
          <div className="relative max-w-7xl max-h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
              onClick={closeZoom}
            >
              <X className="h-6 w-6" />
            </Button>
            <PreloadedImage
              src={zoomedImage}
              alt="Zoomed image"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
