import type { AskDecision, AskTopic } from './ask-jerry';

export type PublicProfile = 'career' | 'hobby';
export type ClassifiedQuestion = AskDecision & { publicProfile?: PublicProfile };

const about = { href: '/about', label: '查看关于我' };
const scopeReply = {
  text: '嗨，我是 Jerry。你可以问我做过哪些产品，也可以跟我逛逛我的个人项目、工作项目、建站复盘和行业见解。你想先看哪一块？',
};
const offTopic: AskDecision = { intent: 'off-topic', action: 'redirect', reply: {
  text: '我在这里主要聊我的项目、经历和这个工坊。你可以问我做过哪些产品，或者这个网站是怎么做出来的。',
} };

export const ROUTES = [
  'privacy', 'gratitude', 'identity', 'capabilities', 'profile-highlights', 'career', 'portfolio', 'lab', 'insights',
  'smart-query', 'aidg', 'work', 'personal', 'personal-docs', 'hobby', 'coach',
  'clarify', 'off-topic',
] as const;
export type AskRoute = (typeof ROUTES)[number];

export function redactVisitorDetails(question: string) {
  return question.normalize('NFKC')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[邮箱已隐藏]')
    .replace(/(?<!\d)(?:\+?86[ -]?)?1[3-9](?:[ -]?\d){9}(?!\d)/g, '[手机号已隐藏]')
    .replace(/(?<!\d)(?:\d{17}[\dXx]|\d{15})(?!\d)/g, '[号码已隐藏]')
    .replace(/((?:我的|我本人(?:的)?)(?:手机号(?:码)?|电话|证件号|身份证号|微信号|住址|地址)\s*(?:是|为|[:：])\s*)[^,，。;；!?！？\n]+/g, '$1[个人信息已隐藏]')
    .replace(/((?:我叫|我的姓名是|我名叫)\s*)[\p{L}·]+(?: [A-Za-z]+)*(?=[,，。;；!?！？\n]|$)/gu, '$1[姓名已隐藏]');
}

export function replyForRoute(route: AskRoute, previousTopic?: AskTopic): ClassifiedQuestion {
  switch (route) {
    case 'privacy':
      return { intent: 'privacy', action: 'refuse', reply: {
        text: '这部分我想留给自己。你可以问我做过哪些方向的产品，我也可以带你去看看我的工作项目。',
        link: about,
      } };
    case 'gratitude':
      return { intent: 'gratitude', action: 'answer', topic: previousTopic, reply: {
        text: '不客气，很高兴能帮到你！',
      } };
    case 'identity':
      return { intent: 'capabilities', action: 'answer', reply: {
        text: '你好，我是 Jerry。欢迎来我的数字工坊！',
      } };
    case 'capabilities':
      return { intent: 'capabilities', action: 'answer', reply: scopeReply };
    case 'profile-highlights':
      return { intent: 'profile-highlights', action: 'answer', reply: {
        text: '我是学美术出身的，后来做过 C 端移动产品、B 端政企安全和 AI 应用。我把这个数字工坊从想法做到上线，也在「实战实验室」写下了建站过程。想看工作里的例子，可以从「关于我」的智能问数案例看起。',
        link: about,
      } };
    case 'career':
      return { intent: 'career', action: 'answer', publicProfile: 'career', reply: {
        text: '我做过 C 端移动产品、B 端政企安全和 AI 应用。',
      } };
    case 'smart-query':
    case 'aidg':
    case 'work':
      return { intent: 'work', action: 'link', topic: route, reply: {
        text: route === 'smart-query'
          ? '可以到「关于我」的「工作项目」，看看智能问数的案例，以及我在里面负责的部分。'
          : '我把工作案例放在「关于我」的「工作项目」。现在可以先看智能问数，AIDG 的案例详情我还在整理。',
        link: about,
      } };
    case 'personal':
    case 'personal-docs':
      return { intent: 'personal', action: 'link', topic: 'personal', reply: {
        text: route === 'personal-docs'
          ? '我会在作品展里陆续补上原型和文档。你可以先到「关于我」，看看我正在琢磨的两个点子。'
          : '「AI 健身」和「帮我选」是我正在琢磨的两个点子。我在「关于我」里写了它们想解决的问题。',
        link: about,
      } };
    case 'lab':
      return { intent: 'navigation', action: 'link', reply: {
        text: '我把这个网站是怎么做出来的，写在了「实战实验室」的建站复盘里。',
        link: { href: '/lab', label: '看建站复盘' },
      } };
    case 'insights':
      return { intent: 'insights', action: 'link', reply: {
        text: '我会把对 AI 产品的想法更新在「行业见解」里，你可以去那里看我最近的文章和播客。',
        link: { href: '/insights', label: '查看行业见解' },
      } };
    case 'coach':
      return { intent: 'hobby', action: 'answer', reply: {
        text: '我以前兼职做过健身教练，平时也会去上团课。',
      } };
    case 'hobby':
      return { intent: 'hobby', action: 'answer', publicProfile: 'hobby', reply: {
        text: '我平时喜欢健身，也会去上团课。训练是我日常生活的一部分。',
      } };
    case 'portfolio':
      return { intent: 'navigation', action: 'link', reply: {
        text: '可以先从「关于我」开始。想了解我做过什么，就点「工作项目」；想看 AI 点子，可以逛「AI 健身」和「帮我选」。',
        link: about,
      } };
    case 'clarify':
      return { intent: 'clarify', action: 'clarify', reply: {
        text: '你想了解我的项目和经历，还是想知道我能帮你做什么？可以说得具体一点。',
      } };
    case 'off-topic':
      return offTopic;
  }
}
