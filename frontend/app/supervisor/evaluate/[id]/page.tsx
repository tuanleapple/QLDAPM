'use client';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import {
  ArrowLeftIcon,
  UserCircleIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  BookmarkSquareIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

import { apiClient } from '@/lib/api-client';

import {
  Criterion,
  EvaluationForm,
  InternshipProfile,
  PaginatedResponse,
  ReportVersion,
} from '@/types/api';

function SupervisorEvaluationContent() {
  const params = useParams();
  const profileId = (params?.id as string) || '';

  const [profile, setProfile] = useState<InternshipProfile | null>(null);
  const [reports, setReports] = useState<ReportVersion[]>([]);
  const [form, setForm] = useState<EvaluationForm | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  // State lưu điểm và nhận xét cho từng criterion
  const [scores, setScores] = useState<Record<string, { score: number; comment: string }>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    if (!profileId) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Lấy thông tin hồ sơ sinh viên
      const profRes = await apiClient.get<InternshipProfile>(`/internships/profiles/${profileId}`);
      setProfile(profRes);

      // 2. Lấy danh sách báo cáo sinh viên đã nộp
      const reportsRes = await apiClient.get<PaginatedResponse<ReportVersion>>(
        `/reports/profiles/${profileId}/versions`,
        {
          page: 1,
          limit: 10,
        },
      );

      const reportList = reportsRes.items || [];
      setReports(reportList);

      // 3. Khởi tạo hoặc lấy Form đánh giá của Giảng viên hướng dẫn
      const formRes = await apiClient.post<EvaluationForm>(
        `/evaluations/profiles/${profileId}/forms/SUPERVISOR`,
      );
      setForm(formRes);

      // 4. Lấy danh sách tiêu chí đánh giá của kỳ thực tập
      const critRes = await apiClient.get<PaginatedResponse<Criterion>>(
        `/evaluations/periods/${profRes.periodId}/criteria`,
        { formType: 'SUPERVISOR', limit: 50 },
      );

      const critList = critRes.items || [];
      setCriteria(critList);

      // Điền sẵn điểm từ form details nếu đã lưu nháp trước đó
      const initialScores: Record<string, { score: number; comment: string }> = {};

      critList.forEach((c) => {
        const found = formRes.details?.find(
          (d) => (d.criterionId || (d as unknown as { criteriaId: string }).criteriaId) === c.id,
        );

        initialScores[c.id] = {
          score: found ? Number(found.score) : 0,
          comment: found?.comment || '',
        };
      });

      setScores(initialScores);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải thông tin đánh giá';

      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleScoreChange = (criteriaId: string, val: number) => {
    setScores((prev) => ({
      ...prev,
      [criteriaId]: {
        score: Math.min(10, Math.max(0, val)),
        comment: prev[criteriaId]?.comment || '',
      },
    }));
  };

  const handleCommentChange = (criteriaId: string, text: string) => {
    setScores((prev) => ({
      ...prev,
      [criteriaId]: {
        score: prev[criteriaId]?.score || 0,
        comment: text,
      },
    }));
  };

  const latestReport = reports[0] || null;

  // Tải báo cáo thực tập
  const handleDownload = async () => {
    if (!latestReport) return;

    try {
      setDownloading(true);
      setError(null);
      setSuccessMsg(null);

      await apiClient.download(`/reports/${latestReport.id}/download`, latestReport.originalName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải file báo cáo';

      setError(msg);
    } finally {
      setDownloading(false);
    }
  };

  const buildPayload = () => {
    const details = Object.entries(scores).map(([criteriaId, val]) => ({
      criteriaId,
      score: Number(val.score),
      comment: val.comment ? val.comment.trim() : undefined,
    }));

    return {
      details,
      reportId: form?.reportId || latestReport?.id || undefined,
    };
  };

  const handleSaveDraft = async () => {
    if (!form) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const payload = buildPayload();

      const updated = await apiClient.patch<EvaluationForm>(
        `/evaluations/forms/${form.id}`,
        payload,
      );

      setForm(updated);
      setSuccessMsg('Đã lưu bản nháp điểm đánh giá thành công!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lưu bản nháp thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!form) return;

    if (criteria.length === 0) {
      setError('Không có tiêu chí đánh giá cho đợt thực tập này');
      return;
    }

    if (!latestReport) {
      setError('Sinh viên chưa nộp tài liệu báo cáo thực tập cuối kỳ, không thể nộp chính thức');
      return;
    }

    const confirmSubmit = window.confirm(
      'Bạn có chắc chắn muốn nộp điểm chính thức? Sau khi nộp, phiếu đánh giá sẽ bị khóa và không thể chỉnh sửa.',
    );

    if (!confirmSubmit) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);

      const payload = buildPayload();

      const submitted = await apiClient.post<EvaluationForm>(
        `/evaluations/forms/${form.id}/submit`,
        payload,
      );

      setForm(submitted);
      setSuccessMsg('Đã nộp điểm đánh giá chính thức thành công!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Nộp điểm thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormLocked = form?.status === 'SUBMITTED';

  // Phân chia tiêu chí thành 2 nhóm: Quá trình (PROCESS) và Báo cáo (REPORT)
  const processCriteria = criteria.filter((c) => c.category === 'PROCESS');

  const reportCriteria = criteria.filter((c) => c.category === 'REPORT');

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/supervisor/dashboard"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-gray-500 shadow-xs hover:text-[#8093FF] hover:bg-gray-50 transition border border-gray-100"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>

            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">
                Phiếu đánh giá kết quả thực tập
              </h1>

              <p className="text-sm text-gray-500 mt-0.5">
                Đánh giá quá trình và báo cáo thực tập theo tiêu chí Rubric
              </p>
            </div>
          </div>

          <div>
            {isFormLocked ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-800">
                <CheckCircleIcon className="w-4 h-4" />
                Đã nộp điểm chính thức (Đã khóa)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-2 text-xs font-bold text-amber-800">
                <BookmarkSquareIcon className="w-4 h-4" />
                Bản nháp (Chưa nộp)
              </span>
            )}
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

        {loading ? (
          <div className="rounded-3xl bg-white p-12 text-center border border-gray-100 shadow-xs">
            <div className="h-8 w-8 border-4 border-[#8093FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">Đang tải biểu mẫu đánh giá...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* CỘT TRÁI: Thông tin sinh viên & File báo cáo */}
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-gray-100 bg-white p-7 shadow-xs">
                <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-gray-900">
                  <UserCircleIcon className="h-6 w-6 text-[#8093FF]" />
                  Thông tin sinh viên
                </h2>

                <div className="space-y-3.5 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Họ và tên
                    </p>

                    <p className="font-bold text-gray-900 text-base mt-0.5">
                      {profile?.student?.fullName || 'Sinh viên'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Email
                    </p>

                    <p className="font-medium text-gray-700 mt-0.5">{profile?.student?.email}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Doanh nghiệp thực tập
                    </p>

                    <p className="font-semibold text-gray-900 mt-0.5">
                      {profile?.enterprise?.name || 'Tự liên hệ'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Vị trí / Đề tài
                    </p>

                    <p className="font-medium text-[#8093FF] mt-0.5">
                      {profile?.position || profile?.title}
                    </p>
                  </div>

                  <hr className="border-gray-100 my-4" />

                  {/* Tài liệu báo cáo của sinh viên */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Tài liệu báo cáo cuối kỳ
                    </p>

                    {latestReport ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
                          <DocumentTextIcon className="w-7 h-7 text-emerald-600 flex-shrink-0" />

                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-gray-900 truncate">
                              {latestReport.originalName}
                            </p>

                            <p className="text-[11px] text-gray-400">
                              Phiên bản {latestReport.version} •{' '}
                              {new Date(latestReport.submittedAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleDownload}
                          disabled={downloading}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#8093FF] bg-[#F0F2FF] py-2.5 text-xs font-bold text-[#8093FF] transition hover:bg-[#E6EAFB] disabled:opacity-50"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                          {downloading ? 'Đang tải xuống...' : 'Tải xuống báo cáo'}
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                        Sinh viên chưa nộp tài liệu báo cáo thực tập nào.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: Form chấm điểm theo bộ tiêu chí Rubric */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-xs">
                <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    <ClipboardDocumentCheckIcon className="h-6 w-6 text-[#8093FF]" />
                    Chấm điểm theo tiêu chí (Thang điểm 10)
                  </h2>
                </div>

                {criteria.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-gray-50 text-gray-500 text-sm">
                    Kỳ thực tập này chưa được thiết lập bộ tiêu chí đánh giá GVHD.
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Nhóm 1: Tiêu chí Quá trình */}
                    {processCriteria.length > 0 && (
                      <div>
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#8093FF] mb-4 bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100">
                          1. Tiêu chí Đánh giá Quá trình thực tập (Trọng số 50%)
                        </h3>

                        <div className="space-y-5">
                          {processCriteria.map((c) => (
                            <div
                              key={c.id}
                              className="p-4 rounded-2xl border border-gray-200 bg-white space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                  <label className="text-sm font-bold text-gray-900">
                                    {c.name} ({c.code})
                                  </label>

                                  {c.description && (
                                    <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                  <span className="text-xs font-semibold text-gray-500">
                                    Điểm (0-10):
                                  </span>

                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    disabled={isFormLocked}
                                    value={scores[c.id]?.score ?? 0}
                                    onChange={(e) =>
                                      handleScoreChange(c.id, parseFloat(e.target.value) || 0)
                                    }
                                    className="w-24 rounded-xl border border-gray-300 px-3 py-2 text-center text-sm font-bold text-gray-900 focus:border-[#8093FF] focus:outline-none disabled:bg-gray-100"
                                  />
                                </div>
                              </div>

                              <input
                                type="text"
                                disabled={isFormLocked}
                                value={scores[c.id]?.comment ?? ''}
                                onChange={(e) => handleCommentChange(c.id, e.target.value)}
                                placeholder="Ghi chú / Nhận xét tiêu chí này (tùy chọn)..."
                                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs text-gray-700 focus:border-[#8093FF] focus:outline-none disabled:bg-gray-100"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nhóm 2: Tiêu chí Báo cáo */}
                    {reportCriteria.length > 0 && (
                      <div>
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-700 mb-4 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                          2. Tiêu chí Đánh giá Báo cáo thực tập cuối kỳ (Trọng số 50%)
                        </h3>

                        <div className="space-y-5">
                          {reportCriteria.map((c) => (
                            <div
                              key={c.id}
                              className="p-4 rounded-2xl border border-gray-200 bg-white space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                  <label className="text-sm font-bold text-gray-900">
                                    {c.name} ({c.code})
                                  </label>

                                  {c.description && (
                                    <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                  <span className="text-xs font-semibold text-gray-500">
                                    Điểm (0-10):
                                  </span>

                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    disabled={isFormLocked}
                                    value={scores[c.id]?.score ?? 0}
                                    onChange={(e) =>
                                      handleScoreChange(c.id, parseFloat(e.target.value) || 0)
                                    }
                                    className="w-24 rounded-xl border border-gray-300 px-3 py-2 text-center text-sm font-bold text-gray-900 focus:border-[#8093FF] focus:outline-none disabled:bg-gray-100"
                                  />
                                </div>
                              </div>

                              <input
                                type="text"
                                disabled={isFormLocked}
                                value={scores[c.id]?.comment ?? ''}
                                onChange={(e) => handleCommentChange(c.id, e.target.value)}
                                placeholder="Ghi chú / Nhận xét tiêu chí này (tùy chọn)..."
                                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs text-gray-700 focus:border-[#8093FF] focus:outline-none disabled:bg-gray-100"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nút lưu nháp & Nộp chính thức */}
                    {!isFormLocked && (
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
                          className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white bg-[#8093FF] hover:opacity-90 shadow-md shadow-indigo-100 transition disabled:opacity-50"
                        >
                          <PaperAirplaneIcon className="w-4 h-4" />
                          <span>{submitting ? 'Đang nộp...' : 'Nộp điểm chính thức'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SupervisorEvaluationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] p-12 text-center">
          <div className="h-8 w-8 border-4 border-[#8093FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">Đang tải biểu mẫu đánh giá...</p>
        </div>
      }
    >
      <SupervisorEvaluationContent />
    </Suspense>
  );
}
