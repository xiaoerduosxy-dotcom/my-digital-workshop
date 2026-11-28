export const PET_AFFINITY_LIMIT = 100;
export const DEFAULT_PET_PLAY_MINUTES = 8;
export const MAX_PET_PLAY_MINUTES = 1_440;

const minute = 60_000;
const napLength = 12 * minute;

export type PetRoutine = { awakeSince: number; playMinutes: number };
export type PetMotion = 'walk' | 'run' | 'climb';
export type PetFacing = 'left' | 'right';
export type PetPoint = { x: number; y: number };
export type PetBounds = { left: number; top: number; right: number; bottom: number };
const restPoses = ['rest-side', 'rest-sprawl', 'rest-chin', 'rest-loaf'] as const;
export type PetRestPose = 'rest' | typeof restPoses[number];

export function choosePetRestPose(previous: PetRestPose, chance: number): PetRestPose {
  const options = restPoses.filter(pose => pose !== previous);
  return options[Math.floor(chance * options.length)];
}

export function isPetPlayMinutes(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_PET_PLAY_MINUTES;
}

export function getPetActivity({ awakeSince, playMinutes }: PetRoutine, now: number) {
  const playLength = playMinutes * minute;
  const cycleLength = playLength + napLength;
  const elapsed = Math.max(0, now - awakeSince);
  const cycleStart = awakeSince + elapsed - (elapsed % cycleLength);
  const napAt = cycleStart + playLength;
  const sleeping = now >= napAt;
  return { awakeSince: cycleStart, sleeping, nextChangeAt: sleeping ? napAt + napLength : napAt };
}

export function changePetPlayTime(routine: PetRoutine, playMinutes: number, now: number): PetRoutine {
  const current = getPetActivity(routine, now);
  const awakeSince = current.sleeping ? current.nextChangeAt - napLength - playMinutes * minute : now;
  return { awakeSince, playMinutes };
}

export function keepPetInBounds(point: PetPoint, { left, top, right, bottom }: PetBounds): PetPoint {
  return {
    x: Math.min(right, Math.max(left, point.x)),
    y: Math.min(bottom, Math.max(top, point.y)),
  };
}

export function getPetDestination(motion: PetMotion, start: PetPoint, bounds: PetBounds, chance: number): PetPoint {
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;

  if (motion === 'climb') {
    const rise = Math.min(height * .48, 115 + chance * 70);
    const movesUp = start.y - bounds.top >= rise * .7;
    const towardRight = start.x < (bounds.left + bounds.right) / 2;
    return keepPetInBounds({
      x: start.x + (towardRight ? 1 : -1) * Math.min(width * .14, 45),
      y: start.y + (movesUp ? -rise : rise),
    }, bounds);
  }

  const distance = motion === 'run' ? Math.min(width * (.34 + chance * .18), 460) : Math.min(width * (.16 + chance * .14), 245);
  const wantsRight = chance >= .5;
  const room = wantsRight ? bounds.right - start.x : start.x - bounds.left;
  const direction = room >= distance * .6 ? wantsRight : !wantsRight;
  return keepPetInBounds({ x: start.x + (direction ? distance : -distance), y: start.y }, bounds);
}
