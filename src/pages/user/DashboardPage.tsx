import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, TrendingUp, Clock, Lock, ChevronRight, Trophy, ChevronLeft, ChevronDown, Star, Target, Award, Zap, Sparkles, BarChart3, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import animeBannerDashboard from '@/assets/anime-banner-dashboard.jpg';

export default function DashboardPage() {
  const { profile } = useAuthStore();
  const hasLoadedRef = useRef(false);
  const [stats, setStats] = useState({ totalAttempts: 0, totalSpent: 0, subjectsCount: 0 });
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
  const [accessibleSubjects, setAccessibleSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [attemptsTotal, setAttemptsTotal] = useState(0);
  
  // Pagination for subjects only
  const [subjectsPage, setSubjectsPage] = useState(1);
  const [subjectsTotal, setSubjectsTotal] = useState(0);
  const subjectsPerPage = 6;
  
  // Toggle states
  const [showAttempts, setShowAttempts] = useState(true);
  const [showSubjects, setShowSubjects] = useState(true);

  useEffect(() => {
    if (!profile) return;
    // Only load data once when profile becomes available
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    // Check if cached data is still fresh (5 minutes)
    const cacheKey = `dashboard_cache_${profile?.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cacheData = JSON.parse(cached);
        const isExpired = Date.now() - cacheData.timestamp > 5 * 60 * 1000; // 5 minutes
        if (!isExpired && cacheData.stats) {
          // Use cached data
          setStats(cacheData.stats);
          setRecentAttempts(cacheData.recentAttempts);
          setAccessibleSubjects(cacheData.accessibleSubjects);
          setSubjectsTotal(cacheData.subjectsTotal);
          setAttemptsTotal(cacheData.attemptsTotal);
          setLoading(false);
          return;
        }
      } catch (e) {
        // Cache invalid, ignore and continue
        console.log('Cache load failed, fetching fresh data');
      }
    }

    setLoading(true);
    const [permRes, subRes] = await Promise.all([
      supabase.from('user_permissions').select('subject_id').eq('user_id', profile!.id),
      supabase.from('user_subscriptions').select('subject_id, end_date').eq('user_id', profile!.id),
    ]);
    const subjectIds = new Set<number>();
    permRes.data?.forEach((p: any) => subjectIds.add(p.subject_id));
    subRes.data?.filter((s: any) => new Date(s.end_date) >= new Date()).forEach((s: any) => subjectIds.add(s.subject_id));
    
    // Load subjects with pagination
    let subjects = [];
    let subjectsCount = 0;
    if (subjectIds.size > 0) {
      const { data, count } = await supabase.from('subjects').select('*', { count: 'exact' })
        .in('id', Array.from(subjectIds)).eq('is_active', true).order('order_index')
        .range((subjectsPage - 1) * subjectsPerPage, subjectsPage * subjectsPerPage - 1);
      subjects = data || [];
      subjectsCount = count || 0;
      setAccessibleSubjects(subjects);
      setSubjectsTotal(subjectsCount);
    } else {
      setAccessibleSubjects([]);
      setSubjectsTotal(0);
    }
    
    // Load attempts with pagination - chỉ giữ 5 bài gần nhất
    const { data: attempts, count: attemptsCount } = await supabase
      .from('attempts').select('*, exams(title, subjects(name))', { count: 'exact' })
      .eq('user_id', profile!.id).eq('status', 'submitted')
      .order('submitted_at', { ascending: false })
      .limit(5); // Chỉ lấy 5 bài gần nhất
    setRecentAttempts(attempts || []);
    setAttemptsTotal(attemptsCount || 0);
    
    // Lấy tổng số tất cả attempts để hiển thị
    const { data: allAttempts } = await supabase
      .from('attempts').select('id').eq('user_id', profile!.id).eq('status', 'submitted');
    const { data: paidOrders } = await supabase
      .from('orders').select('total_price').eq('user_id', profile!.id).eq('status', 'paid');
    const totalSpent = paidOrders?.reduce((s, o) => s + (Number(o.total_price) || 0), 0) || 0;
    const newStats = { totalAttempts: allAttempts?.length || 0, totalSpent, subjectsCount: subjectIds.size };
    setStats(newStats);

    // Save to cache
    const cacheData = {
      stats: newStats,
      recentAttempts: attempts || [],
      accessibleSubjects: subjects,
      subjectsTotal: subjectsCount,
      attemptsTotal: attemptsCount || 0,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    
    setLoading(false);
  };
  
  // Load paginated data when page changes
  useEffect(() => {
    if (!profile) return;
    loadPaginatedData();
  }, [subjectsPage, profile]);
  
  const loadPaginatedData = async () => {
    const [permRes, subRes] = await Promise.all([
      supabase.from('user_permissions').select('subject_id').eq('user_id', profile!.id),
      supabase.from('user_subscriptions').select('subject_id, end_date').eq('user_id', profile!.id),
    ]);
    const subjectIds = new Set<number>();
    permRes.data?.forEach((p: any) => subjectIds.add(p.subject_id));
    subRes.data?.filter((s: any) => new Date(s.end_date) >= new Date()).forEach((s: any) => subjectIds.add(s.subject_id));
    
    // Load subjects with pagination
    if (subjectIds.size > 0) {
      const { data: subjects } = await supabase.from('subjects').select('*')
        .in('id', Array.from(subjectIds)).eq('is_active', true).order('order_index')
        .range((subjectsPage - 1) * subjectsPerPage, subjectsPage * subjectsPerPage - 1);
      setAccessibleSubjects(subjects || []);
    }
    
    // Load attempts - chỉ giữ 5 bài gần nhất
    const { data: attempts } = await supabase
      .from('attempts').select('*, exams(title, subjects(name))')
      .eq('user_id', profile!.id).eq('status', 'submitted')
      .order('submitted_at', { ascending: false })
      .limit(5);
    setRecentAttempts(attempts || []);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-destructive';
  };

  const statGradients = [
    'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))',
    'linear-gradient(135deg, hsl(160,55%,45%), hsl(180,60%,40%))',
    'linear-gradient(135deg, hsl(25,90%,65%), hsl(38,85%,55%))',
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero banner */}
      <div className="relative w-full h-56 md:h-64 overflow-hidden group">
        <img src={animeBannerDashboard} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" width={1920} height={512} />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 via-pink-900/60 to-indigo-900/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="container">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center animate-pulse">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm text-white/90 font-medium">Chào mừng trở lại</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-4 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
              {profile?.username}
            </h1>
            <div className="flex items-center gap-4">
              <Link to="/subjects" className="inline-block">
                <Button className="gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transform hover:scale-105 transition-all duration-300 px-6 py-3">
                  <BookOpen className="h-4 w-4" /> 
                  <span className="font-bold">Xem môn học</span>
                </Button>
              </Link>
              <div className="hidden md:flex items-center gap-2 text-white/80 text-sm">
                <Target className="h-4 w-4" />
                <span>Hoàn thành mục tiêu học tập</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-10">
        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-12 relative z-10">
          {[
            { 
              label: 'Bài đã làm', 
              value: loading ? '...' : stats.totalAttempts, 
              icon: FileText, 
              suffix: ' bài', 
              gradient: 'from-blue-500 to-cyan-600',
              bgColor: 'from-blue-50 to-cyan-50',
              borderColor: 'border-blue-200',
              iconBg: 'from-blue-600 to-cyan-700'
            },
            { 
              label: 'Đã chi tiêu', 
              value: loading ? '...' : stats.totalSpent.toLocaleString('vi'), 
              icon: TrendingUp, 
              suffix: '₫', 
              gradient: 'from-emerald-500 to-green-600',
              bgColor: 'from-emerald-50 to-green-50',
              borderColor: 'border-emerald-200',
              iconBg: 'from-emerald-600 to-green-700'
            },
            { 
              label: 'Môn đang học', 
              value: loading ? '...' : stats.subjectsCount, 
              icon: BookOpen, 
              suffix: ' môn', 
              gradient: 'from-amber-500 to-orange-600',
              bgColor: 'from-amber-50 to-orange-50',
              borderColor: 'border-amber-200',
              iconBg: 'from-amber-600 to-orange-700'
            },
          ].map((s, index) => (
            <Card key={s.label} className={cn(
              "border-0 shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-300 overflow-hidden bg-gradient-to-br",
              s.bgColor,
              "border", s.borderColor
            )}>
              <div className="h-1 bg-gradient-to-r opacity-60" style={{
                background: `linear-gradient(90deg, ${s.gradient.replace('from-', '').replace(' to-', ', ')})`
              }} />
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-xl transform hover:scale-110 transition-all duration-300",
                    "bg-gradient-to-br", s.iconBg
                  )}>
                    <s.icon className="h-7 w-7" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black drop-shadow-2xl" 
                        style={{ 
                          color: index === 0 ? '#1e40af' : index === 1 ? '#059669' : '#d97706',
                          textShadow: '0 2px 8px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.5)'
                        }}>
                        {s.value}
                      </span>
                      <span className="text-lg font-semibold text-muted-foreground">{s.suffix}</span>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mt-1">{s.label}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r opacity-20 flex items-center justify-center">
                    {index === 0 && <Zap className="h-4 w-4 text-blue-600" />}
                    {index === 1 && <TrendingUp className="h-4 w-4 text-emerald-600" />}
                    {index === 2 && <Award className="h-4 w-4 text-amber-600" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tutorial Video */}
        <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20">
          <div className="h-2 bg-gradient-to-r from-red-500 to-pink-600" />
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white shadow-lg">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Hướng dẫn cách học hiệu quả</h3>
                <p className="text-sm text-muted-foreground">Xem video để tìm hiểu cách tối ưu hóa quá trình học tập của bạn</p>
              </div>
            </div>
            <div className="relative w-full bg-black rounded-xl overflow-hidden shadow-xl" style={{ aspectRatio: '16/9' }}>
              <iframe
                src="https://www.youtube.com/embed/NxrDB4EtTWM"
                title="Hướng dẫn cách học hiệu quả"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </CardContent>
        </Card>

        {/* Accessible subjects */}
        {!loading && accessibleSubjects.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xl">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Môn học của bạn</h2>
                    <p className="text-sm text-muted-foreground">Các môn học bạn đã đăng ký</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSubjects(!showSubjects)}
                  className="h-10 w-10 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20 transform hover:scale-110 transition-all duration-200"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showSubjects ? "rotate-180" : "")} />
                </Button>
              </div>
              <Link to="/subjects" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                Xem tất cả <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            {showSubjects && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {accessibleSubjects.map((s, idx) => (
                    <Link key={s.id} to={`/subjects/${s.id}`}>
                      <Card className="group border-0 shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 h-full">
                        <div className="h-2 bg-gradient-to-r opacity-60" style={{
                          background: `linear-gradient(90deg, ${['from-blue-500 to-cyan-600', 'from-emerald-500 to-green-600', 'from-amber-500 to-orange-600'][idx % 3].replace('from-', '').replace(' to-', ', ')})`
                        }} />
                        {s.thumbnail ? (
                          <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                            <img src={s.thumbnail} alt={s.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        ) : (
                          <div className="w-full h-40 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/10 animate-pulse" />
                            <BookOpen className="h-16 w-16 text-white opacity-80 group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        )}
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">{s.name}</h3>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                              {idx + 1}
                            </div>
                          </div>
                          {s.description && (
                            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{s.description}</p>
                          )}
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              {[...Array(10)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              ))}
                            </div>
                            <div className="ml-auto">
                              <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-lg">
                                Đã đăng ký
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
                
                {/* Subjects Pagination */}
                {subjectsTotal > subjectsPerPage && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSubjectsPage(Math.max(1, subjectsPage - 1))}
                      disabled={subjectsPage === 1}
                      className="gap-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-500 transition-all duration-200"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Trước</span>
                    </Button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Trang</span>
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-bold">
                        {subjectsPage}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        / {Math.ceil(subjectsTotal / subjectsPerPage)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSubjectsPage(Math.min(Math.ceil(subjectsTotal / subjectsPerPage), subjectsPage + 1))}
                      disabled={subjectsPage >= Math.ceil(subjectsTotal / subjectsPerPage)}
                      className="gap-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-500 transition-all duration-200"
                    >
                      <span>Sau</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* No subjects */}
        {!loading && accessibleSubjects.length === 0 && (
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-600" />
            <CardContent className="p-16 text-center space-y-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center mx-auto shadow-xl">
                <Lock className="h-12 w-12 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Bạn chưa có môn học nào</h3>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  Mua môn học để truy cập đề thi và luyện tập, nâng cao kiến thức và kỹ năng của bạn
                </p>
              </div>
              <Link to="/subjects">
                <Button className="gap-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg">
                  <BookOpen className="h-5 w-5" /> 
                  <span className="font-bold">Xem danh sách môn học</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Recent attempts */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-xl">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Lịch sử làm bài</h2>
                  <p className="text-sm text-muted-foreground">Các bài thi bạn đã hoàn thành</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAttempts(!showAttempts)}
                className="h-10 w-10 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/20 transform hover:scale-110 transition-all duration-200"
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", showAttempts ? "rotate-180" : "")} />
              </Button>
            </div>
            {recentAttempts.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-950/30 rounded-full border border-purple-200 dark:border-purple-800">
                <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  5 bài gần nhất
                </span>
              </div>
            )}
          </div>
          
          {showAttempts && (
            <>
              {recentAttempts.length === 0 ? (
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-600" />
                  <CardContent className="p-16 text-center space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mx-auto shadow-xl">
                      <Trophy className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-2">Chưa có lịch sử làm bài</h3>
                      <p className="text-muted-foreground">Hãy thử làm một đề thi để bắt đầu hành trình chinh phục điểm số!</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-4">
                    {recentAttempts.map((a, index) => (
                      <Link key={a.id} to={`/result/${a.id}`}>
                        <Card className="group border-0 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                          <div className="h-1 bg-gradient-to-r opacity-60" style={{
                            background: `linear-gradient(90deg, ${index % 3 === 0 ? 'from-purple-500 to-pink-600' : index % 3 === 1 ? 'from-blue-500 to-cyan-600' : 'from-emerald-500 to-green-600'})`
                          }} />
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                    {index + 1}
                                  </div>
                                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                                    {(a.exams as any)?.title}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{new Date(a.submitted_at).toLocaleString('vi')}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <BookOpen className="h-3 w-3" />
                                    <span>{(a.exams as any)?.subjects?.name || 'Không xác định'}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 ml-6">
                                <div className="text-right">
                                  <div className="flex items-baseline gap-1">
                                    <span className={cn("text-3xl font-black", getScoreColor(Number(a.score)))}>
                                      {a.score}
                                    </span>
                                    <span className="text-lg font-semibold text-muted-foreground">/10</span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    {Number(a.score) >= 8 && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                                    {Number(a.score) >= 5 && Number(a.score) < 8 && <Target className="h-3 w-3 text-blue-500" />}
                                    {Number(a.score) < 5 && <Award className="h-3 w-3 text-amber-500" />}
                                    <span className="text-xs text-muted-foreground">
                                      {Number(a.score) >= 8 ? 'Xuất sắc' : Number(a.score) >= 5 ? 'Khá' : 'Cần cố gắng'}
                                    </span>
                                  </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200">
                                  <ChevronRight className="h-5 w-5" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
