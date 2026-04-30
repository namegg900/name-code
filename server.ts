import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // AI Proxy Route to bypass CORS
  app.post("/api/chat", async (req, res) => {
    try {
      const { text, history, prompt: systemPrompt } = req.body;
      const nameAISystemPrompt = systemPrompt || "Kamu adalah Name-AI, AI yang ramah, hangat, dan menyenangkan saat diajak berbicara.";
      
      // Fallback Chain Strategy
      // 1. Deline OpenAI (Primary for this prompt)
      // 2. Ryhar Qwen-AI
      // 3. Nexray LLamaCoder
      // 4. Bard-Google
      // 5. Native Gemini

      // Try Deline first as it seems more stable for the specific prompt
      try {
        const response = await axios.get("https://api.deline.web.id/ai/openai", {
          params: { 
            text: text,
            prompt: nameAISystemPrompt
          },
          timeout: 40000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
          }
        });
        
        const result = response.data.result || response.data.message || response.data;
        if (result && result !== "null" && result !== "") {
           return res.json({ result: typeof result === 'string' ? result : JSON.stringify(result) });
        }
        throw new Error("Invalid response from Deline");
      } catch (delineError: any) {
        console.warn("Deline failed, trying Fallback 1 (Ryhar)...", delineError.message);
        
        // Fallback 1: Ryhar Qwen-AI
        try {
          const response = await axios.post("https://api.ryhar.my.id/ai/qwen-ai", {
            text: `[SYSTEM: ${nameAISystemPrompt}]\n\n${text}`,
            history: history || []
          }, {
            timeout: 45000,
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
              'Referer': 'https://api.ryhar.my.id/'
            }
          });
          const result = response.data.result || response.data.message || response.data;
          if (result && result !== "null" && result !== "") {
            return res.json({ result: typeof result === 'string' ? result : JSON.stringify(result) });
          }
          throw new Error("Empty response from Ryhar");
        } catch (ryharError: any) {
          console.warn("Ryhar failed, trying Fallback 2 (Nexa)...", ryharError.message);

          // Fallback 2: Nexray LLamaCoder (Qwen3-Coder)
          try {
            const response = await axios.get("https://api.nexray.eu.cc/ai/llamacoder", {
              params: { model: "qwen3-coder", text: `[SYSTEM: ${nameAISystemPrompt}]\n\n${text}`.slice(0, 4000) },
              timeout: 45000,
              headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
            });
            const result = response.data.result || response.data.message || response.data;
            if (result && result !== "null" && result !== "") {
              return res.json({ result: typeof result === 'string' ? result : JSON.stringify(result) });
            }
            throw new Error("Empty response from Qwen3");
          } catch (qwenError: any) {
            console.warn("Fallback 2 failed, trying Fallback 3 (Bard)...", qwenError.message);
            
            // Fallback 3: Bard-Google
            try {
              const response = await axios.get("https://api-faa.my.id/faa/bard-google", {
                params: { query: text },
                timeout: 45000,
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'Mozilla/5.0 (Windows)',
                  'Referer': 'https://api-faa.my.id/'
                }
              });
              const result = response.data.result || response.data.message || response.data;
              if (result && result !== "null" && result !== "") {
                return res.json({ result: typeof result === 'string' ? result : JSON.stringify(result) });
              }
              throw new Error("Empty response");
            } catch (bardError: any) {
              console.warn("All custom APIs failed, jumping to Gemini...", bardError.message);
              try {
                const response = await axios.post("https://api-faa.my.id/faa/gemini-ai", {
                  text: text
                }, { timeout: 60000 });
                return res.json(response.data);
              } catch (geminiError: any) {
                console.error("TOTAL FAILURE: All fallbacks exhausted.");
                return res.status(503).json({ error: "Name-AI is currently busy. Please try again soon." });
              }
            }
          }
        }
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
