import Image from 'next/image';
import Link from 'next/link';
import { EyeIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      {/* Background chia đôi: Nửa trái màu xanh #8093FF, nửa phải trắng */}
      <div className="absolute inset-0 z-0 flex w-full">
        <div className="w-1/2 bg-[#8093FF]"></div>
        <div className="w-1/2 bg-[#FCFAF8]"></div>
      </div>

      {/* Cụm Logo góc trái trên */}
      <div className="absolute left-8 top-8 z-20">
        <Image
          src="/img/sims_logo_concept_01 3.png"
          alt="SIMS Logo"
          width={140}
          height={50}
          className="object-contain"
          style={{ width: 'auto', height: 'auto' }}
        />
      </div>

      {/* Hình ảnh minh họa bên trái (Saly-2 chạy xe) */}
      <div className="absolute left-[5%] top-1/2 z-10 hidden h-[500px] w-[400px] -translate-y-1/2 lg:block">
        <Image
          src="/img/Saly-2.png"
          alt="Saly Illustration Left"
          fill
          sizes="(max-width: 1024px) 0vw, 400px"
          priority
          className="object-contain"
        />
      </div>

      {/* Hình ảnh minh họa bên phải (Saly-3 lơ lửng) */}
      <div className="absolute right-[5%] top-1/2 z-10 hidden h-[500px] w-[400px] -translate-y-1/2 lg:block">
        <Image
          src="/img/Saly-3.png"
          alt="Saly Illustration Right"
          fill
          sizes="(max-width: 1024px) 0vw, 400px"
          className="object-contain"
        />
      </div>

      {/* Container của Form (Màu trắng, bo góc lớn) */}
      <div className="z-20 w-full max-w-[460px] rounded-[2rem] bg-white p-10 shadow-2xl">
        {/* Header Form */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Chào mừng đến SIMS</p>
            <h1 className="mt-1 text-4xl font-bold text-gray-900">Đăng nhập</h1>
          </div>
          <div className="text-right text-sm">
            <span className="text-gray-500">Chưa có tài khoản ?</span>
            <br />
            <Link href="/register" className="font-semibold text-[#8093FF] hover:underline">
              Đăng ký
            </Link>
          </div>
        </div>

        <form className="space-y-5">
          {/* Email / Username Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tên đăng nhập hoặc email
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF]"
              placeholder="Tên đăng nhập hoặc email"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Mật khẩu</label>
            <div className="relative">
              <input
                type="password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF]"
                placeholder="Mật khẩu"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 text-right">
              <Link href="#" className="text-xs font-medium text-[#8093FF] hover:underline">
                Quên mật khẩu
              </Link>
            </div>
          </div>

          {/* Nút Đăng nhập chính */}
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-[#8093FF] py-3 text-sm font-semibold text-white transition hover:opacity-90 shadow-md"
          >
            Đăng nhập
          </button>

          {/* Đường kẻ HOẶC */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute w-full border-t border-gray-200"></div>
            <span className="relative z-10 bg-white px-3 text-xs font-medium text-gray-400">
              HOẶC
            </span>
          </div>

          {/* Khu vực Social Login */}
          <div className="flex gap-4">
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#F0F2FF] px-4 py-2.5 text-sm font-semibold text-[#8093FF] transition hover:bg-blue-100"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Đăng nhập với google
            </button>
            <button
              type="button"
              className="flex items-center justify-center rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-[#1877F2] shadow-sm transition hover:bg-gray-100"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </button>
            <button
              type="button"
              className="flex items-center justify-center rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-gray-900 shadow-sm transition hover:bg-gray-100"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.001 2.002C6.478 2.002 2 6.48 2 12.002c0 5.523 4.478 10 10 10 5.522 0 10-4.477 10-10 0-5.522-4.478-10-10-10zm-.058 17.513c-4.148 0-7.51-3.362-7.51-7.513s3.362-7.513 7.51-7.513c4.148 0 7.51 3.362 7.51 7.513s-3.362 7.513-7.51 7.513z" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
