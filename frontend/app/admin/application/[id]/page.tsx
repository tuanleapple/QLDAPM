// frontend/app/admin/application/[id]/page.tsx
'use client';

import React, { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import { InternshipProfile, PaginatedResponse, Supervisor } from '@/types/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ApplicationDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const profileId = resolvedParams.id;

  const [profile, setProfile] = useState<InternshipProfile | null>(null);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Review state
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  const [reviewReason, setReviewReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchProfileAndSupervisors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [profRes, supRes] = await Promise.all([
        apiClient.get<InternshipProfile>(`/internships/profiles/${profileId}`),
        apiClient.get<PaginatedResponse<Supervisor>>('/internships/supervisors', {
          page: 1,
          limit: 100,
        }),
      ]);

      setProfile(profRes);
      setSupervisors(supRes.items || []);
      if (supRes.items && supRes.items.length > 0) {
        setSelectedSupervisorId(profRes.supervisorId || supRes.items[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải chi tiết hồ sơ thực tập');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchProfileAndSupervisors();
  }, [fetchProfileAndSupervisors]);

  const handleReviewSubmit = async (status: 'APPROVED' | 'NEEDS_REVISION' | 'REJECTED') => {
    try {
      setSubmittingReview(true);
      setError(null);

      const payload: Record<string, unknown> = { status };
      if (status === 'APPROVED') {
        if (!selectedSupervisorId) {
          setError('Vui lòng chọn Giảng viên hướng dẫn để duyệt hồ sơ');
          setSubmittingReview(false);
          return;
        }
        payload.supervisorId = selectedSupervisorId;
      } else {
        if (!reviewReason.trim()) {
          setError('Vui lòng nhập lý do từ chối hoặc yêu cầu bổ sung');
          setSubmittingReview(false);
          return;
        }
        payload.reason = reviewReason.trim();
      }

      await apiClient.patch(`/internships/profiles/${profileId}/review`, payload);
      setSuccessMsg(
        status === 'APPROVED'
          ? 'Đã duyệt hồ sơ và phân công Giảng viên hướng dẫn!'
          : status === 'NEEDS_REVISION'
          ? 'Đã gửi yêu cầu chỉnh sửa/bổ sung hồ sơ cho sinh viên!'
          : 'Đã từ chối tiếp nhận hồ sơ thực tập!',
      );
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchProfileAndSupervisors();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xử lý hồ sơ thất bại');
    } finally {
      setSubmittingReview(false);
    }
  };

  const isPendingReview = profile?.status === 'SUBMITTED';

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader title="Chi tiết Hồ sơ Thực tập" />

        <main className="flex-1 p-8">
          {/* Header & Back Button */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/officer/dashboard"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm hover:text-[#8093FF] transition border border-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chi tiết Hồ sơ Thực tập</h1>
                <p className="text-sm text-gray-500">
                  Mã hồ sơ: <span className="font-mono font-semibold text-[#8093FF]">{profileId.slice(0, 8)}...</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {profile && <Badge status={profile.status} />}
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 border border-red-100">
              <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 border border-emerald-100">
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-emerald-600 mt-0.5" />
              <p>{successMsg}</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="h-10 w-10 border-4 border-[#8093FF] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-semibold text-gray-500">Đang tải thông tin hồ sơ...</p>
            </div>
          ) : !profile ? (
            <div className="py-20 text-center text-gray-400">Không tìm thấy hồ sơ thực tập.</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* CỘT TRÁI (2/3): THÔNG TIN ĐĂNG KÝ THỰC TẬP */}
              <div className="space-y-6 lg:col-span-2">
                {/* Thông tin sinh viên */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                    <UserCircleIcon className="h-5 w-5 text-[#8093FF]" />
                    <span>Thông tin Sinh viên đăng ký</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Họ và tên sinh viên</p>
                      <p className="text-base font-bold text-gray-900 mt-0.5">
                        {profile.student?.fullName || 'Sinh viên'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Mã số sinh viên (MSSV)</p>
                      <p className="text-base font-mono font-bold text-[#8093FF] mt-0.5">
                        {profile.student?.studentCode || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Email liên lạc</p>
                      <p className="text-sm text-gray-700 mt-0.5">{profile.student?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Đợt thực tập</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{profile.period?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Thông tin đơn vị thực tập & Vị trí */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                    <BuildingOfficeIcon className="h-5 w-5 text-indigo-500" />
                    <span>Đơn vị Thực tập & Đề tài</span>
                  </h2>

                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Doanh nghiệp tiếp nhận</p>
                      <p className="text-base font-bold text-gray-900 mt-0.5">
                        {profile.enterprise?.name || 'Thực tập ngoài danh mục / Tự liên hệ'}
                      </p>
                      {profile.enterprise?.address && (
                        <p className="text-xs text-gray-500 mt-0.5">{profile.enterprise.address}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Vị trí thực tập</p>
                        <p className="text-sm font-bold text-gray-800 mt-0.5">{profile.position || 'Thực tập sinh'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Thời gian thực tập dự kiến</p>
                        <p className="text-xs text-gray-700 mt-0.5 flex items-center gap-1 font-medium">
                          <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                          {profile.internshipStartAt
                            ? new Date(profile.internshipStartAt).toLocaleDateString('vi-VN')
                            : '--'}{' '}
                          ➔{' '}
                          {profile.internshipEndAt
                            ? new Date(profile.internshipEndAt).toLocaleDateString('vi-VN')
                            : '--'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">Tên đề tài / Mô tả công việc</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5 mb-1">{profile.title}</p>
                      <div className="rounded-xl bg-gray-50 p-4 text-xs text-gray-600 border border-gray-100 whitespace-pre-wrap leading-relaxed">
                        {profile.description || 'Không có mô tả chi tiết'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lịch sử trạng thái hồ sơ */}
                {profile.statusHistory && profile.statusHistory.length > 0 && (
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                      <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                      <span>Lịch sử xét duyệt hồ sơ ({profile.statusHistory.length})</span>
                    </h2>

                    <div className="space-y-3">
                      {profile.statusHistory.map((h) => (
                        <div key={h.id} className="rounded-xl border border-gray-100 bg-slate-50/70 p-3.5 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-gray-800">Trạng thái: {h.toStatus}</span>
                            <span className="text-gray-400">
                              {new Date(h.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          {h.reason && <p className="text-rose-600 mt-1 italic">Ghi chú: {h.reason}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CỘT PHẢI (1/3): THAO TÁC XÉT DUYỆT */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sticky top-28">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-3">
                    Xử lý & Phê duyệt
                  </h3>

                  {isPendingReview ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          Phân công Giảng viên hướng dẫn *
                        </label>
                        <select
                          value={selectedSupervisorId}
                          onChange={(e) => setSelectedSupervisorId(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs focus:border-[#8093FF] focus:outline-none"
                        >
                          {supervisors.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.fullName || s.email} {s.department ? `(${s.department})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => handleReviewSubmit('APPROVED')}
                        disabled={submittingReview}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-100 hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        <span>Duyệt hồ sơ & Phân công GVHD</span>
                      </button>

                      <div className="border-t border-gray-100 pt-3">
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          Lý do (nếu yêu cầu sửa hoặc từ chối)
                        </label>
                        <textarea
                          rows={2}
                          value={reviewReason}
                          onChange={(e) => setReviewReason(e.target.value)}
                          placeholder="Nhập lý do chi tiết..."
                          className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:border-[#8093FF] focus:outline-none mb-3"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleReviewSubmit('NEEDS_REVISION')}
                            disabled={submittingReview}
                            className="flex items-center justify-center gap-1 rounded-xl bg-amber-50 py-2.5 text-xs font-bold text-amber-700 border border-amber-200 hover:bg-amber-100 transition disabled:opacity-50"
                          >
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            <span>Yêu cầu sửa</span>
                          </button>

                          <button
                            onClick={() => handleReviewSubmit('REJECTED')}
                            disabled={submittingReview}
                            className="flex items-center justify-center gap-1 rounded-xl bg-rose-50 py-2.5 text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 transition disabled:opacity-50"
                          >
                            <XCircleIcon className="h-4 w-4" />
                            <span>Từ chối</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs text-gray-600">
                      <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-400">Trạng thái hiện tại:</span>
                        <Badge status={profile.status} />
                      </div>
                      <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-400">GVHD phụ trách:</span>
                        <span className="font-semibold text-gray-900">
                          {profile.supervisor?.fullName || 'Chưa phân công'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-center italic mt-4">
                        Hồ sơ này không ở trạng thái Chờ duyệt (SUBMITTED) nên không thể thực hiện phê duyệt lại.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
