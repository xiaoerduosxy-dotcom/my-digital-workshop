'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ─── Static Data ─────────────────────────────────────────────

const GOVERNANCE_DATA = [
  { subject: '需求调研', before: 5, after: 98 },
  { subject: '资源盘点', before: 5, after: 95 },
  { subject: '标准制定', before: 5, after: 92 },
  { subject: '数据清洗', before: 5, after: 90 },
  { subject: '质量评估', before: 5, after: 93 },
  { subject: '数据分类', before: 5, after: 96 },
  { subject: '安全管控', before: 5, after: 85 },
  { subject: '监控运维', before: 5, after: 88 },
];

const CAREER_STEPS = [
  {
    period: '2025 — Now',
    role: 'AI 产品经理',
    company: '百分点集团',
    desc: 'NL2SQL · Agent 落地 · 私有化部署 · 数据治理平台 AI 改造',
    tag: 'AI PM',
    isActive: true,
  },
  {
    period: '2020 — 2025',
    role: '产品经理',
    company: '芯盾时代',
    desc: '深耕政企零信任安全，负责 Web / 移动 / 客户端全产品线用户体验优化，参与 CRM 重构与 SDP 零信任平台产品设计',
    tag: 'B-SIDE',
    isActive: false,
  },
  {
    period: '2019 — 2020',
    role: '产品经理',
    company: '智才广赢',
    desc: '多条 C 端移动业务线迭代，理解增长与转化漏斗逻辑',
    tag: 'C-SIDE',
    isActive: false,
  },
  {
    period: '2018 — 2019',
    role: '产品助理',
    company: '鲸落纷呈动漫科技',
    desc: '协助 App 功能规划，梳理交互流程 —— 从设计到产品的第一步转型',
    tag: 'PRODUCT',
    isActive: false,
  },
];

const SKILLS = [
  {
    category: 'AI / 大模型',
    items: ['Claude', 'GPT-4', '本地小模型 7B/14B', 'RAG', 'NL2SQL', 'Agent 工作流', 'SFT 微调'],
  },
  {
    category: '开发工具',
    items: ['Cursor', 'Vibe Coding', 'API 接入', 'Next.js', 'React'],
  },
  {
    category: '产品工具',
    items: ['Figma', 'Axure', '原型设计', '业务流程梳理'],
  },
  {
    category: '业务领域',
    items: ['政企数据治理', '零信任安全', '企业知识库', 'BI / 智能问数'],
  },
];

const VALUES = [
  { icon: '⚡', label: '实干派', desc: '不停在文档层面，喜欢动手验证，能跑通的东西比任何 PPT 都诚实' },
  { icon: '🎨', label: '有审美', desc: '对界面和交互有真实的审美判断，知道什么叫好用，什么叫好看' },
  { icon: '🧭', label: '好奇心驱动', desc: '每次职业转型都源于好奇，不是规划，是真的想搞明白下一个问题' },
  { icon: '🎯', label: '有边界感', desc: '知道大模型能做什么、不能做什么，不夸大也不保守' },
];

// ─── Animation Helpers ───────────────────────────────────────

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

function FadeIn({ children, delay = 0, className = '' }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Efficiency Chart (百小思) ────────────────────────────────

function EfficiencyChart() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <div ref={ref} className="space-y-5">
      {/* Two comparison cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Traditional */}
        <motion.div
          className="neo-inset rounded-2xl p-5 text-center"
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="font-mono text-[9px] text-[var(--text-sub)] mb-2 tracking-widest uppercase">
            传统 BI 查数
          </div>
          <div className="font-serif text-4xl font-black text-[#94a3b8] leading-none mb-1">
            3~5<span className="text-xl ml-1">天</span>
          </div>
          <div className="font-mono text-[9px] text-[var(--text-sub)] leading-snug mt-2">
            等待研发排期写 SQL
          </div>
        </motion.div>

        {/* AI */}
        <motion.div
          className="neo-inset rounded-2xl p-5 text-center relative overflow-hidden"
          initial={{ opacity: 0, x: 20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(255,203,0,0.1) 0%, transparent 70%)',
            }}
          />
          <div className="font-mono text-[9px] text-[var(--accent-yellow)] mb-2 tracking-widest uppercase">
            AI 智能问数
          </div>
          <div
            className="font-serif text-4xl font-black text-[var(--accent-yellow)] leading-none mb-1"
            style={{ textShadow: '0 0 16px rgba(255,203,0,0.5)' }}
          >
            {'<'}3<span className="text-xl ml-1">秒</span>
          </div>
          <div className="font-mono text-[9px] text-[var(--text-sub)] leading-snug mt-2">
            自然语言即达
          </div>
        </motion.div>
      </div>

      {/* Bar comparison */}
      <div className="neo-inset rounded-2xl p-5 space-y-4">
        <div className="font-mono text-[9px] text-[var(--text-sub)] uppercase tracking-widest">
          时间轴对比（相对比例）
        </div>

        {/* Traditional bar */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-mono text-[10px] text-[var(--text-sub)]">传统流程</span>
            <span className="font-mono text-[10px] text-[#94a3b8] font-semibold">≈ 172,800 秒</span>
          </div>
          <div className="h-6 rounded-lg bg-[var(--bg-page)] overflow-hidden">
            <motion.div
              className="h-full rounded-lg"
              style={{
                background: 'linear-gradient(90deg, #94a3b8 0%, #cbd5e1 100%)',
              }}
              initial={{ width: '0%' }}
              animate={isInView ? { width: '100%' } : { width: '0%' }}
              transition={{ duration: 1.4, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        {/* AI bar */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-mono text-[10px] text-[var(--accent-yellow)]">AI 问数</span>
            <span className="font-mono text-[10px] text-[var(--accent-yellow)] font-semibold">{'<'} 3 秒</span>
          </div>
          <div className="h-6 rounded-lg bg-[var(--bg-page)] overflow-hidden relative">
            <motion.div
              className="h-full rounded-l-lg absolute left-0 top-0"
              style={{
                background: 'linear-gradient(90deg, #FFCB00, #FFE066)',
                boxShadow: '0 0 16px rgba(255,203,0,0.7)',
              }}
              initial={{ width: '0px', opacity: 0 }}
              animate={isInView ? { width: '4px', opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: 1.6 }}
            />
          </div>
        </div>
      </div>

      {/* 100x badge */}
      <motion.div
        className="flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, delay: 1.9, type: 'spring', bounce: 0.4 }}
      >
        <div className="neo-btn rounded-full px-8 py-3 flex items-center gap-3">
          <span
            className="font-serif text-3xl font-black text-[var(--accent-yellow)]"
            style={{ textShadow: '0 0 20px rgba(255,203,0,0.5)' }}
          >
            100x+
          </span>
          <span className="font-mono text-xs text-[var(--text-sub)]">效率跃升</span>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Coverage Radar Chart (AI-DG) ─────────────────────────────

function CoverageChart() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isInView && !mounted) {
      const t = setTimeout(() => setMounted(true), 200);
      return () => clearTimeout(t);
    }
  }, [isInView, mounted]);

  return (
    <div ref={ref} className="space-y-4">
      {/* Radar */}
      <div className="neo-inset rounded-2xl p-4" style={{ height: 280 }}>
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={GOVERNANCE_DATA} cx="50%" cy="50%" outerRadius="72%">
              <PolarGrid stroke="#cdd1e0" strokeDasharray="4 3" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'monospace' }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="引入AI前（非技术用户）"
                dataKey="before"
                stroke="#cdd1e0"
                fill="#cdd1e0"
                fillOpacity={0.5}
                isAnimationActive
                animationDuration={800}
              />
              <Radar
                name="引入AI后（非技术用户）"
                dataKey="after"
                stroke="#FFCB00"
                fill="#FFCB00"
                fillOpacity={0.22}
                isAnimationActive
                animationDuration={1400}
                animationBegin={300}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 9, fontFamily: 'monospace', paddingTop: 4 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="font-mono text-xs text-[var(--text-sub)] animate-pulse tracking-widest">
              LOADING CHART...
            </span>
          </div>
        )}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          className="neo-inset rounded-xl p-4 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <div
            className="font-serif text-2xl font-black text-[var(--accent-yellow)] mb-1"
            style={{ textShadow: '0 0 12px rgba(255,203,0,0.4)' }}
          >
            8/8
          </div>
          <div className="font-mono text-[9px] text-[var(--text-sub)] uppercase tracking-wider leading-snug">
            治理环节
            <br />
            全覆盖
          </div>
        </motion.div>

        <motion.div
          className="neo-inset rounded-xl p-4 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.65 }}
        >
          <div className="font-serif text-2xl font-black text-[var(--accent-purple)] mb-1">
            60%+
          </div>
          <div className="font-mono text-[9px] text-[var(--text-sub)] uppercase tracking-wider leading-snug">
            小白用户
            <br />
            任务完成率
          </div>
        </motion.div>

        <motion.div
          className="neo-inset rounded-xl p-4 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          <div className="font-serif text-2xl font-black text-[var(--text-main)] mb-1">11</div>
          <div className="font-mono text-[9px] text-[var(--text-sub)] uppercase tracking-wider leading-snug">
            标准化
            <br />
            Agent 节点
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      {/* Sticky header */}
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
            About Me
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-6 py-12 space-y-16">

        {/* ── Hero ── */}
        <FadeIn>
          <section className="neo-flat rounded-[32px] p-8 lg:p-14 relative overflow-hidden">
            {/* Corner screws */}
            <div className="corner-screw tl" />
            <div className="corner-screw tr" />
            <div className="corner-screw bl" />
            <div className="corner-screw br" />

            {/* Background grid hint */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  'linear-gradient(var(--text-main) 1px, transparent 1px), linear-gradient(90deg, var(--text-main) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />

            <div className="relative max-w-3xl">
              <div className="font-mono text-[10px] text-[var(--accent-purple)] tracking-widest uppercase mb-5">
                // ABOUT ME · 关于我
              </div>
              <h1 className="font-serif text-5xl lg:text-6xl font-black leading-tight mb-8">
                Driven by{' '}
                <span
                  className="text-[var(--accent-yellow)]"
                  style={{ textShadow: '0 0 24px rgba(255,203,0,0.25)' }}
                >
                  Curiosity
                </span>
                ,
                <br />
                Grounded in <em>Reality</em>.
              </h1>
              <div className="space-y-4 text-[15px] leading-relaxed text-[var(--text-sub)] max-w-2xl">
                <p>嗨，我是 Jerry。</p>
                <p>
                  我现在做的事情，是把大模型真正用进企业的日常业务里——不是在 PRD 里写「接入 AI」，而是判断哪个节点值得用、在私有化环境里让产品真的能跑起来、用产品设计补偿小模型的能力缺陷。
                </p>
                <p>
                  现在最让我着迷的事，是把 AI 用进真实的、乱糟糟的企业业务里。不是那种「接入大模型自动回复」的用法，而是在一个有历史包袱、有组织摩擦的真实场景里，找到它真正能帮上忙的地方。
                </p>
                <p>
                  我日常用 Cursor 写代码，在需求评审前就能拿出可演示的原型。能跑通的东西，比任何文档都诚实。
                </p>
              </div>

              {/* Identity tags */}
              <div className="flex flex-wrap gap-2 mt-8">
                {['5 年 B端经验', 'AI 落地', 'Agent 工作流', 'Vibe Coding', '私有化部署'].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="neo-inset rounded-full px-3 py-1 font-mono text-[10px] text-[var(--text-sub)] tracking-wide"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>
          </section>
        </FadeIn>

        {/* ── Career Timeline ── */}
        <FadeIn delay={0.05}>
          <section>
            <div className="flex items-center gap-3 mb-8">
              <h2 className="font-serif text-3xl font-bold">职业路径</h2>
              <span className="neo-inset flex h-9 w-9 items-center justify-center rounded-full text-base">
                🗺
              </span>
            </div>

            <div className="relative">
              {/* Vertical line (desktop only) */}
              <div
                className="absolute top-0 bottom-0 hidden lg:block"
                style={{
                  left: 60,
                  width: 1,
                  background:
                    'linear-gradient(to bottom, transparent, var(--shadow-dark) 20%, var(--shadow-dark) 80%, transparent)',
                }}
              />

              <div className="space-y-3">
                {CAREER_STEPS.map((step, i) => (
                  <motion.div
                    key={step.period}
                    className={`neo-flat rounded-2xl p-5 lg:pl-20 relative cursor-default ${
                      step.isActive
                        ? 'ring-1 ring-[var(--accent-yellow)]/50'
                        : ''
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    whileHover={{ scale: 1.008, transition: { duration: 0.2 } }}
                  >
                    {/* Timeline dot */}
                    <div
                      className="absolute hidden lg:block"
                      style={{
                        left: 54,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: step.isActive ? 'var(--accent-yellow)' : 'var(--shadow-dark)',
                        boxShadow: step.isActive
                          ? '0 0 10px rgba(255,203,0,0.6)'
                          : undefined,
                      }}
                    />

                    <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
                      <div className="neo-inset rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-[var(--text-sub)] shrink-0">
                        {step.period}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{step.role}</span>
                          {step.company && (
                            <span className="text-[var(--text-sub)] text-sm">
                              @ {step.company}
                            </span>
                          )}
                          <span
                            className={`neo-inset rounded-full px-2 py-0.5 font-mono text-[9px] tracking-widest ${
                              step.isActive
                                ? 'text-[var(--accent-yellow)]'
                                : 'text-[var(--text-sub)]'
                            }`}
                          >
                            {step.tag}
                          </span>
                          {step.isActive && (
                            <span className="inline-flex items-center gap-1 font-mono text-[9px] text-[var(--accent-yellow)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-yellow)] animate-pulse inline-block" />
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-sub)] mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </FadeIn>

        {/* ── Core AI Projects ── */}
        <section>
          <FadeIn delay={0.05}>
            <div className="flex items-center gap-3 mb-8">
              <h2 className="font-serif text-3xl font-bold">核心 AI 项目</h2>
              <span className="neo-inset rounded-full px-3 py-1 font-mono text-[10px] font-semibold text-[var(--accent-yellow)] tracking-widest">
                FEATURED
              </span>
            </div>
          </FadeIn>

          <div className="space-y-8">

            {/* Project 1: 百小思 */}
            <FadeIn delay={0.1}>
              <motion.div
                className="neo-flat rounded-[32px] p-8 lg:p-10"
                whileHover={{
                  scale: 1.006,
                  boxShadow:
                    '20px 20px 42px var(--shadow-dark), -20px -20px 42px var(--shadow-light)',
                  transition: { duration: 0.3 },
                }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  {/* Left: description */}
                  <div>
                    <div className="flex items-center gap-2 mb-5 flex-wrap">
                      <span className="neo-inset rounded-full px-3 py-1 font-mono text-[9px] text-[var(--accent-yellow)] tracking-widest">
                        百分点集团 · NL2SQL
                      </span>
                      <span className="neo-inset rounded-full px-3 py-1 font-mono text-[9px] text-[var(--text-sub)] tracking-widest">
                        2025 → NOW
                      </span>
                    </div>
                    <h3 className="font-serif text-4xl font-bold mb-2">百小思</h3>
                    <p className="font-mono text-sm text-[var(--accent-purple)] mb-5">
                      企业级智能业务助手 · 智能问数
                    </p>
                    <div className="space-y-3 text-sm leading-relaxed text-[var(--text-sub)]">
                      <p>
                        面向政企客户的私有化部署智能业务助手，核心功能为{' '}
                        <strong className="text-[var(--text-main)]">智能问数（NL2SQL）</strong>{' '}
                        和智能报告生成。
                      </p>
                      <p>
                        核心突破：在算力受限的私有化环境（7B/14B 本地小模型）中，通过{' '}
                        <strong className="text-[var(--text-main)]">Schema-RAG + 局部微调</strong>
                        方案，解决了「模型不懂企业数据库方言」的问题，让业务人员无需懂 SQL 即可自助查数。
                      </p>
                      <p>
                        同时设计「SQL 逻辑可视化反问」确认节点，从产品层面兜底数据幻觉风险，保障数据准确性。
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-6">
                      {[
                        'Schema-RAG',
                        '局部微调',
                        'NL2SQL',
                        '私有化部署',
                        '幻觉兜底',
                        '报告 Agent',
                      ].map((tag) => (
                        <span
                          key={tag}
                          className="neo-inset rounded-full px-3 py-1 font-mono text-[9px] text-[var(--text-sub)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: efficiency chart */}
                  <div>
                    <div className="font-mono text-[9px] text-[var(--text-sub)] uppercase tracking-widest mb-4">
                      // 效能对比图
                    </div>
                    <EfficiencyChart />
                  </div>
                </div>
              </motion.div>
            </FadeIn>

            {/* Project 2: AI-DG */}
            <FadeIn delay={0.15}>
              <motion.div
                className="neo-flat rounded-[32px] p-8 lg:p-10"
                whileHover={{
                  scale: 1.006,
                  boxShadow:
                    '20px 20px 42px var(--shadow-dark), -20px -20px 42px var(--shadow-light)',
                  transition: { duration: 0.3 },
                }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  {/* Left: coverage chart (reordered on desktop) */}
                  <div className="order-2 lg:order-1">
                    <div className="font-mono text-[9px] text-[var(--text-sub)] uppercase tracking-widest mb-4">
                      // 能力覆盖图 · 8 大治理环节
                    </div>
                    <CoverageChart />
                  </div>

                  {/* Right: description */}
                  <div className="order-1 lg:order-2">
                    <div className="flex items-center gap-2 mb-5 flex-wrap">
                      <span className="neo-inset rounded-full px-3 py-1 font-mono text-[9px] text-[var(--accent-purple)] tracking-widest">
                        百分点集团 · 数据治理
                      </span>
                      <span className="neo-inset rounded-full px-3 py-1 font-mono text-[9px] text-[var(--text-sub)] tracking-widest">
                        2025 → NOW
                      </span>
                    </div>
                    <h3 className="font-serif text-4xl font-bold mb-2">AI-DG</h3>
                    <p className="font-mono text-sm text-[var(--accent-purple)] mb-5">
                      智能数据治理平台 · 能力边界扩张
                    </p>
                    <div className="space-y-3 text-sm leading-relaxed text-[var(--text-sub)]">
                      <p>
                        将原有{' '}
                        <strong className="text-[var(--text-main)]">专业级数据治理平台</strong>
                        （BDOS）通过 AI 改造，使非技术业务人员也能独立完成基线数据治理任务。
                      </p>
                      <p>
                        将 8 大治理环节重构为{' '}
                        <strong className="text-[var(--text-main)]">
                          11 个标准化 Agent 引导工作流
                        </strong>
                        ，通过 GUI+LUI 融合设计彻底消除「提示词门槛」，让非技术用户点击即可完成交互。
                      </p>
                      <p>
                        底层直连 BDOS 业务数据，置入 RAG 知识库，防止模型幻觉影响业务决策。非技术用户独立操作覆盖率{' '}
                        <strong className="text-[var(--text-main)]">0% → 100%</strong>。
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-6">
                      {[
                        'Agent 工作流',
                        'GUI+LUI 融合',
                        'RAG 防幻觉',
                        '11 个标准节点',
                        '私有化部署',
                      ].map((tag) => (
                        <span
                          key={tag}
                          className="neo-inset rounded-full px-3 py-1 font-mono text-[9px] text-[var(--text-sub)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          </div>
        </section>

        {/* ── Skills ── */}
        <FadeIn delay={0.05}>
          <section>
            <div className="flex items-center gap-3 mb-8">
              <h2 className="font-serif text-3xl font-bold">技术与工具</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SKILLS.map((group, i) => (
                <motion.div
                  key={group.category}
                  className="neo-flat rounded-2xl p-5"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                >
                  <div className="font-mono text-[9px] text-[var(--accent-yellow)] uppercase tracking-widest mb-3">
                    {group.category}
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div
                        key={item}
                        className="font-mono text-[11px] text-[var(--text-sub)] flex items-center gap-2"
                      >
                        <span className="w-1 h-1 rounded-full bg-[var(--accent-yellow)] opacity-70 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* ── Values ── */}
        <FadeIn delay={0.05}>
          <section className="neo-flat rounded-[32px] p-8 lg:p-10">
            <div className="flex items-center gap-3 mb-8">
              <h2 className="font-serif text-3xl font-bold">个性标签</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {VALUES.map((v, i) => (
                <motion.div
                  key={v.label}
                  className="neo-inset rounded-2xl p-5"
                  initial={{ opacity: 0, scale: 0.93 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                >
                  <div className="text-2xl mb-3">{v.icon}</div>
                  <div className="font-semibold text-sm mb-2">{v.label}</div>
                  <div className="font-mono text-[10px] text-[var(--text-sub)] leading-relaxed">
                    {v.desc}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Slogan */}
            <div className="mt-10 pt-8 border-t border-[var(--shadow-dark)]/40 text-center">
              <p className="font-serif text-2xl lg:text-3xl font-bold text-[var(--text-main)]">
                好奇是罗盘，落地是信仰。
              </p>
              <p className="font-mono text-xs text-[var(--text-sub)] mt-2 opacity-70 tracking-widest">
                DRIVEN BY CURIOSITY · GROUNDED IN REALITY
              </p>
            </div>
          </section>
        </FadeIn>

        {/* ── Footer ── */}
        <FadeIn>
          <div className="text-center py-6 space-y-3">
            <p className="font-mono text-sm text-[var(--text-sub)]">
              想聊聊？{' '}
              <a
                href="mailto:sxy13931439991@163.com"
                className="text-[var(--accent-yellow)] hover:underline transition"
              >
                sxy13931439991@163.com
              </a>
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
