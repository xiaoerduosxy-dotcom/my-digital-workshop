'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';

// ─── Static Data ──────────────────────────────────────────────

const TOC_ITEMS = [
  { id: 'why', label: '为什么建站' },
  { id: 'tech', label: '技术选型' },
  { id: 'process', label: '实战过程' },
  { id: 'tips', label: '给你的建议' },
];

const TECH_STACK = [
  { icon: '⚡', name: 'Next.js 16', desc: '框架' },
  { icon: '⚛️', name: 'React 19', desc: '前端库' },
  { icon: '🎨', name: 'Tailwind v4', desc: '样式' },
  { icon: '🌀', name: 'Framer Motion', desc: '动效' },
  { icon: '🚀', name: 'Vercel', desc: '部署' },
  { icon: '🤖', name: 'Cursor', desc: 'IDE' },
  { icon: '🧠', name: 'Claude', desc: 'AI 搭档' },
];

const TIMELINE = [
  { day: 'Day 0', event: '产生想法，和 Gemini 反复讨论方案架构与内容规划' },
  { day: 'Day 1–2', event: '技术选型确定，搭建 Next.js 基础框架与路由结构' },
  { day: 'Day 3–4', event: '视觉风格确定，Neomorphism 设计系统从零建立' },
  { day: 'Day 5–6', event: '行业洞察 + 实战实验室模块开发，音频播放器接入' },
  { day: 'Day 7', event: '联调上线，第一版 MVP 完成' },
];

const PAIN_POINTS = [
  {
    tag: '⚠️ 卡点一',
    title: '页面太普通了',
    body: [
      '最开始让 Claude 直接生成页面，结果就是标准"个人官网框架"：导航栏、关于我、作品集、联系方式。整洁，但毫无个性。',
      '我开始研究视觉风格，找到了 Neomorphism（新拟态设计）——用柔和的阴影和高光模拟真实物体质感。把风格描述清楚，让 Claude 重新设计整套 UI 系统，加上 Framer Motion 动效，整个气质完全变了。',
    ],
    lesson: 'AI 写不出"个性"，但它能把你的个性完整地实现出来。你需要先知道自己想要什么。',
  },
  {
    tag: '⚠️ 卡点二',
    title: '行业洞察模块究竟是什么',
    body: [
      '最开始想放博客文章，但只有文字体验感不够；单独做播客模块又太碎。',
      '最后找到了自己觉得很对的方案：每一篇博客文章，都配一段 AI 生成的播客音频。用户可以选择读，也可以选择听。音频通过小宇宙 RSS 直链 + 原生 audio 标签播放，不需要任何复杂实现。',
    ],
    lesson: 'Vibe Coding 里，最有价值的不是 AI 写的代码，而是你跟 AI 对话过程中想清楚的那些问题。',
  },
  {
    tag: '⚠️ 卡点三',
    title: '实战实验室的内容方向',
    body: [
      '做完网站后，这个模块放什么、怎么持续更新，想了很久。',
      '是只记录这个网站本身的建站经历，还是成为一个更大的 Vibe Coding 实验场？目前的答案：两者都要，但分阶段来。先把建站复盘做扎实，然后让这个模块随着探索新项目而自然生长。',
    ],
    lesson: '不要一开始就把模块定义得太完整，给自己留生长空间。',
  },
];

// ─── Animation Helper ────────────────────────────────────────

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
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Callout ─────────────────────────────────────────────────

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="neo-inset rounded-2xl p-5"
      style={{
        borderLeft: '3px solid var(--accent-purple)',
        background: 'linear-gradient(135deg, rgba(161,147,195,0.08) 0%, transparent 60%)',
      }}
    >
      <div className="font-mono text-[9px] text-[var(--accent-purple)] uppercase tracking-widest mb-2">
        // 关键结论
      </div>
      <p className="text-sm leading-relaxed text-[var(--text-sub)]">{children}</p>
    </div>
  );
}

// ─── Code Block ──────────────────────────────────────────────

function CodeBlock({ label, children }: { label: string; children: string }) {
  return (
    <div className="rounded-2xl overflow-hidden">
      <div className="bg-[#1e293b] px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[10px] text-[#94a3b8] ml-2">{label}</span>
      </div>
      <div className="bg-[#0f172a] px-5 py-5">
        <pre className="font-mono text-[12px] text-[#94a3b8] leading-relaxed whitespace-pre-wrap break-words">
          {children}
        </pre>
      </div>
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <span className="neo-inset rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-[var(--accent-yellow)] tracking-widest">
        {num}
      </span>
      <h2 className="font-serif text-3xl font-bold">{title}</h2>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function LabPage() {
  const [activeSection, setActiveSection] = useState('why');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    TOC_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: '-20% 0px -70% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">

      {/* ── Header ── */}
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
            Lab
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-6 py-12 space-y-12">

        {/* ── Hero ── */}
        <FadeIn>
          <section className="neo-flat rounded-[32px] p-8 lg:p-14 relative overflow-hidden">
            <div className="corner-screw tl" />
            <div className="corner-screw tr" />
            <div className="corner-screw bl" />
            <div className="corner-screw br" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  'linear-gradient(var(--text-main) 1px, transparent 1px), linear-gradient(90deg, var(--text-main) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <span className="neo-inset rounded-full px-3 py-1 font-mono text-xs font-semibold tracking-wide text-[var(--accent-yellow)]">
                  LAB.ACTIVE
                </span>
                <span className="font-mono text-[10px] text-[var(--accent-purple)] uppercase tracking-widest">
                  // 实战实验室 · 建站复盘
                </span>
              </div>
              <h1 className="font-serif text-5xl lg:text-6xl font-black leading-tight mb-4">
                用 Vibe Coding
                <br />
                <span
                  className="text-[var(--accent-yellow)]"
                  style={{ textShadow: '0 0 24px rgba(255,203,0,0.25)' }}
                >
                  一周建站
                </span>
                全复盘
              </h1>
              <p className="text-[15px] lg:text-lg leading-relaxed text-[var(--text-sub)] mb-10 max-w-2xl">
                一个产品经理，如何用 Cursor + Claude 从零做出个人网站，全程没有手写一行代码。
              </p>

              {/* 3 data cards */}
              <div className="grid gap-4 w-full" style={{ gridTemplateColumns: '1fr 1fr 2fr' }}>
                {[
                  { value: '1 周', label: '建站周期' },
                  { value: '0 行', label: '手写代码量' },
                  { value: 'Cursor + Claude', label: '核心工具' },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    className="neo-inset rounded-2xl p-5 text-center flex flex-col items-center justify-center"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  >
                    <div
                      className="font-serif text-3xl lg:text-4xl font-black text-[var(--accent-yellow)] mb-1.5 leading-none"
                      style={{ textShadow: '0 0 16px rgba(255,203,0,0.35)' }}
                    >
                      {item.value}
                    </div>
                    <div className="font-mono text-[10px] text-[var(--text-sub)] uppercase tracking-wider">
                      {item.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </FadeIn>

        {/* ── Sticky TOC ── */}
        <div className="sticky top-[73px] z-40">
          <FadeIn delay={0.05}>
            <nav className="neo-flat rounded-2xl px-2 py-2 flex items-center gap-1 overflow-x-auto">
              {TOC_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`flex-1 min-w-fit rounded-xl px-4 py-2.5 font-mono text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap ${
                    activeSection === item.id
                      ? 'neo-inset text-[var(--accent-yellow)]'
                      : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </FadeIn>
        </div>

        {/* ── Content Sections ── */}
        <div className="space-y-20">

          {/* 01 为什么建站 */}
          <FadeIn>
            <section id="why" className="scroll-mt-40">
              <SectionHeader num="01" title="为什么建站" />
              <div className="space-y-5">
                <div className="neo-flat rounded-[28px] p-8 lg:p-10 space-y-4 text-[15px] leading-relaxed text-[var(--text-sub)]">
                  <p>动机不复杂，但也不是一时冲动。</p>
                  <p>
                    我想有一个真正属于自己的地方——不是微信公众号，不是某个平台的主页，而是一个我可以{' '}
                    <strong className="text-[var(--text-main)]">完全自主掌控</strong>、能完整展示自己的空间。
                  </p>
                  <p>
                    作为产品经理，我长期处在产品和研发的边界上。我想亲手验证一件事：
                    <strong className="text-[var(--text-main)]">
                      没有工程背景的人，能不能用 AI 工具独立走完从想法到上线的全链路？
                    </strong>
                  </p>
                  <p>
                    所以这个网站对我来说有两层意义：一是
                    <strong className="text-[var(--text-main)]">能力的展示</strong>
                    ——它是我的动态简历，让别人更立体地了解我；二是
                    <strong className="text-[var(--text-main)]">持续探索的场所</strong>
                    ——我可以在这里不断尝试新的 Vibe Coding 思路，让它一直生长。
                  </p>
                </div>
                <Callout>
                  先规划，后动手。在写第一行 Prompt 之前，花半天和 AI 讨论清楚「给谁看、传递什么、每个模块放什么」。这半天帮我省了后面至少两三天的反复推倒重来。
                </Callout>
              </div>
            </section>
          </FadeIn>

          {/* 02 技术选型 */}
          <FadeIn delay={0.05}>
            <section id="tech" className="scroll-mt-40">
              <SectionHeader num="02" title="技术选型" />
              <div className="space-y-5">
                <div className="neo-flat rounded-[28px] p-8 lg:p-10 space-y-4 text-[15px] leading-relaxed text-[var(--text-sub)]">
                  <p>
                    技术方向是和 Gemini 反复讨论出来的。我不是让它直接给答案，而是把我的情况、约束和目标描述清楚，再问"哪个方向性价比最高"。
                  </p>
                  <p>
                    最终定下：
                    <strong className="text-[var(--text-main)]">
                      Next.js 16 + React 19 + Tailwind CSS v4 + Framer Motion
                    </strong>
                    ，部署在 Vercel。内容管理完全自建，Markdown 文件 + TypeScript 数据源，不依赖任何第三方 CMS。
                  </p>
                  <p>
                    这套方案的逻辑是：性能足够、生态成熟、和 AI 协作效率最高——Claude 对 Next.js App Router 的理解非常好，生成的代码基本不需要大量调整。
                  </p>
                </div>

                {/* Tool flow */}
                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  {[
                    { name: 'Gemini', role: '前期规划 · 架构讨论', color: 'var(--accent-purple)' },
                    null,
                    { name: 'Cursor + Claude', role: '代码实现 · 迭代开发', color: 'var(--accent-yellow)' },
                    null,
                    { name: 'Vercel', role: '部署上线', color: 'var(--text-sub)' },
                  ].map((item, i) =>
                    item === null ? (
                      <div key={i} className="hidden sm:flex items-center justify-center text-[var(--shadow-dark)]">
                        <span className="font-mono text-xl">→</span>
                      </div>
                    ) : (
                      <div key={i} className="neo-inset rounded-2xl p-5 flex-1 text-center">
                        <div className="font-serif text-base font-bold mb-1.5" style={{ color: item.color }}>
                          {item.name}
                        </div>
                        <div className="font-mono text-[9px] text-[var(--text-sub)] tracking-wide">
                          {item.role}
                        </div>
                      </div>
                    )
                  )}
                </div>

                <Callout>
                  AI 的上限不在于它有多聪明，而在于你给它的信息有多完整。把需求、风格、目标用户、约束条件都描述清楚，越具体越好。
                </Callout>
              </div>
            </section>
          </FadeIn>

          {/* 03 实战过程 */}
          <FadeIn delay={0.05}>
            <section id="process" className="scroll-mt-40">
              <SectionHeader num="03" title="实战过程" />
              <div className="space-y-5">
                <div className="neo-flat rounded-[28px] p-8 lg:p-10 text-[15px] leading-relaxed text-[var(--text-sub)]">
                  <p>
                    技术上反而没遇到太大障碍——这出乎我自己的意料。真正让我反复折腾的，是三个更本质的问题。
                  </p>
                </div>

                {PAIN_POINTS.map((item, i) => (
                  <motion.div
                    key={i}
                    className="neo-flat rounded-[28px] p-7 lg:p-8"
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className="neo-inset rounded-full px-2.5 py-1 font-mono text-[10px] text-[var(--accent-yellow)] tracking-widest">
                        {item.tag}
                      </span>
                      <h3 className="font-serif text-lg font-bold">{item.title}</h3>
                    </div>
                    <div className="space-y-3 text-sm leading-relaxed text-[var(--text-sub)] mb-5">
                      {item.body.map((p, j) => (
                        <p key={j}>{p}</p>
                      ))}
                    </div>
                    <div
                      className="neo-inset rounded-xl p-4 text-[13px] leading-relaxed text-[var(--text-sub)] italic"
                      style={{ borderLeft: '2px solid var(--accent-yellow)' }}
                    >
                      {item.lesson}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </FadeIn>

          {/* 04 给你的建议 */}
          <FadeIn delay={0.05}>
            <section id="tips" className="scroll-mt-40">
              <SectionHeader num="04" title="给你的建议" />
              <div className="space-y-5">
                <div className="neo-flat rounded-[28px] p-8 lg:p-10 space-y-4 text-[15px] leading-relaxed text-[var(--text-sub)]">
                  <p>
                    如果你是产品经理、设计师，或者任何不会写代码但有想法的人，这件事{' '}
                    <strong className="text-[var(--text-main)]">真的可以做，而且没有你想的那么难</strong>。
                  </p>
                  <p>但真正的卡点往往不在技术上，而在这三个问题上：</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      num: '01',
                      q: '你想做一个什么样的网站？',
                      desc: '不是功能层面，而是气质层面——打开第一眼，你希望别人感受到什么？',
                    },
                    {
                      num: '02',
                      q: '你的网站上要展示什么？',
                      desc: '不要试图什么都放，先想清楚最核心的一个点。',
                    },
                    {
                      num: '03',
                      q: '最终想给别人带来什么？',
                      desc: '是了解你这个人，还是学到某些东西，还是找到你合作？',
                    },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="neo-inset rounded-2xl p-6"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    >
                      <div
                        className="font-mono text-3xl font-black mb-3"
                        style={{ color: 'var(--accent-yellow)', opacity: 0.35 }}
                      >
                        {item.num}
                      </div>
                      <div className="font-semibold text-sm mb-2">{item.q}</div>
                      <div className="font-mono text-[11px] text-[var(--text-sub)] leading-relaxed">
                        {item.desc}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Callout>
                  想清楚这三个问题，再去找 AI 帮你实现。顺序不能反。
                </Callout>

                <CodeBlock label="示例 Prompt · 如何告诉 AI 你想要什么">
{`我想做一个个人网站，以下是我的完整需求描述：

目标读者：[具体说明，例如「同行产品经理 + 潜在雇主」]
想传递的核心信息：[1-2 个关键点]
视觉风格：[描述气质，不要说"好看的"，例如「低调、有质感、不花哨」]
技术要求：[你的实际约束，例如「不想维护服务器、希望免费部署」]
必须有的模块：[按优先级列举]

请先帮我梳理整体架构和模块逻辑，不要直接写代码。`}
                </CodeBlock>
              </div>
            </section>
          </FadeIn>

        </div>

        {/* ── Tech Stack ── */}
        <FadeIn delay={0.05}>
          <section>
            <div className="flex items-center gap-3 mb-8">
              <h2 className="font-serif text-3xl font-bold">技术栈</h2>
              <span className="font-mono text-[10px] text-[var(--text-sub)] uppercase tracking-widest">
                // STACK
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {TECH_STACK.map((item, i) => (
                <motion.div
                  key={item.name}
                  className="neo-flat rounded-2xl p-4 text-center"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  whileHover={{ scale: 1.05, y: -4, transition: { duration: 0.2 } }}
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="font-semibold text-xs mb-0.5">{item.name}</div>
                  <div className="font-mono text-[9px] text-[var(--text-sub)]">{item.desc}</div>
                </motion.div>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* ── Timeline ── */}
        <FadeIn delay={0.05}>
          <section>
            <div className="flex items-center gap-3 mb-8">
              <h2 className="font-serif text-3xl font-bold">建站历程</h2>
            </div>
            <div className="relative">
              <div
                className="absolute top-0 bottom-0 hidden lg:block"
                style={{
                  left: 80,
                  width: 1,
                  background:
                    'linear-gradient(to bottom, transparent, var(--shadow-dark) 20%, var(--shadow-dark) 80%, transparent)',
                }}
              />
              <div className="space-y-3">
                {TIMELINE.map((item, i) => {
                  const isLast = i === TIMELINE.length - 1;
                  return (
                    <motion.div
                      key={item.day}
                      className={`neo-flat rounded-2xl p-5 lg:pl-24 relative ${isLast ? 'ring-1 ring-[var(--accent-yellow)]/50' : ''}`}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.45, delay: i * 0.08 }}
                      whileHover={{ scale: 1.008, transition: { duration: 0.2 } }}
                    >
                      <div
                        className="absolute hidden lg:block"
                        style={{
                          left: 74,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: isLast ? 'var(--accent-yellow)' : 'var(--shadow-dark)',
                          boxShadow: isLast ? '0 0 10px rgba(255,203,0,0.6)' : undefined,
                        }}
                      />
                      <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
                        <div className="neo-inset rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-[var(--text-sub)] shrink-0 min-w-[72px] text-center">
                          {item.day}
                        </div>
                        <p className="text-sm text-[var(--text-sub)] flex-1">{item.event}</p>
                        {isLast && (
                          <span className="inline-flex items-center gap-1 font-mono text-[9px] text-[var(--accent-yellow)] shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-yellow)] animate-pulse inline-block" />
                            MVP LIVE
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        </FadeIn>

        {/* ── CTA ── */}
        <FadeIn>
          <section className="neo-flat rounded-[32px] p-8 lg:p-14 text-center relative overflow-hidden">
            <div className="corner-screw tl" />
            <div className="corner-screw tr" />
            <div className="corner-screw bl" />
            <div className="corner-screw br" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  'linear-gradient(var(--text-main) 1px, transparent 1px), linear-gradient(90deg, var(--text-main) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />
            <div className="relative">
              <div className="font-mono text-[9px] text-[var(--text-sub)] uppercase tracking-widest mb-5">
                // 持续更新中
              </div>
              <h2 className="font-serif text-3xl lg:text-4xl font-black mb-3">你也可以做到</h2>
              <p className="text-[15px] text-[var(--text-sub)] mb-8 max-w-md mx-auto leading-relaxed">
                想聊聊 Vibe Coding 的经验，或者建站遇到了问题？
              </p>
              <a
                href="mailto:sxy13931439991@163.com"
                className="neo-btn inline-flex items-center gap-2 rounded-2xl px-8 py-4 font-mono text-sm font-semibold text-[var(--accent-yellow)] transition hover:scale-105"
              >
                来找我聊聊 →
              </a>
              <p className="font-mono text-[10px] text-[var(--text-sub)] mt-8 opacity-50 tracking-widest">
                下一篇：行业洞察模块的设计思路
              </p>
            </div>
          </section>
        </FadeIn>

        {/* ── Footer ── */}
        <FadeIn>
          <div className="text-center py-6">
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
