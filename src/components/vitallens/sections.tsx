'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, LineChart, HeartPulse, ClipboardList, ShieldCheck, Lock, Stethoscope, AlertTriangle } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: <Camera className="h-6 w-6" />,
      title: '1 · Snap or upload',
      desc: 'Photograph any blood test report — CBC, metabolic panel, lipids, thyroid. Vision AI reads every marker and its reference range, just like a lab technician would.',
    },
    {
      icon: <LineChart className="h-6 w-6" />,
      title: '2 · Track over time',
      desc: 'Each report joins your health timeline. VitalLens watches how markers move between dates and surfaces changes that a single report can miss.',
    },
    {
      icon: <HeartPulse className="h-6 w-6" />,
      title: '3 · Understand & act',
      desc: 'Dr. V explains findings in plain language, Nurse V guides symptom triage across three care levels, and Doctor Prep turns it all into a one-page visit sheet.',
    },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How VitalLens works</h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Three steps from a paper report to genuine understanding — powered by vision AI and a clinical language model working together.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.12, duration: 0.5 }}
          >
            <Card className="h-full border-t-4 border-t-teal-600/70 transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 w-fit rounded-xl bg-teal-600/10 p-3 text-teal-700">{s.icon}</div>
                <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function Safety() {
  const items = [
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: 'Never a diagnosis',
      desc: 'VitalLens explains and educates; it never names a condition as your diagnosis. Every briefing points you back to a healthcare professional.',
    },
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      title: 'Safety-first red flags',
      desc: 'A deterministic safety layer (not just AI) checks every report for critical values and symptom conversations for emergency signs — escalation always wins.',
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: 'Private by design',
      desc: 'Your data stays in your own session database. No accounts, no sharing with insurers or employers, and you can delete any report in one click.',
    },
    {
      icon: <Stethoscope className="h-5 w-5" />,
      title: 'Honest about limits',
      desc: 'Reference ranges shown are adult defaults; your report\u2019s printed ranges always take priority. VitalLens is best used alongside — never instead of — your doctor.',
    },
  ];
  return (
    <section id="safety" className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 p-8 sm:p-12">
        <div className="mb-8 flex flex-col items-start gap-3">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-teal-100">Our safety principles</span>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Built like a good nurse: honest, careful, on your side</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-teal-100/80">
            Health tools earn trust by being careful, not by pretending certainty. Here is exactly how VitalLens keeps you safe while making health data understandable.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {items.map((it) => (
            <div key={it.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition-colors hover:bg-white/10">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="rounded-lg bg-teal-400/20 p-2 text-teal-200">{it.icon}</div>
                <h3 className="font-semibold text-white">{it.title}</h3>
              </div>
              <p className="text-[13px] leading-relaxed text-teal-100/75">{it.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 border-t border-white/10 pt-5 text-xs leading-relaxed text-teal-200/60">
          VitalLens is an educational tool and does not provide medical advice, diagnosis, or treatment. Always seek the advice of a physician or other qualified health provider with any questions regarding a medical condition. Never disregard professional medical advice or delay seeking it because of something you have read here. If you think you may have a medical emergency, call your doctor or emergency services immediately.
        </p>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
        <p>© 2026 VitalLens · Built for the UnivaBio Hackathon — AI for Human Health</p>
        <p>Made with vision AI, clinical language models & care</p>
      </div>
    </footer>
  );
}
