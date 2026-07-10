import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

const BUCKET = 'sf_plan_pdf';

// 上傳授課規畫 PDF：依學校編號命名，重複上傳自動覆蓋
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

  // 取年度與舊檔路徑（Storage 物件名稱不允許中文，中文檔名於下載時以 download 參數指定）
  const { data: apply, error: applyError } = await supabase
    .from('sf_apply')
    .select('year, plan_path')
    .eq('schoolno', session.schoolNo)
    .limit(1)
    .maybeSingle();

  if (applyError || !apply) {
    return NextResponse.json({ error: applyError?.message ?? '尚無申請資料' }, { status: 500 });
  }

  const fileName = `plan-${apply.year}-${session.schoolNo}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType: 'application/pdf', upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // 舊檔名與新檔名不同時（如年度變更、或沿用舊命名規則的檔案），刪除舊檔
  const planPath = `${BUCKET}/${fileName}`;
  if (apply.plan_path && apply.plan_path !== planPath) {
    await supabase.storage.from(BUCKET).remove([apply.plan_path.replace(`${BUCKET}/`, '')]);
  }

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
    downloadname: `課程規畫-${apply.year}-${session.schoolNo}-${session.school}.pdf`,
    planupdate: today,
  });
}
