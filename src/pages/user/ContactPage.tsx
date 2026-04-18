import { Mail, Phone, MapPin, Send, Facebook, Youtube, Github, GraduationCap, Heart, Star, MessageCircle, User, Clock, HelpCircle, CheckCircle, CreditCard, Key, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-100 to-indigo-100">
      {/* Enhanced Footer Content */}
      <div className="relative w-full h-screen flex items-center justify-center">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Enhanced Brand Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 hover:scale-110 transition-all duration-300">
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>
                <div>
                  <span className="text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl">
                    TQMaster
                  </span>
                  <div className="text-sm text-blue-600 font-bold tracking-widest uppercase">EDUCATION PLATFORM</div>
                </div>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed font-medium">
                Nền tảng luyện thi trực tuyến hàng đầu, cung cấp giải pháp học tập thông minh và hiệu quả cho sinh viên Việt Nam.
              </p>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/tuanvaquan" target="_blank" rel="noopener noreferrer"
                  className="group w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 hover:scale-110 hover:shadow-blue-500/50 transition-all duration-300">
                  <Facebook className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
                </a>
                <a href="https://www.youtube.com/@tuanvaquanfptu" target="_blank" rel="noopener noreferrer"
                  className="group w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white shadow-2xl shadow-red-500/30 hover:scale-110 hover:shadow-red-500/50 transition-all duration-300">
                  <Youtube className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                  className="group w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white shadow-2xl shadow-gray-500/30 hover:scale-110 hover:shadow-gray-500/50 transition-all duration-300">
                  <Github className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
                </a>
              </div>
            </div>

            {/* Enhanced Quick Links */}
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3 drop-shadow-2xl">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50 animate-pulse"></div>
                Liên kết nhanh
              </h3>
              <ul className="space-y-4">
                <li>
                  <a href="/dashboard" className="group flex items-center gap-4 text-gray-600 hover:text-blue-600 transition-all duration-300 font-semibold text-lg">
                    <div className="w-3 h-3 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="group-hover:translate-x-2 transition-transform duration-300">Trang chủ</span>
                  </a>
                </li>
                <li>
                  <a href="/subjects" className="group flex items-center gap-4 text-gray-600 hover:text-blue-600 transition-all duration-300 font-semibold text-lg">
                    <div className="w-3 h-3 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="group-hover:translate-x-2 transition-transform duration-300">Môn học</span>
                  </a>
                </li>
                <li>
                  <a href="/orders" className="group flex items-center gap-4 text-gray-600 hover:text-blue-600 transition-all duration-300 font-semibold text-lg">
                    <div className="w-3 h-3 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="group-hover:translate-x-2 transition-transform duration-300">Đơn hàng</span>
                  </a>
                </li>
                <li>
                  <a href="/contact" className="group flex items-center gap-4 text-gray-600 hover:text-blue-600 transition-all duration-300 font-semibold text-lg">
                    <div className="w-3 h-3 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="group-hover:translate-x-2 transition-transform duration-300">Liên hệ</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Enhanced Contact Info */}
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3 drop-shadow-2xl">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50 animate-pulse"></div>
                Liên hệ
              </h3>
              <ul className="space-y-4">
                <li className="group flex items-center gap-4 p-5 rounded-2xl bg-white/50 hover:bg-white/70 backdrop-blur-sm border border-gray-200 hover:border-gray-300 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-wider">Email</div>
                    <div className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">lequan12305@gmail.com</div>
                  </div>
                </li>
                <li className="group flex items-center gap-4 p-5 rounded-2xl bg-white/50 hover:bg-white/70 backdrop-blur-sm border border-gray-200 hover:border-gray-300 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-wider">Hotline</div>
                    <div className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">1900-1234</div>
                  </div>
                </li>
                <li className="group flex items-center gap-4 p-5 rounded-2xl bg-white/50 hover:bg-white/70 backdrop-blur-sm border border-gray-200 hover:border-gray-300 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-wider">Địa chỉ</div>
                    <div className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors duration-300">Hà Nội, Việt Nam</div>
                  </div>
                </li>
              </ul>
            </div>

            {/* Enhanced Team Section */}
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3 drop-shadow-2xl">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 shadow-lg shadow-pink-500/50 animate-pulse"></div>
                Đội ngũ phát triển
              </h3>
              <div className="group flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-white/50 to-white/30 hover:from-white/70 hover:to-white/50 backdrop-blur-sm border border-gray-200 hover:border-gray-300 transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-600 flex items-center justify-center text-white font-black text-2xl shadow-2xl group-hover:scale-110 transition-transform duration-300">
                  TQ
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold text-gray-900 mb-2 drop-shadow-lg">Tuấn và Quân</div>
                  <div className="text-sm font-bold text-blue-600 uppercase tracking-wider">Development Team</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Bottom Bar */}
          <div className="mt-20 pt-8 border-t border-gray-300">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-4 text-lg font-bold text-gray-900 drop-shadow-lg">
                <span>© 2026 TQMaster. All rights reserved.</span>
                <div className="flex items-center gap-2">
                  <span>Made with</span>
                  <Heart className="w-6 h-6 text-red-500 animate-pulse drop-shadow-lg" />
                  <span>in Vietnam</span>
                </div>
              </div>
              <div className="flex items-center gap-8 text-lg font-semibold">
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors duration-300 hover:underline decoration-gray-900 underline-offset-4 drop-shadow-md">Privacy Policy</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors duration-300 hover:underline decoration-gray-900 underline-offset-4 drop-shadow-md">Terms of Service</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors duration-300 hover:underline decoration-gray-900 underline-offset-4 drop-shadow-md">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
