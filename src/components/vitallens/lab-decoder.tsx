'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UploadCloud, FileImage, Stethoscope, Activity, AlertTriangle, Sparkles,
  Loader2, CheckCircle2, TrendingUp, RotateCcw, Trash2, Eye, ArrowRight,
} from 'lucide-react';
import { LabMarker, MarkerStatus, RedFlag, statusLabel } from '@/lib/medical';
import { Markdown } from './markdown';
import { useAppStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

export interface Report {
  id: string;
  title: string;
  patientName: string;
  reportDate: string;
  labName?: string;
  markers: LabMarker[];
  summary?: string;
  redFlags: RedFlag[];
  sourceImage?: string | null;
}

const STATUS_STYLES: Record<MarkerStatus, { badge: string; row: string; dot: string }> = {
  normal: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', row: '', dot: 'bg-emerald-500' },
  low: { badge: 'bg-amber-50 text-amber-700 border-amber-200', row: '', dot: 'bg-amber-500' },
  high: { badge: 'bg-amber-50 text-amber-700 border-amber-200', row: '', dot: 'bg-amber-500' },
  'critical-low': { badge: 'bg-red-50 text-red-700 border-red-200 font-semibold', row: 'bg-red-50/50', dot: 'bg-red-600 animate-pulse' },
  'critical-high': { badge: 'bg-red-50 text-red-700 border-red-200 font-semibold', row: 'bg-red-50/50', dot: 'bg-red-600 animate-pulse' },
  unknown: { badge: 'bg-muted text-muted-foreground border-border', row: '', dot: 'bg-gray-400' },
};

const PIPELINE_STEPS = [
  { key: 'read', label: 'Reading the report (vision AI)' },
  { key: 'extract', label: 'Extracting markers & reference ranges' },
  { key: 'analyze', label: 'Analyzing patterns & context' },
  { key: 'write', label: 'Writing your plain-language briefing' },
];

export function LabDecoder({ onGoTimeline }: { onGoTimeline: () => void }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<Report | null>(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const { reportsVersion, bumpReports } = useAppStore();

  const loadReports = useCallback(async () => {
    try {
      const res = await fetch('/api/lab-reports');
      const data = await res.json();
      const list: Report[] = data.reports || [];
      setReports(list);
      setSelected((prev) => prev ?? list[0] ?? null);
    } catch {
      toast({ title: 'Could not load reports', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports, reportsVersion]);

  // 选择最新报告
  useEffect(() => {
    if (reports.length && !selected) setSelected(reports[0]);
  }, [reports, selected]);

  const analyze = useCallback(async (dataUrl: string) => {
    setUploading(true);
    setStep(0);
    setPreviewImg(dataUrl);
    const timers = [
      setTimeout(() => setStep(1), 1200),
      setTimeout(() => setStep(2), 3600),
      setTimeout(() => setStep(3), 6800),
    ];
    try {
      const res = await fetch('/api/lab-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      timers.forEach(clearTimeout);
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      toast({ title: 'Report analyzed ✓', description: `${data.report.markers.length} markers extracted and interpreted.` });
      bumpReports();
      setSelected(data.report);
      setPreviewImg(null);
    } catch (e: any) {
      timers.forEach(clearTimeout);
      toast({ title: 'Analysis failed', description: e.message, variant: 'destructive' });
      setPreviewImg(null);
    } finally {
      setUploading(false);
      setStep(0);
    }
  }, [bumpReports]);

  const readFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please upload an image file', description: 'JPG, PNG or WebP photos of your lab report.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => analyze(reader.result as string);
    reader.readAsDataURL(file);
  }, [analyze]);

  const trySample = useCallback(async () => {
    try {
      const res = await fetch('/samples/sample-lab-report.png');
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => analyze(reader.result as string);
      reader.readAsDataURL(blob);
    } catch {
      toast({ title: 'Sample unavailable', variant: 'destructive' });
    }
  }, [analyze]);

  const loadDemo = useCallback(async () => {
    try {
      const res = await fetch('/api/demo-seed', { method: 'POST' });
      if (!res.ok) throw new Error('seed failed');
      toast({ title: 'Demo timeline loaded', description: "Sarah Chen's 3 reports (Mar / Jun / Oct 2026) are ready." });
      bumpReports();
    } catch {
      toast({ title: 'Could not load demo data', variant: 'destructive' });
    }
  }, [bumpReports]);

  const deleteReport = useCallback(async (id: string) => {
    try {
      await fetch(`/api/lab-reports?id=${id}`, { method: 'DELETE' });
      setSelected(null);
      bumpReports();
      toast({ title: 'Report deleted' });
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  }, [bumpReports]);

  const abnormal = selected?.markers.filter((m) => m.status !== 'normal' && m.status !== 'unknown') || [];
  const critical = selected?.markers.filter((m) => m.status.startsWith('critical')) || [];
  const hasRedFlags = critical.length > 0 || (selected?.redFlags?.length || 0) > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* 左侧: 上传区 + 报告列表 */}
      <div className="space-y-4">
        <Card className="overflow-hidden border-2 border-dashed border-teal-200 bg-gradient-to-b from-teal-50/60 to-white">
          <CardContent className="p-6">
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload lab report image"
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) readFile(f); }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all hover:border-teal-400 hover:bg-teal-50/50 ${dragOver ? 'border-teal-500 bg-teal-50 scale-[1.01]' : 'border-teal-200'}`}
            >
              <div className="mb-3 rounded-full bg-teal-600/10 p-3.5">
                <UploadCloud className="h-8 w-8 text-teal-700" />
              </div>
              <p className="font-semibold text-foreground">Upload a lab report</p>
              <p className="mt-1 text-sm text-muted-foreground">Drag & drop a photo, or click to browse.<br />PDF exports of blood tests work great too (as images).</p>
            </div>
            <input
              ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = ''; }}
            />
            <div className="mt-4 flex flex-col gap-2">
              <Button onClick={trySample} disabled={uploading} variant="outline" className="w-full justify-start gap-2">
                <FileImage className="h-4 w-4 text-teal-700" /> Try a sample report image
              </Button>
              <Button onClick={loadDemo} disabled={uploading} variant="outline" className="w-full justify-start gap-2">
                <TrendingUp className="h-4 w-4 text-teal-700" /> Load demo timeline (3 reports)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 报告历史 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-teal-700" /> Your reports</span>
              <span className="text-xs font-normal text-muted-foreground">{reports.length} saved</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
            ) : reports.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                <Activity className="mx-auto mb-2 h-8 w-8 opacity-30" />
                No reports yet. Upload one or load the demo timeline to explore.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto vl-scroll">
                {reports.map((r) => {
                  const abn = r.markers.filter((m) => m.status !== 'normal' && m.status !== 'unknown').length;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/60 ${selected?.id === r.id ? 'bg-teal-50/70 border-l-2 border-l-teal-600' : ''}`}
                    >
                      <div className="mt-0.5 rounded-md bg-teal-600/10 p-1.5"><FileImage className="h-4 w-4 text-teal-700" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{new Date(r.reportDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {r.patientName}</p>
                        <p className="truncate text-xs text-muted-foreground">{r.markers.length} markers · {r.labName || 'Lab report'}</p>
                      </div>
                      {abn > 0 && <Badge variant="outline" className="shrink-0 border-amber-200 bg-amber-50 text-amber-700">{abn} off</Badge>}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 右侧: 分析结果 */}
      <div className="space-y-4">
        {uploading && <AnalyzingCard step={step} preview={previewImg} />}

        {!uploading && !selected && !loading && (
          <EmptyState onTrySample={trySample} onLoadDemo={loadDemo} />
        )}

        {!uploading && selected && (
          <>
            {/* 红旗警告 */}
            {hasRedFlags && (
              <Alert variant="destructive" className="border-red-300 bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-800">Urgent values detected — please read</AlertTitle>
                <AlertDescription className="space-y-1 text-red-700">
                  {(selected.redFlags?.length ? selected.redFlags : critical.map((m) => ({
                    marker: m.name, value: `${m.value} ${m.unit}`, severity: 'critical' as const,
                    message: `${m.name} is at a critical level (${m.value} ${m.unit}). Please seek medical care promptly.`,
                  }))).map((f: RedFlag, i: number) => (
                    <p key={i}>• <strong>{f.marker} = {f.value}</strong> — {f.message}</p>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            {/* 摘要统计 */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={<FileImage className="h-4 w-4" />} label="Markers read" value={String(selected.markers.length)} tone="teal" />
              <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="In range" value={String(selected.markers.length - abnormal.length)} tone="emerald" />
              <StatCard icon={<Activity className="h-4 w-4" />} label="Out of range" value={String(abnormal.length)} tone={abnormal.length ? 'amber' : 'slate'} />
              <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Critical" value={String(critical.length)} tone={critical.length ? 'red' : 'slate'} />
            </div>

            <Tabs defaultValue="briefing" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="briefing" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> AI briefing</TabsTrigger>
                <TabsTrigger value="markers" className="gap-1.5"><Activity className="h-3.5 w-3.5" /> All markers</TabsTrigger>
              </TabsList>
              <TabsContent value="briefing" className="mt-4">
                <Card>
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <div>
                      <CardTitle className="text-base">Your plain-language briefing</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(selected.reportDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {selected.labName || 'Lab report'} · {selected.patientName}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {selected.sourceImage && (
                        <Button size="icon" variant="ghost" onClick={() => setPreviewImg(selected.sourceImage!)} title="View original">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => deleteReport(selected.id)} title="Delete report" className="text-muted-foreground hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selected.summary ? <Markdown content={selected.summary} /> : <p className="text-sm text-muted-foreground">No briefing stored for this report.</p>}
                    <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                      <Button onClick={onGoTimeline} variant="outline" size="sm" className="gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-teal-700" /> See trends across reports <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="markers" className="mt-4">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base">Extracted markers</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[560px] overflow-y-auto vl-scroll">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="px-4 py-2.5 font-medium">Marker</th>
                            <th className="px-4 py-2.5 font-medium">Result</th>
                            <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Reference</th>
                            <th className="px-4 py-2.5 text-right font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupMarkers(selected.markers).map(([cat, ms]) => (
                            <>
                              <tr key={cat} className="bg-teal-50/50">
                                <td colSpan={4} className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-teal-800">{cat}</td>
                              </tr>
                              {ms.map((m) => {
                                const st = STATUS_STYLES[m.status];
                                return (
                                  <tr key={m.name} className={`border-b last:border-0 ${st.row}`}>
                                    <td className="px-4 py-2.5 font-medium">{m.name}</td>
                                    <td className="px-4 py-2.5">{m.value} <span className="text-xs text-muted-foreground">{m.unit}</span></td>
                                    <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">
                                      {m.refLow !== undefined && m.refHigh !== undefined ? `${m.refLow} – ${m.refHigh}` : '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-right"><span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${st.badge}`}><span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{statusLabel(m.status)}</span></td>
                                  </tr>
                                );
                              })}
                            </>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <Dialog open={!!previewImg && !uploading} onOpenChange={(o) => !o && setPreviewImg(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Original report</DialogTitle></DialogHeader>
          {previewImg && <img src={previewImg} alt="Uploaded lab report" className="max-h-[70vh] w-full rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function groupMarkers(markers: LabMarker[]): [string, LabMarker[]][] {
  const map = new Map<string, LabMarker[]>();
  for (const m of markers) {
    const cat = m.category || 'Other';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(m);
  }
  return Array.from(map.entries());
}

function AnalyzingCard({ step, preview }: { step: number; preview: string | null }) {
  return (
    <Card className="border-teal-200 bg-gradient-to-b from-teal-50/50 to-white">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-teal-600/10 p-2"><Sparkles className="h-full w-full animate-pulse text-teal-700" /></div>
          </div>
          <div>
            <p className="font-semibold">Analyzing your report…</p>
            <p className="text-xs text-muted-foreground">Vision AI + clinical language model working together</p>
          </div>
        </div>
        <div className="space-y-3">
          {PIPELINE_STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-3">
              {i < step ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                : i === step ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-teal-700" />
                : <div className="h-4 w-4 shrink-0 rounded-full border-2 border-muted" />}
              <span className={`text-sm ${i <= step ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
            </div>
          ))}
        </div>
        <Progress value={((step + 1) / PIPELINE_STEPS.length) * 100} className="mt-4 h-1.5" />
        {preview && (
          <div className="mt-5 flex justify-center rounded-lg border bg-white p-2">
            <img src={preview} alt="Report being analyzed" className="max-h-48 rounded object-contain opacity-80" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ onTrySample, onLoadDemo }: { onTrySample: () => void; onLoadDemo: () => void }) {
  return (
    <Card className="flex min-h-[420px] items-center justify-center border-dashed">
      <CardContent className="p-10 text-center">
        <div className="mx-auto mb-4 w-fit rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 shadow-lg shadow-teal-600/20">
          <ScanHeart className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-xl font-semibold">Turn a lab report into understanding</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Snap a photo of any blood test result. VitalLens reads every marker with vision AI,
          flags anything out of range, and explains what it all means — in plain language.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={onTrySample} className="gap-2 bg-teal-700 hover:bg-teal-800"><FileImage className="h-4 w-4" /> Try a sample report</Button>
          <Button onClick={onLoadDemo} variant="outline" className="gap-2"><RotateCcw className="h-4 w-4" /> Load demo timeline</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ScanHeart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11.6 3.5 4 8.5v7l7.6 5 7.6-5v-7Z" />
      <path d="M12 11.5h.01" />
      <path d="M8.5 15a3.5 3.5 0 0 1 7 0" />
    </svg>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'teal' | 'emerald' | 'amber' | 'red' | 'slate' }) {
  const tones: Record<string, string> = {
    teal: 'text-teal-700 bg-teal-50 border-teal-100',
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-700 bg-amber-50 border-amber-100',
    red: 'text-red-700 bg-red-50 border-red-100',
    slate: 'text-muted-foreground bg-muted/50 border-border',
  };
  return (
    <Card className={`border ${tones[tone]}`}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-white/70 p-2 shadow-sm">{icon}</div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="mt-1 text-xs opacity-80">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
