import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const GEMINI_KEYS = [
  "AQ.Ab8RN6LmRyOSAJRmEFxhSMqRBMx6m76toAwhxCjSLrsIJERSJg",
  "AQ.Ab8RN6KwjxXguwMWZZs-3kn9vCL9uLFYQS6p4yJYQxpuAMRQ1A",
  "AQ.Ab8RN6JAiMAMXp1k-_tpObkiDX3npE7gv7p9sKdsLV7hpNEmSg",
  "AQ.Ab8RN6I9Ih_tCuxi31A2xTffmMz92kVddPS4LrGrO27HmbNdpg",
  "AQ.Ab8RN6Ki8VvToG44ZSgCvZUXfCKNAITGQP-pQTQQVAwsr0W1vQ"
];
let currentKeyIndex = 0;

async function callGeminiDirect(text: string, history: any[], systemPrompt: string) {
  const contents = [
    ...(history || []).map((item: any) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }]
    })),
    { role: 'user', parts: [{ text }] }
  ];

  let lastError: any = null;
  for (let i = 0; i < GEMINI_KEYS.length; i += 1) {
    const apiKey = GEMINI_KEYS[currentKeyIndex];
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 2048 }
        },
        { timeout: 40000 }
      );
      const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (result) return result;
      throw new Error('Empty content from Gemini candidate');
    } catch (error: any) {
      lastError = error;
      currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
    }
  }
  throw lastError || new Error('All Gemini keys failed after rotation');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text, history, prompt: systemPrompt } = req.body || {};
    const nameAISystemPrompt = systemPrompt || 'Kamu adalah Name-AI, AI yang ramah, hangat, dan menyenangkan saat diajak berbicara.';
    const COVENANT_KEY = 'cov_live_54d5852a27b215169f91efefed500ffd187d20a3c1ed752c';
    const codingHint = /\b(code|coding|program|script|function|class|bug|debug|build|buat coding|bikin coding)\b/i.test(text || '');

    try {
      if (codingHint) {
        const codegen = await axios.get('https://api.covenant.sbs/api/ai/codegen', {
          params: { prompt: text, lang: 'javascript' },
          headers: { 'x-api-key': COVENANT_KEY },
          timeout: 45000
        });
        const result = codegen.data?.data?.result || codegen.data?.result || codegen.data?.message;
        if (result) return res.status(200).json({ result: String(result) });
      }

      const deepseek = await axios.get('https://api.covenant.sbs/api/ai/deepseek', {
        params: { question: text, system: nameAISystemPrompt },
        headers: { 'x-api-key': COVENANT_KEY },
        timeout: 45000
      });
      const result = deepseek.data?.data?.result || deepseek.data?.result || deepseek.data?.message;
      if (result) return res.status(200).json({ result: String(result) });
    } catch (_e) {
      // Continue to Gemini fallback
    }

    const gemini = await callGeminiDirect(text, history || [], nameAISystemPrompt);
    return res.status(200).json({ result: gemini });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'AI API Failure' });
  }
}
