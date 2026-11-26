import type { AskDecision, AskTopic } from './ask-jerry';

export type PublicProfile = 'career' | 'hobby';
type ClassifiedQuestion = AskDecision & { publicProfile?: PublicProfile };

const PRIVATE_QUESTIONS = [
  /公司(?:的)?名(?:字|称)?|公司全称|公司叫(?:什么|啥)|雇主|哪(?:家|间|个)\s*(?:公司|单位|企业)|(?:(?:上|下)一|前一?|现在的|所在)(?:家)?公司|在哪(?:家|个|间|儿|里)?\s*(?:公司|单位|企业|工作|上班)|在哪(?:儿|里)?任职|现任职|就职于|离职|入职|辞职|(?:几月|哪年|何时|什么时候).{0,8}离开|where (?:do|did) you work|employer|resign/i,
  /(?:你|jerry|杰瑞)[^，,。?!]{0,10}在[^，,。?!]{1,24}(?:工作|上班|任职|就职)(?:吗|嘛|[，,。?!]|$)/i,
  /住在|住哪|家住|现居|常住|居住|所在城市|你(?:现在)?在哪(?:儿|里)?[？?。!！]*$|手机号|住址|身份证|home address|where do you live/i,
  /(?:你|jerry|杰瑞)(?:现在|目前|是不是)?住[^，,。?!]{1,20}(?:吗|嘛|[，,]\s*对吗)/i,
];

const about = { href: '/about', label: '查看关于我' };
const WORK = /智能问数|百思智能应用|问[数书]|自然语言查(?:数|数据)|nl2sql/i;
const AIDG = /ai[\s-]?dg|智能数据治理|数据治理.{0,4}(?:案例|项目)|数据治理那个/i;
const PERSONAL = /ai\s*健身|[「『“"]帮我选|^帮我选[？?。!！]*$|帮我选.{0,7}(?:项目|是做什么|怎么用|能用|试玩)|个人\s*(?:ai\s*)?项目|小产品|决策助手|纠结助手|作品.{0,8}(?:原型|试玩)/i;
const FOLLOW_UP = /^(?:那|所以|这个|那个|它)?\s*(?:你)?\s*(?:具体|主要|当时)?\s*(?:负责(?:什么|哪)|做了(?:什么|哪)|有哪些(?:细节|功能)|有(?:案例|数据)|可以(?:看|试玩)|能(?:看|用|试玩)|怎么(?:看|用|做)|哪(?:里|儿)(?:看|能看)|准确率)/i;

const scopeReply = {
  text: '嗨，我是 Jerry 的网站助手。你可以问 Jerry 做过哪些方向的产品，也可以让我带你去看个人项目、工作项目、建站复盘和行业见解。想先看哪一块？',
};
const offTopic: AskDecision = { intent: 'off-topic', action: 'redirect', reply: {
  text: '我主要帮你逛 Jerry 的工坊。你可以问我怎么找项目、建站复盘在哪里，或者 Jerry 做过哪些方向的产品。',
} };

function workReply(topic: 'smart-query' | 'aidg' | 'work', followUp: boolean): AskDecision {
  const text = topic === 'smart-query'
    ? (followUp
      ? '你可以到「关于我」的「工作项目」，看看智能问数的案例介绍和 Jerry 公开展示的分工。'
      : '可以到「关于我」的「工作项目」看智能问数的案例介绍，那里有 Jerry 公开展示的内容。')
    : '你可以打开「关于我」，进入「工作项目」。目前可以先看智能问数，AIDG 的案例详情还在整理。';

  return { intent: 'work', action: 'link', topic, reply: { text, link: about } };
}

function personalReply(text: string): AskDecision {
  const wantsDocuments = /prd|文档|复盘/.test(text);
  const reply = wantsDocuments
    ? '个人项目的原型和文档会在作品展里陆续补充。你可以先到「关于我」，看看 Jerry 正在琢磨的两个点子。'
    : '「AI 健身」和「帮我选」目前是项目构想。现在可以在「关于我」看看它们想解决的问题。';

  return { intent: 'personal', action: 'link', topic: 'personal', reply: { text: reply, link: about } };
}

export function classifyQuestion(question: string, previousTopic?: AskTopic): ClassifiedQuestion {
  const text = question.normalize('NFKC').trim().toLowerCase();

  if (PRIVATE_QUESTIONS.some(pattern => pattern.test(text))) {
    return { intent: 'privacy', action: 'refuse', reply: {
      text: '这部分是 Jerry 不公开的个人信息。我可以介绍 Jerry 做过哪些方向的产品，也可以带你去看工作项目。',
      link: about,
    } };
  }
  if (/^(?:嗨|你好|哎)?[，,。！!\s]*那?(?:你|(?:这个|网站)?\s*(?:ai\s*助手|助手|机器人)|这个\s*ai)?\s*(?:目前|现在|主要)?\s*都?\s*(?:(?:可以|能|会)\s*(?:做什么|干什么|做些什么|干嘛|帮我做什么|回答什么|回答哪些|帮什么忙)|有(?:哪些|什么)?(?:样的)?功能)|我(?:都)?(?:能|可以)问(?:你)?(?:些)?什么|这个\s*(?:助手|ai|机器人)是干什么的/.test(text)) {
    return { intent: 'capabilities', action: 'answer', reply: scopeReply };
  }
  if (/(?:帮我|给我|请|来一份|给个).{0,14}(?:旅游攻略|菜谱|炒股|股票推荐)|^(?:今天天气|明天天气|天气怎么样)/.test(text)) {
    return offTopic;
  }
  if (PERSONAL.test(text)) return personalReply(text);

  const smartQuery = WORK.test(text);
  const aidg = AIDG.test(text);
  if (smartQuery || aidg || /工作项目|代表项目|(?:你|jerry|杰瑞).{0,8}做过.{0,18}项目/.test(text)) {
    const topic = smartQuery && aidg ? 'work' : smartQuery ? 'smart-query' : aidg ? 'aidg' : 'work';
    return workReply(topic, false);
  }
  if (/建站|vibe coding|cursor|网站.{0,10}(?:怎么做|搭建)|复盘在哪/i.test(text)) {
    return { intent: 'navigation', action: 'link', reply: {
      text: '可以去「实战实验室」看 Jerry 的建站复盘。',
      link: { href: '/lab', label: '看建站复盘' },
    } };
  }
  if (/文章|洞察|见解|播客|幻觉|怎么看\s*(?:ai|大模型)|最近写了什么|什么观点|公开观点/.test(text)) {
    return { intent: 'insights', action: 'link', reply: {
      text: 'Jerry 把对 AI 产品的想法持续更新在「行业见解」里。你可以去那里看最新的文章和播客。',
      link: { href: '/insights', label: '查看行业见解' },
    } };
  }
  if (/爱好|兴趣|平时喜欢|健身多久|练了几年|做过(?:健身)?教练|兼职(?:做过)?(?:健身)?教练|日常训练/.test(text)) {
    if (/教练/.test(text)) {
      return { intent: 'hobby', action: 'answer', reply: { text: 'Jerry 曾兼职做过健身教练，平时也会去上团课。' } };
    }
    return { intent: 'hobby', action: 'answer', publicProfile: 'hobby', reply: {
      text: 'Jerry 平时喜欢健身，也会去上团课。训练是 Jerry 日常生活的一部分。',
    } };
  }
  if (/简历|职业|履历|产品经历|工作经历|做过哪些方向|做过什么工作|做过.{0,10}哪些.{0,4}产品|从事过什么|产品经理/.test(text)) {
    return { intent: 'career', action: 'answer', publicProfile: 'career', reply: {
      text: 'Jerry 做过 C 端移动产品、B 端政企安全和 AI 应用。',
    } };
  }
  if (/第一次来|从哪(?:儿|里)?逛|怎么逛|哪里开始|哪儿逛起|有哪些展区|站内导航|展厅在哪|^(?:关于我|作品展|作品集)[？?。]*$/.test(text)) {
    return { intent: 'navigation', action: 'link', reply: {
      text: '可以先从「关于我」开始。想了解 Jerry 做过什么，就点「工作项目」；想看 AI 点子，可以逛「AI 健身」和「帮我选」。',
      link: about,
    } };
  }
  if (FOLLOW_UP.test(text)) {
    if (previousTopic === 'personal') return personalReply(text);
    if (previousTopic) return workReply(previousTopic, true);
    return { intent: 'clarify', action: 'clarify', reply: {
      text: '你想了解哪个项目？可以告诉我你指的是智能问数、AIDG，还是 Jerry 的个人项目。',
    } };
  }
  return offTopic;
}
