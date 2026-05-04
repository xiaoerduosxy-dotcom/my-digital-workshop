import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readFileSync } from 'fs';
import { join } from 'path';
import { INSIGHTS } from '@/lib/insights';
import PlayerClient from './PlayerClient';

// ─── Markdown 渲染 ─────────────────────────────────────────────
// 支持：标题 / 列表 / 分割线 / **加粗** / *斜体*

// 处理行内 **bold** 和 *italic*
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-[var(--text-main)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function ArticleBody({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <div className="neo-inset rounded-2xl p-8 text-center">
        <p className="font-mono text-sm text-[var(--text-sub)]">
          // 完整内容即将发布...
        </p>
        <p className="font-mono text-[10px] text-[var(--text-sub)] mt-2 opacity-60">
          先听播客，文字版本正在整理中
        </p>
      </div>
    );
  }

  const paragraphs = content.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="space-y-5">
      {paragraphs.map((para, i) => {
        // 分割线
        if (/^-{3,}$/.test(para)) {
          return (
            <hr
              key={i}
              className="border-none h-px my-2"
              style={{ background: 'var(--shadow-dark)', opacity: 0.4 }}
            />
          );
        }
        if (para.startsWith('### ')) {
          return (
            <h3 key={i} className="font-serif text-xl font-bold mt-6 mb-1">
              {renderInline(para.replace(/^### /, ''))}
            </h3>
          );
        }
        if (para.startsWith('## ')) {
          return (
            <h2 key={i} className="font-serif text-2xl font-bold mt-8 mb-2">
              {renderInline(para.replace(/^## /, ''))}
            </h2>
          );
        }
        if (para.startsWith('# ')) {
          return (
            <h1 key={i} className="font-serif text-3xl font-black mt-10 mb-3">
              {renderInline(para.replace(/^# /, ''))}
            </h1>
          );
        }
        // 列表行（以 - 开头的段落）
        if (para.startsWith('- ')) {
          const items = para.split('\n').filter((l) => l.startsWith('- '));
          return (
            <ul key={i} className="list-none space-y-1.5 pl-1">
              {items.map((item, j) => (
                <li key={j} className="flex gap-2 text-[15px] leading-relaxed text-[var(--text-sub)]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-yellow)]" />
                  {renderInline(item.replace(/^- /, ''))}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-[15px] leading-relaxed text-[var(--text-sub)]">
            {renderInline(para)}
          </p>
        );
      })}
    </div>
  );
}

// ─── 页面（Server Component） ──────────────────────────────────

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const insight = INSIGHTS.find((item) => item.id === id);
  if (!insight) notFound();

  // 从 content/insights/<id>.md 读取正文（文件不存在时显示占位）
  let fullContent = '';
  try {
    const filePath = join(process.cwd(), 'content', 'insights', `${id}.md`);
    fullContent = readFileSync(filePath, 'utf-8');
  } catch {
    // .md 文件尚未创建，显示占位
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">

      {/* 顶部导航 */}
      <header
        className="sticky top-0 z-50 border-b border-[var(--shadow-dark)]/40"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(212,215,227,0.85)' }}
      >
        <div className="mx-auto max-w-[780px] px-6 py-4 flex items-center justify-between">
          <Link
            href="/insights"
            className="neo-btn rounded-xl px-4 py-2 font-mono text-sm text-[var(--text-sub)] hover:text-[var(--accent-yellow)] transition flex items-center gap-2"
          >
            ← 返回洞察列表
          </Link>
          <span className="font-serif text-lg font-bold">Jerry.</span>
        </div>
      </header>

      <main className="mx-auto max-w-[780px] px-6 py-12">

        {/* 文章头部信息 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="neo-inset rounded-full px-3 py-1 font-mono text-[9px] text-[var(--accent-purple)] tracking-widest">
              {insight.category}
            </span>
            <span className="font-mono text-[9px] text-[var(--text-sub)]">{insight.date}</span>
          </div>

          <h1 className="font-serif text-4xl lg:text-5xl font-black leading-tight mb-4">
            {insight.title}
          </h1>

          <div className="flex flex-wrap gap-2">
            {insight.tags.map((tag) => (
              <span
                key={tag}
                className="neo-inset rounded-full px-2.5 py-1 font-mono text-[9px] text-[var(--text-sub)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 播放器（Client Component） */}
        <div className="mb-8">
          <div className="font-mono text-[9px] text-[var(--text-sub)] uppercase tracking-widest mb-3">
            // AI 播客版本 · 边听边读
          </div>
          <PlayerClient audioSrc={insight.audio_src} />
        </div>

        {/* 摘要 */}
        <div className="neo-flat rounded-2xl p-6 mb-8">
          <p className="font-mono text-[10px] text-[var(--accent-purple)] uppercase tracking-widest mb-3">
            核心摘要
          </p>
          <p className="text-[15px] leading-relaxed text-[var(--text-sub)] italic">
            {insight.summary}
          </p>
        </div>

        {/* 正文 */}
        <div className="neo-flat rounded-[28px] p-8 lg:p-10">
          <p className="font-mono text-[9px] text-[var(--text-sub)] uppercase tracking-widest mb-6">
            // 完整内容
          </p>
          <ArticleBody content={fullContent} />
        </div>

        {/* 底部导航 */}
        <div className="mt-12 flex items-center justify-between">
          <Link
            href="/insights"
            className="neo-btn rounded-2xl px-5 py-3 font-mono text-sm text-[var(--text-sub)] hover:text-[var(--accent-yellow)] transition"
          >
            ← 返回列表
          </Link>
          <Link
            href="/"
            className="neo-btn rounded-2xl px-5 py-3 font-mono text-sm text-[var(--text-sub)] hover:text-[var(--accent-yellow)] transition"
          >
            首页 →
          </Link>
        </div>

      </main>
    </div>
  );
}
