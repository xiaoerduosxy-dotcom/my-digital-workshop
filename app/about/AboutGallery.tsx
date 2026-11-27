'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { GalleryArt, travelerFrame } from './GalleryArt';
import { exhibitIds, galleryFocus, galleryRoute3D, galleryView, project, sites, type Exhibit, type GalleryRegion, type Point } from './gallery-geometry';
import styles from './gallery.module.css';

const exhibits = {
  design: {
    name: 'AI 健身',
    label: 'AI 健身 · 个人项目构想',
    title: '训练计划怎么跟得上真实生活？',
    description: '我想试试，AI 能不能结合训练目标和当天能腾出的时间，帮人选出一项自己愿意做、也做得下去的训练。',
  },
  ai: {
    name: '我的爱好',
    label: '我的爱好',
    title: '我和健身',
    description: '我健身已经好几年了，也曾兼职做过健身教练。现在我还会去上团课，训练一直是我生活里很重要的一部分。',
  },
  garden: {
    name: '工作项目',
    label: '工作项目',
    title: '智能问数，让业务人员自己查数',
    description: '这是我参与的企业 AI 项目。我主要做问数后台的主题划分、字段说明和查询范围配置，让业务人员可以用自然语言查数据，不必自己写 SQL。',
  },
  archive: {
    name: '帮我选',
    label: '帮我选 · 个人项目构想',
    title: '今晚去上团课，坐地铁还是骑车？',
    description: '我经常在两个各有好处的选项之间来回想。我想做个小助手，把时间、花费和当下的偏好理清楚，再给出一个有理由、能执行的建议。',
  },
} satisfies Record<Exhibit, { name: string; label: string; title: string; description: string }>;

const walkCycleLength = 64;
const walkFrames = travelerFrame.columns * travelerFrame.rows - 1;
const cameraScale = 1.08;
const arrivalMarker = project([90, 267, 41]);
type Phase = 'idle' | 'walking' | 'opening' | 'inside';

function measureRoute(exhibit: Exhibit, from?: Exhibit) {
  const worldPoints = galleryRoute3D(exhibit, from);
  const points = worldPoints.map(point => project(point));
  let distance = 0;
  const segments = points.slice(1).flatMap((to, index) => {
    const from = points[index];
    const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
    if (length < .001) return [];

    const start = distance;
    distance += length;
    return [{ from, to, worldFrom: worldPoints[index], worldTo: worldPoints[index + 1], length, start, end: distance }];
  });
  return { segments, length: distance };
}

function poseOnRoute(route: ReturnType<typeof measureRoute>, distance: number) {
  const segment = route.segments.find(part => distance <= part.end) ?? route.segments[route.segments.length - 1];
  const { from, to, start, length } = segment;
  const part = Math.min(1, Math.max(0, (distance - start) / length));
  const point: Point = [from[0] + (to[0] - from[0]) * part, from[1] + (to[1] - from[1]) * part];
  const worldX = segment.worldFrom[0] + (segment.worldTo[0] - segment.worldFrom[0]) * part;
  const worldY = segment.worldFrom[1] + (segment.worldTo[1] - segment.worldFrom[1]) * part;
  const building = sites.design.building;
  const behindDesign = worldX < building.x + building.width && worldY < building.y + building.length;
  return { point, behindDesign, facing: Math.abs(to[0] - from[0]) < .001 ? null : to[0] > from[0] ? 1 : -1 };
}

function cameraFor(exhibit: Exhibit) {
  const [x, y] = galleryFocus(exhibit);
  const cameraX = (galleryView.width / 2 - x) * .19 - 27;
  const cameraY = (galleryView.height / 2 - y) * .1 - 17;

  return {
    style: {
      '--camera-x': `${cameraX}px`,
      '--camera-y': `${cameraY}px`,
      '--camera-scale': cameraScale,
    } as CSSProperties,
    point: ([px, py]: Point): Point => [px * cameraScale + cameraX, py * cameraScale + cameraY],
  };
}

function markerStyle([x, y]: Point): CSSProperties {
  return { left: `${x / galleryView.width * 100}%`, top: `${y / galleryView.height * 100}%` };
}

export default function AboutGallery() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [journey, setJourney] = useState<{ to: Exhibit; from?: Exhibit } | null>(null);
  const [highlighted, setHighlighted] = useState<GalleryRegion | null>(null);
  const destination = journey?.to ?? null;
  const traveler = useRef<SVGGElement>(null);
  const animation = useRef(0);
  const doorTimer = useRef(0);
  const busy = useRef(false);
  const lastExhibit = useRef<Exhibit | null>(null);
  const roomHeading = useRef<HTMLHeadingElement>(null);
  const hotspots = useRef<Partial<Record<Exhibit, HTMLButtonElement | null>>>({});

  useEffect(() => () => {
    window.cancelAnimationFrame(animation.current);
    window.clearTimeout(doorTimer.current);
  }, []);

  useEffect(() => {
    if (phase === 'inside') roomHeading.current?.focus({ preventScroll: true });
    if (phase === 'idle' && lastExhibit.current) {
      hotspots.current[lastExhibit.current]?.focus({ preventScroll: true });
      lastExhibit.current = null;
    }
  }, [phase]);

  function place(route: ReturnType<typeof measureRoute>, distance: number, frame = 0) {
    const figure = traveler.current;
    if (!figure) return;

    const { point, facing, behindDesign } = poseOnRoute(route, distance);
    figure.parentElement?.setAttribute('mask', behindDesign ? 'url(#gallery-traveler-mask)' : 'none');
    const { columns, width, height } = travelerFrame;
    figure.setAttribute('transform', `translate(${point.join(' ')})`);
    figure.style.setProperty('--frame-x', `${-(frame % columns) * width}px`);
    figure.style.setProperty('--frame-y', `${-Math.floor(frame / columns) * height}px`);
    if (facing !== null) figure.style.setProperty('--facing', String(facing));
  }

  function preview(region: GalleryRegion, visible: boolean) {
    setHighlighted(current => visible ? region : current === region ? null : current);
  }

  function enter(exhibit: Exhibit) {
    if (busy.current || destination === exhibit) return;
    const from = phase === 'inside' ? destination ?? undefined : undefined;
    busy.current = true;
    setHighlighted(null);
    setJourney({ to: exhibit, from });
    const route = measureRoute(exhibit, from);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      place(route, route.length);
      busy.current = false;
      setPhase('inside');
      return;
    }

    setPhase('walking');
    const duration = Math.min(4550, Math.max(1100, route.length * 7.2));
    let start: number | undefined;

    function step(now: number) {
      start ??= now;
      const progress = Math.min(1, Math.max(0, (now - start) / duration));
      if (progress === 1) {
        place(route, route.length);
        setPhase('opening');
        doorTimer.current = window.setTimeout(() => {
          busy.current = false;
          setPhase('inside');
        }, 740);
        return;
      }

      const easing = progress < .1 ? 5 * progress ** 2
        : progress > .9 ? 1 - 5 * (1 - progress) ** 2
        : progress - .05 + (progress - .1) * .125;
      const distance = route.length * easing;
      const frame = Math.floor(distance / walkCycleLength * walkFrames) % walkFrames + 1;
      place(route, distance, frame);
      animation.current = window.requestAnimationFrame(step);
    }

    animation.current = window.requestAnimationFrame(step);
  }

  function backToGallery() {
    window.cancelAnimationFrame(animation.current);
    window.clearTimeout(doorTimer.current);
    lastExhibit.current = destination;
    place(measureRoute('design'), 0);
    busy.current = false;
    setHighlighted(null);
    setJourney(null);
    setPhase('idle');
  }

  const focused = phase === 'opening' || phase === 'inside';
  const canExplore = phase === 'idle' || phase === 'inside';
  const current = destination ? exhibits[destination] : null;
  const camera = destination ? cameraFor(destination) : null;

  return (
    <main className={styles.page} data-scene={focused ? destination : 'gallery'}>
      <div className={styles.shell}>
        <nav className={styles.navigation} data-return={Boolean(destination) || undefined} aria-label="页面导航">
          {destination ? (
            <button type="button" className={styles.back} onClick={backToGallery}>
              <span aria-hidden="true">←</span> 返回展台
            </button>
          ) : <span className={styles.brand}>数字造物工坊</span>}
          <Link href="/" className={styles.navLink}>网站首页</Link>
        </nav>
        <section className={styles.gallery} aria-labelledby="about-gallery-title">
          <header className={styles.heading}>
            <p className={styles.eyebrow}>关于我 <span aria-hidden="true">／</span> DIGITAL WORKSHOP</p>
            <h1 id="about-gallery-title">欢迎走进 Jerry 的世界</h1>
            <p className={styles.intro}>嗨，我是 Jerry。跟我沿着楼梯逛逛吧，<br />看看我正在琢磨的 AI 点子、做过的项目，还有工作之外的日常。</p>
          </header>

          <div className={styles.stage} data-phase={phase} data-destination={destination ?? undefined}
            data-focused={focused || undefined} style={camera?.style}>
            <GalleryArt travelerRef={traveler} destination={destination} departure={journey?.from}
              focused={focused} highlighted={highlighted}
              onEnter={canExplore ? enter : undefined} onPreview={canExplore ? preview : undefined}
              onReturn={phase === 'inside' ? backToGallery : undefined} />
            <div className={styles.hotspots} role="group" aria-label="选择展厅" hidden={phase === 'opening'}>
              {exhibitIds.map(exhibit => {
                const marker = project(sites[exhibit].marker);
                return (
                  <button key={exhibit} type="button" className={styles.hotspot} data-exhibit={exhibit}
                    ref={node => { hotspots.current[exhibit] = node; }}
                    style={markerStyle(focused && camera ? camera.point(marker) : marker)}
                    aria-pressed={destination === exhibit} disabled={!canExplore}
                    data-highlighted={highlighted === exhibit || undefined}
                    onPointerEnter={event => { if (canExplore && event.pointerType !== 'touch') preview(exhibit, true); }}
                    onPointerLeave={() => preview(exhibit, false)}
                    onFocus={event => { if (event.currentTarget.matches(':focus-visible')) preview(exhibit, true); }}
                    onBlur={() => preview(exhibit, false)}
                    onClick={() => enter(exhibit)}>
                    <span className={styles.hotspotLabel}>
                      <span className={styles.dot} aria-hidden="true" />
                      <span className={styles.hotspotName}>{exhibits[exhibit].name}</span>
                      <span className={styles.arrow} aria-hidden="true">↗</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {phase === 'inside' && camera && (
              <button type="button" className={`${styles.hotspot} ${styles.arrivalButton}`}
                style={markerStyle(camera.point(arrivalMarker))} data-highlighted={highlighted === 'arrival' || undefined}
                onPointerEnter={event => { if (event.pointerType !== 'touch') preview('arrival', true); }}
                onPointerLeave={() => preview('arrival', false)}
                onFocus={event => { if (event.currentTarget.matches(':focus-visible')) preview('arrival', true); }}
                onBlur={() => preview('arrival', false)}
                onClick={backToGallery}>
                <span className={styles.hotspotLabel}>
                  <span className={styles.dot} aria-hidden="true" />
                  <span className={styles.arrivalArrow} aria-hidden="true">↶</span>
                  <span className={styles.hotspotName}>返回起点</span>
                </span>
              </button>
            )}
          </div>

          <footer className={styles.caption}>
            {phase === 'inside' && current ? (
              <div className={styles.exhibitInfo} data-room={destination}>
                <p className={styles.label}>{current.label}</p>
                <h2 ref={roomHeading} tabIndex={-1}>{current.title}</h2>
                <p>{current.description}</p>
              </div>
            ) : (
              <div role="status" className={styles.status}>
                <span className={styles.dot} aria-hidden="true" />
                {phase === 'idle' ? '点一个黄点，进去看看。' : phase === 'walking' ? `正在走向「${current?.name}」` : `已到达「${current?.name}」`}
              </div>
            )}
          </footer>
        </section>
      </div>
    </main>
  );
}
