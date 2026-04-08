import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, BookOpen, Settings, GraduationCap, Menu, X, LogOut, ShoppingCart, CreditCard, Mail, Phone, MapPin, Github, Twitter, Instagram, Globe, Facebook, Youtube, MessageCircle, HelpCircle, Star, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { SakuraRain } from '@/components/ui/SakuraRain';

const navItems = [
  { path: '/dashboard', label: 'Trang chủ', icon: LayoutDashboard },
  { path: '/subjects', label: 'Môn học', icon: BookOpen },
  { path: '/orders', label: 'Đơn hàng', icon: ShoppingCart },
  { path: '/contact', label: 'Liên hệ', icon: MessageCircle },
];

export default function UserLayout() {
  const { profile, signOut, loading, isBanned, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (!loading && !profile) navigate('/login');
    if (!loading && isBanned()) { signOut(); navigate('/login'); }
  }, [profile, loading]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    supabase.from('payment_settings').select('*').eq('id', 1).single().then(({ data }) => {
      setPaymentSettings(data);
    });
  }, []);

  // Search subjects
  useEffect(() => {
    if (searchQuery.trim()) {
      const delaySearch = setTimeout(async () => {
        try {
          const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .ilike('name', `%${searchQuery}%`)
            .eq('is_active', true)
            .order('order_index')
            .limit(5);

          if (!error) {
            setSearchResults(data || []);
          }
        } catch (error) {
          console.error('Error searching subjects:', error);
        }
      }, 300);

      return () => clearTimeout(delaySearch);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSubjectClick = (subjectId: number) => {
    navigate(`/subjects/${subjectId}`);
    setSearchQuery('');
    setShowSearch(false);
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-purple-50">
      <SakuraRain />
      <header className="sticky top-0 z-40 w-full border-b border-white/20 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/90 shadow-lg shadow-black/5">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="group flex items-center gap-3 font-black text-2xl transition-all duration-300 hover:scale-105">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-110">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent group-hover:from-pink-600 group-hover:via-purple-600 group-hover:to-indigo-600 transition-all duration-300">
                TQMaster
              </span>
            </Link>

            {/* Search Bar */}
            <div className="hidden lg:flex items-center relative max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm môn học..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearch(true)}
                  onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                  className="pl-10 pr-4 h-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-purple-300 focus:ring-purple-300 rounded-xl text-sm"
                />
                {showSearch && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                    {searchResults.map((subject) => (
                      <button
                        key={subject.id}
                        onClick={() => handleSubjectClick(subject.id)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{subject.name}</p>
                          <p className="text-xs text-gray-500">{subject.description || 'Môn học'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                return (
                  <Link key={item.path} to={item.path}
                    className={cn(
                      "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden group",
                      isActive 
                        ? "text-white shadow-lg shadow-purple-500/25 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 hover:shadow-purple-500/40 transform hover:scale-105" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/80"
                    )}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 opacity-10 animate-pulse" />
                    )}
                    <item.icon className={cn(
                      "h-4 w-4 transition-all duration-300",
                      isActive ? "text-white" : "text-current"
                    )} />
                    <span className="relative z-10">{item.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-white rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin() && (
              <Link to="/admin/dashboard">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 hidden sm:flex border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950/20 dark:hover:border-purple-700 dark:hover:text-purple-300 rounded-xl font-medium transition-all duration-300"
                >
                  <Settings className="h-3.5 w-3.5" /> 
                  <span>Admin</span>
                </Button>
              </Link>
            )}
            
            <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                {profile?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{profile?.username}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Student</span>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut} 
              className="hidden sm:flex gap-2 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/20 rounded-xl font-medium transition-all duration-300 px-3 py-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden h-10 w-10 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-all duration-300" 
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-xl p-4 space-y-2 animate-slide-down">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm môn học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                className="pl-10 pr-4 h-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-purple-300 focus:ring-purple-300 rounded-xl text-sm w-full"
              />
              {showSearch && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                  {searchResults.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => handleSubjectClick(subject.id)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{subject.name}</p>
                        <p className="text-xs text-gray-500">{subject.description || 'Môn học'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {navItems.map(item => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link key={item.path} to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                    isActive 
                      ? "text-white shadow-lg shadow-purple-500/25 bg-gradient-to-r from-pink-500 to-purple-600" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/80"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </Link>
              );
            })}
            
            <div className="border-t border-gray-200/50 pt-3 mt-3 space-y-2">
              {isAdmin() && (
                <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/80 transition-all duration-300">
                  <Settings className="h-4 w-4" /> 
                  <span>Admin Panel</span>
                </Link>
              )}
              
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                  {profile?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{profile?.username}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Student</div>
                </div>
              </div>
              
              <button 
                onClick={signOut} 
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 w-full transition-all duration-300"
              >
                <LogOut className="h-4 w-4" /> 
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
