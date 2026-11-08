// frontend/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        switch (user.role) {
          case 'OFFICER':
            router.replace('/officer/dashboard');
            break;
          case 'SUPERVISOR':
            router.replace('/supervisor/dashboard');
            break;
          case 'STUDENT':
          default:
            router.replace('/student/dashboard');
            break;
        }
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-4 border-[#8093FF] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-500">Đang tải hệ thống SIMS...</p>
      </div>
    </div>
  );
}
