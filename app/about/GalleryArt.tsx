import type { Ref } from 'react';
import { arrival, exhibitIds, galleryRoute, galleryView, line, polygon, project, sites, stairPoint, stairs, startPoint, treads, type Exhibit, type Floor, type GalleryRegion, type Point, type Point3, type Stair } from './gallery-geometry';
import styles from './gallery.module.css';

const VIEWBOX = `0 0 ${galleryView.width} ${galleryView.height}`;
const PALETTE = {
  step: ['#fdf8eb', '#c2b7db', '#9aaed2'],
  entrance: ['#fffaf0', '#d9b8cf', '#a8afda'],
  design: ['#fff4e9', '#d1b0d3', '#9babd1'],
  ai: ['#eef6f6', '#b5bedf', '#86abc7'],
  garden: ['#d9f1ed', '#afd9d8', '#92bfcf'],
} as const;
type Colors = readonly [string, string, string];

function Face({ points, color, origin, className }: { points: readonly Point3[]; color: string; origin?: Point; className?: string }) {
  return <polygon points={polygon(points, origin)} fill={color} className={className} />;
}

function Block({ x, y, z, width, length, thickness, colors, origin }: {
  x: number; y: number; z: number; width: number; length: number; thickness: number; colors: Colors; origin?: Point;
}) {
  const a = x + width;
  const b = y + length;
  const floor = z - thickness;
  return (
    <g>
      <Face origin={origin} color={colors[1]} points={[[x,b,z],[a,b,z],[a,b,floor],[x,b,floor]]} />
      <Face origin={origin} color={colors[2]} points={[[a,y,z],[a,b,z],[a,b,floor],[a,y,floor]]} />
      <Face origin={origin} color={colors[0]} points={[[x,y,z],[a,y,z],[a,b,z],[x,b,z]]} />
    </g>
  );
}

function FloorGrid({ x, y, z, width, length, origin }: {
  x: number; y: number; z: number; width: number; length: number; origin?: Point;
}) {
  const horizontal = Array.from({ length: 7 }, (_, i) => {
    const gy = y + 5 + (length - 10) * i / 6;
    return line([project([x + 5, gy, z], origin), project([x + width - 5, gy, z], origin)]);
  });
  const vertical = Array.from({ length: 7 }, (_, i) => {
    const gx = x + 5 + (width - 10) * i / 6;
    return line([project([gx, y + 5, z], origin), project([gx, y + length - 5, z], origin)]);
  });
  return <path d={[...horizontal, ...vertical].join(' ')} fill="none" stroke="#b8abd0" strokeWidth=".75" opacity=".62" />;
}

function TerraceTrim({ x, y, z, width, length, origin }: {
  x: number; y: number; z: number; width: number; length: number; origin?: Point;
}) {
  const a = x + width;
  const b = y + length;
  const edge = (height: number) => line(([[a, y, height], [a, b, height], [x, b, height]] as const)
    .map(point => project(point, origin)));
  return (
    <g fill="none">
      <path d={edge(z - 2)} stroke="#fef4ef" strokeWidth="1.4" opacity=".8" />
      <path d={edge(z - 5)} stroke="#a9a4c7" strokeWidth=".65" opacity=".65" />
    </g>
  );
}

// Local coordinates on the front (constant-depth) face, so arches stay vertical.
function front(x: number, y: number, origin?: Point) {
  return (dx: number, z: number) => project([x + dx, y, z], origin).join(' ');
}

function arch(x: number, y: number, z: number, width: number, height: number, origin?: Point) {
  const p = front(x, y, origin);
  const spring = z + height - width / 2;
  const top = z + height;
  return `M${p(0,z)} L${p(0,spring)} C${p(0,top)} ${p(width,top)} ${p(width,spring)} L${p(width,z)} Z`;
}

function Dome({ x, y, z, width }: { x: number; y: number; z: number; width: number }) {
  const top = project([x, y, z]);
  return (
    <g transform={`translate(${top.join(' ')}) scale(${width / 62})`}>
      <path d="M-35 9C-33-9-19-24 0-34 19-28 33-11 35 8 20 17 5 20 0 22-16 20-28 14-35 9Z" fill="url(#gallery-roof)" />
      <path d="M0-34C-14-21-22-3-20 15l-12-5C-32-9-18-26 0-34Zm0 0C15-19 22-2 21 16l-13 4C12 2 8-21 0-34Z" fill="#ffe8b0" opacity=".67" />
      <path d="M-35 9C-16 17-7 20 0 22 17 17 29 11 35 8v6C24 21 11 26 0 28-15 25-28 20-35 15Z" fill="#f6d7bb" />
      <path d="m0-45 3 5-3 6-3-6Z" fill="#dd9ca5" />
    </g>
  );
}

// The first cell holds the three-quarter standing pose, followed by eight walking frames.
export const travelerFrame = { width: 256, height: 448, columns: 3, rows: 3 } as const;

function Traveler() {
  const { width, height, columns, rows } = travelerFrame;
  return (
    <>
      <ellipse rx="17" ry="4.5" fill="#4d5f85" opacity=".24" />
      <g className={styles.figure}>
        <svg x="-30" y="-103" width="60" height="105" viewBox={`0 0 ${width} ${height}`} overflow="hidden">
          <image className={styles.travelFrames} href="/gallery-traveler-atlas.webp" width={width * columns} height={height * rows} />
        </svg>
      </g>
    </>
  );
}

const hallColors: Record<Exhibit, Colors> = {
  design: PALETTE.design,
  ai: PALETTE.ai,
  garden: PALETTE.garden,
  archive: PALETTE.entrance,
};

function Stairs({ stair }: { stair: Stair }) {
  const upperEdge = (across: number) => [
    stairPoint(stair, stair.from, across, stair.low),
    stairPoint(stair, stair.to, across, stair.high),
    stairPoint(stair, stair.to, across, stair.high - 11),
    stairPoint(stair, stair.from, across, stair.low - 11),
  ];
  const steps = treads(stair).sort((a, b) => a.x + a.y - b.x - b.y);
  return (
    <g className={styles.scenery}>
      <Face points={upperEdge(stair.across)} color="#aca9cc" />
      <Face points={upperEdge(stair.across + stair.width)} color={PALETTE.step[2]} />
      {steps.map(({ x, y, z, width, length, rise }, i) => (
        <Block key={i} x={x} y={y} z={z} width={width} length={length} thickness={rise + 2}
          colors={i % 2 ? PALETTE.step : ['#f3edf6', '#d4c4e2', '#abbbdb']} />
      ))}
    </g>
  );
}

function Terrace({ floor, colors }: { floor: Floor; colors: Colors }) {
  const { x, y, z, width, length } = floor;
  const faceY = y + length + .04;
  const archHeight = Math.min(65, z * .47);
  const arcadeCount = width > 105 ? 3 : 2;
  const bay = width / (arcadeCount + 1);
  return (
    <>
      <Block {...floor} thickness={z} colors={colors} />
      <FloorGrid {...floor} />
      <TerraceTrim {...floor} />
      <g>
        {Array.from({ length: arcadeCount }, (_, index) => {
          const center = x + bay * (index + 1);
          const bottom = Math.max(3, z - archHeight - 16);
          return (
            <g key={index}>
              <path d={arch(center - 8, faceY, bottom, 16, archHeight)} fill="#f8eee9" opacity=".57" />
              <path d={arch(center - 6, faceY, bottom, 12, archHeight - 3)} fill="#777fa6" opacity=".52" />
            </g>
          );
        })}
      </g>
      <g opacity=".42">
        {[.27, .63].map(ratio => {
          const depth = y + length * ratio;
          return <Face key={ratio} color="#f2e5ed"
            points={[[x+width+.04, depth,z*.36],[x+width+.04,depth+7,z*.36],[x+width+.04,depth+7,z*.36+2],[x+width+.04,depth,z*.36+2]]} />;
        })}
      </g>
    </>
  );
}

function Rail({ x, y, z, width, axis = 'x' }: {
  x: number; y: number; z: number; width: number; axis?: 'x' | 'y';
}) {
  const point = (offset: number, height: number) => project(axis === 'x' ? [x + offset, y, height] : [x, y + offset, height]);
  const parts = [line([point(0, z + 11), point(width, z + 11)])];
  for (let offset = 0; offset <= width; offset += width / 4) {
    parts.push(line([point(offset, z), point(offset, z + 11)]));
  }
  return <path d={parts.join(' ')} fill="none" stroke="#fff7ec" strokeWidth="2.1" strokeLinecap="round" />;
}

function Planter({ x, y, z, scale = 1 }: { x: number; y: number; z: number; scale?: number }) {
  const base = project([x, y, z]);
  return (
    <g transform={`translate(${base.join(' ')}) scale(${scale})`}>
      <ellipse rx="14" ry="5" fill="#7a87a7" opacity=".22" />
      <path d="M-8-8H8L5 0H-5Z" fill="#baafcd" />
      <path d="M0-6C-11-10-12-28-4-29C-2-37 7-37 9-25C14-21 12-12 4-8Z" fill="#a4cac5" />
      <path d="M1-8Q0-20 4-29M1-19l-6-4" fill="none" stroke="#e2eee2" strokeWidth="1" />
    </g>
  );
}

function Roof({ exhibit, x, y, z, width, length, height }: Floor & { exhibit: Exhibit; height: number }) {
  const top = z + height;
  if (exhibit === 'archive') {
    return (
      <>
        <Block x={x-4} y={y-4} z={top+5} width={width+8} length={length+8} thickness={5} colors={PALETTE.step} />
        <Block x={x+3} y={y+3} z={top+12} width={width-6} length={length-6} thickness={7} colors={PALETTE.entrance} />
        <Block x={x+10} y={y+10} z={top+20} width={width-20} length={length-20} thickness={8} colors={PALETTE.design} />
        <Dome x={x+width/2} y={y+length/2} z={top+26} width={24} />
      </>
    );
  }

  if (exhibit === 'garden') {
    const a = project([x-6, y+length+1, top]);
    const b = project([x+width/2, y+length/2, top+23]);
    const c = project([x+width+6, y+length+1, top]);
    const d = project([x+width+6, y-6, top]);
    return (
      <>
        <Block x={x-5} y={y-5} z={top} width={width+10} length={length+10} thickness={5} colors={PALETTE.garden} />
        <polygon points={[a, b, c].join(' ')} fill="#c3deda" />
        <polygon points={[b, d, c].join(' ')} fill="#91b9c3" />
      </>
    );
  }

  return (
    <>
      <Block x={x-4} y={y-4} z={top+6} width={width+8} length={length+8} thickness={6} colors={PALETTE.step} />
      {exhibit === 'ai' && <Block x={x+5} y={y+5} z={top+14} width={width-10} length={length-10} thickness={8} colors={PALETTE.ai} />}
      <Dome x={x+width/2} y={y+length/2} z={top+(exhibit === 'ai' ? 24 : 14)} width={width+3} />
    </>
  );
}

function Pavilion({ exhibit }: { exhibit: Exhibit }) {
  const { x, y, z, width, length, height } = sites[exhibit].building;
  const colors = hallColors[exhibit];
  const frontY = y + length + .1;
  const doorWidth = exhibit === 'archive' ? 22 : 25;
  const archX = x + (width - doorWidth) / 2;
  const doorHeight = Math.min(55, height - 12);
  const door = arch(archX, frontY, z, doorWidth, doorHeight);
  const middle = archX + doorWidth / 2;
  return (
    <>
      <Block x={x-2} y={y-2} z={z+3} width={width+4} length={length+4} thickness={3} colors={PALETTE.step} />
      <Block x={x} y={y} z={z+height} width={width} length={length} thickness={height} colors={colors} />
      {[.32, .62].map((offset, index) => {
        const sideY = y + length * offset;
        return (
          <Face key={offset} color={index ? '#c1ddea' : '#768ab0'}
            points={[[x+width+.05,sideY,z+height*.42],[x+width+.05,sideY+5,z+height*.42],[x+width+.05,sideY+5,z+height*.71],[x+width+.05,sideY,z+height*.71]]} />
        );
      })}
      <path d={arch(archX-3, frontY, z, doorWidth+6, doorHeight+4)} fill="#f9eceb" />
      <path d={door} fill="#637295" />
      <path className={styles.doorGlow} d={door} fill="#fff0ae" />
      <clipPath id={`gallery-door-${exhibit}`}><path d={door} /></clipPath>
      <g clipPath={`url(#gallery-door-${exhibit})`}>
        <Face className={styles.doorLeft} color="#b0a3c6"
          points={[[archX,frontY,z],[middle,frontY,z],[middle,frontY,z+doorHeight+1],[archX,frontY,z+doorHeight+1]]} />
        <Face className={styles.doorRight} color="#8f93ba"
          points={[[middle,frontY,z],[archX+doorWidth,frontY,z],[archX+doorWidth,frontY,z+doorHeight+1],[middle,frontY,z+doorHeight+1]]} />
      </g>
      <Face className={styles.threshold} color="#f8e5a3"
        points={[[archX,frontY,z+.1],[archX+doorWidth,frontY,z+.1],[archX+doorWidth,frontY+9,z+.1],[archX,frontY+9,z+.1]]} />
      <Roof exhibit={exhibit} {...sites[exhibit].building} />
    </>
  );
}

type PreviewRegion = (region: GalleryRegion, visible: boolean) => void;

function Hall({ exhibit, focused, highlighted, onEnter, onPreview }: {
  exhibit: Exhibit; focused: boolean; highlighted: boolean;
  onEnter?: (exhibit: Exhibit) => void; onPreview?: PreviewRegion;
}) {
  const { terrace, building } = sites[exhibit];
  const { x, y, z, width, length } = terrace;
  return (
    <g className={styles.hall} data-hall={exhibit} data-focused={focused || undefined}
      data-highlighted={highlighted || undefined} data-interactive={Boolean(onEnter) || undefined}
      onPointerEnter={event => { if (event.pointerType !== 'touch') onPreview?.(exhibit, true); }}
      onPointerLeave={() => onPreview?.(exhibit, false)}
      onClick={() => onEnter?.(exhibit)}>
      <Terrace floor={terrace} colors={hallColors[exhibit]} />
      <Rail x={x+width-26} y={y+length-4} z={z} width={21} />
      <Rail x={x+width-5} y={y+length-28} z={z} width={24} axis="y" />
      <Planter x={building.x-8} y={building.y+8} z={z} scale={exhibit === 'garden' ? 1.1 : .75} />
      {exhibit === 'garden' && <Planter x={x+13} y={y+length-26} z={z} scale={.9} />}
      <Pavilion exhibit={exhibit} />
    </g>
  );
}

function DistantCourt() {
  return (
    <g className={styles.atmosphere}>
      <circle cx="477" cy="159" r="105" fill="#fff3ce" opacity=".59" />
      <circle cx="477" cy="159" r="119" fill="none" stroke="#fffdf5" opacity=".7" />
      <path d="M-260 262Q-70 311 72 252q113-49 242-16 148 36 261-4 105-39 228-1 121 38 324 10M-130 350Q-35 341 62 322q121-26 204-3m323-34q94-40 196-26 102 14 242-7"
        fill="none" stroke="#fffaf0" strokeWidth="1.7" opacity=".62" />
      <path d="M-192 479Q-47 439 123 473m584-72q158-20 329 37"
        fill="none" stroke="#f5f4ef" strokeWidth="1.25" opacity=".35" />
      <path d="m239 134 4-8 4 8-4 8Zm404 28 3-6 3 6-3 6Zm-518 59 2-5 2 5-2 5Zm602 69 3-6 3 6-3 6Z"
        fill="#fffaf0" opacity=".9" />
      <g opacity=".37" fill="#fff9ee">
        <circle cx="169" cy="164" r="2" /><circle cx="299" cy="117" r="2" /><circle cx="384" cy="95" r="1.4" />
        <circle cx="747" cy="185" r="2.4" /><circle cx="706" cy="308" r="1.8" /><circle cx="102" cy="368" r="2" />
      </g>
      <g className={styles.distantTowers} opacity=".3">
        <Block x={-27} y={141} z={135} width={33} length={38} thickness={135} colors={PALETTE.ai} />
        <Dome x={-10} y={160} z={148} width={29} />
        <Block x={174} y={-34} z={139} width={27} length={47} thickness={139} colors={PALETTE.entrance} />
        <Dome x={188} y={-12} z={154} width={26} />
        <Block x={314} y={27} z={122} width={31} length={50} thickness={122} colors={PALETTE.ai} />
        <Block x={317} y={32} z={139} width={25} length={40} thickness={17} colors={PALETTE.step} />
        <Dome x={330} y={53} z={154} width={24} />
      </g>
    </g>
  );
}

function Lookout() {
  const x = 152;
  const y = 28;
  const z = 211;
  const height = 124;
  const span = 64;
  const colors = PALETTE.entrance;
  const facadeY = y+26;
  return (
    <>
      <Block x={x-8} y={y-5} z={z} width={span+16} length={58} thickness={z} colors={PALETTE.ai} />
      <TerraceTrim x={x-8} y={y-5} z={z} width={span+16} length={58} />
      <Block x={x} y={y} z={z+height} width={14} length={25} thickness={height} colors={colors} />
      <Block x={x+span-14} y={y} z={z+height} width={14} length={25} thickness={height} colors={colors} />
      <path d={`${arch(x,facadeY,z,span,height)} ${arch(x+12,facadeY,z-1,span-24,height-25)}`}
        fill="#e2c4d8" fillRule="evenodd" />
      <path d={`${arch(x+7,facadeY+.1,z,span-14,height-14)} ${arch(x+12,facadeY+.1,z-1,span-24,height-25)}`}
        fill="#fff2e3" fillRule="evenodd" />
      <Block x={x-4} y={y-3} z={z+height+5} width={span+8} length={31} thickness={7} colors={PALETTE.step} />
      <Block x={x+6} y={y+2} z={z+height+13} width={span-12} length={21} thickness={8} colors={colors} />
      <Dome x={x+span/2} y={y+12} z={z+height+20} width={31} />
    </>
  );
}

function CourtFloor() {
  return (
    <>
      <ellipse cx="425" cy="548" rx="348" ry="65" fill="#8598bb" opacity=".31" filter="url(#gallery-shadow)" />
      <Block x={-13} y={-4} z={0} width={343} length={353} thickness={12} colors={PALETTE.garden} />
      <Block x={74} y={166} z={6} width={111} length={72} thickness={6} colors={PALETTE.step} />
      <Block x={80} y={172} z={6.1} width={99} length={60} thickness={1} colors={['#a4cdd4', '#9bbdcd', '#91a9ca']} />
      <path d={line(([[88,182,6.2],[170,182,6.2],[170,224,6.2],[88,224,6.2],[88,182,6.2]] as const).map(p => project(p)))}
        fill="none" stroke="#e5f1ee" opacity=".75" />
      <Block x={116} y={170} z={20} width={26} length={65} thickness={6} colors={PALETTE.step} />
      <Rail x={116} y={176} z={20} width={52} axis="y" />
      <Planter x={102} y={200} z={6.1} scale={.84} />
      <Planter x={167} y={227} z={6.1} scale={.66} />
      <Planter x={303} y={322} z={0} scale={.96} />
      <Planter x={-4} y={299} z={0} scale={.85} />
      <Block x={176} y={326} z={3} width={34} length={12} thickness={3} colors={PALETTE.garden} />
      <Block x={229} y={332} z={3} width={17} length={11} thickness={3} colors={PALETTE.garden} />
    </>
  );
}

function Arrival({ highlighted, onReturn, onPreview }: {
  highlighted: boolean; onReturn?: () => void; onPreview?: PreviewRegion;
}) {
  const { x, y, z, width, length } = arrival;
  return (
    <g className={styles.arrival} data-arrival data-highlighted={highlighted || undefined}
      data-interactive={Boolean(onReturn) || undefined}
      onPointerEnter={event => { if (onReturn && event.pointerType !== 'touch') onPreview?.('arrival', true); }}
      onPointerLeave={() => onPreview?.('arrival', false)} onClick={onReturn}>
      <Terrace floor={arrival} colors={PALETTE.entrance} />
      <path d={`${arch(35,302,34,40,58)} ${arch(40,302,33,30,49)}`} fillRule="evenodd" fill="#bfacd2" />
      <path d={`${arch(35,307,34,40,58)} ${arch(40,307,33,30,49)}`} fillRule="evenodd" fill="#fff2ea" />
      <Rail x={84} y={324} z={34} width={36} />
      <Rail x={5} y={280} z={34} width={35} axis="y" />
      <Planter x={16} y={235} z={34} scale={.95} />
      <Planter x={99} y={312} z={34} scale={.74} />
      {onReturn && (
        <polygon className={styles.arrivalSurface} data-arrival-surface
          points={polygon([[x,y,z],[x+width,y,z],[x+width,y+length,z],[x,y+length,z]])} />
      )}
    </g>
  );
}

const overviewTrails = exhibitIds.map(exhibit => line(galleryRoute(exhibit))).join(' ');

export function GalleryArt({ travelerRef, destination, departure, focused, highlighted, onEnter, onPreview, onReturn }: {
  travelerRef: Ref<SVGGElement>; destination: Exhibit | null; departure?: Exhibit; focused: boolean;
  highlighted: GalleryRegion | null; onEnter?: (exhibit: Exhibit) => void;
  onPreview?: PreviewRegion; onReturn?: () => void;
}) {
  const target = focused ? destination : null;
  return (
    <svg viewBox={VIEWBOX} className={styles.art} aria-hidden="true">
      <defs>
        <linearGradient id="gallery-roof" x2=".9" y2="1"><stop stopColor="#fff0bb" /><stop offset=".54" stopColor="#f5c6ad" /><stop offset="1" stopColor="#e1a0b5" /></linearGradient>
        <filter id="gallery-shadow" x="-.3" y="-.8" width="1.6" height="2.6"><feGaussianBlur stdDeviation="12" /></filter>
        <filter id="gallery-muted" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values=".52 0 0 0 .42  0 .52 0 0 .435  0 0 .52 0 .463  0 0 0 1 0" />
        </filter>
      </defs>
      <DistantCourt />
      <g className={styles.world}>
        <g className={styles.scenery}>
          <CourtFloor />
          <Lookout />
        </g>
        {(['archive', 'garden', 'ai', 'design'] as const).map(exhibit => (
          <g key={exhibit}>
            <Hall exhibit={exhibit} focused={exhibit === target} highlighted={highlighted === exhibit}
              onEnter={onEnter} onPreview={onPreview} />
            <Stairs stair={stairs[exhibit]} />
          </g>
        ))}
        <Arrival highlighted={highlighted === 'arrival'} onReturn={onReturn} onPreview={onPreview} />
        <path d={destination ? line(galleryRoute(destination, departure)) : overviewTrails} className={styles.trail} />
        <g ref={travelerRef} data-traveler pointerEvents="none" transform={`translate(${project(startPoint).join(' ')})`}>
          <Traveler />
        </g>
      </g>
    </svg>
  );
}
