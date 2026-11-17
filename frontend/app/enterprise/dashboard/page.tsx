// frontend/app/enterprise/dashboard/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  UsersIcon,
  BuildingOfficeIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentCheckIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import { InternshipProfile, PaginatedResponse } from '@/types/api';

export default function EnterpriseDashboard() {
  const [profiles, setProfiles] = useState<InternshipProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<PaginatedResponse<InternshipProfile>>('/internships/profiles', {
        page: 1,
        limit: 50,
      });
      setProfiles(res.items || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách sinh viên thực tập:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      !search ||
      p.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      p.student?.studentCode?.toLowerCase().includes(search.toLowerCase()) ||
      p.position?.toLowerCase().includes(search.toLowerCase()) ||
      p.title?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === 'ALL' ||
      p.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalInterns = profiles.length;
  const inProgressCount = profiles.filter((p) => p.status === 'APPROVED').length;
  const submittedReportCount = profiles.filter((p) => p.status === 'REPORT_SUBMITTED').length;

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader title="Quản lý Sinh viên Thực tập Doanh nghiệp" />

        <main className="flex-1 p-8">
          {/* Header & Thống kê */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển Doanh nghiệp</h1>
              <p className="text-sm text-gray-500 mt-1">
                Theo dõi tiến độ hàng tuần và hoàn thành phiếu đánh giá thực tập cho sinh viên tại công ty.
              </p>
            </div>
            <button
              onClick={fetchProfiles}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>

          {/* Cards Thống kê */}
          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-[#8093FF]">
                <UsersIcon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng sinh viên tại DN</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">{totalInterns}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <BuildingOfficeIcon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Đang trong kỳ thực tập</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">{inProgressCount}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <DocumentCheckIcon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Đã nộp báo cáo cuối</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">{submittedReportCount}</p>
              </div>
            </div>
          </div>

          {/* Bộ lọc & Tìm kiếm */}
          <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="relative w-full md:w-80">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên SV, MSSV, vị trí..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-gray-500">Trạng thái:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#8093FF] focus:outline-none"
              >
                <option value="ALL">Tất cả hồ sơ</option>
                <option value="APPROVED">Đang thực tập (APPROVED)</option>
                <option value="REPORT_SUBMITTED">Đã nộp báo cáo (REPORT_SUBMITTED)</option>
              </select>
            </div>
          </div>

          {/* Bảng danh sách sinh viên */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="h-9 w-9 border-4 border-[#8093FF] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm font-semibold text-gray-500">Đang tải danh sách sinh viên...</p>
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-base font-semibold text-gray-600">Không tìm thấy sinh viên nào</p>
                <p className="text-xs text-gray-400 mt-1">
                  Chưa có sinh viên nào đăng ký thực tập tại doanh nghiệp của bạn hoặc không khớp bộ lọc.
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-[#FAFBFD]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      Sinh viên
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      Vị trí & Đề tài
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      GV Hướng dẫn
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {filteredProfiles.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 font-bold text-[#8093FF]">
                            {p.student?.fullName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{p.student?.fullName || 'Sinh viên'}</p>
                            <p className="text-xs text-gray-400 font-mono">{p.student?.studentCode || 'N/A'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-800">{p.position || 'Thực tập sinh'}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{p.title || 'Chưa cập nhật đề tài'}</p>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-700">
                          {p.supervisor?.fullName || 'Chưa phân công'}
                        </p>
                        <p className="text-xs text-gray-400">Khoa CNTT</p>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge status={p.status} />
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/enterprise/progress/${p.id}`}
                            className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 border border-gray-200 transition"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-500" />
                            <span>Tiến độ</span>
                          </Link>

                          <Link
                            href={`/enterprise/evaluate/${p.id}`}
                            className="flex items-center gap-1.5 rounded-xl bg-[#8093FF] px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-100 hover:opacity-90 transition"
                          >
                            <ClipboardDocumentCheckIcon className="h-4 w-4" />
                            <span>Chấm điểm DN</span>
                            <ArrowRightIcon className="h-3 w-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
