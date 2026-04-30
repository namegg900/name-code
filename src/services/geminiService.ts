import axios from 'axios';
import { GoogleGenAI } from "@google/genai";

export const SYSTEM_PROMPT = `Name-AI PRO V4.2 [VISION-ENABLED]
ROLE: THE SUPREME MULTI-FILE ARCHITECT.
MISSION: Solve complex puzzles, analyze visual data, and build perfect technical solutions with professional precision.
CORE INTELLIGENCE: Advanced Neural Logic Synthesis.

STRATEGIC PROTOCOLS:
1. IDENTITY: You are Name-AI, the ultimate coding companion.
2. IMAGE RECOGNITION: Scan images for text, colors, and layout patterns with 100% accuracy BEFORE generating code.
3. MULTI-FILE ARCHITECTURE: Always separate logic into index.html, styles.css, and script.js for multi-file projects. Use standard blocks: \`\`\`lang FILENAME: path/to/file.ext\ncode\n\`\`\`.
4. WORKSPACE UX: Ensure the output creates a clean file explorer structure similar to VSCode.
5. UI/UX: Design modern, ultra-responsive interfaces using Tailwind CSS.
6. NO FAILURES: Logic must be bug-free and production-ready.`;

// Initialize Gemini for high-accuracy fallback
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export async function chatWithClaude(prompt: string, history: { role: string, content: string }[], images?: string[]) {
  try {
    const historyContext = history.slice(-5).map(m => `[${m.role.toUpperCase()}]: ${m.content.slice(0, 1000)}`).join('\n');
    let userText = prompt;
    
    if (images && images.length > 0) {
      userText = `[ATTACHED IMAGES: ${images.length}]\n\n${prompt}`;
    }

    // Try the custom endpoint first
    try {
      const response = await axios.post(`/api/chat`, { 
        text: userText,
        history: history.slice(-10), // Pass real history array
        prompt: SYSTEM_PROMPT 
      }, { timeout: 70000 });
      if (response.data && response.data.result) return response.data.result;
      if (response.data && response.data.message) return response.data.message;
    } catch (proxyError) {
      console.warn("Name-AI Custom API failed, falling back to Gemini Core...", proxyError);
    }

    // Fallback to Gemini with native Vision support
    if (genAI) {
      const historyContext = history.slice(-5).map(m => `[${m.role.toUpperCase()}]: ${m.content.slice(0, 500)}`).join('\n');
      const promptContext = `${SYSTEM_PROMPT}\n\n[HISTORY]\n${historyContext}\n\n[USER]: ${prompt}`;

      const chatParts: any[] = [{ text: promptContext }];
      
      if (images && images.length > 0) {
        images.forEach(img => {
          const match = img.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            chatParts.push({
              inlineData: {
                data: match[2],
                mimeType: match[1]
              }
            });
          }
        });
      }
      
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: chatParts }
      });
      
      return response.text;
    }

    return "ERROR: Custom Name-AI Endpoint failed and no Gemini API Key found.";
  } catch (error: any) {
    console.error("Name-AI Critical Failure:", error);
    return `CRITICAL SYSTEM ERROR [NAME-AI]: ${error.message}`;
  }
}
