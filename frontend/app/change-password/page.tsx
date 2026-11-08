'use client';
import Image from 'next/image';
import Link from 'next/link';
import { LockClosedIcon, EyeIcon, KeyIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] px-4 py-12">
      {/* Form Container */}
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-xl">
        {/* Header Section */}
        <div className="bg-[#2A1E5C] px-8 py-10 text-center relative overflow-hidden">
          {/* Background pattern nhẹ cho header */}
          <div className="absolute inset-0 opacity-10 bg-[url('/img/sims_logo_concept_01 3.png')] bg-cover bg-center"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <KeyIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Đổi mật khẩu</h2>
            <p className="mt-2 text-sm text-indigo-200">
              Vui lòng nhập mật khẩu hiện tại và mật khẩu mới để bảo mật tài khoản của bạn.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <form className="space-y-6">
            {/* Input: Mật khẩu hiện tại */}
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  className="w-full rounded-xl border border-gray-200 py-3.5 pl-12 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition"
                  placeholder="Nhập mật khẩu hiện tại"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Đường kẻ phân cách */}
            <hr className="border-gray-100" />

            {/* Input: Mật khẩu mới */}
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <LockClosedIcon className="h-5 w-5 text-[#8093FF]" />
                </div>
                <input
                  type="password"
                  className="w-full rounded-xl border border-gray-200 py-3.5 pl-12 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition"
                  placeholder="Nhập mật khẩu mới"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Mật khẩu phải dài tối thiểu 8 ký tự, bao gồm chữ và số.
              </p>
            </div>

            {/* Input: Xác nhận mật khẩu mới */}
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <CheckBadgeIcon className="h-5 w-5 text-[#8093FF]" />
                </div>
                <input
                  type="password"
                  className="w-full rounded-xl border border-gray-200 py-3.5 pl-12 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition"
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex items-center gap-4 pt-4">
              <Link
                href="#"
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                onClick={(e) => {
                  e.preventDefault();
                  window.history.back(); // Nút Hủy tự động quay lại trang trước đó
                }}
              >
                Hủy
              </Link>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#8093FF] py-3 text-center text-sm font-medium text-white shadow-sm transition hover:opacity-90"
              >
                Cập nhật
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
