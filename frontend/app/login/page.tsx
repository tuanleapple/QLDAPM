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

      {/* Container của Form */}
      <div className="z-20 w-full max-w-[460px] rounded-[2rem] bg-white p-10 shadow-2xl">
        {/* Header Form */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-600">Chào mừng đến SIMS</p>
          <h1 className="mt-1 text-4xl font-bold text-gray-900">Đăng nhập</h1>
        </div>

        <form className="space-y-5">
          {/* Email Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF]"
              placeholder="Nhập địa chỉ email"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Mật khẩu</label>
            <div className="relative">
              <input
                type="password"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF]"
                placeholder="Nhập mật khẩu"
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
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          {/* Nút Đăng nhập chính */}
          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-[#8093FF] py-3 text-sm font-semibold text-white transition hover:opacity-90 shadow-md"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </main>
  );
}
