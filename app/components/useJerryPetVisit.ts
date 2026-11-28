'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import {
  chooseJerryVisit, getJerryHoldDuration, getJerryPatScene, getJerryTransferScene, getVisibleJerryPortrait,
  isNearJerryDrop, JERRY_PAT_DURATION, jerryTransferDuration, type JerryPatScene, type JerryTransferKind, type JerryTransferScene,
} from '@/lib/workshop-pet-jerry';
import type { PetFacing, PetMotion, PetPoint } from '@/lib/workshop-pet';
import type { PetMoveDestination } from './useWorkshopPetMotion';

const preferenceKey = 'workshop-pet-jerry-pats';
const visitInterval = 35_000;

type StartMoving = (pose: PetMotion, destination?: PetMoveDestination) => boolean;
type JerryHold = { portrait: HTMLElement; pathname: string; expiresAt: number };
type Transfer = { scene: JerryTransferScene; kind: JerryTransferKind; pathname: string };

type Options = {
  pathname: string;
  actor: RefObject<HTMLDivElement | null>;
  startMoving: StartMoving;
  place: (point: PetPoint) => void;
  patSource: string;
  holdSource: string;
  onVisit: (facing: PetFacing) => void;
};

function readPreference() {
  try {
    return localStorage.getItem(preferenceKey) !== 'off';
  } catch {
    return true;
  }
}

export default function useJerryPetVisit({ pathname, actor, startMoving, place, patSource, holdSource, onVisit }: Options) {
  const [enabled, setEnabled] = useState(false);
  const [pat, setPat] = useState<{ scene: JerryPatScene; pathname: string }>();
  const [hold, setHold] = useState<JerryHold>();
  const [transfer, setTransfer] = useState<Transfer>();
  const allowVisit = useRef(false);
  const lastVisitAt = useRef(0);
  const patArt = useRef<HTMLImageElement>(null);
  const holdArt = useRef<HTMLImageElement>(null);
  const activeScene = pat?.pathname === pathname ? pat.scene : undefined;
  const activeHold = hold?.pathname === pathname ? hold : undefined;
  const activeTransfer = transfer?.pathname === pathname ? transfer : undefined;
  const cancelPat = useCallback(() => setPat(undefined), []);
  const putDown = useCallback(() => {
    setTransfer(undefined);
    setHold(undefined);
  }, []);

  const applyPreference = useCallback((value: boolean) => {
    allowVisit.current = value;
    setEnabled(value);
    if (!value) cancelPat();
  }, [cancelPat]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => applyPreference(readPreference()));
    function sync(event: StorageEvent) {
      if (event.key === preferenceKey || event.key === null) applyPreference(readPreference());
    }

    window.addEventListener('storage', sync);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('storage', sync);
    };
  }, [applyPreference]);

  useEffect(() => {
    if (!holdArt.current) {
      const image = new window.Image();
      image.src = holdSource;
      holdArt.current = image;
    }
    if (enabled && !patArt.current) {
      const image = new window.Image();
      image.src = patSource;
      patArt.current = image;
    }
  }, [enabled, holdSource, patSource]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      cancelPat();
      putDown();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [cancelPat, pathname, putDown]);

  useEffect(() => {
    if (!activeHold) return;
    const { expiresAt } = activeHold;
    let timeout = window.setTimeout(expire, Math.max(0, expiresAt - Date.now()));

    function expire() {
      window.clearTimeout(timeout);
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        setHold(current => current === activeHold ? undefined : current);
      } else {
        timeout = window.setTimeout(expire, remaining);
      }
    }

    document.addEventListener('visibilitychange', expire);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener('visibilitychange', expire);
    };
  }, [activeHold]);

  useLayoutEffect(() => {
    if (!activeScene) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const timeout = window.setTimeout(cancelPat, JERRY_PAT_DURATION);
      return () => window.clearTimeout(timeout);
    }
    const original = activeScene.portrait.animate([
      { opacity: 1, offset: 0 },
      { opacity: 0, offset: .18 },
      { opacity: 0, offset: .9 },
      { opacity: 1, offset: 1 },
    ], { duration: JERRY_PAT_DURATION });
    const timeout = window.setTimeout(cancelPat, JERRY_PAT_DURATION);
    window.addEventListener('scroll', cancelPat, true);
    window.addEventListener('resize', cancelPat);
    document.addEventListener('visibilitychange', cancelPat);
    return () => {
      original.cancel();
      window.clearTimeout(timeout);
      window.removeEventListener('scroll', cancelPat, true);
      window.removeEventListener('resize', cancelPat);
      document.removeEventListener('visibilitychange', cancelPat);
    };
  }, [activeScene, cancelPat]);

  const beginHold = useCallback((portrait: HTMLElement) => {
    const now = Date.now();
    lastVisitAt.current = now;
    onVisit('left');
    setHold({ portrait, pathname, expiresAt: now + getJerryHoldDuration(Math.random()) });
  }, [onVisit, pathname]);

  useLayoutEffect(() => {
    if (!activeTransfer) return;
    const { portrait } = activeTransfer.scene;
    const duration = jerryTransferDuration[activeTransfer.kind];
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let pending = true;
    portrait.setAttribute('data-jerry-transferring', '');

    function finish() {
      if (!pending) return;
      pending = false;
      setTransfer(undefined);
      if (getVisibleJerryPortrait() === portrait) beginHold(portrait);
    }

    const timer = window.setTimeout(finish, duration);
    window.addEventListener('scroll', finish, true);
    window.addEventListener('resize', finish);
    window.visualViewport?.addEventListener('resize', finish);
    document.addEventListener('visibilitychange', finish);
    motionPreference.addEventListener('change', finish);
    return () => {
      pending = false;
      portrait.removeAttribute('data-jerry-transferring');
      window.clearTimeout(timer);
      window.removeEventListener('scroll', finish, true);
      window.removeEventListener('resize', finish);
      window.visualViewport?.removeEventListener('resize', finish);
      document.removeEventListener('visibilitychange', finish);
      motionPreference.removeEventListener('change', finish);
    };
  }, [activeTransfer, beginHold]);

  const beginTransfer = useCallback((portrait: HTMLElement, kind: JerryTransferKind) => {
    const cat = actor.current;
    if (!cat || getVisibleJerryPortrait() !== portrait) return;
    lastVisitAt.current = Date.now();
    cancelPat();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      beginHold(portrait);
    } else {
      setTransfer({ scene: getJerryTransferScene(portrait, cat.getBoundingClientRect(), kind), kind, pathname });
    }
  }, [actor, beginHold, cancelPat, pathname]);

  const holdNow = useCallback((kind: JerryTransferKind) => {
    const portrait = getVisibleJerryPortrait();
    const cat = actor.current;
    if (!portrait || !cat) return false;

    const start = cat.getBoundingClientRect();
    const { dock } = getJerryTransferScene(portrait, start, kind);
    const nearHands = Math.abs(start.left - dock.x) < start.width * .22 && Math.abs(start.top - dock.y) < start.height * .2;
    if (!nearHands && startMoving('run', { point: dock, onArrival: () => beginTransfer(portrait, kind) })) return true;

    if (!nearHands) place(dock);
    beginTransfer(portrait, kind);
    return true;
  }, [actor, beginTransfer, place, startMoving]);

  const tryVisit = useCallback((drop?: { sleeping: boolean }) => {
    const cat = actor.current;
    if (!cat || !allowVisit.current || document.hidden) return false;
    if (!drop && Date.now() - lastVisitAt.current < visitInterval) return false;

    const start = cat.getBoundingClientRect();
    const scene = getJerryPatScene(start);
    const visiblePortrait = drop ? getVisibleJerryPortrait() : scene?.portrait;
    if (!visiblePortrait) return false;
    if (drop && !isNearJerryDrop(start, visiblePortrait.getBoundingClientRect(), scene?.target)) return false;

    const canPat = Boolean(patArt.current?.complete && patArt.current.naturalWidth);
    const canHold = Boolean(holdArt.current?.complete && holdArt.current.naturalWidth);

    if (drop && canHold && (drop.sleeping || !scene || !canPat || chooseJerryVisit(Math.random()) === 'hold')) {
      return holdNow(!drop.sleeping && Math.random() < .5 ? 'jump' : 'lift');
    }
    if (!scene || !canPat) return false;
    const { portrait } = scene;

    function resolveScene() {
      if (!cat || !allowVisit.current || !portrait.isConnected || document.hidden) return;
      const current = getJerryPatScene(cat.getBoundingClientRect());
      if (current?.portrait === portrait) return current;
    }

    function arrive() {
      const current = resolveScene();
      if (!current || !cat) return;
      const rect = cat.getBoundingClientRect();
      if (Math.hypot(rect.left - current.target.x, rect.top - current.target.y) > 12) return;

      if (!drop && chooseJerryVisit(Math.random()) === 'hold' && canHold && getVisibleJerryPortrait() === current.portrait) {
        holdNow(Math.random() < .5 ? 'jump' : 'lift');
        return;
      }
      lastVisitAt.current = Date.now();
      onVisit(current.mirrored ? 'right' : 'left');
      setPat({ scene: current, pathname });
    }

    if (drop) {
      const motion = Math.abs(start.top - scene.target.y) > 55 ? 'climb' : 'walk';
      return startMoving(motion, { point: scene.target, onArrival: arrive }) || (canHold && holdNow('lift'));
    }

    if (Math.abs(start.top - scene.target.y) <= 30) return startMoving('run', { point: scene.target, onArrival: arrive });

    return startMoving('run', {
      point: { x: scene.target.x, y: start.top },
      onArrival: () => {
        const current = resolveScene();
        if (current) startMoving('climb', { point: current.target, onArrival: arrive });
      },
    });
  }, [actor, holdNow, onVisit, pathname, startMoving]);

  function changePreference(value: boolean) {
    applyPreference(value);
    try {
      localStorage.setItem(preferenceKey, value ? 'on' : 'off');
    } catch {
      // The setting still applies during this visit.
    }
  }

  return { enabled, activeScene, activeHold, activeTransfer, tryVisit, cancelPat, changePreference, holdNow, putDown };
}
