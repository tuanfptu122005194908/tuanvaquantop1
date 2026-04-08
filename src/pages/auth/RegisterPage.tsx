import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, ArrowRight, Sparkles, CheckCircle, AlertCircle, Shield } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Registration validation:', {
        username: username.length,
        password: password.length,
        confirmPassword: confirmPassword.length,
        passwordMatch: password === confirmPassword
      });

      if (username.length < 3 || username.length > 50) { toast.error('Tên người dùng phải từ 3-50 ký tự'); return; }
      if (password.length < 8) { toast.error('Mật khẩu phải ít nhất 8 ký tự'); return; }
      if (password.length > 128) { toast.error('Mật khẩu không quá 128 ký tự'); return; }
      if (confirmPassword.length > 128) { toast.error('Mật khẩu xác nhận không quá 128 ký tự'); return; }
      if (password !== confirmPassword) { toast.error('Mật khẩu xác nhận không khớp'); return; }
      setLoading(true);
      
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { username }, emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      toast.error(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 2;
  const strengthConfig = [
    { color: 'bg-gray-200', label: 'Yếu', icon: AlertCircle, textColor: 'text-gray-500' },
    { color: 'bg-yellow-200', label: 'Trung bình', icon: Shield, textColor: 'text-yellow-600' },
    { color: 'bg-green-200', label: 'Mạnh', icon: CheckCircle, textColor: 'text-green-600' }
  ];
  const strength = strengthConfig[passwordStrength] || strengthConfig[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg mb-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Sparkles className="w-8 h-8 text-white relative z-10" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Tạo tài khoản mới
          </h1>
          <p className="text-gray-600 text-lg">Đăng ký miễn phí để bắt đầu học tập</p>
        </div>

        {/* Register form */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Username field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-gray-700">Tên người dùng</Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                <Input 
                  id="username" 
                  placeholder="nguyenvana" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)} 
                  onFocus={() => setIsFocused('username')}
                  onBlur={() => setIsFocused('')}
                  className={`pl-12 h-12 border-2 transition-all duration-300 bg-white/50 backdrop-blur-sm ${
                    isFocused === 'username' 
                      ? 'border-purple-500 ring-4 ring-purple-100 shadow-lg shadow-purple-200 scale-[1.02]' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`} 
                  required 
                  minLength={3} 
                  maxLength={50} 
                />
                <div className={`absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10 opacity-0 transition-opacity duration-300 pointer-events-none ${
                  isFocused === 'username' ? 'opacity-100' : ''
                }`}></div>
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} 
                  onFocus={() => setIsFocused('email')}
                  onBlur={() => setIsFocused('')}
                  className={`pl-12 h-12 border-2 transition-all duration-300 bg-white/50 backdrop-blur-sm ${
                    isFocused === 'email' 
                      ? 'border-purple-500 ring-4 ring-purple-100 shadow-lg shadow-purple-200 scale-[1.02]' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`} 
                  required 
                />
                <div className={`absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10 opacity-0 transition-opacity duration-300 pointer-events-none ${
                  isFocused === 'email' ? 'opacity-100' : ''
                }`}></div>
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Mật khẩu</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Ít nhất 8 ký tự" 
                  value={password}
                  onChange={(e) => {
                    try {
                      const value = e.target.value;
                      if (value.length <= 128) {
                        setPassword(value);
                      }
                    } catch (error) {
                      console.error('Error in password onChange:', error);
                    }
                  }} 
                  onFocus={() => setIsFocused('password')}
                  onBlur={() => setIsFocused('')}
                  className={`pl-12 pr-12 h-12 border-2 transition-all duration-300 bg-white/50 backdrop-blur-sm ${
                    isFocused === 'password' 
                      ? 'border-purple-500 ring-4 ring-purple-100 shadow-lg shadow-purple-200 scale-[1.02]' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`} 
                  required 
                  minLength={8} 
                  maxLength={128}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-all duration-200 hover:scale-110"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                <div className={`absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10 opacity-0 transition-opacity duration-300 pointer-events-none ${
                  isFocused === 'password' ? 'opacity-100' : ''
                }`}></div>
              </div>
              
              {/* Password strength indicator */}
              {password && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(i => (
                      <div 
                        key={i} 
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i <= passwordStrength ? (strength?.color || 'bg-gray-200') : 'bg-gray-200'
                        }`} 
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    {strength?.icon && <strength.icon className={`h-4 w-4 ${strength?.textColor || 'text-gray-500'}`} />}
                    <span className={`text-xs font-medium ${strength?.textColor || 'text-gray-500'}`}>{strength?.label || 'Unknown'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">Xác nhận mật khẩu</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="Nhập lại mật khẩu" 
                  value={confirmPassword}
                  onChange={(e) => {
                    try {
                      const value = e.target.value;
                      if (value.length <= 128) {
                        setConfirmPassword(value);
                      }
                    } catch (error) {
                      console.error('Error in confirmPassword onChange:', error);
                    }
                  }}
                  onFocus={() => setIsFocused('confirmPassword')}
                  onBlur={() => setIsFocused('')}
                  className={`pl-12 h-12 border-2 transition-all duration-300 bg-white/50 backdrop-blur-sm ${
                    isFocused === 'confirmPassword' 
                      ? 'border-purple-500 ring-4 ring-purple-100 shadow-lg shadow-purple-200 scale-[1.02]' 
                      : confirmPassword && password && confirmPassword !== password
                      ? 'border-red-300 ring-4 ring-red-100'
                      : 'border-gray-200 hover:border-gray-300'
                  }`} 
                  required 
                  maxLength={128}
                />
                <div className={`absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10 opacity-0 transition-opacity duration-300 pointer-events-none ${
                  isFocused === 'confirmPassword' ? 'opacity-100' : ''
                }`}></div>
              </div>
            </div>

            {/* Submit button */}
            <Button 
              type="submit" 
              className="w-full h-12 font-bold text-base gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group" 
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {loading ? (
                <span className="flex items-center gap-3">
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  Đang đăng ký...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <UserPlus className="h-5 w-5" />
                  Đăng ký
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white/80 backdrop-blur-xl px-4 text-gray-500">hoặc</span>
            </div>
          </div>

          {/* Login link */}
          <div className="text-center">
            <p className="text-gray-600">
              Đã có tài khoản?{' '}
              <Link 
                to="/login" 
                className="font-semibold text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 hover:underline decoration-2 decoration-offset-2"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>

        {/* Footer text */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>© 2024 TQMaster. Nền tảng luyện thi thông minh</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `
      }} />
    </div>
  );
}
