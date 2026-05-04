// ─── 行业洞察统一数据源 ───────────────────────────────────────
//
// 新增一篇博客的步骤：
//   1. 在数组开头追加一条新对象（最新在上）
//   2. 在 content/insights/ 里新建对应 <id>.md，粘贴博客正文
//   3. 把 audio_src 替换为小宇宙 RSS 里那集的 enclosure url
//   完成，页面自动显示。

export const INSIGHTS = [
  {
    id: 'ins-05',
    date: '2026.05',
    category: 'AI 产品',
    title: '作为产品经理，我怎么"管住"大模型不乱说话——防幻觉设计的 3 个实战方法',
    summary:
      '幻觉不能消灭，但可以被「设计进去」。不讲算法层面的优化——那是模型工程师的工作。聊产品设计层面，有哪些方法可以把幻觉的影响控制在可接受的范围内，来自实际项目里用过的 3 个实战方法。',
    tags: ['防幻觉设计', 'System Prompt', 'Human-in-the-loop', 'B 端 AI'],
    audio_src: 'https://dts-api.xiaoyuzhoufm.com/track/62bc523e001112434d33248b/69f84b09e05c0efcd6da4d7f/media.xyzcdn.net/62bc523e001112434d33248b/lgnQtdbBpqrm-36NVprmq-QjwLeM.m4a',
  },
  {
    id: 'ins-04',
    date: '2026.05',
    category: 'AI 工具',
    title: '我用 AI 搭了一套「知识萃取系统」，从此不再重复劳动',
    summary:
      '每天和 AI 产生大量内容，过一段时间全忘了，找不到，只能重新问一遍。花了一天时间搭了一套「个人知识萃取系统」，从此不再重复劳动。完整记录搭建过程，写给被信息淹没但不懂代码的人。',
    tags: ['知识管理', 'NotebookLM', 'AI 工具流', '个人效率'],
    audio_src: 'https://dts-api.xiaoyuzhoufm.com/track/62bc523e001112434d33248b/69f7eb5ce05c0efcd6d69d76/media.xyzcdn.net/62bc523e001112434d33248b/liVX3tbdiyvGESO4MbVteF_QNvhq.m4a',
  },
  {
    id: 'ins-03',
    date: '2026.05',
    category: 'AI 产品',
    title: '做一个 AI 产品，从第一天开始要想清楚哪些事？',
    summary:
      'AI 产品和传统产品最大的区别不是工具变了，而是多了几个以前完全不需要考虑的环节。聊做 AI 产品从第一天起就要想清楚的几件事：Prompt 设计、评测体系、Bad Case 分析，以及如何判断一个场景到底值不值得用大模型。',
    tags: ['AI PM', 'Prompt 设计', '评测体系', 'Bad Case'],
    audio_src: 'https://dts-api.xiaoyuzhoufm.com/track/62bc523e001112434d33248b/69f84280e05c0efcd6d9eb10/media.xyzcdn.net/62bc523e001112434d33248b/lrM3qboyIekBRxmatk6Xms9GRrh-.m4a',
  },
  {
    id: 'ins-02',
    date: '2026.05',
    category: 'AI 技巧',
    title: '别让大模型替你做小事：从"Token 焦虑"到用 AI 沉淀自己的工具库',
    summary:
      '我把越来越多的事直接扔给大模型，却发现自己在低水平重复消耗 Token。聊 Token 焦虑的根源，以及如何用脚本和 Skill 把频繁任务自动化，让大模型只做真正值得做的事——一次投入，长期复用。',
    tags: ['Token 消耗', '个人工具沉淀', 'Python', 'Skill'],
    audio_src:
      'https://dts-api.xiaoyuzhoufm.com/track/62bc523e001112434d33248b/69f8665df93890ea81362804/media.xyzcdn.net/62bc523e001112434d33248b/lv_y-5JK-aM40IkoxfT335dEWpIG.m4a',
  },
  {
    id: 'ins-01',
    date: '2026.04',
    category: 'B 端 AI',
    title: '为什么通用 AI 做不了真正的企业应用？从"幻觉"问题说起',
    summary:
      '政企客户追问「你们和 ChatGPT 有什么本质区别」——答案不是我们的模型更强，而是解决的根本不是同一个问题。聊通用大模型幻觉的底层逻辑，以及垂直 AI 为何要把模型从「答案生成者」变成「问题翻译者」。',
    tags: ['大模型幻觉', 'NL2SQL', 'B 端 AI', '私有化部署'],
    audio_src:
      'https://dts-api.xiaoyuzhoufm.com/track/62bc523e001112434d33248b/69f2a998fbed7ba94124e33b/media.xyzcdn.net/62bc523e001112434d33248b/lvWJLfVe7pVkZn1W7lLvu_vzKqUP.m4a',
  },
] as const;

export type Insight = (typeof INSIGHTS)[number];
