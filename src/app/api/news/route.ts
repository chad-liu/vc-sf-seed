import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('sf_news')
    .select('id, news, created_at')
    .eq('valid', true)
    .eq('news_for', '種子學堂')
    .order('sort', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
