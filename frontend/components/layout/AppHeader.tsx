// frontend/components/layout/AppHeader.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  BellIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  KeyIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { PaginatedResponse } from '@/types/api';

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  readAt?: string | null;
  createdAt: string;
}

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await apiClient.get<PaginatedResponse<NotificationItem>>('/notifications', {
        page: 1,
        limit: 10,
      });
      setNotifications(res.items || []);
    } catch {
      // Silently ignore if not ready
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
    } catch {
      // Ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-8 relative z-30">
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
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Thông báo"
            className="relative text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-50 transition"
          >
            <BellIcon className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Popover Dropdown */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white p-4 shadow-xl border border-gray-100 z-50">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                <h3 className="text-sm font-bold text-gray-900">Thông báo</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-[#8093FF]">
                    {unreadCount} chưa đọc
                  </span>
                )}
              </div>

              {loading ? (
                <div className="py-6 text-center text-xs text-gray-400">Đang tải thông báo...</div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  <CheckCircleIcon className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  Bạn không có thông báo mới nào.
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 divide-y divide-gray-50">
                  {notifications.map((n) => {
                    const isUnread = !n.readAt;
                    return (
                      <div
                        key={n.id}
                        onClick={() => isUnread && markAsRead(n.id)}
                        className={`p-2.5 rounded-xl transition cursor-pointer text-xs ${
                          isUnread
                            ? 'bg-indigo-50/50 hover:bg-indigo-50 font-medium'
                            : 'hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-gray-900 text-xs">{n.title}</p>
                          <span className="text-[10px] text-gray-400">
                            {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-gray-600 line-clamp-2 leading-relaxed">{n.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Info & Actions */}
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

          <Link
            href="/change-password"
            title="Đổi mật khẩu"
            className="ml-4 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-[#8093FF] hover:bg-indigo-50 rounded-lg border border-gray-200 transition"
          >
            <KeyIcon className="w-4 h-4 text-gray-500" />
            <span>Đổi MK</span>
          </Link>

          <button
            onClick={logout}
            title="Đăng xuất"
            className="ml-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-100 transition"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
}
