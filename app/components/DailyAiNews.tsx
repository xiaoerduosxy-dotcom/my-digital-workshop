import Link from 'next/link';
import { readLatestCompleteEdition } from '@/lib/daily-ai-news/storage';
import AiNewsStories from './AiNewsStories';

export default async function DailyAiNews() {
  const edition = await readLatestCompleteEdition();

  return (
    <section id="ai-news" aria-labelledby="ai-news-title" className="neo-flat @container rounded-[32px] p-6 lg:p-8">
      <header className="mb-4 flex flex-wrap items-start gap-x-4 gap-y-1.5">
        <div>
          <h2 id="ai-news-title" className="flex items-center gap-2.5 font-serif text-xl font-bold sm:text-2xl">
            <span aria-hidden="true" className="h-4 w-1 rounded-full bg-[var(--accent-yellow)]" />
            每日 AI 最新资讯
          </h2>
          <p className="ml-3.5 mt-1 text-xs text-[#565c70]">
            <time dateTime={edition.date}>{edition.date}</time> 简报
          </p>
        </div>
        <Link
          href="/ai-news"
          className="ml-auto inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded text-sm font-semibold text-[#57476e] transition-colors hover:text-[var(--text-main)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#766194] [@media(pointer:coarse)]:min-h-11"
        >
          往期资讯简报 <span aria-hidden="true">→</span>
        </Link>
      </header>

      <AiNewsStories stories={edition.stories} />
    </section>
  );
}
