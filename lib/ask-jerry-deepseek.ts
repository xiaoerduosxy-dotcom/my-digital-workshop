import type { PublicProfile } from './ask-jerry-classifier';

const MODEL = 'deepseek-flash';
const SUCCESS_TTL = 15 * 60 * 1000;
const FAILURE_TTL = 30 * 1000;
const MAX_REPLY_LENGTH = 140;

const REQUIRED_PHRASES = {
  career: [
    ['C 端移动产品', '面向个人用户的移动产品', '面向消费者的移动产品'],
    ['B 端政企安全产品', 'B 端政企安全', '面向政企的安全产品', '政企安全产品', '政企安全'],
    ['AI 应用', '人工智能应用'],
  ],
  hobby: [
    ['喜欢健身', '爱好健身'],
    ['去上团课', '参加团课', '上团课'],
  ],
} satisfies Record<PublicProfile, string[][]>;

const CONNECTING_PHRASES = {
  career: ['Jerry', '的产品经历', '的经历', '的工作', '主要', '包括', '涉及', '覆盖', '做过', '做的', '这三个方向', '三个方向', '三个领域', '这三类', '和', '以及', '与', '还有', '也', '是', '有', '在'],
  hobby: ['Jerry', '平时', '日常', '也会', '还会', '会', '和', '以及', '也', '训练是', '日常生活的一部分', '生活的一部分', '很', '，'],
} satisfies Record<PublicProfile, string[]>;

function normalize(text: string) {
  return text.normalize('NFKC').toLowerCase().replace(/\s/g, '');
}

function isGroundedReply(profile: PublicProfile, text: string) {
  if (!text || text.length > MAX_REPLY_LENGTH) return false;

  let remaining = normalize(text);
  for (const alternatives of REQUIRED_PHRASES[profile]) {
    const present = alternatives.map(normalize).sort((a, b) => b.length - a.length)
      .find(phrase => remaining.includes(phrase));
    if (!present) return false;
    remaining = remaining.replace(present, '');
  }
  for (const phrase of CONNECTING_PHRASES[profile].map(normalize).sort((a, b) => b.length - a.length)) {
    remaining = remaining.replaceAll(phrase, '');
  }
  return /^[,.。!?、:；;]*$/.test(remaining);
}

async function requestReply(profile: PublicProfile, approvedText: string, key: string) {
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        thinking: { type: 'disabled' },
        max_tokens: 96,
        temperature: 0.3,
        messages: [
          { role: 'system', content: '你是 Jerry 的网站助手。只用所给公开资料润色成一到两句自然的中文，保留原有事实和产品用词。用第三人称，直接输出正文。不添加事实、年份、地点、公司、链接或建议。' },
          { role: 'user', content: approvedText },
        ],
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(6_000),
    });
    if (!response.ok) return;

    const data = await response.json() as {
      choices?: { finish_reason?: string; message?: { content?: unknown } }[];
    };
    const choice = data?.choices?.[0];
    if (choice?.finish_reason !== 'stop' || typeof choice.message?.content !== 'string') return;

    const answer = choice.message.content.trim();
    if (isGroundedReply(profile, answer)) return answer;
  } catch {
    // The rule-based answer remains available during provider failures.
  }
}

const cache = new Map<PublicProfile, { expiresAt: number; reply: Promise<string | undefined> }>();

export function answerWithDeepSeek(profile: PublicProfile, approvedText: string) {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) return;

  const cached = cache.get(profile);
  if (cached && cached.expiresAt > Date.now()) return cached.reply;

  const entry = {
    expiresAt: Date.now() + SUCCESS_TTL,
    reply: requestReply(profile, approvedText, key),
  };
  cache.set(profile, entry);
  void entry.reply.then(reply => {
    entry.expiresAt = Date.now() + (reply ? SUCCESS_TTL : FAILURE_TTL);
  });
  return entry.reply;
}
