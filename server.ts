import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Scan
  app.post("/api/scan", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      console.log(`[Dev-Pulse] Starting scan for: ${url}`);
      
      const browser = await chromium.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
      });
      const page = await context.newPage();
      
      // Navigate to URL
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Take screenshot
      const screenshotBuffer = await page.screenshot({ type: 'png' });
      const base64Screenshot = screenshotBuffer.toString('base64');
      
      await browser.close();

      res.json({ 
        screenshot: base64Screenshot,
        mimeType: 'image/png'
      });
    } catch (error) {
      console.error("[Dev-Pulse] Scan error:", error);
      res.status(500).json({ 
        error: "Failed to take screenshot", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "dev-pulse-server" });
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
    console.log(`[Dev-Pulse] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
