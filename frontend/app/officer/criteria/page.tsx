// frontend/app/officer/criteria/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api-client';
import { Criterion, FormType, InternshipPeriod, PaginatedResponse } from '@/types/api';

export default function OfficerCriteriaPage() {
  const [periods, setPeriods] = useState<InternshipPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [selectedFormType, setSelectedFormType] = useState<FormType>('ENTERPRISE');
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCrit, setEditingCrit] = useState<Criterion | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'ENTERPRISE',
    weight: 1.0,
    description: '',
  });

  // 1. Tải danh sách đợt thực tập
  useEffect(() => {
    async function loadPeriods() {
      try {
        const res = await apiClient.get<PaginatedResponse<InternshipPeriod>>('/internships/periods', {
          page: 1,
          limit: 20,
        });
        const items = res.items || [];
        setPeriods(items);
        if (items.length > 0 && !selectedPeriodId) {
          setSelectedPeriodId(items[0].id);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Lỗi khi tải đợt thực tập');
      }
    }
    loadPeriods();
  }, [selectedPeriodId]);

  // 2. Tải tiêu chí khi đổi đợt hoặc đổi loại phiếu
  const fetchCriteria = useCallback(async () => {
    if (!selectedPeriodId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<PaginatedResponse<Criterion>>(
        `/evaluations/periods/${selectedPeriodId}/criteria`,
        {
          formType: selectedFormType,
          limit: 50,
        },
      );
      setCriteria(res.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách tiêu chí');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodId, selectedFormType]);

  useEffect(() => {
    fetchCriteria();
  }, [fetchCriteria]);

  const handleOpenCreate = () => {
    setEditingCrit(null);
    setFormData({
      code: '',
      name: '',
      category: selectedFormType === 'ENTERPRISE' ? 'ENTERPRISE' : 'PROCESS',
      weight: 1.0,
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Criterion) => {
    setEditingCrit(c);
    setFormData({
      code: c.code,
      name: c.name,
      category: c.category,
      weight: parseFloat(c.weight) || 1.0,
      description: c.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodId) return;
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        category: formData.category,
        weight: Number(formData.weight),
        description: formData.description.trim() || undefined,
      };

      if (editingCrit) {
        await apiClient.patch(`/evaluations/criteria/${editingCrit.id}`, payload);
        setSuccessMsg('Đã cập nhật tiêu chí đánh giá!');
      } else {
        await apiClient.post(`/evaluations/periods/${selectedPeriodId}/criteria/${selectedFormType}`, payload);
        setSuccessMsg('Đã tạo tiêu chí đánh giá mới!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchCriteria();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu tiêu chí (đợt đã có phiếu đánh giá)');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tiêu chí "${name}"?`)) return;
    try {
      setError(null);
      await apiClient.delete(`/evaluations/criteria/${id}`);
      setSuccessMsg('Đã xóa tiêu chí thành công!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchCriteria();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể xóa tiêu chí này (đã có điểm số sử dụng)');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader title="Quản lý Tiêu chí Đánh giá Rubric" />

        <main className="flex-1 p-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tiêu chí Đánh giá Thực tập (Rubric)</h1>
              <p className="text-sm text-gray-500 mt-1">
                Cấu hình các tiêu chuẩn và thang điểm chi tiết cho Doanh nghiệp và Giảng viên hướng dẫn.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchCriteria}
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
                <span>Thêm tiêu chí</span>
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

          {/* Chọn Đợt & Tabs Loại phiếu */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-gray-600 whitespace-nowrap">Đợt thực tập:</span>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#8093FF] focus:outline-none"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex rounded-xl bg-gray-100 p-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSelectedFormType('ENTERPRISE')}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition flex-1 sm:flex-initial ${
                  selectedFormType === 'ENTERPRISE'
                    ? 'bg-white text-[#8093FF] shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Phiếu Doanh nghiệp (40%)
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormType('SUPERVISOR')}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition flex-1 sm:flex-initial ${
                  selectedFormType === 'SUPERVISOR'
                    ? 'bg-white text-[#8093FF] shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Phiếu Giảng viên (60%)
              </button>
            </div>
          </div>

          {/* Bảng danh sách tiêu chí */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="h-9 w-9 border-4 border-[#8093FF] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm font-semibold text-gray-500">Đang tải danh sách tiêu chí...</p>
              </div>
            ) : criteria.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <ScaleIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-base font-semibold text-gray-600">Chưa có tiêu chí nào cho đợt này</p>
                <p className="text-xs text-gray-400 mt-1">Bấm &quot;Thêm tiêu chí&quot; để xây dựng bộ Rubric đánh giá.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-[#FAFBFD]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      Mã & Tên tiêu chí
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      Nhóm tiêu chí
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      Mô tả chi tiết
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                      Trọng số
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {criteria.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-[#8093FF] font-mono">
                            {c.code}
                          </span>
                          <span className="text-sm font-bold text-gray-900">{c.name}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                            c.category === 'ENTERPRISE'
                              ? 'bg-blue-50 text-blue-700'
                              : c.category === 'PROCESS'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {c.category === 'ENTERPRISE'
                            ? 'Doanh nghiệp'
                            : c.category === 'PROCESS'
                            ? 'Quá trình thực tập'
                            : 'Báo cáo tổng kết'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-600 max-w-md">
                        <p className="line-clamp-2">{c.description || 'Không có mô tả'}</p>
                      </td>

                      <td className="px-6 py-4 text-center whitespace-nowrap font-mono font-bold text-xs text-gray-700">
                        {parseFloat(c.weight).toFixed(2)}
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            title="Sửa tiêu chí"
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            title="Xóa tiêu chí"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
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

      {/* Modal Thêm/Sửa tiêu chí */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCrit ? 'Chỉnh sửa Tiêu chí Rubric' : 'Thêm Tiêu chí Rubric mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mã tiêu chí *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="VD: TC-DN01"
                className="w-full rounded-xl border border-gray-200 p-2 text-xs font-mono uppercase focus:border-[#8093FF] focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Tên tiêu chí *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Kỷ luật & Chuyên cần..."
                className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:border-[#8093FF] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nhóm danh mục *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:border-[#8093FF] focus:outline-none bg-white"
              >
                {selectedFormType === 'ENTERPRISE' ? (
                  <option value="ENTERPRISE">Doanh nghiệp (ENTERPRISE)</option>
                ) : (
                  <>
                    <option value="PROCESS">Quá trình (PROCESS)</option>
                    <option value="REPORT">Báo cáo (REPORT)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Trọng số</label>
              <input
                type="number"
                step="0.05"
                min="0"
                required
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 1.0 })}
                className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:border-[#8093FF] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Mô tả hướng dẫn chấm</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="VD: Tuân thủ thời gian làm việc, tác phong công sở, tinh thần trách nhiệm..."
              className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:border-[#8093FF] focus:outline-none"
            />
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
              {submitting ? 'Đang lưu...' : editingCrit ? 'Cập nhật' : 'Tạo tiêu chí'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
