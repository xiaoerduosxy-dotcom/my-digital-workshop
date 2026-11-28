'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { getPetDestination, keepPetInBounds, type PetFacing, type PetMotion, type PetPoint } from '@/lib/workshop-pet';

const edge = 8;
const speed = { walk: 115, run: 245, climb: 83 };

type Drag = { pointerId: number; pointer: PetPoint; origin: PetPoint; moved: boolean };
type Movement = { pose: PetMotion; facing: PetFacing };
export type PetMoveDestination = { point: PetPoint; onArrival: () => void };

function getStage(anchor: HTMLElement) {
  const rect = anchor.getBoundingClientRect();
  const viewport = window.visualViewport;
  const left = (viewport?.offsetLeft ?? 0) + edge;
  const top = (viewport?.offsetTop ?? 0) + edge;
  const width = Math.min(viewport?.width ?? Infinity, document.documentElement.clientWidth);
  const height = viewport?.height ?? document.documentElement.clientHeight;

  return {
    origin: { x: rect.left, y: rect.top },
    bounds: {
      left,
      top,
      right: Math.max(left, left + width - rect.width - 2 * edge),
      bottom: Math.max(top, Math.min(rect.top, top + height - rect.height - 2 * edge)),
    },
  };
}

function screenPoint(element: HTMLElement): PetPoint {
  const rect = element.getBoundingClientRect();
  return { x: rect.left, y: rect.top };
}

function translation(point: PetPoint, origin: PetPoint) {
  return `translate(${point.x - origin.x}px, ${point.y - origin.y}px)`;
}

export default function useWorkshopPetMotion(visible: boolean, chatPage: boolean, onSettled: (facing: PetFacing) => void) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const actorRef = useRef<HTMLDivElement>(null);
  const offset = useRef<PetPoint>({ x: 0, y: 0 });
  const animation = useRef<Animation>(null);
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const [grab, setGrab] = useState<'pressed' | 'dragging'>();
  const [movement, setMovement] = useState<Movement>();

  const cancelDrag = useCallback(() => {
    drag.current = null;
    suppressClick.current = false;
    setGrab(undefined);
  }, []);

  const place = useCallback((target: PetPoint) => {
    const anchor = anchorRef.current;
    const actor = actorRef.current;
    if (!anchor || !actor) return;

    const stage = getStage(anchor);
    const point = keepPetInBounds(target, stage.bounds);
    offset.current = { x: point.x - stage.origin.x, y: point.y - stage.origin.y };
    actor.style.transform = translation(point, stage.origin);
  }, []);

  const stopMoving = useCallback(() => {
    const current = animation.current;
    const actor = actorRef.current;
    if (!current || !actor) return;

    const point = screenPoint(actor);
    animation.current = null;
    current.cancel();
    place(point);
    setMovement(undefined);
  }, [place]);

  const startMoving = useCallback((pose: PetMotion, destination?: PetMoveDestination) => {
    const anchor = anchorRef.current;
    const actor = actorRef.current;
    if (!anchor || !actor || animation.current || drag.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

    const stage = getStage(anchor);
    const start = screenPoint(actor);
    const end = destination ? keepPetInBounds(destination.point, stage.bounds) : getPetDestination(pose, start, stage.bounds, Math.random());
    if (destination && Math.hypot(end.x - destination.point.x, end.y - destination.point.y) > 4) return false;

    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    if (distance < 12) {
      if (!destination) return false;
      place(end);
      destination.onArrival();
      return true;
    }

    const current = actor.animate([
      { transform: translation(start, stage.origin) },
      { transform: translation(end, stage.origin) },
    ], { duration: Math.max(640, (distance / speed[pose]) * 1_000), easing: 'ease-in-out', fill: 'forwards' });

    const facing = end.x < start.x ? 'left' : 'right';
    animation.current = current;
    setMovement({ pose, facing });
    current.onfinish = () => {
      if (animation.current !== current) return;
      animation.current = null;
      place(end);
      current.cancel();
      setMovement(undefined);
      onSettled(facing);
      destination?.onArrival();
    };
    return true;
  }, [onSettled, place]);

  useEffect(() => {
    if (!visible) return;

    function fitViewport() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      stopMoving();
      const { origin } = getStage(anchor);
      place({ x: origin.x + offset.current.x, y: origin.y + offset.current.y });
    }

    function pauseInBackground() {
      if (!document.hidden) return;
      stopMoving();
      cancelDrag();
    }

    const frame = window.requestAnimationFrame(fitViewport);
    const viewport = window.visualViewport;
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    window.addEventListener('resize', fitViewport);
    viewport?.addEventListener('resize', fitViewport);
    document.addEventListener('visibilitychange', pauseInBackground);
    motionPreference.addEventListener('change', stopMoving);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', fitViewport);
      viewport?.removeEventListener('resize', fitViewport);
      document.removeEventListener('visibilitychange', pauseInBackground);
      motionPreference.removeEventListener('change', stopMoving);
    };
  }, [cancelDrag, chatPage, place, stopMoving, visible]);

  useEffect(() => () => animation.current?.cancel(), []);

  function startDrag(event: PointerEvent<HTMLButtonElement>) {
    const actor = actorRef.current;
    if (!actor || !event.isPrimary || event.button !== 0) return;

    stopMoving();
    suppressClick.current = false;
    drag.current = {
      pointerId: event.pointerId,
      pointer: { x: event.clientX, y: event.clientY },
      origin: screenPoint(actor),
      moved: false,
    };
    setGrab('pressed');
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function dragTo(event: PointerEvent<HTMLButtonElement>) {
    const hold = drag.current;
    if (!hold || hold.pointerId !== event.pointerId) return false;

    const dx = event.clientX - hold.pointer.x;
    const dy = event.clientY - hold.pointer.y;
    if (!hold.moved && Math.hypot(dx, dy) < 6) return false;

    const firstMove = !hold.moved;
    if (firstMove) {
      hold.moved = true;
      setGrab('dragging');
    }
    place({ x: hold.origin.x + dx, y: hold.origin.y + dy });
    return firstMove;
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>) {
    const hold = drag.current;
    if (!hold || hold.pointerId !== event.pointerId) return false;
    if (event.type === 'pointerup') dragTo(event);
    suppressClick.current = hold.moved;
    drag.current = null;
    setGrab(undefined);
    return hold.moved;
  }

  function wasDragClick(detail: number) {
    const prevented = suppressClick.current && detail !== 0;
    suppressClick.current = false;
    return prevented;
  }

  return { anchorRef, actorRef, movement, grab, place, startMoving, stopMoving, startDrag, dragTo, endDrag, cancelDrag, wasDragClick };
}
