import Image from 'next/image';
import Link from 'next/link';
import {
  BuildingOfficeIcon,
  UserIcon,
  CloudArrowUpIcon,
  PaperAirplaneIcon,
  CalendarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function RegisterInternshipPage() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-[#F9FAFB] px-4 py-12">
      {/* Cụm Logo & Tiêu đề */}
      <div className="mb-10 text-center">
        <div className="mb-6 flex justify-center">
          <Image
            src="/img/sims_logo_concept_01 3.png"
            alt="SIMS Logo"
            width={160}
            height={60}
            className="object-contain"
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>
        <h2 className="mb-3 text-4xl font-extrabold text-gray-900">Đơn đăng ký thực tập</h2>
        <p className="text-gray-500">
          Điền các chi tiết bên dưới và tải lên các tài liệu được yêu cầu để nộp đơn của bạn.
        </p>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
        <div className="space-y-8 p-10">
          {/* Cụm thông tin Công ty & Vị trí (2 cột) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Input: Tên công ty */}
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">
                Tên công ty <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <BuildingOfficeIcon className="h-5 w-5 text-[#8093FF]" />
                </div>
                <input
                  type="text"
                  className="w-full rounded-xl border border-gray-200 py-3.5 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition"
                  placeholder="Nhập tên công ty"
                />
              </div>
            </div>

            {/* Input: Vai trò / Vị trí */}
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">
                Vai trò / Vị trí <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <UserIcon className="h-5 w-5 text-[#8093FF]" />
                </div>
                <input
                  type="text"
                  className="w-full rounded-xl border border-gray-200 py-3.5 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition"
                  placeholder="Nhập vai trò hoặc vị trí"
                />
              </div>
            </div>
          </div>

          {/* Cụm thời gian thực tập (2 cột) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Input: Ngày bắt đầu */}
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">
                Ngày bắt đầu làm việc <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <CalendarIcon className="h-5 w-5 text-[#8093FF]" />
                </div>
                <input
                  type="date"
                  className="w-full rounded-xl border border-gray-200 py-3.5 pl-12 pr-4 text-sm text-gray-900 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition"
                />
              </div>
            </div>

            {/* Input: Ngày kết thúc */}
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">
                Ngày kết thúc thực tập <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <CalendarIcon className="h-5 w-5 text-[#8093FF]" />
                </div>
                <input
                  type="date"
                  className="w-full rounded-xl border border-gray-200 py-3.5 pl-12 pr-4 text-sm text-gray-900 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition"
                />
              </div>
            </div>
          </div>

          {/* Input: Mô tả công việc */}
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-900">
              Mô tả chi tiết công việc <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute left-0 top-3.5 flex items-center pl-4">
                <DocumentTextIcon className="h-5 w-5 text-[#8093FF]" />
              </div>
              <textarea
                rows={4}
                className="w-full rounded-xl border border-gray-200 py-3.5 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition resize-none"
                placeholder="Mô tả tóm tắt các nhiệm vụ chính bạn sẽ thực hiện trong quá trình thực tập..."
              ></textarea>
            </div>
          </div>

          {/* Upload: Tài liệu hỗ trợ */}
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-900">
              Tài liệu hỗ trợ (CV, Giấy tiếp nhận...) <span className="text-red-500">*</span>
            </label>
            <div className="mt-2 flex cursor-pointer justify-center rounded-2xl border-2 border-dashed border-[#8093FF] bg-[#F8F9FF] px-6 pb-12 pt-12 transition hover:bg-[#F0F2FF]">
              <div className="space-y-3 text-center">
                <CloudArrowUpIcon className="mx-auto h-14 w-14 text-[#8093FF]" />
                <div className="text-sm font-bold text-gray-900">
                  Kéo và thả tệp của bạn vào đây
                </div>
                <p className="text-sm text-gray-500">
                  hoặc nhấp để{' '}
                  <span className="font-semibold text-[#8093FF] hover:underline">duyệt</span>
                </p>
                <p className="text-xs font-medium text-gray-500">
                  PDF, DOC, DOCX hoặc ZIP (Tối đa 10MB)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 px-10 py-6">
          <Link
            href="/student/dashboard"
            className="rounded-xl border border-gray-200 bg-gray-50 px-8 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Hủy
          </Link>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-[#8093FF] px-8 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          >
            Nộp đơn đăng ký
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
