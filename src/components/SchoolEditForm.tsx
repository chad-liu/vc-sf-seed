'use client';
import { useState, useEffect } from 'react';

interface Profile {
  schoolno: string;
  school: string;
  city: string;
  district: string;
  address: string;
  tel: string;
  schoolurl: string;
  principal: string;
  contract: string;
  contitle: string;
  contel: string;
  conext: string;
  conemail: string;
  conmobile: string;
  password: string;
  classnum: number | null;
  studentnum: number | null;
  remark: string;
  description: string;
}

const EMPTY: Profile = {
  schoolno: '', school: '', city: '', district: '',
  address: '', tel: '', schoolurl: '', principal: '',
  contract: '', contitle: '', contel: '', conext: '',
  conemail: '', conmobile: '', password: '',
  classnum: null, studentnum: null, remark: '', description: '',
};

const th = 'border border-gray-300 bg-blue-500 text-white px-2 py-2 text-sm font-bold text-left';
const td = 'border border-gray-300 bg-blue-50 px-2 py-2 text-sm align-top';
const input = 'w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white';

export default function SchoolEditForm() {
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [form, setForm] = useState<Profile>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(data => {
      if (data.error) return;
      const p: Profile = { ...EMPTY, ...data };
      setProfile(p);
      setForm(p);
    });
  }, []);

  const set = (name: keyof Profile) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm(prev => ({ ...prev, [name]: e.target.value }));
  };

  const save = async (fields: Partial<Profile>) => {
    setLoading(true);
    setMsg('');
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) {
      setMsg(`錯誤：${data.error}`);
      return false;
    }
    setProfile(prev => ({ ...prev, ...fields } as Profile));
    setMsg('資料已儲存');
    return true;
  };

  const handleSaveRow = async () => {
    const { schoolno, school, city, district, description, ...rest } = form;
    void schoolno; void school; void city; void district; void description;
    if (await save(rest)) setEditing(false);
  };

  const handleSaveDesc = async () => {
    if (await save({ description: form.description })) setEditingDesc(false);
  };

  const view = editing ? form : profile;

  return (
    <div className="max-w-6xl">
      <h2 className="inline-block bg-blue-600 text-white text-base font-bold px-3 py-1 rounded mb-4">
        學校基本資料
      </h2>

      <div className="overflow-x-auto">
        <table className="border-collapse w-full">
          <thead>
            <tr>
              <th className={th}></th>
              <th className={th}>編號</th>
              <th className={th}>學校名稱</th>
              <th className={th}>縣市</th>
              <th className={th}>鄉鎮市</th>
              <th className={th}>地址/電話/學校網址</th>
              <th className={th}>校長</th>
              <th className={th}>承辦人</th>
              <th className={th}>承辦人Email/手機/登入密碼</th>
              <th className={th}>班級數</th>
              <th className={th}>全校學生數</th>
              <th className={th}>備註</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={td}>
                {editing ? (
                  <div className="flex flex-col gap-1">
                    <button onClick={handleSaveRow} disabled={loading}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                      {loading ? '儲存中' : '儲存'}
                    </button>
                    <button onClick={() => { setForm(profile); setEditing(false); setMsg(''); }}
                      className="bg-gray-400 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-500">
                      取消
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { setForm(profile); setEditing(true); setMsg(''); }}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">
                    編輯
                  </button>
                )}
              </td>
              <td className={td}>{view.schoolno}</td>
              <td className={td}>{view.school}</td>
              <td className={td}>{view.city}</td>
              <td className={td}>{view.district}</td>
              <td className={td}>
                {editing ? (
                  <div className="space-y-1 min-w-56">
                    <input className={input} value={form.address} onChange={set('address')} placeholder="地址" />
                    <input className={input} value={form.tel} onChange={set('tel')} placeholder="電話" />
                    <input className={input} value={form.schoolurl} onChange={set('schoolurl')} placeholder="學校網址" />
                  </div>
                ) : (
                  <>
                    {view.address}<br />{view.tel}<br />
                    <a href={view.schoolurl} target="_blank" rel="noopener noreferrer"
                      className="text-blue-700 underline break-all">{view.schoolurl}</a>
                  </>
                )}
              </td>
              <td className={td}>
                {editing
                  ? <input className={`${input} min-w-16`} value={form.principal} onChange={set('principal')} />
                  : view.principal}
              </td>
              <td className={td}>
                {editing ? (
                  <div className="space-y-1 min-w-40">
                    <input className={input} value={form.contract} onChange={set('contract')} placeholder="姓名" />
                    <input className={input} value={form.contitle} onChange={set('contitle')} placeholder="職稱" />
                    <input className={input} value={form.contel} onChange={set('contel')} placeholder="電話" />
                    <input className={input} value={form.conext} onChange={set('conext')} placeholder="分機" />
                  </div>
                ) : (
                  <>
                    姓名:{view.contract}<br />職稱:{view.contitle}<br />
                    電話:{view.contel}<br />分機:{view.conext}
                  </>
                )}
              </td>
              <td className={td}>
                {editing ? (
                  <div className="space-y-1 min-w-52">
                    <input className={input} type="email" value={form.conemail} onChange={set('conemail')} placeholder="Email" />
                    <input className={input} value={form.conmobile} onChange={set('conmobile')} placeholder="手機" />
                    <input className={input} value={form.password} onChange={set('password')} placeholder="登入密碼" />
                  </div>
                ) : (
                  <>
                    Email:{view.conemail}<br />手機:{view.conmobile}<br />密碼:{view.password}
                  </>
                )}
              </td>
              <td className={td}>
                {editing
                  ? <input className={`${input} min-w-14`} type="number" value={form.classnum ?? ''}
                      onChange={e => setForm(prev => ({ ...prev, classnum: e.target.value === '' ? null : Number(e.target.value) }))} />
                  : view.classnum}
              </td>
              <td className={td}>
                {editing
                  ? <input className={`${input} min-w-16`} type="number" value={form.studentnum ?? ''}
                      onChange={e => setForm(prev => ({ ...prev, studentnum: e.target.value === '' ? null : Number(e.target.value) }))} />
                  : view.studentnum}
              </td>
              <td className={td}>
                {editing
                  ? <input className={`${input} min-w-20`} value={form.remark ?? ''} onChange={set('remark')} />
                  : view.remark}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 學校簡介 */}
      <div className="mt-6">
        <h3 className="text-sm font-bold text-gray-800 mb-2">學校簡介:</h3>
        {editingDesc ? (
          <div className="flex gap-2 mb-2">
            <button onClick={handleSaveDesc} disabled={loading}
              className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? '儲存中' : '儲存'}
            </button>
            <button onClick={() => { setForm(prev => ({ ...prev, description: profile.description })); setEditingDesc(false); setMsg(''); }}
              className="bg-gray-400 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-500">
              取消
            </button>
          </div>
        ) : (
          <button onClick={() => { setForm(prev => ({ ...prev, description: profile.description })); setEditingDesc(true); setMsg(''); }}
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 mb-2">
            編輯
          </button>
        )}
        <textarea
          value={editingDesc ? (form.description ?? '') : (profile.description ?? '')}
          onChange={set('description')}
          readOnly={!editingDesc}
          rows={8}
          className={`w-full border border-gray-300 rounded px-3 py-2 text-sm leading-relaxed ${editingDesc ? 'bg-white' : 'bg-gray-50'}`}
        />
      </div>

      {msg && (
        <p className={`text-sm mt-2 ${msg.startsWith('錯誤') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>
      )}
    </div>
  );
}
