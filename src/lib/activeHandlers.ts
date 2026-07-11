import { NextRequest, NextResponse } from 'next/server';
import { supabase } from './supabase';
import { getSession } from './session';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const EDITABLE_FIELDS = [
  'classtype', 'purpose', 'content', 'activetime',
  'activeobj', 'objnum', 'weaknum', 'teacher',
  'special', 'youtubetitle', 'youtube', 'remark',
  'photodes1', 'photodes2', 'photodes3', 'photodes4', 'photodes5', 'photodes6',
] as const;

// 上/下學期成果共用的 GET（無資料自動建立）與 PUT handler
export function createActiveHandlers(table: string) {
  async function GET() {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    const { data: existing, error } = await supabase
      .from(table)
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
      .from(table)
      .insert({ schoolno: session.schoolNo, school: session.school, year: apply?.year ?? '115' })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    return NextResponse.json(created);
  }

  async function PUT(req: NextRequest) {
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
      .from(table)
      .update(update)
      .eq('schoolno', session.schoolNo);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return { GET, PUT };
}

// 下學期成果文件（PDF）上傳設定：bucket 與 sf_active2 路徑欄位
const DOC_KINDS = {
  teacher: { bucket: 'sf_teacher', field: 'teacher_path', label: '教師心得' },
  student: { bucket: 'sf_student', field: 'student_path', label: '學生心得' },
  sheet: { bucket: 'sf_sheet', field: 'sheet_path', label: '原始憑證' },
} as const;

// PDF 文件上傳 handler：實體檔名 {year}_{schoolno}.pdf（Storage 不接受中文），重傳自動覆蓋
export function createDocHandler(table: string) {
  async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const kind = String(formData.get('kind') ?? '') as keyof typeof DOC_KINDS;

    const doc = DOC_KINDS[kind];
    if (!doc) {
      return NextResponse.json({ error: '文件類別錯誤' }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: '請選擇檔案' }, { status: 400 });
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: '僅接受 PDF 檔案' }, { status: 400 });
    }

    const { data: row, error: rowError } = await supabase
      .from(table)
      .select(`year, ${doc.field}`)
      .eq('schoolno', session.schoolNo)
      .limit(1)
      .maybeSingle();

    if (rowError || !row) {
      return NextResponse.json({ error: rowError?.message ?? '尚無成果資料' }, { status: 500 });
    }
    const record = row as unknown as Record<string, string | null>;
    const year = record.year ?? '115';

    const fileName = `${year}_${session.schoolNo}.pdf`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(doc.bucket)
      .upload(fileName, buffer, { contentType: 'application/pdf', upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 舊檔名與新檔名不同時（如年度變更）刪除舊檔
    const docPath = `${doc.bucket}/${fileName}`;
    const oldPath = record[doc.field];
    if (oldPath && oldPath !== docPath) {
      await supabase.storage.from(doc.bucket).remove([oldPath.replace(`${doc.bucket}/`, '')]);
    }

    const { error: updateError } = await supabase
      .from(table)
      .update({ [doc.field]: docPath })
      .eq('schoolno', session.schoolNo);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      kind,
      path: docPath,
      downloadname: `${year}${doc.label}_${session.schoolNo}_${session.school}.pdf`,
    });
  }

  return { POST };
}

// 活動相片上傳 handler（jpg、5MB 以內、須附說明）
// Storage 物件名稱不允許中文，實體檔名為 {year}_{schoolno}_{slot}.jpg
export function createPhotoHandler(table: string, bucket: string, term: '上' | '下') {
  async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const slot = Number(formData.get('slot'));
    const des = String(formData.get('des') ?? '').trim();

    if (!Number.isInteger(slot) || slot < 1 || slot > 6) {
      return NextResponse.json({ error: '相片編號錯誤' }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: '請選擇檔案' }, { status: 400 });
    }
    if (file.type !== 'image/jpeg' && !/\.jpe?g$/i.test(file.name)) {
      return NextResponse.json({ error: '僅接受 jpg 格式' }, { status: 400 });
    }
    if (file.size > MAX_PHOTO_SIZE) {
      return NextResponse.json({ error: '檔案大小不能超過 5MB' }, { status: 400 });
    }
    if (!des) {
      return NextResponse.json({ error: '請先輸入相片說明' }, { status: 400 });
    }

    const pathField = `photo_path${slot}`;
    const { data: row, error: rowError } = await supabase
      .from(table)
      .select(`year, ${pathField}`)
      .eq('schoolno', session.schoolNo)
      .limit(1)
      .maybeSingle();

    if (rowError || !row) {
      return NextResponse.json({ error: rowError?.message ?? `尚無${term}學期成果資料` }, { status: 500 });
    }
    const record = row as unknown as Record<string, string | null>;
    const year = record.year ?? '115';

    const fileName = `${year}_${session.schoolNo}_${slot}.jpg`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 舊檔名與新檔名不同時（如年度變更）刪除舊檔
    const planPath = `${bucket}/${fileName}`;
    const oldPath = record[pathField];
    if (oldPath && oldPath !== planPath) {
      await supabase.storage.from(bucket).remove([oldPath.replace(`${bucket}/`, '')]);
    }

    // 相片與說明成對：上傳時一併儲存該張說明
    const { error: updateError } = await supabase
      .from(table)
      .update({ [pathField]: planPath, [`photodes${slot}`]: des })
      .eq('schoolno', session.schoolNo);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      path: planPath,
      downloadname: `${year}${term}學期活動相片_${session.schoolNo}_${session.school}_${slot}.jpg`,
    });
  }

  return { POST };
}
