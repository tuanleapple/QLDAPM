// frontend/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

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
          case 'ENTERPRISE_REP':
            router.replace('/enterprise/dashboard');
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4 text-center">
        <Image
          src="/img/sims_logo_concept_01 3.png"
          alt="SIMS Logo"
          width={160}
          height={60}
          priority
          className="h-auto w-auto"
        />
        <div className="h-9 w-9 border-4 border-[#8093FF] border-t-transparent rounded-full animate-spin mt-4" />
        <p className="text-sm font-semibold text-gray-500">Đang khởi tạo hệ thống SIMS...</p>
      </div>
    </div>
  );
}
