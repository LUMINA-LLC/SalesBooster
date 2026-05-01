import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { buildSystemPrompt } from '@/lib/aiChat/systemPrompt';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const DEFAULT_MODEL = 'gemini-2.5-flash';

let cachedClient: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI {
  if (!cachedClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    cachedClient = new GoogleGenerativeAI(apiKey);
  }
  return cachedClient;
}

/**
 * メッセージ履歴 + 新規メッセージを受け取り、Gemini からのストリーミング応答を返す。
 * 呼び出し側はこの AsyncIterable をそのまま SSE などに流せばよい。
 */
export async function* streamChatReply(
  history: ChatMessage[],
  userMessage: string,
): AsyncGenerator<string> {
  const client = getClient();
  const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: buildSystemPrompt(),
  });

  const contents: Content[] = history.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history: contents });
  const result = await chat.sendMessageStream(userMessage);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}
