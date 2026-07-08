import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

const BUCKET = 'sf_plan_pdf';

// 上傳授課規劃 PDF：依學校編號命名，重複上傳自動覆蓋
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: '請選擇檔案' }, { status: 400 });
  }
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: '僅接受 PDF 檔案' }, { status: 400 });
  }

  const fileName = `${session.schoolNo}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType: 'application/pdf', upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const planPath = `${BUCKET}/${fileName}`;
  const today = new Date().toISOString().slice(0, 10);
  const { error: updateError } = await supabase
    .from('sf_apply')
    .update({ plan_path: planPath, planupdate: today })
    .eq('schoolno', session.schoolNo);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    planurl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${planPath}`,
    planupdate: today,
  });
}
