'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  EyeIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { apiClient } from '@/lib/api-client';

type ProfileStatus =
  'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION' | 'REPORT_SUBMITTED';

interface ProfileStudent {
  userId: string;
  fullName: string;
  studentCode: string;
  major?: string | null;
}

interface ProfileEnterprise {
  id: string;
  name: string;
}

interface ProfileSupervisor {
  userId: string;
  fullName: string;
  department?: string | null;
}

interface InternshipProfile {
  id: string;
  studentId: string;
  periodId: string;
  enterpriseId?: string | null;
  supervisorId?: string | null;
  title: string;
  position?: string | null;
  status: ProfileStatus;
  student: ProfileStudent;
  enterprise?: ProfileEnterprise | null;
  supervisor?: ProfileSupervisor | null;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ProgressUpdate {
  id: string;
  profileId: string;
  reportPeriod: string;
  work: string;
  outcome: string;
  difficulties: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ProgressComment {
  id: string;
  profileId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileProgress {
  profile: InternshipProfile;
  updates: ProgressUpdate[];
}

const formatDateTime = (value: string) => {
  if (!value) return '--';

  return new Date(value).toLocaleString('vi-VN');
};

const statusLabels: Record<ProfileStatus, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  NEEDS_REVISION: 'Cần bổ sung',
  REPORT_SUBMITTED: 'Đã nộp báo cáo',
};

const statusStyles: Record<ProfileStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  NEEDS_REVISION: 'bg-amber-100 text-amber-700',
  REPORT_SUBMITTED: 'bg-purple-100 text-purple-700',
};

export default function ProgressTrackingPage() {
  const [profiles, setProfiles] = useState<InternshipProfile[]>([]);
  const [progressData, setProgressData] = useState<ProfileProgress[]>([]);

  const [totalProfiles, setTotalProfiles] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedProfile, setSelectedProfile] = useState<InternshipProfile | null>(null);

  const [selectedUpdates, setSelectedUpdates] = useState<ProgressUpdate[]>([]);
  const [comments, setComments] = useState<ProgressComment[]>([]);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [commentInput, setCommentInput] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [commentError, setCommentError] = useState('');

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search) query.set('search', search);
      if (statusFilter) query.set('status', statusFilter);

      const response = await apiClient.get<PaginatedResponse<InternshipProfile>>(
        `/internships/profiles?${query.toString()}`,
      );

      const profileItems = response.items ?? [];

      setProfiles(profileItems);
      setTotalProfiles(response.total ?? 0);
      setTotalPages(response.totalPages || 1);

      // Lấy báo cáo tiến độ của từng hồ sơ trong trang hiện tại.
      const results = await Promise.all(
        profileItems.map(async (profile) => {
          try {
            const progressResponse = await apiClient.get<PaginatedResponse<ProgressUpdate>>(
              `/progress/profiles/${profile.id}/updates?page=1&limit=100`,
            );

            return {
              profile,
              updates: progressResponse.items ?? [],
            };
          } catch {
            return {
              profile,
              updates: [],
            };
          }
        }),
      );

      setProgressData(results);
    } catch (err) {
      console.error('Không thể tải danh sách hồ sơ:', err);
      setError('Không thể tải dữ liệu tiến độ. Vui lòng thử lại.');
      setProfiles([]);
      setProgressData([]);
      setTotalProfiles(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleOpenDetail = async (profile: InternshipProfile) => {
    setSelectedProfile(profile);
    setSelectedUpdates([]);
    setComments([]);
    setCommentInput('');
    setDetailError('');
    setCommentError('');
    setDetailLoading(true);

    try {
      const [progressResponse, commentResponse] = await Promise.all([
        apiClient.get<PaginatedResponse<ProgressUpdate>>(
          `/progress/profiles/${profile.id}/updates?page=1&limit=100`,
        ),
        apiClient.get<PaginatedResponse<ProgressComment>>(
          `/progress/profiles/${profile.id}/comments?page=1&limit=100`,
        ),
      ]);

      setSelectedUpdates(progressResponse.items ?? []);
      setComments(commentResponse.items ?? []);
    } catch (err) {
      console.error('Không thể tải chi tiết tiến độ:', err);
      setDetailError('Không thể tải báo cáo hoặc nhận xét. Vui lòng thử lại.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!selectedProfile || !commentInput.trim()) return;

    try {
      setSendingComment(true);
      setCommentError('');

      const newComment = await apiClient.post<ProgressComment>(
        `/progress/profiles/${selectedProfile.id}/comments`,
        {
          content: commentInput.trim(),
        },
      );

      setComments((previous) => [newComment, ...previous]);
      setCommentInput('');
    } catch (err) {
      console.error('Không thể gửi nhận xét:', err);
      setCommentError(
        'Gửi nhận xét thất bại. Có thể hồ sơ đã bị khóa hoặc không còn quyền nhận xét.',
      );
    } finally {
      setSendingComment(false);
    }
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const profilesWithReports = progressData.filter((item) => item.updates.length > 0).length;

  const profilesWithoutReports = progressData.length - profilesWithReports;

  const totalUpdates = progressData.reduce((total, item) => total + item.updates.length, 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar />

      <div className="min-w-0 flex-1">
        <AppHeader />

        <main className="p-5 md:p-8">
          {/* Page heading */}
          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Theo dõi tiến độ thực tập</h1>
              <p className="mt-1 text-sm text-gray-500">
                Quản lý và theo dõi báo cáo tiến độ của sinh viên.
              </p>
            </div>

            <button
              onClick={fetchProfiles}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>

          {/* Statistics */}
          <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Tổng hồ sơ thực tập"
              value={totalProfiles}
              description="Theo kết quả tìm kiếm và bộ lọc"
              icon={<UserGroupIcon className="h-6 w-6" />}
              color="blue"
            />

            <StatCard
              title="Hồ sơ có báo cáo"
              value={profilesWithReports}
              description="Trong trang hiện tại"
              icon={<DocumentTextIcon className="h-6 w-6" />}
              color="green"
            />

            <StatCard
              title="Hồ sơ chưa có báo cáo"
              value={profilesWithoutReports}
              description="Trong trang hiện tại"
              icon={<ClipboardDocumentListIcon className="h-6 w-6" />}
              color="amber"
            />

            <StatCard
              title="Tổng báo cáo tiến độ"
              value={totalUpdates}
              description="Trong trang hiện tại"
              icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />}
              color="purple"
            />
          </div>

          {/* Main content */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Danh sách sinh viên</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Chọn một sinh viên để xem báo cáo và nhận xét tiến độ.
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Tìm theo tên hoặc mã sinh viên..."
                      className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    Tìm kiếm
                  </button>
                </form>

                <select
                  value={statusFilter}
                  onChange={(event) => handleStatusChange(event.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500"
                >
                  <option value="">Tất cả trạng thái hồ sơ</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="REPORT_SUBMITTED">Đã nộp báo cáo</option>
                  <option value="SUBMITTED">Chờ duyệt</option>
                  <option value="NEEDS_REVISION">Cần bổ sung</option>
                  <option value="REJECTED">Từ chối</option>
                </select>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
                <button onClick={fetchProfiles} className="ml-2 font-semibold underline">
                  Thử lại
                </button>
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                <p className="mt-3 text-sm text-gray-500">Đang tải dữ liệu...</p>
              </div>
            ) : profiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ClipboardDocumentListIcon className="h-12 w-12 text-gray-300" />
                <p className="mt-3 font-medium text-gray-700">Không tìm thấy hồ sơ nào</p>
                <p className="mt-1 text-sm text-gray-400">Thử thay đổi từ khóa hoặc bộ lọc.</p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-5 py-4 font-semibold">Sinh viên</th>
                        <th className="px-5 py-4 font-semibold">Doanh nghiệp</th>
                        <th className="px-5 py-4 font-semibold">Giảng viên hướng dẫn</th>
                        <th className="px-5 py-4 text-center font-semibold">Số báo cáo</th>
                        <th className="px-5 py-4 text-center font-semibold">Trạng thái hồ sơ</th>
                        <th className="px-5 py-4 text-center font-semibold">Thao tác</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {profiles.map((profile) => {
                        const progress = progressData.find(
                          (item) => item.profile.id === profile.id,
                        );

                        const reportCount = progress?.updates.length ?? 0;

                        return (
                          <tr key={profile.id} className="transition hover:bg-gray-50">
                            <td className="px-5 py-4">
                              <p className="font-medium text-gray-800">
                                {profile.student?.fullName ?? 'Chưa cập nhật'}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {profile.student?.studentCode ?? '--'}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-sm text-gray-700">
                                {profile.enterprise?.name ?? 'Chưa có'}
                              </p>
                              <p className="mt-1 text-xs text-gray-400">
                                {profile.position || profile.title}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-sm text-gray-700">
                                {profile.supervisor?.fullName ?? 'Chưa phân công'}
                              </p>
                              {profile.supervisor?.department && (
                                <p className="mt-1 text-xs text-gray-400">
                                  {profile.supervisor.department}
                                </p>
                              )}
                            </td>

                            <td className="px-5 py-4 text-center">
                              <span
                                className={`inline-flex min-w-9 items-center justify-center rounded-full px-3 py-1 text-sm font-semibold ${
                                  reportCount > 0
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {reportCount}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                  statusStyles[profile.status]
                                }`}
                              >
                                {statusLabels[profile.status]}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center">
                              <button
                                onClick={() => handleOpenDetail(profile)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                              >
                                <EyeIcon className="h-4 w-4" />
                                Chi tiết
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row">
                  <p className="text-sm text-gray-500">
                    Tổng cộng <strong>{totalProfiles}</strong> hồ sơ
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((previous) => previous - 1)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>

                    <span className="px-2 text-sm text-gray-600">
                      Trang {page} / {totalPages}
                    </span>

                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((previous) => previous + 1)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* =========================
          Progress detail modal
      ========================= */}
      {selectedProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedProfile(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-gray-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Chi tiết tiến độ thực tập</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedProfile.student?.fullName} - {selectedProfile.student?.studentCode}
                </p>
              </div>

              <button
                onClick={() => setSelectedProfile(null)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal content */}
            <div className="overflow-y-auto p-5">
              {/* Student information */}
              <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
                <InfoItem label="Sinh viên" value={selectedProfile.student?.fullName} />
                <InfoItem label="Mã sinh viên" value={selectedProfile.student?.studentCode} />
                <InfoItem label="Doanh nghiệp" value={selectedProfile.enterprise?.name} />
                <InfoItem
                  label="Giảng viên hướng dẫn"
                  value={selectedProfile.supervisor?.fullName}
                />
                <InfoItem
                  label="Vị trí thực tập"
                  value={selectedProfile.position || selectedProfile.title}
                />
                <InfoItem label="Trạng thái hồ sơ" value={statusLabels[selectedProfile.status]} />
              </div>

              {detailError && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {detailError}
                </div>
              )}

              {detailLoading ? (
                <div className="flex flex-col items-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                  <p className="mt-3 text-sm text-gray-500">Đang tải báo cáo...</p>
                </div>
              ) : (
                <>
                  {/* Progress reports */}
                  <section>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">Báo cáo tiến độ</h3>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        {selectedUpdates.length} báo cáo
                      </span>
                    </div>

                    {selectedUpdates.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center">
                        <DocumentTextIcon className="mx-auto h-9 w-9 text-gray-300" />
                        <p className="mt-2 text-sm text-gray-500">
                          Sinh viên chưa có báo cáo tiến độ.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedUpdates.map((update) => (
                          <div key={update.id} className="rounded-xl border border-gray-200 p-4">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                              <h4 className="font-semibold text-blue-700">{update.reportPeriod}</h4>
                              <span className="text-xs text-gray-400">
                                Nộp lúc: {formatDateTime(update.createdAt)}
                              </span>
                            </div>

                            <div className="space-y-3">
                              <ReportSection title="Công việc đã thực hiện" content={update.work} />
                              <ReportSection title="Kết quả đạt được" content={update.outcome} />
                              <ReportSection
                                title="Khó khăn gặp phải"
                                content={update.difficulties || 'Không có'}
                              />
                            </div>

                            {update.updatedAt !== update.createdAt && (
                              <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
                                Cập nhật lần cuối: {formatDateTime(update.updatedAt)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Comments */}
                  <section className="mt-8 border-t border-gray-100 pt-6">
                    <h3 className="mb-4 font-semibold text-gray-800">Nhận xét và đánh giá</h3>

                    {comments.length === 0 ? (
                      <p className="mb-4 rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
                        Chưa có nhận xét nào.
                      </p>
                    ) : (
                      <div className="mb-5 space-y-3">
                        {comments.map((comment) => (
                          <div key={comment.id} className="rounded-xl bg-gray-50 p-4">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-gray-700">
                                Người nhận xét
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDateTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">
                              {comment.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Thêm nhận xét
                      </label>

                      <textarea
                        value={commentInput}
                        onChange={(event) => setCommentInput(event.target.value)}
                        rows={3}
                        maxLength={10000}
                        placeholder="Nhập nhận xét hoặc góp ý cho sinh viên..."
                        className="w-full resize-y rounded-lg border border-gray-200 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                      <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <p className="text-xs text-gray-400">{commentInput.length}/10000 ký tự</p>

                        <button
                          onClick={handleSendComment}
                          disabled={!commentInput.trim() || sendingComment}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <PaperAirplaneIcon className="h-4 w-4" />
                          {sendingComment ? 'Đang gửi...' : 'Gửi nhận xét'}
                        </button>
                      </div>

                      {commentError && <p className="mt-2 text-sm text-red-600">{commentError}</p>}
                    </div>
                  </section>
                </>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex justify-end border-t border-gray-100 p-4">
              <button
                onClick={() => setSelectedProfile(null)}
                className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================
// Reusable components
// =========================

function StatCard({
  title,
  value,
  description,
  icon,
  color,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'amber' | 'purple';
}) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-800">{value}</p>
          <p className="mt-2 text-xs text-gray-400">{description}</p>
        </div>

        <div className={`rounded-xl p-3 ${colorStyles[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-700">{value || 'Chưa cập nhật'}</p>
    </div>
  );
}

function ReportSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-gray-700">{title}</p>
      <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">
        {content || 'Không có nội dung'}
      </p>
    </div>
  );
}
