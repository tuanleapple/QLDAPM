'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  HomeIcon,
  DocumentPlusIcon,
  ArrowUpTrayIcon,
  ChatBubbleLeftEllipsisIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  BellIcon,
  CalendarIcon,
  CheckIcon,
  BuildingOfficeIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  TrophyIcon,
  CloudArrowUpIcon,
  UserIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon,
  ChevronRightIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

export default function StudentDashboard() {
  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white">
        <div className="flex h-20 items-center px-8">
          <Image
            src="/img/sims_logo_concept_01 3.png"
            alt="SIMS Logo"
            width={120}
            height={40}
            className="h-auto w-auto"
          />
        </div>
        <nav className="mt-4 flex flex-col gap-2 px-4">
          <Link
            href="/student/dashboard"
            className="flex items-center gap-3 rounded-lg bg-[#8093FF] px-4 py-3 text-white shadow-sm"
          >
            <HomeIcon className="h-6 w-6" />
            <span className="font-medium">Bảng điều khiển</span>
          </Link>

          <Link
            href="/student/register-intern"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
          >
            <DocumentPlusIcon className="h-6 w-6" />
            <span className="font-medium">Đăng ký thực tập</span>
          </Link>

          <Link
            href="/student/progress"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
          >
            <ArrowUpTrayIcon className="h-6 w-6" />
            <span className="font-medium">Nộp báo cáo tiến độ</span>
          </Link>

          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
          >
            <ChatBubbleLeftEllipsisIcon className="h-6 w-6" />
            <span className="font-medium">Kết quả đánh giá</span>
          </Link>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <Link
              href="/change-password"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
            >
              <KeyIcon className="h-6 w-6" />
              <span className="font-medium">Đổi mật khẩu</span>
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
            >
              <Cog6ToothIcon className="h-6 w-6" />
              <span className="font-medium">Cài đặt</span>
            </Link>
          </div>
        </nav>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* HEADER */}
        <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-8">
          <div className="relative w-96">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm"
              className="h-10 w-full rounded-full border border-gray-300 bg-gray-50 pl-10 pr-4 text-sm focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF]"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-gray-500 hover:text-gray-700">
              <BellIcon className="h-6 w-6" />
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <div className="flex items-center gap-3 border-l pl-6">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-200">
                <UserIcon className="h-6 w-6 m-2 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Nguyễn Chí Thanh</p>
                <p className="text-xs text-gray-500">CS - Năm 3</p>
              </div>
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Chào mừng trở lại, Nguyễn Chí Thanh 👋
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Dưới đây là những gì đang diễn ra với kỳ thực tập của bạn.
              </p>
            </div>
            <button className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              Kỳ thực tập 2026
            </button>
          </div>

          {/* Section 1: Timeline */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-8 flex items-center gap-2 text-lg font-bold text-gray-900">
              <ArrowUpTrayIcon className="h-5 w-5 text-[#8093FF]" />
              Tiến độ thực tập
            </h2>

            <div className="relative flex justify-between px-10">
              {/* Đường kẻ ngang (Line) */}
              <div className="absolute left-16 right-16 top-6 h-[2px] bg-gray-200 -z-0"></div>
              {/* Đường kẻ ngang màu xanh (Progress Line) */}
              <div className="absolute left-16 top-6 h-[2px] w-1/2 bg-[#8093FF] -z-0"></div>

              {/* Step 1 */}
              <div className="z-10 flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8093FF] text-white ring-4 ring-white">
                  <CheckIcon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900">Đã đăng ký</p>
                  <p className="text-xs text-gray-500">(Ngày 10 tháng 5 năm 2025)</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="z-10 flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8093FF] text-white ring-4 ring-white">
                  <BuildingOfficeIcon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900">Đã ghép nối công ty</p>
                  <p className="text-xs text-gray-500">(Ngày 20 tháng 5 năm 2025)</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="z-10 flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F2FF] border border-[#8093FF] text-[#8093FF] ring-4 ring-white">
                  <RocketLaunchIcon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900">Đang tiến hành</p>
                  <p className="text-xs text-gray-500">
                    (Ngày 1 tháng 6 - Ngày
                    <br />
                    31 tháng 8 năm 2025)
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="z-10 flex flex-col items-center gap-3 opacity-50">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-gray-300 text-gray-400 ring-4 ring-white">
                  <DocumentTextIcon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900">Đánh giá</p>
                  <p className="text-xs text-gray-500">
                    (Ngày 1 tháng 9 - Ngày
                    <br />
                    15 tháng 9 năm 2025)
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="z-10 flex flex-col items-center gap-3 opacity-50">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-gray-300 text-gray-400 ring-4 ring-white">
                  <TrophyIcon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900">Đã hoàn thành</p>
                  <p className="text-xs text-gray-500">(Sắp tới)</p>
                </div>
              </div>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#F0F2FF] px-4 py-2 text-sm font-medium text-[#8093FF]">
              <CheckIcon className="h-5 w-5" />
              Bạn hiện đang trong quá trình thực tập. Hãy tiếp tục phát huy nhé!
            </div>
          </div>

          {/* Section 2: Stats Grid */}
          <div className="mb-6 grid grid-cols-4 gap-6">
            <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="relative h-16 w-16">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="text-[#8093FF]"
                    strokeDasharray="62.5, 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Tiến độ tổng thể</p>
                <p className="text-2xl font-bold text-[#8093FF]">62.5%</p>
                <p className="text-[10px] text-gray-500">Tiếp tục nào! Bạn đang làm rất tốt.</p>
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <CheckIcon className="h-4 w-4 text-[#8093FF]" /> Nhiệm vụ đã hoàn thành
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                12/18 <span className="text-sm font-normal text-gray-500">nhiệm vụ</span>
              </p>
              <Link href="#" className="mt-2 text-xs font-medium text-[#8093FF] hover:underline">
                Xem tất cả nhiệm vụ
              </Link>
            </div>

            <div className="flex flex-col justify-center rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <DocumentTextIcon className="h-4 w-4 text-gray-500" /> Báo cáo đã nộp
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                2/3 <span className="text-sm font-normal text-gray-500">yêu cầu</span>
              </p>
              <Link href="#" className="mt-2 text-xs font-medium text-[#8093FF] hover:underline">
                Xem báo cáo
              </Link>
            </div>

            <div className="flex flex-col justify-center rounded-xl border border-red-100 bg-white p-5 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-bold text-red-500">
                <CalendarIcon className="h-4 w-4" /> Hạn chót tiếp theo
              </p>
              <p className="mt-2 text-lg font-bold text-red-500">Ngày 15 tháng 8, 2025</p>
              <Link href="#" className="mt-2 text-xs font-medium text-[#8093FF] hover:underline">
                Xem chi tiết
              </Link>
            </div>
          </div>

          {/* Section 3: Bottom Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Banner */}
            <div className="relative col-span-2 overflow-hidden rounded-xl bg-[#E6EAFB] p-8">
              <div className="relative z-10 w-2/3">
                <h3 className="text-xl font-bold text-gray-900">Hành trình thực tập của bạn</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Đừng quên nộp báo cáo tiến độ hàng tuần để Giảng viên hướng dẫn theo dõi.
                </p>
                <Link
                  href="/student/progress"
                  className="mt-6 inline-block rounded-lg bg-[#8093FF] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 shadow-sm"
                >
                  Nộp báo cáo ngay
                </Link>
              </div>
              {/* Note: Xuất hình sinh viên ngồi máy tính từ Figma và chèn vào đây */}
              <div className="absolute -bottom-4 right-0 z-0 h-48 w-48">
                {/*  Bỏ comment phần này khi đã có hình
                  <Image
                    src="/img/student-laptop.png"
                    alt="Student"
                    fill
                    className="object-contain"
                  />
                */}
              </div>
            </div>

            {/* Quick Links */}
            <div className="col-span-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-bold text-gray-900">Liên kết nhanh</h3>
              <div className="flex flex-col gap-1">
                <Link
                  href="#"
                  className="flex items-center justify-between rounded-lg p-2 text-gray-700 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <CloudArrowUpIcon className="h-5 w-5 text-gray-500" />{' '}
                    <span className="text-sm font-medium">Tải tài liệu lên</span>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                </Link>
                <Link
                  href="#"
                  className="flex items-center justify-between rounded-lg p-2 text-gray-700 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-5 w-5 text-gray-500" />{' '}
                    <span className="text-sm font-medium">Liên hệ người giám sát</span>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                </Link>
                <Link
                  href="#"
                  className="flex items-center justify-between rounded-lg p-2 text-gray-700 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <BookOpenIcon className="h-5 w-5 text-gray-500" />{' '}
                    <span className="text-sm font-medium">Hướng dẫn thực tập</span>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                </Link>
                <Link
                  href="#"
                  className="flex items-center justify-between rounded-lg p-2 text-gray-700 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <QuestionMarkCircleIcon className="h-5 w-5 text-gray-500" />{' '}
                    <span className="text-sm font-medium">Câu hỏi thường gặp</span>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
