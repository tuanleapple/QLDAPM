// frontend/components/layout/AppHeader.tsx
'use client';

import React from 'react';
import { BellIcon, ArrowRightOnRectangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { user, logout } = useAuth();

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'OFFICER':
        return 'Cán bộ Khoa';
      case 'SUPERVISOR':
        return 'Giảng viên HD';
      case 'STUDENT':
        return 'Sinh viên';
      case 'ENTERPRISE_REP':
        return 'Đại diện DN';
      default:
        return 'Người dùng';
    }
  };

  return (
    <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-8">
      <div>
        {title ? (
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        ) : (
          <div className="relative w-80">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm thông tin..."
              className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <button
          type="button"
          aria-label="Thông báo"
          className="relative text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-50 transition"
        >
          <BellIcon className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-[#8093FF]">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900">{user?.fullName || user?.email}</p>
            <span className="inline-block px-2 py-0.5 text-[11px] font-semibold text-[#8093FF] bg-[#F0F2FF] rounded-md">
              {getRoleLabel(user?.role)}
            </span>
          </div>

          <button
            onClick={logout}
            title="Đăng xuất"
            className="ml-4 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-100 transition"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
}
