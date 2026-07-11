'use client';
import { useState, useEffect, useRef } from 'react';

const CLASS_TYPES = ['-', '運動類', '音樂類', '美術類', '舞蹈戲劇類', '知識科學類', '語文類', '其他'];

// 與 sf_apply 相對應、可由「從申請資料匯入」帶入的欄位
const IMPORT_FIELDS = [
  'classtype', 'purpose', 'content', 'activetime',
  'activeobj', 'objnum', 'weaknum', 'teacher',
] as const;

// 下學期成果文件（PDF）三種類別
const DOC_ITEMS = [
  { kind: 'teacher', label: '教師心得' },
  { kind: 'student', label: '學生心得' },
  { kind: 'sheet', label: '原始憑證' },
] as const;
type DocKind = typeof DOC_ITEMS[number]['kind'];

interface ActiveData {
  year: string;
  schoolno: string;
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

const EMPTY: ActiveData = {
  year: '', schoolno: '', school: '', classtype: '', purpose: '', content: '', activetime: '',
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

interface Props {
  apiBase: string;        // /api/active1 或 /api/active2
  term: '上' | '下';
}

export default function ActiveForm({ apiBase, term }: Props) {
  const [form, setForm] = useState<ActiveData>(EMPTY);
  const [saved, setSaved] = useState<ActiveData>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  // 活動相片：6 格，各含說明與已上傳路徑
  const [photos, setPhotos] = useState<{ des: string; path: string | null }[]>(
    Array.from({ length: 6 }, () => ({ des: '', path: null }))
  );
  const [photoMsg, setPhotoMsg] = useState('');
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [photoTs, setPhotoTs] = useState(0);
  const photoRefs = useRef<(HTMLInputElement | null)[]>([]);
  // 下學期成果文件（PDF）：教師心得/學生心得/原始憑證
  const [docs, setDocs] = useState<Record<DocKind, string | null>>({ teacher: null, student: null, sheet: null });
  const [docMsg, setDocMsg] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState<DocKind | null>(null);
  const docRefs = useRef<Partial<Record<DocKind, HTMLInputElement | null>>>({});

  useEffect(() => {
    fetch(apiBase).then(r => r.json()).then(data => {
      if (!data.error) {
        const p = { ...EMPTY, ...data };
        setForm(p);
        setSaved(p);
        setPhotos(Array.from({ length: 6 }, (_, i) => ({
          des: data[`photodes${i + 1}`] ?? '',
          path: data[`photo_path${i + 1}`] ?? null,
        })));
        setDocs({
          teacher: data.teacher_path ?? null,
          student: data.student_path ?? null,
          sheet: data.sheet_path ?? null,
        });
      }
      setPhotoTs(Date.now());
      setLoaded(true);
    });
  }, [apiBase]);

  const set = (name: keyof ActiveData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [name]: e.target.value }));
  };

  // 除特色事蹟、影片標題、影片連結、備註外皆為必填
  const REQUIRED_FIELDS: { key: keyof ActiveData; label: string }[] = [
    { key: 'classtype', label: '開班類別' },
    { key: 'purpose', label: '申請目的' },
    { key: 'content', label: '課程內容' },
    { key: 'activetime', label: '活動時段' },
    { key: 'activeobj', label: '參加對象' },
    { key: 'objnum', label: '受惠總人數' },
    { key: 'weaknum', label: '弱勢生受惠人數' },
    { key: 'teacher', label: '指導老師' },
  ];

  const handleSave = async () => {
    setMsg('');
    for (const { key, label } of REQUIRED_FIELDS) {
      const v = form[key];
      if (v === '' || v === null || v === undefined) {
        setMsg(key === 'classtype' ? '錯誤：「開班類別」請選擇類別' : `錯誤：「${label}」為必填`);
        return;
      }
    }
    if (Number(form.objnum) <= 0) {
      setMsg('錯誤：「受惠總人數」不能為 0');
      return;
    }
    if (Number(form.weaknum) < 0) {
      setMsg('錯誤：「弱勢生受惠人數」不能為負數');
      return;
    }
    // 影片標題與影片連結必須成對填寫
    if (form.youtube && !form.youtubetitle) {
      setMsg('錯誤：已輸入影片連結，「影片標題」不能空白');
      return;
    }
    if (form.youtubetitle && !form.youtube) {
      setMsg('錯誤：已輸入影片標題，「影片(YouTube連結)」不能空白');
      return;
    }
    setSaving(true);
    const res = await fetch(apiBase, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.error) {
      setMsg(`錯誤：${data.error}`);
    } else {
      setMsg(`${term}學期成果已儲存`);
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

  // 匯入相對應欄位：上學期從申請資料（sf_apply）、下學期從上學期成果（sf_active1）
  // 帶入表單後進入修改模式，按儲存才寫入
  const importSource = term === '上'
    ? { url: '/api/apply', label: '從申請資料匯入' }
    : { url: '/api/active1', label: '從上學期成果匯入' };

  const handleImport = async () => {
    setMsg('');
    const res = await fetch(importSource.url);
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
    setMsg(`已${importSource.label}，請確認內容後按「儲存」`);
  };

  // ---- 成果文件（PDF）上傳，僅下學期 ----
  const handleUploadDoc = async (kind: DocKind, label: string) => {
    setDocMsg('');
    const file = docRefs.current[kind]?.files?.[0];
    if (!file) {
      setDocMsg(`錯誤：${label} 請先選擇檔案`);
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setDocMsg(`錯誤：${label} 僅接受 PDF 檔案`);
      return;
    }
    setUploadingDoc(kind);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('kind', kind);
    const res = await fetch(`${apiBase}/doc`, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.error) {
      setDocMsg(`錯誤：${label} ${data.error}`);
    } else {
      setDocs(prev => ({ ...prev, [kind]: data.path }));
      setPhotoTs(Date.now());
      setDocMsg(`${label} 上傳成功`);
      const ref = docRefs.current[kind];
      if (ref) ref.value = '';
    }
    setUploadingDoc(null);
  };

  // ---- 活動相片 ----
  const isLandscape = (file: File) =>
    new Promise<boolean>(resolve => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img.naturalWidth > img.naturalHeight); };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
      img.src = url;
    });

  const handleUploadPhoto = async (i: number) => {
    setPhotoMsg('');
    const file = photoRefs.current[i]?.files?.[0];
    if (!file) {
      setPhotoMsg(`錯誤：相片${i + 1} 請先選擇檔案`);
      return;
    }
    if (file.type !== 'image/jpeg' && !/\.jpe?g$/i.test(file.name)) {
      setPhotoMsg(`錯誤：相片${i + 1} 僅接受 jpg 格式`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoMsg(`錯誤：相片${i + 1} 檔案大小不能超過 5MB`);
      return;
    }
    if (!(await isLandscape(file))) {
      setPhotoMsg(`錯誤：相片${i + 1} 須為橫式（寬大於高）`);
      return;
    }
    if (!photos[i].des.trim()) {
      setPhotoMsg(`錯誤：相片${i + 1} 請先輸入相片說明再上傳`);
      return;
    }
    setUploadingSlot(i);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('slot', String(i + 1));
    fd.append('des', photos[i].des.trim());
    const res = await fetch(`${apiBase}/photo`, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.error) {
      setPhotoMsg(`錯誤：相片${i + 1} ${data.error}`);
    } else {
      setPhotos(prev => prev.map((p, idx) => idx === i ? { ...p, path: data.path } : p));
      setPhotoTs(Date.now());
      setPhotoMsg(`相片${i + 1} 上傳成功`);
      const ref = photoRefs.current[i];
      if (ref) ref.value = '';
    }
    setUploadingSlot(null);
  };

  const handleSaveDes = async () => {
    setPhotoMsg('');
    // 相片與說明必須成對
    for (let i = 0; i < photos.length; i++) {
      if (photos[i].path && !photos[i].des.trim()) {
        setPhotoMsg(`錯誤：相片${i + 1} 已上傳，相片說明不能空白`);
        return;
      }
      if (!photos[i].path && photos[i].des.trim()) {
        setPhotoMsg(`錯誤：相片${i + 1} 已有說明，請上傳相片`);
        return;
      }
    }
    setSaving(true);
    const body: Record<string, string> = {};
    photos.forEach((p, i) => { body[`photodes${i + 1}`] = p.des; });
    const res = await fetch(apiBase, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setPhotoMsg(data.error ? `錯誤：${data.error}` : '相片說明已儲存');
    setSaving(false);
  };

  const photoUrl = (path: string) =>
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}?t=${photoTs}`;

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
    name: keyof ActiveData,
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
      <p className="text-sm text-red-400 text-center">請於{term}學期末繳交實施成果</p>

      <div className="bg-blue-50 rounded-lg p-6">
        <SectionTitle>{term}學期成果</SectionTitle>
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
        {field('申請目的', 'purpose', { placeholder: '必填' })}
        {field('課程內容', 'content', { placeholder: '必填' })}
        {field('活動時段', 'activetime', { placeholder: '必填' })}
        {field('參加對象', 'activeobj', { placeholder: '必填' })}
        {field('受惠總人數', 'objnum', { type: 'number', placeholder: '必填' })}
        {field('弱勢生受惠人數', 'weaknum', { type: 'number', placeholder: '必填' })}
        {field('指導老師', 'teacher', { placeholder: '必填' })}
        {field('特色事蹟', 'special')}
        {field('影片標題', 'youtubetitle')}
        <div className="flex items-center gap-2 mb-3">
          <label className="w-40 text-sm text-gray-700 text-right flex-shrink-0">影片(YouTube連結)</label>
          {editing ? (
            <input
              value={form.youtube ?? ''}
              onChange={set('youtube')}
              placeholder="11個字元的代碼"
              className={input}
            />
          ) : (
            <span className="flex-1 text-sm text-gray-900 px-2 py-1.5 border-b border-gray-300 min-h-8">
              {form.youtube ?? ''}
            </span>
          )}
          <button type="button" disabled={!form.youtube}
            onClick={() => window.open(`https://youtu.be/${form.youtube}`, '_blank', 'noopener')}
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex-shrink-0">
            測試播放
          </button>
        </div>
        <div className="flex gap-2 mb-3">
          <span className="w-40 flex-shrink-0" />
          <div className="flex-1 border border-gray-300 bg-white rounded px-4 py-3 text-sm text-gray-700">
            <b>影片上傳注意事項:</b>
            <ol className="list-decimal pl-5 mt-1 space-y-0.5">
              <li>影片長度 : 3~5分鐘</li>
              <li>影片名稱 : 三花菁英種子學堂{form.year}學年度{term}期-{'{校名}'}-{'{活動主題}'}</li>
              <li>影片代碼 : https://youtu.be/<span className="text-red-600">XXXXXXXXXXX</span> , 輸入X共11碼</li>
              <li>設為公開，檢查影片是否可正常播放</li>
            </ol>
          </div>
        </div>
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
            {importSource.label}
          </button>
        </div>
      </div>

      {/* 成果文件上傳（僅下學期） */}
      {term === '下' && (
        <div className="bg-blue-50 rounded-lg p-6">
          <SectionTitle>成果文件上傳</SectionTitle>
          <p className="text-sm text-gray-700 mb-4">請將文件存成 PDF 檔上傳，重新上傳會自動覆蓋舊檔</p>
          <div className="space-y-3">
            {DOC_ITEMS.map(({ kind, label }) => (
              <div key={kind} className="flex items-center gap-3 flex-wrap bg-white border border-gray-300 rounded px-3 py-2">
                <span className="text-sm text-gray-700 w-20 flex-shrink-0">{label}</span>
                <input type="file" accept="application/pdf,.pdf"
                  ref={el => { docRefs.current[kind] = el; }}
                  className="text-sm file:mr-2 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-blue-600 file:text-white file:text-sm file:cursor-pointer" />
                <button type="button" onClick={() => handleUploadDoc(kind, label)} disabled={uploadingDoc !== null}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                  {uploadingDoc === kind ? '上傳中...' : '上傳'}
                </button>
                {docs[kind] ? (
                  <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${docs[kind]}?download=${encodeURIComponent(`${form.year}${label}_${form.schoolno}_${form.school}.pdf`)}&t=${photoTs}`}
                    className="text-sm text-blue-700 underline">
                    {form.year}{label}_{form.schoolno}_{form.school}.pdf
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">尚未上傳</span>
                )}
              </div>
            ))}
          </div>
          {docMsg && <p className={`text-sm mt-3 ${docMsg.startsWith('錯誤') ? 'text-red-600' : 'text-green-600'}`}>{docMsg}</p>}
        </div>
      )}

      {/* 活動相片 */}
      <div className="bg-blue-50 rounded-lg p-6">
        <SectionTitle>活動相片</SectionTitle>
        <p className="text-sm text-gray-700 mb-4">上傳6張活動相片，jpg格式，橫式，檔案大小不超過5MB</p>
        <div className="space-y-3">
          {photos.map((p, i) => (
            <div key={i} className="flex items-center gap-3 flex-wrap bg-white border border-gray-300 rounded px-3 py-2">
              <span className="text-sm text-gray-700 w-14 flex-shrink-0">相片{i + 1}</span>
              <input
                value={p.des}
                onChange={e => setPhotos(prev => prev.map((x, idx) => idx === i ? { ...x, des: e.target.value } : x))}
                placeholder="相片說明"
                className="flex-1 min-w-40 border border-gray-300 rounded px-2 py-1.5 text-sm"
              />
              <input type="file" accept="image/jpeg,.jpg,.jpeg"
                ref={el => { photoRefs.current[i] = el; }}
                className="text-sm file:mr-2 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-blue-600 file:text-white file:text-sm file:cursor-pointer" />
              <button type="button" onClick={() => handleUploadPhoto(i)} disabled={uploadingSlot !== null}
                className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                {uploadingSlot === i ? '上傳中...' : '上傳'}
              </button>
              {p.path ? (
                <a href={photoUrl(p.path)} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl(p.path)} alt={`相片${i + 1}`} className="h-16 w-auto rounded border border-gray-300" />
                </a>
              ) : (
                <span className="text-xs text-gray-400">尚未上傳</span>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button type="button" onClick={handleSaveDes} disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? '儲存中...' : '儲存相片說明'}
          </button>
          {photoMsg && <span className={`text-sm ${photoMsg.startsWith('錯誤') ? 'text-red-600' : 'text-green-600'}`}>{photoMsg}</span>}
        </div>
      </div>
    </div>
  );
}
