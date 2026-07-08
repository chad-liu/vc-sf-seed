import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const { city, school, password } = await req.json();

  if (!city || !school || !password) {
    return NextResponse.json({ error: '請選擇學校並輸入密碼' }, { status: 400 });
  }

  const { data: user } = await supabase
    .from('sf_school')
    .select('id, school, schoolno, city, password')
    .eq('city', city)
    .eq('school', school)
    .eq('password', String(password).trim())
    .limit(1)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: '密碼輸入錯誤' }, { status: 401 });
  }

  const session = await getSession();
  session.isLoggedIn = true;
  session.id = user.id;
  session.school = user.school;
  session.schoolNo = user.schoolno;
  session.city = user.city;
  await session.save();
  return NextResponse.json({ ok: true });
}
