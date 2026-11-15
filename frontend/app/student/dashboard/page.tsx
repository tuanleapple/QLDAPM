// frontend/app/student/dashboard/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  CalendarIcon,
  BuildingOfficeIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  TrophyIcon,
  ArrowRightIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
  DocumentPlusIcon,
  UserPlusIcon as UserCheckIcon,
} from '@heroicons/react/24/outline';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { InternshipProfile, PaginatedResponse, StudentDashboardData } from '@/types/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [profile, setProfile] = useState<InternshipProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<StudentDashboardData>('/internships/dashboard/student');
      setDashboardData(data);

      const profilesRes = await apiClient.get<PaginatedResponse<InternshipProfile>>('/internships/profiles', {
        page: 1,
        limit: 5,
      });
      if (profilesRes.items?.length > 0) {
        setProfile(profilesRes.items[0]);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const getTimelineStep = () => {
    if (!profile) return 0;
    switch (profile.status) {
      case 'DRAFT':
        return 1;
      case 'SUBMITTED':
      case 'NEEDS_REVISION':
        return 2;
      case 'APPROVED':
        return 3;
      case 'REPORT_SUBMITTED':
        return 4;
      default:
        return 2;
    }
  };

  const step = getTimelineStep();

  const latestHistory = profile?.statusHistory?.[0];
  const revisionReason =
    profile?.status === 'NEEDS_REVISION'
      ? latestHistory?.reason || 'Cán bộ yêu cầu bổ sung/sửa đổi thông tin hồ sơ.'
      : null;

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />

        <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
          {/* Greeting */}
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">
                Xin chào, {user?.fullName || user?.email?.split('@')[0]} 👋
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Theo dõi tiến trình đăng ký và thực tập tốt nghiệp của bạn tại đây.
              </p>
            </div>
            {dashboardData?.activePeriod && (
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-xs">
                <CalendarIcon className="h-4 w-4 text-[#8093FF]" />
                <span>{dashboardData.activePeriod.name}</span>
              </div>
            )}
          </div>

          {/* Cảnh báo yêu cầu sửa đổi hồ sơ nếu có */}
          {revisionReason && (
            <div className="mb-6 flex items-start justify-between rounded-2xl bg-amber-50 p-5 border border-amber-200 shadow-xs">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-amber-900">Hồ sơ cần chỉnh sửa lại</h3>
                  <p className="text-sm text-amber-800 mt-1">Lý do từ Cán bộ: &ldquo;{revisionReason}&rdquo;</p>
                </div>
              </div>
              <Link
                href="/student/register-intern"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition flex-shrink-0 shadow-xs"
              >
                <PencilSquareIcon className="w-4 h-4" />
                <span>Chỉnh sửa ngay</span>
              </Link>
            </div>
          )}

          {/* Section 1: Timeline tiến độ thực tập */}
          <div className="mb-6 rounded-2xl border border-gray-200/70 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-8">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <RocketLaunchIcon className="h-5 w-5 text-[#8093FF]" />
                Tiến trình thực tập
              </h2>
              {profile && <Badge status={profile.status} />}
            </div>

            <div className="relative flex justify-between px-6 md:px-12">
              <div className="absolute left-12 right-12 top-6 h-[2px] bg-gray-100 -z-0"></div>
              <div
                className="absolute left-12 top-6 h-[2px] bg-[#8093FF] -z-0 transition-all duration-500"
                style={{ width: `${Math.min(100, (Math.max(0, step - 1) / 3) * 100)}%` }}
              ></div>

              {/* Step 1: Tạo hồ sơ */}
              <div className="z-10 flex flex-col items-center gap-2">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ring-4 ring-white ${
                    step >= 1 ? 'bg-[#8093FF] text-white shadow-md shadow-indigo-100' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <DocumentTextIcon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-900">1. Đăng ký</p>
                  <p className="text-[11px] text-gray-500">{step >= 1 ? 'Hoàn thành' : 'Chưa tạo'}</p>
                </div>
              </div>

              {/* Step 2: Cán bộ duyệt */}
              <div className="z-10 flex flex-col items-center gap-2">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ring-4 ring-white ${
                    step >= 2 ? 'bg-[#8093FF] text-white shadow-md shadow-indigo-100' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <UserCheckIcon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-900">2. Xét duyệt</p>
                  <p className="text-[11px] text-gray-500">
                    {step > 2 ? 'Đã duyệt' : step === 2 ? 'Đang xét duyệt' : 'Chờ nộp'}
                  </p>
                </div>
              </div>

              {/* Step 3: Thực tập & Báo cáo tiến độ */}
              <div className="z-10 flex flex-col items-center gap-2">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ring-4 ring-white ${
                    step >= 3 ? 'bg-[#8093FF] text-white shadow-md shadow-indigo-100' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <RocketLaunchIcon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-900">3. Thực tập & Tiến độ</p>
                  <p className="text-[11px] text-gray-500">{step >= 3 ? 'Đang thực hiện' : 'Chưa mở'}</p>
                </div>
              </div>

              {/* Step 4: Đánh giá & Hoàn thành */}
              <div className="z-10 flex flex-col items-center gap-2">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ring-4 ring-white ${
                    step >= 4 ? 'bg-[#8093FF] text-white shadow-md shadow-indigo-100' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <TrophyIcon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-900">4. Đánh giá cuối kỳ</p>
                  <p className="text-[11px] text-gray-500">{step >= 4 ? 'Đã nộp báo cáo' : 'Chờ hoàn tất'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin chi tiết hồ sơ hiện tại */}
          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-center border border-gray-100">
              <div className="h-6 w-6 border-2 border-[#8093FF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400">Đang tải dữ liệu hồ sơ...</p>
            </div>
          ) : !profile ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
              <DocumentPlusIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">Bạn chưa đăng ký hồ sơ thực tập</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                Hãy tạo hồ sơ nguyện vọng thực tập để được xét duyệt và phân công Giảng viên hướng dẫn.
              </p>
              <Link
                href="/student/register-intern"
                className="inline-flex items-center gap-2 rounded-xl bg-[#8093FF] px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-100 hover:opacity-90 transition"
              >
                <DocumentPlusIcon className="w-4 h-4" />
                Đăng ký thực tập ngay
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Thẻ thông tin hồ sơ */}
              <div className="lg:col-span-2 rounded-2xl border border-gray-200/70 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{profile.position || profile.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Mã hồ sơ: {profile.id}</p>
                  </div>
                  <Badge status={profile.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs font-semibold text-gray-400 block mb-1">Đơn vị thực tập</span>
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                      <BuildingOfficeIcon className="w-4 h-4 text-[#8093FF]" />
                      <span>{profile.enterprise?.name || 'Chưa liên kết doanh nghiệp'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-gray-400 block mb-1">Giảng viên hướng dẫn</span>
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                      <UserCheckIcon className="w-4 h-4 text-[#8093FF]" />
                      <span>{profile.supervisor?.fullName || profile.supervisor?.email || 'Chờ phân công'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-gray-400 block mb-1">Thời gian thực tập</span>
                    <p className="font-medium text-gray-800">
                      {profile.internshipStartAt
                        ? new Date(profile.internshipStartAt).toLocaleDateString('vi-VN')
                        : '---'}{' '}
                      đến{' '}
                      {profile.internshipEndAt
                        ? new Date(profile.internshipEndAt).toLocaleDateString('vi-VN')
                        : '---'}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-gray-400 block mb-1">Cập nhật lần cuối</span>
                    <p className="font-medium text-gray-800">
                      {new Date(profile.updatedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>

                {profile.description && (
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-gray-400 block mb-1">Kế hoạch / Ghi chú</span>
                    <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl leading-relaxed">
                      {profile.description}
                    </p>
                  </div>
                )}

                {/* Nút hành động cho hồ sơ */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  {['DRAFT', 'NEEDS_REVISION'].includes(profile.status) ? (
                    <Link
                      href="/student/register-intern"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                      Chỉnh sửa hồ sơ
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Hồ sơ đã được khóa sau khi nộp</span>
                  )}

                  {profile.status === 'APPROVED' && (
                    <Link
                      href="/student/progress"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8093FF] text-white text-xs font-bold hover:opacity-90 transition shadow-xs"
                    >
                      <span>Cập nhật tiến độ</span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Thẻ thống kê tiến độ */}
              <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-4">Nhật ký tiến độ</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0F2FF] text-[#8093FF] font-black text-2xl">
                      {dashboardData?.progressCount || 0}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Bản cập nhật tiến độ</p>
                      <p className="text-xs text-gray-500">Đã nộp định kỳ</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Sinh viên cần báo cáo định kỳ công việc thực tế tại cơ quan thực tập để Giảng viên theo dõi và nhận xét.
                  </p>
                </div>

                <Link
                  href="/student/progress"
                  className="mt-6 flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  <span>Mở sổ nhật ký tiến độ</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
