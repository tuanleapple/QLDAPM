// frontend/app/enterprise/evaluate/[id]/page.tsx
'use client';

import React, { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  BookmarkSquareIcon,
  PaperAirplaneIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api-client';
import {
  Criterion,
  EvaluationForm,
  InternshipProfile,
  PaginatedResponse,
} from '@/types/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EnterpriseEvaluationPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const profileId = resolvedParams.id;

  const [profile, setProfile] = useState<InternshipProfile | null>(null);
  const [form, setForm] = useState<EvaluationForm | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  // State lưu điểm và nhận xét cho từng criterion: { [criteriaId]: { score: number, comment: string } }
  const [scores, setScores] = useState<Record<string, { score: number; comment: string }>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Lấy thông tin hồ sơ sinh viên
      const profRes = await apiClient.get<InternshipProfile>(`/internships/profiles/${profileId}`);
      setProfile(profRes);

      // 2. Khởi tạo hoặc lấy Form đánh giá của Doanh nghiệp
      const formRes = await apiClient.post<EvaluationForm>(
        `/evaluations/profiles/${profileId}/forms/ENTERPRISE`,
      );
      setForm(formRes);

      // 3. Lấy danh sách tiêu chí đánh giá của Doanh nghiệp
      const critRes = await apiClient.get<PaginatedResponse<Criterion>>(
        `/evaluations/periods/${profRes.periodId}/criteria`,
        { formType: 'ENTERPRISE', limit: 50 },
      );
      const critList = critRes.items || [];
      setCriteria(critList);

      // Điền sẵn điểm từ form details (nếu đã lưu nháp hoặc đã nộp trước đó)
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
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải thông tin đánh giá Doanh nghiệp';
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

  const buildPayload = () => {
    const details = Object.entries(scores).map(([criteriaId, val]) => ({
      criteriaId,
      score: Number(val.score),
      comment: val.comment ? val.comment.trim() : undefined,
    }));

    return { details };
  };

  const handleSaveDraft = async () => {
    if (!form) return;
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const payload = buildPayload();
      const updated = await apiClient.patch<EvaluationForm>(`/evaluations/forms/${form.id}`, payload);
      setForm(updated);
      setSuccessMsg('Đã lưu bản nháp điểm đánh giá Doanh nghiệp thành công!');
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

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);

      const payload = buildPayload();
      const submitted = await apiClient.post<EvaluationForm>(`/evaluations/forms/${form.id}/submit`, payload);
      setForm(submitted);
      setShowConfirmModal(false);
      setSuccessMsg('Đã nộp phiếu đánh giá Doanh nghiệp chính thức thành công! Phiếu đã được khóa.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Nộp phiếu đánh giá thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // Tính điểm trung bình của Doanh nghiệp
  const scoreValues = Object.values(scores);
  const avgScore =
    scoreValues.length > 0
      ? (scoreValues.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / scoreValues.length).toFixed(2)
      : '0.00';

  const isLocked = form?.status === 'SUBMITTED';

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader title="Phiếu Đánh giá Thực tập Doanh nghiệp" />

        <main className="flex-1 p-8">
          {/* Header & Back Button */}
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
                  Phiếu Đánh giá Doanh nghiệp (40% Tổng kết)
                </h1>
                <p className="text-sm text-gray-500">
                  Đánh giá năng lực, thái độ chuyên cần và đóng góp thực tế của sinh viên tại đơn vị.
                </p>
              </div>
            </div>

            {/* Trạng thái khóa */}
            <div className="flex items-center gap-3">
              {isLocked ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircleIcon className="h-4 w-4" />
                  ĐÃ NỘP CHÍNH THỨC (ĐÃ KHÓA)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3.5 py-1.5 text-xs font-bold text-amber-800">
                  BẢN NHÁP (ĐANG CHẤM)
                </span>
              )}
            </div>
          </div>

          {/* Banner thông báo */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800 border border-red-100">
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

          {isLocked && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl bg-slate-100 p-4 text-sm font-medium text-slate-700 border border-slate-200">
              <LockClosedIcon className="h-5 w-5 flex-shrink-0 text-slate-500" />
              <p>
                Phiếu đánh giá này đã được gửi lúc{' '}
                <strong>
                  {form.submittedAt ? new Date(form.submittedAt).toLocaleString('vi-VN') : 'vừa xong'}
                </strong>
                . Dữ liệu đã được khóa để Hội đồng Khoa tổng hợp điểm.
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="h-10 w-10 border-4 border-[#8093FF] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-semibold text-gray-500">Đang tải phiếu đánh giá...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* CỘT TRÁI (2/3): DANH SÁCH TIÊU CHÍ RUBRIC */}
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Tiêu chí đánh giá Doanh nghiệp</h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Thang điểm từ 0.0 đến 10.0 cho từng tiêu chí đánh giá nghiệp vụ
                      </p>
                    </div>
                    <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-[#8093FF]">
                      {criteria.length} tiêu chí
                    </span>
                  </div>

                  {criteria.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      <p className="text-sm">Chưa có tiêu chí đánh giá nào cho Doanh nghiệp trong đợt này.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {criteria.map((c, index) => {
                        const cur = scores[c.id] || { score: 0, comment: '' };
                        return (
                          <div
                            key={c.id}
                            className="rounded-2xl border border-gray-100 bg-slate-50/60 p-5 transition hover:border-indigo-100"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-[#8093FF] font-mono">
                                    {c.code || `TC-DN${index + 1}`}
                                  </span>
                                  <h3 className="text-base font-bold text-gray-900">{c.name}</h3>
                                </div>
                                {c.description && (
                                  <p className="text-xs text-gray-500 leading-relaxed mt-1">{c.description}</p>
                                )}
                              </div>

                              {/* Điểm số */}
                              <div className="flex items-center gap-2 self-end sm:self-start">
                                <label className="text-xs font-semibold text-gray-500">Điểm (0-10):</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  disabled={isLocked}
                                  value={cur.score}
                                  onChange={(e) => handleScoreChange(c.id, parseFloat(e.target.value) || 0)}
                                  className="w-20 rounded-xl border border-gray-200 bg-white px-3 py-2 text-center text-base font-extrabold text-indigo-700 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] disabled:bg-gray-100 disabled:text-gray-500 transition"
                                />
                              </div>
                            </div>

                            {/* Nhận xét tiêu chí */}
                            <div className="mt-3">
                              <input
                                type="text"
                                disabled={isLocked}
                                value={cur.comment}
                                onChange={(e) => handleCommentChange(c.id, e.target.value)}
                                placeholder="Ghi chú / Nhận xét cụ thể về tiêu chí này..."
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] disabled:bg-gray-100 transition"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* CỘT PHẢI (1/3): THÔNG TIN SINH VIÊN & BẢNG ĐIỂM TỔNG KẾT */}
              <div className="space-y-6">
                {/* Thẻ sinh viên */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-3">
                    Thông tin Thực tập sinh
                  </h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 font-bold text-[#8093FF] text-lg">
                      {profile?.student?.fullName?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-900">{profile?.student?.fullName}</p>
                      <p className="text-xs text-gray-400 font-mono">MSSV: {profile?.student?.studentCode}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Vị trí:</span>
                      <span className="font-semibold text-gray-800">{profile?.position || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Đề tài:</span>
                      <span className="font-semibold text-gray-800 text-right line-clamp-1">{profile?.title || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">GV Hướng dẫn:</span>
                      <span className="font-semibold text-gray-800">{profile?.supervisor?.fullName || 'Chưa gán'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trạng thái hồ sơ:</span>
                      {profile && <Badge status={profile.status} />}
                    </div>
                  </div>
                </div>

                {/* Điểm tổng hợp tạm tính */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-3">
                    Tổng kết Điểm Doanh nghiệp
                  </h3>

                  <div className="rounded-2xl bg-indigo-50/70 p-5 text-center mb-6 border border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                      Điểm Trung bình Doanh nghiệp
                    </p>
                    <p className="text-4xl font-black text-[#8093FF] mt-2">{avgScore}</p>
                    <p className="text-[11px] text-gray-400 mt-1">Thang điểm 10 • Trọng số 40% kết quả chung</p>
                  </div>

                  {/* Nút hành động */}
                  {!isLocked && (
                    <div className="space-y-3">
                      <button
                        onClick={handleSaveDraft}
                        disabled={saving || submitting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-50 py-3 text-xs font-bold text-gray-700 border border-gray-200 hover:bg-gray-100 transition disabled:opacity-50"
                      >
                        <BookmarkSquareIcon className="h-4 w-4" />
                        <span>{saving ? 'Đang lưu nháp...' : 'Lưu bản nháp'}</span>
                      </button>

                      <button
                        onClick={() => setShowConfirmModal(true)}
                        disabled={saving || submitting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#8093FF] py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:opacity-90 transition disabled:opacity-50"
                      >
                        <PaperAirplaneIcon className="h-4 w-4" />
                        <span>Nộp đánh giá chính thức</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal xác nhận nộp chính thức */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Xác nhận nộp đánh giá Doanh nghiệp"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Bạn có chắc chắn muốn nộp phiếu đánh giá cho sinh viên{' '}
            <strong className="text-gray-900">{profile?.student?.fullName}</strong> với điểm trung bình là{' '}
            <strong className="text-[#8093FF]">{avgScore}/10</strong>?
          </p>

          <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
            ⚠️ <strong>Lưu ý:</strong> Sau khi nộp, phiếu đánh giá sẽ bị <strong>khóa vĩnh viễn</strong> và không thể chỉnh sửa để Cán bộ Khoa chốt điểm cuối cùng.
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setShowConfirmModal(false)}
              disabled={submitting}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl bg-[#8093FF] px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Đang gửi...' : 'Xác nhận nộp'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
