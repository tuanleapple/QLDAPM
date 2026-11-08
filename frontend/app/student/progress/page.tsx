// frontend/app/student/progress/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api-client';
import { InternshipProfile, PaginatedResponse, ProgressComment, ProgressUpdate } from '@/types/api';

export default function StudentProgressPage() {
  const [profile, setProfile] = useState<InternshipProfile | null>(null);
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [comments, setComments] = useState<ProgressComment[]>([]);
  const [loading, setLoading] = useState(true);

  // New update modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('');
  const [work, setWork] = useState('');
  const [outcome, setOutcome] = useState('');
  const [difficulties, setDifficulties] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profRes = await apiClient.get<PaginatedResponse<InternshipProfile>>('/internships/profiles', {
        page: 1,
        limit: 5,
      });

      if (profRes.items?.length > 0) {
        const myProfile = profRes.items[0];
        setProfile(myProfile);

        const upRes = await apiClient.get<PaginatedResponse<ProgressUpdate>>(
          `/progress/profiles/${myProfile.id}/updates`,
          { page: 1, limit: 50 },
        );
        setUpdates(upRes.items || []);

        const comRes = await apiClient.get<PaginatedResponse<ProgressComment>>(
          `/progress/profiles/${myProfile.id}/comments`,
          { page: 1, limit: 50 },
        );
        setComments(comRes.items || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải nhật ký tiến độ';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!reportPeriod.trim() || !work.trim() || !outcome.trim() || !difficulties.trim()) {
      setError('Vui lòng điền đầy đủ cả 4 thông tin: Đợt báo cáo, Công việc, Kết quả và Khó khăn');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await apiClient.post(`/progress/profiles/${profile.id}/updates`, {
        reportPeriod: reportPeriod.trim(),
        work: work.trim(),
        outcome: outcome.trim(),
        difficulties: difficulties.trim(),
      });

      setSuccess('Đã gửi báo cáo tiến độ thành công!');
      setIsModalOpen(false);
      setReportPeriod('');
      setWork('');
      setOutcome('');
      setDifficulties('');
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gửi tiến độ thất bại';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmitProgress = profile && ['APPROVED', 'REPORT_SUBMITTED'].includes(profile.status);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Nhật ký tiến độ" />

        <main className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full">
          {/* Top navigation & action */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Link
                href="/student/dashboard"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition mb-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Về Bảng điều khiển
              </Link>
              <h1 className="text-3xl font-extrabold text-gray-900">Sổ nhật ký tiến độ thực tập</h1>
              <p className="mt-1 text-sm text-gray-500">
                Ghi chép định kỳ công việc thực tế, kết quả và phản hồi từ Giảng viên hướng dẫn.
              </p>
            </div>

            {canSubmitProgress && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-[#8093FF] px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-100 hover:opacity-90 transition flex-shrink-0"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Báo cáo tiến độ mới</span>
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-800 border border-rose-100">
              <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 text-rose-600 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800 border border-emerald-100">
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-emerald-600 mt-0.5" />
              <p>{success}</p>
            </div>
          )}

          {!canSubmitProgress && profile && (
            <div className="mb-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 border border-amber-200">
              Hồ sơ của bạn đang ở trạng thái <strong>{profile.status}</strong>. Chức năng nộp tiến độ chỉ mở sau khi hồ sơ đã được Cán bộ phê duyệt (APPROVED).
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl bg-white p-12 text-center border border-gray-100">
              <div className="h-8 w-8 border-4 border-[#8093FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Đang tải nhật ký...</p>
            </div>
          ) : !profile ? (
            <div className="rounded-2xl bg-white p-12 text-center border border-gray-100">
              <p className="text-gray-500">Bạn chưa có hồ sơ thực tập nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Danh sách các lần báo cáo tiến độ */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Các mốc tiến độ đã ghi nhận ({updates.length})</h3>

                {updates.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
                    <ClockIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-700">Chưa có bản ghi tiến độ nào</p>
                    <p className="text-xs text-gray-400 mt-1">Bấm nút &ldquo;Báo cáo tiến độ mới&rdquo; để gửi bản cập nhật đầu tiên.</p>
                  </div>
                ) : (
                  updates.map((item, idx) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-black text-[#8093FF]">
                            #{updates.length - idx}
                          </span>
                          <h4 className="text-base font-bold text-gray-900">{item.reportPeriod}</h4>
                        </div>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>

                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                          Công việc đã làm
                        </span>
                        <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3 rounded-xl whitespace-pre-line">
                          {item.work}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div>
                          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                            Kết quả đạt được
                          </span>
                          <p className="text-xs text-gray-700 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100 whitespace-pre-line">
                            {item.outcome}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                            Khó khăn / Vướng mắc
                          </span>
                          <p className="text-xs text-gray-700 bg-amber-50/40 p-3 rounded-xl border border-amber-100 whitespace-pre-line">
                            {item.difficulties || 'Không có'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Khung nhận xét từ Giảng viên / Cán bộ */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-[#8093FF]" />
                  <span>Ý kiến Giảng viên ({comments.length})</span>
                </h3>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-400">
                      Chưa có nhận xét nào từ Giảng viên hướng dẫn.
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-900">
                            {c.author?.fullName || c.author?.email || 'Giảng viên hướng dẫn'}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal nộp tiến độ mới */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Báo cáo tiến độ thực tập định kỳ"
            maxWidth="xl"
          >
            <form onSubmit={handleCreateUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Đợt / Giai đoạn báo cáo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  placeholder="VD: Tuần 1 - Tìm hiểu dự án & Framework NestJS"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Chi tiết công việc đã thực hiện <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={work}
                  onChange={(e) => setWork(e.target.value)}
                  placeholder="Mô tả cụ thể các module, tính năng, tài liệu đã làm..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Kết quả đạt được <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder="Sản phẩm hoàn thành, pull request đã merge, kiến thức nắm bắt..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Khó khăn & Kiến nghị <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={difficulties}
                  onChange={(e) => setDifficulties(e.target.value)}
                  placeholder="Ghi rõ vướng mắc kỹ thuật hoặc ghi 'Không có khó khăn' nếu tiến độ thuận lợi"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] resize-none"
                  required
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#8093FF] hover:opacity-90 shadow-md shadow-indigo-100 transition disabled:opacity-50"
                >
                  {submitting ? 'Đang gửi...' : 'Nộp báo cáo'}
                </button>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}
