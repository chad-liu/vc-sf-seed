'use client';
import { useState, useEffect } from 'react';

const CLASS_TYPES = ['-', '運動類', '音樂類', '美術類', '舞蹈戲劇類', '知識科學類', '語文類', '其他'];

// 與 sf_apply 相對應、可由「從申請資料匯入」帶入的欄位
const IMPORT_FIELDS = [
  'classtype', 'purpose', 'content', 'activetime',
  'activeobj', 'objnum', 'weaknum', 'teacher',
] as const;

interface Active1 {
  year: string;
  school: string;
  classtype: string;
  purpose: string;
  content: string;
  activetime: string;
  activeobj: string;
  objnum: number | null;
  weaknum: number | null;
  teacher: string;
  special: string;
  youtubetitle: string;
  youtube: string;
  remark: string;
}

const EMPTY: Active1 = {
  year: '', school: '', classtype: '', purpose: '', content: '', activetime: '',
  activeobj: '', objnum: null, weaknum: null, teacher: '',
  special: '', youtubetitle: '', youtube: '', remark: '',
};

const input = 'w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1 border-t border-gray-400" />
      <h2 className="text-base font-bold text-gray-800">{children}</h2>
      <div className="flex-1 border-t border-gray-400" />
    </div>
  );
}

export default function Active1Form() {
  const [form, setForm] = useState<Active1>(EMPTY);
  const [saved, setSaved] = useState<Active1>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/active1').then(r => r.json()).then(data => {
      if (!data.error) {
        const p = { ...EMPTY, ...data };
        setForm(p);
        setSaved(p);
      }
      setLoaded(true);
    });
  }, []);

  const set = (name: keyof Active1) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [name]: e.target.value }));
  };

  const handleSave = async () => {
    setMsg('');
    setSaving(true);
    const res = await fetch('/api/active1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.error) {
      setMsg(`錯誤：${data.error}`);
    } else {
      setMsg('上學期成果已儲存');
      setSaved(form);
      setEditing(false);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setForm(saved);
    setEditing(false);
    setMsg('');
  };

  // 從 sf_apply 匯入相對應欄位，帶入表單後進入修改模式，按儲存才寫入
  const handleImport = async () => {
    setMsg('');
    const res = await fetch('/api/apply');
    const data = await res.json();
    if (data.error) {
      setMsg(`錯誤：${data.error}`);
      return;
    }
    setForm(prev => {
      const next = { ...prev };
      for (const f of IMPORT_FIELDS) {
        next[f] = (data[f] ?? '') as never;
      }
      return next;
    });
    setEditing(true);
    setMsg('已從申請資料匯入，請確認內容後按「儲存」');
  };

  if (!loaded) return <p className="text-sm text-gray-500">載入中...</p>;

  const roField = (label: string, value: string) => (
    <div className="flex items-center gap-2 mb-3">
      <label className="w-40 text-sm text-gray-700 text-right flex-shrink-0">{label}</label>
      {editing ? (
        <input value={value} readOnly className={`${input} bg-gray-100`} />
      ) : (
        <span className="flex-1 text-sm text-gray-900 px-2 py-1.5 border-b border-gray-300 min-h-8">{value}</span>
      )}
    </div>
  );

  const field = (
    label: string,
    name: keyof Active1,
    opts: { placeholder?: string; type?: string } = {}
  ) => (
    <div className="flex items-center gap-2 mb-3">
      <label className="w-40 text-sm text-gray-700 text-right flex-shrink-0">{label}</label>
      {editing ? (
        <input
          type={opts.type ?? 'text'}
          value={form[name] ?? ''}
          onChange={set(name)}
          placeholder={opts.placeholder}
          className={input}
        />
      ) : (
        <span className="flex-1 text-sm text-gray-900 px-2 py-1.5 border-b border-gray-300 min-h-8">
          {form[name] ?? ''}
        </span>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8">
      <div className="bg-blue-50 rounded-lg p-6">
        <SectionTitle>上學期成果</SectionTitle>
        {roField('學年度', form.year)}
        {roField('學校簡稱', form.school)}
        <div className="flex items-center gap-2 mb-3">
          <label className="w-40 text-sm text-gray-700 text-right flex-shrink-0">開班類別</label>
          {editing ? (
            <select value={form.classtype ?? ''} onChange={set('classtype')} className={input}>
              {CLASS_TYPES.map(t => <option key={t} value={t === '-' ? '' : t}>{t}</option>)}
            </select>
          ) : (
            <span className="flex-1 text-sm text-gray-900 px-2 py-1.5 border-b border-gray-300 min-h-8">{form.classtype ?? ''}</span>
          )}
        </div>
        {field('申請目的', 'purpose')}
        {field('課程內容', 'content')}
        {field('活動時段', 'activetime')}
        {field('參加對象', 'activeobj')}
        {field('受惠總人數', 'objnum', { type: 'number' })}
        {field('弱勢生受惠人數', 'weaknum', { type: 'number' })}
        {field('指導老師', 'teacher')}
        {field('特色事蹟', 'special')}
        {field('影片標題', 'youtubetitle')}
        {field('影片(YouTube連結)', 'youtube')}
        {field('備註', 'remark')}
        {msg && <p className={`text-sm mb-2 ml-42 ${msg.startsWith('錯誤') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
        <div className="ml-42 flex gap-2 flex-wrap">
          {editing ? (
            <>
              <button type="button" onClick={handleSave} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                {saving ? '儲存中...' : '儲存'}
              </button>
              <button type="button" onClick={handleCancel}
                className="bg-gray-400 text-white px-6 py-2 rounded text-sm hover:bg-gray-500">
                取消
              </button>
            </>
          ) : (
            <button type="button" onClick={() => { setEditing(true); setMsg(''); }}
              className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700">
              修改
            </button>
          )}
          <button type="button" onClick={handleImport}
            className="bg-green-600 text-white px-6 py-2 rounded text-sm hover:bg-green-700">
            從申請資料匯入
          </button>
        </div>
      </div>
    </div>
  );
}
