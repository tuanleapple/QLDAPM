import Image from 'next/image';
import Link from 'next/link';
import {
  Squares2X2Icon,
  DocumentTextIcon,
  UsersIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  PencilIcon,
  NoSymbolIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

// Dữ liệu mẫu cho bảng đơn đăng ký
const applicants = [
  {
    id: 1,
    name: 'Nguyễn Minh Trần',
    username: 'tranminh14',
    email: 'tranminh14@gmail.com',
    company: 'FPT Software',
    role: 'Lập trình viên Frontend',
    date: '11 tháng 7, 2025',
    status: 'Đã phê duyệt',
  },
  {
    id: 2,
    name: 'Nguyễn Thị Trinh',
    username: 'trinhthi15',
    email: 'trinhthi15@gmail.com',
    company: 'VNG Corporation',
    role: 'Lập trình viên Backend',
    date: '2 tháng 7, 2025',
    status: 'Đang chờ',
  },
  {
    id: 3,
    name: 'Phạm Thị Hương',
    username: 'huongpham156',
    email: 'huongpham156@gmail.com',
    company: 'Viettel Solutions',
    role: 'Thiết kế UI/UX',
    date: '3 tháng 7, 2025',
    status: 'Đã phê duyệt',
  },
  {
    id: 4,
    name: 'Nguyễn Minh Trí',
    username: 'triminh166',
    email: 'triminh166@gmail.com',
    company: 'TMA Solutions',
    role: 'Kỹ sư Đảm bảo chất lượng (QA)',
    date: '4 tháng 7, 2025',
    status: 'Đã phê duyệt',
  },
  {
    id: 5,
    name: 'Nguyễn Võ Thắng',
    username: 'thangvo67',
    email: 'thangvo67@gmail.com',
    company: 'FPT Software',
    role: 'Kỹ sư DevOps',
    date: '7 tháng 7, 2025',
    status: 'Đang chờ',
  },
  {
    id: 6,
    name: 'Bùi Trung Quân',
    username: 'quanbui12',
    email: 'quanbui12@gmail.com',
    company: 'Shopee Vietnam',
    role: 'Chuyên viên Phân tích Dữ liệu',
    date: '13 tháng 7, 2025',
    status: 'Đang chờ',
  },
  {
    id: 7,
    name: 'Phạm Lê Huỳnh',
    username: 'huynhphamhi',
    email: 'huynhphamhi@gmail.com',
    company: 'NashTech',
    role: 'Lập trình viên Di động',
    date: '18 tháng 7, 2025',
    status: 'Từ chối',
  },
];

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* ================= SIDEBAR ================= */}
      <aside className="flex w-[260px] flex-col bg-[#2A1E5C] text-white">
        {/* Logo */}
        <div className="flex h-20 items-center justify-center border-b border-[#3D3170]">
          {/* Thay logo trắng nếu có, tạm dùng chữ nếu chưa có logo trắng */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-white text-[#2A1E5C] font-bold">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider">SIMS</h1>
              <p className="text-[10px] text-gray-300">Student Internship</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg bg-[#5C4DFF] px-4 py-3 text-white transition"
          >
            <Squares2X2Icon className="h-5 w-5" />
            <span className="text-sm font-medium">Tổng quan hệ thống</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-[#3D3170] hover:text-white transition"
          >
            <DocumentTextIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Đơn đăng ký</span>
          </Link>

          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-[#3D3170] hover:text-white transition"
          >
            <UsersIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Người dùng</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-[#3D3170] hover:text-white transition"
          >
            <BuildingOfficeIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Công ty</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-[#3D3170] hover:text-white transition"
          >
            <BriefcaseIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Kỳ thực tập</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-[#3D3170] hover:text-white transition"
          >
            <ChartBarIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Báo cáo</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-[#3D3170] hover:text-white transition mt-4"
          >
            <Cog6ToothIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Cài đặt</span>
          </Link>
        </nav>

        {/* System Status Card */}
        <div className="p-4">
          <div className="rounded-xl border border-[#4C3E8C] bg-[#362A73] p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Tình trạng hoạt động của nền tảng</h4>
            </div>
            <p className="text-xs text-gray-300 mb-3">Tất cả hệ thống đang hoạt động bình thường</p>
            <Link href="#" className="text-xs font-medium text-blue-300 hover:underline">
              Xem trong thời hệ thống {'>'}
            </Link>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-20 items-center justify-between bg-white px-8 shadow-sm z-10">
          <div className="relative w-[400px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng, đơn đăng ký"
              className="h-10 w-full rounded-full border border-gray-300 bg-gray-50 pl-10 pr-4 text-sm focus:border-[#5C4DFF] focus:outline-none focus:ring-1 focus:ring-[#5C4DFF]"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 rounded-full bg-[#EEF2FF] px-4 py-1.5 border border-indigo-100">
              <CheckCircleIcon className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-medium text-indigo-600">
                Tất cả hệ thống đang hoạt động bình thường
              </span>
            </div>
            <button className="relative text-gray-500 hover:text-gray-700">
              <BellIcon className="h-6 w-6" />
              <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <div className="flex items-center gap-3 border-l pl-6">
              <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                A
              </div>
              <div className="flex flex-col cursor-pointer">
                <span className="text-sm font-bold text-gray-900">Quản trị viên</span>
                <span className="text-[10px] text-gray-500">Quản trị viên cấp cao v</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-5 gap-4">
            {/* Card 1 */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-600 mb-4">
                <UsersIcon className="h-5 w-5 text-emerald-500" /> Tổng người dùng
              </div>
              <div className="text-3xl font-extrabold text-gray-900 mb-2">1,248</div>
              <div className="text-xs text-gray-500">
                <span className="text-emerald-500 font-bold">↗ +12%</span> so với tháng trước
              </div>
            </div>
            {/* Card 2 */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-600 mb-4">
                <DocumentTextIcon className="h-5 w-5 text-gray-700" /> Đơn đăng ký
              </div>
              <div className="text-3xl font-extrabold text-gray-900 mb-2">632</div>
              <div className="text-xs text-gray-500">
                <span className="text-emerald-500 font-bold">↗ +5</span> so với tháng trước
              </div>
            </div>
            {/* Card 3 */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-600 mb-4">
                <ClockIcon className="h-5 w-5 text-orange-400" /> Đang chờ xem xét
              </div>
              <div className="text-3xl font-extrabold text-gray-900 mb-2">142</div>
              <div className="text-xs text-gray-500">
                <span className="text-emerald-500 font-bold">↗ +8.1%</span> so với tháng trước
              </div>
            </div>
            {/* Card 4 */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-600 mb-4">
                <CheckCircleIcon className="h-5 w-5 text-emerald-500" /> Đã phê duyệt
              </div>
              <div className="text-3xl font-extrabold text-gray-900 mb-2">490</div>
              <div className="text-xs text-gray-500">
                <span className="text-emerald-500 font-bold">↗ +18%</span> so với tháng trước
              </div>
            </div>
            {/* Card 5 */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-600 mb-4">
                <XCircleIcon className="h-5 w-5 text-red-500" /> Đã từ chối
              </div>
              <div className="text-3xl font-extrabold text-gray-900 mb-2">45</div>
              <div className="text-xs text-gray-500">
                <span className="text-red-500 font-bold">↘ -4.3%</span> so với tháng trước
              </div>
            </div>
          </div>

          {/* Data Table Section */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Table Toolbar */}
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <UsersIcon className="h-6 w-6 text-gray-700" /> Đơn đăng ký gần đây
              </h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, email, công ty..."
                    className="h-9 w-72 rounded-full border border-gray-300 pl-9 pr-4 text-sm focus:border-[#5C4DFF] focus:outline-none"
                  />
                </div>
                <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <AdjustmentsHorizontalIcon className="h-4 w-4" /> Bộ lọc
                </button>
                <button className="flex items-center gap-2 rounded-lg bg-[#5C4DFF] px-4 py-2 text-sm font-medium text-white hover:opacity-90 shadow-sm">
                  <PlusIcon className="h-4 w-4" /> Thêm đơn đăng ký
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-700">
                  <tr>
                    <th className="px-6 py-4">Họ tên</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Công ty</th>
                    <th className="px-6 py-4">Vị trí</th>
                    <th className="px-6 py-4">Ngày nộp đơn</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {applicants.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200">
                            {/* Placeholder avatar */}
                            <Image
                              src="/img/Saly-2.png"
                              alt=""
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{app.name}</p>
                            <p className="text-xs text-gray-500">{app.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{app.email}</td>
                      <td className="px-6 py-4">{app.company}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{app.role}</td>
                      <td className="px-6 py-4">{app.date}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold
                          ${
                            app.status === 'Đã phê duyệt'
                              ? 'bg-emerald-100 text-emerald-700'
                              : app.status === 'Đang chờ'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button className="rounded bg-gray-100 p-1.5 text-gray-500 hover:text-indigo-600">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button className="rounded bg-gray-100 p-1.5 text-gray-500 hover:text-red-600">
                            <NoSymbolIcon className="h-4 w-4" />
                          </button>
                          <button className="rounded bg-gray-100 p-1.5 text-gray-500 hover:text-emerald-600">
                            <UserGroupIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <span className="text-sm text-gray-500">
                Hiển thị từ 1 đến 7 trong tổng số 1,248 ứng viên
              </span>
              <div className="flex gap-1">
                <button className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50">
                  {'<'}
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded bg-[#5C4DFF] text-white">
                  1
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-100">
                  2
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-100">
                  3
                </button>
                <span className="flex h-8 w-8 items-center justify-center text-gray-500">...</span>
                <button className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-100">
                  179
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50">
                  {'>'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
