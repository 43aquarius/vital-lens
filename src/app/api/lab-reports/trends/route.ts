import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { computeTrends, LabMarker } from '@/lib/medical';

// GET /api/lab-reports/trends — 跨报告趋势
export async function GET() {
  try {
    const reports = await db.labReport.findMany({ orderBy: { reportDate: 'asc' } });
    const trends = computeTrends(
      reports.map((r) => ({ reportDate: new Date(r.reportDate), markers: JSON.parse(r.markers) as LabMarker[] })),
    );
    return NextResponse.json({ trends, reportCount: reports.length });
  } catch (e) {
    console.error('trends error:', e);
    return NextResponse.json({ error: 'Failed to compute trends' }, { status: 500 });
  }
}
