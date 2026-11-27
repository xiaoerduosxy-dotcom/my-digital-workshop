import Link from 'next/link';

export const WORKSHOP_NAV = [
  { href: '/about', label: '关于我', caption: 'ABOUT' },
  { href: '/lab', label: '实战实验室', caption: 'AI LAB' },
  { href: '/insights', label: '行业见解', caption: 'INSIGHTS' },
] as const;

export default function WorkshopSidebar({ variant = 'home' }: { variant?: 'home' | 'chat' }) {
  const home = variant === 'home';
  const Name = home ? 'h1' : 'p';

  return (
    <aside className={`neo-flat relative w-full flex-col overflow-hidden rounded-[32px] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[360px] lg:flex-shrink-0 ${home ? 'flex' : 'hidden lg:flex'}`}>
      <div className="corner-screw tl" />
      <div className="corner-screw tr" />
      <div className="corner-screw bl" />
      <div className="corner-screw br" />

      <div className="h-[200px] overflow-hidden lg:h-auto lg:flex-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={home ? '/profile-animated.gif' : '/profile.png'} alt="Jerry" className="h-full w-full select-none object-contain object-top lg:object-cover" />
      </div>

      <div className="px-6 pt-3 pb-2 lg:px-8 lg:pt-4 lg:pb-2">
        <Name className="font-serif text-3xl font-black tracking-wide">Jerry.</Name>
        <p className="mt-1 font-mono text-[11px] tracking-widest text-[var(--text-sub)]">AI PRODUCT MANAGER // BUILDER</p>
      </div>

      <nav aria-label="工坊导航" className="space-y-2.5 px-6 pb-10 lg:px-8 lg:pb-12">
        {WORKSHOP_NAV.map(({ href, label, caption }) => {
          const localAnchor = home && href === '/lab';
          const NavLink = localAnchor ? 'a' : Link;

          return (
            <NavLink
              key={href}
              href={localAnchor ? '#lab' : href}
              className={`neo-btn flex items-center justify-between rounded-2xl px-5 py-4 text-sm font-semibold transition hover:-translate-y-0.5 ${home && href === '/about' ? 'neo-inset text-[var(--accent-yellow)]' : ''}`}
            >
              <span>{label} {caption}</span>
              <span aria-hidden>→</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
