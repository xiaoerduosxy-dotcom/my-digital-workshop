import type { Story } from '@/lib/daily-ai-news/editor';

export default function AiNewsStories({ stories }: { stories: Story[] }) {
  return (
    <ul className="grid grid-cols-1 gap-3 @min-[42rem]:grid-cols-3">
      {stories.map(({ category, source, date, title, summary, url }) => (
        <li key={url} className="flex min-w-0 flex-col rounded-2xl border border-white/75 bg-white/30 p-4">
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs">
            <span className="font-semibold text-[#57476e]">{category}</span>
            <time dateTime={date} className="font-mono text-[#565c70]">{date}</time>
          </p>
          <h3 className="mt-2 text-[15px] font-bold leading-snug">{title}</h3>
          <p className="mb-2 mt-1.5 flex-1 text-sm leading-relaxed text-[#565c70]">{summary}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`阅读 ${source} 原文：${title}（在新标签页打开）`}
            className="inline-flex min-h-8 w-fit items-center gap-1.5 rounded text-xs font-semibold text-[#57476e] transition-colors hover:text-[var(--text-main)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#766194] [@media(pointer:coarse)]:min-h-11"
          >
            {source} 原文 <span aria-hidden="true">↗</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
