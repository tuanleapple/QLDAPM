import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Khai báo font Inter và bắt buộc tải bộ ký tự tiếng Việt
const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: 'SIMS - Hệ thống Quản lý Thực tập',
  description: 'Dự án quản lý thực tập sinh viên',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
