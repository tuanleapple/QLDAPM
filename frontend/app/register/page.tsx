import Image from 'next/image';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
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
          width={140}
          height={50}
          className="object-contain"
          style={{ width: 'auto', height: 'auto' }}
        />
      </div>

      {/* Hình ảnh minh họa bên trái */}
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

      {/* Hình ảnh minh họa bên phải */}
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
      <div className="z-20 w-full max-w-[500px] rounded-[2rem] bg-white p-10 shadow-2xl">
        {/* Header Form */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Chào mừng đến SIMS</p>
            <h1 className="mt-1 text-4xl font-bold text-gray-900">Đăng ký</h1>
          </div>
          <div className="text-right text-sm">
            <span className="text-gray-500">Đã có tài khoản?</span>
            <br />
            <Link href="/login" className="font-semibold text-[#8093FF] hover:underline">
              Đăng nhập
            </Link>
          </div>
        </div>

        <form className="space-y-5">
          {/* Input 1: Tên đăng nhập hoặc email */}
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

          {/* Input 2 & 3: Layout chia 2 cột */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">Tên đăng nhập</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF]"
                placeholder="Tên đăng nhập"
              />
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">Số điện thoại</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF]"
                placeholder="Số điện thoại"
              />
            </div>
          </div>

          {/* Input 4: Mật khẩu */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Mật khẩu</label>
            <input
              type="password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF]"
              placeholder="Mật khẩu"
            />
          </div>

          {/* Nút Đăng ký */}
          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-[#5040FF] py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
          >
            Đăng ký
          </button>
        </form>
      </div>
    </main>
  );
}
