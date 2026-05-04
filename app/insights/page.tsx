'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { INSIGHTS, type Insight } from '@/lib/insights';

// ─── 工具函数 ──────────────────────────────────────────────────

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── 动画包装 ──────────────────────────────────────────────────

function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── 洞察卡片（含嵌入式播放器 + 波形动效）────────────────────

function InsightCard({
  item,
  isPlaying,
  onPlay,
  onPause,
}: {
  item: Insight;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onPause: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [metaLoaded, setMetaLoaded] = useState(false);

  // 同步 isPlaying → 实际音频
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // 点击进度条跳转
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      className="neo-flat rounded-[28px] p-6 flex flex-col h-full"
      whileHover={{
        scale: 1.005,
        boxShadow: '18px 18px 36px var(--shadow-dark), -18px -18px 36px var(--shadow-light)',
        transition: { duration: 0.22 },
      }}
    >
      {/* 隐藏音频元素 */}
      <audio
        ref={audioRef}
        src={item.audio_src}
        preload="none"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          setMetaLoaded(true);
        }}
        onEnded={onPause}
      />

      {/* ── 嵌入式播放器 ── */}
      <div className="neo-inset rounded-2xl px-4 pt-3 pb-3 flex flex-col gap-2 mb-5">
        {/* 波形动效区域（播放时展开，暂停时收起） */}
        <div
          className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ height: isPlaying ? '2rem' : '0', opacity: isPlaying ? 1 : 0 }}
        >
          <div className="wave-track">
            {Array.from({ length: 16 }).map((_, idx) => (
              <span
                key={idx}
                className={`wave-bar wave-${idx + 1}`}
                style={{ background: 'var(--accent-yellow)' }}
              />
            ))}
          </div>
        </div>

        {/* 控制行：播放按钮 + 进度条 + 时间 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => (isPlaying ? onPause() : onPlay(item.id))}
            className="player-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm text-[var(--accent-yellow)]"
            style={{
              filter: isPlaying ? 'drop-shadow(0 0 7px rgba(255,203,0,0.55))' : undefined,
            }}
            aria-label={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* 可点击进度条 */}
          <div
            className="flex-1 relative h-1.5 rounded-full bg-[var(--bg-page)] cursor-pointer group"
            onClick={handleSeek}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${progress}%`,
                background: isPlaying
                  ? 'linear-gradient(90deg, var(--accent-yellow), #FFE066)'
                  : 'var(--shadow-dark)',
                boxShadow: isPlaying ? '0 0 5px rgba(255,203,0,0.5)' : undefined,
                transition: 'width 0.15s linear',
              }}
            />
            {/* hover 拖拽圆点 */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                left: `${progress}%`,
                background: 'var(--accent-yellow)',
                boxShadow: '0 0 6px rgba(255,203,0,0.6)',
              }}
            />
          </div>

          {/* 时间戳 */}
          <span className="font-mono text-[9px] text-[var(--text-sub)] shrink-0 tabular-nums select-none">
            {formatTime(currentTime)}
            {metaLoaded && ` / ${formatTime(duration)}`}
          </span>
        </div>
      </div>

      {/* ── 内容区（flex-1 撑满剩余高度，保证卡片等高） ── */}
      <div className="flex flex-col gap-3 flex-1">
        {/* 分类 + 日期 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="neo-inset rounded-full px-2.5 py-1 font-mono text-[9px] text-[var(--accent-yellow)] tracking-widest">
            {item.category}
          </span>
          <span className="font-mono text-[9px] text-[var(--text-sub)]">{item.date}</span>
        </div>

        {/* 标题：最多 2 行 */}
        <h3 className="font-serif text-xl font-bold leading-snug line-clamp-2">{item.title}</h3>

        {/* 标签 */}
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="neo-inset rounded-full px-2 py-0.5 font-mono text-[9px] text-[var(--text-sub)]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 摘要：固定 3 行，超出省略 */}
        <p className="text-sm text-[var(--text-sub)] leading-relaxed line-clamp-3 flex-1">
          {item.summary}
        </p>

        {/* 阅读全文 */}
        <Link
          href={`/insights/${item.id}`}
          className="self-start mt-auto font-mono text-xs text-[var(--text-sub)] hover:text-[var(--accent-yellow)] transition-colors"
        >
          阅读全文 →
        </Link>
      </div>
    </motion.div>
  );
}

// ─── 页面 ──────────────────────────────────────────────────────

export default function InsightsPage() {
  const [playingId, setPlayingId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">

      {/* 顶部导航 */}
      <header
        className="sticky top-0 z-50 border-b border-[var(--shadow-dark)]/40"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(212,215,227,0.85)' }}
      >
        <div className="mx-auto max-w-[1100px] px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="neo-btn rounded-xl px-4 py-2 font-mono text-sm text-[var(--text-sub)] hover:text-[var(--accent-yellow)] transition flex items-center gap-2"
          >
            ← 返回首页
          </Link>
          <span className="font-serif text-lg font-bold">Jerry.</span>
          <span className="font-mono text-[10px] text-[var(--text-sub)] uppercase tracking-widest hidden sm:block">
            Insights
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-6 py-12 space-y-12">

        {/* Hero */}
        <FadeIn>
          <section className="neo-flat rounded-[32px] p-8 lg:p-12 relative overflow-hidden">
            <div className="corner-screw tl" />
            <div className="corner-screw tr" />
            <div className="corner-screw bl" />
            <div className="corner-screw br" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage:
                  'linear-gradient(var(--text-main) 1px, transparent 1px), linear-gradient(90deg, var(--text-main) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />
            <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="max-w-xl">
                <div className="font-mono text-[10px] text-[var(--accent-purple)] tracking-widest uppercase mb-4">
                  // INSIGHTS · AI 伴读博客
                </div>
                <h1 className="font-serif text-5xl lg:text-6xl font-black leading-tight mb-5">
                  思考的{' '}
                  <span
                    className="text-[var(--accent-yellow)]"
                    style={{ textShadow: '0 0 24px rgba(255,203,0,0.25)' }}
                  >
                    地方
                  </span>
                  。
                </h1>
                <p className="text-[15px] leading-relaxed text-[var(--text-sub)]">
                  每篇洞察都附带一段 AI 生成的播客音频。可以听，也可以读，随你。不追热点——只写想清楚了的东西。
                </p>
              </div>
              <div className="neo-inset rounded-2xl px-7 py-5 text-center shrink-0">
                <div
                  className="font-serif text-5xl font-black text-[var(--accent-yellow)] mb-1"
                  style={{ textShadow: '0 0 20px rgba(255,203,0,0.3)' }}
                >
                  {INSIGHTS.length}
                </div>
                <div className="font-mono text-[9px] text-[var(--text-sub)] uppercase tracking-wider">
                  篇洞察
                </div>
              </div>
            </div>
          </section>
        </FadeIn>

        {/* 等高卡片网格 */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            {INSIGHTS.map((item, i) => (
              <FadeIn key={item.id} delay={i * 0.07} className="flex">
                <InsightCard
                  item={item}
                  isPlaying={playingId === item.id}
                  onPlay={setPlayingId}
                  onPause={() => setPlayingId(null)}
                />
              </FadeIn>
            ))}
          </div>
        </section>

        {/* 底部 */}
        <FadeIn>
          <div className="neo-flat rounded-[32px] p-8 text-center space-y-4">
            <div className="font-mono text-[9px] text-[var(--text-sub)] uppercase tracking-widest">
              // 持续更新中
            </div>
            <p className="font-serif text-2xl font-bold">有共鸣？欢迎来聊。</p>
            <p className="font-mono text-xs text-[var(--text-sub)]">
              <a
                href="mailto:sxy13931439991@163.com"
                className="text-[var(--accent-yellow)] hover:underline transition"
              >
                sxy13931439991@163.com
              </a>
              {' '}· 微信 kranke-kinder
            </p>
            <Link
              href="/"
              className="neo-btn inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-mono text-sm text-[var(--text-sub)] hover:text-[var(--accent-yellow)] transition"
            >
              ← 返回数字工坊
            </Link>
          </div>
        </FadeIn>

      </main>
    </div>
  );
}
