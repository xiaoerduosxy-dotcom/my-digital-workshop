'use client';

import Link from 'next/link';
import { type FormEvent, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { finishQuestion, getConversation, getServerConversation, parseConversation, queueQuestion, retryQuestion, subscribeConversation, SUGGESTED_QUESTIONS, type AskDecision } from '@/lib/ask-jerry';
import AskJerryComposer from './AskJerryComposer';
import AskJerryDots from './AskJerryDots';

const GUTTER = 'px-4 sm:px-6 lg:px-8 [scrollbar-color:#c9ccda_transparent] [scrollbar-gutter:stable]';

export default function AskJerryChat() {
  const snapshot = useSyncExternalStore(subscribeConversation, getConversation, getServerConversation);
  const turns = useMemo(() => parseConversation(snapshot), [snapshot]);
  const pending = turns.find((turn) => turn.status === 'pending');
  const previous = pending ? turns[turns.indexOf(pending) - 1] : undefined;
  const previousTopic = previous?.status === 'ready' ? previous.topic : undefined;
  const [question, setQuestion] = useState('');
  const transcript = useRef<HTMLDivElement>(null);
  const scrollOnUpdate = useRef(true);

  useEffect(() => {
    if (!pending) return;
    if (pending.simulateFailure) {
      const timer = window.setTimeout(() => finishQuestion(pending.id, pending.attempt, pending.attempt > 0 ? {
        intent: 'capabilities', reply: { text: '重试成功。一切正常，你可以继续体验提问。' },
      } : undefined), 650);
      return () => window.clearTimeout(timer);
    }

    const controller = new AbortController();
    async function answer(turn: NonNullable<typeof pending>) {
      try {
        const response = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: turn.question, topic: previousTopic }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Ask Jerry request failed');
        const { reply, intent, topic }: AskDecision = await response.json();
        if (!controller.signal.aborted) finishQuestion(turn.id, turn.attempt, { reply, intent, topic });
      } catch {
        if (!controller.signal.aborted) finishQuestion(turn.id, turn.attempt);
      }
    }
    const timer = window.setTimeout(() => void answer(pending), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [pending, previousTopic]);

  useEffect(() => {
    const area = transcript.current;
    if (area && scrollOnUpdate.current) area.scrollTop = area.scrollHeight;
  }, [snapshot]);

  function send(value: string, simulateFailure = false) {
    if (pending) return;
    scrollOnUpdate.current = true;
    if (queueQuestion(value, simulateFailure)) setQuestion('');
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(question);
  }

  return (
    <>
      <header className={`flex shrink-0 items-center justify-between gap-3 overflow-y-hidden pb-2 pt-4 lg:pb-3 lg:pt-6 ${GUTTER}`}>
        <div>
          <h1 className="font-serif text-xl font-bold leading-tight text-[#4b5064] lg:text-2xl">问问 Jerry</h1>
            <p className="mt-1 text-xs leading-relaxed text-[#64697c]">网站助手 · AI 预览</p>
        </div>
        <Link href="/" className="hidden min-h-11 shrink-0 items-center gap-1.5 text-xs font-medium text-[#5e4f74] underline-offset-4 hover:underline lg:inline-flex"><span aria-hidden="true">←</span>返回首页</Link>
      </header>

      <div
        ref={transcript}
        onScroll={(event) => {
          const area = event.currentTarget;
          scrollOnUpdate.current = area.scrollHeight - area.scrollTop - area.clientHeight < 64;
        }}
        role="log"
        aria-label="对话记录"
        tabIndex={0}
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain py-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#9b8bb8] lg:py-5 ${GUTTER}`}
      >
        <div className="flex flex-col gap-5">
          {turns.length === 0 && (
            <div className="max-w-md">
              <p className="text-sm leading-relaxed text-[#555a70]">想了解 Jerry 的项目、经历，还是这个网站是怎么做的？</p>
              <div className="mt-1.5 flex flex-wrap gap-x-4">
                {SUGGESTED_QUESTIONS.map(({ label, question }) => (
                  <button key={label} type="button" onClick={() => send(question)} className="min-h-10 text-xs font-medium text-[#5e4f74] underline decoration-[#a89abf] underline-offset-4 hover:decoration-current">{label}</button>
                ))}
              </div>
            </div>
          )}
          {turns.map((turn) => (
            <div key={turn.id} className="flex flex-col gap-3">
              <div data-message="question" className="max-w-[88%] self-end sm:max-w-[min(76%,29rem)]">
                <p className="sr-only">你的提问</p>
                <p className="rounded-2xl rounded-br-md bg-[#e5ddec] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-[#4e465c] [overflow-wrap:anywhere]">{turn.question}</p>
              </div>
              <div data-message="reply" data-intent={turn.status === 'ready' ? turn.intent : undefined} className="max-w-[92%] self-start rounded-2xl rounded-tl-md bg-white/53 px-3.5 py-2.5 text-[#51566b] sm:max-w-[min(78%,34rem)]">
                <p className="mb-1 text-[11px] font-medium text-[#625773]">Jerry 的网站助手</p>
                {turn.status === 'ready' ? (
                  <>
                    <p className="text-sm leading-relaxed">{turn.reply.text}</p>
                    {turn.reply.link && <Link href={turn.reply.link.href} className="mt-1.5 inline-flex min-h-7 items-center gap-1 text-xs font-medium text-[#5e4f74] underline decoration-[#a89abf] underline-offset-4 hover:decoration-current">{turn.reply.link.label} <span aria-hidden="true">→</span></Link>}
                  </>
                ) : turn.status === 'failed' ? (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <p className="text-[#802f49]">{turn.simulateFailure ? '这次没收到回复（模拟）。' : '这次没收到回复，可以重试。'}</p>
                    <button type="button" disabled={Boolean(pending)} onClick={() => { scrollOnUpdate.current = true; retryQuestion(turn.id); }} className="py-1 font-medium text-[#5e4f74] underline underline-offset-4 disabled:opacity-50">重试</button>
                  </div>
                ) : (
                  <p className="flex items-center gap-2.5 text-sm text-[#5f6275]"><AskJerryDots compact active />正在准备回复</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className={`shrink-0 overflow-y-hidden pb-3 pt-2.5 lg:pb-5 lg:pt-4 ${GUTTER}`}>
        <AskJerryComposer
          id="chat-jerry-question"
          label="输入你的问题"
          action="发送"
          placeholder={turns.length ? '继续问一个问题…' : '输入你的问题…'}
          question={question}
          onChange={setQuestion}
          onSubmit={submit}
          busy={Boolean(pending)}
        />
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 text-[11px] text-[#5f6275]">
          <span>问题会经 DeepSeek 分类，请避免填写个人信息。</span>
          {process.env.NODE_ENV === 'development' && (
            <button type="button" disabled={Boolean(pending)} onClick={() => send('测试发送失败后重试', true)} className="rounded px-1 py-1 font-medium text-[#57446e] underline underline-offset-2 hover:text-[#35224d] disabled:opacity-50">测试失败重试</button>
          )}
        </div>
      </footer>
    </>
  );
}
