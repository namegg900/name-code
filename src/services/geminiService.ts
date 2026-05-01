import { Message, AIResponse } from '../types';

const ENDPOINT = '/api/copilot';

export const SYSTEM_PROMPT = `You are name-code v1 coding assistant. Always reply briefly, directly, and with minimal words. Prioritize accurate code/files over long explanations.`;

export async function chatWithAI(messages: Message[]): Promise<string> {
  const formattedMessages = messages.map((m) => ({
    role: m.role,
    content: m.content
  }));

  const latestText = formattedMessages[formattedMessages.length - 1]?.content || '';
  const historyText = formattedMessages
    .slice(0, -1)
    .map((m) => `[${m.role.toUpperCase()}] ${m.content}`)
    .join('\n');
  const fullContextText = historyText
    ? `${historyText}\n\n[USER_LATEST] ${latestText}`
    : latestText;
  const query = new URLSearchParams({
    text: fullContextText,
    prompt: SYSTEM_PROMPT,
    max_tokens: '20000',
    reasoning_tokens: '20000'
  });
  const response = await fetch(`${ENDPOINT}?${query.toString()}`, { method: 'GET' });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI request failed: ${response.status} ${errorText}`);
  }

  const data: AIResponse & { result?: string; message?: string } = await response.json();
  return data?.result || data?.message || data?.choices?.[0]?.message?.content || 'No response from AI.';
}

export async function chatWithClaude(prompt: string, history: { role: string, content: string }[], images?: string[]) {
  try {
    const allMessages: Message[] = [
      ...history.map((h, idx) => ({ id: `h-${idx}`, role: h.role as 'user' | 'assistant', content: h.content, timestamp: Date.now() - (history.length - idx) })),
      { id: 'current', role: 'user', content: images?.length ? `[ATTACHED IMAGES: ${images.length}]\n\n${prompt}` : prompt, timestamp: Date.now() }
    ];

    return await chatWithAI(allMessages);
  } catch (error: any) {
    console.error('Error in chatWithAI:', error);
    return `CRITICAL SYSTEM ERROR [NAME-AI]: ${error.message}`;
  }
}
