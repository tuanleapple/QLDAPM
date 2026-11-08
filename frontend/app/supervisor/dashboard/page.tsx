// frontend/app/supervisor/dashboard/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  BuildingOfficeIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api-client';
import {
  InternshipProfile,
  PaginatedResponse,
  ProgressComment,
  ProgressUpdate,
} from '@/types/api';

export default function SupervisorDashboard() {
  const [profiles, setProfiles] = useState<InternshipProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal state
  const [selectedProfile, setSelectedProfile] = useState<InternshipProfile | null>(null);
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [comments, setComments] = useState<ProgressComment[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // New comment state
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  const fetchAssignedProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<PaginatedResponse<InternshipProfile>>('/internships/profiles', {
        page: 1,
        limit: 50,
      });
      setProfiles(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignedProfiles();
  }, [fetchAssignedProfiles]);

  const handleOpenProgressModal = async (p: InternshipProfile) => {
    setSelectedProfile(p);
    setNewComment('');
    setCommentSuccess(false);
    try {
      setLoadingDetails(true);
      const [upRes, comRes] = await Promise.all([
        apiClient.get<PaginatedResponse<ProgressUpdate>>(`/progress/profiles/${p.id}/updates`, { page: 1, limit: 50 }),
        apiClient.get<PaginatedResponse<ProgressComment>>(`/progress/profiles/${p.id}/comments`, { page: 1, limit: 50 }),
      ]);
      setUpdates(upRes.items || []);
      setComments(comRes.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await apiClient.post(`/progress/profiles/${selectedProfile.id}/comments`, {
        content: newComment.trim(),
      });
      setNewComment('');
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 3000);

      // Refresh comments list
      const comRes = await apiClient.get<PaginatedResponse<ProgressComment>>(
        `/progress/profiles/${selectedProfile.id}/comments`,
        { page: 1, limit: 50 },
      );
      setComments(comRes.items || []);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể gửi nhận xét');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Bảng điều khiển Giảng viên hướng dẫn" />

        <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Danh sách sinh viên hướng dẫn</h1>
              <p className="mt-1 text-sm text-gray-500">
                Theo dõi quá trình thực tập, đọc báo cáo tiến độ định kỳ và gửi nhận xét đánh giá cho sinh viên.
              </p>
            </div>
            <button
              onClick={fetchAssignedProfiles}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-xs transition"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Làm mới</span>
            </button>
          </div>

          {/* Grid danh sách sinh viên */}
          {loading ? (
            <div className="rounded-3xl bg-white p-12 text-center border border-gray-100">
              <div className="h-8 w-8 border-4 border-[#8093FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Đang tải danh sách sinh viên...</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center">
              <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-base font-bold text-gray-800">Chưa có sinh viên nào được phân công</p>
              <p className="text-xs text-gray-400 mt-1">
                Khi Cán bộ giáo vụ phê duyệt hồ sơ và chọn tên bạn, sinh viên sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-[#8093FF]">
                          {p.student?.fullName?.charAt(0) || p.student?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">
                            {p.student?.fullName || p.student?.email}
                          </h3>
                          <p className="text-xs text-gray-400">{p.student?.email}</p>
                        </div>
                      </div>
                      <Badge status={p.status} />
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-3 text-xs space-y-1 text-gray-600">
                      <p className="flex items-center gap-1.5 font-bold text-gray-800">
                        <BuildingOfficeIcon className="w-4 h-4 text-[#8093FF]" />
                        <span>{p.enterprise?.name || 'Tự liên hệ'}</span>
                      </p>
                      <p className="text-[#8093FF] font-semibold">{p.position || p.title}</p>
                    </div>

                    {p.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 italic">
                        &ldquo;{p.description}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleOpenProgressModal(p)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#8093FF] text-white text-xs font-bold hover:opacity-90 shadow-xs transition"
                    >
                      <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      <span>Xem tiến độ & Nhận xét</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal xem chi tiết tiến độ & gửi nhận xét */}
          <Modal
            isOpen={!!selectedProfile}
            onClose={() => setSelectedProfile(null)}
            title={`Tiến độ thực tập: ${selectedProfile?.student?.fullName || selectedProfile?.student?.email}`}
            maxWidth="2xl"
          >
            <div className="space-y-6">
              {/* Thông tin nhanh */}
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-gray-900">{selectedProfile?.position || selectedProfile?.title}</p>
                  <p className="text-gray-500">{selectedProfile?.enterprise?.name || 'Cơ quan thực tập'}</p>
                </div>
                <Badge status={selectedProfile?.status} />
              </div>

              {loadingDetails ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  <div className="h-6 w-6 border-2 border-[#8093FF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Đang tải dữ liệu tiến độ...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Danh sách các lần nộp tiến độ của sinh viên */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-[#8093FF]" />
                      <span>Các mốc nhật ký của sinh viên ({updates.length})</span>
                    </h4>

                    {updates.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-gray-50 text-center text-xs text-gray-400">
                        Sinh viên chưa gửi bản ghi tiến độ nào.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {updates.map((u) => (
                          <div key={u.id} className="p-4 rounded-2xl border border-gray-200 bg-white space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[#8093FF]">{u.reportPeriod}</span>
                              <span className="text-gray-400">{new Date(u.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                            <div className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl">
                              <strong className="text-gray-900 block mb-0.5">Công việc:</strong>
                              <p className="whitespace-pre-line">{u.work}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-emerald-50/50 p-2 rounded-xl text-emerald-800">
                                <strong>Kết quả:</strong> {u.outcome}
                              </div>
                              <div className="bg-amber-50/50 p-2 rounded-xl text-amber-800">
                                <strong>Khó khăn:</strong> {u.difficulties || 'Không có'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lịch sử nhận xét của Giảng viên */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Nhận xét đã gửi ({comments.length})</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {comments.map((c) => (
                        <div key={c.id} className="p-3 rounded-xl bg-slate-50 text-xs border border-slate-100">
                          <div className="flex items-center justify-between text-gray-400 text-[11px] mb-1">
                            <span className="font-semibold text-gray-700">{c.author?.fullName || c.author?.email}</span>
                            <span>{new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <p className="text-gray-800">{c.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Form gửi nhận xét mới */}
                  <form onSubmit={handleSendComment} className="pt-4 border-t border-gray-100 space-y-3">
                    <label className="block text-xs font-bold text-gray-700 uppercase">
                      Thêm nhận xét / Hướng dẫn mới cho sinh viên
                    </label>
                    <textarea
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Nhập nội dung góp ý về tiến độ, tài liệu cần nghiên cứu, lời khuyên..."
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-xs focus:border-[#8093FF] focus:outline-none resize-none"
                      required
                    />

                    {commentSuccess && (
                      <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircleIcon className="w-4 h-4" />
                        Đã gửi nhận xét thành công!
                      </p>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingComment || !newComment.trim()}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#8093FF] text-white text-xs font-bold hover:opacity-90 transition disabled:opacity-50 shadow-xs"
                      >
                        <PaperAirplaneIcon className="w-3.5 h-3.5" />
                        <span>{submittingComment ? 'Đang gửi...' : 'Gửi nhận xét'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </Modal>
        </main>
      </div>
    </div>
  );
}
