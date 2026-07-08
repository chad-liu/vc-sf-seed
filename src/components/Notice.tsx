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

  if (loading) return <p className="text-sm text-gray-500">載入中...</p>;
  if (items.length === 0) return <p className="text-sm text-gray-500">目前沒有注意事項。</p>;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-3xl">
      <h2 className="text-base font-bold text-gray-800 mb-4">注意事項</h2>
      <ul className="list-disc pl-5 space-y-2">
        {items.map(item => (
          <li key={item.id} className="text-sm text-gray-800 leading-relaxed">{item.news}</li>
        ))}
      </ul>
    </div>
  );
}
