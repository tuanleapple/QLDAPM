// frontend/app/login/page.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { EyeIcon, EyeSlashIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email.trim(), password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50">
      {/* Background chia đôi */}
      <div className="absolute inset-0 z-0 flex w-full">
        <div className="w-1/2 bg-[#8093FF]"></div>
        <div className="w-1/2 bg-[#FCFAF8]"></div>
      </div>

      {/* Cụm Logo góc trái trên */}
      <div className="absolute left-8 top-8 z-20">
        <Image
          src="/img/sims_logo_concept_01 3.png"
          alt="SIMS Logo"
          width={150}
          height={50}
          priority
          className="object-contain h-auto w-auto"
        />
      </div>

      {/* Hình ảnh minh họa bên trái */}
      <div className="absolute left-[5%] top-1/2 z-10 hidden h-[500px] w-[400px] -translate-y-1/2 lg:block pointer-events-none">
        <Image
          src="/img/Saly-2.png"
          alt="Saly Illustration Left"
          fill
          sizes="(max-width: 1024px) 0vw, 400px"
          priority
          className="object-contain"
        />
      </div>

      {/* Hình ảnh minh họa bên phải */}
      <div className="absolute right-[5%] top-1/2 z-10 hidden h-[500px] w-[400px] -translate-y-1/2 lg:block pointer-events-none">
        <Image
          src="/img/Saly-3.png"
          alt="Saly Illustration Right"
          fill
          sizes="(max-width: 1024px) 0vw, 400px"
          className="object-contain"
        />
      </div>

      {/* Container Form */}
      <div className="z-20 w-full max-w-[480px] rounded-[2rem] bg-white p-10 shadow-2xl border border-gray-100">
        {/* Header Form */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-[#8093FF] uppercase tracking-wider">Hệ thống QL Đồ án & Thực tập</p>
          <h1 className="mt-1 text-3xl font-extrabold text-gray-900">Đăng nhập</h1>
        </div>

        {/* Thông báo về nguồn gốc tài khoản */}
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-blue-50 p-3.5 text-xs text-blue-800 border border-blue-100">
          <InformationCircleIcon className="h-5 w-5 flex-shrink-0 text-[#8093FF] mt-0.5" />
          <p>
            Tài khoản và mật khẩu được <strong>Nhà trường / Quản trị viên cấp phát</strong>. Sinh viên và Giảng viên vui lòng đăng nhập bằng email được cấp.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 p-3.5 text-sm font-medium text-red-700 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Email đăng nhập
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition"
              placeholder="VD: student@example.test"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm pr-11 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF] transition"
                placeholder="Nhập mật khẩu được cấp"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-xl bg-[#8093FF] py-3.5 text-sm font-bold text-white transition hover:opacity-90 shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>Đăng nhập</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-400">
          Gặp sự cố đăng nhập? Liên hệ Ban quản lý khoa để được cấp lại mật khẩu.
        </div>
      </div>
    </main>
  );
}
