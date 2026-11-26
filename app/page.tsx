import Link from 'next/link';
import AskJerryEntry from './components/AskJerryEntry';
import DotMatrixWidget from './components/DotMatrixWidget';
import WorkshopSidebar from './components/WorkshopSidebar';
import { INSIGHTS } from '@/lib/insights';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 p-4 lg:flex-row lg:items-start lg:p-6">
        <WorkshopSidebar />

        <main className="w-full min-w-0 flex flex-col gap-6">

          {/* ── 上半区：about + insights 自然排布 ── */}
          <div className="flex flex-col gap-6">

            <section id="about" aria-labelledby="home-intro-title" className="neo-flat relative isolate min-w-0 overflow-hidden rounded-[32px] px-5 py-6 sm:px-8 sm:py-7 xl:px-10 xl:py-8">
              <DotMatrixWidget />
              <div className="relative z-10 flex min-w-0 flex-col gap-4 sm:gap-5">
                <h2 id="home-intro-title" className="font-serif text-[clamp(1.5rem,3.05vw,2.55rem)] font-bold leading-[1.14] text-[var(--text-main)]">
                  Driven by <span className="text-[var(--accent-yellow)]">Curiosity</span>,
                  <br />
                  Grounded in <em>Reality</em>.
                </h2>
                <AskJerryEntry />
              </div>
            </section>

            <section id="insights" className="neo-flat rounded-[32px] p-6 lg:p-8">
              {/* 标题行 */}
              <div className="mb-5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-serif text-2xl font-bold">
                  行业洞察
                  <span className="neo-inset flex h-8 w-8 items-center justify-center rounded-full text-xs text-[var(--accent-purple)]">
                    🎙
                  </span>
                </h2>
                <Link
                  href="/insights"
                  className="text-sm font-semibold text-[var(--text-sub)] hover:text-[var(--accent-yellow)] transition"
                >
                  查看全部列表 →
                </Link>
              </div>

              {/* 两篇最新洞察卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {INSIGHTS.slice(0, 2).map((item) => (
                  <Link
                    key={item.id}
                    href={`/insights/${item.id}`}
                    className="neo-inset rounded-2xl p-5 flex flex-col gap-4 group transition-transform hover:-translate-y-0.5"
                  >
                    {/* 分类标签 + 日期 */}
                    <div className="flex items-center gap-2">
                      <span className="neo-flat rounded-full px-2.5 py-1 font-mono text-[9px] text-[var(--accent-purple)] tracking-widest">
                        {item.category}
                      </span>
                      <span className="font-mono text-[9px] text-[var(--text-sub)]">{item.date}</span>
                    </div>

                    {/* 标题 + 摘要 */}
                    <div className="flex-1">
                      <h3 className="font-serif text-[17px] font-bold leading-snug mb-2 line-clamp-2 group-hover:text-[var(--accent-yellow)] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[var(--text-sub)] leading-relaxed line-clamp-2">
                        {item.summary}
                      </p>
                    </div>

                    {/* 播放器行 */}
                    <div className="flex items-center gap-3 neo-flat rounded-xl px-4 py-2.5">
                      <span className="player-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs text-[var(--accent-yellow)]">
                        ▶
                      </span>
                      <div className="wave-track flex-1 min-w-0 overflow-hidden" style={{ height: '2rem' }}>
                        {Array.from({ length: 14 }).map((_, idx) => (
                          <span key={idx} className={`wave-bar wave-${(idx % 12) + 1}`} />
                        ))}
                      </div>
                      <span className="font-mono text-[9px] text-[var(--text-sub)] group-hover:text-[var(--accent-yellow)] transition-colors shrink-0">
                        阅读全文 →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

          </div>
          {/* ── 下半区：实战实验室，自然排布在首屏下方 ── */}
          <section id="lab" className="lab-card bento-card neo-flat rounded-[32px] p-8 lg:p-10">
            <div className="bento-grid flex flex-col gap-8 lg:flex-row lg:items-center">
              <div className="relative z-20 flex-1 lg:pr-8">
                <div className="mb-4 flex items-center gap-3">
                  <span className="neo-inset rounded-full px-3 py-1 font-mono text-xs font-semibold tracking-wide text-[var(--accent-yellow)]">
                    LAB.ACTIVE
                  </span>
                </div>
                <h2 className="mb-3 font-serif text-4xl font-bold">实战实验室</h2>
                {/* 副标题改用紫色辅助色 */}
                <h3 className="mb-5 font-serif text-xl font-medium text-[var(--accent-purple)]">个人建站复盘</h3>
                <p className="mb-6 max-w-xl text-sm leading-relaxed text-[var(--text-sub)]">
                  打破产品与研发的边界，记录如何通过 Vibe Coding（Cursor + 大模型）从零构建这个个人网站，完成从想法到上线的全链路 MVP 闭环。
                </p>
                <Link
                  href="/lab"
                  className="neo-btn inline-block rounded-2xl px-7 py-4 font-medium text-[var(--accent-purple)] transition hover:text-[var(--accent-yellow)]"
                >
                  查看复盘文档
                </Link>
              </div>

              <div className="lab-scene relative z-10 flex min-h-[320px] flex-1 items-center justify-center">
                {/* 浮现代码片段 */}
                {/* preserve-3d 让子元素参与 lab-scene 的 3D 深度排序 */}
                <div
                  className="pointer-events-none absolute inset-0 z-30 font-mono text-xs text-[var(--text-sub)]"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="code-float cf-1 absolute left-[10%] top-[10%] rounded bg-[var(--bg-base)]/80 px-2 py-1 shadow-sm backdrop-blur-sm">
                    import {"{ DepthOfField }"} from &apos;@core/optics&apos;;
                  </div>
                  {/* cf-2：Z 深度超过键盘的 translateZ(24px)，浮在底座前面 */}
                  <div className="code-float cf-2 absolute bottom-[20%] right-[5%] rounded bg-[var(--bg-base)]/80 px-2 py-1 shadow-sm backdrop-blur-sm">
                    box-shadow: inset 8px 8px 16px var(--shadow-dark);
                  </div>
                  <div className="code-float cf-3 absolute left-[2%] top-[40%] rounded bg-[var(--bg-base)]/80 px-2 py-1 shadow-sm backdrop-blur-sm">
                    render(&lt;NeomorphicCard /&gt;);
                  </div>
                </div>

                <div className="computer-model relative z-20 flex flex-col items-center">
                  {/* 显示器外壳：冷灰白 + 冷灰边框 */}
                  <div className="neo-flat relative flex h-48 w-64 flex-col rounded-3xl border-b-[8px] border-[#CDD1E0] bg-[var(--bg-base)] p-4">
                    <div className="absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-[var(--text-main)] opacity-20" />
                    {/* 终端屏幕：深夜蓝底色，极客科技感 */}
                    <div className="screen-inner relative flex h-full w-full flex-col overflow-hidden rounded-2xl border-4 border-[#1E293B] bg-[#0F172A] p-4">
                      <div className="absolute left-0 top-0 h-1/2 w-full rounded-t-xl bg-gradient-to-b from-white/5 to-transparent" />
                      <div className="space-y-1 font-mono text-[10px] leading-tight text-[#94A3B8] opacity-90">
                        <p>
                          {/* 命令提示符：亮黄色 */}
                          <span className="text-[var(--accent-yellow)]">root@builder</span>:~$ init nexus
                        </p>
                        <p>Loading modules...</p>
                        {/* OK 状态：保持绿色（语义色不变） */}
                        <p className="text-green-400">[OK] Neomorphism Engine</p>
                        <p className="text-green-400">[OK] CSS 3D Transforms</p>
                        <p className="text-green-400">[OK] DoF Interaction Hook</p>
                        <p className="mt-2 text-white">&gt; Compiling interface...</p>
                        {/* 进度条：深蓝底 + 亮黄填充 */}
                        <div className="mt-2 h-1 w-full overflow-hidden rounded bg-[#1E293B]">
                          <div className="h-full w-2/3 bg-[var(--accent-yellow)]" />
                        </div>
                      </div>
                    </div>
                    {/* 颈部连接件：translateZ 设负值，确保在 3D 深度排序中低于键盘 */}
                    <div
                      className="neo-inset absolute -bottom-6 left-1/2 h-6 w-16 -translate-x-1/2 bg-[var(--bg-base)]"
                      style={{ transform: 'translateX(-50%) translateZ(-4px)' }}
                    />
                  </div>

                  {/* 键盘：translateZ 推到显示器底座前面，避免在 preserve-3d 中被深度排序到后方 */}
                  <div
                    className="neo-flat mt-6 flex h-16 w-full max-w-[18rem] flex-wrap content-center justify-center gap-1 rounded-xl border-b-[4px] border-[#CDD1E0] bg-[var(--bg-base)] p-2"
                    style={{ transform: 'rotateX(20deg) translateZ(24px)' }}
                  >
                    <div className="neo-inset relative flex h-[80%] w-[98%] flex-wrap gap-1 overflow-hidden rounded-lg p-1 opacity-50">
                      <div className="keycap w-8" />
                      <div className="keycap w-8" />
                      <div className="keycap w-24" />
                      <div className="keycap w-8" />
                      <div className="keycap flex-grow" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
