'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api-client';

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setSuccessMessage('Đổi mật khẩu thành công! Đang chuyển về trang đăng nhập...');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Xóa phiên đăng nhập cũ và chuyển hướng về /login sau 1.5 giây
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        router.push('/login');
      }, 1500);
    } catch (err: unknown) {
      console.error(err);
      const errorResponse = err as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      };
      const message =
        errorResponse?.response?.data?.message ||
        errorResponse?.message ||
        'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.';
      setErrorMessage(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

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
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-100">
                {successMessage}
              </div>
            )}

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
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 py-3.5 pl-12 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition"
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
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
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 py-3.5 pl-12 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition"
                  placeholder="Nhập mật khẩu mới"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
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
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 py-3.5 pl-12 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition"
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
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
                  window.history.back();
                }}
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-[#8093FF] py-3 text-center text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
