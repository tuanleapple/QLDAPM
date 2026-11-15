// frontend/app/student/submit-report/page.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { apiClient } from '@/lib/api-client';
import { InternshipProfile, PaginatedResponse, ReportVersion } from '@/types/api';

export default function SubmitReportPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<InternshipProfile | null>(null);
  const [reportVersions, setReportVersions] = useState<ReportVersion[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy hồ sơ thực tập của sinh viên hiện tại
      const profilesRes = await apiClient.get<PaginatedResponse<InternshipProfile>>('/internships/profiles', {
        page: 1,
        limit: 5,
      });

      const currentProfile = profilesRes.items?.[0] || null;
      setProfile(currentProfile);

      if (currentProfile) {
        // Lấy lịch sử các phiên bản báo cáo đã nộp
        const versionsRes = await apiClient.get<PaginatedResponse<ReportVersion>>(
          `/reports/profiles/${currentProfile.id}/versions`,
          { page: 1, limit: 20 }
        );
        setReportVersions(versionsRes.items || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải thông tin báo cáo';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng (PDF hoặc DOCX)
    const validExtensions = ['.pdf', '.docx'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setError('Hệ thống chỉ chấp nhận file định dạng PDF (.pdf) hoặc Word (.docx)');
      return;
    }

    // Kiểm tra dung lượng (tối đa 10MB)
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError('Dung lượng file vượt quá giới hạn cho phép (tối đa 10 MB)');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!profile) {
      setError('Bạn chưa có hồ sơ thực tập hợp lệ để nộp báo cáo');
      return;
    }
    if (!selectedFile) {
      setError('Vui lòng chọn file báo cáo trước khi bấm Nộp báo cáo');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccessMsg(null);

      const formData = new FormData();
      formData.append('file', selectedFile);

      await apiClient.post(`/reports/profiles/${profile.id}`, formData);

      setSuccessMsg(`Đã nộp thành công file báo cáo "${selectedFile.name}"!`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Làm mới danh sách phiên bản báo cáo
      const versionsRes = await apiClient.get<PaginatedResponse<ReportVersion>>(
        `/reports/profiles/${profile.id}/versions`,
        { page: 1, limit: 20 }
      );
      setReportVersions(versionsRes.items || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nộp báo cáo thất bại';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (version: ReportVersion) => {
    try {
      setDownloadingId(version.id);
      await apiClient.download(`/reports/${version.id}/content`, version.originalName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tải file thất bại';
      alert(msg);
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const deadline = profile?.period?.reportDeadlineAt;

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Nộp báo cáo thực tập cuối kỳ" />

        <main className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
          <div className="mb-6">
            <Link
              href="/student/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition mb-3"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Quay lại Bảng điều khiển
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900">Nộp báo cáo tổng kết thực tập</h1>
            <p className="mt-1 text-sm text-gray-500">
              Tải lên tài liệu báo cáo thực tập hoàn chỉnh của bạn. Tài liệu sẽ được chuyển đến Giảng viên hướng dẫn để chấm điểm.
            </p>
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
              <p className="text-sm font-medium text-gray-500">Đang tải thông tin báo cáo...</p>
            </div>
          ) : !profile ? (
            <div className="rounded-3xl bg-white p-12 text-center border border-gray-100 shadow-xs">
              <ExclamationCircleIcon className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-gray-900">Chưa có hồ sơ thực tập</h2>
              <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                Bạn cần đăng ký hồ sơ thực tập và được Ban quản lý phê duyệt trước khi có thể nộp báo cáo tổng kết.
              </p>
              <Link
                href="/student/register-intern"
                className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8093FF] text-white text-sm font-bold shadow-md hover:opacity-90 transition"
              >
                Đăng ký thực tập ngay
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-xs">
              <div className="p-8 space-y-8">
                {/* Thông tin deadline & Kỳ thực tập */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-blue-50 p-5 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <ClockIcon className="h-8 w-8 text-[#8093FF] flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {profile.period?.name || 'Đợt thực tập tốt nghiệp'}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Hạn chót nộp báo cáo: {deadline ? new Date(deadline).toLocaleString('vi-VN') : 'Không có hạn chót cụ thể'}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex self-start sm:self-auto rounded-full bg-blue-100 px-3.5 py-1 text-xs font-bold text-blue-800">
                    Trạng thái hồ sơ: {profile.status}
                  </span>
                </div>

                {/* Khu vực Upload File */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-900">
                    Tệp báo cáo (Định dạng PDF hoặc DOCX) <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 flex cursor-pointer justify-center rounded-2xl border-2 border-dashed border-[#8093FF] bg-[#F8F9FF] px-6 py-10 transition hover:bg-[#F0F2FF]"
                  >
                    <div className="space-y-3 text-center">
                      <CloudArrowUpIcon className="mx-auto h-12 w-12 text-[#8093FF]" />
                      {selectedFile ? (
                        <div>
                          <p className="text-base font-bold text-gray-900">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Dung lượng: {formatFileSize(selectedFile.size)} - Bấm để chọn file khác
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-bold text-gray-900">Bấm vào đây để chọn tệp báo cáo từ máy tính</div>
                          <p className="text-xs text-gray-500 mt-1">Chấp nhận định dạng .pdf, .docx (Dung lượng tối đa: 10MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lịch sử nộp các phiên bản (Report Versions) */}
                <div>
                  <h3 className="mb-4 text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                    Lịch sử các phiên bản đã nộp ({reportVersions.length})
                  </h3>

                  {reportVersions.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-gray-50 text-gray-500 text-sm">
                      Bạn chưa nộp phiên bản báo cáo nào. Vui lòng chọn file và bấm &quot;Nộp báo cáo&quot; ở bên dưới.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reportVersions.map((v) => (
                        <div
                          key={v.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center gap-3">
                            <DocumentTextIcon className="h-8 w-8 text-emerald-600 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-bold text-gray-900">{v.originalName}</p>
                              <p className="text-xs text-gray-500">
                                Phiên bản {v.version} • {formatFileSize(v.sizeBytes)} • Nộp lúc: {new Date(v.submittedAt).toLocaleString('vi-VN')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {v.isLate ? (
                              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                Nộp muộn
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                <CheckCircleIcon className="h-3.5 w-3.5" /> Đúng hạn
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDownload(v)}
                              disabled={downloadingId === v.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                            >
                              <ArrowDownTrayIcon className="w-3.5 h-3.5 text-gray-500" />
                              <span>{downloadingId === v.id ? 'Đang tải...' : 'Tải về'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Thanh hành động */}
              <div className="flex items-center justify-between border-t border-gray-100 px-8 py-5 bg-gray-50/50">
                <Link
                  href="/student/dashboard"
                  className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Quay lại
                </Link>

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                  className="flex items-center gap-2 rounded-xl bg-[#8093FF] px-8 py-3 text-sm font-bold text-white shadow-md shadow-indigo-100 transition hover:opacity-90 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải lên...</span>
                    </>
                  ) : (
                    <>
                      <span>Nộp báo cáo</span>
                      <ArrowPathIcon className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
