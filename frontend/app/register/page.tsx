// frontend/app/register/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { InformationCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function RegisterNoticePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-gray-100 text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/img/sims_logo_concept_01 3.png"
            alt="SIMS Logo"
            width={140}
            height={50}
            className="h-auto w-auto"
          />
        </div>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#8093FF]">
          <InformationCircleIcon className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký tài khoản</h1>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Hệ thống không mở đăng ký tự do. Mọi tài khoản Sinh viên, Giảng viên và Cán bộ đều được <strong>Quản trị viên / Cán bộ Khoa</strong> tạo và phân quyền trực tiếp.
        </p>

        <div className="bg-gray-50 rounded-2xl p-4 text-xs text-gray-500 mb-6 text-left">
          <p className="font-semibold text-gray-700 mb-1">Cần hỗ trợ?</p>
          <p>Vui lòng liên hệ Văn phòng Khoa hoặc Giảng viên phụ trách môn học để nhận thông tin tài khoản đăng nhập.</p>
        </div>

        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#8093FF] py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-100 hover:opacity-90 transition"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Quay lại Đăng nhập
        </Link>
      </div>
    </main>
  );
}
