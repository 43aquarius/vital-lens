'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { MarkerTrend, isAbnormal, FALLBACK_RANGES, normalizeMarkerName } from '@/lib/medical';
import { useAppStore } from '@/lib/store';
import { Markdown } from './markdown';

import { toast } from '@/hooks/use-toast';

export function HealthTimeline() {
  const [trends, setTrends] = useState<MarkerTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrend, setSelectedTrend] = useState<MarkerTrend | null>(null);
  const [aiTrendNote, setAiTrendNote] = useState<string | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const { reportsVersion } = useAppStore();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/lab-reports/trends');
        const data = await res.json();
        const t: MarkerTrend[] = data.trends || [];
        setTrends(t);
        const interesting = t.find((x) => isAbnormal(x.status) && x.points.length >= 2) || t.find((x) => x.points.length >= 2) || null;
        setSelectedTrend(interesting);
      } finally {
        setLoading(false);
      }
    })();
  }, [reportsVersion]);

  // 生成 AI 全史解读
  const askAiTrend = async () => {
    if (!selectedTrend) return;
    setNoteLoading(true);
    setAiTrendNote(null);
    try {
      const res = await fetch('/api/doctor-prep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const sd = await res.json();
      if (!res.ok) throw new Error(sd.error || 'failed');
      setAiTrendNote(sd.prep || null);
    } catch {
      setAiTrendNote(null);
      toast({ title: 'Could not generate review', variant: 'destructive' });
    } finally {
      setNoteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  const trackedTrends = trends.filter((t) => t.points.length >= 2);
  const singleTrends = trends.filter((t) => t.points.length === 1);

  if (!trends.length) {
    return (
      <Card className="flex min-h-[320px] items-center justify-center border-dashed">
        <CardContent className="p-8 text-center">
          <TrendingUp className="mx-auto mb-3 h-10 w-10 text-teal-700/50" />
          <h3 className="font-semibold">No history yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Upload at least two lab reports from different dates to unlock trend intelligence —
            VitalLens watches how your markers move over time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* 概览条 */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-gradient-to-r from-teal-50/80 to-transparent p-4">
        <div className="rounded-lg bg-teal-600/10 p-2"><TrendingUp className="h-5 w-5 text-teal-700" /></div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{trackedTrends.length} markers tracked across reports</p>
          <p className="text-xs text-muted-foreground">VitalLens compares every new report with your history to catch changes early.</p>
        </div>
        {trackedTrends.filter((t) => isAbnormal(t.status)).length > 0 && (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
            <AlertCircle className="mr-1 h-3 w-3" /> {trackedTrends.filter((t) => isAbnormal(t.status)).length} need attention
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* 左: 趋势列表 */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Marker trends</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[520px] overflow-y-auto vl-scroll">
              {trackedTrends.map((t) => {
                const active = selectedTrend?.name === t.name;
                const icon = t.direction === 'up' ? <TrendingUp className="h-4 w-4" />
                  : t.direction === 'down' ? <TrendingDown className="h-4 w-4" />
                  : <Minus className="h-4 w-4" />;
                return (
                  <button
                    key={t.name}
                    onClick={() => { setSelectedTrend(t); setAiTrendNote(null); }}
                    className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/60 ${active ? 'bg-teal-50/70 border-l-2 border-l-teal-600' : ''}`}
                  >
                    <span className={`rounded-md p-1.5 ${
                      isAbnormal(t.status) ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>{icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.points[t.points.length - 1].value} {t.unit}
                        {t.changePct !== undefined && ` · ${t.changePct > 0 ? '+' : ''}${t.changePct}%`}
                      </p>
                    </div>
                    {isAbnormal(t.status) && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                  </button>
                );
              })}
              {singleTrends.length > 0 && (
                <div className="border-t bg-muted/30 px-4 py-2">
                  <p className="text-xs font-medium text-muted-foreground">Only one data point (needs 2+ for trends):</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {singleTrends.slice(0, 10).map((t) => (
                      <Badge key={t.name} variant="outline" className="text-[11px] font-normal text-muted-foreground">{t.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 右: 图表 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>{selectedTrend?.name || 'Select a marker'}</span>
              {selectedTrend?.changePct !== undefined && (
                <Badge variant="outline" className={
                  selectedTrend.changePct > 0 ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : selectedTrend.changePct < 0 ? 'border-teal-200 bg-teal-50 text-teal-700'
                  : 'border-border bg-muted text-muted-foreground'
                }>
                  {selectedTrend.changePct > 0 ? '▲' : selectedTrend.changePct < 0 ? '▼' : '—'} {Math.abs(selectedTrend.changePct)}% over {selectedTrend?.points.length} reports
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTrend ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedTrend.points} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} domain={yDomain(selectedTrend)} />
                    <Tooltip
                      contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13 }}
                      formatter={(v: number) => [`${v} ${selectedTrend.unit}`, selectedTrend.name]}
                    />
                    {(() => {
                      const range = reportsRefForRange(selectedTrend.name);
                      if (!range) return null;
                      const dom = yDomain(selectedTrend);
                      const dMin = typeof dom[0] === 'number' ? dom[0] : range.low;
                      const dMax = typeof dom[1] === 'number' ? dom[1] : range.high;
                      // 裁剪参考带到可见域, 避免 recharts 丢弃越界的 ReferenceArea
                      const y1 = Math.max(range.low, dMin);
                      const y2 = Math.min(range.high, dMax);
                      if (y2 <= y1) return null;
                      return <ReferenceArea y1={y1} y2={y2} fill="#10b981" fillOpacity={0.08} />;
                    })()}
                    <Line
                      type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2.5}
                      dot={{ r: 4, fill: '#0f766e' }} activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Green band = normal reference range. Falling outside the band doesn&apos;t mean a diagnosis — always discuss results with a clinician.
                </p>
              </div>
            ) : (
              <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">Select a marker to see its trend</div>
            )}
            <div className="mt-4 border-t pt-4">
              {noteLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-teal-700" /> Dr. V is reviewing your full history…</div>
              ) : aiTrendNote ? (
                <div className="rounded-lg border border-teal-100 bg-teal-50/40 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-teal-800"><Sparkles className="h-4 w-4" /> Full-history review by Dr. V</p>
                  <Markdown content={aiTrendNote} className="text-sm" />
                </div>
              ) : (
                <Button onClick={askAiTrend} variant="outline" size="sm" className="gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-teal-700" /> Ask Dr. V to review my full history
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 从内置参考范围取图表用正常区间
function reportsRefForRange(name: string): { low: number; high: number } | null {
  const fb = FALLBACK_RANGES[normalizeMarkerName(name)];
  return fb ? { low: fb.low, high: fb.high } : null;
}

// Y 轴范围: 确保数据与参考带都可见,同时避免超大参考范围压扁曲线
function yDomain(t: MarkerTrend): [number | string, number | string] {
  const values = t.points.map((p) => p.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const range = reportsRefForRange(t.name);
  if (!range) return ['auto', 'auto'];
  const span = dataMax - dataMin || Math.abs(dataMax) * 0.2 || 1;
  // 参考带上限若远超数据,限制在数据最大值 + 1个数据跨度,避免压扁
  const effHigh = Math.min(range.high, dataMax + span);
  const effLow = Math.min(range.low, dataMin);
  const pad = (effHigh - effLow) * 0.12 || 1;
  return [Math.max(0, effLow - pad), effHigh + pad];
}
