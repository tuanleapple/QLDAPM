'use client';

import {
  ArrowLeftIcon,
  UserCircleIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline';

export default function EvaluationPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition hover:text-[#8093FF]"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Phiếu đánh giá sinh viên</h1>
            <p className="text-sm text-gray-500">
              Mã phiếu: <span className="font-semibold text-[#8093FF]">EV-2026-001</span>
            </p>
          </div>
        </div>
        <span className="rounded-full bg-orange-100 px-4 py-1.5 text-sm font-semibold text-orange-700">
          Trạng thái: Bản nháp (Chưa gửi)
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* CỘT TRÁI: Thông tin sinh viên & File báo cáo */}
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
              <UserCircleIcon className="h-6 w-6 text-[#8093FF]" />
              Sinh viên thực tập
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Họ và tên</p>
                <p className="font-semibold text-gray-900">Nguyễn Chí Thanh</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Mã số sinh viên</p>
                <p className="font-semibold text-gray-900">2313079</p>
              </div>
              <hr className="border-gray-100" />
              <div>
                <p className="text-gray-500 mb-2">File báo cáo đã nộp</p>
                <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#8093FF] bg-[#F0F2FF] py-3 text-sm font-bold text-[#8093FF] transition hover:bg-[#E6EAFB]">
                  <DocumentTextIcon className="h-5 w-5" />
                  Tải xuống báo cáo (PDF)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Form chấm điểm (Evaluation Detail) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900 border-b pb-4">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-[#8093FF]" />
              Chi tiết điểm đánh giá (Thang điểm 10)
            </h2>

            <form className="space-y-6">
              {/* Vòng lặp các tiêu chí từ bảng Criteria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-900">
                    1. Thái độ làm việc & Kỷ luật
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black font-medium placeholder:text-gray-400 placeholder:font-normal focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF]"
                    placeholder="Nhập điểm (0-10)"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-900">
                    2. Kỹ năng chuyên môn
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black font-medium placeholder:text-gray-400 placeholder:font-normal focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF]"
                    placeholder="Nhập điểm (0-10)"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-900">
                    3. Chất lượng báo cáo
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black font-medium placeholder:text-gray-400 placeholder:font-normal focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF]"
                    placeholder="Nhập điểm (0-10)"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-900">
                    4. Kỹ năng trình bày / Vấn đáp
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black font-medium placeholder:text-gray-400 placeholder:font-normal focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF]"
                    placeholder="Nhập điểm (0-10)"
                  />
                </div>
              </div>

              <hr className="border-gray-100 my-6" />

              {/* Nhận xét chung (Evaluation Form) */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
                  <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-gray-500" />
                  Nhận xét tổng quan của người đánh giá
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 p-4 text-sm text-black font-medium placeholder:text-gray-400 placeholder:font-normal focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] resize-none"
                  placeholder="Nhập nhận xét về điểm mạnh, điểm yếu của sinh viên..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Lưu nháp
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#8093FF] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
                >
                  Chốt điểm & Gửi phiếu
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
