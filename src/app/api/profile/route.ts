import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('sf_school')
    .select('*')
    .eq('id', session.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// 僅允許更新這些欄位；編號、學校名稱、縣市、鄉鎮市為識別資料，不開放修改
const EDITABLE_FIELDS = [
  'address', 'tel', 'schoolurl', 'principal',
  'contract', 'contitle', 'contel', 'conext',
  'conemail', 'conmobile', 'password',
  'classnum', 'studentnum', 'remark', 'description',
] as const;

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  const body = await req.json();
  const update: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) {
      if (field === 'classnum' || field === 'studentnum') {
        update[field] = body[field] === '' || body[field] === null ? null : Number(body[field]);
      } else {
        update[field] = body[field];
      }
    }
  }

  const { error } = await supabase
    .from('sf_school')
    .update(update)
    .eq('id', session.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
