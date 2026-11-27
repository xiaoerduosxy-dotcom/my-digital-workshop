import { ASK_TOPICS, QUESTION_LIMIT } from '@/lib/ask-jerry';
import { redactVisitorDetails, replyForRoute } from '@/lib/ask-jerry-classifier';
import { answerWithDeepSeek, checkDeepSeekCredential, classifyWithDeepSeek } from '@/lib/ask-jerry-deepseek';

export const maxDuration = 25;

export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  const invalid = () => Response.json({ error: '这次没有收到有效的问题。' }, { status: 400, headers });
  if (Number(request.headers.get('content-length')) > 4096) return invalid();

  const input: unknown = await request.json().catch(() => null);
  if (!input || typeof input !== 'object' || !('question' in input)
    || typeof input.question !== 'string' || !input.question.trim() || input.question.length > QUESTION_LIMIT) return invalid();

  const requestedTopic = 'topic' in input ? input.topic : undefined;
  const previousTopic = ASK_TOPICS.find(topic => topic === requestedTopic);
  const classification = await classifyWithDeepSeek(redactVisitorDetails(input.question), previousTopic);
  if ('failure' in classification) {
    const { failure } = classification;
    const isPreview = process.env.VERCEL_ENV === 'preview';
    const showDetails = process.env.NODE_ENV === 'development' || isPreview;
    const keyCheck = isPreview && (failure === 'deepseek-401' || failure === 'deepseek-403')
      ? await checkDeepSeekCredential()
      : undefined;
    const diagnostic = keyCheck ? `${failure} / ${keyCheck}` : failure;
    console.warn('[ask-jerry] classification failed', diagnostic);
    return Response.json({
      error: 'AI 问答暂时不可用，可以稍后重试。',
      ...(showDetails ? { diagnostic } : {}),
    }, { status: 503, headers });
  }

  const { publicProfile, ...decision } = replyForRoute(classification.route, previousTopic);
  const generated = publicProfile && await answerWithDeepSeek(publicProfile, decision.reply.text);
  if (generated) {
    return Response.json({ ...decision, reply: { text: generated }, classificationSource: 'deepseek', source: 'deepseek' }, { headers });
  }
  return Response.json({ ...decision, classificationSource: 'deepseek', source: 'rules' }, { headers });
}
