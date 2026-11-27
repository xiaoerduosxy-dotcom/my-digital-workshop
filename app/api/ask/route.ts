import { ASK_TOPICS, QUESTION_LIMIT } from '@/lib/ask-jerry';
import { asksForPrivateInfo, redactVisitorDetails, replyForRoute } from '@/lib/ask-jerry-classifier';
import { answerWithDeepSeek, classifyWithDeepSeek } from '@/lib/ask-jerry-deepseek';

export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  const invalid = () => Response.json({ error: '这次没有收到有效的问题。' }, { status: 400, headers });
  if (Number(request.headers.get('content-length')) > 4096) return invalid();

  const input: unknown = await request.json().catch(() => null);
  if (!input || typeof input !== 'object' || !('question' in input)
    || typeof input.question !== 'string' || !input.question.trim() || input.question.length > QUESTION_LIMIT) return invalid();

  const requestedTopic = 'topic' in input ? input.topic : undefined;
  const previousTopic = ASK_TOPICS.find(topic => topic === requestedTopic);
  if (asksForPrivateInfo(input.question)) {
    return Response.json({ ...replyForRoute('privacy'), classificationSource: 'privacy-check', source: 'rules' }, { headers });
  }

  const route = await classifyWithDeepSeek(redactVisitorDetails(input.question), previousTopic);
  if (!route) {
    return Response.json({ error: '暂时无法判断你的问题，请稍后重试。' }, { status: 503, headers });
  }

  const { publicProfile, ...decision } = replyForRoute(route);
  const generated = publicProfile && await answerWithDeepSeek(publicProfile, decision.reply.text);
  if (generated) {
    return Response.json({ ...decision, reply: { text: generated }, classificationSource: 'deepseek', source: 'deepseek' }, { headers });
  }
  return Response.json({ ...decision, classificationSource: 'deepseek', source: 'rules' }, { headers });
}
