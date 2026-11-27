import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { get, put } from '@vercel/blob';
import launchEditions from '../../content/ai-news/launch-editions.json';
import { editorialRules } from './config';
import type { Story } from './editor';

type NewsEdition = { date: string; stories: Story[] };

export type NewsState = {
  checkedOn: string;
  edition: NewsEdition | null;
  archive?: NewsEdition[];
  recent: { url: string; title: string }[];
};

const BLOB_PATH = 'daily-ai-news/latest.json';
const LOCAL_DIR = join(process.cwd(), '.daily-ai-news');
const LOCAL_PATH = join(LOCAL_DIR, 'latest.json');

const initialState: NewsState = {
  ...launchEditions,
  checkedOn: '',
  recent: [launchEditions.edition, ...launchEditions.archive].flatMap(({ stories }) =>
    stories.map(({ url, title }) => ({ url, title })),
  ),
};

function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim();
}

export function newsStorageConfigured() {
  return Boolean(blobToken()) || process.env.VERCEL !== '1';
}

export function completeEditionForDate(edition: NewsEdition | null | undefined, date: string) {
  if (edition?.date === date && edition.stories.length === editorialRules.storiesPerEdition) return edition;
}

function byPublicationDate(state: NewsState): NewsState {
  const editions = [state.edition, ...(state.archive ?? [])].filter(edition => edition !== null);
  if (editions.every(edition => edition.stories.every(story => story.date === edition.date))) return state;

  // Older editions could contain stories from the previous day.
  const dates = new Map<string, Map<string, Story>>();
  for (const { stories } of editions) {
    for (const story of stories) {
      const storiesForDate = dates.get(story.date) ?? new Map<string, Story>();
      if (!storiesForDate.has(story.url)) storiesForDate.set(story.url, story);
      dates.set(story.date, storiesForDate);
    }
  }
  const [edition, ...archive] = [...dates.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, stories]) => ({ date, stories: [...stories.values()] }));
  return { ...state, edition: edition ?? null, archive };
}

export async function readNewsState(): Promise<{ state: NewsState | null; etag?: string }> {
  const token = blobToken();
  if (token) {
    const blob = await get(BLOB_PATH, { access: 'private', token, useCache: false, abortSignal: AbortSignal.timeout(7_000) });
    if (!blob) return { state: initialState };
    if (blob.statusCode !== 200) throw new Error('Unable to read latest edition');
    const state = await new Response(blob.stream).json() as NewsState;
    return { state: byPublicationDate(state), etag: blob.blob.etag };
  }
  if (!newsStorageConfigured()) return { state: initialState };

  try {
    return { state: byPublicationDate(JSON.parse(await readFile(LOCAL_PATH, 'utf8')) as NewsState) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { state: null };
    throw error;
  }
}

export async function saveNewsState(state: NewsState, etag?: string) {
  const content = JSON.stringify(state);
  const token = blobToken();
  if (token) {
    await put(BLOB_PATH, content, {
      access: 'private',
      token,
      contentType: 'application/json',
      allowOverwrite: Boolean(etag),
      ifMatch: etag,
      abortSignal: AbortSignal.timeout(7_000),
    });
    return;
  }
  if (!newsStorageConfigured()) throw new Error('News storage is not configured');

  await mkdir(LOCAL_DIR, { recursive: true });
  const temp = join(LOCAL_DIR, `${randomUUID()}.tmp`);
  try {
    await writeFile(temp, content);
    await rename(temp, LOCAL_PATH);
  } finally {
    await rm(temp, { force: true });
  }
}
