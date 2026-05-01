import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text, prompt: systemPrompt } = req.body || {};
    const nameAISystemPrompt = systemPrompt || 'Kamu adalah Name-AI, AI yang ramah, hangat, dan menyenangkan saat diajak berbicara.';
    const response = await axios.get('https://api.deline.web.id/ai/copilot', {
      params: { text: text || '', prompt: nameAISystemPrompt, max_tokens: 20000, reasoning_tokens: 20000 },
      timeout: 70000,
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    const result = response.data?.result || response.data?.message || response.data?.data || response.data;
    return res.status(200).json({ result: typeof result === 'string' ? result : JSON.stringify(result) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'AI API Failure' });
  }
}
