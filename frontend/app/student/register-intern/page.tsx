import Image from 'next/image';
import Link from 'next/link';
import {
  BuildingOfficeIcon,
  UserIcon,
  CloudArrowUpIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

export default function RegisterInternshipPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center py-12 px-4">
      {/* Cụm Logo & Tiêu đề */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-6">
          <Image
            src="/img/sims_logo_concept_01 3.png"
            alt="SIMS Logo"
            width={160}
            height={60}
            className="object-contain"
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>
        <h2 className="text-4xl font-extrabold text-gray-900 mb-3">Đơn đăng ký thực tập</h2>
        <p className="text-gray-500">
          Điền các chi tiết bên dưới và tải lên các tài liệu được yêu cầu để nộp đơn của bạn.
        </p>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-10 space-y-8">
          {/* Input: Tên công ty */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Tên công ty <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <BuildingOfficeIcon className="h-5 w-5 text-[#8093FF]" />
              </div>
              <input
                type="text"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:border-[#8093FF] focus:ring-1 focus:ring-[#8093FF] outline-none transition"
                placeholder="Nhập tên công ty"
              />
            </div>
          </div>

          {/* Input: Vai trò / Vị trí */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Vai trò / Vị trí <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-[#8093FF]" />
              </div>
              <input
                type="text"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:border-[#8093FF] focus:ring-1 focus:ring-[#8093FF] outline-none transition"
                placeholder="Nhập vai trò hoặc vị trí"
              />
            </div>
          </div>

          {/* Upload: Tài liệu hỗ trợ */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Tài liệu hỗ trợ <span className="text-red-500">*</span>
            </label>
            <div className="mt-2 flex justify-center px-6 pt-12 pb-12 border-2 border-[#8093FF] border-dashed rounded-2xl bg-[#F8F9FF] hover:bg-[#F0F2FF] transition cursor-pointer">
              <div className="space-y-3 text-center">
                <CloudArrowUpIcon className="mx-auto h-14 w-14 text-[#8093FF]" />
                <div className="text-sm text-gray-900 font-bold">
                  Kéo và thả tệp của bạn vào đây
                </div>
                <p className="text-sm text-gray-500">
                  hoặc nhấp để{' '}
                  <span className="text-[#8093FF] font-semibold hover:underline">duyệt</span>
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  PDF, DOC, DOCX hoặc ZIP (Tối đa 10MB)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-10 py-6 border-t border-gray-100 flex justify-between items-center">
          <Link
            href="/student/dashboard"
            className="px-8 py-3 rounded-xl text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition"
          >
            Hủy
          </Link>
          <button
            type="button"
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-medium text-white bg-[#8093FF] hover:opacity-90 transition shadow-sm"
          >
            Nộp đơn đăng ký
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
