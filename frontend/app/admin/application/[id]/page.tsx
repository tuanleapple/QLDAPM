'use client';

import Link from 'next/link';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  BuildingOfficeIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

export default function ApplicationDetailPage() {
  // Dữ liệu mẫu (Mock data) hiển thị cho màn hình chi tiết
  const appData = {
    id: 'HS-2026-001',
    studentName: 'Nguyễn Chí Thanh',
    studentCode: '2313079',
    class: 'MT23KHM6',
    company: 'FPT Software Hồ Chí Minh',
    position: 'Lập trình viên Frontend (Next.js)',
    startDate: '15/06/2026',
    endDate: '14/08/2026',
    description:
      'Tham gia phát triển giao diện web quản lý nội bộ. Sử dụng Next.js, Tailwind CSS và TypeScript. Hỗ trợ team fix bug và tối ưu UI/UX theo thiết kế Figma.',
    status: 'Chờ duyệt',
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      {/* Header & Nút quay lại */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm hover:text-[#8093FF] transition"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chi tiết hồ sơ thực tập</h1>
            <p className="text-sm text-gray-500">
              Mã hồ sơ: <span className="font-semibold text-[#8093FF]">{appData.id}</span>
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1.5 text-sm font-semibold text-orange-700">
          <ExclamationTriangleIcon className="h-4 w-4" />
          {appData.status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* CỘT TRÁI: THÔNG TIN HỒ SƠ (Chiếm 2 phần) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Thông tin sinh viên */}
          <div className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
              <UserCircleIcon className="h-6 w-6 text-[#8093FF]" />
              Thông tin sinh viên
            </h2>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Họ và tên</p>
                <p className="font-semibold text-gray-900">{appData.studentName}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Mã số sinh viên</p>
                <p className="font-semibold text-gray-900">{appData.studentCode}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Lớp sinh hoạt</p>
                <p className="font-semibold text-gray-900">{appData.class}</p>
              </div>
            </div>
          </div>

          {/* Card: Chi tiết thực tập */}
          <div className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
              <BuildingOfficeIcon className="h-6 w-6 text-[#8093FF]" />
              Đơn vị & Vị trí công tác
            </h2>

            <div className="space-y-5 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 mb-1">Doanh nghiệp tiếp nhận</p>
                  <p className="font-semibold text-gray-900">{appData.company}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Vị trí thực tập</p>
                  <p className="font-semibold text-gray-900">{appData.position}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div>
                  <p className="text-gray-500 mb-1">Ngày bắt đầu</p>
                  <p className="font-bold text-[#8093FF]">{appData.startDate}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Ngày kết thúc</p>
                  <p className="font-bold text-[#8093FF]">{appData.endDate}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 mb-2">Mô tả công việc</p>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-700 leading-relaxed">
                  {appData.description}
                </div>
              </div>

              <div>
                <p className="text-gray-500 mb-2">Tài liệu đính kèm (CV, Giấy tiếp nhận)</p>
                <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#8093FF] transition shadow-sm">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  Hoso_Thuctap_NguyenChiThanh.pdf
                  <ArrowDownTrayIcon className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: PHÂN CÔNG & THAO TÁC (Chiếm 1 phần) */}
        <div className="space-y-6">
          {/* Card: Phân công */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-gray-900 border-b pb-3">Phân công quản lý</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Giảng viên hướng dẫn (Supervisor) <span className="text-red-500">*</span>
                </label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF]">
                  <option value="">-- Chọn giảng viên --</option>
                  <option value="gv01">TS. Lê Thị A</option>
                  <option value="gv02">ThS. Nguyễn Văn B</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Đại diện doanh nghiệp (Enterprise) <span className="text-red-500">*</span>
                </label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF]">
                  <option value="">-- Chọn bản ghi doanh nghiệp --</option>
                  <option value="dn01">FPT Software (Đã liên kết)</option>
                  <option value="dn02">VNG Corporation</option>
                </select>
                <p className="mt-1.5 text-[11px] text-gray-500">
                  *Bắt buộc phải map (ghép nối) để hệ thống gửi phiếu đánh giá cho DN.
                </p>
              </div>
            </div>
          </div>

          {/* Card: Thao tác duyệt */}
          <div className="rounded-2xl border border-gray-100 bg-[#2A1E5C] p-6 shadow-md text-white">
            <h3 className="mb-4 font-bold border-b border-indigo-900 pb-3">Quyết định hồ sơ</h3>
            <div className="space-y-3">
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-bold shadow hover:bg-emerald-600 transition">
                <CheckCircleIcon className="h-5 w-5" />
                Phê duyệt & Phân công
              </button>

              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-2.5 text-sm font-semibold hover:bg-white/20 transition">
                <ExclamationTriangleIcon className="h-5 w-5" />
                Yêu cầu bổ sung
              </button>

              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/20 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-500/30 hover:text-white transition">
                <XCircleIcon className="h-5 w-5" />
                Từ chối hồ sơ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
