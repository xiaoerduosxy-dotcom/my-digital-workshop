export const editorialRules = {
  timeZone: 'Asia/Shanghai',
  storiesPerEdition: 3,
  summaryLength: { min: 80, max: 120 },
  topics: {
    'AI 产品': '优先选择有新使用场景、新交互方式或新工作流程的 AI 产品。说明读者能尝试或借鉴什么。',
    '模型进展': '优先选择模型或研究的实质创新。说明过去难以做到的事现在能怎么做，或在速度、成本、可靠性上有什么有意义的变化。注明实验、测试或正式开放等状态。',
  },
  priorities: '两类地位相同，按对 AI 产品经理和独立开发者的启发价值排序。两类不设配额。',
  exclusions: '跳过传闻、纯营销、旧闻、小修补和只有跑分变化却说不清实际意义的消息。同一件事的不同报道只选最接近一手出处的一条。',
} as const;

export const newsSources = [
  { name: 'OpenAI', feed: 'https://openai.com/news/rss.xml', hosts: ['openai.com', 'www.openai.com'] },
  { name: 'Google', feed: 'https://blog.google/innovation-and-ai/rss/', hosts: ['blog.google'] },
  { name: 'Google DeepMind', feed: 'https://deepmind.google/blog/rss.xml', hosts: ['deepmind.google', 'www.deepmind.google'] },
  { name: 'Hugging Face', feed: 'https://huggingface.co/blog/feed.xml', hosts: ['huggingface.co'] },
  { name: 'GitHub', feed: 'https://github.blog/ai-and-ml/feed/', hosts: ['github.blog'] },
  { name: 'Cursor', feed: 'https://cursor.com/changelog/rss.xml', hosts: ['cursor.com', 'www.cursor.com'] },
] satisfies { name: string; feed: string; hosts: string[] }[];

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: editorialRules.timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function newsDate(date: number | Date = Date.now()) {
  return dateFormatter.format(date);
}
