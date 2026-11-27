// frontend/app/admin/result/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  TableCellsIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  LockClosedIcon,
  MegaphoneIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api-client';
import { InternshipProfile, PaginatedResponse } from '@/types/api';

interface ResultRow {
  profile: InternshipProfile;
  enterpriseScore: string | null;
  supervisorProcessScore: string | null;
  supervisorReportScore: string | null;
  calculatedTotalScore: string | null;
  adjustedTotalScore: string | null;
  totalScore: string | null;
  finalizedAt: string | null;
  publishedAt: string | null;
  hasResult: boolean;
}

export default function ResultSummaryPage() {
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal điều chỉnh điểm
  const [adjustTarget, setAdjustTarget] = useState<ResultRow | null>(null);
  const [newScore, setNewScore] = useState<number>(8.0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjusting, setAdjusting] = useState<boolean>(false);

  // State thao tác finalize / publish
  const [actionProfileId, setActionProfileId] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Lấy danh sách toàn bộ hồ sơ thực tập
      const profilesRes = await apiClient.get<PaginatedResponse<InternshipProfile>>(
        '/internships/profiles',
        { page: 1, limit: 100 },
      );
      const profiles = profilesRes.items || [];

      // 2. Lấy kết quả điểm tương ứng cho từng profile (nếu có)
      const rowPromises = profiles.map(async (profile) => {
        try {
          const res = await apiClient.get<{
            enterpriseScore: string | null;
            supervisorProcessScore: string | null;
            supervisorReportScore: string | null;
            calculatedTotalScore: string | null;
            adjustedTotalScore: string | null;
            totalScore: string;
            finalizedAt: string | null;
            publishedAt: string | null;
          }>(`/evaluations/results/${profile.id}`);

          return {
            profile,
            enterpriseScore: res.enterpriseScore,
            supervisorProcessScore: res.supervisorProcessScore,
            supervisorReportScore: res.supervisorReportScore,
            calculatedTotalScore: res.calculatedTotalScore,
            adjustedTotalScore: res.adjustedTotalScore,
            totalScore: res.totalScore,
            finalizedAt: res.finalizedAt,
            publishedAt: res.publishedAt,
            hasResult: true,
          };
        } catch {
          // Chưa có kết quả hoặc chưa hoàn thành đánh giá
          return {
            profile,
            enterpriseScore: null,
            supervisorProcessScore: null,
            supervisorReportScore: null,
            calculatedTotalScore: null,
            adjustedTotalScore: null,
            totalScore: null,
            finalizedAt: null,
            publishedAt: null,
            hasResult: false,
          };
        }
      });

      const loadedRows = await Promise.all(rowPromises);
      setRows(loadedRows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải bảng kết quả thực tập');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const name = r.profile.student?.fullName?.toLowerCase() || '';
      const email = r.profile.student?.email?.toLowerCase() || '';
      const company = r.profile.enterprise?.name?.toLowerCase() || '';
      const title = (r.profile.position || r.profile.title || '').toLowerCase();
      return name.includes(q) || email.includes(q) || company.includes(q) || title.includes(q);
    });
  }, [rows, search]);

  const handleOpenAdjustModal = (row: ResultRow) => {
    setAdjustTarget(row);
    setNewScore(row.totalScore ? parseFloat(row.totalScore) : 8.0);
    setAdjustReason('');
  };

  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    if (!adjustReason.trim()) {
      alert('Vui lòng nhập lý do điều chỉnh điểm');
      return;
    }

    try {
      setAdjusting(true);
      await apiClient.patch(`/evaluations/results/${adjustTarget.profile.id}/adjustment`, {
        score: Number(newScore),
        reason: adjustReason.trim(),
      });

      setSuccessMsg(
        `Đã điều chỉnh điểm của sinh viên ${adjustTarget.profile.student?.fullName || ''} thành ${newScore}`,
      );
      setAdjustTarget(null);
      await fetchResults();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Điều chỉnh điểm thất bại');
    } finally {
      setAdjusting(false);
    }
  };

  const handleFinalize = async (profileId: string) => {
    const confirm = window.confirm(
      'Bạn có chắc chắn muốn chốt điểm cho hồ sơ này? Sau khi chốt điểm, điểm số sẽ được cố định.',
    );
    if (!confirm) return;

    try {
      setActionProfileId(profileId);
      await apiClient.post(`/evaluations/results/${profileId}/finalize`);
      setSuccessMsg('Đã chốt điểm (Finalize) thành công!');
      await fetchResults();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Chốt điểm thất bại');
    } finally {
      setActionProfileId(null);
    }
  };

  const handlePublish = async (profileId: string) => {
    const confirm = window.confirm(
      'Bạn có chắc chắn muốn công bố điểm cho sinh viên này? Sinh viên sẽ xem được kết quả chính thức.',
    );
    if (!confirm) return;

    try {
      setActionProfileId(profileId);
      await apiClient.post(`/evaluations/results/${profileId}/publish`);
      setSuccessMsg('Đã công bố điểm cho sinh viên thành công!');
      await fetchResults();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Công bố điểm thất bại');
    } finally {
      setActionProfileId(null);
    }
  };

  const handleExportCSV = () => {
    if (rows.length === 0) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    const headers = [
      'STT',
      'Họ và tên',
      'Email',
      'Doanh nghiệp',
      'Vị trí thực tập',
      'Điểm DN (30%)',
      'Điểm QT GVHD (20%)',
      'Điểm BC GVHD (50%)',
      'Điểm tổng kết',
      'Điểm điều chỉnh',
      'Trạng thái chốt',
      'Trạng thái công bố',
    ];

    const csvRows = rows.map((r, i) => [
      i + 1,
      `"${r.profile.student?.fullName || ''}"`,
      `"${r.profile.student?.email || ''}"`,
      `"${r.profile.enterprise?.name || ''}"`,
      `"${r.profile.position || r.profile.title || ''}"`,
      r.enterpriseScore || 'Chưa chấm',
      r.supervisorProcessScore || 'Chưa chấm',
      r.supervisorReportScore || 'Chưa chấm',
      r.totalScore || 'Chưa có',
      r.adjustedTotalScore || '',
      r.finalizedAt ? 'Đã chốt' : 'Chưa chốt',
      r.publishedAt ? 'Đã công bố' : 'Chưa công bố',
    ]);

    const csvContent = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bang_Tong_Hop_Ket_Qua_Thuc_Tap_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Tổng hợp kết quả & Điểm thực tập" />

        <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
          {/* Header & Công cụ */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Tổng hợp kết quả thực tập</h1>
              <p className="mt-1 text-sm text-gray-500">
                Theo dõi điểm đánh giá từ Doanh nghiệp, GVHD, điều chỉnh và công bố điểm chính thức
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchResults}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs"
              >
                <ArrowPathIcon
                  className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`}
                />
                <span>Làm mới</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                <TableCellsIcon className="h-4 w-4" />
                <span>Xuất file CSV báo cáo</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 border border-red-200">
              <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 border border-emerald-200">
              <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
              <p>{successMsg}</p>
            </div>
          )}

          {/* Bảng dữ liệu */}
          <div className="rounded-[2rem] border border-gray-100 bg-white shadow-xs overflow-hidden">
            {/* Thanh tìm kiếm */}
            <div className="border-b border-gray-100 p-6 bg-white">
              <div className="relative w-full max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-11 pr-4 text-sm text-gray-900 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF]"
                  placeholder="Tìm kiếm theo Tên sinh viên, Email, Doanh nghiệp..."
                />
              </div>
            </div>

            {loading ? (
              <div className="p-16 text-center">
                <div className="h-8 w-8 border-4 border-[#8093FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">
                  Đang tổng hợp kết quả thực tập...
                </p>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="p-16 text-center text-gray-500 text-sm">
                Không tìm thấy hồ sơ thực tập nào phù hợp.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50/80 text-xs font-bold uppercase text-gray-700 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Sinh viên</th>
                      <th className="px-6 py-4">Doanh nghiệp</th>
                      <th className="px-4 py-4 text-center">Điểm DN (40%)</th>
                      <th className="px-4 py-4 text-center">Điểm QT (30%)</th>
                      <th className="px-4 py-4 text-center">Điểm BC (30%)</th>
                      <th className="px-4 py-4 text-center text-[#8093FF]">Tổng kết</th>
                      <th className="px-6 py-4 text-center">Trạng thái</th>
                      <th className="px-6 py-4 text-right">Thao tác Cán bộ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredRows.map((r) => {
                      const isActing = actionProfileId === r.profile.id;
                      const hasResult = r.hasResult && r.totalScore !== null;
                      const isFinalized = Boolean(r.finalizedAt);
                      const isPublished = Boolean(r.publishedAt);

                      return (
                        <tr key={r.profile.id} className="hover:bg-gray-50/50 transition">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">
                              {r.profile.student?.fullName || 'Sinh viên'}
                            </p>
                            <p className="text-xs text-gray-400">{r.profile.student?.email}</p>
                          </td>

                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-800 text-xs">
                              {r.profile.enterprise?.name || 'Tự liên hệ'}
                            </p>
                            <p className="text-[11px] text-[#8093FF]">
                              {r.profile.position || r.profile.title}
                            </p>
                          </td>

                          <td className="px-4 py-4 text-center font-bold text-gray-800">
                            {r.enterpriseScore !== null ? (
                              <span className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-100">
                                {r.enterpriseScore}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-xs">--</span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-center font-bold text-gray-800">
                            {r.supervisorProcessScore !== null ? (
                              <span className="bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-lg border border-indigo-100">
                                {r.supervisorProcessScore}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-xs">--</span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-center font-bold text-gray-800">
                            {r.supervisorReportScore !== null ? (
                              <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-100">
                                {r.supervisorReportScore}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-xs">--</span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-center">
                            {r.totalScore !== null ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="text-base font-extrabold text-[#8093FF]">
                                  {r.adjustedTotalScore || r.totalScore}
                                </span>
                                {r.adjustedTotalScore && (
                                  <span className="text-[10px] text-amber-600 font-semibold">
                                    (Gốc: {r.calculatedTotalScore || r.totalScore})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Chưa đủ điểm</span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-center">
                            {isPublished ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                <CheckCircleIcon className="w-3.5 h-3.5" /> Đã công bố
                              </span>
                            ) : isFinalized ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                                <LockClosedIcon className="w-3.5 h-3.5" /> Đã chốt điểm
                              </span>
                            ) : hasResult ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                                Chờ duyệt điểm
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                                Đang thực tập
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Nút điều chỉnh điểm */}
                              {hasResult && !isFinalized && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAdjustModal(r)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                                  title="Điều chỉnh điểm"
                                >
                                  <PencilSquareIcon className="w-3.5 h-3.5 text-gray-500" />
                                  <span>Sửa điểm</span>
                                </button>
                              )}

                              {/* Nút chốt điểm (Finalize) */}
                              {hasResult && !isFinalized && (
                                <button
                                  type="button"
                                  disabled={isActing}
                                  onClick={() => handleFinalize(r.profile.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
                                  title="Khóa chốt điểm"
                                >
                                  <LockClosedIcon className="w-3.5 h-3.5" />
                                  <span>Chốt</span>
                                </button>
                              )}

                              {/* Nút công bố điểm (Publish) */}
                              {isFinalized && !isPublished && (
                                <button
                                  type="button"
                                  disabled={isActing}
                                  onClick={() => handlePublish(r.profile.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#8093FF] text-white text-xs font-bold hover:opacity-90 transition disabled:opacity-50 shadow-xs"
                                  title="Công bố điểm cho sinh viên xem"
                                >
                                  <MegaphoneIcon className="w-3.5 h-3.5" />
                                  <span>Công bố</span>
                                </button>
                              )}

                              {isPublished && (
                                <span className="text-xs text-gray-400 italic">Hoàn tất</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal điều chỉnh điểm */}
          <Modal
            isOpen={!!adjustTarget}
            onClose={() => setAdjustTarget(null)}
            title={`Điều chỉnh điểm: ${adjustTarget?.profile.student?.fullName || ''}`}
            maxWidth="md"
          >
            {adjustTarget && (
              <form onSubmit={handleConfirmAdjust} className="space-y-4">
                <p className="text-xs text-gray-500">
                  Điểm tính toán hiện tại:{' '}
                  <strong>{adjustTarget.calculatedTotalScore || adjustTarget.totalScore}</strong>.
                  Mọi thao tác điều chỉnh điểm đều được hệ thống lưu vào lịch sử audit log.
                </p>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Điểm tổng kết mới (Thang điểm 10) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    value={newScore}
                    onChange={(e) => setNewScore(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-[#8093FF] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Lý do điều chỉnh điểm <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="VD: Hội đồng phúc khảo xem xét lại sản phẩm thực tập / Cộng điểm giải thưởng..."
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs focus:border-[#8093FF] focus:outline-none resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setAdjustTarget(null)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={adjusting}
                    className="px-5 py-2 rounded-xl bg-[#8093FF] text-white text-xs font-bold hover:opacity-90 transition disabled:opacity-50"
                  >
                    {adjusting ? 'Đang lưu...' : 'Lưu điều chỉnh'}
                  </button>
                </div>
              </form>
            )}
          </Modal>
        </main>
      </div>
    </div>
  );
}
