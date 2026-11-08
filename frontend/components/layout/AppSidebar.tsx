// frontend/components/layout/AppSidebar.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  DocumentPlusIcon,
  ArrowUpTrayIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isStudent = user?.role === 'STUDENT';
  const isOfficer = user?.role === 'OFFICER';
  const isSupervisor = user?.role === 'SUPERVISOR';

  const navLinkClass = (href: string) => {
    const isActive = pathname === href || pathname?.startsWith(`${href}/`);
    return `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
      isActive
        ? 'bg-[#8093FF] text-white shadow-md shadow-indigo-100'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col justify-between h-screen sticky top-0">
      <div>
        <div className="flex h-20 items-center px-8 border-b border-gray-50">
          <Link href="/">
            <Image
              src="/img/sims_logo_concept_01 3.png"
              alt="SIMS Logo"
              width={130}
              height={45}
              priority
              className="h-auto w-auto"
            />
          </Link>
        </div>

        <nav className="mt-6 flex flex-col gap-1.5 px-4">
          {/* Menu cho Sinh viên */}
          {isStudent && (
            <>
              <Link href="/student/dashboard" className={navLinkClass('/student/dashboard')}>
                <HomeIcon className="h-5 w-5" />
                <span>Bảng điều khiển</span>
              </Link>
              <Link href="/student/register-intern" className={navLinkClass('/student/register-intern')}>
                <DocumentPlusIcon className="h-5 w-5" />
                <span>Đăng ký thực tập</span>
              </Link>
              <Link href="/student/progress" className={navLinkClass('/student/progress')}>
                <ArrowUpTrayIcon className="h-5 w-5" />
                <span>Nhật ký tiến độ</span>
              </Link>
            </>
          )}

          {/* Menu cho Cán bộ */}
          {isOfficer && (
            <>
              <Link href="/officer/dashboard" className={navLinkClass('/officer/dashboard')}>
                <ClipboardDocumentCheckIcon className="h-5 w-5" />
                <span>Xét duyệt hồ sơ</span>
              </Link>
            </>
          )}

          {/* Menu cho Giảng viên */}
          {isSupervisor && (
            <>
              <Link href="/supervisor/dashboard" className={navLinkClass('/supervisor/dashboard')}>
                <UsersIcon className="h-5 w-5" />
                <span>Sinh viên hướng dẫn</span>
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Logout button at bottom */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
