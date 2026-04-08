import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

import AuthLayout from '@/components/layout/AuthLayout';
import UserLayout from '@/components/layout/UserLayout';
import AdminLayout from '@/components/layout/AdminLayout';

import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/user/DashboardPage';
import SubjectsPage from '@/pages/user/SubjectsPage';
import SubjectDetailPage from '@/pages/user/SubjectDetailPage';
import StudyPage from '@/pages/user/StudyPage';
import PracticePage from '@/pages/user/PracticePage';
import ResultPage from '@/pages/user/ResultPage';
import OrdersPage from '@/pages/user/OrdersPage';
import ContactPage from '@/pages/user/ContactPage';
import PEExamViewPage from '@/pages/user/PEExamViewPage';
import ExamViewPage from '@/pages/user/ExamViewPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminSubjectsPage from '@/pages/admin/AdminSubjectsPage';
import AdminExamsPage from '@/pages/admin/AdminExamsPage';
import AdminQuestionsPage from '@/pages/admin/AdminQuestionsPage';
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage';
import AdminRevenuePage from '@/pages/admin/AdminRevenuePage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import AdminCouponsPage from '@/pages/admin/AdminCouponsPage';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function AuthInit() {
  const { setSession, fetchProfile, setLoading } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    // First restore session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).then(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Then listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setSession(session);
      if (session?.user) {
        // Fire and forget - don't block
        fetchProfile(session.user.id);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}

function IndexRedirect() {
  const { profile, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return <Navigate to="/login" replace />;
  if (profile.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthInit />
        <Routes>
          <Route path="/" element={<IndexRedirect />} />

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<UserLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/subjects/:id" element={<SubjectDetailPage />} />
            <Route path="/study/:examId" element={<StudyPage />} />
            <Route path="/practice/:examId" element={<PracticePage />} />
            <Route path="/result/:attemptId" element={<ResultPage />} />
            <Route path="/exam/:examId/view" element={<ExamViewPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/subjects" element={<AdminSubjectsPage />} />
            <Route path="/admin/exams" element={<AdminExamsPage />} />
            <Route path="/admin/exams/:examId/questions" element={<AdminQuestionsPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/coupons" element={<AdminCouponsPage />} />
            <Route path="/admin/revenue" element={<AdminRevenuePage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Redirect old plans route */}
          <Route path="/plans" element={<Navigate to="/subjects" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
