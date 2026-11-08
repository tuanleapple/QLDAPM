// frontend/components/ui/Badge.tsx
import React from 'react';
import { ProfileStatus } from '@/types/api';

interface BadgeProps {
  status?: ProfileStatus | string;
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ status, children, variant }: BadgeProps) {
  let styleClass = 'bg-gray-100 text-gray-700';
  let label = children;

  if (status) {
    switch (status) {
      case 'DRAFT':
        styleClass = 'bg-gray-100 text-gray-700 border border-gray-200';
        label = label || 'Bản nháp';
        break;
      case 'SUBMITTED':
        styleClass = 'bg-blue-50 text-blue-700 border border-blue-200';
        label = label || 'Chờ duyệt';
        break;
      case 'APPROVED':
        styleClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        label = label || 'Đã duyệt';
        break;
      case 'NEEDS_REVISION':
        styleClass = 'bg-amber-50 text-amber-700 border border-amber-200';
        label = label || 'Yêu cầu sửa đổi';
        break;
      case 'REJECTED':
        styleClass = 'bg-rose-50 text-rose-700 border border-rose-200';
        label = label || 'Từ chối';
        break;
      case 'REPORT_SUBMITTED':
        styleClass = 'bg-purple-50 text-purple-700 border border-purple-200';
        label = label || 'Đã nộp báo cáo';
        break;
    }
  } else if (variant) {
    switch (variant) {
      case 'success':
        styleClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        break;
      case 'warning':
        styleClass = 'bg-amber-50 text-amber-700 border border-amber-200';
        break;
      case 'danger':
        styleClass = 'bg-rose-50 text-rose-700 border border-rose-200';
        break;
      case 'info':
        styleClass = 'bg-blue-50 text-blue-700 border border-blue-200';
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styleClass}`}
    >
      {label}
    </span>
  );
}
