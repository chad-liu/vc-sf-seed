import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '三花菁英種子學堂',
  description: '三花菁英種子學堂 學校管理系統',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
