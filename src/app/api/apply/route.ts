import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

function planUrl(planPath: string | null): string | null {
  if (!planPath) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${planPath}`;
}

// 取得申請資料；該校尚無資料時自動新增一筆
export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  const { data: existing, error } = await supabase
    .from('sf_apply')
    .select('*')
    .eq('schoolno', session.schoolNo)
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ ...existing, planurl: planUrl(existing.plan_path) });
  }

  const { data: created, error: insertError } = await supabase
    .from('sf_apply')
    .insert({ schoolno: session.schoolNo, school: session.school })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  return NextResponse.json({ ...created, planurl: null });
}

const EDITABLE_FIELDS = [
  'classtype', 'purpose', 'content', 'activetime',
  'activeobj', 'objnum', 'weaknum', 'teacher', 'remark',
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
    .from('sf_apply')
    .update(update)
    .eq('schoolno', session.schoolNo);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
