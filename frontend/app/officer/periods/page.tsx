// frontend/app/officer/periods/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  CalendarDaysIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api-client';
import { InternshipPeriod, PaginatedResponse } from '@/types/api';

export default function OfficerPeriodsPage() {
  const [periods, setPeriods] = useState<InternshipPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<InternshipPeriod | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    registrationOpenAt: '',
    registrationCloseAt: '',
    reportDeadline: '',
    enterpriseWeight: 0.4,
    supervisorProcessWeight: 0.3,
    supervisorReportWeight: 0.3,
  });

  const fetchPeriods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<PaginatedResponse<InternshipPeriod>>('/internships/periods', {
        page: 1,
        limit: 50,
      });
      setPeriods(res.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải danh mục đợt thực tập');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  const handleOpenCreate = () => {
    setEditingPeriod(null);
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      registrationOpenAt: '',
      registrationCloseAt: '',
      reportDeadline: '',
      enterpriseWeight: 0.4,
      supervisorProcessWeight: 0.3,
      supervisorReportWeight: 0.3,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: InternshipPeriod) => {
    setEditingPeriod(p);
    const toIsoDate = (d?: string) => (d ? new Date(d).toISOString().slice(0, 16) : '');
    const toDay = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : '');

    setFormData({
      name: p.name,
      startDate: toDay(p.startDate),
      endDate: toDay(p.endDate),
      registrationOpenAt: toIsoDate(p.registrationOpenAt),
      registrationCloseAt: toIsoDate(p.registrationCloseAt),
      reportDeadline: toIsoDate(p.reportDeadlineAt),
      enterpriseWeight: p.enterpriseWeight ?? 0.4,
      supervisorProcessWeight: p.supervisorProcessWeight ?? 0.3,
      supervisorReportWeight: p.supervisorReportWeight ?? 0.3,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        registrationOpenAt: formData.registrationOpenAt
          ? new Date(formData.registrationOpenAt).toISOString()
          : undefined,
        registrationCloseAt: formData.registrationCloseAt
          ? new Date(formData.registrationCloseAt).toISOString()
          : undefined,
        reportDeadline: formData.reportDeadline
          ? new Date(formData.reportDeadline).toISOString()
          : undefined,
        enterpriseWeight: Number(formData.enterpriseWeight),
        supervisorProcessWeight: Number(formData.supervisorProcessWeight),
        supervisorReportWeight: Number(formData.supervisorReportWeight),
      };

      if (editingPeriod) {
        await apiClient.patch(`/internships/periods/${editingPeriod.id}`, payload);
        setSuccessMsg('Đã cập nhật đợt thực tập thành công!');
      } else {
        await apiClient.post('/internships/periods', payload);
        setSuccessMsg('Đã tạo đợt thực tập mới thành công!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchPeriods();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu đợt thực tập');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đợt "${name}"?`)) return;
    try {
      setError(null);
      await apiClient.delete(`/internships/periods/${id}`);
      setSuccessMsg('Đã xóa đợt thực tập thành công!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchPeriods();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể xóa đợt (đã có hồ sơ liên kết)');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader title="Quản lý Đợt thực tập" />

        <main className="flex-1 p-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Danh mục Đợt thực tập</h1>
              <p className="text-sm text-gray-500 mt-1">
                Quản lý lịch mở đăng ký, hạn nộp báo cáo và cấu hình tỷ lệ trọng số điểm tổng kết.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchPeriods}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>

              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 rounded-xl bg-[#8093FF] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-100 hover:opacity-90 transition"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Tạo đợt mới</span>
              </button>
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

          {/* Bảng danh sách đợt thực tập */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="h-9 w-9 border-4 border-[#8093FF] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm font-semibold text-gray-500">Đang tải danh sách đợt thực tập...</p>
              </div>
            ) : periods.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-base font-semibold text-gray-600">Chưa có đợt thực tập nào</p>
                <p className="text-xs text-gray-400 mt-1">Bấm &quot;Tạo đợt mới&quot; để thiết lập kỳ thực tập.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-[#FAFBFD]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      Tên đợt thực tập
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      Thời gian mở ĐK
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      Thời gian diễn ra
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      Hạn nộp báo cáo
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                      Trọng số điểm (DN / QT / BC)
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {periods.map((p) => {
                    const now = new Date();
                    const isOpen =
                      new Date(p.registrationOpenAt) <= now && now <= new Date(p.registrationCloseAt);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900">{p.name}</p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              isOpen
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {isOpen ? 'Đang mở đăng ký' : 'Đóng đăng ký'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs text-gray-600">
                          <p>Mở: {new Date(p.registrationOpenAt).toLocaleDateString('vi-VN')}</p>
                          <p className="text-gray-400">
                            Đóng: {new Date(p.registrationCloseAt).toLocaleDateString('vi-VN')}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-xs text-gray-600">
                          <p>{new Date(p.startDate).toLocaleDateString('vi-VN')}</p>
                          <p className="text-gray-400">➔ {new Date(p.endDate).toLocaleDateString('vi-VN')}</p>
                        </td>

                        <td className="px-6 py-4 text-xs text-gray-600">
                          <p className="font-semibold text-rose-600 flex items-center gap-1">
                            <ClockIcon className="h-3.5 w-3.5" />
                            {p.reportDeadlineAt
                              ? new Date(p.reportDeadlineAt).toLocaleDateString('vi-VN')
                              : 'Chưa đặt'}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-50 text-[#8093FF] font-mono text-xs font-bold">
                            {((p.enterpriseWeight ?? 0.4) * 100).toFixed(0)}% /{' '}
                            {((p.supervisorProcessWeight ?? 0.3) * 100).toFixed(0)}% /{' '}
                            {((p.supervisorReportWeight ?? 0.3) * 100).toFixed(0)}%
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              title="Chỉnh sửa"
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              title="Xóa đợt"
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Modal Tạo/Sửa đợt thực tập */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPeriod ? 'Chỉnh sửa Đợt thực tập' : 'Tạo Đợt thực tập mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tên đợt thực tập *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: HK1 2026-2027 (Khóa 2022)"
              className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#8093FF] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mở đăng ký *</label>
              <input
                type="datetime-local"
                required
                value={formData.registrationOpenAt}
                onChange={(e) => setFormData({ ...formData, registrationOpenAt: e.target.value })}
                className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:border-[#8093FF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Đóng đăng ký *</label>
              <input
                type="datetime-local"
                required
                value={formData.registrationCloseAt}
                onChange={(e) => setFormData({ ...formData, registrationCloseAt: e.target.value })}
                className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:border-[#8093FF] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Ngày bắt đầu *</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:border-[#8093FF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Ngày kết thúc *</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:border-[#8093FF] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Hạn nộp báo cáo *</label>
            <input
              type="datetime-local"
              required
              value={formData.reportDeadline}
              onChange={(e) => setFormData({ ...formData, reportDeadline: e.target.value })}
              className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:border-[#8093FF] focus:outline-none"
            />
          </div>

          <div className="border-t border-gray-100 pt-3">
            <label className="block text-xs font-bold text-gray-700 mb-2">Trọng số tính điểm (Tổng = 1.0)</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-gray-500">Doanh nghiệp (DN)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  required
                  value={formData.enterpriseWeight}
                  onChange={(e) => setFormData({ ...formData, enterpriseWeight: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs text-center font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">GVHD Quá trình</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  required
                  value={formData.supervisorProcessWeight}
                  onChange={(e) =>
                    setFormData({ ...formData, supervisorProcessWeight: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs text-center font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">GVHD Báo cáo</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  required
                  value={formData.supervisorReportWeight}
                  onChange={(e) =>
                    setFormData({ ...formData, supervisorReportWeight: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs text-center font-bold"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#8093FF] px-5 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : editingPeriod ? 'Cập nhật' : 'Tạo đợt'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
