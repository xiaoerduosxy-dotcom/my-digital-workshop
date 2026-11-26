export const ASK_PATH = '/ask';
export const QUESTION_LIMIT = 300;
export const SUGGESTED_QUESTIONS = [
  { label: '代表项目', question: '你做过哪些有代表性的 AI 项目？' },
  { label: '产品经历', question: '能介绍一下你的产品经历吗？' },
  { label: '建站复盘', question: '这个网站是怎么做出来的？' },
] as const;

export type Reply = { text: string; link?: { href: string; label: string } };
export const ASK_TOPICS = ['smart-query', 'aidg', 'work', 'personal'] as const;
export type AskTopic = (typeof ASK_TOPICS)[number];
export type AskIntent = 'privacy' | 'capabilities' | 'navigation' | 'career' | 'work' | 'personal' | 'insights' | 'hobby' | 'off-topic' | 'clarify';
export type AskDecision = {
  intent: AskIntent;
  action: 'answer' | 'link' | 'refuse' | 'redirect' | 'clarify';
  reply: Reply;
  topic?: AskTopic;
};

type TurnBase = { id: string; question: string; attempt: number; simulateFailure: boolean };
export type Turn = TurnBase & (
  | { status: 'pending' | 'failed' }
  | { status: 'ready'; reply: Reply; intent?: AskIntent; topic?: AskTopic }
);

const KEY = 'digital-workshop.ask-jerry.preview.v2';
const CHANGE = `${KEY}:change`;
const EMPTY = '[]';
let fallback = EMPTY;
let memoryOnly = false;

export function getConversation() {
  if (memoryOnly) return fallback;
  try {
    return window.sessionStorage.getItem(KEY) ?? EMPTY;
  } catch {
    return fallback;
  }
}

export const getServerConversation = () => EMPTY;

export function subscribeConversation(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  return () => window.removeEventListener(CHANGE, onChange);
}

export function parseConversation(snapshot: string): Turn[] {
  try {
    const value = JSON.parse(snapshot);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function updateConversation(update: (turns: Turn[]) => Turn[]) {
  fallback = JSON.stringify(update(parseConversation(getConversation())));
  try {
    window.sessionStorage.setItem(KEY, fallback);
    memoryOnly = false;
  } catch {
    memoryOnly = true;
  }
  window.dispatchEvent(new Event(CHANGE));
}

export function queueQuestion(value: string, simulateFailure = false) {
  const question = value.trim().slice(0, QUESTION_LIMIT);
  if (!question) return false;
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  updateConversation((turns) => [...turns.slice(-39), { id, question, status: 'pending', attempt: 0, simulateFailure }]);
  return true;
}

export function retryQuestion(id: string) {
  updateConversation((turns) => turns.map((turn) => (
    turn.id === id && turn.status === 'failed'
      ? { ...turn, attempt: turn.attempt + 1, status: 'pending' }
      : turn
  )));
}

export function finishQuestion(id: string, attempt: number, result?: Pick<AskDecision, 'reply' | 'intent' | 'topic'>) {
  updateConversation((turns) => turns.map((turn) => {
    if (turn.id !== id || turn.status !== 'pending' || turn.attempt !== attempt) return turn;
    return result ? { ...turn, status: 'ready', ...result } : { ...turn, status: 'failed' };
  }));
}
