// frontend/app/officer/users/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  UsersIcon,
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  LockClosedIcon,
  LockOpenIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api-client';
import { Enterprise, PaginatedResponse, User, UserRole } from '@/types/api';

export default function OfficerUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'STUDENT' as UserRole,
    studentCode: '',
    enterpriseId: '',
    department: '',
  });

  // Tải danh mục doanh nghiệp cho dropdown
  useEffect(() => {
    async function loadEnterprises() {
      try {
        const res = await apiClient.get<PaginatedResponse<Enterprise>>('/internships/enterprises', {
          page: 1,
          limit: 100,
        });
        setEnterprises(res.items || []);
      } catch {
        // Ignore
      }
    }
    loadEnterprises();
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<PaginatedResponse<User>>('/users', {
        page: 1,
        limit: 50,
        role: filterRole !== 'ALL' ? filterRole : undefined,
        search: search.trim() || undefined,
      });
      setUsers(res.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  }, [filterRole, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleOpenCreate = () => {
    setFormData({
      email: '',
      password: 'TemporaryPassword123!',
      fullName: '',
      role: 'STUDENT',
      studentCode: '',
      enterpriseId: enterprises[0]?.id || '',
      department: 'Khoa Khoa học & Kỹ thuật Máy tính',
    });
    setIsModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const payload: Record<string, unknown> = {
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        role: formData.role,
      };

      if (formData.role === 'STUDENT') {
        payload.studentCode = formData.studentCode.trim().toUpperCase();
      } else if (formData.role === 'ENTERPRISE_REP') {
        payload.enterpriseId = formData.enterpriseId;
      } else if (formData.role === 'SUPERVISOR') {
        payload.department = formData.department.trim();
      }

      await apiClient.post('/users', payload);
      setSuccessMsg(`Đã tạo tài khoản ${formData.role} thành công!`);
      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo tài khoản');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLock = async (u: User) => {
    const isLocked = u.status === 'LOCKED';
    const action = isLocked ? 'unlock' : 'lock';
    const actionName = isLocked ? 'Mở khóa' : 'Khóa';

    if (!window.confirm(`Bạn có chắc muốn ${actionName} tài khoản "${u.email}"?`)) return;

    try {
      setError(null);
      await apiClient.patch(`/users/${u.id}/${action}`);
      setSuccessMsg(`Đã ${actionName.toLowerCase()} tài khoản thành công!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Không thể ${actionName.toLowerCase()} tài khoản`);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'OFFICER':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700">
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            Cán bộ Khoa
          </span>
        );
      case 'SUPERVISOR':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
            <AcademicCapIcon className="h-3.5 w-3.5" />
            Giảng viên HD
          </span>
        );
      case 'ENTERPRISE_REP':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
            <BuildingOfficeIcon className="h-3.5 w-3.5" />
            Doanh nghiệp
          </span>
        );
      case 'STUDENT':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-[#8093FF]">
            <UserGroupIcon className="h-3.5 w-3.5" />
            Sinh viên
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader title="Quản lý Tài khoản & Phân quyền" />

        <main className="flex-1 p-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản trị Người dùng & Tài khoản</h1>
              <p className="text-sm text-gray-500 mt-1">
                Tạo mới, phân quyền và khóa/mở khóa tài khoản cho Sinh viên, Giảng viên và Doanh nghiệp.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchUsers}
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
                <span>Cấp tài khoản mới</span>
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

          {/* Bộ lọc vai trò & Tìm kiếm */}
          <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="relative w-full md:w-80">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm email, họ tên..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm focus:border-[#8093FF] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold text-gray-600">Vai trò:</span>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#8093FF] focus:outline-none"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="STUDENT">Sinh viên (STUDENT)</option>
                <option value="SUPERVISOR">Giảng viên (SUPERVISOR)</option>
                <option value="ENTERPRISE_REP">Doanh nghiệp (ENTERPRISE_REP)</option>
                <option value="OFFICER">Cán bộ Khoa (OFFICER)</option>
              </select>
            </div>
          </div>

          {/* Bảng danh sách người dùng */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="h-9 w-9 border-4 border-[#8093FF] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm font-semibold text-gray-500">Đang tải danh sách người dùng...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-base font-semibold text-gray-600">Không tìm thấy tài khoản nào</p>
                <p className="text-xs text-gray-400 mt-1">Thử thay đổi từ khóa hoặc bộ lọc vai trò.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-[#FAFBFD]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      Người dùng / Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      Họ và tên
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      Vai trò hệ thống
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
                  {users.map((u) => {
                    const isLocked = u.status === 'LOCKED';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 font-bold text-[#8093FF]">
                              {u.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{u.email}</p>
                              {u.studentCode && (
                                <p className="text-xs text-indigo-600 font-mono font-semibold">MSSV: {u.studentCode}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                          {u.fullName || '--'}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(u.role)}</td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {isLocked ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700">
                              <LockClosedIcon className="h-3.5 w-3.5" />
                              Đã khóa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                              Hoạt động
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleToggleLock(u)}
                            className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold border transition ${
                              isLocked
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                            }`}
                          >
                            {isLocked ? (
                              <>
                                <LockOpenIcon className="h-3.5 w-3.5" />
                                <span>Mở khóa</span>
                              </>
                            ) : (
                              <>
                                <LockClosedIcon className="h-3.5 w-3.5" />
                                <span>Khóa TK</span>
                              </>
                            )}
                          </button>
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

      {/* Modal Tạo tài khoản mới */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cấp Tài khoản Người dùng Mới">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Vai trò tài khoản *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#8093FF] focus:outline-none bg-white font-semibold"
            >
              <option value="STUDENT">Sinh viên (STUDENT)</option>
              <option value="SUPERVISOR">Giảng viên hướng dẫn (SUPERVISOR)</option>
              <option value="ENTERPRISE_REP">Đại diện Doanh nghiệp (ENTERPRISE_REP)</option>
              <option value="OFFICER">Cán bộ Quản lý Khoa (OFFICER)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email đăng nhập *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="VD: user@example.test"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#8093FF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Họ và tên *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="VD: Nguyễn Văn A"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#8093FF] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Mật khẩu khởi tạo (tối thiểu 12 ký tự) *</label>
            <input
              type="text"
              required
              minLength={12}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-sm font-mono focus:border-[#8093FF] focus:outline-none"
            />
          </div>

          {/* Trường mở rộng theo vai trò */}
          {formData.role === 'STUDENT' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mã số Sinh viên (MSSV) *</label>
              <input
                type="text"
                required
                value={formData.studentCode}
                onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                placeholder="VD: 2210001"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm font-mono uppercase focus:border-[#8093FF] focus:outline-none"
              />
            </div>
          )}

          {formData.role === 'ENTERPRISE_REP' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Doanh nghiệp trực thuộc *</label>
              <select
                required
                value={formData.enterpriseId}
                onChange={(e) => setFormData({ ...formData, enterpriseId: e.target.value })}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#8093FF] focus:outline-none bg-white"
              >
                {enterprises.map((ent) => (
                  <option key={ent.id} value={ent.id}>
                    {ent.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.role === 'SUPERVISOR' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Bộ môn / Khoa</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="VD: Khoa Khoa học & Kỹ thuật Máy tính"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#8093FF] focus:outline-none"
              />
            </div>
          )}

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
              {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
