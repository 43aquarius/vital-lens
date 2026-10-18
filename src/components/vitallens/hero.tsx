'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScanHeart, ArrowDown, Eye, MessageCircleHeart, ClipboardList, ShieldCheck } from 'lucide-react';

const stats = [
  { value: '40+', label: 'blood markers recognized' },
  { value: '3', label: 'levels of care guidance' },
  { value: '< 30s', label: 'from photo to plain-language briefing' },
];

export function Hero() {
  return (
    <header className="relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-teal-100/50 blur-3xl" />
        <div className="absolute right-[10%] top-40 h-56 w-56 rounded-full bg-emerald-100/60 blur-2xl" />
        <svg className="absolute inset-x-0 bottom-0 h-40 w-full text-teal-600/5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* 导航 */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <a href="#" className="flex items-center gap-2.5">
          <div className="rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 p-2 shadow-md shadow-teal-600/20">
            <ScanHeart className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Vital<span className="text-teal-700">Lens</span></span>
        </a>
        <div className="flex items-center gap-3">
          <a href="#how" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">How it works</a>
          <a href="#safety" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">Safety</a>
          <Button asChild className="rounded-full bg-teal-700 px-5 hover:bg-teal-800">
            <a href="#app">Open the app</a>
          </Button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Badge variant="outline" className="mb-5 gap-1.5 rounded-full border-teal-200 bg-teal-50 px-3 py-1 text-teal-800">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-teal-600" /></span>
              AI for Human Health · built for UnivaBio 2026
            </Badge>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Your blood tests,
              <br />
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">finally speaking your language.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              VitalLens turns lab reports and symptoms into clear, calm guidance — helping you
              <strong className="font-semibold text-foreground"> detect illness earlier</strong>,
              <strong className="font-semibold text-foreground"> understand it better</strong>, and
              <strong className="font-semibold text-foreground"> live with it more easily</strong>.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2 rounded-full bg-teal-700 px-7 text-base hover:bg-teal-800">
                <a href="#app"><Eye className="h-5 w-5" /> Decode my first report</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 rounded-full px-7 text-base">
                <a href="#how">How it works <ArrowDown className="h-4 w-4" /></a>
              </Button>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
                >
                  <p className="text-2xl font-bold text-teal-800 sm:text-3xl">{s.value}</p>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 右侧演示卡 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            className="relative hidden lg:block"
          >
            <div className="relative rotate-1 rounded-2xl border bg-white p-5 shadow-xl shadow-teal-900/10 transition-transform hover:rotate-0">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Latest briefing</p>
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[11px] text-amber-700">2 markers off</Badge>
              </div>
              <div className="space-y-2.5">
                {[
                  { n: 'Hemoglobin', v: '10.8 g/dL', r: '12.0–15.5', off: true },
                  { n: 'Ferritin', v: '14 ng/mL', r: '30–400', off: true },
                  { n: 'Glucose', v: '90 mg/dL', r: '70–99', off: false },
                  { n: 'TSH', v: '2.0 mIU/L', r: '0.4–4.0', off: false },
                ].map((m) => (
                  <div key={m.n} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${m.off ? 'border-amber-200 bg-amber-50/70' : 'border-border bg-muted/30'}`}>
                    <span className="text-sm font-medium">{m.n}</span>
                    <span className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">{m.v}</span>
                      <span className={`h-2 w-2 rounded-full ${m.off ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 p-3.5">
                <p className="flex items-start gap-2 text-[13px] leading-relaxed text-teal-900">
                  <MessageCircleHeart className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                  <span><strong>Dr. V:</strong> Your iron stores have fallen 69% since March. This pattern usually responds well to treatment — book a doctor&apos;s visit and ask about an iron workup.</span>
                </p>
              </div>
            </div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
              className="absolute -bottom-6 -left-8 -rotate-2 rounded-xl border bg-white p-3.5 shadow-lg"
            >
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-emerald-50 p-2"><ClipboardList className="h-4 w-4 text-emerald-600" /></div>
                <div>
                  <p className="text-xs font-semibold">Visit prep ready</p>
                  <p className="text-[11px] text-muted-foreground">5 questions for your doctor</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.6 }}
              className="absolute -right-6 -top-6 rotate-3 rounded-xl border bg-white p-3.5 shadow-lg"
            >
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-teal-50 p-2"><ShieldCheck className="h-4 w-4 text-teal-600" /></div>
                <div>
                  <p className="text-xs font-semibold">No diagnosis, ever</p>
                  <p className="text-[11px] text-muted-foreground">Guidance & education only</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
