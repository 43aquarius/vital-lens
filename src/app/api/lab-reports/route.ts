import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractLabReport, analyzeLabReport } from '@/lib/ai';
import { LabMarker, RedFlag } from '@/lib/medical';

// GET /api/lab-reports — 列出所有报告
export async function GET() {
  try {
    const reports = await db.labReport.findMany({ orderBy: { reportDate: 'desc' } });
    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        title: r.title,
        patientName: r.patientName,
        reportDate: r.reportDate,
        labName: r.labName,
        markers: JSON.parse(r.markers) as LabMarker[],
        summary: r.summary,
        redFlags: r.redFlags ? (JSON.parse(r.redFlags) as RedFlag[]) : [],
        createdAt: r.createdAt,
      })),
    });
  } catch (e) {
    console.error('GET lab-reports error:', e);
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 });
  }
}

// POST /api/lab-reports — 上传图片 -> VLM 提取 -> LLM 解读 -> 保存
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const image = body.image as string; // data URL
    if (!image || !image.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Please provide a valid lab report image (data URL).' }, { status: 400 });
    }
    if (image.length > 9 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large. Please use an image under 6MB.' }, { status: 400 });
    }

    // 1. VLM 提取
    const extracted = await extractLabReport(image);
    if (!extracted.markers.length) {
      return NextResponse.json({ error: 'No lab markers could be read from this image. Try a clearer, well-lit photo of the report.' }, { status: 422 });
    }

    // 2. 获取历史用于趋势上下文
    const previous = await db.labReport.findMany({
      orderBy: { reportDate: 'desc' },
      take: 3,
    });

    // 3. LLM 解读
    const { summary, redFlags } = await analyzeLabReport(
      extracted,
      previous.map((p) => ({ date: p.reportDate.toISOString().slice(0, 10), markers: JSON.parse(p.markers) as LabMarker[] })),
    );

    // 4. 保存
    const title = `${extracted.labName || 'Lab Report'} — ${extracted.reportDate}`;
    const saved = await db.labReport.create({
      data: {
        title,
        patientName: extracted.patientName,
        reportDate: new Date(extracted.reportDate + 'T12:00:00Z'),
        labName: extracted.labName,
        sourceImage: image.length < 700_000 ? image : null,
        markers: JSON.stringify(extracted.markers),
        summary,
        redFlags: JSON.stringify(redFlags),
      },
    });

    return NextResponse.json({
      report: {
        id: saved.id,
        title: saved.title,
        patientName: saved.patientName,
        reportDate: saved.reportDate,
        labName: saved.labName,
        markers: extracted.markers,
        summary,
        redFlags,
        createdAt: saved.createdAt,
      },
    });
  } catch (e: any) {
    console.error('POST lab-reports error:', e);
    return NextResponse.json({ error: e.message || 'Analysis failed. Please try again.' }, { status: 500 });
  }
}

// DELETE /api/lab-reports?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await db.labReport.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
