import "dotenv/config";
import express from "express";
import http from "http";
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

// Prevent all HTTP caching for API routes across devices & LiteSpeed/Cloudflare
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

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
const DELETED_ORDERS_FILE = path.join(DATA_DIR, "deleted_order_ids.json");
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

// In-memory data store for sub-millisecond responses and zero-blocking I/O
const memoryCache = new Map();
const lastSnapshotTime = new Map();

function readJsonFile(filePath, defaultData = []) {
  if (memoryCache.has(filePath)) {
    return memoryCache.get(filePath);
  }
  try {
    if (!fs.existsSync(filePath)) {
      memoryCache.set(filePath, defaultData);
      return defaultData;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content || !content.trim()) {
      memoryCache.set(filePath, defaultData);
      return defaultData;
    }
    const parsed = JSON.parse(content);
    memoryCache.set(filePath, parsed);
    return parsed;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    memoryCache.set(filePath, defaultData);
    return defaultData;
  }
}

function writeJsonFile(filePath, data) {
  // 1. Immediately update memory cache for instant reads
  memoryCache.set(filePath, data);

  // 2. Write to disk asynchronously in background without blocking the event loop
  setImmediate(async () => {
    try {
      await fs.promises.writeFile(filePath, JSON.stringify(data), "utf-8");
    } catch (err) {
      console.error(`Async write error for ${filePath}:`, err);
    }
  });
  return true;
}

function createBackupSnapshot(prefix, data) {
  const now = Date.now();
  const lastTime = lastSnapshotTime.get(prefix) || 0;
  // Limit snapshots to at most once every 30 minutes to eliminate disk I/O load
  if (now - lastTime < 30 * 60 * 1000) {
    return;
  }
  lastSnapshotTime.set(prefix, now);

  setImmediate(async () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = path.join(BACKUPS_DIR, `${prefix}_${timestamp}.json`);
      await fs.promises.writeFile(backupPath, JSON.stringify(data), "utf-8");
    } catch (_) {}
  });
}

// 1. Get all persistent orders and customer accounts
app.get("/api/data/all", (req, res) => {
  const orders = readJsonFile(ORDERS_FILE, []);
  const deletedOrderIds = readJsonFile(DELETED_ORDERS_FILE, []);
  const deletedSet = new Set(deletedOrderIds);
  const activeOrders = orders.filter(o => !deletedSet.has(o.id));
  const customers = readJsonFile(CUSTOMERS_FILE, []);
  const games = readJsonFile(GAMES_FILE, null);
  res.json({
    success: true,
    orders: activeOrders,
    deletedOrderIds,
    customers,
    games,
    settings: readJsonFile(SETTINGS_FILE, null),
    timestamp: Date.now(),
  });
});

// 1.1 Dedicated endpoint to get orders (excludes permanently deleted orders)
app.get("/api/data/orders", (req, res) => {
  const orders = readJsonFile(ORDERS_FILE, []);
  const deletedOrderIds = readJsonFile(DELETED_ORDERS_FILE, []);
  const deletedSet = new Set(deletedOrderIds);
  const activeOrders = orders.filter(o => !deletedSet.has(o.id));
  res.json(activeOrders);
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
      let gIndex = currentGames.findIndex(g => g.id === incoming.gameId);
      if (gIndex === -1) {
        gIndex = currentGames.findIndex(g => g.packages && g.packages.some(p => p.id === incoming.packageId));
      }
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
    const deletedOrderIds = readJsonFile(DELETED_ORDERS_FILE, []);
    const deletedSet = new Set(deletedOrderIds);
    const items = Array.isArray(incoming) ? incoming : (incoming.order ? [incoming.order] : [incoming]);

    for (const item of items) {
      if (!item || !item.id) continue;
      // Do NOT allow resurrection of permanently deleted orders
      if (deletedSet.has(item.id)) continue;

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

// 3. Admin Delete order (Permanently deletes and blacklists to prevent bouncing back)
app.delete("/api/data/orders/:id", (req, res) => {
  try {
    const { id } = req.params;
    let currentOrders = readJsonFile(ORDERS_FILE, []);
    createBackupSnapshot("orders_before_admin_delete", currentOrders);
    currentOrders = currentOrders.filter(o => o.id !== id);
    writeJsonFile(ORDERS_FILE, currentOrders);

    // Record tombstone so no stale client/sync can ever bring it back
    let deletedOrderIds = readJsonFile(DELETED_ORDERS_FILE, []);
    if (!deletedOrderIds.includes(id)) {
      deletedOrderIds.push(id);
      if (deletedOrderIds.length > 5000) {
        deletedOrderIds = deletedOrderIds.slice(-5000);
      }
      writeJsonFile(DELETED_ORDERS_FILE, deletedOrderIds);
    }

    res.json({ success: true, count: currentOrders.length, deletedId: id });
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

// Create HTTP server and listen on PORT (supports Nginx and Passenger without restrictive host binding)
const server = http.createServer(app);
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

server.listen(PORT, () => {
  console.log(`EF CPA Shop server active and listening on port ${PORT}`);
});

export { app, server };
export default app;
