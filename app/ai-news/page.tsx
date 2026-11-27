import type { Metadata } from 'next';
import Link from 'next/link';
import AiNewsStories from '@/app/components/AiNewsStories';
import { readNewsState } from '@/lib/daily-ai-news/storage';

export const metadata: Metadata = {
  title: '往期资讯简报 · 数字造物工坊',
};

export const revalidate = 900;

export default async function AiNewsArchive() {
  const saved = await readNewsState().catch(error => {
    console.warn('[daily-ai-news] Could not load archive:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  });
  const state = saved?.state;
  const editions = [state?.edition, ...(state?.archive ?? [])].filter(edition => edition != null);

  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-col gap-4 px-4 py-6 sm:px-6 sm:py-10">
      <header className="neo-flat rounded-[32px] px-6 py-5 sm:px-8 sm:py-6">
        <Link
          href="/#ai-news"
          className="mb-2 inline-flex min-h-8 items-center gap-1.5 rounded text-sm font-semibold text-[#57476e] transition-colors hover:text-[var(--text-main)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#766194] [@media(pointer:coarse)]:min-h-11"
        >
          <span aria-hidden="true">←</span> 返回首页资讯
        </Link>
        <h1 className="flex items-center gap-2.5 font-serif text-2xl font-bold sm:text-3xl">
          <span aria-hidden="true" className="h-5 w-1 rounded-full bg-[var(--accent-yellow)]" />
          往期资讯简报
        </h1>
      </header>

      {editions.length === 0 && (
        <p className="neo-flat rounded-[32px] px-6 py-5 text-sm text-[#565c70] sm:px-8">
          {saved ? '暂无已发布的资讯简报。' : '简报暂时无法加载，请稍后再试。'}
        </p>
      )}

      {editions.map(({ date, stories }) => (
        <section
          key={date}
          aria-labelledby={`edition-${date}`}
          className="neo-flat @container rounded-[32px] p-6 sm:p-8"
        >
          <h2 id={`edition-${date}`} className="mb-4 flex flex-wrap items-baseline gap-2 font-serif text-lg font-bold">
            <time dateTime={date} className="font-mono">{date}</time>
            简报
          </h2>
          <AiNewsStories stories={stories} />
        </section>
      ))}
    </main>
  );
}
