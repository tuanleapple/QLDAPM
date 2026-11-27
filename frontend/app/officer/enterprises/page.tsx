// frontend/app/officer/enterprises/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api-client';
import { Enterprise, PaginatedResponse } from '@/types/api';

export default function OfficerEnterprisesPage() {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEnterprise, setEditingEnterprise] = useState<Enterprise | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactPhone: '',
    website: '',
  });

  const fetchEnterprises = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<PaginatedResponse<Enterprise>>('/internships/enterprises', {
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
      });
      setEnterprises(res.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách doanh nghiệp');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEnterprises();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchEnterprises]);

  const handleOpenCreate = () => {
    setEditingEnterprise(null);
    setFormData({
      name: '',
      address: '',
      contactPhone: '',
      website: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ent: Enterprise) => {
    setEditingEnterprise(ent);
    setFormData({
      name: ent.name,
      address: ent.address || '',
      contactPhone: ent.contactPhone || '',
      website: ent.website || '',
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
        address: formData.address.trim() || undefined,
        phone: formData.contactPhone.trim() || undefined,
        website: formData.website.trim() || undefined,
      };

      if (editingEnterprise) {
        await apiClient.patch(`/internships/enterprises/${editingEnterprise.id}`, payload);
        setSuccessMsg('Đã cập nhật thông tin doanh nghiệp!');
      } else {
        await apiClient.post('/internships/enterprises', payload);
        setSuccessMsg('Đã thêm doanh nghiệp đối tác mới!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchEnterprises();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu doanh nghiệp (có thể bị trùng tên)');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa doanh nghiệp "${name}"?`)) return;
    try {
      setError(null);
      await apiClient.delete(`/internships/enterprises/${id}`);
      setSuccessMsg('Đã xóa doanh nghiệp thành công!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchEnterprises();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể xóa (doanh nghiệp đã có sinh viên thực tập)');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader title="Quản lý Doanh nghiệp Đối tác" />

        <main className="flex-1 p-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Danh mục Doanh nghiệp Thực tập</h1>
              <p className="text-sm text-gray-500 mt-1">
                Quản lý các công ty tiếp nhận sinh viên thực tập trong kỳ học.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchEnterprises}
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
                <span>Thêm doanh nghiệp</span>
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

          {/* Search Bar */}
          <div className="mb-6 flex items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm w-full md:w-96">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên công ty..."
              className="w-full text-sm outline-none bg-transparent"
            />
          </div>

          {/* Bảng danh sách doanh nghiệp */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="h-9 w-9 border-4 border-[#8093FF] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm font-semibold text-gray-500">Đang tải danh sách doanh nghiệp...</p>
              </div>
            ) : enterprises.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-base font-semibold text-gray-600">Không tìm thấy doanh nghiệp nào</p>
                <p className="text-xs text-gray-400 mt-1">Bấm &quot;Thêm doanh nghiệp&quot; để tạo đối tác mới.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-[#FAFBFD]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      Tên Doanh nghiệp
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      Địa chỉ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      Liên hệ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      Website
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {enterprises.map((ent) => (
                    <tr key={ent.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-[#8093FF]">
                            <BuildingOfficeIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{ent.name}</p>
                            <p className="text-xs text-gray-400 font-mono">ID: {ent.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-600 max-w-xs">
                        {ent.address ? (
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span className="line-clamp-2">{ent.address}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Chưa cập nhật</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-600">
                        {ent.contactPhone ? (
                          <span className="flex items-center gap-1 font-mono">
                            <PhoneIcon className="h-3.5 w-3.5 text-gray-400" />
                            {ent.contactPhone}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">--</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-600">
                        {ent.website ? (
                          <a
                            href={ent.website.startsWith('http') ? ent.website : `https://${ent.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#8093FF] hover:underline"
                          >
                            <GlobeAltIcon className="h-3.5 w-3.5" />
                            <span className="line-clamp-1">{ent.website}</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 italic">--</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(ent)}
                            title="Chỉnh sửa"
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ent.id, ent.name)}
                            title="Xóa doanh nghiệp"
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

      {/* Modal Thêm/Sửa doanh nghiệp */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEnterprise ? 'Chỉnh sửa Doanh nghiệp' : 'Thêm Doanh nghiệp đối tác'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tên công ty / Doanh nghiệp *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Tập đoàn FPT, VNG Corporation..."
              className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#8093FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ trụ sở</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="VD: Tòa nhà FPT, Khu Công nghệ cao, TP. Thủ Đức"
              className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#8093FF] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="VD: 028 7300 5588"
                className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:border-[#8093FF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Website</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="VD: https://fpt.com"
                className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:border-[#8093FF] focus:outline-none"
              />
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
              {submitting ? 'Đang lưu...' : editingEnterprise ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
