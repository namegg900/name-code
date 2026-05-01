import axios from 'axios';

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

export async function chatWithClaude(prompt: string, history: { role: string, content: string }[], images?: string[]) {
  try {
    let userText = prompt;
    
    if (images && images.length > 0) {
      userText = `[ATTACHED IMAGES: ${images.length}]\n\n${prompt}`;
    }

    // Primary: local serverless proxy endpoint (avoids browser CORS issues)
    try {
      const response = await axios.post(`/api/chat`, {
        text: userText,
        history: history.slice(-10),
        prompt: SYSTEM_PROMPT
      }, { timeout: 70000 });
      const result = response.data?.result || response.data?.message || response.data?.data || response.data;
      if (typeof result === "string" && result.trim().length > 0) return result;
      if (typeof result?.result === "string" && result.result.trim().length > 0) return result.result;
      if (result) return JSON.stringify(result);
    } catch (proxyError) {
      console.warn("Name-AI proxy failed", proxyError);
    }
    return "ERROR: AI proxy failed. Please check /api/chat deployment logs.";
  } catch (error: any) {
    console.error("Name-AI Critical Failure:", error);
    return `CRITICAL SYSTEM ERROR [NAME-AI]: ${error.message}`;
  }
}
