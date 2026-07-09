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
      <p className="text-sm mt-4">
        <a
          href="https://drive.google.com/file/d/1Nk5NGC2V8-JLrG2AUBKa5jBNwjXmsXFq/view"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 underline"
        >
          115 學年度「三花菁英種子學堂」實施計畫
        </a>
      </p>
      <p className="text-sm text-gray-800 mt-2">
        活動聯絡人：劉老師{' '}
        <a href="mailto:wentzu@lhes.tp.edu.tw" className="text-blue-700 underline">
          wentzu@lhes.tp.edu.tw
        </a>
      </p>
    </div>
  );
}
