import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, CheckCircle, AlertCircle, Shield } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3 || username.length > 50) { toast.error('Tên người dùng phải từ 3-50 ký tự'); return; }
    if (password.length < 8) { toast.error('Mật khẩu phải ít nhất 8 ký tự'); return; }
    if (password !== confirmPassword) { toast.error('Mật khẩu xác nhận không khớp'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { username }, emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabels = ['', 'Yếu', 'Trung bình', 'Mạnh'];
  const strengthColors = ['', 'bg-destructive', 'bg-warning', 'bg-success'];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Tạo tài khoản</h2>
        <p className="text-sm text-muted-foreground">Đăng ký miễn phí để bắt đầu học tập</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium">Tên người dùng</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="username"
              placeholder="nguyenvana"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10 h-11"
              required
              minLength={3}
              maxLength={50}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">Mật khẩu</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ít nhất 8 ký tự"
              value={password}
              onChange={(e) => e.target.value.length <= 128 && setPassword(e.target.value)}
              className="pl-10 pr-10 h-11"
              required
              minLength={8}
              maxLength={128}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-muted'}`} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{strengthLabels[passwordStrength]}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">Xác nhận mật khẩu</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => e.target.value.length <= 128 && setConfirmPassword(e.target.value)}
              className={`pl-10 h-11 ${confirmPassword && password && confirmPassword !== password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              required
              maxLength={128}
            />
          </div>
          {confirmPassword && password && confirmPassword !== password && (
            <p className="text-xs text-destructive">Mật khẩu không khớp</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-semibold gap-2"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
              Đang đăng ký...
            </span>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Đăng ký
            </>
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">hoặc</span>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
