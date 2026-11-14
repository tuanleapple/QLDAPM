'use client';

import { TrophyIcon, MagnifyingGlassIcon, TableCellsIcon } from '@heroicons/react/24/outline';

export default function ResultSummaryPage() {
  const resultData = [
    {
      id: 1,
      name: 'Nguyễn Chí Thanh',
      code: '2313079',
      enterpriseScore: 9.0,
      processScore: 8.5,
      reportScore: 9.0,
      total: 8.8,
      status: 'Đạt',
    },
    {
      id: 2,
      name: 'Huỳnh Võ Quốc Thắng',
      code: '2313080',
      enterpriseScore: 8.0,
      processScore: 7.5,
      reportScore: 8.0,
      total: 7.8,
      status: 'Đạt',
    },
    {
      id: 3,
      name: 'Trần Đăng Minh',
      code: '2313105',
      enterpriseScore: 4.0,
      processScore: 5.0,
      reportScore: 4.5,
      total: 4.5,
      status: 'Không Đạt',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng hợp kết quả thực tập</h1>
          <p className="mt-1 text-sm text-gray-500">Danh sách điểm tổng kết chốt sổ từ hệ thống</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 transition">
          <TableCellsIcon className="h-5 w-5" />
          Xuất file Excel báo cáo
        </button>
      </div>

      <div className="rounded-[2rem] border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 p-6 flex items-center justify-between bg-white">
          <div className="relative w-full max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            {/* Đã sửa text-black và font-medium ở input này */}
            <input
              type="text"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-11 pr-4 text-sm text-black font-medium placeholder:text-gray-400 placeholder:font-normal focus:border-[#8093FF] focus:outline-none focus:ring-1 focus:ring-[#8093FF]"
              placeholder="Tìm kiếm theo MSSV hoặc Tên..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-700">
              <tr>
                <th className="px-6 py-4">Sinh viên</th>
                <th className="px-6 py-4 text-center">
                  Điểm DN
                  <br />
                  (Weight: 30%)
                </th>
                <th className="px-6 py-4 text-center">
                  Điểm QT GVHD
                  <br />
                  (Weight: 20%)
                </th>
                <th className="px-6 py-4 text-center">
                  Điểm BC GVHD
                  <br />
                  (Weight: 50%)
                </th>
                <th className="px-6 py-4 text-center text-indigo-700">Tổng điểm</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {resultData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{row.name}</p>
                    <p className="text-xs text-gray-500">{row.code}</p>
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-gray-700">
                    {row.enterpriseScore}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-gray-700">
                    {row.processScore}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-gray-700">
                    {row.reportScore}
                  </td>
                  <td className="px-6 py-4 text-center font-black text-[#8093FF] text-base">
                    {row.total}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border ${
                        row.status === 'Đạt'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {row.status === 'Đạt' ? <TrophyIcon className="h-3.5 w-3.5" /> : null}{' '}
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
