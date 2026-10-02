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

// Health Check Endpoint for Hostinger / NGINX uptime monitoring
app.get("/api/health", (req, res) => {
  res.status(200).json({
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

// Download Endpoint for backup
app.get("/download-project.zip", (req, res) => {
  const filePath = path.join(__dirname, "dist", "deploy.zip");
  if (fs.existsSync(filePath)) {
    res.download(filePath, "efcpa-stock-app.zip");
  } else {
    res.status(404).send("File not found");
  }
});

const distHtml = path.join(__dirname, "dist", "index.html");

// Serve static frontend files from dist and public directories
if (fs.existsSync(path.join(__dirname, "dist"))) {
  app.use(express.static(path.join(__dirname, "dist")));
}
app.use(express.static(path.join(__dirname, "public")));
app.use("/public", express.static(path.join(__dirname, "public")));
if (fs.existsSync(path.join(__dirname, "dist", "public"))) {
  app.use("/public", express.static(path.join(__dirname, "dist", "public")));
}

// Fallback to index.html for all SPA routes
app.get("*", (req, res) => {
  if (fs.existsSync(distHtml)) {
    res.sendFile(distHtml);
  } else if (fs.existsSync(path.join(__dirname, "index.html"))) {
    res.sendFile(path.join(__dirname, "index.html"));
  } else {
    res.status(200).send("<!DOCTYPE html><html><head><title>EF CPA Shop</title></head><body><h1>EF CPA Shop</h1><p>Starting up... please refresh in a moment.</p></body></html>");
  }
});

// Global error handlers
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

// Start listening dynamically on process.env.PORT, binding to 0.0.0.0
const serverPort = isNaN(Number(PORT)) ? PORT : Number(PORT);
if (typeof serverPort === "number") {
  app.listen(serverPort, "0.0.0.0", () => {
    console.log(`EF CPA Shop server active and listening on port ${serverPort}`);
  });
} else {
  app.listen(serverPort, () => {
    console.log(`EF CPA Shop server listening on socket ${serverPort}`);
  });
}

export default app;
