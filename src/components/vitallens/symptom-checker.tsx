'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { HeartPulse, Send, Loader2, ShieldAlert, RotateCcw, User, Stethoscope } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

interface Msg { role: 'user' | 'assistant'; content: string; ts: number }

const SUGGESTIONS = [
  'I have a headache and mild fever since yesterday',
  'My chest feels tight when I climb stairs',
  "I've been unusually tired for two weeks",
  'My child has a rash and mild fever',
];

const WELCOME: Msg = {
  role: 'assistant',
  ts: Date.now(),
  content: `Hi, I'm **Nurse V** 👋 I'm here to help you figure out **what level of care you might need** — whether that's self-care at home, a doctor's visit, or urgent emergency care.

Tell me: **what are you feeling right now?** (For example: where it hurts, when it started, how bad it is on a 1–10 scale.)`,
};

export function SymptomChecker() {
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setSymptomTranscript } = useAppStore();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  // 保存转录(供 Doctor Prep 使用, 持久化以跨页面)
  useEffect(() => {
    const transcript = messages
      .filter((m) => m !== WELCOME)
      .map((m) => `${m.role === 'user' ? 'Patient' : 'Nurse V'}: ${m.content}`)
      .join('\n');
    setSymptomTranscript(transcript);
    try { localStorage.setItem('vl_symptoms', transcript); } catch { /* ignore */ }
  }, [messages, setSymptomTranscript]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || thinking) return;
    const next: Msg[] = [...messages, { role: 'user', content, ts: Date.now() }];
    setMessages(next);
    setInput('');
    setThinking(true);
    try {
      const res = await fetch('/api/symptom-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.filter((m) => m !== WELCOME).map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages([...next, { role: 'assistant', content: data.reply, ts: Date.now() }]);
    } catch (e: any) {
      toast({ title: 'Message failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setThinking(false);
    }
  };

  const reset = () => {
    setMessages([WELCOME]);
    setInput('');
  };

  const hasEmergency = messages.some((m) => m.content.includes('🚨'));

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <Card className="flex h-[620px] flex-col">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 p-2.5 shadow-md shadow-teal-600/20">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Nurse V — Symptom Guide</CardTitle>
              <p className="text-xs text-muted-foreground">Triage guidance · never a diagnosis</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={reset} title="Start over"><RotateCcw className="h-4 w-4" /></Button>
        </CardHeader>

        <div ref={scrollRef} className="vl-scroll flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {messages.map((m, i) => (
            <MessageBubble key={i} msg={m} />
          ))}
          {thinking && (
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <div className="rounded-2xl rounded-bl-sm border bg-white p-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:300ms]" />
                </div>
              </div>
              Nurse V is thinking…
            </div>
          )}
        </div>

        <div className="border-t p-3 sm:p-4">
          {messages.length <= 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder="Describe your symptoms… (Enter to send)"
              className="min-h-[52px] resize-none border-teal-200 focus-visible:ring-teal-500"
              aria-label="Describe your symptoms"
              maxRows={3}
            />
            <Button onClick={() => send()} disabled={thinking || !input.trim()} className="aspect-square h-[52px] w-[52px] shrink-0 bg-teal-700 p-0 hover:bg-teal-800" aria-label="Send">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* 侧栏 */}
      <div className="space-y-4">
        {hasEmergency ? (
          <Alert variant="destructive" className="border-red-300 bg-red-50">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800">Emergency guidance active</AlertTitle>
            <AlertDescription className="text-red-700">
              If you or someone near you has emergency symptoms — call your local emergency number now. Do not wait.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-teal-200 bg-teal-50/60">
            <Stethoscope className="h-5 w-5 text-teal-700" />
            <AlertTitle className="text-teal-900">How triage works</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Nurse V asks focused questions, then suggests one of three care levels:
            </AlertDescription>
            <div className="mt-2 space-y-1.5 text-xs">
              <Badge variant="outline" className="w-full justify-start border-red-200 bg-red-50 text-red-700">🚨 Emergency — get help now</Badge>
              <Badge variant="outline" className="w-full justify-start border-amber-200 bg-amber-50 text-amber-700">🩺 See a doctor — book soon</Badge>
              <Badge variant="outline" className="w-full justify-start border-emerald-200 bg-emerald-50 text-emerald-700">💊 Self-care — monitor at home</Badge>
            </div>
          </Alert>
        )}
        <Card>
          <CardContent className="p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="mb-2 font-semibold text-foreground">Privacy first</p>
            Conversations stay on your device&apos;s session. Nothing is shared with insurance companies or employers. VitalLens is an educational tool and does not replace professional medical advice, diagnosis, or treatment.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user';
  const isEmergency = msg.content.includes('🚨');
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`mt-0.5 shrink-0 rounded-full p-1.5 ${isUser ? 'bg-muted' : 'bg-gradient-to-br from-teal-500 to-emerald-600'}`}>
        {isUser ? <User className="h-3.5 w-3.5 text-muted-foreground" /> : <Stethoscope className="h-3.5 w-3.5 text-white" />}
      </div>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
        isUser
          ? 'rounded-br-sm bg-teal-700 text-white'
          : isEmergency
            ? 'rounded-bl-sm border-2 border-red-200 bg-red-50'
            : 'rounded-bl-sm border bg-white'
      }`}>
        {isUser ? <p className="whitespace-pre-wrap">{msg.content}</p> : <MarkdownLite content={msg.content} emergency={isEmergency} />}
      </div>
    </div>
  );
}

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
function MarkdownLite({ content, emergency }: { content: string; emergency?: boolean }) {
  return (
    <div className={emergency ? 'text-red-800' : 'text-foreground/90'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
          strong: ({ children }) => <strong className={emergency ? 'text-red-900' : 'font-semibold text-foreground'}>{children}</strong>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
