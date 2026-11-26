import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import AskJerryChat from '../components/AskJerryChat';
import WorkshopSidebar, { WORKSHOP_NAV } from '../components/WorkshopSidebar';

export const metadata: Metadata = { title: '问问 Jerry｜数字造物工坊', robots: { index: false, follow: true } };
export const viewport: Viewport = { interactiveWidget: 'resizes-content' };

export default function AskJerryPage() {
  return (
    <div className="bg-[var(--bg-page)] text-[var(--text-main)]">
      <div className="mx-auto flex min-h-[25rem] h-dvh w-full max-w-[1500px] flex-col gap-3 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:flex-row lg:gap-6 lg:p-6">
        <WorkshopSidebar variant="chat" />

        <header className="neo-flat relative z-10 flex shrink-0 items-center gap-2 rounded-2xl px-2.5 py-1.5 lg:hidden">
          <Link href="/" className="flex min-h-11 items-center rounded-lg px-1.5 text-xs font-semibold text-[#57446e] hover:underline">
            <span aria-hidden className="mr-1">←</span> 首页
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/profile.png" alt="" className="size-7 shrink-0 rounded-full bg-[#d4d7e3] object-cover object-top" />
            <span className="truncate font-serif text-base font-black">Jerry.</span>
          </div>
          <details className="relative shrink-0">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-lg px-1.5 text-xs font-semibold text-[#57446e] hover:underline [&::-webkit-details-marker]:hidden">导航 <span aria-hidden>▾</span></summary>
            <nav aria-label="工坊导航" className="neo-flat absolute right-0 top-full mt-1 grid w-36 gap-1 rounded-xl p-2">
              {WORKSHOP_NAV.map(({ href, label }) => (
                <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/65">{label}</Link>
              ))}
            </nav>
          </details>
        </header>

        <main className="neo-flat flex min-h-0 min-w-0 flex-1 flex-col rounded-[24px] lg:rounded-[32px]">
          <AskJerryChat />
        </main>
      </div>
    </div>
  );
}
