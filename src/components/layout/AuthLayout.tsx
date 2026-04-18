import { Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary shadow-lg">
            <GraduationCap className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">TQMaster</h1>
            <p className="text-sm text-muted-foreground mt-1">Nền tảng luyện thi trực tuyến</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <Outlet />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          © 2024 TQMaster · Author: Tuấn và Quân
        </p>
      </div>
    </div>
  );
}
