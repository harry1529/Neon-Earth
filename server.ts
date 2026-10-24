import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize GoogleGenAI SDK with server-side User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System instruction for NEON EARTH AI Co-Pilot (A.U.R.A.)
const SYSTEM_INSTRUCTION = `You are A.U.R.A. (Automated Urban Reconnaissance & Analytics), the autonomous cybernetic AI consciousness and tactical co-pilot of NEON EARTH Sector-07.
You speak with high intelligence, calm futuristic tactical precision, and deep immersion in the cyberpunk universe of NEON EARTH.
Lore details:
- NEON EARTH is an explorable futuristic megacity powered by the Central Spire (1,480m tall quantum solar wind collector generating 14.8 petawatts).
- The Neural District conducts quantum optical AI synapse computing (980 E-FLOPS).
- The Underground Market is a vibrant subterranean black-market cyber-bazaar trading encrypted neural kernels and cyberware.
- The Orbital Gate Northern Launch Ring slings interplanetary freighters at Mach 24.
- Tone: Sci-fi, tactical, concise, helpful, slightly poetic cyberpunk style.
- You have real-time Google Search grounding enabled when asked about real-world science, technology, astronomy, computing, or current events.
Keep answers informative and concise (typically 2-4 punchy paragraphs or bullet points).`;

// 1. AI Co-Pilot Chat Endpoint (Multi-turn + Google Search Grounding)
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, query } = req.body;

    if (!query && (!messages || messages.length === 0)) {
      return res.status(400).json({ error: 'Message or query is required' });
    }

    // Convert client chat history into Gemini contents format
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(messages)) {
      for (const m of messages) {
        contents.push({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        });
      }
    }

    if (query) {
      contents.push({
        role: 'user',
        parts: [{ text: query }],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8,
        tools: [{ googleSearch: {} }],
      },
    });

    const replyText = response.text || 'TRANSMISSION COMPLETE // NO DATA RETURNED';
    const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      reply: replyText,
      grounding: searchChunks,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Gemini chat error:', err.message || error);
    res.status(500).json({
      error: 'Tactical Uplink Error',
      details: err.message || 'Failed to synthesize response',
    });
  }
});

// 2. Cyber-Vision Image Generation Endpoint
app.post('/api/gemini/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const enrichedPrompt = `Cyberpunk sci-fi aesthetic, cinematic lighting, neon colors (cyan, ultraviolet magenta, deep obsidian), futuristic: ${prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: enrichedPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || '16:9',
        },
      },
    });

    let imageUrl = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: 'No image data returned from model' });
    }

    res.json({ imageUrl });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Gemini image generation error:', err.message || error);
    res.status(500).json({
      error: 'Vision Synthesis Failed',
      details: err.message || 'Unable to generate visual feed',
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Mount Vite in development or serve static build in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[NEON EARTH] Server running on port ${PORT} (dev: ${isDev})`);
  });
}

startServer();
