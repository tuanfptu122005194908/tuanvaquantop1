import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { BookOpen, FileText, Clock, Trophy, Layers, Lock, Rocket, Download, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  'Đề FE': { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-300 dark:border-red-700', bar: 'linear-gradient(90deg, #ef4444, #f87171)' },
  'Đề PE': { bg: 'bg-yellow-50 dark:bg-yellow-950/20', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-300 dark:border-yellow-700', bar: 'linear-gradient(90deg, #eab308, #facc15)' },
  'Đề PT': { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-700', bar: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
};

export default function SubjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [subject, setSubject] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [attemptStats, setAttemptStats] = useState<Record<number, { count: number; best: number }>>({});
  const [questionCounts, setQuestionCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || !id) return;
    checkAccessAndLoad();
  }, [profile, id]);

  const checkAccessAndLoad = async () => {
    setLoading(true);
    const subjectId = parseInt(id!);

    const [permRes, subRes] = await Promise.all([
      supabase.from('user_permissions').select('id').eq('user_id', profile!.id).eq('subject_id', subjectId),
      supabase.from('user_subscriptions').select('end_date').eq('user_id', profile!.id).eq('subject_id', subjectId),
    ]);

    const hasPerm = (permRes.data?.length || 0) > 0;
    const hasSub = subRes.data?.some((s: any) => new Date(s.end_date) >= new Date()) || false;

    if (!hasPerm && !hasSub && profile?.role !== 'admin') {
      toast.error('Bạn chưa có quyền truy cập môn này');
      navigate('/subjects');
      return;
    }

    const [subjRes, catsRes, exsRes] = await Promise.all([
      supabase.from('subjects').select('*').eq('id', subjectId).single(),
      supabase.from('categories').select('*').eq('subject_id', subjectId).order('order_index'),
      supabase.from('exams').select('*').eq('subject_id', subjectId).eq('is_published', true).order('created_at', { ascending: false }),
    ]);

    setSubject(subjRes.data);
    setCategories(catsRes.data || []);
    const exsData = exsRes.data || [];
    setExams(exsData);

    if (exsData.length > 0) {
      const examIds = exsData.map((e: any) => e.id);

      const { data: attempts } = await supabase
        .from('attempts').select('exam_id, score')
        .eq('user_id', profile!.id).eq('status', 'submitted')
        .in('exam_id', examIds);

      const stats: Record<number, { count: number; best: number }> = {};
      attempts?.forEach((a: any) => {
        if (!stats[a.exam_id]) stats[a.exam_id] = { count: 0, best: 0 };
        stats[a.exam_id].count++;
        stats[a.exam_id].best = Math.max(stats[a.exam_id].best, Number(a.score) || 0);
      });
      setAttemptStats(stats);

      const { data: qCounts } = await supabase
        .from('questions').select('exam_id').in('exam_id', examIds);

      const counts: Record<number, number> = {};
      qCounts?.forEach((q: any) => {
        counts[q.exam_id] = (counts[q.exam_id] || 0) + 1;
      });
      setQuestionCounts(counts);
    }

    setLoading(false);
  };

  // Get category name for an exam
  const getCategoryName = (exam: any) => {
    const cat = categories.find(c => c.id === exam.category_id);
    return cat?.name || null;
  };

  const filteredExams = selectedCat !== null ? exams.filter(e => e.category_id === selectedCat) : exams;

  if (loading) {
    return (
      <div className="container py-6 space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!subject) return <div className="container py-6"><p>Không tìm thấy môn học.</p></div>;

  return (
    <div className="container py-6 animate-fade-in">
      {/* Subject header */}
      <div className="mb-6">
        {subject.thumbnail && (
          <div className="w-full rounded-2xl overflow-hidden mb-4 shadow-md" style={{ aspectRatio: '16/9' }}>
            <img src={subject.thumbnail} alt={subject.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{subject.name}</h1>
            {subject.description && <p className="text-muted-foreground mt-1">{subject.description}</p>}
          </div>
          <div className="ml-auto">
            <Badge variant="secondary" className="gap-1">
              <FileText className="h-3 w-3" />
              {exams.length} đề thi
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="exams">
        <TabsList className="mb-4">
          <TabsTrigger value="exams" className="gap-2">
            <FileText className="h-4 w-4" /> Đề thi
          </TabsTrigger>
          <TabsTrigger value="theory" className="gap-2">
            <BookOpen className="h-4 w-4" /> Lý thuyết
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="mt-0">
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              <Button
                variant={selectedCat === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCat(null)}
                className="rounded-full"
              >
                Tất cả ({exams.length})
              </Button>
              {categories.map(c => {
                const catColor = CATEGORY_COLORS[c.name];
                return (
                  <Button
                    key={c.id}
                    variant={selectedCat === c.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCat(c.id)}
                    className={cn(
                      "rounded-full gap-1.5",
                      selectedCat !== c.id && catColor && cn(catColor.text, catColor.border)
                    )}
                    style={selectedCat === c.id && catColor ? { background: CATEGORY_COLORS[c.name]?.bar?.replace('linear-gradient(90deg,', 'linear-gradient(135deg,') } : {}}
                  >
                    {catColor && <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.name === 'Đề FE' ? '#ef4444' : c.name === 'Đề PE' ? '#eab308' : '#3b82f6' }} />}
                    {c.name} ({exams.filter(e => e.category_id === c.id).length})
                  </Button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExams.map(exam => {
              const stat = attemptStats[exam.id];
              const qCount = questionCounts[exam.id] || 0;
              const catName = getCategoryName(exam);
              const catColor = catName ? CATEGORY_COLORS[catName] : null;
              return (
                <Card key={exam.id} className={cn("hover-scale border shadow-sm overflow-hidden", catColor?.bg)}>
                  <div className="h-1.5" style={{ background: catColor?.bar || (stat ? 'linear-gradient(90deg, hsl(150,60%,40%), hsl(160,70%,35%))' : 'linear-gradient(90deg, hsl(330,65%,60%), hsl(270,55%,60%))') }} />
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm leading-tight flex-1">{exam.title}</h3>
                        {catColor && catName && (
                          <Badge className={cn("text-xs border", catColor.bg, catColor.text, catColor.border)}>
                            {catName}
                          </Badge>
                        )}
                      </div>
                      {exam.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{exam.description}</p>}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {qCount > 0 && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Layers className="h-3 w-3" /> {qCount} câu
                        </Badge>
                      )}
                      {exam.duration_minutes && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Clock className="h-3 w-3" /> {exam.duration_minutes} phút
                        </Badge>
                      )}
                      {stat && (
                        <Badge variant="outline" className="gap-1 text-xs text-green-600 border-green-300 dark:border-green-700">
                          <Trophy className="h-3 w-3" /> {stat.best}/10
                        </Badge>
                      )}
                    </div>

                    {stat && (
                      <div className="text-xs text-muted-foreground">Đã làm {stat.count} lần</div>
                    )}

                    <div className="flex gap-2 pt-1">
                      {catName === 'Đề PE' ? (
                        <Link to={`/exam/${exam.id}/view`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
                            <Eye className="h-3 w-3" /> Xem
                          </Button>
                        </Link>
                      ) : (
                        <>
                          <Link to={`/study/${exam.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
                              <BookOpen className="h-3 w-3" /> Ôn tập
                            </Button>
                          </Link>
                          <Link to={`/practice/${exam.id}`} className="flex-1">
                            <Button size="sm" className="w-full gap-1 text-xs"
                              style={{ background: catColor?.bar || 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
                              <Trophy className="h-3 w-3" /> Thi thử
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredExams.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Chưa có đề thi nào {selectedCat ? 'trong kỳ này' : ''}.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="theory" className="mt-0">
          <Card className="border shadow-sm">
            <CardContent className="p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-muted">
                <Rocket className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Tính năng Lý thuyết</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Chúng tôi đang xây dựng tài liệu lý thuyết dành riêng cho từng môn học. Hãy quay lại sớm nhé!
                </p>
              </div>
              <Badge variant="outline" className="text-sm">Sắp ra mắt</Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
