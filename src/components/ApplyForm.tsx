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
  downloadname: string | null;
  planupdate: string | null;
}

const EMPTY_APPLY: Apply = {
  school: '', classtype: '', purpose: '', content: '', activetime: '',
  activeobj: '', objnum: null, weaknum: null, teacher: '', remark: '',
  planurl: null, downloadname: null, planupdate: null,
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1 border-t border-gray-400" />
      <h2 className="text-base font-bold text-gray-800">{children}</h2>
      <div className="flex-1 border-t border-gray-400" />
    </div>
  );
}
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
  const [editingId, setEditingId] = useState<number | null>(null);
  // 申請資料唯讀/修改模式；saved 保存最後一次儲存的內容，供取消時還原
  const [editingApply, setEditingApply] = useState(false);
  const [savedApply, setSavedApply] = useState<Apply>(EMPTY_APPLY);
  // PDF 檢視連結的 cache-busting 時間戳（避免 CDN 快取顯示舊檔）
  const [planTs, setPlanTs] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/apply').then(r => r.json()).then(data => {
      if (!data.error) {
        const p = { ...EMPTY_APPLY, ...data };
        setForm(p);
        setSavedApply(p);
      }
      setPlanTs(Date.now());
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
  const handleSaveApply = async () => {
    setSaving(true);
    setMsg('');
    const res = await fetch('/api/apply', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.error) {
      setMsg(`錯誤：${data.error}`);
    } else {
      setMsg('申請資料已儲存');
      setSavedApply(form);
      setEditingApply(false);
    }
    setSaving(false);
  };

  const handleCancelApply = () => {
    setForm(prev => ({ ...savedApply, planurl: prev.planurl, downloadname: prev.downloadname, planupdate: prev.planupdate }));
    setEditingApply(false);
    setMsg('');
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
      setForm(prev => ({ ...prev, planurl: data.planurl, downloadname: data.downloadname, planupdate: data.planupdate }));
      setPlanTs(Date.now());
      setUploadMsg('檔案上傳成功');
      if (fileRef.current) fileRef.current.value = '';
    }
    setUploading(false);
  };

  // ---- 3. 經費預算 ----
  const setRow = (i: number, name: keyof DetailRow, value: string) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [name]: value } : r));
  };

  // 新增即建立一筆資料庫紀錄，取得 id 後加入 grid 並直接進入修改模式
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
    setEditingId(data.id);
  };

  const removeRow = async (i: number) => {
    setDetailMsg('');
    const res = await fetch(`/api/apply/details/${rows[i].id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.error) {
      setDetailMsg(`錯誤：${data.error}`);
      return;
    }
    if (editingId === rows[i].id) setEditingId(null);
    setRows(prev => prev.filter((_, idx) => idx !== i));
  };

  const rowTotal = (r: DetailRow) =>
    r.unitprice !== '' && r.amount !== '' ? Number(r.unitprice) * Number(r.amount) : 0;

  const grandTotal = rows.reduce((sum, r) => sum + rowTotal(r), 0);

  const handleSaveRow = async (i: number) => {
    setSaving(true);
    setDetailMsg('');
    const res = await fetch(`/api/apply/details/${rows[i].id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows[i]),
    });
    const data = await res.json();
    if (data.error) {
      setDetailMsg(`錯誤：${data.error}`);
    } else {
      setDetailMsg('已儲存');
      setEditingId(null);
    }
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
      {editingApply ? (
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
      <p className="text-sm text-red-400 text-center">7/31前將申請資料和經費預算輸入齊全、課程規劃檔案上傳，視為申請完成。</p>

      {/* 1. 申請資料：預設唯讀，按「修改」進入編輯模式 */}
      <div className="bg-blue-50 rounded-lg p-6">
        <SectionTitle>申請資料</SectionTitle>
        <div className="flex items-center gap-2 mb-3">
          <label className="w-40 text-sm text-gray-700 text-right flex-shrink-0">學校簡稱</label>
          {editingApply ? (
            <input value={form.school} readOnly className={`${input} bg-gray-100`} />
          ) : (
            <span className="flex-1 text-sm text-gray-900 px-2 py-1.5 border-b border-gray-300 min-h-8">{form.school}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mb-3">
          <label className="w-40 text-sm text-gray-700 text-right flex-shrink-0">開班類別</label>
          {editingApply ? (
            <select value={form.classtype ?? ''} onChange={set('classtype')} className={input}>
              {CLASS_TYPES.map(t => <option key={t} value={t === '-' ? '' : t}>{t}</option>)}
            </select>
          ) : (
            <span className="flex-1 text-sm text-gray-900 px-2 py-1.5 border-b border-gray-300 min-h-8">{form.classtype ?? ''}</span>
          )}
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
        <div className="ml-42 flex gap-2">
          {editingApply ? (
            <>
              <button type="button" onClick={handleSaveApply} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                {saving ? '儲存中...' : '儲存'}
              </button>
              <button type="button" onClick={handleCancelApply}
                className="bg-gray-400 text-white px-6 py-2 rounded text-sm hover:bg-gray-500">
                取消
              </button>
            </>
          ) : (
            <button type="button" onClick={() => { setEditingApply(true); setMsg(''); }}
              className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700">
              修改
            </button>
          )}
        </div>
      </div>

      {/* 2. 授課規劃-檔案上傳 */}
      <div className="bg-blue-50 rounded-lg p-6">
        <SectionTitle>授課規劃-檔案上傳</SectionTitle>
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
          {form.planupdate ? (
            <span className="text-sm text-gray-700">上傳日期：{form.planupdate}</span>
          ) : (
            <span className="text-sm text-gray-500">尚未上傳檔案</span>
          )}
        </div>
        {form.planurl && (
          <p className="text-sm text-gray-700 mt-3">
            已上傳檔案：
            <a href={`${form.planurl}?download=${encodeURIComponent(form.downloadname ?? '')}&t=${planTs}`}
              className="text-blue-700 underline">
              {form.downloadname ?? '授課規劃 PDF'}
            </a>
          </p>
        )}
        {uploadMsg && <p className={`text-sm mt-2 ${uploadMsg.startsWith('錯誤') ? 'text-red-600' : 'text-green-600'}`}>{uploadMsg}</p>}
      </div>

      {/* 3. 經費預算 */}
      <div className="bg-blue-50 rounded-lg p-6">
        <SectionTitle>經費預算</SectionTitle>
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
                <th className={`${th} w-28`}></th>
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
                editingId === r.id ? (
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
                    <td className={`${td} text-center whitespace-nowrap`}>
                      <button onClick={() => handleSaveRow(i)} disabled={saving}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50 mr-1">
                        儲存
                      </button>
                      <button onClick={() => removeRow(i)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">
                        刪除
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id}>
                    <td className={td}>{r.feetype}</td>
                    <td className={td}>{r.item}</td>
                    <td className={`${td} text-right`}>{r.unitprice === '' ? '' : Number(r.unitprice).toLocaleString()}</td>
                    <td className={`${td} text-right`}>{r.amount === '' ? '' : Number(r.amount).toLocaleString()}</td>
                    <td className={td}>{r.unit}</td>
                    <td className={`${td} text-right`}>{rowTotal(r).toLocaleString()}</td>
                    <td className={td}>{r.description}</td>
                    <td className={`${td} text-center whitespace-nowrap`}>
                      <button onClick={() => setEditingId(r.id)} disabled={editingId !== null}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50 mr-1">
                        修改
                      </button>
                      <button onClick={() => removeRow(i)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">
                        刪除
                      </button>
                    </td>
                  </tr>
                )
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
          <button onClick={addRow} disabled={editingId !== null}
            className="bg-green-600 text-white px-6 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50">
            新增
          </button>
          {detailMsg && <span className={`text-sm ${detailMsg.startsWith('錯誤') ? 'text-red-600' : 'text-green-600'}`}>{detailMsg}</span>}
        </div>
      </div>
    </div>
  );
}
