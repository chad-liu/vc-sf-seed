'use client';
import { useState, useEffect, useRef } from 'react';

const CLASS_TYPES = ['-', '運動類', '音樂類', '美術類', '舞蹈戲劇類', '知識科學類', '語文類', '其他'];
const FEE_TYPES = ['1.授課鐘點費', '2.材料費', '3.交通費', '4.其他'];

interface Apply {
  school: string;
  classtype: string;
  purpose: string;
  content: string;
  activetime: string;
  activeobj: string;
  objnum: number | null;
  weaknum: number | null;
  teacher: string;
  remark: string;
  planurl: string | null;
  planupdate: string | null;
}

const EMPTY_APPLY: Apply = {
  school: '', classtype: '', purpose: '', content: '', activetime: '',
  activeobj: '', objnum: null, weaknum: null, teacher: '', remark: '',
  planurl: null, planupdate: null,
};

interface DetailRow {
  id: number;
  feetype: string;
  item: string;
  unitprice: number | '';
  amount: number | '';
  unit: string;
  description: string;
}

const input = 'w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white';
const th = 'border border-gray-300 bg-blue-500 text-white px-2 py-2 text-sm font-bold';
const td = 'border border-gray-300 bg-blue-50 px-2 py-1.5 text-sm align-middle';

export default function ApplyForm() {
  const [form, setForm] = useState<Apply>(EMPTY_APPLY);
  const [rows, setRows] = useState<DetailRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState('');
  const [detailMsg, setDetailMsg] = useState('');
  const [uploadMsg, setUploadMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/apply').then(r => r.json()).then(data => {
      if (!data.error) setForm({ ...EMPTY_APPLY, ...data });
      setLoaded(true);
    });
    fetch('/api/apply/details').then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        setRows(data.map(r => ({
          id: r.id,
          feetype: r.feetype ?? '',
          item: r.item ?? '',
          unitprice: r.unitprice ?? '',
          amount: r.amount ?? '',
          unit: r.unit ?? '',
          description: r.description ?? '',
        })));
      }
    });
  }, []);

  const set = (name: keyof Apply) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm(prev => ({ ...prev, [name]: e.target.value }));
  };

  // ---- 1. 申請資料 ----
  const handleSaveApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const res = await fetch('/api/apply', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setMsg(data.error ? `錯誤：${data.error}` : '申請資料已儲存');
    setSaving(false);
  };

  // ---- 2. 檔案上傳 ----
  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setUploadMsg('錯誤：請先選擇 PDF 檔案');
      return;
    }
    setUploading(true);
    setUploadMsg('');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/apply/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.error) {
      setUploadMsg(`錯誤：${data.error}`);
    } else {
      setForm(prev => ({ ...prev, planurl: data.planurl, planupdate: data.planupdate }));
      setUploadMsg('檔案上傳成功');
      if (fileRef.current) fileRef.current.value = '';
    }
    setUploading(false);
  };

  // ---- 3. 經費預算 ----
  const setRow = (i: number, name: keyof DetailRow, value: string) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [name]: value } : r));
  };

  // 新增即建立一筆資料庫紀錄，取得 id 後加入 grid
  const addRow = async () => {
    setDetailMsg('');
    const res = await fetch('/api/apply/details', { method: 'POST' });
    const data = await res.json();
    if (data.error) {
      setDetailMsg(`錯誤：${data.error}`);
      return;
    }
    setRows(prev => [...prev, {
      id: data.id,
      feetype: data.feetype ?? FEE_TYPES[0],
      item: '', unitprice: '', amount: '', unit: '', description: '',
    }]);
  };

  const removeRow = async (i: number) => {
    setDetailMsg('');
    const res = await fetch(`/api/apply/details/${rows[i].id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.error) {
      setDetailMsg(`錯誤：${data.error}`);
      return;
    }
    setRows(prev => prev.filter((_, idx) => idx !== i));
  };

  const rowTotal = (r: DetailRow) =>
    r.unitprice !== '' && r.amount !== '' ? Number(r.unitprice) * Number(r.amount) : 0;

  const grandTotal = rows.reduce((sum, r) => sum + rowTotal(r), 0);

  const handleSaveDetails = async () => {
    setSaving(true);
    setDetailMsg('');
    const results = await Promise.all(rows.map(r =>
      fetch(`/api/apply/details/${r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(r),
      }).then(res => res.json())
    ));
    const failed = results.find(d => d.error);
    setDetailMsg(failed ? `錯誤：${failed.error}` : '經費預算已儲存');
    setSaving(false);
  };

  if (!loaded) return <p className="text-sm text-gray-500">載入中...</p>;

  const field = (
    label: string,
    name: keyof Apply,
    opts: { placeholder?: string; type?: string } = {}
  ) => (
    <div className="flex items-center gap-2 mb-3">
      <label className="w-40 text-sm text-gray-700 text-right flex-shrink-0">{label}</label>
      <input
        type={opts.type ?? 'text'}
        value={form[name] ?? ''}
        onChange={set(name)}
        placeholder={opts.placeholder}
        className={input}
      />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8">
      {/* 1. 申請資料 */}
      <form onSubmit={handleSaveApply} className="bg-blue-50 rounded-lg p-6">
        <h2 className="inline-block bg-blue-600 text-white text-base font-bold px-3 py-1 rounded mb-4">
          申請資料
        </h2>
        <div className="flex items-center gap-2 mb-3">
          <label className="w-40 text-sm text-gray-700 text-right flex-shrink-0">學校簡稱</label>
          <input value={form.school} readOnly className={`${input} bg-gray-100`} />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <label className="w-40 text-sm text-gray-700 text-right flex-shrink-0">開班類別</label>
          <select value={form.classtype ?? ''} onChange={set('classtype')} className={input}>
            {CLASS_TYPES.map(t => <option key={t} value={t === '-' ? '' : t}>{t}</option>)}
          </select>
        </div>
        {field('申請目的', 'purpose', { placeholder: '(50字以內)' })}
        {field('課程內容', 'content', { placeholder: '(例如棒球、攝影)' })}
        {field('活動時段', 'activetime')}
        {field('參加對象', 'activeobj')}
        {field('受惠總人數', 'objnum', { type: 'number' })}
        {field('其中弱勢學生人數', 'weaknum', { type: 'number' })}
        {field('指導老師', 'teacher')}
        {field('備註', 'remark', { placeholder: '(第2個以上班別，請在此註明"00類00班/社/隊)' })}
        {msg && <p className={`text-sm mb-2 ml-42 ${msg.startsWith('錯誤') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
        <div className="ml-42">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? '儲存中...' : '儲存'}
          </button>
        </div>
      </form>

      {/* 2. 授課規劃-檔案上傳 */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="inline-block bg-blue-600 text-white text-base font-bold px-3 py-1 rounded mb-4">
          授課規劃-檔案上傳
        </h2>
        <ol className="list-decimal pl-6 text-sm text-gray-700 space-y-1 mb-4">
          <li>請說明貴校種子學堂預計規劃哪些課程，如何進行。</li>
          <li>沒有一定的格式，頁數不限。</li>
          <li>完成後請存成 pdf 檔，上傳後，本系統會依據貴校編號自動更改檔名。</li>
          <li>如果要修改內容，只要重新上傳正確的檔案，新的檔案就會自動覆蓋舊的檔案。</li>
        </ol>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="file" ref={fileRef} accept="application/pdf,.pdf"
            className="text-sm file:mr-3 file:px-4 file:py-2 file:rounded file:border-0 file:bg-blue-600 file:text-white file:text-sm file:cursor-pointer" />
          <button onClick={handleUpload} disabled={uploading}
            className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
            {uploading ? '上傳中...' : '上傳'}
          </button>
        </div>
        {form.planurl && (
          <p className="text-sm text-gray-700 mt-3">
            已上傳檔案：
            <a href={`${form.planurl}?t=${Date.now()}`} target="_blank" rel="noopener noreferrer"
              className="text-blue-700 underline">
              檢視授課規劃 PDF
            </a>
            {form.planupdate && <span className="text-gray-500 ml-2">(上傳日期：{form.planupdate})</span>}
          </p>
        )}
        {uploadMsg && <p className={`text-sm mt-2 ${uploadMsg.startsWith('錯誤') ? 'text-red-600' : 'text-green-600'}`}>{uploadMsg}</p>}
      </div>

      {/* 3. 經費預算 */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="inline-block bg-blue-600 text-white text-base font-bold px-3 py-1 rounded mb-4">
          經費預算
        </h2>
        <div className="overflow-x-auto">
          <table className="border-collapse w-full">
            <thead>
              <tr>
                <th className={`${th} w-36`}>費用類別</th>
                <th className={th}>項目</th>
                <th className={`${th} w-24`}>單價</th>
                <th className={`${th} w-20`}>數量</th>
                <th className={`${th} w-20`}>單位</th>
                <th className={`${th} w-24`}>小計</th>
                <th className={th}>說明</th>
                <th className={`${th} w-16`}></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className={`${td} text-center text-gray-500`}>
                    尚無資料，請按「新增」加入經費項目
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td className={td}>
                    <select value={r.feetype} onChange={e => setRow(i, 'feetype', e.target.value)} className={input}>
                      {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className={td}>
                    <input value={r.item} onChange={e => setRow(i, 'item', e.target.value)} className={input} />
                  </td>
                  <td className={td}>
                    <input type="number" value={r.unitprice} onChange={e => setRow(i, 'unitprice', e.target.value)} className={input} />
                  </td>
                  <td className={td}>
                    <input type="number" value={r.amount} onChange={e => setRow(i, 'amount', e.target.value)} className={input} />
                  </td>
                  <td className={td}>
                    <input value={r.unit} onChange={e => setRow(i, 'unit', e.target.value)} className={input} />
                  </td>
                  <td className={`${td} text-right`}>{rowTotal(r).toLocaleString()}</td>
                  <td className={td}>
                    <input value={r.description} onChange={e => setRow(i, 'description', e.target.value)}
                      placeholder="50字內" className={input} />
                  </td>
                  <td className={`${td} text-center`}>
                    <button onClick={() => removeRow(i)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className={`${td} text-right font-bold`}>合計</td>
                <td className={`${td} text-right font-bold`}>{grandTotal.toLocaleString()}</td>
                <td colSpan={2} className={td}></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={addRow}
            className="bg-green-600 text-white px-6 py-2 rounded text-sm hover:bg-green-700">
            新增
          </button>
          <button onClick={handleSaveDetails} disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? '儲存中...' : '儲存'}
          </button>
          {detailMsg && <span className={`text-sm ${detailMsg.startsWith('錯誤') ? 'text-red-600' : 'text-green-600'}`}>{detailMsg}</span>}
        </div>
      </div>
    </div>
  );
}
