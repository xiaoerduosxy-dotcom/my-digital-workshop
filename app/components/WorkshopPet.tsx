'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  changePetPlayTime, choosePetRestPose, DEFAULT_PET_PLAY_MINUTES, getPetActivity, isPetPlayMinutes,
  MAX_PET_PLAY_MINUTES, PET_AFFINITY_LIMIT, type PetFacing, type PetRestPose, type PetRoutine,
} from '@/lib/workshop-pet';
import {
  applyPetCare, createPetBond, parsePetBond, PET_DAILY_REWARD_LIMIT, PET_SLEEP_PENALTY,
  petCareRewards, type PetBond, type PetCareAction,
} from '@/lib/workshop-pet-bond';
import { getJerryHoldArt, type JerryTransferKind } from '@/lib/workshop-pet-jerry';
import jerryHolding from '@/public/jerry-holding-cat.webp';
import jerryPetting from '@/public/jerry-petting.webp';
import catGrumpy from '@/public/workshop-pet-grumpy.webp';
import catMotion from '@/public/workshop-pet-motion.webp';
import catPoses from '@/public/workshop-pet-poses.webp';
import catResting from '@/public/workshop-pet-rests.webp';
import { JerryPatAnimation, JerryTransferAnimation, jerryMotionSource } from './JerryPetAnimation';
import useJerryPetVisit from './useJerryPetVisit';
import useWorkshopPetMotion from './useWorkshopPetMotion';
import styles from './workshop-pet.module.css';

const legacyAffinityKey = 'workshop-pet-affinity';
const bondKey = 'workshop-pet-bond';
const routineKey = 'workshop-pet-routine';
const hiddenKey = 'workshop-pet-hidden';
const nativeMenuTargets = 'a[href], button, input, textarea, select, summary, img, audio, video, canvas, [contenteditable], [role="link"], [role="button"]';
const petting = [
  { pose: 'nuzzle', note: '小猫凑过来蹭了蹭。' },
  { pose: 'roll', note: '小猫翻了个身，把肚皮露给你。' },
  { pose: 'stretch', note: '小猫舒舒服服地伸了个懒腰。' },
] as const;
const care = {
  feed: { pose: 'eat', note: '小猫正低着头嚼猫粮。' },
  play: { pose: 'play', note: '小猫伸爪去够羽毛！' },
} as const;
const wake = {
  happy: { pose: 'roll', note: '小猫开心地醒了，翻过身来让你摸。' },
  grumpy: { pose: 'grumpy', note: '小猫被摸醒后有点生气，等会儿又会睡回去。' },
} as const;
const poseDuration = { nuzzle: 1_450, roll: 2_800, stretch: 2_400, eat: 4_800, play: 2_400, grumpy: 2_900 };
const selfActions = ['walk', 'run', 'climb', 'stretch', 'walk', 'run', 'climb', 'eat'] as const;
const bondFeedback = {
  cooldown: '这项互动还在加分间隔内。',
  dailyLimit: '今天的亲密度奖励已领完。',
  full: '亲密度已满。',
  sameNap: '这一觉已经扣过分了。',
} as const;

type Reaction = { pose: keyof typeof poseDuration; note: string; sequence: number };

function readBond() {
  try {
    const saved = localStorage.getItem(bondKey);
    if (saved !== null) return parsePetBond(JSON.parse(saved));

    const olderScore = Number(localStorage.getItem(legacyAffinityKey));
    const migrated = createPetBond(Number.isInteger(olderScore) ? olderScore : 0);
    localStorage.setItem(bondKey, JSON.stringify(migrated));
    return migrated;
  } catch {
    // Keep the current visit's progress if browser storage is unavailable.
  }
}

function saveBond(bond: PetBond) {
  try {
    localStorage.setItem(bondKey, JSON.stringify(bond));
  } catch {
    // The score still updates during this visit.
  }
}

function readRoutine(now: number, fallback = { awakeSince: now, playMinutes: DEFAULT_PET_PLAY_MINUTES }): PetRoutine {
  try {
    const saved = JSON.parse(localStorage.getItem(routineKey) ?? 'null') as (Partial<PetRoutine> & { lastCareAt?: number }) | null;
    const awakeSince = saved?.awakeSince;
    if (typeof awakeSince === 'number' && awakeSince > 0 && awakeSince <= now) {
      if (isPetPlayMinutes(saved?.playMinutes)) return { awakeSince, playMinutes: saved.playMinutes };

      const lastCareAt = saved?.lastCareAt;
      const migrated = {
        awakeSince: typeof lastCareAt === 'number' && lastCareAt >= awakeSince && lastCareAt <= now ? lastCareAt : awakeSince,
        playMinutes: DEFAULT_PET_PLAY_MINUTES,
      };
      localStorage.setItem(routineKey, JSON.stringify(migrated));
      return migrated;
    }
    localStorage.setItem(routineKey, JSON.stringify(fallback));
  } catch {
    // The routine can still run for this visit.
  }
  return fallback;
}

function saveRoutine(routine: PetRoutine) {
  try {
    localStorage.setItem(routineKey, JSON.stringify(routine));
  } catch {
    // The schedule still applies during this visit.
  }
}

function readHidden() {
  try {
    return localStorage.getItem(hiddenKey) === 'true';
  } catch {
    return false;
  }
}

function PetRestoreMenu({ onRestore, chatPage }: { onRestore: () => void; chatPage: boolean }) {
  const [position, setPosition] = useState<{ x: number; y: number }>();
  const restoreItemRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function dismiss() {
      setPosition(undefined);
    }

    function openMenu(event: MouseEvent) {
      const target = event.target;
      if (event.defaultPrevented || event.shiftKey || !(target instanceof Element)
        || target.closest(nativeMenuTargets) || window.getSelection()?.isCollapsed === false) {
        dismiss();
        return;
      }

      event.preventDefault();
      const focused = document.activeElement;
      if (focused !== restoreItemRef.current) {
        previousFocus.current = focused instanceof HTMLElement ? focused : null;
      }
      setPosition({ x: event.clientX, y: event.clientY });
    }

    function dismissOutside(event: PointerEvent) {
      if (event.target !== restoreItemRef.current) dismiss();
    }

    document.addEventListener('contextmenu', openMenu);
    document.addEventListener('pointerdown', dismissOutside);
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => {
      document.removeEventListener('contextmenu', openMenu);
      document.removeEventListener('pointerdown', dismissOutside);
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
    };
  }, []);

  useEffect(() => {
    if (position) restoreItemRef.current?.focus({ preventScroll: true });
  }, [position]);

  return (
    <>
      <button type="button" className={styles.restoreShortcut} data-chat-page={chatPage} onClick={onRestore}>
        恢复宠物
      </button>
      {position && (
        <div
          className={styles.contextMenu}
          role="menu"
          aria-label="宠物"
          style={{ '--menu-x': `${position.x}px`, '--menu-y': `${position.y}px` } as CSSProperties}
        >
          <button
            ref={restoreItemRef}
            type="button"
            role="menuitem"
            onClick={onRestore}
            onBlur={() => setPosition(undefined)}
            onKeyDown={event => {
              if (event.key !== 'Escape') return;
              event.stopPropagation();
              setPosition(undefined);
              previousFocus.current?.focus({ preventScroll: true });
            }}
          >
            恢复宠物
          </button>
        </div>
      )}
    </>
  );
}

export default function WorkshopPet() {
  const id = useId();
  const pathname = usePathname();
  const router = useRouter();
  const chatPage = pathname === '/ask';
  const launcherRef = useRef<HTMLButtonElement>(null);
  const heldLauncherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const sequence = useRef(0);
  const pets = useRef(0);
  const nextSelfAction = useRef(0);
  const lastVisibleRest = useRef<PetRestPose>('rest');
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState<boolean>();
  const [bond, setBond] = useState(createPetBond);
  const [routine, setRoutine] = useState<PetRoutine>();
  const [now, setNow] = useState(0);
  const [reaction, setReaction] = useState<Reaction>();
  const [wandOut, setWandOut] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [holdRequested, setHoldRequested] = useState<JerryTransferKind>();
  const [rest, setRest] = useState<{ pose: PetRestPose; facing: PetFacing }>({ pose: 'rest', facing: 'right' });

  const chooseRest = useCallback((facing?: PetFacing) => {
    const pose = choosePetRestPose(lastVisibleRest.current, Math.random());
    setRest(previous => ({ pose, facing: facing ?? previous.facing }));
  }, []);

  const { anchorRef, actorRef, movement, grab, place, startMoving, stopMoving, startDrag, dragTo, endDrag, cancelDrag, wasDragClick } = useWorkshopPetMotion(hidden === false, chatPage, chooseRest);
  const jerryVisit = useJerryPetVisit({ pathname, actor: actorRef, startMoving, place, patSource: jerryPetting.src, holdSource: jerryHolding.src, onVisit: chooseRest });
  const { activeScene, activeHold, activeTransfer, tryVisit, cancelPat, holdNow, putDown } = jerryVisit;
  const catOffFloor = Boolean(activeHold || activeTransfer);

  const activity = routine && getPetActivity(routine, now);
  const sleeping = activity?.sleeping ?? false;
  const nextChangeAt = activity?.nextChangeAt;
  const grumpy = reaction?.pose === 'grumpy';
  const awakePose = activeScene ? 'jerry-pet' : movement?.pose ?? reaction?.pose ?? rest.pose;
  const pose = grumpy ? 'grumpy' : sleeping && !movement ? 'sleep' : awakePose;
  const resting = pose === rest.pose;
  const stillSprite = resting && pose !== 'rest' ? catResting : catPoses;
  const sprite = grumpy ? catGrumpy : movement ? catMotion : stillSprite;
  const facing = activeScene?.mirrored ? 'left' : movement?.facing ?? (resting ? rest.facing : undefined);
  const idleNote = wandOut ? '点一下羽毛，还可以继续玩。' : '小猫歇了一会儿。';
  const actionNote = sleeping && !grumpy ? '小猫在打盹。' : reaction?.note;
  const holdNote = activeHold ? '小猫在 Jerry 怀里休息。' : holdRequested ? '正在去找 Jerry。' : undefined;
  const status = holdNote ?? notice ?? actionNote ?? idleNote;

  useLayoutEffect(() => {
    if (resting && !catOffFloor) lastVisibleRest.current = rest.pose;
  }, [catOffFloor, rest, resting]);

  useEffect(() => {
    function restore() {
      const time = Date.now();
      const saved = readRoutine(time);
      const storedBond = readBond();
      if (getPetActivity(saved, time).sleeping) {
        stopMoving();
        cancelPat();
      }
      setRoutine(saved);
      setNow(time);
      if (storedBond) setBond(storedBond);
    }

    const frame = window.requestAnimationFrame(() => {
      restore();
      setHidden(readHidden());
    });
    function sync(event: StorageEvent) {
      if (event.key === routineKey || event.key === bondKey || event.key === null) restore();
      if (event.key === hiddenKey || event.key === null) {
        stopMoving();
        cancelDrag();
        cancelPat();
        putDown();
        setHoldRequested(undefined);
        setHidden(readHidden());
        setOpen(false);
        setWandOut(false);
        setReaction(undefined);
        setNow(Date.now());
      }
    }
    window.addEventListener('storage', sync);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('storage', sync);
    };
  }, [cancelDrag, cancelPat, putDown, stopMoving]);

  useEffect(() => {
    if (hidden !== false || !nextChangeAt) return;
    const updateClock = () => {
      const time = Date.now();
      const staysAsleep = routine && getPetActivity(routine, time).sleeping;
      if (staysAsleep) {
        stopMoving();
        cancelPat();
      } else if (sleeping) chooseRest();
      setNow(time);
    };
    const timer = window.setTimeout(updateClock, Math.max(0, nextChangeAt - Date.now()));
    document.addEventListener('visibilitychange', updateClock);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', updateClock);
    };
  }, [cancelPat, chooseRest, hidden, nextChangeAt, routine, sleeping, stopMoving]);

  useEffect(() => {
    if (!reaction) return;
    const timer = window.setTimeout(() => {
      setReaction(current => current?.sequence === reaction.sequence ? undefined : current);
    }, poseDuration[reaction.pose]);
    return () => window.clearTimeout(timer);
  }, [reaction]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(undefined), 3_000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (hidden !== false) return;
    new window.Image().src = catMotion.src;
    new window.Image().src = catGrumpy.src;
    new window.Image().src = catResting.src;
    new window.Image().src = jerryMotionSource;
  }, [hidden]);

  useEffect(() => {
    if (hidden !== false || !routine || sleeping || reaction || open || movement || grab || activeScene || catOffFloor || holdRequested) return;
    const currentRoutine = routine;

    let timer: number;
    function schedule() {
      window.clearTimeout(timer);
      if (document.hidden) return;

      timer = window.setTimeout(() => {
        if (document.hidden) return;
        const time = Date.now();
        if (getPetActivity(currentRoutine, time).sleeping) {
          setNow(time);
          return;
        }
        const nextAction = selfActions[nextSelfAction.current++ % selfActions.length];
        if (nextAction === 'run' && tryVisit()) return;
        if (nextAction !== 'eat' && nextAction !== 'stretch' && startMoving(nextAction)) return;

        const next: Reaction = nextAction === 'eat'
          ? { pose: 'eat', note: '小猫自己吃了几颗猫粮。', sequence: ++sequence.current }
          : { pose: 'stretch', note: '小猫自己伸了个懒腰。', sequence: ++sequence.current };
        chooseRest();
        setReaction(current => current ?? next);
      }, 4_800 + Math.random() * 3_400);
    }

    schedule();
    document.addEventListener('visibilitychange', schedule);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', schedule);
    };
  }, [activeScene, catOffFloor, chooseRest, grab, hidden, holdRequested, movement, open, reaction, routine, sleeping, startMoving, tryVisit]);

  useEffect(() => {
    if (!holdRequested || hidden !== false) return;

    let frame: number | undefined;
    let observer: MutationObserver | undefined;
    const timeout = window.setTimeout(() => {
      setHoldRequested(undefined);
      setNotice('还没找到 Jerry，可以回首页再试一次。');
    }, 8_000);

    if (pathname === '/') {
      const arrive = () => {
        if (!holdNow(holdRequested)) return;
        observer?.disconnect();
        if (frame !== undefined) window.cancelAnimationFrame(frame);
        window.clearTimeout(timeout);
        setHoldRequested(undefined);
      };

      window.scrollTo({ top: 0, behavior: 'instant' });
      observer = new MutationObserver(arrive);
      observer.observe(document.body, { childList: true, subtree: true });
      frame = window.requestAnimationFrame(arrive);
    }

    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.clearTimeout(timeout);
    };
  }, [hidden, holdNow, holdRequested, pathname]);

  useLayoutEffect(() => {
    const button = heldLauncherRef.current;
    if (!activeHold || !button) return;
    const { portrait } = activeHold;

    function fitArt() {
      if (!button) return;
      const rect = portrait.getBoundingClientRect();
      const art = getJerryHoldArt(portrait, rect);
      button.style.setProperty('--held-left', `${art.left}px`);
      button.style.setProperty('--held-top', `${art.top}px`);
      button.style.setProperty('--held-width', `${art.width}px`);
      button.style.setProperty('--held-height', `${art.height}px`);
      button.style.setProperty('--held-bottom', `${Math.min(art.height, rect.height - art.top)}px`);
    }

    fitArt();
    const observer = new ResizeObserver(fitArt);
    observer.observe(portrait);
    return () => observer.disconnect();
  }, [activeHold]);

  useLayoutEffect(() => {
    const actor = actorRef.current;
    const panel = panelRef.current;
    if (!open || !actor || !panel) return;

    function positionPanel() {
      if (!actor || !panel) return;
      const actorRect = actor.getBoundingClientRect();
      const rect = heldLauncherRef.current?.getBoundingClientRect() ?? actorRect;
      const viewport = window.visualViewport;
      const left = viewport?.offsetLeft ?? 0;
      const top = viewport?.offsetTop ?? 0;
      const right = left + Math.min(viewport?.width ?? Infinity, document.documentElement.clientWidth);
      const bottom = top + (viewport?.height ?? window.innerHeight);
      const width = panel.offsetWidth;
      const inset = 8;
      const above = rect.top - top - inset * 2;
      const below = bottom - rect.bottom - inset * 2;
      const placeAbove = above >= panel.scrollHeight + 2 || above >= below;
      const x = Math.max(left + inset, Math.min(rect.right - width, right - width - inset));

      panel.dataset.side = placeAbove ? 'above' : 'below';
      panel.style.setProperty('--panel-x', `${x - actorRect.left}px`);
      panel.style.setProperty('--panel-space', `${Math.max(0, placeAbove ? above : below)}px`);
      panel.style.setProperty('--panel-above', `${actorRect.bottom - rect.top + inset}px`);
      panel.style.setProperty('--panel-below', `${rect.bottom - actorRect.top + inset}px`);
      actor.dataset.wandSide = rect.left - left < 45 ? 'right' : 'left';
    }

    positionPanel();
    const viewport = window.visualViewport;
    window.addEventListener('resize', positionPanel);
    viewport?.addEventListener('resize', positionPanel);
    if (activeHold) window.addEventListener('scroll', positionPanel, true);
    return () => {
      window.removeEventListener('resize', positionPanel);
      viewport?.removeEventListener('resize', positionPanel);
      if (activeHold) window.removeEventListener('scroll', positionPanel, true);
    };
  }, [activeHold, actorRef, chatPage, open, rulesOpen]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus({ preventScroll: true });

    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !anchorRef.current?.contains(event.target)
        && !heldLauncherRef.current?.contains(event.target)) {
        setOpen(false);
        setWandOut(false);
      }
    }

    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [anchorRef, open]);

  function closePet() {
    setOpen(false);
    setWandOut(false);
    (heldLauncherRef.current ?? launcherRef.current)?.focus({ preventScroll: true });
  }

  function changeVisibility(hide: boolean) {
    stopMoving();
    cancelDrag();
    cancelPat();
    putDown();
    setHoldRequested(undefined);
    setHidden(hide);
    setOpen(false);
    setWandOut(false);
    setReaction(undefined);
    setNow(Date.now());

    try {
      if (hide) localStorage.setItem(hiddenKey, 'true');
      else localStorage.removeItem(hiddenKey);
    } catch {
      // The visibility setting still applies until the page is reloaded.
    }

    if (!hide) window.requestAnimationFrame(() => launcherRef.current?.focus({ preventScroll: true }));
  }

  function interact(action: PetCareAction) {
    stopMoving();
    putDown();
    setHoldRequested(undefined);
    const time = Date.now();
    const saved = readRoutine(time, routine);
    const current = getPetActivity(saved, time);
    const previousBond = readBond() ?? bond;
    const outcome = applyPetCare(previousBond, action, time, current.sleeping ? current.nextChangeAt : undefined, Math.random());
    const nextRoutine = current.sleeping && outcome.mood !== 'grumpy' ? { ...saved, awakeSince: time } : saved;
    const response = outcome.mood === 'ordinary'
      ? (action === 'pet' ? petting[pets.current++ % petting.length] : care[action])
      : wake[outcome.mood];
    const feedback = outcome.delta > 0 ? `亲密度 +${outcome.delta}。`
      : outcome.delta < 0 ? `亲密度 −${-outcome.delta}。`
      : outcome.reason ? bondFeedback[outcome.reason] : '';

    setNow(time);
    setRoutine(nextRoutine);
    setNotice(undefined);
    setBond(outcome.bond);
    if (outcome.mood !== 'grumpy') chooseRest();
    setReaction({ pose: response.pose, note: `${response.note}${feedback}`, sequence: ++sequence.current });
    setWandOut(action === 'play');

    if (outcome.bond !== previousBond) saveBond(outcome.bond);
    if (nextRoutine !== saved) saveRoutine(nextRoutine);
  }

  function toggleHold(kind: JerryTransferKind) {
    if (activeHold) {
      putDown();
      setNow(Date.now());
      return;
    }

    stopMoving();
    cancelPat();
    setReaction(undefined);
    setWandOut(false);
    setNotice(undefined);
    setOpen(false);
    if (kind === 'jump' && sleeping && routine) {
      const time = Date.now();
      const awake = { ...routine, awakeSince: time };
      saveRoutine(awake);
      setRoutine(awake);
      setNow(time);
    }
    if (holdNow(kind)) return;

    setHoldRequested(kind);
    if (pathname !== '/') router.push('/');
  }

  function updatePlayTime(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = Number(new FormData(event.currentTarget).get('playMinutes'));
    if (!isPetPlayMinutes(minutes)) return;

    const time = Date.now();
    const next = changePetPlayTime(readRoutine(time, routine), minutes, time);
    setRoutine(next);
    setNow(time);
    setNotice(`已设为活动 ${minutes} 分钟后打盹。`);
    saveRoutine(next);
  }

  if (hidden === undefined) return null;
  if (hidden) return <PetRestoreMenu chatPage={chatPage} onRestore={() => changeVisibility(false)} />;

  return (
    <div
      className={styles.root}
      data-chat-page={chatPage}
      ref={anchorRef}
      onKeyDown={event => {
        if (open && event.key === 'Escape') {
          event.stopPropagation();
          closePet();
        }
      }}
    >
      {activeHold && createPortal(
        <button
          type="button"
          ref={heldLauncherRef}
          className={styles.jerryHoldPortrait}
          data-jerry-holding
          aria-label="打开小猫互动，小猫在 Jerry 怀里"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          onClick={() => open ? closePet() : setOpen(true)}
        >
          <Image src={jerryHolding} alt="" className={styles.jerryHeldArt} loading="eager" unoptimized />
        </button>,
        activeHold.portrait,
      )}
      {activeScene && <JerryPatAnimation scene={activeScene} />}
      {activeTransfer && <JerryTransferAnimation {...activeTransfer} pose={pose} sprite={sprite.src} facing={facing} />}
      <div className={styles.actor} ref={actorRef} data-grab={grab}>
        <button
          className={styles.cat}
          ref={launcherRef}
          type="button"
          data-held={catOffFloor}
          disabled={catOffFloor}
          title="按住小猫可以拖动"
          aria-label={sleeping && !grumpy ? '打开小猫互动，小猫正在睡觉' : '打开小猫互动'}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          onDragStart={event => event.preventDefault()}
          onPointerDown={event => {
            if (event.isPrimary && event.button === 0) cancelPat();
            startDrag(event);
          }}
          onPointerMove={event => {
            if (!dragTo(event)) return;
            setOpen(false);
            setWandOut(false);
            setReaction(undefined);
          }}
          onPointerUp={event => {
            if (endDrag(event)) tryVisit({ sleeping });
          }}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
          onClick={event => {
            if (wasDragClick(event.detail)) return;
            stopMoving();
            cancelPat();
            if (open) closePet();
            else setOpen(true);
          }}
        >
          <span className={styles.shadow} aria-hidden="true" />
          <span
            key={reaction?.sequence ?? 0}
            className={styles.catFrame}
            style={{ backgroundImage: `url(${sprite.src})` }}
            data-pose={pose}
            data-facing={facing}
            aria-hidden="true"
          />
          {pose === 'sleep' && <span className={styles.dream} aria-hidden="true">z<sup>z</sup></span>}
        </button>

        {open && (
          <section className={styles.panel} id={id} role="dialog" aria-label="小猫照料" tabIndex={-1} ref={panelRef}>
            <div className={styles.bond}>
              <label htmlFor={`${id}-bond`}>亲密度 <span aria-hidden="true">{bond.score}/{PET_AFFINITY_LIMIT}</span></label>
              <progress id={`${id}-bond`} value={bond.score} max={PET_AFFINITY_LIMIT} />
            </div>
            <button type="button" className={styles.close} onClick={closePet} aria-label="收起小猫照料">×</button>

            <div className={styles.actions}>
              <button type="button" onClick={() => interact('pet')}>摸摸</button>
              <button type="button" onClick={() => interact('feed')}>喂食</button>
              <button type="button" onClick={() => interact('play')}>逗猫棒</button>
              <button type="button" onClick={() => toggleHold('lift')} disabled={Boolean(holdRequested)}>{activeHold ? '放下小猫' : '抱小猫'}</button>
              {!activeHold && <button type="button" onClick={() => toggleHold('jump')} disabled={Boolean(holdRequested)}>跳进怀里</button>}
            </div>

            <form className={styles.sleepSetting} onSubmit={updatePlayTime}>
              <label htmlFor={`${id}-play-minutes`}>活动多久后打盹</label>
              <input
                key={routine?.playMinutes}
                id={`${id}-play-minutes`}
                name="playMinutes"
                aria-describedby={`${id}-play-unit`}
                type="number"
                min={1}
                max={MAX_PET_PLAY_MINUTES}
                defaultValue={routine?.playMinutes ?? DEFAULT_PET_PLAY_MINUTES}
                inputMode="numeric"
                required
              />
              <span id={`${id}-play-unit`}>分钟</span>
              <button type="submit">保存</button>
            </form>

            <label className={styles.jerrySetting}>
              <span>Jerry 自动互动</span>
              <input type="checkbox" checked={jerryVisit.enabled} onChange={event => jerryVisit.changePreference(event.currentTarget.checked)} />
            </label>

            <div className={styles.panelFooter}>
              <p className={styles.status} role="status">{status}</p>
              <button
                type="button"
                className={styles.hide}
                title="在页面空白处右键可恢复宠物"
                onClick={() => changeVisibility(true)}
              >
                隐藏宠物
              </button>
            </div>

            <details className={styles.bondRules} open={rulesOpen} onToggle={event => setRulesOpen(event.currentTarget.open)}>
              <summary>亲密度规则</summary>
              <p>摸摸 +{petCareRewards.pet.points}（间隔 90 秒），喂食 +{petCareRewards.feed.points}（间隔 4 分钟），逗猫棒 +{petCareRewards.play.points}（间隔 2 分钟）。每天最多加 {PET_DAILY_REWARD_LIMIT} 分。</p>
              <p>睡着时被摸，可能开心醒来，也可能生气后睡回去。它生气时扣 {PET_SLEEP_PENALTY} 分，同一觉只扣一次。</p>
            </details>
          </section>
        )}

        {open && wandOut && (
          <button type="button" className={styles.wand} onClick={() => interact('play')} aria-label="挥动逗猫棒">
            <span className={styles.wandToy} key={reaction?.sequence ?? 0} data-waving={pose === 'play'} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
