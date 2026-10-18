import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateDoctorPrep } from '@/lib/ai';
import { LabMarker } from '@/lib/medical';

// POST /api/doctor-prep — 生成就诊准备清单
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const symptomTranscript: string = typeof body.symptomTranscript === 'string' ? body.symptomTranscript : '';

    const reports = await db.labReport.findMany({ orderBy: { reportDate: 'desc' }, take: 6 });
    if (!reports.length) {
      return NextResponse.json({ error: 'Upload at least one lab report first — your prep sheet is built from your real data.' }, { status: 400 });
    }
    const patientName = reports[0].patientName || 'Guest';
    const asc = [...reports].sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime());

    const prep = await generateDoctorPrep(
      patientName,
      asc.map((r) => ({
        date: new Date(r.reportDate).toISOString().slice(0, 10),
        markers: JSON.parse(r.markers) as LabMarker[],
      })),
      symptomTranscript,
    );

    return NextResponse.json({ prep, patientName, reportCount: reports.length });
  } catch (e: any) {
    console.error('doctor-prep error:', e);
    return NextResponse.json({ error: e.message || 'Failed to generate prep sheet' }, { status: 500 });
  }
}
