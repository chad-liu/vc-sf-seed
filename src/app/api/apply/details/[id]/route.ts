import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

const num = (v: unknown) => (v === '' || v === null || v === undefined ? null : Number(v));

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const unitprice = num(body.unitprice);
  const amount = num(body.amount);

  const { error } = await supabase
    .from('sf_apply_detail')
    .update({
      feetype: body.feetype ?? null,
      item: body.item ?? null,
      unitprice,
      amount,
      unit: body.unit ?? null,
      totalprice: unitprice !== null && amount !== null ? unitprice * amount : null,
      description: body.description ?? null,
    })
    .eq('id', id)
    .eq('schoolno', session.schoolNo);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await supabase
    .from('sf_apply_detail')
    .delete()
    .eq('id', id)
    .eq('schoolno', session.schoolNo);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
