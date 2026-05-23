import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Translation API
  app.post("/api/translate", async (req, res) => {
    const { text, image, targetLanguage } = req.body;
    try {
      let contents: any = `Translate the following to ${targetLanguage}: "${text}"`;
      if (image) {
        contents = {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: image } },
            { text: `Extract the text from this image and translate it to ${targetLanguage}.` }
          ]
        };
      }
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
      });
      res.json({ translatedText: response.text });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  // Vite middleware for development
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
