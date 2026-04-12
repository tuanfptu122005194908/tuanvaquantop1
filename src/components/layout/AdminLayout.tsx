import { useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard, Users, BookOpen, FileText, ShoppingCart,
  BarChart3, LogOut, ChevronLeft, GraduationCap, Settings, Tag, BookOpenCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Người dùng', icon: Users },
  { path: '/admin/subjects', label: 'Môn học / Kì', icon: BookOpen },
  { path: '/admin/exams', label: 'Đề thi', icon: FileText },
  { path: '/admin/theory', label: 'Lý thuyết', icon: BookOpenCheck },
  { path: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart },
  { path: '/admin/coupons', label: 'Mã giảm giá', icon: Tag },
  { path: '/admin/revenue', label: 'Doanh thu', icon: BarChart3 },
  { path: '/admin/settings', label: 'Cài đặt', icon: Settings },
];

export default function AdminLayout() {
  const { profile, isAdmin, signOut, loading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!profile || !isAdmin())) {
      navigate('/dashboard');
    }
  }, [profile, loading]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 flex flex-col border-r"
        style={{ background: 'linear-gradient(180deg, hsl(270,35%,14%) 0%, hsl(220,30%,12%) 100%)' }}>
        <div className="p-5 border-b" style={{ borderColor: 'hsl(270, 25%, 22%)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center gradient-sakura">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">TQMaster</p>
              <p className="text-xs" style={{ color: 'hsl(270, 10%, 55%)' }}>Admin Panel</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white gradient-sakura">
              {profile?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/90 truncate">{profile?.username}</p>
              <p className="text-xs" style={{ color: 'hsl(270,10%,50%)' }}>Administrator</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link key={item.path} to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  isActive ? "text-white font-medium" : "hover:text-white/90 transition-colors"
                )}
                style={isActive
                  ? { background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))', color: 'white' }
                  : { color: 'hsl(270, 10%, 60%)' }
                }>
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t space-y-0.5" style={{ borderColor: 'hsl(270, 25%, 22%)' }}>
          <Link to="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:text-white"
            style={{ color: 'hsl(270, 10%, 55%)' }}>
            <ChevronLeft className="h-4 w-4" /> Về trang User
          </Link>
          <button onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-left hover:text-white"
            style={{ color: 'hsl(270, 10%, 55%)' }}>
            <LogOut className="h-4 w-4" /> Đăng xuất
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
}