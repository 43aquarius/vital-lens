import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { TRIAGE_SYSTEM_PROMPT } from '@/lib/ai';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// POST /api/symptom-checker — 症状分诊对话
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return NextResponse.json({ error: 'Invalid conversation' }, { status: 400 });
    }

    const zai = await ZAI.create();
    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: TRIAGE_SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content.slice(0, 4000) })),
      ],
      thinking: { type: 'disabled' },
    });

    const reply = response.choices[0]?.message?.content || "I'm sorry, I couldn't process that. Could you rephrase?";
    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error('symptom-checker error:', e);
    return NextResponse.json({ error: 'The nurse assistant is unavailable right now. Please try again.' }, { status: 500 });
  }
}
