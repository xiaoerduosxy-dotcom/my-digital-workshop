import { load } from 'cheerio';
import { newsDate, newsSources } from './config';

type Source = (typeof newsSources)[number];
type FeedItem = { source: Source; url: string; title: string; publishedAt: number };
export type NewsArticle = Omit<FeedItem, 'source'> & { source: string; body: string };

const FETCH_TIMEOUT = 8_000;
const MAX_PAGE_BYTES = 5_000_000;
const MAX_ITEMS_PER_SOURCE = 4;
const MAX_BODY_LENGTH = 7_000;

function cleanText(value: string) {
  return value.replace(/\s+/gu, ' ').trim();
}

function sourceUrl(value: string, source: Source, base = source.feed) {
  if (!value) return;
  try {
    const url = new URL(value, base);
    if (url.protocol !== 'https:' || url.port || url.username || url.password || !source.hosts.includes(url.hostname)) return;
    url.hash = '';
    for (const name of [...url.searchParams.keys()]) {
      if (/^utm_|^(rss|ref|source)$/iu.test(name)) url.searchParams.delete(name);
    }
    return url;
  } catch {
    return;
  }
}

async function getSourceText(url: string, source: Source) {
  let target = sourceUrl(url, source);
  const signal = AbortSignal.timeout(FETCH_TIMEOUT);
  for (let redirects = 0; target && redirects <= 3; redirects++) {
    const response = await fetch(target, { cache: 'no-store', redirect: 'manual', signal });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel();
      target = sourceUrl(response.headers.get('location') ?? '', source, target.href);
      continue;
    }
    if (!response.ok || !response.body) {
      await response.body?.cancel();
      throw new Error(`Source returned HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let bytes = 0;
    let content = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) return { content: content + decoder.decode(), url: target.href };
      bytes += value.length;
      if (bytes > MAX_PAGE_BYTES) {
        await reader.cancel();
        throw new Error('Source response too large');
      }
      content += decoder.decode(value, { stream: true });
    }
  }
  throw new Error('Unsupported source URL or redirect');
}

async function readFeed(source: Source, now: number, today: string, excludedUrls: Set<string>) {
  const { content, url: feedUrl } = await getSourceText(source.feed, source);
  const $ = load(content, { xml: true });
  if (!$('rss, feed').length) throw new Error('Unrecognized feed');

  const items: FeedItem[] = [];
  const seen = new Set(excludedUrls);
  for (const entry of $('item, entry').toArray()) {
    const item = $(entry);
    const link = item.children('link[rel="alternate"], link:not([rel])').first();
    const url = sourceUrl(link.attr('href') ?? link.text().trim(), source, feedUrl)?.href;
    const title = cleanText(load(item.children('title').first().text(), {}, false).text());
    const publishedAt = Date.parse(item.children('pubDate, published, dc\\:date').first().text());
    if (!url || !title || seen.has(url) || !Number.isFinite(publishedAt) || publishedAt > now || newsDate(publishedAt) !== today) continue;
    seen.add(url);
    items.push({ source, url, title, publishedAt });
  }
  return items.sort((a, b) => b.publishedAt - a.publishedAt).slice(0, MAX_ITEMS_PER_SOURCE);
}

async function readArticle(item: FeedItem): Promise<NewsArticle> {
  const { content, url } = await getSourceText(item.url, item.source);
  const $ = load(content);
  $('script, style, noscript, nav, footer, aside, form, [aria-hidden="true"]').remove();
  const main = $('article').first().length ? $('article').first() : $('main, [role="main"]').first();
  if (!main.length) throw new Error('Article content missing');

  const blocks = main.find('h1, h2, h3, p, li').map((_, element) => cleanText($(element).text())).get();
  const body = [...new Set(blocks.filter(Boolean))].join('\n').slice(0, MAX_BODY_LENGTH);
  if (body.length < 200) throw new Error('Article text too short');
  return { ...item, url, source: item.source.name, body };
}

export async function collectArticles(now: number, excludedUrls: Set<string>) {
  const today = newsDate(now);
  const feeds = await Promise.allSettled(newsSources.map(source => readFeed(source, now, today, excludedUrls)));
  const candidates = feeds.flatMap((result, index) => {
    if (result.status === 'fulfilled') return result.value;
    console.warn('[daily-ai-news] Feed unavailable:', newsSources[index].name, String(result.reason));
    return [];
  });
  if (feeds.every(result => result.status === 'rejected')) throw new Error('No news feeds available');

  const unique = [...new Map(candidates.map(item => [item.url, item])).values()];
  const results = await Promise.allSettled(unique.map(readArticle));
  const articles = results.flatMap((result, index) => {
    if (result.status === 'fulfilled') return result.value;
    console.warn('[daily-ai-news] Article unavailable:', unique[index].url, String(result.reason));
    return [];
  });
  if (unique.length && !articles.length) throw new Error('No candidate article bodies available');
  return {
    articles: [...new Map(articles.filter(item => !excludedUrls.has(item.url)).map(item => [item.url, item])).values()],
    incomplete: [...feeds, ...results].some(result => result.status === 'rejected'),
  };
}
