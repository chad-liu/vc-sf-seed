import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

const BUCKET = 'sf_photo1';
const MAX_SIZE = 5 * 1024 * 1024;

// 上傳活動相片（jpg、5MB 以內）：Storage 物件名稱不允許中文，
// 實體檔名為 photo{slot}-{year}-{schoolno}.jpg，中文檔名於下載時以 download 參數指定
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  const slot = Number(formData.get('slot'));

  if (!Number.isInteger(slot) || slot < 1 || slot > 6) {
    return NextResponse.json({ error: '相片編號錯誤' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: '請選擇檔案' }, { status: 400 });
  }
  if (file.type !== 'image/jpeg' && !/\.jpe?g$/i.test(file.name)) {
    return NextResponse.json({ error: '僅接受 jpg 格式' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '檔案大小不能超過 5MB' }, { status: 400 });
  }

  const pathField = `photo_path${slot}`;
  const { data: row, error: rowError } = await supabase
    .from('sf_active1')
    .select(`year, ${pathField}`)
    .eq('schoolno', session.schoolNo)
    .limit(1)
    .maybeSingle();

  if (rowError || !row) {
    return NextResponse.json({ error: rowError?.message ?? '尚無上學期成果資料' }, { status: 500 });
  }
  const record = row as unknown as Record<string, string | null>;
  const year = record.year ?? '115';

  // 校名為中文、Storage 不接受，實體檔名僅含年度/編號/序號
  const fileName = `${year}_${session.schoolNo}_${slot}.jpg`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // 舊檔名與新檔名不同時（如年度變更）刪除舊檔
  const planPath = `${BUCKET}/${fileName}`;
  const oldPath = record[pathField];
  if (oldPath && oldPath !== planPath) {
    await supabase.storage.from(BUCKET).remove([oldPath.replace(`${BUCKET}/`, '')]);
  }

  const { error: updateError } = await supabase
    .from('sf_active1')
    .update({ [pathField]: planPath })
    .eq('schoolno', session.schoolNo);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    path: planPath,
    downloadname: `${year}上學期活動相片_${session.schoolNo}_${session.school}_${slot}.jpg`,
  });
}
