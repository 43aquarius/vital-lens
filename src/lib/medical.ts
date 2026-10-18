// VitalLens 医学核心库: 类型、参考范围、红旗逻辑

export type MarkerStatus = 'normal' | 'low' | 'high' | 'critical-low' | 'critical-high' | 'unknown';

export interface LabMarker {
  name: string;
  value: number;
  unit: string;
  refLow?: number;
  refHigh?: number;
  category?: string; // CBC, Metabolic, Lipids, Thyroid, Iron ...
  status: MarkerStatus;
  note?: string;
}

export interface RedFlag {
  marker: string;
  value: string;
  severity: 'critical' | 'warning';
  message: string;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface MarkerTrend {
  name: string;
  unit: string;
  points: TrendPoint[];
  changePct?: number;
  direction: 'up' | 'down' | 'flat';
  status: MarkerStatus;
}

// 成人通用参考范围(实际以报告标注为准; 此表用于报告未标注时 + 趋势评估)
export const FALLBACK_RANGES: Record<string, { low: number; high: number; unit: string; category: string }> = {
  'hemoglobin': { low: 13.5, high: 17.5, unit: 'g/dL', category: 'CBC' },
  'hematocrit': { low: 41, high: 53, unit: '%', category: 'CBC' },
  'rbc': { low: 4.5, high: 5.9, unit: '10^6/uL', category: 'CBC' },
  'wbc': { low: 4.5, high: 11.0, unit: '10^3/uL', category: 'CBC' },
  'platelets': { low: 150, high: 400, unit: '10^3/uL', category: 'CBC' },
  'mcv': { low: 80, high: 100, unit: 'fL', category: 'CBC' },
  'mch': { low: 27, high: 33, unit: 'pg', category: 'CBC' },
  'mchc': { low: 32, high: 36, unit: 'g/dL', category: 'CBC' },
  'ferritin': { low: 30, high: 400, unit: 'ng/mL', category: 'Iron Studies' },
  'iron': { low: 60, high: 170, unit: 'ug/dL', category: 'Iron Studies' },
  'tibc': { low: 240, high: 450, unit: 'ug/dL', category: 'Iron Studies' },
  'transferrin_saturation': { low: 20, high: 50, unit: '%', category: 'Iron Studies' },
  'glucose': { low: 70, high: 99, unit: 'mg/dL', category: 'Metabolic' },
  'hba1c': { low: 4, high: 5.6, unit: '%', category: 'Metabolic' },
  'alt': { low: 7, high: 56, unit: 'U/L', category: 'Liver' },
  'ast': { low: 10, high: 40, unit: 'U/L', category: 'Liver' },
  'alp': { low: 44, high: 147, unit: 'U/L', category: 'Liver' },
  'bilirubin_total': { low: 0.1, high: 1.2, unit: 'mg/dL', category: 'Liver' },
  'albumin': { low: 3.5, high: 5.2, unit: 'g/dL', category: 'Liver' },
  'creatinine': { low: 0.6, high: 1.3, unit: 'mg/dL', category: 'Kidney' },
  'egfr': { low: 90, high: 120, unit: 'mL/min/1.73', category: 'Kidney' },
  'bun': { low: 7, high: 20, unit: 'mg/dL', category: 'Kidney' },
  'sodium': { low: 136, high: 145, unit: 'mmol/L', category: 'Electrolytes' },
  'potassium': { low: 3.5, high: 5.1, unit: 'mmol/L', category: 'Electrolytes' },
  'chloride': { low: 98, high: 107, unit: 'mmol/L', category: 'Electrolytes' },
  'calcium': { low: 8.5, high: 10.5, unit: 'mg/dL', category: 'Electrolytes' },
  'tsh': { low: 0.4, high: 4.0, unit: 'mIU/L', category: 'Thyroid' },
  't4_free': { low: 0.8, high: 1.8, unit: 'ng/dL', category: 'Thyroid' },
  't3_total': { low: 80, high: 200, unit: 'ng/dL', category: 'Thyroid' },
  'vitamin_d': { low: 30, high: 100, unit: 'ng/mL', category: 'Vitamins' },
  'vitamin_b12': { low: 200, high: 900, unit: 'pg/mL', category: 'Vitamins' },
  'total_cholesterol': { low: 0, high: 200, unit: 'mg/dL', category: 'Lipids' },
  'ldl': { low: 0, high: 100, unit: 'mg/dL', category: 'Lipids' },
  'hdl': { low: 40, high: 80, unit: 'mg/dL', category: 'Lipids' },
  'triglycerides': { low: 0, high: 150, unit: 'mg/dL', category: 'Lipids' },
  'crp': { low: 0, high: 1.0, unit: 'mg/dL', category: 'Inflammation' },
  'esr': { low: 0, high: 20, unit: 'mm/hr', category: 'Inflammation' },
  'psa': { low: 0, high: 4.0, unit: 'ng/mL', category: 'Other' },
  'uric_acid': { low: 3.5, high: 7.2, unit: 'mg/dL', category: 'Other' },
};

// 危急值阈值(达到即触发红色警告)
export const CRITICAL_THRESHOLDS: Record<string, { low?: number; high?: number }> = {
  'hemoglobin': { low: 7.0, high: 20 },
  'platelets': { low: 50, high: 1000 },
  'glucose': { low: 50, high: 400 },
  'potassium': { low: 2.5, high: 6.0 },
  'sodium': { low: 120, high: 160 },
  'calcium': { low: 6.5, high: 12.5 },
  'creatinine': { high: 4.0 },
  'alt': { high: 500 },
  'ast': { high: 500 },
  'bilirubin_total': { high: 5.0 },
  'wbc': { low: 1.5, high: 30 },
};

export function normalizeMarkerName(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, '_')
    .replace(/haemoglobin|hgb|hb$/, 'hemoglobin')
    .replace(/haematocrit|hct$/, 'hematocrit')
    .replace(/platelet_count|plt$/, 'platelets')
    .replace(/white_blood_cell|wbc$/, 'wbc')
    .replace(/red_blood_cell|rbc$/, 'rbc')
    .replace(/fasting_glucose|blood_glucose|glucose_fasting$/, 'glucose')
    .replace(/ferritin_serum$/, 'ferritin')
    .replace(/tsh_serum$/, 'tsh')
    .replace(/total_cholesterol_$/, 'total_cholesterol');
}

export function evaluateStatus(value: number, refLow?: number, refHigh?: number, markerName?: string): MarkerStatus {
  const norm = markerName ? normalizeMarkerName(markerName) : '';
  const crit = CRITICAL_THRESHOLDS[norm];
  if (crit) {
    if (crit.low !== undefined && value <= crit.low) return 'critical-low';
    if (crit.high !== undefined && value >= crit.high) return 'critical-high';
  }
  const low = refLow;
  const high = refHigh;
  if (low !== undefined && value < low) return 'low';
  if (high !== undefined && value > high) return 'high';
  if (low !== undefined && high !== undefined) return 'normal';
  return 'unknown';
}

export function isAbnormal(status: MarkerStatus): boolean {
  return status !== 'normal' && status !== 'unknown';
}

export function statusLabel(status: MarkerStatus): string {
  switch (status) {
    case 'normal': return 'Normal';
    case 'low': return 'Below range';
    case 'high': return 'Above range';
    case 'critical-low': return 'CRITICAL LOW';
    case 'critical-high': return 'CRITICAL HIGH';
    default: return 'No reference';
  }
}

// 从多份报告计算趋势
export function computeTrends(reports: { reportDate: Date; markers: LabMarker[] }[]): MarkerTrend[] {
  const sorted = [...reports].sort((a, b) => a.reportDate.getTime() - b.reportDate.getTime());
  const byMarker = new Map<string, { unit: string; points: TrendPoint[]; refLow?: number; refHigh?: number; latestStatus: MarkerStatus }>();
  for (const r of sorted) {
    for (const m of r.markers) {
      const key = m.name;
      if (!byMarker.has(key)) {
        byMarker.set(key, { unit: m.unit, points: [], refLow: m.refLow, refHigh: m.refHigh, latestStatus: m.status });
      }
      const entry = byMarker.get(key)!;
      entry.points.push({ date: r.reportDate.toISOString().slice(0, 10), value: m.value });
      entry.latestStatus = m.status;
      if (m.refLow !== undefined) entry.refLow = m.refLow;
      if (m.refHigh !== undefined) entry.refHigh = m.refHigh;
    }
  }
  const trends: MarkerTrend[] = [];
  for (const [name, e] of byMarker) {
    if (e.points.length < 1) continue;
    let direction: 'up' | 'down' | 'flat' = 'flat';
    let changePct: number | undefined;
    if (e.points.length >= 2) {
      const first = e.points[0].value;
      const last = e.points[e.points.length - 1].value;
      if (first !== 0) changePct = Math.round(((last - first) / Math.abs(first)) * 1000) / 10;
      direction = changePct === undefined ? 'flat' : changePct > 2 ? 'up' : changePct < -2 ? 'down' : 'flat';
    }
    trends.push({ name, unit: e.unit, points: e.points, changePct, direction, status: e.latestStatus });
  }
  return trends.sort((a, b) => {
    const aAb = isAbnormal(a.status) ? 0 : 1;
    const bAb = isAbnormal(b.status) ? 0 : 1;
    if (aAb !== bAb) return aAb - bAb;
    return (b.changePct ? Math.abs(b.changePct) : 0) - (a.changePct ? Math.abs(a.changePct) : 0);
  });
}
