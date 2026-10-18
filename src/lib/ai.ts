// VitalLens AI 服务层 (仅服务端)
import ZAI from 'z-ai-web-dev-sdk';
import { LabMarker, RedFlag, evaluateStatus, normalizeMarkerName, FALLBACK_RANGES, CRITICAL_THRESHOLDS } from './medical';

export interface ExtractedReport {
  patientName: string;
  reportDate: string; // ISO date
  labName?: string;
  markers: LabMarker[];
}

// 第一步: VLM 从化验单图片提取结构化数据
export async function extractLabReport(imageBase64: string): Promise<ExtractedReport> {
  const zai = await ZAI.create();
  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are a precise medical lab report parser. Analyze this lab report image and extract structured data.

Return STRICT JSON only (no markdown, no explanation) with this exact shape:
{
  "patientName": "string or 'Unknown'",
  "reportDate": "YYYY-MM-DD (best guess from document; if none visible use 2026-01-01)",
  "labName": "string or null",
  "markers": [
    {
      "name": "short standard marker name, e.g. Hemoglobin, Ferritin, TSH, Glucose",
      "value": number,
      "unit": "string e.g. g/dL",
      "refLow": number or null (reference range lower bound printed on the report),
      "refHigh": number or null (reference range upper bound printed on the report),
      "category": "one of: CBC, Iron Studies, Metabolic, Liver, Kidney, Electrolytes, Thyroid, Lipids, Vitamins, Inflammation, Other"
    }
  ]
}

Rules:
- Extract EVERY numeric test marker visible. Include all panels (CBC, chemistry, lipids, etc).
- Use the reference ranges PRINTED ON THE REPORT when available; otherwise null.
- Values must be plain numbers (no commas, no symbols).
- If a value has '<' or '>' prefix, use the number and add it to name e.g. "Glucose (>400)".
- Do NOT invent markers that are not visible.`,
          },
          {
            type: 'image_url',
            image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` },
          },
        ],
      },
    ],
    thinking: { type: 'disabled' },
  });

  const raw = response.choices[0]?.message?.content || '';
  return parseExtracted(raw);
}

function parseExtracted(raw: string): ExtractedReport {
  // 提取 JSON(容错: 去掉可能的 markdown 代码块)
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('AI response did not contain JSON');
  let parsed: any;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error('Failed to parse extracted lab data');
  }
  const markers: LabMarker[] = (parsed.markers || [])
    .filter((m: any) => typeof m.value === 'number' && !Number.isNaN(m.value) && m.name)
    .map((m: any) => {
      const refLow = typeof m.refLow === 'number' ? m.refLow : undefined;
      const refHigh = typeof m.refHigh === 'number' ? m.refHigh : undefined;
      // 报告未标注范围时使用内置参考范围
      const norm = normalizeMarkerName(String(m.name));
      const fallback = FALLBACK_RANGES[norm];
      const effLow = refLow ?? fallback?.low;
      const effHigh = refHigh ?? fallback?.high;
      return {
        name: String(m.name),
        value: m.value,
        unit: String(m.unit || fallback?.unit || ''),
        refLow: effLow,
        refHigh: effHigh,
        category: String(m.category || fallback?.category || 'Other'),
        status: evaluateStatus(m.value, effLow, effHigh, String(m.name)),
      } as LabMarker;
    });
  return {
    patientName: String(parsed.patientName || 'Unknown'),
    reportDate: String(parsed.reportDate || new Date().toISOString().slice(0, 10)),
    labName: parsed.labName ? String(parsed.labName) : undefined,
    markers,
  };
}

// 第二步: LLM 生成通俗解读
export async function analyzeLabReport(extracted: ExtractedReport, history: { date: string; markers: LabMarker[] }[] = []): Promise<{ summary: string; redFlags: RedFlag[] }> {
  const zai = await ZAI.create();

  // 确定性红旗检测(不依赖 LLM, 保证安全兜底)
  const redFlags: RedFlag[] = [];
  for (const m of extracted.markers) {
    const norm = normalizeMarkerName(m.name);
    const crit = CRITICAL_THRESHOLDS[norm];
    if (crit?.low !== undefined && m.value <= crit.low) {
      redFlags.push({
        marker: m.name,
        value: `${m.value} ${m.unit}`,
        severity: 'critical',
        message: `${m.name} is at a critically low level (${m.value} ${m.unit}). This can be a medical emergency — seek urgent medical attention now.`,
      });
    } else if (crit?.high !== undefined && m.value >= crit.high) {
      redFlags.push({
        marker: m.name,
        value: `${m.value} ${m.unit}`,
        severity: 'critical',
        message: `${m.name} is at a critically high level (${m.value} ${m.unit}). This can be a medical emergency — seek urgent medical attention now.`,
      });
    }
  }

  const markersJson = JSON.stringify(extracted.markers.map(m => ({ name: m.name, value: m.value, unit: m.unit, ref: m.refLow !== undefined && m.refHigh !== undefined ? `${m.refLow}-${m.refHigh}` : 'n/a', status: m.status })));
  const historyJson = history.length
    ? JSON.stringify(history.map(h => ({ date: h.date, markers: h.markers.map(m => ({ name: m.name, value: m.value })) })))
    : 'none';

  const prompt = `You are Dr. V, the clinical explainer inside VitalLens — an app that helps ordinary people understand their lab results. A user just uploaded a lab report.

EXTRACTED MARKERS (current report):
${markersJson}

PATIENT NAME: ${extracted.patientName}
REPORT DATE: ${extracted.reportDate}

PREVIOUS REPORTS HISTORY (for trend context):
${historyJson}

Write a plain-language health briefing in markdown with EXACTLY these sections:

## What this report shows
2-3 sentences overview in friendly, non-alarming language (reading level: general public).

## Key findings
A markdown list. For each notable marker (abnormal ones first): **MarkerName (value unit)** — what it means in one sentence, plus "→" what it could relate to. Keep each item to max 2 sentences. If everything is normal, say so clearly.

## Trends over time
ONLY if history exists: compare current vs previous values, note direction and % change, and what the trend suggests. If no history, write exactly: "No previous reports yet — upload past reports to unlock trend analysis."

## What you can do next
3-4 practical, safe, actionable bullets (lifestyle, monitoring, when to see a doctor). Never diagnose. Always frame as "discuss with a healthcare professional" where appropriate.

## Questions to ask your doctor
2-3 smart questions the user could bring to their next appointment.

RULES:
- NEVER state a diagnosis. Use "can be associated with", "often relates to".
- Be warm, clear, and calm. No medical jargon without a plain-language gloss.
- Do NOT repeat the JSON. Write for a human.
- Total length: 250-400 words.`;

  const response = await zai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    thinking: { type: 'disabled' },
  });

  return { summary: response.choices[0]?.message?.content || '', redFlags };
}

// 症状分诊对话
export const TRIAGE_SYSTEM_PROMPT = `You are Nurse V, the AI symptom guide inside VitalLens. You help users figure out what level of care they need. You are NOT a doctor and never diagnose.

YOUR PROCESS (follow strictly):
1. First message: warmly invite the user to describe what they're feeling. Ask 1-2 focused follow-up questions at a time (onset, severity 1-10, associated symptoms, relevant history).
2. After you have enough context (usually 2-3 exchanges), give a structured assessment:

CARE LEVEL — one of:
• 🚨 EMERGENCY — call emergency services / go to ER now (red-flag symptoms: chest pain, difficulty breathing, stroke signs like facial droop/one-sided weakness/slurred speech, severe bleeding, suicidal thoughts, fainting, severe allergic reaction)
• 🩺 SEE A DOCTOR — book an appointment within a few days
• 💊 SELF-CARE — manage at home, monitor, see a doctor if it worsens

Then: WHY (2-3 sentences reasoning), WHAT TO DO NOW (2-3 bullets), WATCH FOR (warning signs that would escalate the care level).

RULES:
- If ANY red-flag symptom appears at ANY point, lead with 🚨 EMERGENCY immediately and repeat the emergency advice.
- Never name specific diseases as conclusions; you may mention what symptoms "can be associated with" when explaining urgency.
- Be warm, brief, and structured. Use short paragraphs and bullets. Max 200 words per message.
- End conversational messages with your next question. End assessments with a supportive closing line.
- If asked something off-topic, gently steer back to their symptoms.`;

// 医生就诊准备
export async function generateDoctorPrep(patientName: string, reports: { date: string; markers: LabMarker[]; summary?: string }[], symptomTranscript: string): Promise<string> {
  const zai = await ZAI.create();
  const reportsJson = JSON.stringify(reports.map(r => ({
    date: r.date,
    abnormal: r.markers.filter(m => m.status !== 'normal' && m.status !== 'unknown').map(m => `${m.name}: ${m.value} ${m.unit} (ref ${m.refLow ?? '?'}-${m.refHigh ?? '?'})`),
    allCount: r.markers.length,
  })));

  const prompt = `Create a "Doctor Visit Prep Sheet" for ${patientName || 'the patient'} as markdown. This will be printed and brought to a doctor's appointment.

DATA:
Lab reports summary:
${reportsJson}

Symptom conversation transcript (may be empty):
${symptomTranscript || '(none recorded)'}

Format EXACTLY as:

## Visit Prep Sheet — [current date]

### 1. Why I'm coming
2-3 sentences in first person ("I"), summarizing the situation using the lab data and symptoms.

### 2. My recent lab results
Compact markdown table: | Marker | Value | Reference | Status | for abnormal + most relevant markers (max 10 rows).

### 3. Changes over time
Brief trend notes (which markers moved and by how much).

### 4. My symptoms & timeline
Bullet list from the transcript, or "No symptom session recorded."

### 5. Questions I want to ask
4-5 specific, prioritized questions.

### 6. Medications & supplements I take
Write exactly: "(Space to fill in before the visit)"

RULES: First person voice. Concise. Factual. No diagnoses. 200-300 words.`;

  const response = await zai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    thinking: { type: 'disabled' },
  });
  return response.choices[0]?.message?.content || '';
}
