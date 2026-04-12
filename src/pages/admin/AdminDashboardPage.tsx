import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { Users, BookOpen, FileText, HelpCircle, ShoppingCart, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ users: 0, subjects: 0, exams: 0, questions: 0, pendingOrders: 0, totalRevenue: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    const [u, s, e, q, o, r, recentO, userR] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('subjects').select('id', { count: 'exact', head: true }),
      supabase.from('exams').select('id', { count: 'exact', head: true }),
      supabase.from('questions').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('orders').select('total_price, created_at').eq('status', 'paid'),
      supabase.from('orders').select('*, users!orders_user_id_fkey(username)').order('created_at', { ascending: false }).limit(5),
      supabase.from('users').select('created_at').order('created_at', { ascending: false }).limit(50),
    ]);

    const totalRevenue = (r.data || []).reduce((s: number, o: any) => s + Number(o.total_price), 0);

    // Build revenue chart — last 14 days
    const revMap: Record<string, number> = {};
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('vi', { month: 'short', day: 'numeric' });
      revMap[key] = 0;
    }
    (r.data || []).forEach((o: any) => {
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString('vi', { month: 'short', day: 'numeric' });
      if (revMap[key] !== undefined) revMap[key] += Number(o.total_price);
    });
    setRevenueData(Object.entries(revMap).map(([date, amount]) => ({ date, amount })));

    // User growth — last 7 days
    const ugMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('vi', { weekday: 'short' });
      ugMap[key] = 0;
    }
    (userR.data || []).forEach((ru: any) => {
      const d = new Date(ru.created_at);
      const key = d.toLocaleDateString('vi', { weekday: 'short' });
      if (ugMap[key] !== undefined) ugMap[key]++;
    });
    setUserGrowth(Object.entries(ugMap).map(([day, count]) => ({ day, count })));

    setStats({ users: u.count || 0, subjects: s.count || 0, exams: e.count || 0, questions: q.count || 0, pendingOrders: o.count || 0, totalRevenue });
    setRecentOrders(recentO.data || []);
    setLoading(false);
  };

  const statCards = [
    { label: 'Tổng Users', value: stats.users, icon: Users, color: 'hsl(330,65%,60%)', link: '/admin/users' },
    { label: 'Môn học', value: stats.subjects, icon: BookOpen, color: 'hsl(160,55%,45%)', link: '/admin/subjects' },
    { label: 'Đề thi', value: stats.exams, icon: FileText, color: 'hsl(25,90%,65%)', link: '/admin/exams' },
    { label: 'Câu hỏi', value: stats.questions, icon: HelpCircle, color: 'hsl(270,55%,60%)', link: '/admin/exams' },
    { label: 'Đơn chờ duyệt', value: stats.pendingOrders, icon: ShoppingCart, color: 'hsl(0,72%,51%)', link: '/admin/orders', badge: stats.pendingOrders > 0 },
    { label: 'Tổng doanh thu', value: `${stats.totalRevenue.toLocaleString('vi')}₫`, icon: DollarSign, color: 'hsl(160,55%,45%)', link: '/admin/revenue' },
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300',
    paid: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300',
  };
  const statusLabels: Record<string, string> = { pending: 'Chờ duyệt', paid: 'Đã duyệt', cancelled: 'Từ chối' };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Tổng quan hệ thống</p>
        </div>
        {stats.pendingOrders > 0 && (
          <Link to="/admin/orders">
            <Button className="gap-2 animate-pop" style={{ background: 'linear-gradient(135deg, hsl(0,72%,51%), hsl(20,80%,55%))' }}>
              <ShoppingCart className="h-4 w-4" />
              {stats.pendingOrders} đơn chờ duyệt
            </Button>
          </Link>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map(c => (
          <Link key={c.label} to={c.link}>
            <Card className={cn("hover-scale border shadow-sm cursor-pointer overflow-hidden", c.badge && "ring-2 ring-destructive/30")}>
              <div className="h-1" style={{ background: c.color }} />
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${c.color}1a` }}>
                  <c.icon className="h-5 w-5" style={{ color: c.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold truncate">{loading ? '...' : c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
                {c.badge && <Badge className="ml-auto bg-destructive text-white shrink-0">{stats.pendingOrders}</Badge>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Doanh thu 14 ngày
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v > 0 ? `${v / 1000}k` : '0'} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                  formatter={(v: number) => [`${v.toLocaleString('vi')}₫`, 'Doanh thu']}
                />
                <Line type="monotone" dataKey="amount" stroke="hsl(330,65%,60%)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Đăng ký 7 ngày
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                  formatter={(v: number) => [v, 'User mới']}
                />
                <Bar dataKey="count" fill="hsl(150,60%,40%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Đơn hàng gần nhất
          </CardTitle>
          <Link to="/admin/orders">
            <Button variant="ghost" size="sm" className="text-xs">Xem tất cả →</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Chưa có đơn hàng nào</p>
            ) : (
              recentOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium">Đơn #{o.id} — {(o.users as any)?.username}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString('vi')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{Number(o.total_price).toLocaleString('vi')}₫</span>
                    <Badge className={cn("text-xs border", statusColors[o.status])}>{statusLabels[o.status]}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
