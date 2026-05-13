import {
  GoogleGenerativeAI,
  Content,
  GenerativeModel,
} from '@google/generative-ai';
import { buildSystemPrompt } from '@/lib/aiChat/systemPrompt';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const DEFAULT_MODEL = 'gemini-2.5-flash';
const IS_PROD = process.env.NODE_ENV === 'production';

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
 * model インスタンスをキャッシュして systemInstruction の再構築を回避する。
 * 開発環境では機能説明書の更新を即反映するためキャッシュしない。
 */
let cachedModel: GenerativeModel | null = null;
function getModel(): GenerativeModel {
  if (IS_PROD && cachedModel) return cachedModel;
  const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const model = getClient().getGenerativeModel({
    model: modelName,
    systemInstruction: buildSystemPrompt(),
  });
  if (IS_PROD) cachedModel = model;
  return model;
}

/**
 * メッセージ履歴 + 新規メッセージを受け取り、Gemini からのストリーミング応答を返す。
 * abortSignal が渡された場合、停止時に途中で生成を中断する。
 */
export async function* streamChatReply(
  history: ChatMessage[],
  userMessage: string,
  abortSignal?: AbortSignal,
): AsyncGenerator<string> {
  const model = getModel();
  const contents: Content[] = history.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history: contents });
  const result = await chat.sendMessageStream(userMessage);

  for await (const chunk of result.stream) {
    if (abortSignal?.aborted) break;
    const text = chunk.text();
    if (text) yield text;
  }
}
