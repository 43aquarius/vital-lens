import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { LabMarker, RedFlag, evaluateStatus } from '@/lib/medical';

// 演示数据: Sarah Chen 的 3 份化验单, 讲述"缺铁性贫血逐渐发展、被趋势分析及早发现"的故事
function mk(name: string, value: number, unit: string, refLow: number, refHigh: number, category: string): LabMarker {
  return { name, value, unit, refLow, refHigh, category, status: evaluateStatus(value, refLow, refHigh, name) };
}

const REPORTS: {
  date: string;
  title: string;
  markers: LabMarker[];
  summary: string;
  redFlags: RedFlag[];
}[] = [
  {
    date: '2026-03-12',
    title: 'CityMed Diagnostics — 2026-03-12',
    markers: [
      mk('Hemoglobin', 13.9, 'g/dL', 12.0, 15.5, 'CBC'),
      mk('Hematocrit', 41.2, '%', 36, 46, 'CBC'),
      mk('MCV', 89.4, 'fL', 80, 100, 'CBC'),
      mk('Ferritin', 45, 'ng/mL', 30, 400, 'Iron Studies'),
      mk('Transferrin Saturation', 24, '%', 20, 50, 'Iron Studies'),
      mk('Glucose', 88, 'mg/dL', 70, 99, 'Metabolic'),
      mk('TSH', 2.1, 'mIU/L', 0.4, 4.0, 'Thyroid'),
      mk('Total Cholesterol', 182, 'mg/dL', 0, 200, 'Lipids'),
      mk('LDL', 104, 'mg/dL', 0, 100, 'Lipids'),
      mk('HDL', 62, 'mg/dL', 40, 80, 'Lipids'),
    ],
    summary: `## What this report shows
This is a routine blood panel from March, and overall it looks healthy. All major organ-function markers and blood counts sit comfortably inside their reference ranges.

## Key findings
- **Hemoglobin (13.9 g/dL)** — normal. Your blood is carrying oxygen well.
- **Ferritin (45 ng/mL)** — technically normal, but in the lower third of the range. Ferritin reflects your iron reserves, so this is worth watching over time.
- **LDL cholesterol (104 mg/dL)** — just above the ideal cutoff; a minor note rather than a concern.

## Trends over time
No previous reports yet — upload past reports to unlock trend analysis.

## What you can do next
- Keep eating iron-rich foods (lean red meat, lentils, spinach) alongside vitamin C, which boosts absorption.
- Recheck iron studies in a few months, especially if you feel unusually tired.
- Discuss your LDL level with a healthcare professional at your next routine visit.

## Questions to ask your doctor
- Is my ferritin level something we should track regularly?
- Based on my cholesterol, do I need any lifestyle changes now?`,
    redFlags: [],
  },
  {
    date: '2026-06-18',
    title: 'CityMed Diagnostics — 2026-06-18',
    markers: [
      mk('Hemoglobin', 12.1, 'g/dL', 12.0, 15.5, 'CBC'),
      mk('Hematocrit', 36.8, '%', 36, 46, 'CBC'),
      mk('MCV', 84.1, 'fL', 80, 100, 'CBC'),
      mk('Ferritin', 26, 'ng/mL', 30, 400, 'Iron Studies'),
      mk('Transferrin Saturation', 17, '%', 20, 50, 'Iron Studies'),
      mk('Glucose', 91, 'mg/dL', 70, 99, 'Metabolic'),
      mk('TSH', 2.3, 'mIU/L', 0.4, 4.0, 'Thyroid'),
      mk('Total Cholesterol', 179, 'mg/dL', 0, 200, 'Lipids'),
      mk('LDL', 101, 'mg/dL', 0, 100, 'Lipids'),
      mk('HDL', 60, 'mg/dL', 40, 80, 'Lipids'),
    ],
    summary: `## What this report shows
Compared with March, this panel shows early changes worth paying attention to — nothing alarming yet, but a clear direction.

## Key findings
- **Ferritin (26 ng/mL)** — has slipped below the normal floor. Your iron reserves are running low.
- **Transferrin saturation (17%)** — below range, which also points toward low available iron.
- **Hemoglobin (12.1 g/dL)** — still normal, but only just above the lower limit; it has dropped from 13.9 in March.
- **MCV (84.1 fL)** — normal but drifting down; red cells are starting to shrink slightly.

## Trends over time
Since March: hemoglobin fell about 13% (13.9 → 12.1) and ferritin fell about 42% (45 → 26). This pattern — iron stores dropping first, hemoglobin following — is the classic early sequence of iron deficiency. Catching it at this stage is exactly when simple fixes work best.

## What you can do next
- Talk to a healthcare professional about iron supplementation — doses and duration should be decided with them.
- Pair iron-rich meals with vitamin C (citrus, peppers) and avoid tea/coffee right next to iron-rich meals, as they reduce absorption.
- If you have heavy periods, are vegetarian, or donate blood often, mention it — these are common reasons for low iron.
- Recheck in 8–12 weeks.

## Questions to ask your doctor
- Should I start iron supplements, and which type do you recommend?
- Do we need to check for any source of blood loss?`,
    redFlags: [],
  },
  {
    date: '2026-10-05',
    title: 'CityMed Diagnostics — 2026-10-05',
    markers: [
      mk('Hemoglobin', 10.8, 'g/dL', 12.0, 15.5, 'CBC'),
      mk('Hematocrit', 33.5, '%', 36, 46, 'CBC'),
      mk('MCV', 77.8, 'fL', 80, 100, 'CBC'),
      mk('MCH', 25.1, 'pg', 27, 33, 'CBC'),
      mk('Ferritin', 14, 'ng/mL', 30, 400, 'Iron Studies'),
      mk('Transferrin Saturation', 12, '%', 20, 50, 'Iron Studies'),
      mk('Red Blood Cells', 4.42, '10^6/uL', 4.5, 5.9, 'CBC'),
      mk('Glucose', 90, 'mg/dL', 70, 99, 'Metabolic'),
      mk('TSH', 2.0, 'mIU/L', 0.4, 4.0, 'Thyroid'),
      mk('Total Cholesterol', 176, 'mg/dL', 0, 200, 'Lipids'),
      mk('LDL', 99, 'mg/dL', 0, 100, 'Lipids'),
      mk('HDL', 61, 'mg/dL', 40, 80, 'Lipids'),
    ],
    summary: `## What this report shows
This panel confirms that the trend spotted in June has continued. Several red-blood-cell markers are now outside their reference ranges, which is consistent with established iron-deficiency anemia. This is very treatable — the important thing is to act now and find out why it developed.

## Key findings
- **Hemoglobin (10.8 g/dL)** — below range (down from 12.1 in June and 13.9 in March). This level often goes hand-in-hand with tiredness, breathlessness on exertion, or difficulty concentrating.
- **Ferritin (14 ng/mL)** — well below range; iron reserves are nearly depleted.
- **MCV (77.8 fL)** — below range. Red cells are now smaller than normal, a pattern seen when the body makes them without enough iron.
- **MCH (25.1 pg)** — below range; each red cell carries less hemoglobin than usual.
- **Hematocrit (33.5%)** and **RBC count (4.42)** — both just under their floors.

## Trends over time
Over 7 months, hemoglobin fell 22% (13.9 → 12.1 → 10.8) and ferritin fell 69% (45 → 26 → 14). The step-by-step pattern — stores falling first, then cell size, then hemoglobin — is a textbook progression of worsening iron deficiency. The good news: it was caught, it is treatable, and recovery is usually straightforward.

## What you can do next
- Book a doctor's visit soon — this level of anemia deserves proper evaluation and usually prescription-strength iron.
- Ask about testing for the cause (e.g., celiac screening, gastrointestinal evaluation, menstrual factors) — iron deficiency always has a reason.
- Eat iron-rich foods daily, but treat diet as a support, not the fix, at this stage.
- Watch for chest pain, resting breathlessness, fainting, or a racing heart — seek urgent care if any appear.

## Questions to ask your doctor
- What workup do you recommend to find the cause of my iron deficiency?
- What iron regimen do you suggest, and when should we recheck my levels?
- Are there any symptoms that should make me seek care sooner?`,
    redFlags: [],
  },
];

// POST /api/demo-seed — 载入演示数据
export async function POST() {
  try {
    // 清除旧演示数据
    const existing = await db.labReport.findMany({ where: { patientName: 'Sarah Chen' } });
    for (const e of existing) await db.labReport.delete({ where: { id: e.id } });

    for (const r of REPORTS) {
      await db.labReport.create({
        data: {
          title: r.title,
          patientName: 'Sarah Chen',
          reportDate: new Date(r.date + 'T12:00:00Z'),
          labName: 'CityMed Diagnostics',
          markers: JSON.stringify(r.markers),
          summary: r.summary,
          redFlags: JSON.stringify(r.redFlags),
        },
      });
    }
    return NextResponse.json({ ok: true, count: REPORTS.length });
  } catch (e: any) {
    console.error('demo-seed error:', e);
    return NextResponse.json({ error: e.message || 'Seed failed' }, { status: 500 });
  }
}
