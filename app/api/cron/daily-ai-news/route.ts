import { timingSafeEqual } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { newsDate } from '@/lib/daily-ai-news/config';
import { writeEdition } from '@/lib/daily-ai-news/editor';
import { collectArticles } from '@/lib/daily-ai-news/sources';
import { completeEditionForDate, newsStorageConfigured, readNewsState, saveNewsState } from '@/lib/daily-ai-news/storage';

export const maxDuration = 60;

let inProgress: Promise<{ status: string; count?: number }> | undefined;

async function refreshNews(key: string) {
  const now = Date.now();
  const today = newsDate(now);
  const { state, etag } = await readNewsState();
  if (state?.checkedOn === today && completeEditionForDate(state.edition, today)) return { status: 'already-checked' };

  const recent = state?.recent ?? [];
  const { articles, incomplete } = await collectArticles(now, new Set(recent.map(item => item.url)));
  const stories = await writeEdition(articles, recent.map(item => item.title), key);
  if (!stories.length && incomplete) throw new Error('Too few eligible stories and some sources were unavailable');
  const previousEdition = state?.edition ?? null;
  const edition = stories.length ? { date: today, stories } : previousEdition;
  const archive = state?.archive ?? [];

  try {
    await saveNewsState({
      checkedOn: today,
      edition,
      archive: previousEdition && edition?.date !== previousEdition.date ? [previousEdition, ...archive] : archive,
      recent: [...stories.map(({ url, title }) => ({ url, title })), ...recent].slice(0, 21),
    }, etag);
  } catch (error) {
    // A concurrent invocation may have saved the edition first.
    const latest = await readNewsState().catch(() => null);
    if (!latest?.state || latest.state.checkedOn < today || (stories.length && !completeEditionForDate(latest.state.edition, today))) {
      throw error;
    }
    return { status: 'already-checked' };
  }
  revalidatePath('/');
  if (stories.length) revalidatePath('/ai-news');
  return { status: stories.length ? 'published' : 'insufficient-qualifying-stories', count: stories.length };
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret ?? ''}`);
  if (!secret || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key || !newsStorageConfigured()) return Response.json({ error: 'News backend is not configured' }, { status: 503 });

  try {
    inProgress ??= refreshNews(key).finally(() => { inProgress = undefined; });
    return Response.json(await inProgress, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[daily-ai-news] Refresh failed:', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ error: 'News refresh failed' }, { status: 502 });
  }
}
