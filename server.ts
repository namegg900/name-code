import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.get('/favicon.ico', (_req, res) => res.status(204).end());

  // List of Gemini API Keys for rotation
  const GEMINI_KEYS = [
    "AQ.Ab8RN6LmRyOSAJRmEFxhSMqRBMx6m76toAwhxCjSLrsIJERSJg",
    "AQ.Ab8RN6KwjxXguwMWZZs-3kn9vCL9uLFYQS6p4yJYQxpuAMRQ1A",
    "AQ.Ab8RN6JAiMAMXp1k-_tpObkiDX3npE7gv7p9sKdsLV7hpNEmSg",
    "AQ.Ab8RN6I9Ih_tCuxi31A2xTffmMz92kVddPS4LrGrO27HmbNdpg",
    "AQ.Ab8RN6Ki8VvToG44ZSgCvZUXfCKNAITGQP-pQTQQVAwsr0W1vQ"
  ];
  let currentKeyIndex = 0;

  // Function to call Gemini with key rotation
  async function callGeminiDirect(text: string, history: any[], systemPrompt: string) {
    const maxRetries = GEMINI_KEYS.length;
    let lastError = null;

    // Convert history to Gemini format
    const contents = [];
    if (history && history.length > 0) {
      history.forEach(item => {
        contents.push({
          role: item.role === "assistant" ? "model" : "user",
          parts: [{ text: item.content }]
        });
      });
    }
    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: text }]
    });

    for (let i = 0; i < maxRetries; i++) {
      const apiKey = GEMINI_KEYS[currentKeyIndex];
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            system_instruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: contents,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            }
          },
          { timeout: 40000 }
        );

        const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (result) return result;
        throw new Error("Empty content from Gemini candidate");
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        console.warn(`Gemini Key ${currentKeyIndex} failed (Status: ${status}): ${error.message}.`);
        
        // Always rotate on failure
        currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
        
        // If we've tried all keys, break
        if (i === maxRetries - 1) break;
      }
    }
    throw lastError || new Error("All Gemini keys failed after rotation");
  }

  // AI Proxy Route to bypass CORS
  app.post("/api/chat", async (req, res) => {
    try {
      const { text, history, prompt: systemPrompt } = req.body;
      const nameAISystemPrompt = systemPrompt || "Kamu adalah Name-AI, AI yang ramah, hangat, dan menyenangkan saat diajak berbicara.";
      const COVENANT_KEY = "cov_live_54d5852a27b215169f91efefed500ffd187d20a3c1ed752c";
      const codingHint = /\b(code|coding|program|script|function|class|bug|debug|build|buat coding|bikin coding)\b/i.test(text || "");

      // Primary: Covenant API (DeepSeek + CodeGen)
      try {
        if (codingHint) {
          const codegenResponse = await axios.get("https://api.covenant.sbs/api/ai/codegen", {
            params: {
              prompt: text,
              lang: "javascript"
            },
            headers: { "x-api-key": COVENANT_KEY },
            timeout: 45000
          });
          const codegenResult = codegenResponse.data?.data?.result || codegenResponse.data?.result || codegenResponse.data?.message;
          if (codegenResult) {
            return res.json({ result: String(codegenResult) });
          }
        }

        const deepseekResponse = await axios.get("https://api.covenant.sbs/api/ai/deepseek", {
          params: { question: text, system: nameAISystemPrompt },
          headers: { "x-api-key": COVENANT_KEY },
          timeout: 45000
        });
        const deepseekResult = deepseekResponse.data?.data?.result || deepseekResponse.data?.result || deepseekResponse.data?.message;
        if (deepseekResult) {
          return res.json({ result: String(deepseekResult) });
        }
      } catch (covenantError: any) {
        console.warn("Covenant endpoint failed, trying Gemini/fallbacks...", covenantError.message);
      }
      
      // Primary: Rotating Gemini Keys
      try {
        const result = await callGeminiDirect(text, history || [], nameAISystemPrompt);
        return res.json({ result });
      } catch (geminiError: any) {
        console.warn("Rotating Gemini failed, trying fallbacks...", geminiError.message);
        
        // Fallback 1: Deline OpenAI
        try {
          const response = await axios.get("https://api.deline.web.id/ai/openai", {
            params: { text: text, prompt: nameAISystemPrompt },
            timeout: 40000,
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
          });
          const result = response.data.result || response.data.message || response.data;
          if (result && result !== "null" && result !== "") {
            return res.json({ result: typeof result === 'string' ? result : JSON.stringify(result) });
          }
        } catch (f1Error) {
          console.warn("Fallback 1 failed");
        }

        // Fallback 2: Ryhar Qwen-AI
        try {
          const response = await axios.post("https://api.ryhar.my.id/ai/qwen-ai", {
            text: `[SYSTEM: ${nameAISystemPrompt}]\n\n${text}`,
            history: history || []
          }, { timeout: 45000 });
          const result = response.data.result || response.data.message || response.data;
          if (result && result !== "null" && result !== "") {
            return res.json({ result: typeof result === 'string' ? result : JSON.stringify(result) });
          }
        } catch (f2Error) {
          console.warn("Fallback 2 failed");
        }

        return res.status(503).json({ error: "All AI services are currently overloaded. Please try again." });
      }
    } catch (error: any) {
      console.error("Server Proxy Error:", error.message);
      res.status(500).json({
        error: error.message,
        details: "AI API Failure"
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
