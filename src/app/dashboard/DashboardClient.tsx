'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Notice from '@/components/Notice';
import SchoolEditForm from '@/components/SchoolEditForm';
import ApplyForm from '@/components/ApplyForm';
import ActiveForm from '@/components/ActiveForm';

type Tab = 'notice' | 'profile' | 'apply' | 'first' | 'second';

const TABS: { key: Tab; label: string }[] = [
  { key: 'notice', label: '公告及注意事項' },
  { key: 'profile', label: '學校資料編輯' },
  { key: 'apply', label: '申請作業' },
  { key: 'first', label: '上學期成果' },
  { key: 'second', label: '下學期成果' },
];

interface Props {
  school: string;
  city: string;
}

export default function DashboardClient({ school, city }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('notice');

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const tabClass = (t: Tab) =>
    `px-5 py-2 text-sm font-medium rounded-t-md border-t border-l border-r transition-colors ${
      tab === t
        ? 'bg-white text-blue-700 border-gray-300 border-b-white -mb-px relative z-10'
        : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
    }`;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0E1D49] text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <a href="https://sunflower.org.tw/" target="_blank" rel="noopener noreferrer" className="mr-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://gaotxzoxdcvottcohory.supabase.co/storage/v1/object/sign/sf_images/TopLogo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wY2ZjMjk2NS0yMDM3LTQyNWQtYjQ1My0zZTUwNDVmNGM2MzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzZl9pbWFnZXMvVG9wTG9nby5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzgzODY0NTMwLCJleHAiOjQ5MDU5Mjg1MzB9.2M0SOmdDFEl9f4Wp55VR-vWjSTEd3W2M3fWZLiIuK8w"
              alt="三花菁英種子學堂"
              className="h-4 w-auto"
            />
          </a>
          <span className="font-bold text-sm">三花菁英種子學堂</span>
          <span className="ml-3 text-xs bg-blue-600 px-2 py-0.5 rounded">{city} {school}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleLogout}
            className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded">
            登出
          </button>
          <a href="https://chad-liu.github.io/Sunflower/#" target="_blank" rel="noopener noreferrer"
            className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded">
            到活動首頁
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="flex gap-1 border-b border-gray-300">
          {TABS.map(t => (
            <button key={t.key} className={tabClass(t.key)} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-5">
        {tab === 'notice' && <Notice />}
        {tab === 'profile' && <SchoolEditForm />}
        {tab === 'apply' && <ApplyForm />}
        {tab === 'first' && <ActiveForm apiBase="/api/active1" term="上" />}
        {tab === 'second' && <ActiveForm apiBase="/api/active2" term="下" />}
      </div>
    </div>
  );
}
