import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const EASYSLIP_TOKEN = process.env.EASYSLIP_API_KEY || 'c16cec69-0221-40c7-a2e1-71abd59a745c';

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

// ==========================================
// Permanent Persistent Storage & Backup System
// Data is stored permanently in /data/orders.json and /data/customers.json
// Never deleted unless explicitly removed by Admin
// ==========================================
const DATA_DIR = path.join(__dirname, "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const CUSTOMERS_FILE = path.join(DATA_DIR, "customers.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const GAMES_FILE = path.join(DATA_DIR, "games.json");
const BACKUPS_DIR = path.join(DATA_DIR, "backups");
const UPLOADS_DIR = path.join(__dirname, "public", "uploads");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Static serving for uploaded files
app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/public/uploads", express.static(UPLOADS_DIR));

// Image Upload Endpoint (saves base64 data URL to permanent disk file)
app.post("/api/upload", (req, res) => {
  try {
    const { image, filename } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: "No image provided" });
    }

    // If it's already an http/https or /uploads URL, return as-is
    if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/uploads/') || image.startsWith('/public/uploads/'))) {
      return res.json({ success: true, url: image });
    }

    // Match base64 data URL
    const matches = String(image).match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    let ext = 'jpg';
    let buffer;
    if (matches) {
      ext = matches[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg');
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(String(image), 'base64');
    }

    const cleanName = filename ? filename.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30) : 'pkg';
    const safeFilename = `${cleanName}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const targetPath = path.join(UPLOADS_DIR, safeFilename);

    fs.writeFileSync(targetPath, buffer);
    const publicUrl = `/uploads/${safeFilename}`;
    res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

function readJsonFile(filePath, defaultData = []) {
  try {
    if (!fs.existsSync(filePath)) {
      // Auto-recover from latest backup snapshot if available
      const prefix = path.basename(filePath, ".json");
      if (fs.existsSync(BACKUPS_DIR)) {
        const backups = fs.readdirSync(BACKUPS_DIR)
          .filter(f => f.startsWith(`${prefix}_snapshot`) || f.startsWith(`${prefix}_`))
          .sort()
          .reverse();
        if (backups.length > 0) {
          try {
            const backupContent = fs.readFileSync(path.join(BACKUPS_DIR, backups[0]), "utf-8");
            const parsed = JSON.parse(backupContent);
            if (parsed && (Array.isArray(parsed) ? parsed.length > 0 : true)) {
              console.log(`[Auto-Recovery] Recovered ${filePath} from latest backup: ${backups[0]}`);
              writeJsonFile(filePath, parsed);
              return parsed;
            }
          } catch (_) {}
        }
      }
      return defaultData;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content || !content.trim()) {
      return defaultData;
    }
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultData;
  }
}

function writeJsonFile(filePath, data) {
  try {
    // Atomic write via temp file rename to prevent corrupted / truncated files during reads
    const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    console.error(`Error atomic writing ${filePath}:`, err);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      return true;
    } catch (e) {
      console.error(`Direct writing also failed for ${filePath}:`, e);
      return false;
    }
  }
}

function createBackupSnapshot(prefix, data) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(BACKUPS_DIR, `${prefix}_${timestamp}.json`);
    const tempPath = `${backupPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempPath, backupPath);
    
    const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.startsWith(prefix));
    if (files.length > 100) {
      files.sort().slice(0, files.length - 100).forEach(f => {
        try { fs.unlinkSync(path.join(BACKUPS_DIR, f)); } catch (_) {}
      });
    }
  } catch (e) {
    console.error("Backup snapshot error:", e);
  }
}

// 1. Get all persistent orders and customer accounts
app.get("/api/data/all", (req, res) => {
  const orders = readJsonFile(ORDERS_FILE, []);
  const customers = readJsonFile(CUSTOMERS_FILE, []);
  const games = readJsonFile(GAMES_FILE, null);
  res.json({
    success: true,
    orders,
    customers,
    games,
    settings: readJsonFile(SETTINGS_FILE, null),
    timestamp: Date.now(),
  });
});

// 1.2 Get/Update persistent games, packages, prices and thumbnails
app.get("/api/data/games", (req, res) => {
  const games = readJsonFile(GAMES_FILE, null);
  res.json({ success: true, games });
});

app.post("/api/data/games", (req, res) => {
  try {
    const incoming = req.body;
    let currentGames = readJsonFile(GAMES_FILE, []);

    // 1. Support single package update: { gameId, packageId, updates }
    if (incoming && incoming.gameId && incoming.packageId && incoming.updates) {
      const gIndex = currentGames.findIndex(g => g.id === incoming.gameId);
      if (gIndex >= 0) {
        currentGames[gIndex].packages = currentGames[gIndex].packages.map(p => 
          p.id === incoming.packageId ? { ...p, ...incoming.updates } : p
        );
        writeJsonFile(GAMES_FILE, currentGames);
        createBackupSnapshot("games_snapshot", currentGames);
        return res.json({ success: true, game: currentGames[gIndex] });
      }
    }

    // 2. Support add package: { action: 'add_package', gameId, package }
    if (incoming && incoming.action === 'add_package' && incoming.gameId && incoming.package) {
      const gIndex = currentGames.findIndex(g => g.id === incoming.gameId);
      if (gIndex >= 0) {
        currentGames[gIndex].packages = [...(currentGames[gIndex].packages || []), incoming.package];
        writeJsonFile(GAMES_FILE, currentGames);
        createBackupSnapshot("games_snapshot", currentGames);
        return res.json({ success: true, game: currentGames[gIndex] });
      }
    }

    // 3. Support delete package: { action: 'delete_package', gameId, packageId }
    if (incoming && incoming.action === 'delete_package' && incoming.gameId && incoming.packageId) {
      const gIndex = currentGames.findIndex(g => g.id === incoming.gameId);
      if (gIndex >= 0) {
        currentGames[gIndex].packages = (currentGames[gIndex].packages || []).filter(p => p.id !== incoming.packageId);
        writeJsonFile(GAMES_FILE, currentGames);
        createBackupSnapshot("games_snapshot", currentGames);
        return res.json({ success: true, game: currentGames[gIndex] });
      }
    }

    // 4. Support single game update: { gameId, updates }
    if (incoming && incoming.gameId && incoming.updates && !incoming.packageId) {
      const gIndex = currentGames.findIndex(g => g.id === incoming.gameId);
      if (gIndex >= 0) {
        currentGames[gIndex] = { ...currentGames[gIndex], ...incoming.updates };
        writeJsonFile(GAMES_FILE, currentGames);
        createBackupSnapshot("games_snapshot", currentGames);
        return res.json({ success: true, game: currentGames[gIndex] });
      }
    }

    // 5. Full games array update
    const gamesList = Array.isArray(incoming) ? incoming : (incoming.games || incoming);
    if (!Array.isArray(gamesList) || gamesList.length === 0) {
      return res.status(400).json({ success: false, error: "Invalid games array" });
    }

    // Merge incoming games with current games to never drop games
    const mergedMap = new Map();
    currentGames.forEach(g => mergedMap.set(g.id, g));
    gamesList.forEach(g => {
      if (g && g.id) {
        mergedMap.set(g.id, g);
      }
    });

    const finalGames = Array.from(mergedMap.values());
    writeJsonFile(GAMES_FILE, finalGames);
    createBackupSnapshot("games_snapshot", finalGames);
    res.json({ success: true, count: finalGames.length });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// 1.5 Persist system & payment settings
app.post("/api/data/settings", (req, res) => {
  try {
    const incoming = req.body;
    writeJsonFile(SETTINGS_FILE, incoming);
    res.json({ success: true, settings: incoming });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// 2. Persist single or multiple orders (Upsert)
app.post("/api/data/orders", (req, res) => {
  try {
    const incoming = req.body;
    let currentOrders = readJsonFile(ORDERS_FILE, []);
    const items = Array.isArray(incoming) ? incoming : (incoming.order ? [incoming.order] : [incoming]);

    for (const item of items) {
      if (!item || !item.id) continue;
      const index = currentOrders.findIndex(o => o.id === item.id);
      if (index >= 0) {
        currentOrders[index] = { ...currentOrders[index], ...item };
      } else {
        currentOrders.unshift(item);
      }
    }
    writeJsonFile(ORDERS_FILE, currentOrders);
    createBackupSnapshot("orders_snapshot", currentOrders);
    res.json({ success: true, count: currentOrders.length });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// 3. Admin Delete order (Only manual deletion permitted)
app.delete("/api/data/orders/:id", (req, res) => {
  try {
    const { id } = req.params;
    let currentOrders = readJsonFile(ORDERS_FILE, []);
    createBackupSnapshot("orders_before_admin_delete", currentOrders);
    currentOrders = currentOrders.filter(o => o.id !== id);
    writeJsonFile(ORDERS_FILE, currentOrders);
    res.json({ success: true, count: currentOrders.length });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// 4. Persist single or multiple customer users (Upsert)
app.post("/api/data/customers", (req, res) => {
  try {
    const incoming = req.body;
    let currentCustomers = readJsonFile(CUSTOMERS_FILE, []);
    const items = Array.isArray(incoming) ? incoming : (incoming.customer ? [incoming.customer] : [incoming]);

    for (const item of items) {
      if (!item || !item.id) continue;
      const index = currentCustomers.findIndex(c => c.id === item.id || (c.username && c.username.toLowerCase() === item.username.toLowerCase()));
      if (index >= 0) {
        currentCustomers[index] = { ...currentCustomers[index], ...item };
      } else {
        currentCustomers.push(item);
      }
    }
    writeJsonFile(CUSTOMERS_FILE, currentCustomers);
    createBackupSnapshot("customers_snapshot", currentCustomers);
    res.json({ success: true, count: currentCustomers.length });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// 5. Admin Delete customer user (Only manual deletion permitted)
app.delete("/api/data/customers/:id", (req, res) => {
  try {
    const { id } = req.params;
    let currentCustomers = readJsonFile(CUSTOMERS_FILE, []);
    createBackupSnapshot("customers_before_admin_delete", currentCustomers);
    currentCustomers = currentCustomers.filter(c => c.id !== id);
    writeJsonFile(CUSTOMERS_FILE, currentCustomers);
    res.json({ success: true, count: currentCustomers.length });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// 6. Direct JSON database backup download endpoint
app.get("/api/data/backup/download", (req, res) => {
  const orders = readJsonFile(ORDERS_FILE, []);
  const customers = readJsonFile(CUSTOMERS_FILE, []);
  const payload = {
    appName: "EF CPA Shop",
    exportTime: new Date().toISOString(),
    totalOrders: orders.length,
    totalCustomers: customers.length,
    orders,
    customers,
  };
  res.setHeader("Content-Disposition", `attachment; filename=efcpa_permanent_backup_${Date.now()}.json`);
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(payload, null, 2));
});

// Download Endpoint for backup
app.get("/download-project.tar.gz", (req, res) => {
  const filePath = path.join(__dirname, "public", "deploy.tar.gz");
  if (fs.existsSync(filePath)) {
    res.download(filePath, "efcpa-shop-latest.tar.gz");
  } else {
    res.status(404).send("File not found");
  }
});

app.get("/download-project.zip", (req, res) => {
  const filePath = path.join(__dirname, "dist", "deploy.zip");
  if (fs.existsSync(filePath)) {
    res.download(filePath, "efcpa-stock-app.zip");
  } else {
    res.status(404).send("File not found");
  }
});

const distPath = path.join(__dirname, "dist");
const distHtml = path.join(distPath, "index.html");

// Serve static frontend files from pre-built dist
if (fs.existsSync(distPath)) {
  app.use(
    express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else if (filePath.includes("/assets/")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    })
  );
}

app.use(express.static(path.join(__dirname, "public")));
app.use("/public", express.static(path.join(__dirname, "public")));
if (fs.existsSync(path.join(__dirname, "dist", "public"))) {
  app.use("/public", express.static(path.join(__dirname, "dist", "public")));
}

// Fallback to index.html for all SPA routes with no-cache headers
app.get("*", (req, res) => {
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
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
