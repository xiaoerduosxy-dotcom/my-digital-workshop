import type { AskDecision } from './ask-jerry';

export type PublicProfile = 'career' | 'hobby';
export type ClassifiedQuestion = AskDecision & { publicProfile?: PublicProfile };

const PRIVATE_QUESTIONS = [
  /公司(?:的)?名(?:字|称)?|公司全称|公司叫(?:什么|啥)|雇主|哪(?:家|间|个)\s*(?:公司|单位|企业)|(?:(?:上|下)一|前一?|现在的|所在)(?:家)?公司|在哪(?:家|个|间|儿|里)?\s*(?:公司|单位|企业|工作|上班)|在哪(?:儿|里)?任职|现任职|就职于|离职|入职|辞职|(?:几月|哪年|何时|什么时候).{0,8}离开|where (?:do|did) you work|employer|resign/i,
  /(?:你|jerry|杰瑞)[^，,。?!]{0,10}在[^，,。?!]{1,24}(?:工作|上班|任职|就职)(?:吗|嘛|[，,。?!]|$)/i,
  /住在|住哪|家住|现居|常住|居住|所在城市|你(?:现在)?在哪(?:儿|里)?[？?。!！]*$|你的(?:手机号|身份证|住址)|home address|where do you live/i,
  /(?:你|jerry|杰瑞)(?:现在|目前|是不是)?住[^，,。?!]{1,20}(?:吗|嘛|[，,]\s*对吗)/i,
];

const about = { href: '/about', label: '查看关于我' };
const scopeReply = {
  text: '嗨，我是 Jerry 的网站助手。你可以问 Jerry 做过哪些方向的产品，也可以让我带你去看个人项目、工作项目、建站复盘和行业见解。想先看哪一块？',
};
const offTopic: AskDecision = { intent: 'off-topic', action: 'redirect', reply: {
  text: '我主要帮你逛 Jerry 的工坊。你可以问我怎么找项目、建站复盘在哪里，或者 Jerry 做过哪些方向的产品。',
} };

export const ROUTES = [
  'privacy', 'identity', 'capabilities', 'career', 'portfolio', 'lab', 'insights',
  'smart-query', 'aidg', 'work', 'personal', 'personal-docs', 'hobby', 'coach',
  'clarify', 'off-topic',
] as const;
export type AskRoute = (typeof ROUTES)[number];

export function asksForPrivateInfo(question: string) {
  return PRIVATE_QUESTIONS.some(pattern => pattern.test(question.normalize('NFKC').trim()));
}

export function redactVisitorDetails(question: string) {
  return question.normalize('NFKC')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[邮箱已隐藏]')
    .replace(/(?<!\d)(?:\+?86[ -]?)?1[3-9](?:[ -]?\d){9}(?!\d)/g, '[手机号已隐藏]')
    .replace(/(?<!\d)(?:\d{17}[\dXx]|\d{15})(?!\d)/g, '[号码已隐藏]')
    .replace(/((?:我的)?(?:手机号(?:码)?|电话|证件号|身份证号|微信号|住址|地址)\s*(?:是|为|[:：])\s*)[^,，。;；!?！？\n]+/g, '$1[个人信息已隐藏]')
    .replace(/((?:我叫|我的姓名是|我名叫)\s*)[\p{L}·]+(?: [A-Za-z]+)*(?=[,，。;；!?！？\n]|$)/gu, '$1[姓名已隐藏]');
}

export function replyForRoute(route: AskRoute): ClassifiedQuestion {
  switch (route) {
    case 'privacy':
      return { intent: 'privacy', action: 'refuse', reply: {
        text: '这部分是 Jerry 不公开的个人信息。我可以介绍 Jerry 做过哪些方向的产品，也可以带你去看工作项目。',
        link: about,
      } };
    case 'identity':
      return { intent: 'capabilities', action: 'answer', reply: {
        text: '你好！你可以叫我「问问 Jerry」，我是 Jerry 的网站助手。',
      } };
    case 'capabilities':
      return { intent: 'capabilities', action: 'answer', reply: scopeReply };
    case 'career':
      return { intent: 'career', action: 'answer', publicProfile: 'career', reply: {
        text: 'Jerry 做过 C 端移动产品、B 端政企安全和 AI 应用。',
      } };
    case 'smart-query':
    case 'aidg':
    case 'work':
      return { intent: 'work', action: 'link', topic: route, reply: {
        text: route === 'smart-query'
          ? '可以到「关于我」的「工作项目」，看看智能问数的案例介绍和 Jerry 公开展示的分工。'
          : '你可以打开「关于我」，进入「工作项目」。目前可以先看智能问数，AIDG 的案例详情还在整理。',
        link: about,
      } };
    case 'personal':
    case 'personal-docs':
      return { intent: 'personal', action: 'link', topic: 'personal', reply: {
        text: route === 'personal-docs'
          ? '个人项目的原型和文档会在作品展里陆续补充。你可以先到「关于我」，看看 Jerry 正在琢磨的两个点子。'
          : '「AI 健身」和「帮我选」目前是项目构想。现在可以在「关于我」看看它们想解决的问题。',
        link: about,
      } };
    case 'lab':
      return { intent: 'navigation', action: 'link', reply: {
        text: '可以去「实战实验室」看 Jerry 的建站复盘。',
        link: { href: '/lab', label: '看建站复盘' },
      } };
    case 'insights':
      return { intent: 'insights', action: 'link', reply: {
        text: 'Jerry 把对 AI 产品的想法持续更新在「行业见解」里。你可以去那里看最新的文章和播客。',
        link: { href: '/insights', label: '查看行业见解' },
      } };
    case 'coach':
      return { intent: 'hobby', action: 'answer', reply: {
        text: 'Jerry 曾兼职做过健身教练，平时也会去上团课。',
      } };
    case 'hobby':
      return { intent: 'hobby', action: 'answer', publicProfile: 'hobby', reply: {
        text: 'Jerry 平时喜欢健身，也会去上团课。训练是 Jerry 日常生活的一部分。',
      } };
    case 'portfolio':
      return { intent: 'navigation', action: 'link', reply: {
        text: '可以先从「关于我」开始。想了解 Jerry 做过什么，就点「工作项目」；想看 AI 点子，可以逛「AI 健身」和「帮我选」。',
        link: about,
      } };
    case 'clarify':
      return { intent: 'clarify', action: 'clarify', reply: {
        text: '你想了解 Jerry 的项目和经历，还是想知道我能帮你做什么？可以说得具体一点。',
      } };
    case 'off-topic':
      return offTopic;
  }
}
