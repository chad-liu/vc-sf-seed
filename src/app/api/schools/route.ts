import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city');
  if (!city) {
    return NextResponse.json({ error: '請指定縣市' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('sf_school')
    .select('school')
    .eq('city', city)
    .order('school', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data.map(row => row.school));
}
