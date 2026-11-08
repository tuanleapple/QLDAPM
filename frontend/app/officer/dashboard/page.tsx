// frontend/app/officer/dashboard/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api-client';
import {
  InternshipProfile,
  OfficerDashboardData,
  PaginatedResponse,
  ProfileStatus,
  Supervisor,
} from '@/types/api';

export default function OfficerDashboard() {
  const [stats, setStats] = useState<OfficerDashboardData | null>(null);
  const [profiles, setProfiles] = useState<InternshipProfile[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>('SUBMITTED');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Review Modal state
  const [selectedProfile, setSelectedProfile] = useState<InternshipProfile | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'NEEDS_REVISION' | 'REJECTED'>('APPROVED');
  const [supervisorId, setSupervisorId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiClient.get<OfficerDashboardData>('/internships/dashboard/officer');
      setStats(data);
    } catch {
      // Fallback
    }
  }, []);

  const fetchSupervisors = useCallback(async () => {
    try {
      const res = await apiClient.get<PaginatedResponse<Supervisor>>('/internships/supervisors', {
        page: 1,
        limit: 50,
      });
      setSupervisors(res.items || []);
    } catch {
      // Fallback
    }
  }, []);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number | undefined> = {
        page,
        limit: 15,
      };
      if (statusFilter && statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const res = await apiClient.get<PaginatedResponse<InternshipProfile>>('/internships/profiles', params);
      setProfiles(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total || 0);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchTerm]);

  useEffect(() => {
    fetchStats();
    fetchSupervisors();
  }, [fetchStats, fetchSupervisors]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleOpenReviewModal = (profile: InternshipProfile, action: 'APPROVED' | 'NEEDS_REVISION' | 'REJECTED') => {
    setSelectedProfile(profile);
    setReviewAction(action);
    setReason('');
    setSupervisorId(supervisors[0]?.id || '');
    setErrorMsg(null);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    if (reviewAction === 'APPROVED' && !supervisorId) {
      setErrorMsg('Vui lòng chọn Giảng viên hướng dẫn để phân công');
      return;
    }

    if (reviewAction !== 'APPROVED' && !reason.trim()) {
      setErrorMsg('Vui lòng nhập lý do từ chối hoặc yêu cầu sửa đổi');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload: { status: ProfileStatus; supervisorId?: string; reason?: string } = {
        status: reviewAction,
      };
      if (reviewAction === 'APPROVED') {
        payload.supervisorId = supervisorId;
      } else {
        payload.reason = reason.trim();
      }

      await apiClient.patch(`/internships/profiles/${selectedProfile.id}/review`, payload);

      setSuccessMsg(`Đã cập nhật trạng thái hồ sơ của sinh viên thành công!`);
      setSelectedProfile(null);
      fetchProfiles();
      fetchStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xử lý xét duyệt thất bại';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await apiClient.download(
        '/internships/profiles/export.csv',
        `danh_sach_thuc_tap_${new Date().toISOString().split('T')[0]}.csv`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tải CSV thất bại';
      alert(msg);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Bảng điều khiển Cán bộ Khoa" />

        <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
          {/* Header Action */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Xét duyệt & Quản lý hồ sơ thực tập</h1>
              <p className="mt-1 text-sm text-gray-500">
                Theo dõi toàn bộ đơn đăng ký thực tập, phê duyệt, phân công Giảng viên hướng dẫn và xuất danh sách.
              </p>
            </div>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 shadow-xs hover:bg-gray-50 transition"
            >
              <ArrowDownTrayIcon className="w-4 h-4 text-gray-500" />
              <span>Xuất danh sách CSV</span>
            </button>
          </div>

          {successMsg && (
            <div className="mb-6 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800 border border-emerald-100 flex items-center justify-between">
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Chờ xét duyệt</p>
                  <p className="text-3xl font-extrabold text-[#8093FF] mt-1">
                    {stats?.profileCountsByStatus?.['SUBMITTED'] || 0}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#8093FF]">
                  <ClockIcon className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Đã phê duyệt</p>
                  <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                    {stats?.profileCountsByStatus?.['APPROVED'] || 0}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircleIcon className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Yêu cầu bổ sung</p>
                  <p className="text-3xl font-extrabold text-amber-600 mt-1">
                    {stats?.profileCountsByStatus?.['NEEDS_REVISION'] || 0}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <ExclamationCircleIcon className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Đã từ chối</p>
                  <p className="text-3xl font-extrabold text-rose-600 mt-1">
                    {stats?.profileCountsByStatus?.['REJECTED'] || 0}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <XCircleIcon className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-3xl border border-gray-200/80 bg-white shadow-xs overflow-hidden">
            {/* Table Filter Toolbar */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                {[
                  { key: 'SUBMITTED', label: 'Chờ duyệt' },
                  { key: 'APPROVED', label: 'Đã duyệt' },
                  { key: 'NEEDS_REVISION', label: 'Cần sửa đổi' },
                  { key: 'REJECTED', label: 'Từ chối' },
                  { key: 'ALL', label: 'Tất cả hồ sơ' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setStatusFilter(item.key);
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      statusFilter === item.key
                        ? 'bg-[#8093FF] text-white shadow-xs'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sinh viên..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-2 text-xs focus:bg-white focus:border-[#8093FF] focus:outline-none transition"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Sinh viên</th>
                    <th className="px-6 py-4">Doanh nghiệp & Vị trí</th>
                    <th className="px-6 py-4">Giảng viên HD</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-gray-400">
                        <div className="h-6 w-6 border-2 border-[#8093FF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Đang tải danh sách hồ sơ...
                      </td>
                    </tr>
                  ) : profiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-gray-400">
                        Không có hồ sơ nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    profiles.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{p.student?.fullName || p.student?.email}</p>
                          <p className="text-xs text-gray-400">{p.student?.email}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Nộp: {new Date(p.updatedAt).toLocaleDateString('vi-VN')}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-800">{p.enterprise?.name || 'Tự liên hệ'}</p>
                          <p className="text-xs text-[#8093FF] font-medium">{p.position || p.title}</p>
                        </td>

                        <td className="px-6 py-4">
                          {p.supervisor ? (
                            <span className="font-semibold text-gray-900 text-xs">
                              {p.supervisor.fullName || p.supervisor.email}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Chưa phân công</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <Badge status={p.status} />
                        </td>

                        <td className="px-6 py-4 text-right">
                          {p.status === 'SUBMITTED' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenReviewModal(p, 'APPROVED')}
                                title="Phê duyệt & Phân công GVHD"
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition"
                              >
                                <CheckIcon className="w-3.5 h-3.5" />
                                <span>Duyệt</span>
                              </button>

                              <button
                                onClick={() => handleOpenReviewModal(p, 'NEEDS_REVISION')}
                                title="Yêu cầu sửa đổi"
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold transition"
                              >
                                <PencilSquareIcon className="w-3.5 h-3.5" />
                                <span>Sửa</span>
                              </button>

                              <button
                                onClick={() => handleOpenReviewModal(p, 'REJECTED')}
                                title="Từ chối hồ sơ"
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition"
                              >
                                <XMarkIcon className="w-3.5 h-3.5" />
                                <span>Từ chối</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Đã xử lý</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 text-xs text-gray-500">
              <span>
                Hiển thị {profiles.length} / {totalCount} hồ sơ
              </span>
              <div className="flex gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  Trước
                </button>
                <span className="px-3 py-1.5 font-bold text-gray-900">
                  Trang {page} / {totalPages || 1}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>

          {/* Modal Xét duyệt */}
          <Modal
            isOpen={!!selectedProfile}
            onClose={() => setSelectedProfile(null)}
            title={
              reviewAction === 'APPROVED'
                ? 'Phê duyệt hồ sơ & Phân công Giảng viên'
                : reviewAction === 'NEEDS_REVISION'
                ? 'Yêu cầu sinh viên sửa đổi hồ sơ'
                : 'Từ chối hồ sơ thực tập'
            }
          >
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="bg-gray-50 p-3.5 rounded-xl text-xs space-y-1">
                <p>
                  <strong>Sinh viên:</strong> {selectedProfile?.student?.fullName || selectedProfile?.student?.email}
                </p>
                <p>
                  <strong>Doanh nghiệp:</strong> {selectedProfile?.enterprise?.name || 'Chưa liên kết'}
                </p>
                <p>
                  <strong>Vị trí:</strong> {selectedProfile?.position || selectedProfile?.title}
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 text-xs font-semibold text-rose-700 border border-rose-100">
                  {errorMsg}
                </div>
              )}

              {reviewAction === 'APPROVED' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Chọn Giảng viên hướng dẫn <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={supervisorId}
                    onChange={(e) => setSupervisorId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#8093FF] focus:outline-none"
                    required
                  >
                    <option value="">-- Chọn Giảng viên phụ trách --</option>
                    {supervisors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName || s.email} {s.department ? `(${s.department})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Lý do {reviewAction === 'NEEDS_REVISION' ? 'yêu cầu sửa đổi' : 'từ chối'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ghi rõ thông tin cần bổ sung hoặc nguyên nhân từ chối..."
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#8093FF] focus:outline-none resize-none"
                    required
                  />
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProfile(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition disabled:opacity-50 ${
                    reviewAction === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : reviewAction === 'NEEDS_REVISION'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submitting ? 'Đang lưu...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}
