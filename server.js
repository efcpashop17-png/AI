import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const EASYSLIP_TOKEN = process.env.EASYSLIP_API_KEY || '80577a63-8428-40cd-999d-be9669474c76';

// Body parsers for slip image data
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "EF CPA Shop",
    easySlipConfigured: !!EASYSLIP_TOKEN,
    timestamp: new Date().toISOString(),
  });
});

// EasySlip Proxy Verification Endpoint
app.post("/api/verify-slip", async (req, res) => {
  try {
    const { image, payload } = req.body;
    if (!image && !payload) {
      return res.status(400).json({
        success: false,
        error: { message: "Image or payload is required" },
      });
    }

    const response = await fetch("https://developer.easyslip.com/api/v1/verify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EASYSLIP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: image || payload,
      }),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("EasySlip server proxy error:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to connect to EasySlip verification server" },
    });
  }
});

// Download Endpoint for manual Hostinger deployment
app.get("/download-project.zip", (req, res) => {
  const filePath = path.join(__dirname, "dist", "deploy.zip");
  if (fs.existsSync(filePath)) {
    res.download(filePath, "efcpa-stock-app.zip");
  } else {
    res.status(404).send("File not found");
  }
});

const distHtml = path.join(__dirname, "dist", "index.html");
const isProduction = process.env.NODE_ENV === "production" || (!process.env.NODE_ENV && fs.existsSync(distHtml));

if (!isProduction && (!fs.existsSync(distHtml) || process.env.NODE_ENV === "development")) {
  try {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } catch (err) {
    console.warn("Failed to load Vite middleware, falling back to static files:", err);
  }
}

if (fs.existsSync(path.join(__dirname, "dist"))) {
  app.use(express.static(path.join(__dirname, "dist")));
}
app.use("/public", express.static(path.join(__dirname, "public")));
if (fs.existsSync(path.join(__dirname, "dist", "public"))) {
  app.use("/public", express.static(path.join(__dirname, "dist", "public")));
}

app.get("*", (req, res) => {
  if (fs.existsSync(distHtml)) {
    res.sendFile(distHtml);
  } else {
    res.status(503).send("Application is starting or building. Please refresh in a moment.");
  }
});

if (isNaN(Number(PORT))) {
  app.listen(PORT, () => {
    console.log(`Server running on socket ${PORT}`);
  });
} else {
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
