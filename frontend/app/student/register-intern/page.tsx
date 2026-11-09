// frontend/app/student/register-intern/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PaperAirplaneIcon,
  BookmarkSquareIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { apiClient } from '@/lib/api-client';
import { Enterprise, InternshipPeriod, InternshipProfile, PaginatedResponse } from '@/types/api';

export default function RegisterInternshipPage() {
  const router = useRouter();

  const [periods, setPeriods] = useState<InternshipPeriod[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [existingProfile, setExistingProfile] = useState<InternshipProfile | null>(null);

  const [periodId, setPeriodId] = useState('');
  const [enterpriseId, setEnterpriseId] = useState('');
  const [position, setPosition] = useState('');
  const [internshipStartAt, setInternshipStartAt] = useState('');
  const [internshipEndAt, setInternshipEndAt] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active periods
      const periodsRes = await apiClient.get<PaginatedResponse<InternshipPeriod>>('/internships/periods', {
        page: 1,
        limit: 20,
      });
      setPeriods(periodsRes.items || []);
      if (periodsRes.items?.length > 0) {
        setPeriodId(periodsRes.items[0].id);
      }

      // Fetch enterprises
      const entRes = await apiClient.get<PaginatedResponse<Enterprise>>('/internships/enterprises', {
        page: 1,
        limit: 50,
      });
      setEnterprises(entRes.items || []);

      // Check current profile
      const profilesRes = await apiClient.get<PaginatedResponse<InternshipProfile>>('/internships/profiles', {
        page: 1,
        limit: 10,
      });
      const myProfiles = profilesRes.items || [];
      if (myProfiles.length > 0) {
        const latest = myProfiles[0];
        setExistingProfile(latest);
        setPeriodId(latest.periodId || '');
        setEnterpriseId(latest.enterpriseId || '');
        setPosition(latest.position || latest.title || '');
        setDescription(latest.description || '');
        if (latest.internshipStartAt) {
          setInternshipStartAt(new Date(latest.internshipStartAt).toISOString().split('T')[0]);
        }
        if (latest.internshipEndAt) {
          setInternshipEndAt(new Date(latest.internshipEndAt).toISOString().split('T')[0]);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu khởi tạo';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const validate = () => {
    if (!periodId) {
      setError('Vui lòng chọn đợt thực tập');
      return false;
    }
    if (!position.trim()) {
      setError('Vui lòng nhập vị trí thực tập / đề tài');
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const baseData: Record<string, unknown> = {
        position: position.trim(),
        title: position.trim(),
      };
      if (enterpriseId && enterpriseId.trim()) {
        baseData.enterpriseId = enterpriseId;
      }
      if (description.trim()) {
        baseData.description = description.trim();
      }
      if (internshipStartAt) {
        baseData.internshipStartAt = internshipStartAt;
      }
      if (internshipEndAt) {
        baseData.internshipEndAt = internshipEndAt;
      }

      let saved: InternshipProfile;
      if (existingProfile?.id) {
        // Cập nhật bản ghi hiện có: KHÔNG gửi kèm periodId vì backend UpdateProfileDto không cho phép đổi kỳ
        saved = await apiClient.patch<InternshipProfile>(`/internships/profiles/${existingProfile.id}`, baseData);
      } else {
        // Tạo mới: gửi kèm periodId bắt buộc
        const createPayload = {
          periodId,
          ...baseData,
        };
        saved = await apiClient.post<InternshipProfile>('/internships/profiles', createPayload);
      }

      setExistingProfile(saved);
      setSuccessMsg('Đã lưu bản nháp thành công! Bạn có thể tiếp tục chỉnh sửa hoặc bấm Nộp hồ sơ.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu bản nháp';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);

      let profileId = existingProfile?.id;
      const baseData: Record<string, unknown> = {
        position: position.trim(),
        title: position.trim(),
      };
      if (enterpriseId && enterpriseId.trim()) {
        baseData.enterpriseId = enterpriseId;
      }
      if (description.trim()) {
        baseData.description = description.trim();
      }
      if (internshipStartAt) {
        baseData.internshipStartAt = internshipStartAt;
      }
      if (internshipEndAt) {
        baseData.internshipEndAt = internshipEndAt;
      }

      if (profileId) {
        await apiClient.patch(`/internships/profiles/${profileId}`, baseData);
      } else {
        const createPayload = {
          periodId,
          ...baseData,
        };
        const created = await apiClient.post<InternshipProfile>('/internships/profiles', createPayload);
        profileId = created.id;
      }

      await apiClient.post(`/internships/profiles/${profileId}/submit`);
      setSuccessMsg('Nộp hồ sơ đăng ký thực tập thành công! Đang chuyển hướng về Bảng điều khiển...');
      setTimeout(() => {
        router.push('/student/dashboard');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nộp hồ sơ thất bại';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isLocked = Boolean(
    existingProfile &&
      ['SUBMITTED', 'APPROVED', 'REJECTED', 'REPORT_SUBMITTED'].includes(existingProfile.status),
  );

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Đăng ký thực tập" />

        <main className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
          <div className="mb-6">
            <Link
              href="/student/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition mb-3"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Quay lại Bảng điều khiển
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900">Đơn đăng ký thực tập tốt nghiệp</h1>
            <p className="mt-1 text-sm text-gray-500">
              Vui lòng điền đầy đủ các thông tin bên dưới để gửi đăng ký nguyện vọng thực tập đến Ban quản lý.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-800 border border-rose-100">
              <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">Không thể xử lý yêu cầu:</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800 border border-emerald-100">
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-emerald-600 mt-0.5" />
              <p>{successMsg}</p>
            </div>
          )}

          {isLocked && (
            <div className="mb-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 border border-amber-200">
              <p className="font-bold">Hồ sơ đã được gửi hoặc đã xét duyệt</p>
              <p>
                Trạng thái hiện tại: <strong>{existingProfile?.status}</strong>. Bạn không thể chỉnh sửa hồ sơ sau khi đã nộp, trừ khi Cán bộ yêu cầu sửa đổi (NEEDS_REVISION).
              </p>
            </div>
          )}

          {loading ? (
            <div className="rounded-3xl bg-white p-12 text-center border border-gray-100 shadow-xs">
              <div className="h-8 w-8 border-4 border-[#8093FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">Đang tải biểu mẫu đăng ký...</p>
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-8 shadow-xs border border-gray-100 space-y-6">
              {/* Chọn Đợt thực tập */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Đợt thực tập <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    disabled={isLocked || periods.length === 0}
                    value={periodId}
                    onChange={(e) => setPeriodId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] disabled:bg-gray-100 disabled:text-gray-900 disabled:opacity-100 disabled:cursor-not-allowed transition"
                  >
                    {periods.length === 0 ? (
                      <option value="">Chưa có đợt thực tập nào mở</option>
                    ) : (
                      periods.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Hạn nộp hồ sơ:{' '}
                          {p.registrationCloseAt ? new Date(p.registrationCloseAt).toLocaleDateString('vi-VN') : 'Không giới hạn'})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Chọn Doanh nghiệp */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Doanh nghiệp tiếp nhận thực tập
                </label>
                <div className="relative">
                  <select
                    disabled={isLocked}
                    value={enterpriseId}
                    onChange={(e) => setEnterpriseId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] disabled:bg-gray-100 disabled:text-gray-900 disabled:opacity-100 disabled:cursor-not-allowed transition"
                  >
                    <option value="">-- Chưa có doanh nghiệp / Tự liên hệ sau --</option>
                    {enterprises.map((ent) => (
                      <option key={ent.id} value={ent.id}>
                        {ent.name} {ent.taxCode ? `(MST: ${ent.taxCode})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vị trí / Đề tài */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Vị trí thực tập / Hướng đề tài <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="VD: Lập trình viên Backend Node.js / React Frontend"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] disabled:bg-gray-100 disabled:text-gray-900 disabled:opacity-100 disabled:cursor-not-allowed transition"
                  required
                />
              </div>

              {/* Thời gian thực tập */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Ngày bắt đầu thực tập
                  </label>
                  <input
                    type="date"
                    disabled={isLocked}
                    value={internshipStartAt}
                    onChange={(e) => setInternshipStartAt(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] disabled:bg-gray-100 disabled:text-gray-900 disabled:opacity-100 disabled:cursor-not-allowed transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Ngày kết thúc dự kiến
                  </label>
                  <input
                    type="date"
                    disabled={isLocked}
                    value={internshipEndAt}
                    onChange={(e) => setInternshipEndAt(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] disabled:bg-gray-100 disabled:text-gray-900 disabled:opacity-100 disabled:cursor-not-allowed transition"
                  />
                </div>
              </div>

              {/* Mô tả công việc / Kế hoạch */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Kế hoạch chi tiết / Mô tả nhiệm vụ
                </label>
                <textarea
                  rows={4}
                  disabled={isLocked}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi chú thêm về mục tiêu thực tập, công nghệ sử dụng, người hướng dẫn tại doanh nghiệp..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] disabled:bg-gray-100 disabled:text-gray-900 disabled:opacity-100 disabled:cursor-not-allowed transition resize-none"
                />
              </div>

              {/* Nút hành động */}
              {!isLocked && (
                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={saving || submitting}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    <BookmarkSquareIcon className="w-4 h-4" />
                    <span>{saving ? 'Đang lưu...' : 'Lưu bản nháp'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving || submitting}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white bg-[#8093FF] hover:opacity-90 shadow-lg shadow-indigo-100 transition disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                    <span>{submitting ? 'Đang gửi...' : 'Nộp hồ sơ chính thức'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
