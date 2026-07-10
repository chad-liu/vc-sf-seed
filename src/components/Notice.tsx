'use client';
import { useState, useEffect } from 'react';

interface NewsItem {
  id: number;
  news: string;
  created_at: string;
}

export default function Notice() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setItems(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-3xl">
      {loading ? (
        <p className="text-sm text-gray-500">載入中...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">目前沒有公告及注意事項。</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4">公告及注意事項</h2>
          <ul className="list-disc pl-5 space-y-2">
            {items.map(item => (
              <li key={item.id} className="text-sm text-gray-800 leading-relaxed">{item.news}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* 左欄：相關連結與聯絡人 */}
        <div>
          <p className="text-sm">
            <a
              href="https://drive.google.com/file/d/1Nk5NGC2V8-JLrG2AUBKa5jBNwjXmsXFq/view"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 underline"
            >
              115 學年度「三花菁英種子學堂」實施計畫
            </a>
          </p>
          <p className="text-sm mt-2">
            <a
              href="https://sunflower.org.tw/seedschool_intro.php"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 underline"
            >
              三花基金會官網的菁英種子學堂
            </a>
          </p>
          <p className="text-sm text-gray-800 mt-2">
            基金會聯絡人：劉老師{' '}
            <a href="mailto:wentzu@lhes.tp.edu.tw" className="text-blue-700 underline">
              wentzu@lhes.tp.edu.tw
            </a>
          </p>
        </div>

        {/* 右欄：學校網站放置 logo 說明 */}
        <div>
          <p className="text-sm text-gray-800">請於學校網站首頁明顯處放置「三花菁英種子學堂」logo</p>
          <img
            src="https://gaotxzoxdcvottcohory.supabase.co/storage/v1/object/sign/sf_images/sf_logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wY2ZjMjk2NS0yMDM3LTQyNWQtYjQ1My0zZTUwNDVmNGM2MzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzZl9pbWFnZXMvc2ZfbG9nby5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzgzNjUwMzUzLCJleHAiOjQ5MDU3MTQzNTN9.avIPdvZQJbrf5DwxVurMmxNRxHVEvQLGqVhxZxJbJ_g"
            alt="三花菁英種子學堂 logo"
            className="mt-2 w-3/5 h-auto"
          />
        </div>
      </div>
    </div>
  );
}
