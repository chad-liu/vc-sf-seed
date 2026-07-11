import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

// 取得上學期成果；該校尚無資料時自動新增一筆
export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  const { data: existing, error } = await supabase
    .from('sf_active1')
    .select('*')
    .eq('schoolno', session.schoolNo)
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json(existing);
  }

  // 年度取自該校申請資料，沒有則用 115
  const { data: apply } = await supabase
    .from('sf_apply')
    .select('year')
    .eq('schoolno', session.schoolNo)
    .limit(1)
    .maybeSingle();

  const { data: created, error: insertError } = await supabase
    .from('sf_active1')
    .insert({ schoolno: session.schoolNo, school: session.school, year: apply?.year ?? '115' })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  return NextResponse.json(created);
}

const EDITABLE_FIELDS = [
  'classtype', 'purpose', 'content', 'activetime',
  'activeobj', 'objnum', 'weaknum', 'teacher',
  'special', 'youtubetitle', 'youtube', 'remark',
  'photodes1', 'photodes2', 'photodes3', 'photodes4', 'photodes5', 'photodes6',
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
      if (field === 'objnum' || field === 'weaknum') {
        update[field] = body[field] === '' || body[field] === null ? null : Number(body[field]);
      } else {
        update[field] = body[field];
      }
    }
  }

  const { error } = await supabase
    .from('sf_active1')
    .update(update)
    .eq('schoolno', session.schoolNo);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
