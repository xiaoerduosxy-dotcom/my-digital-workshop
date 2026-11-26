export const ASK_PATH = '/ask';
export const QUESTION_LIMIT = 300;
export const SUGGESTED_QUESTIONS = [
  { label: '代表项目', question: '你做过哪些有代表性的 AI 项目？' },
  { label: '产品经历', question: '能介绍一下你的产品经历吗？' },
  { label: '建站复盘', question: '这个网站是怎么做出来的？' },
] as const;

type Reply = { text: string; link?: { href: string; label: string } };
const PRIVATE_QUESTIONS = [
  /公司(?:的)?名(?:字|称)?|公司全称|公司叫(?:什么|啥)|雇主|哪(?:家|间|个)\s*(?:公司|单位|企业)|(?:(?:上|下)一|前一?|现在的|所在)(?:家)?公司|在哪(?:家|个|间|儿|里)?\s*(?:公司|单位|企业|工作|上班)|在哪(?:儿|里)?任职|现任职|就职于|离职|入职|辞职|(?:几月|哪年|何时|什么时候).{0,8}离开|where (?:do|did) you work|employer|resign/i,
  /(?:你|jerry|杰瑞)[^，,。?!]{0,10}在[^，,。?!]{1,24}(?:工作|上班|任职|就职)(?:吗|嘛|[，,。?!]|$)/i,
  /住在|住哪|家住|现居|常住|居住|所在城市|你(?:现在)?在哪(?:儿|里)?[？?。!！]*$|手机号|住址|身份证|home address|where do you live/i,
];
type TurnBase = { id: string; question: string; attempt: number; simulateFailure: boolean };
export type Turn = TurnBase & (
  | { status: 'pending' | 'failed' }
  | { status: 'ready'; reply: Reply }
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

// This preview provider runs locally. Replace it with an API adapter when AI is ready.
function getDemoReply(question: string): Reply {
  const text = question.normalize('NFKC').toLowerCase();
  if (PRIVATE_QUESTIONS.some(pattern => pattern.test(text))) {
    return { text: '这部分是 Jerry 不公开的个人信息。我可以介绍 Jerry 做过哪些方向的产品，也可以带你去看工作项目。', link: { href: '/about', label: '查看作品展' } };
  }
  if (/网站|建站|vibe coding|复盘|cursor/.test(text)) {
    return { text: 'Jerry 用这座工坊实践了一次从想法到上线的个人网站 MVP。实战实验室记录了用 Cursor 和大模型搭建网站的过程。', link: { href: '/lab', label: '看建站复盘' } };
  }
  if (/项目|百小思|问数|nl2sql|数据治理|ai-dg/.test(text)) {
    return { text: '可以从「智能问数」看起。Jerry 参与了问数后台的主题划分、字段说明和查询范围配置，让业务人员可以用自然语言查数据。', link: { href: '/about', label: '看智能问数展区' } };
  }
  if (/简历|经历|背景|产品经理|哪些方向|做过什么工作/.test(text)) {
    return { text: 'Jerry 做过 C 端移动产品、B 端政企安全和 AI 应用。' };
  }
  if (/文章|洞察|见解|阅读/.test(text)) {
    return { text: '如果你想了解 Jerry 怎么看 AI 产品和行业变化，可以从「行业见解」里的文章开始。', link: { href: '/insights', label: '浏览行业见解' } };
  }
  return { text: '这个预览只准备了少量演示回复，还不能回答这个问题。你可以试试问 Jerry 的代表项目、产品经历，或这个网站是怎么做的。' };
}

export function finishDemoQuestion(id: string, attempt: number) {
  updateConversation((turns) => turns.map((turn) => {
    if (turn.id !== id || turn.status !== 'pending' || turn.attempt !== attempt) return turn;
    if (turn.simulateFailure && attempt === 0) return { ...turn, status: 'failed' };
    const reply = turn.simulateFailure ? { text: '重试成功。一切正常，你可以继续体验提问。' } : getDemoReply(turn.question);
    return { ...turn, status: 'ready', reply };
  }));
}
