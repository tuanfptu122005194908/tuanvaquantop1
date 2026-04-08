import { Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import animeBanner from '@/assets/anime-banner-auth.jpg';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - anime banner */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        <img src={animeBanner} alt="TQMaster Banner" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsla(270,55%,30%,0.85) 0%, hsla(330,40%,40%,0.4) 50%, transparent 100%)' }} />
        <div className="relative z-10 flex flex-col justify-end p-10 text-white w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight" style={{
              textShadow: '0 2px 20px rgba(244,114,182,0.4)'
            }}>TQMaster</h1>
          </div>
          <p className="text-xl text-white/95 mb-6 font-medium">Nền tảng luyện thi trực tuyến thông minh</p>
          <div className="space-y-2">
            {['Kho đề thi phong phú', 'Luyện tập không giới hạn', 'Theo dõi tiến độ chi tiết'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ background: 'linear-gradient(135deg, hsl(330,65%,70%), hsl(270,55%,70%))' }} />
                {item}
              </div>
            ))}
          </div>

          {/* Author info */}
          <div className="mt-8 pt-5 border-t border-white/30">
            <p className="text-sm font-bold text-white mb-2" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>
              Author: Tuấn và Quân
            </p>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/tuanvaquan" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white transition-all hover:scale-105 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #1877F2, #42A5F5)' }}>
                Facebook
              </a>
              <a href="https://www.youtube.com/@tuanvaquanfptu" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white transition-all hover:scale-105 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #FF0000, #FF4444)' }}>
                YouTube
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center gradient-sakura shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold" style={{
              background: 'linear-gradient(135deg, hsl(330,65%,55%), hsl(270,55%,55%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>TQMaster</span>
            <p className="text-sm font-semibold" style={{
              background: 'linear-gradient(135deg, hsl(330,65%,55%), hsl(270,55%,55%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Author: Tuấn và Quân</p>
            <div className="flex gap-2">
              <a href="https://www.facebook.com/tuanvaquan" target="_blank" rel="noopener noreferrer"
                className="px-3 py-1 rounded-full text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #1877F2, #42A5F5)' }}>Facebook</a>
              <a href="https://www.youtube.com/@tuanvaquanfptu" target="_blank" rel="noopener noreferrer"
                className="px-3 py-1 rounded-full text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #FF0000, #FF4444)' }}>YouTube</a>
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}