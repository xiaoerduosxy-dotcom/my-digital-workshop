import { PET_AFFINITY_LIMIT } from './workshop-pet';

export const PET_DAILY_REWARD_LIMIT = 8;
export const PET_SLEEP_PENALTY = 2;
export const petCareRewards = {
  pet: { points: 1, cooldown: 90_000 },
  feed: { points: 2, cooldown: 4 * 60_000 },
  play: { points: 2, cooldown: 2 * 60_000 },
};

export type PetCareAction = keyof typeof petCareRewards;
export type PetBond = {
  score: number;
  rewardDay: number;
  earnedToday: number;
  lastReward: Partial<Record<PetCareAction, number>>;
  upsetNapEndsAt?: number;
};

type CareOutcome = {
  bond: PetBond;
  mood: 'ordinary' | 'happy' | 'grumpy';
  delta: number;
  reason?: 'cooldown' | 'dailyLimit' | 'full' | 'sameNap';
};

export function createPetBond(legacyScore = 0): PetBond {
  return { score: Math.floor(Math.max(0, Math.min(PET_AFFINITY_LIMIT, legacyScore)) / 4), rewardDay: 0, earnedToday: 0, lastReward: {} };
}

export function parsePetBond(value: unknown): PetBond | undefined {
  if (!value || typeof value !== 'object') return;
  const { score, rewardDay, earnedToday, lastReward, upsetNapEndsAt } = value as Partial<PetBond>;
  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > PET_AFFINITY_LIMIT
    || typeof rewardDay !== 'number' || !Number.isFinite(rewardDay)
    || typeof earnedToday !== 'number' || !Number.isInteger(earnedToday) || earnedToday < 0 || earnedToday > PET_DAILY_REWARD_LIMIT) return;

  const rewards: PetBond['lastReward'] = {};
  for (const action of ['pet', 'feed', 'play'] as const) {
    const time = lastReward?.[action];
    if (typeof time === 'number' && Number.isFinite(time) && time >= 0) rewards[action] = time;
  }
  return {
    score, rewardDay, earnedToday, lastReward: rewards,
    upsetNapEndsAt: typeof upsetNapEndsAt === 'number' && Number.isFinite(upsetNapEndsAt) ? upsetNapEndsAt : undefined,
  };
}

export function applyPetCare(bond: PetBond, action: PetCareAction, now: number, napEndsAt: number | undefined, chance: number): CareOutcome {
  let mood: CareOutcome['mood'] = 'ordinary';
  if (action === 'pet' && napEndsAt !== undefined) {
    if (bond.upsetNapEndsAt === napEndsAt) return { bond, mood: 'grumpy', delta: 0, reason: 'sameNap' };

    const happyChance = .47 + .33 * (bond.score / PET_AFFINITY_LIMIT);
    if (chance >= happyChance) {
      const next = { ...bond, score: Math.max(0, bond.score - PET_SLEEP_PENALTY), upsetNapEndsAt: napEndsAt };
      return { bond: next, mood: 'grumpy', delta: next.score - bond.score };
    }
    mood = 'happy';
  }

  const day = new Date(now).setHours(0, 0, 0, 0);
  const earned = bond.rewardDay === day ? bond.earnedToday : 0;
  const { points, cooldown } = petCareRewards[action];
  const last = bond.lastReward[action];
  if (bond.score >= PET_AFFINITY_LIMIT) return { bond, mood, delta: 0, reason: 'full' };
  if (earned >= PET_DAILY_REWARD_LIMIT) return { bond, mood, delta: 0, reason: 'dailyLimit' };
  if (last !== undefined && now - last < cooldown) return { bond, mood, delta: 0, reason: 'cooldown' };

  const delta = Math.min(points, PET_DAILY_REWARD_LIMIT - earned, PET_AFFINITY_LIMIT - bond.score);
  const next = {
    ...bond,
    score: bond.score + delta,
    rewardDay: day,
    earnedToday: earned + delta,
    lastReward: { ...bond.lastReward, [action]: now },
  };
  return { bond: next, mood, delta };
}
