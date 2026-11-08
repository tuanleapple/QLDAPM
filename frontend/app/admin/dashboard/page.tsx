// frontend/app/admin/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/officer/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-4 border-[#8093FF] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-500">Đang chuyển hướng sang Bảng điều khiển Cán bộ...</p>
      </div>
    </div>
  );
}
