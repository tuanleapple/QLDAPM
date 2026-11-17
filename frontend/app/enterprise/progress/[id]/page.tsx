// frontend/app/enterprise/progress/[id]/page.tsx
'use client';

import React, { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ChatBubbleBottomCenterTextIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import {
  InternshipProfile,
  PaginatedResponse,
  ProgressComment,
  ProgressUpdate,
  ReportVersion,
} from '@/types/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EnterpriseProgressPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const profileId = resolvedParams.id;

  const [profile, setProfile] = useState<InternshipProfile | null>(null);
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [comments, setComments] = useState<ProgressComment[]>([]);
  const [reports, setReports] = useState<ReportVersion[]>([]);
  const [loading, setLoading] = useState(true);

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [profRes, upRes, comRes, repRes] = await Promise.all([
        apiClient.get<InternshipProfile>(`/internships/profiles/${profileId}`),
        apiClient.get<PaginatedResponse<ProgressUpdate>>(`/progress/profiles/${profileId}/updates`, {
          page: 1,
          limit: 50,
        }),
        apiClient.get<PaginatedResponse<ProgressComment>>(`/progress/profiles/${profileId}/comments`, {
          page: 1,
          limit: 50,
        }),
        apiClient.get<PaginatedResponse<ReportVersion>>(`/reports/profiles/${profileId}/versions`, {
          page: 1,
          limit: 10,
        }),
      ]);

      setProfile(profRes);
      setUpdates(upRes.items || []);
      setComments(comRes.items || []);
      setReports(repRes.items || []);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi tải thông tin tiến độ');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await apiClient.post(`/progress/profiles/${profileId}/comments`, {
        content: newComment.trim(),
      });
      setNewComment('');
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 3000);

      // Refresh comments
      const comRes = await apiClient.get<PaginatedResponse<ProgressComment>>(
        `/progress/profiles/${profileId}/comments`,
        { page: 1, limit: 50 },
      );
      setComments(comRes.items || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi nhận xét';
      setErrorMsg(msg);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader title="Chi tiết Tiến độ Sinh viên" />

        <main className="flex-1 p-8">
          {/* Header & Back button */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/enterprise/dashboard"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition hover:text-[#8093FF] border border-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Tiến độ: {profile?.student?.fullName || 'Sinh viên'}
                </h1>
                <p className="text-sm text-gray-500">
                  MSSV: <span className="font-mono font-semibold text-[#8093FF]">{profile?.student?.studentCode || 'N/A'}</span> • Vị trí: {profile?.position || 'Thực tập sinh'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {profile && <Badge status={profile.status} />}
              <Link
                href={`/enterprise/evaluate/${profileId}`}
                className="flex items-center gap-2 rounded-xl bg-[#8093FF] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-100 hover:opacity-90 transition"
              >
                <ClipboardDocumentCheckIcon className="h-4 w-4" />
                <span>Chấm điểm DN</span>
              </Link>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 border border-red-100">
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-9 w-9 border-4 border-[#8093FF] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-semibold text-gray-500">Đang tải nhật ký tiến độ...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* CỘT TRÁI (2/3): NHẬT KÝ TIẾN ĐỘ & BÁO CÁO */}
              <div className="space-y-6 lg:col-span-2">
                {/* Danh sách các lần báo cáo tiến độ tuần */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CalendarDaysIcon className="h-5 w-5 text-[#8093FF]" />
                    <span>Nhật ký báo cáo định kỳ ({updates.length})</span>
                  </h2>

                  {updates.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      <ClockIcon className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                      <p className="text-sm font-medium text-gray-500">Sinh viên chưa cập nhật nhật ký tiến độ nào.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {updates.map((u, idx) => (
                        <div key={u.id || idx} className="rounded-xl border border-gray-100 bg-slate-50/50 p-5">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                            <span className="font-bold text-[#8093FF] text-sm">
                              {u.reportPeriod || `Báo cáo đợt ${idx + 1}`}
                            </span>
                            <span className="text-xs text-gray-400">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : ''}
                            </span>
                          </div>

                          <div className="space-y-3 text-sm">
                            <div>
                              <p className="font-semibold text-gray-700 flex items-center gap-1.5 mb-1">
                                <ClipboardDocumentListIcon className="h-4 w-4 text-indigo-500" />
                                Công việc đã thực hiện:
                              </p>
                              <p className="text-gray-600 bg-white p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">
                                {u.work || 'Không có mô tả'}
                              </p>
                            </div>

                            <div>
                              <p className="font-semibold text-gray-700 flex items-center gap-1.5 mb-1">
                                <ChartBarIcon className="h-4 w-4 text-emerald-500" />
                                Kết quả đạt được:
                              </p>
                              <p className="text-gray-600 bg-white p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">
                                {u.outcome || 'Không có mô tả'}
                              </p>
                            </div>

                            {u.difficulties && (
                              <div>
                                <p className="font-semibold text-rose-700 flex items-center gap-1.5 mb-1">
                                  <ExclamationTriangleIcon className="h-4 w-4 text-rose-500" />
                                  Khó khăn & Đề xuất:
                                </p>
                                <p className="text-gray-600 bg-white p-3 rounded-lg border border-rose-100 whitespace-pre-wrap">
                                  {u.difficulties}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Danh sách các phiên bản báo cáo cuối kỳ */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5 text-indigo-500" />
                    <span>Báo cáo thực tập cuối kỳ ({reports.length})</span>
                  </h2>

                  {reports.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Sinh viên chưa nộp báo cáo tổng kết cuối kỳ.</p>
                  ) : (
                    <div className="space-y-3">
                      {reports.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between rounded-xl border border-gray-100 bg-slate-50/50 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-[#8093FF]">
                              <DocumentTextIcon className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {r.originalName} <span className="text-xs text-[#8093FF]">(v{r.version})</span>
                              </p>
                              <p className="text-xs text-gray-400">
                                Nộp lúc: {new Date(r.submittedAt).toLocaleString('vi-VN')} • {(r.sizeBytes / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          {r.isLate && (
                            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                              Nộp trễ hạn
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* CỘT PHẢI (1/3): NHẬN XÉT CỦA DOANH NGHIỆP */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-[#8093FF]" />
                    <span>Góp ý & Nhận xét</span>
                  </h2>

                  {/* Form gửi nhận xét */}
                  <form onSubmit={handleSendComment} className="mb-6">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Gửi phản hồi cho sinh viên:
                    </label>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                      placeholder="Nhận xét về thái độ, tiến độ hoặc kết quả công việc trong tuần..."
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition"
                    />
                    <div className="mt-2 flex items-center justify-between">
                      {commentSuccess && (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircleIcon className="h-4 w-4" />
                          Đã gửi nhận xét thành công!
                        </span>
                      )}
                      <button
                        type="submit"
                        disabled={submittingComment || !newComment.trim()}
                        className="ml-auto flex items-center gap-1.5 rounded-xl bg-[#8093FF] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-100 hover:opacity-90 disabled:opacity-50 transition"
                      >
                        <PaperAirplaneIcon className="h-4 w-4" />
                        <span>{submittingComment ? 'Đang gửi...' : 'Gửi nhận xét'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Danh sách nhận xét trước đó */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lịch sử nhận xét ({comments.length})</p>
                    {comments.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Chưa có nhận xét nào cho hồ sơ này.</p>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-xs">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-gray-800 flex items-center gap-1">
                              <UserCircleIcon className="h-4 w-4 text-gray-400" />
                              {c.author?.fullName || 'Người nhận xét'}
                            </span>
                            <span className="text-gray-400">
                              {c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : ''}
                            </span>
                          </div>
                          <p className="text-gray-600 whitespace-pre-wrap">{c.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
