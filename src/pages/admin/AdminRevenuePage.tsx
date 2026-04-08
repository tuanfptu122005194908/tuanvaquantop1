import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { DollarSign, TrendingUp, ShoppingCart, BookOpen, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(330,65%,60%)', 'hsl(160,55%,45%)', 'hsl(25,90%,65%)', 'hsl(270,55%,60%)', 'hsl(200,75%,55%)'];

export default function AdminRevenuePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, lastMonth: 0, paidOrders: 0 });
  const [dailyRevenue, setDailyRevenue] = useState<any[]>([]);
  const [subjectBreakdown, setSubjectBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'30' | '60' | '90'>('30');

  useEffect(() => { loadData(); }, [period]);

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, users!orders_user_id_fkey(username)')
      .eq('status', 'paid')
      .order('created_at', { ascending: false });

    const allOrders = data || [];
    setOrders(allOrders);

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const total = allOrders.reduce((s, o) => s + Number(o.total_price), 0);
    const thisMonth = allOrders.filter(o => new Date(o.created_at) >= thisMonthStart).reduce((s, o) => s + Number(o.total_price), 0);
    const lastMonth = allOrders.filter(o => new Date(o.created_at) >= lastMonthStart && new Date(o.created_at) <= lastMonthEnd).reduce((s, o) => s + Number(o.total_price), 0);
    setStats({ total, thisMonth, lastMonth, paidOrders: allOrders.length });

    const days = parseInt(period);
    const revMap: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('vi', { month: 'numeric', day: 'numeric' });
      revMap[key] = 0;
    }
    allOrders.forEach(o => {
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString('vi', { month: 'numeric', day: 'numeric' });
      if (revMap[key] !== undefined) revMap[key] += Number(o.total_price);
    });
    setDailyRevenue(Object.entries(revMap).map(([date, amount]) => ({ date, amount })));

    // Subject breakdown
    const subMap: Record<string, number> = {};
    allOrders.forEach(o => {
      const name = o.subject_name || 'Khác';
      subMap[name] = (subMap[name] || 0) + Number(o.total_price);
    });
    setSubjectBreakdown(Object.entries(subMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));

    setLoading(false);
  };

  const exportCSV = () => {
    const rows = [
      ['#', 'Ngày', 'User', 'Môn học', 'Tổng tiền'],
      ...orders.map(o => [
        o.id,
        new Date(o.created_at).toLocaleDateString('vi'),
        (o.users as any)?.username,
        o.subject_name || '',
        Number(o.total_price).toLocaleString('vi'),
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `doanh-thu-${new Date().toLocaleDateString('vi')}.csv`; a.click();
  };

  const growthPct = stats.lastMonth > 0 ? Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100) : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Báo cáo Doanh thu</h1>
          <p className="text-sm text-muted-foreground">Thống kê đơn hàng đã duyệt</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" /> Xuất CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng doanh thu', value: `${stats.total.toLocaleString('vi')}₫`, icon: DollarSign, color: 'hsl(160,55%,45%)' },
          { label: 'Tháng này', value: `${stats.thisMonth.toLocaleString('vi')}₫`, icon: TrendingUp, color: 'hsl(330,65%,60%)', extra: growthPct !== 0 ? `${growthPct > 0 ? '+' : ''}${growthPct}% so với tháng trước` : undefined },
          { label: 'Tháng trước', value: `${stats.lastMonth.toLocaleString('vi')}₫`, icon: BookOpen, color: 'hsl(25,90%,65%)' },
          { label: 'Đơn đã duyệt', value: stats.paidOrders, icon: ShoppingCart, color: 'hsl(270,55%,60%)' },
        ].map(s => (
          <Card key={s.label} className="border shadow-sm overflow-hidden">
            <div className="h-1" style={{ background: s.color }} />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-xl font-bold">{loading ? '...' : s.value}</p>
                  {s.extra && <p className={cn("text-xs mt-1", growthPct >= 0 ? "text-green-600" : "text-destructive")}>{s.extra}</p>}
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18` }}>
                  <s.icon className="h-4 w-4" style={{ color: s.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border shadow-sm lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Doanh thu theo ngày</CardTitle>
            <div className="flex gap-1">
              {(['30', '60', '90'] as const).map(p => (
                <Button key={p} size="sm" variant={period === p ? 'default' : 'outline'}
                  className="h-7 px-2 text-xs" onClick={() => setPeriod(p)}>
                  {p}d
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dailyRevenue}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(330,65%,60%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(330,65%,60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false}
                  interval={Math.floor(dailyRevenue.length / 8)} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false}
                  tickFormatter={v => v > 0 ? `${v / 1000}k` : '0'} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                  formatter={(v: number) => [`${v.toLocaleString('vi')}₫`, 'Doanh thu']}
                />
                <Area type="monotone" dataKey="amount" stroke="hsl(330,65%,60%)" strokeWidth={2}
                  fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Môn bán chạy</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={subjectBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                      dataKey="value" paddingAngle={3}>
                      {subjectBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 11 }}
                      formatter={(v: number) => [`${v.toLocaleString('vi')}₫`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {subjectBreakdown.slice(0, 4).map((p, i) => (
                    <div key={p.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className="font-medium shrink-0">{p.value.toLocaleString('vi')}₫</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Chưa có dữ liệu</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Danh sách đơn đã duyệt ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-semibold">#</th>
                  <th className="text-left p-3 font-semibold">Ngày</th>
                  <th className="text-left p-3 font-semibold">User</th>
                  <th className="text-left p-3 font-semibold">Môn học</th>
                  <th className="text-right p-3 font-semibold">Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 50).map(o => (
                  <tr key={o.id} className="border-t hover:bg-muted/20 transition-colors">
                    <td className="p-3 text-muted-foreground">{o.id}</td>
                    <td className="p-3">{new Date(o.created_at).toLocaleDateString('vi')}</td>
                    <td className="p-3 font-medium">{(o.users as any)?.username}</td>
                    <td className="p-3 text-muted-foreground">{o.subject_name || '—'}</td>
                    <td className="p-3 text-right font-semibold text-green-600 dark:text-green-400">
                      {Number(o.total_price).toLocaleString('vi')}₫
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
