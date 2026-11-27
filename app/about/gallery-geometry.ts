export type Point = readonly [number, number];
export type Point3 = readonly [number, number, number];
export type Exhibit = 'design' | 'ai' | 'garden' | 'archive';
export type GalleryRegion = Exhibit | 'arrival';
export type Floor = { x: number; y: number; z: number; width: number; length: number };
type Building = Floor & { height: number };

export const galleryView = { width: 860, height: 650 };
const galleryOrigin: Point = [424, 270];

// Parallel orthographic axes keep the raised paths aligned with their landings.
export function project([x, y, z]: Point3, origin = galleryOrigin): Point {
  return [origin[0] + (x - y) * 1.05, origin[1] + (x + y) * .51 - z];
}

export function polygon(points: readonly Point3[], origin?: Point) {
  return points.map(point => project(point, origin).join(',')).join(' ');
}

export function line(points: readonly Point[]) {
  return points.map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join(' ');
}

export const arrival: Floor = { x: 0, y: 208, z: 34, width: 126, length: 121 };
export const startPoint: Point3 = [74, 277, arrival.z];

export const sites: Record<Exhibit, { terrace: Floor; building: Building; marker: Point3 }> = {
  design: {
    terrace: { x: 179, y: 218, z: 75, width: 124, length: 98 },
    building: { x: 237, y: 228, z: 75, width: 48, length: 44, height: 71 },
    marker: [273, 300, 75],
  },
  ai: {
    terrace: { x: 191, y: 75, z: 135, width: 112, length: 89 },
    building: { x: 243, y: 82, z: 135, width: 48, length: 42, height: 83 },
    marker: [301, 145, 135],
  },
  garden: {
    terrace: { x: 4, y: 74, z: 80, width: 81, length: 90 },
    building: { x: 32, y: 80, z: 80, width: 42, length: 42, height: 57 },
    marker: [20, 150, 80],
  },
  archive: {
    terrace: { x: 54, y: 65, z: 205, width: 95, length: 99 },
    building: { x: 92, y: 73, z: 205, width: 40, length: 41, height: 68 },
    marker: [135, 150, 205],
  },
};

export type Stair = {
  axis: 'x' | 'y'; from: number; to: number; across: number; width: number;
  low: number; high: number; steps: number;
};

export const stairs = {
  design: { axis: 'x', from: 126, to: 179, across: 248, width: 42, low: arrival.z, high: sites.design.terrace.z, steps: 10 },
  ai: { axis: 'y', from: 218, to: 164, across: 201, width: 44, low: sites.design.terrace.z, high: sites.ai.terrace.z, steps: 12 },
  garden: { axis: 'y', from: 208, to: 164, across: 39, width: 38, low: arrival.z, high: sites.garden.terrace.z, steps: 9 },
  archive: { axis: 'x', from: 191, to: 149, across: 119, width: 44, low: sites.ai.terrace.z, high: sites.archive.terrace.z, steps: 12 },
} satisfies Record<Exhibit, Stair>;

export function stairPoint(stair: Stair, along: number, across: number, z: number): Point3 {
  return stair.axis === 'x' ? [along, across, z] : [across, along, z];
}

export function treads(stair: Stair) {
  const run = (stair.to - stair.from) / stair.steps;
  const rise = (stair.high - stair.low) / stair.steps;
  return Array.from({ length: stair.steps }, (_, i) => {
    const from = stair.from + i * run;
    const to = stair.from + (i + 1) * run;
    const z = stair.low + (i + 1) * rise;
    const [x, y] = stairPoint(stair, Math.min(from, to), stair.across, z);
    const width = stair.axis === 'x' ? Math.abs(run) : stair.width;
    const length = stair.axis === 'y' ? Math.abs(run) : stair.width;
    return { from, to, x, y, z, width, length, rise };
  });
}

function stairRoute(stair: Stair) {
  const center = stair.across + stair.width / 2;
  return [
    stairPoint(stair, stair.from, center, stair.low),
    ...treads(stair).flatMap(({ from, to, z }) => [
      stairPoint(stair, from, center, z), stairPoint(stair, to, center, z),
    ]),
  ];
}

function doorstep(exhibit: Exhibit): Point3 {
  const { x, y, width, length, z } = sites[exhibit].building;
  return [x + width / 2, y + length + 6, z];
}

const entranceRoute: Point3[] = [startPoint, [74, 257, arrival.z]];
const designLanding: Point3[] = [...entranceRoute, ...stairRoute(stairs.design), [223, 269, 75]];
const aiLanding: Point3[] = [...designLanding, ...stairRoute(stairs.ai), [223, 141, 135]];
const routes: Record<Exhibit, Point3[]> = {
  design: [...designLanding, [223, 286, 75], [261, 286, 75], doorstep('design')],
  ai: [...aiLanding, [267, 141, 135], doorstep('ai')],
  garden: [...entranceRoute, ...stairRoute(stairs.garden), [58, 142, 80], [53, 142, 80], doorstep('garden')],
  archive: [...aiLanding, ...stairRoute(stairs.archive), [112, 141, 205], doorstep('archive')],
};

export const exhibitIds = ['design', 'ai', 'garden', 'archive'] as const;

export function galleryRoute3D(exhibit: Exhibit, from?: Exhibit) {
  const target = routes[exhibit];
  if (!from) return target;

  const origin = routes[from];
  let shared = 0;
  while (shared < origin.length && shared < target.length
    && origin[shared].every((coordinate, axis) => coordinate === target[shared][axis])) {
    shared += 1;
  }
  // Walk back to the shared landing, then follow the branch to the next exhibit.
  return [...origin.slice(shared - 1).reverse(), ...target.slice(shared)];
}

export function galleryRoute(exhibit: Exhibit, from?: Exhibit) {
  return galleryRoute3D(exhibit, from).map(point => project(point));
}

export function galleryFocus(exhibit: Exhibit): Point {
  const { x, y, z, width, length, height } = sites[exhibit].building;
  return project([x + width / 2, y + length * .7, z + height * .38]);
}
