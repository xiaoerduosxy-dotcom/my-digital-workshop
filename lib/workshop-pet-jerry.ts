import type { PetPoint } from './workshop-pet';

export const JERRY_PAT_DURATION = 3_100;
export const jerryTransferDuration = { lift: 1_450, jump: 1_320 };

const minute = 60_000;

export function chooseJerryVisit(chance: number) {
  return chance < .4 ? 'hold' : 'pat';
}

export function getJerryHoldDuration(chance: number) {
  return Math.round((5 + 5 * chance) * minute);
}

const portraitSize = { width: 1_194, height: 1_809 };
// The eye centers align the wider reaching pose to the original portrait.
const reachingPose = { width: 1_536, height: 1_024, scale: 1.52, x: -118, y: 155 };
const palm = { left: 1_100, right: 1_235, y: 542 };
const catHead = { x: .405, y: .31 };
const inset = 8;
const holdPose = { width: 384, x: 10, y: 26 };

export type JerryTransferKind = keyof typeof jerryTransferDuration;
type ArtBox = { left: number; top: number; width: number; height: number };
export type JerryHoldArt = ArtBox;
export type JerryTransferScene = {
  portrait: HTMLElement;
  portraitBox: ArtBox;
  standingFit: 'cover' | 'contain';
  standingSource: string;
  held: JerryHoldArt;
  cat: ArtBox;
  dock: PetPoint;
  landing: PetPoint;
  endScale: number;
};

export type JerryPatScene = {
  portrait: HTMLElement;
  target: PetPoint;
  mirrored: boolean;
  frame: { left: number; top: number; width: number; height: number };
  art: { left: number; top: number; width: number; height: number };
  folded: ArtBox;
};

export function isNearJerryDrop(cat: DOMRect, portrait: DOMRect, target?: PetPoint) {
  const x = cat.left + cat.width * .5;
  const y = cat.top + cat.height * .55;
  if (x >= portrait.left - cat.width * .2 && x <= portrait.right + cat.width * .5
    && y >= portrait.top - cat.height * .15 && y <= portrait.bottom + cat.height * .55) return true;

  return Boolean(target && Math.hypot(cat.left - target.x, cat.top - target.y) <= cat.width * .7);
}

export function getVisibleJerryPortrait() {
  const portrait = document.querySelector<HTMLElement>('[data-jerry-portrait]');
  const rect = portrait?.getBoundingClientRect();
  if (!portrait || !rect || !rect.width || !rect.height) return;

  const viewport = window.visualViewport;
  const top = viewport?.offsetTop ?? 0;
  const bottom = top + (viewport?.height ?? window.innerHeight);
  const visibleHeight = Math.min(rect.bottom, bottom) - Math.max(rect.top, top);
  if (visibleHeight >= Math.min(rect.height * .7, 160)) return portrait;
}

function getPortraitArt(portrait: HTMLElement, rect: DOMRect) {
  const image = portrait.querySelector('img');
  const fit = image && getComputedStyle(image).objectFit === 'cover' ? 'cover' : 'contain';
  const scale = (fit === 'cover' ? Math.max : Math.min)(rect.width / portraitSize.width, rect.height / portraitSize.height);
  return {
    left: rect.left + (rect.width - portraitSize.width * scale) / 2,
    scale,
    fit,
    source: image?.getAttribute('src') ?? '/profile.png',
  } as const;
}

function getJerryPoseArt(portrait: HTMLElement, rect: DOMRect, fitCat: boolean): ArtBox {
  const art = getPortraitArt(portrait, rect);
  const scale = art.scale * portraitSize.width / 400;
  const visibleFraction = fitCat ? .94 : .85;
  const width = fitCat ? Math.min(holdPose.width * scale, (rect.height - 2) / (1.5 * visibleFraction)) : holdPose.width * scale;
  const height = width * 1.5;
  return {
    left: art.left - rect.left + holdPose.x * scale + (holdPose.width * scale - width) * .525,
    top: Math.min(holdPose.y * scale + (holdPose.width * scale - width) * .48, rect.height - height * visibleFraction),
    width, height,
  };
}

export function getJerryHoldArt(portrait: HTMLElement, rect = portrait.getBoundingClientRect()): JerryHoldArt {
  return getJerryPoseArt(portrait, rect, true);
}

export function getJerryTransferScene(portrait: HTMLElement, cat: DOMRect, kind: JerryTransferKind): JerryTransferScene {
  const rect = portrait.getBoundingClientRect();
  const held = getJerryHoldArt(portrait, rect);
  const { fit, source } = getPortraitArt(portrait, rect);
  const viewport = window.visualViewport;
  const left = viewport?.offsetLeft ?? 0;
  const top = viewport?.offsetTop ?? 0;
  const right = left + Math.min(viewport?.width ?? Infinity, document.documentElement.clientWidth);
  const bottom = top + (viewport?.height ?? window.innerHeight);
  const landing = {
    x: rect.left + held.left + held.width * .7,
    y: rect.top + held.top + held.height * .62,
  };
  const endScale = held.width * .54 / cat.width;
  const launchX = kind === 'jump' ? landing.x + cat.width * .95 : rect.left + held.left + held.width * 1.01;
  const launchY = Math.min(rect.bottom + cat.height * .2, landing.y + Math.max(42, held.height * .24));
  return {
    portrait,
    portraitBox: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    standingFit: fit,
    standingSource: source,
    held,
    cat: { left: cat.left, top: cat.top, width: cat.width, height: cat.height },
    dock: {
      x: Math.max(left + inset, Math.min(right - cat.width - 2 * inset, launchX - cat.width * .5)),
      y: Math.max(top + inset, Math.min(bottom - cat.height - 2 * inset, launchY - cat.height * .55)),
    },
    landing,
    endScale,
  };
}

export function getJerryPatScene(cat: DOMRect): JerryPatScene | undefined {
  const portrait = document.querySelector<HTMLElement>('[data-jerry-portrait]');
  const image = portrait?.querySelector('img');
  if (!portrait || !image || !image.complete || !image.naturalWidth || !cat.width) return;

  const rect = portrait.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const viewport = window.visualViewport;
  const viewportLeft = viewport?.offsetLeft ?? 0;
  const viewportTop = viewport?.offsetTop ?? 0;
  const viewportRight = viewportLeft + Math.min(viewport?.width ?? Infinity, document.documentElement.clientWidth);
  const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
  const { left: portraitLeft, scale: portraitScale } = getPortraitArt(portrait, rect);
  const poseScale = portraitScale * reachingPose.scale;
  const artLeft = portraitLeft + reachingPose.x * portraitScale;
  const artTop = rect.top + reachingPose.y * portraitScale;
  const handY = artTop + palm.y * poseScale;
  const frameLeft = Math.max(viewportLeft, rect.left);
  const frameTop = Math.max(viewportTop, rect.top);
  const frameBottom = Math.min(viewportBottom, rect.bottom);
  if (handY < frameTop + inset || handY > frameBottom - inset) return;

  const palmLeft = artLeft + palm.left * poseScale;
  const palmRight = artLeft + palm.right * poseScale;
  const middle = (palmLeft + palmRight) / 2;
  const catRight = viewportRight - inset - cat.width;
  const mirrored = middle - cat.width * catHead.x > catRight;
  const headOffset = cat.width * (mirrored ? 1 - catHead.x : catHead.x);
  const target = { x: Math.max(viewportLeft + inset, Math.min(catRight, middle - headOffset)), y: handY - cat.height * catHead.y };
  const headX = target.x + headOffset;
  if (catRight < viewportLeft + inset || headX < palmLeft - 4 || headX > palmRight + 4
    || target.y < viewportTop + inset || target.y + cat.height > viewportBottom - inset) return;

  const width = reachingPose.width * poseScale;
  const height = reachingPose.height * poseScale;
  const frameRight = Math.min(viewportRight, Math.max(rect.right, artLeft + width));
  const folded = getJerryPoseArt(portrait, rect, false);
  return {
    portrait, target, mirrored,
    frame: { left: frameLeft, top: frameTop, width: frameRight - frameLeft, height: frameBottom - frameTop },
    art: { left: artLeft - frameLeft, top: artTop - frameTop, width, height },
    folded: { ...folded, left: folded.left + rect.left - frameLeft, top: folded.top + rect.top - frameTop },
  };
}
