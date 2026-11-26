import type { FormEventHandler } from 'react';
import { QUESTION_LIMIT } from '@/lib/ask-jerry';

type Props = {
  id: string;
  label: string;
  action: string;
  placeholder: string;
  question: string;
  onChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  busy: boolean;
  variant?: 'default' | 'prompt';
};

export default function AskJerryComposer({ id, label, action, placeholder, question, onChange, onSubmit, busy, variant = 'default' }: Props) {
  const disabled = !question.trim() || busy;

  if (variant === 'prompt') {
    return (
      <form onSubmit={onSubmit} aria-busy={busy} className="flex min-w-0 flex-col rounded-[22px] border border-white/90 bg-[linear-gradient(151deg,#f8f8fdfa,#eeedf7f5)] px-2.5 pb-1.5 pt-3 shadow-[5px_7px_16px_#c9cada,inset_1px_1px_0_#ffffffb3] focus-within:ring-2 focus-within:ring-[#a193c3]/60 sm:px-3.5">
        <label htmlFor={id} className="sr-only">{label}</label>
        <textarea
          id={id}
          rows={2}
          className="block h-[2.9rem] w-full min-w-0 resize-none overscroll-contain bg-transparent px-1 text-base leading-relaxed text-[#42485e] outline-none placeholder:text-sm placeholder:text-[#656a7d] [scrollbar-color:#c9c1d7_transparent] sm:text-sm"
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="send"
          maxLength={QUESTION_LIMIT}
          value={question}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
            event.preventDefault();
            if (!disabled) event.currentTarget.form?.requestSubmit();
          }}
        />
        <button
          type="submit"
          disabled={disabled}
          aria-label={action}
          title={action}
          className="group grid size-11 shrink-0 place-items-center self-end rounded-full focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#766194]"
        >
          <span className="grid size-8 place-items-center rounded-full bg-[#655a79] text-white transition group-enabled:group-hover:bg-[#514661] group-disabled:bg-[#dfdde8] group-disabled:text-[#706d80]">
            <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 12.5v-9M4.5 7 8 3.5 11.5 7" />
            </svg>
          </span>
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex min-h-12 items-center gap-1 rounded-2xl border border-white/85 bg-[radial-gradient(ellipse_at_top_left,#fafbff,transparent_70%),linear-gradient(140deg,#f1f3f9,#e2e5ee)] pr-0.5 shadow-[5px_6px_13px_#ccd1df,-4px_-4px_11px_#ffffff9c,inset_1px_1px_0_#ffffffb3] focus-within:ring-2 focus-within:ring-[#a193c3]/75">
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        className="min-h-11 min-w-0 flex-1 rounded-l-2xl bg-transparent pl-3.5 text-base text-[#4a5065] outline-none placeholder:text-[#666b7f] sm:pl-4 sm:text-sm"
        type="text"
        placeholder={placeholder}
        autoComplete="off"
        maxLength={QUESTION_LIMIT}
        value={question}
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="submit" disabled={disabled} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[13px] px-2.5 text-xs font-medium text-[#554472] transition enabled:hover:bg-[#ded4ec] enabled:hover:text-[#403057] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#766194] disabled:text-[#6d6e81] sm:px-3">
        {action}
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="size-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8h9m-3.5-3.5L12 8l-3.5 3.5" />
        </svg>
      </button>
    </form>
  );
}
