'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [cities, setCities] = useState<string[]>([]);
  const [schools, setSchools] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [school, setSchool] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/cities').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setCities(data);
    });
  }, []);

  const handleCityChange = (c: string) => {
    setCity(c);
    setSchool('');
    setSchools([]);
    setError('');
    if (!c) return;
    fetch(`/api/schools?city=${encodeURIComponent(c)}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setSchools(data);
      });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, school, password }),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setLoading(false);
      return;
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden">
        <div className="bg-blue-800 text-white text-center py-4">
          <h1 className="text-lg font-bold">三花菁英種子學堂</h1>
          <p className="text-xs text-blue-200 mt-1">學校登入</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">縣市</label>
              <select
                value={city}
                onChange={e => handleCityChange(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              >
                <option value="">請選擇縣市</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">學校</label>
              <select
                value={school}
                onChange={e => { setSchool(e.target.value); setError(''); }}
                required
                disabled={!city}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white disabled:bg-gray-100"
              >
                <option value="">請選擇學校</option>
                {schools.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">密碼</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="沿用舊網站密碼"
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '登入中...' : '登入'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
