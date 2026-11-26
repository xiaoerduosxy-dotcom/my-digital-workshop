'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState, useTransition } from 'react';
import { ASK_PATH, queueQuestion, SUGGESTED_QUESTIONS } from '@/lib/ask-jerry';
import AskJerryComposer from './AskJerryComposer';

const HOME_QUESTIONS = SUGGESTED_QUESTIONS.map((suggestion, index) => ({
  ...suggestion,
  label: ['代表项目', '产品经理', '见证复盘'][index] ?? suggestion.label,
}));

export default function AskJerryEntry() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [opening, startOpening] = useTransition();

  function ask(value: string) {
    if (opening || !queueQuestion(value)) return;
    setQuestion('');
    startOpening(() => router.push(ASK_PATH));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(question);
  }

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <p className="text-sm leading-relaxed text-[#565c70] sm:text-[15px]">
        嗨，我是 jerry。对我的项目或经历好奇？在这里问我。
      </p>
      <AskJerryComposer
        variant="prompt"
        id="home-jerry-question"
        label="给 Jerry 的助手提问"
        action="提问"
        placeholder="比如：你做过哪些 AI 项目？"
        question={question}
        onChange={setQuestion}
        onSubmit={submit}
        busy={opening}
      />
      <div role="group" aria-label="可直接提问的示例" className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <p className="my-0.5 text-xs leading-relaxed text-[#5b6074] sm:text-sm">不知道问什么？试试</p>
        {HOME_QUESTIONS.map(({ label, question: example }) => (
          <button
            key={label}
            type="button"
            onClick={() => ask(example)}
            disabled={opening}
            aria-label={`${label}：${example}`}
            className="inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/75 bg-white/30 px-2.5 py-1 text-xs font-medium text-[#57476e] transition enabled:hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#766194] disabled:opacity-60 sm:px-3 sm:text-sm [@media(pointer:coarse)]:min-h-11"
          >
            {label} <span aria-hidden="true" className="text-xs font-normal text-[#7b658e]">↗</span>
          </button>
        ))}
      </div>
    </div>
  );
}
