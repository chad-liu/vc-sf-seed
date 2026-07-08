import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

// 取得該校全部經費明細
export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('sf_apply_detail')
    .select('*')
    .eq('schoolno', session.schoolNo)
    .order('id', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// 新增一筆空白明細（schoolno、school 自動帶入）
export async function POST() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('sf_apply_detail')
    .insert({ schoolno: session.schoolNo, school: session.school, feetype: '1.授課鐘點費' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
