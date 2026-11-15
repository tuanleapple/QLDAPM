'use client';

import Link from 'next/link';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function SubmitReportPage() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-[#F9FAFB] px-4 py-12">
      <div className="mb-10 text-center w-full max-w-3xl">
        <h2 className="mb-3 text-4xl font-extrabold text-gray-900">Nộp báo cáo tổng kết</h2>
        <p className="text-gray-500">
          Tải lên báo cáo thực tập cuối kỳ của bạn. File sẽ được gửi đến Giảng viên hướng dẫn để
          chấm điểm.
        </p>
      </div>

      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
        <div className="p-10 space-y-8">
          {/* Thông tin deadline */}
          <div className="flex items-center justify-between rounded-xl bg-blue-50 p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <ClockIcon className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-sm font-bold text-gray-900">Hạn chót nộp báo cáo</p>
                <p className="text-xs text-gray-600">23:59 - Ngày 15/09/2026</p>
              </div>
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
              Còn 7 ngày
            </span>
          </div>

          {/* Khu vực Upload */}
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-900">
              Tệp báo cáo (PDF, DOCX) <span className="text-red-500">*</span>
            </label>
            <div className="mt-2 flex cursor-pointer justify-center rounded-2xl border-2 border-dashed border-[#8093FF] bg-[#F8F9FF] px-6 pb-12 pt-12 transition hover:bg-[#F0F2FF]">
              <div className="space-y-3 text-center">
                <CloudArrowUpIcon className="mx-auto h-14 w-14 text-[#8093FF]" />
                <div className="text-sm font-bold text-gray-900">Kéo thả file báo cáo vào đây</div>
                <p className="text-sm text-gray-500">
                  hoặc{' '}
                  <span className="font-semibold text-[#8093FF] hover:underline">Duyệt file</span>{' '}
                  từ máy tính
                </p>
                <p className="text-xs font-medium text-gray-400">Dung lượng tối đa: 20MB</p>
              </div>
            </div>
          </div>

          {/* Lịch sử nộp (Version) theo ERD */}
          <div>
            <h3 className="mb-4 text-sm font-bold text-gray-900 border-b pb-2">Lịch sử nộp bài</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="h-8 w-8 text-emerald-500" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      BaoCaoThucTap_NguyenChiThanh_v1.pdf
                    </p>
                    <p className="text-xs text-gray-500">
                      Nộp lúc: 10:30 AM - 08/09/2026 (Phiên bản 1)
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <CheckCircleIcon className="h-4 w-4" /> Thành công
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-10 py-6">
          <Link
            href="/student/dashboard"
            className="rounded-xl border border-gray-200 bg-gray-50 px-8 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Trở về
          </Link>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-[#8093FF] px-8 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          >
            Nộp báo cáo
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
