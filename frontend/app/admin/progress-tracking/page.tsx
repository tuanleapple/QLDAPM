'use client';

import Link from 'next/link';
import {
  ChartPieIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

export default function ProgressTrackingPage() {
  // Dữ liệu mẫu (Mock data) danh sách theo dõi tiến độ
  const trackingData = [
    {
      id: '1',
      studentName: 'Nguyễn Chí Thanh',
      studentCode: '2313079',
      company: 'FPT Software',
      supervisor: 'TS. Lê Thị A',
      week1: 'Đúng hạn',
      week2: 'Đúng hạn',
      week3: 'Chưa nộp',
    },
    {
      id: '2',
      studentName: 'Huỳnh Võ Quốc Thắng',
      studentCode: '2313080',
      company: 'VNG Corporation',
      supervisor: 'ThS. Nguyễn Văn B',
      week1: 'Đúng hạn',
      week2: 'Trễ hạn',
      week3: 'Chưa nộp',
    },
    {
      id: '3',
      studentName: 'Trần Đăng Minh',
      studentCode: '2313105',
      company: 'KMS Technology',
      supervisor: 'TS. Lê Thị A',
      week1: 'Trễ hạn',
      week2: 'Trễ hạn',
      week3: 'Chưa nộp',
    },
  ];

  // Hàm render badge trạng thái
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Đúng hạn':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
            <CheckCircleIcon className="h-3.5 w-3.5" /> Đúng hạn
          </span>
        );
      case 'Trễ hạn':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-200">
            <XCircleIcon className="h-3.5 w-3.5" /> Trễ hạn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 border border-gray-200">
            <ClockIcon className="h-3.5 w-3.5" /> Chưa nộp
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Theo dõi tiến độ báo cáo</h1>
        <p className="mt-1 text-sm text-gray-500">Kỳ thực tập: Học kỳ 261 - Năm học 2026</p>
      </div>

      {/* Thống kê tổng quan (Summary Cards) */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
            <ChartPieIcon className="h-6 w-6 text-[#8093FF]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tổng sinh viên</p>
            <p className="text-2xl font-bold text-gray-900">125</p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Nộp đủ (Tuần 2)</p>
            <p className="text-2xl font-bold text-gray-900">110</p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <XCircleIcon className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Trễ hạn (Tuần 2)</p>
            <p className="text-2xl font-bold text-gray-900">12</p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
            <ClockIcon className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Chưa nộp (Tuần 2)</p>
            <p className="text-2xl font-bold text-gray-900">3</p>
          </div>
        </div>
      </div>

      {/* Container của Bảng dữ liệu */}
      <div className="rounded-[2rem] border border-gray-100 bg-white shadow-sm overflow-hidden">
        {/* Toolbar: Tìm kiếm & Lọc */}
        <div className="border-b border-gray-100 p-6 flex items-center justify-between bg-white">
          <div className="relative w-full max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF]"
              placeholder="Tìm kiếm theo tên hoặc MSSV..."
            />
          </div>
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-[#8093FF]">
            <FunnelIcon className="h-5 w-5" />
            Lọc danh sách
          </button>
        </div>

        {/* Bảng dữ liệu */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-4 font-bold">Sinh viên</th>
                <th className="px-6 py-4 font-bold">Đơn vị thực tập</th>
                <th className="px-6 py-4 font-bold">GVHD</th>
                <th className="px-6 py-4 font-bold text-center">Tuần 1</th>
                <th className="px-6 py-4 font-bold text-center">Tuần 2</th>
                <th className="px-6 py-4 font-bold text-center">Tuần 3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {trackingData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{row.studentName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{row.studentCode}</p>
                  </td>
                  <td className="px-6 py-4">{row.company}</td>
                  <td className="px-6 py-4">{row.supervisor}</td>
                  <td className="px-6 py-4 text-center">{renderStatusBadge(row.week1)}</td>
                  <td className="px-6 py-4 text-center">{renderStatusBadge(row.week2)}</td>
                  <td className="px-6 py-4 text-center">{renderStatusBadge(row.week3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination (Tượng trưng) */}
        <div className="border-t border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">Hiển thị 1 đến 3 của 125 kết quả</span>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition"
              disabled
            >
              Trước
            </button>
            <button className="rounded-lg border border-gray-200 bg-[#8093FF] px-3 py-1.5 text-sm font-bold text-white shadow-sm">
              1
            </button>
            <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              2
            </button>
            <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
