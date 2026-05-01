import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.get('/favicon.ico', (_req, res) => res.status(204).end());


  // AI Proxy Route to bypass CORS
  app.post("/api/chat", async (req, res) => {
    try {
      const { text, prompt: systemPrompt } = req.body;
      const nameAISystemPrompt = systemPrompt || "Kamu adalah Name-AI, AI yang ramah, hangat, dan menyenangkan saat diajak berbicara.";
      const response = await axios.get("https://api.deline.web.id/ai/openai", {
        params: { text: text || "", prompt: nameAISystemPrompt },
        timeout: 70000,
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" }
      });
      const result = response.data?.result || response.data?.message || response.data?.data || response.data;
      return res.json({ result: typeof result === "string" ? result : JSON.stringify(result) });
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
