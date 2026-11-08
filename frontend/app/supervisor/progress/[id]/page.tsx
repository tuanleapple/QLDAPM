'use client';

import Link from 'next/link';
import {
  ArrowLeftIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ChatBubbleBottomCenterTextIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

export default function ProgressReviewPage() {
  // Dữ liệu mẫu (Mock data) báo cáo của sinh viên
  const reportData = {
    id: 'BC-W01-001',
    studentName: 'Nguyễn Chí Thanh',
    studentCode: '2313079',
    period: 'Tuần 1 (15/06 - 21/06)',
    submittedAt: '21/06/2026 09:30 AM',
    tasks:
      '- Tìm hiểu luồng nghiệp vụ quản lý thực tập.\n- Thiết kế UI cho trang Đăng nhập và Đăng ký.\n- Setup Next.js, Tailwind CSS và Heroicons.',
    results:
      '- Đã chốt xong Figma design cho 3 màn hình đầu tiên.\n- Khởi tạo thành công repo QLDAPM trên GitHub.',
    issues:
      'Hiện tại chưa gặp khó khăn gì, nhưng tuần sau em sẽ cần hướng dẫn thêm về cách kết nối API với backend.',
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      {/* Header & Nút quay lại */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition hover:text-[#8093FF]"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chi tiết báo cáo tiến độ</h1>
            <p className="text-sm text-gray-500">
              Mã báo cáo: <span className="font-semibold text-[#8093FF]">{reportData.id}</span>
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
          Đã nộp đúng hạn
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* CỘT TRÁI: NỘI DUNG BÁO CÁO CỦA SINH VIÊN */}
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
            {/* Thông tin người gửi */}
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F2FF]">
                  <UserCircleIcon className="h-7 w-7 text-[#8093FF]" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{reportData.studentName}</p>
                  <p className="text-sm text-gray-500">MSSV: {reportData.studentCode}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  <CalendarDaysIcon className="h-4 w-4 text-[#8093FF]" />
                  {reportData.period}
                </p>
                <p className="text-xs text-gray-400 mt-1">Nộp lúc: {reportData.submittedAt}</p>
              </div>
            </div>

            {/* Chi tiết công việc */}
            <div className="space-y-6">
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
                  <ClipboardDocumentListIcon className="h-5 w-5 text-[#8093FF]" />
                  Công việc đã thực hiện
                </p>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {reportData.tasks}
                </div>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
                  <ChartBarIcon className="h-5 w-5 text-emerald-500" />
                  Kết quả đạt được
                </p>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {reportData.results}
                </div>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                  Khó khăn gặp phải
                </p>
                <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-800 whitespace-pre-wrap leading-relaxed">
                  {reportData.issues}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: KHUNG NHẬN XÉT CỦA GIẢNG VIÊN (Thực thể: Comment) */}
        <div className="flex flex-col h-full rounded-[2rem] border border-gray-100 bg-white shadow-sm overflow-hidden">
          {/* Header Khu vực nhận xét */}
          <div className="bg-[#2A1E5C] px-8 py-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-indigo-300" />
              Đánh giá & Nhận xét
            </h2>
            <p className="mt-1 text-sm text-indigo-200">
              Phản hồi của giảng viên sẽ được gửi trực tiếp đến sinh viên.
            </p>
          </div>

          {/* Lịch sử comment (Nếu có) */}
          <div className="flex-1 bg-gray-50 p-8">
            <div className="flex flex-col gap-4">
              {/* Lời nhắc hệ thống trống */}
              <p className="text-center text-sm text-gray-400 italic mt-10">
                Chưa có nhận xét nào cho kỳ báo cáo này.
                <br />
                Hãy viết nhận xét đầu tiên của bạn ở bên dưới.
              </p>
            </div>
          </div>

          {/* Input nhập comment */}
          <div className="border-t border-gray-100 bg-white p-6">
            <form className="flex flex-col gap-3">
              <textarea
                rows={3}
                className="w-full rounded-xl border border-gray-200 p-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] resize-none"
                placeholder="Nhập phản hồi, góp ý hoặc đánh giá tiến độ cho sinh viên..."
              ></textarea>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-[#8093FF] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  Gửi nhận xét
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
