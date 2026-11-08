'use client';

import Link from 'next/link';
import {
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

export default function ProgressReportPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] px-4 py-12 flex flex-col items-center">
      {/* Tiêu đề trang */}
      <div className="mb-10 text-center w-full max-w-3xl">
        <h2 className="mb-3 text-4xl font-extrabold text-gray-900">Báo cáo tiến độ định kỳ</h2>
        <p className="text-gray-500">
          Cập nhật chi tiết các công việc bạn đã làm trong tuần để Giảng viên hướng dẫn theo dõi.
        </p>
      </div>

      {/* Container Form */}
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
        {/* Header Form hiển thị thông tin đợt */}
        <div className="bg-gray-50 border-b border-gray-100 px-10 py-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Đơn vị thực tập</p>
            <p className="font-bold text-gray-900">FPT Software Hồ Chí Minh</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Giảng viên hướng dẫn</p>
            <p className="font-bold text-[#8093FF]">TS. Lê Thị A</p>
          </div>
        </div>

        <form className="space-y-8 p-10">
          {/* Kỳ báo cáo (reportPeriod) */}
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-900">
              Kỳ báo cáo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <CalendarDaysIcon className="h-5 w-5 text-[#8093FF]" />
              </div>
              <select className="w-full rounded-xl border border-gray-200 py-3.5 pl-12 pr-4 text-sm text-gray-900 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition appearance-none bg-white">
                <option value="">-- Chọn tuần báo cáo --</option>
                <option value="week1">Tuần 1 (15/06 - 21/06)</option>
                <option value="week2">Tuần 2 (22/06 - 28/06)</option>
                <option value="week3">Tuần 3 (29/06 - 05/07)</option>
              </select>
            </div>
          </div>

          {/* Các công việc đã thực hiện (tasks) */}
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-900">
              Các công việc đã thực hiện <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute top-3.5 left-0 flex items-center pl-4">
                <ClipboardDocumentListIcon className="h-5 w-5 text-[#8093FF]" />
              </div>
              <textarea
                rows={4}
                className="w-full rounded-xl border border-gray-200 py-3.5 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition resize-none"
                placeholder="Liệt kê các task bạn đã hoàn thành trong tuần này..."
              ></textarea>
            </div>
          </div>

          {/* Cụm Kết quả & Khó khăn (2 cột) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Kết quả đạt được (results) */}
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">
                Kết quả đạt được <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute top-3.5 left-0 flex items-center pl-4">
                  <ChartBarIcon className="h-5 w-5 text-emerald-500" />
                </div>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 py-3.5 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition resize-none"
                  placeholder="Những thành quả, kiến thức học được..."
                ></textarea>
              </div>
            </div>

            {/* Khó khăn gặp phải (issues) */}
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">
                Khó khăn gặp phải
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute top-3.5 left-0 flex items-center pl-4">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                </div>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 py-3.5 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition resize-none"
                  placeholder="Ghi nhận issue nếu có để GVHD hỗ trợ..."
                ></textarea>
              </div>
            </div>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-gray-100 px-10 py-6 bg-white">
          <Link
            href="/student/dashboard"
            className="rounded-xl border border-gray-200 bg-gray-50 px-8 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Hủy
          </Link>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-[#8093FF] px-8 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          >
            Gửi báo cáo tuần
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
