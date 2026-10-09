// server.ts
import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
var app = express();
var PORT = process.env.PORT || 3e3;
var EASYSLIP_TOKEN = process.env.EASYSLIP_API_KEY || "c16cec69-0221-40c7-a2e1-71abd59a745c";
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});
var slipVerificationCache = /* @__PURE__ */ new Map();
app.get("/api/easyslip/info", async (_req, res) => {
  try {
    const response = await fetch("https://api.easyslip.com/v2/info", {
      headers: {
        Authorization: `Bearer ${EASYSLIP_TOKEN}`
      }
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ success: false, error: String(err) });
  }
});
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "EF CPA Shop",
    easySlipConfigured: !!EASYSLIP_TOKEN,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/verify-slip", async (req, res) => {
  try {
    const { image, payload } = req.body;
    if (!image && !payload) {
      return res.status(400).json({
        success: false,
        error: { message: "Image or payload is required" }
      });
    }
    const slipContent = String(image || payload);
    const slipHash = crypto.createHash("md5").update(slipContent.slice(0, 5e3) + slipContent.length).digest("hex");
    if (slipVerificationCache.has(slipHash)) {
      const cached = slipVerificationCache.get(slipHash);
      return res.status(cached.status).json({
        ...cached.data,
        cached: true,
        message: `${cached.data.message || ""} (\u0E14\u0E36\u0E07\u0E08\u0E32\u0E01\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E1B\u0E23\u0E30\u0E2B\u0E22\u0E31\u0E14\u0E40\u0E04\u0E23\u0E14\u0E34\u0E15 EasySlip)`.trim()
      });
    }
    const response = await fetch("https://developer.easyslip.com/api/v1/verify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EASYSLIP_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image: image || payload
      })
    });
    const data = await response.json();
    if (response.ok && data) {
      slipVerificationCache.set(slipHash, {
        status: response.status,
        data,
        cachedAt: Date.now()
      });
    }
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("EasySlip server proxy error:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to connect to EasySlip verification server" }
    });
  }
});
var DATA_DIR = path.join(process.cwd(), "data");
var ORDERS_FILE = path.join(DATA_DIR, "orders.json");
var ORDERS_SAFE_BACKUP = path.join(DATA_DIR, "orders.safe_backup.json");
var DELETED_ORDERS_FILE = path.join(DATA_DIR, "deleted_order_ids.json");
var CUSTOMERS_FILE = path.join(DATA_DIR, "customers.json");
var CUSTOMERS_SAFE_BACKUP = path.join(DATA_DIR, "customers.safe_backup.json");
var SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
var GAMES_FILE = path.join(DATA_DIR, "games.json");
var BACKUPS_DIR = path.join(DATA_DIR, "backups");
var UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOADS_DIR, {
  setHeaders: (res) => {
    res.setHeader("Cache-Control", "public, max-age=86400");
  }
}));
app.use("/public/uploads", express.static(UPLOADS_DIR, {
  setHeaders: (res) => {
    res.setHeader("Cache-Control", "public, max-age=86400");
  }
}));
var sseClients = /* @__PURE__ */ new Set();
app.get("/api/data/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform, no-store");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  sseClients.add(res);
  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}

`);
  const heartbeat = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({ type: "heartbeat", timestamp: Date.now() })}

`);
    } catch (_) {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 2e4);
  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});
function broadcastEvent(type, data) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}

`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (_) {
      sseClients.delete(client);
    }
  }
}
var memoryOrders = [];
var memoryCustomers = [];
var memoryGames = null;
var memorySettings = null;
var memoryDeletedOrderIds = [];
var lastSnapshotTime = 0;
function readJsonFile(filePath, defaultData = []) {
  try {
    if (!fs.existsSync(filePath)) {
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
    const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      return true;
    } catch (e) {
      console.error(`Direct fallback write failed for ${filePath}:`, e);
      return false;
    }
  }
}
function createBackupSnapshotThrottled(prefix, data) {
  const now = Date.now();
  if (now - lastSnapshotTime < 3e4) return;
  lastSnapshotTime = now;
  try {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(BACKUPS_DIR, `${prefix}_${timestamp}.json`);
    const tempPath = `${backupPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempPath, backupPath);
    const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.startsWith(prefix));
    if (files.length > 50) {
      files.sort().slice(0, files.length - 50).forEach((f) => {
        try {
          fs.unlinkSync(path.join(BACKUPS_DIR, f));
        } catch (_) {
        }
      });
    }
  } catch (e) {
    console.error("Backup snapshot error:", e);
  }
}
function loadDatabaseState() {
  memoryOrders = readJsonFile(ORDERS_FILE, []);
  if (memoryOrders.length === 0 && fs.existsSync(ORDERS_SAFE_BACKUP)) {
    try {
      memoryOrders = JSON.parse(fs.readFileSync(ORDERS_SAFE_BACKUP, "utf-8"));
      writeJsonFile(ORDERS_FILE, memoryOrders);
      console.log(`[Auto-Recovery] Initialized ${memoryOrders.length} orders from safe backup`);
    } catch (_) {
    }
  }
  if (memoryOrders.length === 0 && fs.existsSync(BACKUPS_DIR)) {
    try {
      const snapFiles = fs.readdirSync(BACKUPS_DIR).filter((f) => f.startsWith("orders_snapshot")).sort().reverse();
      if (snapFiles.length > 0) {
        memoryOrders = JSON.parse(fs.readFileSync(path.join(BACKUPS_DIR, snapFiles[0]), "utf-8"));
        writeJsonFile(ORDERS_FILE, memoryOrders);
        console.log(`[Auto-Recovery] Initialized ${memoryOrders.length} orders from snapshot ${snapFiles[0]}`);
      }
    } catch (_) {
    }
  }
  memoryOrders = memoryOrders.filter((o) => o && o.id !== "GP-TEST-SYNC-1");
  memoryCustomers = readJsonFile(CUSTOMERS_FILE, []);
  if (memoryCustomers.length === 0 && fs.existsSync(CUSTOMERS_SAFE_BACKUP)) {
    try {
      memoryCustomers = JSON.parse(fs.readFileSync(CUSTOMERS_SAFE_BACKUP, "utf-8"));
      writeJsonFile(CUSTOMERS_FILE, memoryCustomers);
      console.log(`[Auto-Recovery] Initialized ${memoryCustomers.length} customers from safe backup`);
    } catch (_) {
    }
  }
  memoryGames = readJsonFile(GAMES_FILE, null);
  memorySettings = readJsonFile(SETTINGS_FILE, null);
  memoryDeletedOrderIds = readJsonFile(DELETED_ORDERS_FILE, []);
  console.log(`[Database Loaded] Orders: ${memoryOrders.length}, Customers: ${memoryCustomers.length}, Games: ${memoryGames ? memoryGames.length : 0}`);
}
loadDatabaseState();
app.post("/api/upload", (req, res) => {
  try {
    const { image, filename } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: "No image provided" });
    }
    if (typeof image === "string" && (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/uploads/") || image.startsWith("/public/uploads/"))) {
      return res.json({ success: true, url: image });
    }
    const matches = String(image).match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    let ext = "jpg";
    let buffer;
    if (matches) {
      ext = matches[1].replace("jpeg", "jpg").replace("svg+xml", "svg");
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(String(image), "base64");
    }
    const cleanName = filename ? filename.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30) : "pkg";
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
app.get("/api/data/all", (_req, res) => {
  res.json({
    success: true,
    orders: memoryOrders,
    deletedOrderIds: memoryDeletedOrderIds,
    customers: memoryCustomers,
    settings: memorySettings,
    games: memoryGames,
    timestamp: Date.now()
  });
});
app.get("/api/data/orders", (_req, res) => {
  res.json(memoryOrders);
});
app.get("/api/data/games", (_req, res) => {
  res.json({ success: true, games: memoryGames });
});
app.post("/api/data/games", (req, res) => {
  try {
    const incoming = req.body;
    let currentGames = memoryGames || readJsonFile(GAMES_FILE, []);
    if (incoming && incoming.gameId && incoming.packageId && incoming.updates) {
      let gIndex = currentGames.findIndex((g) => g.id === incoming.gameId);
      if (gIndex === -1) {
        gIndex = currentGames.findIndex((g) => g.packages && g.packages.some((p) => p.id === incoming.packageId));
      }
      if (gIndex >= 0) {
        currentGames[gIndex].packages = currentGames[gIndex].packages.map(
          (p) => p.id === incoming.packageId ? { ...p, ...incoming.updates } : p
        );
        memoryGames = currentGames;
        writeJsonFile(GAMES_FILE, currentGames);
        createBackupSnapshotThrottled("games_snapshot", currentGames);
        broadcastEvent("games_updated", { games: currentGames });
        return res.json({ success: true, game: currentGames[gIndex] });
      }
    }
    if (incoming && incoming.action === "add_package" && incoming.gameId && incoming.package) {
      const gIndex = currentGames.findIndex((g) => g.id === incoming.gameId);
      if (gIndex >= 0) {
        currentGames[gIndex].packages = [...currentGames[gIndex].packages || [], incoming.package];
        memoryGames = currentGames;
        writeJsonFile(GAMES_FILE, currentGames);
        createBackupSnapshotThrottled("games_snapshot", currentGames);
        broadcastEvent("games_updated", { games: currentGames });
        return res.json({ success: true, game: currentGames[gIndex] });
      }
    }
    if (incoming && incoming.action === "delete_package" && incoming.gameId && incoming.packageId) {
      const gIndex = currentGames.findIndex((g) => g.id === incoming.gameId);
      if (gIndex >= 0) {
        currentGames[gIndex].packages = (currentGames[gIndex].packages || []).filter((p) => p.id !== incoming.packageId);
        memoryGames = currentGames;
        writeJsonFile(GAMES_FILE, currentGames);
        createBackupSnapshotThrottled("games_snapshot", currentGames);
        broadcastEvent("games_updated", { games: currentGames });
        return res.json({ success: true, game: currentGames[gIndex] });
      }
    }
    if (incoming && incoming.gameId && incoming.updates && !incoming.packageId) {
      const gIndex = currentGames.findIndex((g) => g.id === incoming.gameId);
      if (gIndex >= 0) {
        currentGames[gIndex] = { ...currentGames[gIndex], ...incoming.updates };
        memoryGames = currentGames;
        writeJsonFile(GAMES_FILE, currentGames);
        createBackupSnapshotThrottled("games_snapshot", currentGames);
        broadcastEvent("games_updated", { games: currentGames });
        return res.json({ success: true, game: currentGames[gIndex] });
      }
    }
    const gamesList = Array.isArray(incoming) ? incoming : incoming.games || incoming;
    if (!Array.isArray(gamesList) || gamesList.length === 0) {
      return res.status(400).json({ success: false, error: "Invalid games array" });
    }
    const mergedMap = /* @__PURE__ */ new Map();
    currentGames.forEach((g) => mergedMap.set(g.id, g));
    gamesList.forEach((g) => {
      if (g && g.id) {
        mergedMap.set(g.id, g);
      }
    });
    const finalGames = Array.from(mergedMap.values());
    memoryGames = finalGames;
    writeJsonFile(GAMES_FILE, finalGames);
    createBackupSnapshotThrottled("games_snapshot", finalGames);
    broadcastEvent("games_updated", { games: finalGames });
    res.json({ success: true, count: finalGames.length });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});
app.post("/api/data/settings", (req, res) => {
  try {
    const incoming = req.body;
    memorySettings = incoming;
    writeJsonFile(SETTINGS_FILE, incoming);
    broadcastEvent("settings_updated", { settings: incoming });
    res.json({ success: true, settings: incoming });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});
app.post("/api/data/orders", (req, res) => {
  try {
    const incoming = req.body;
    const items = Array.isArray(incoming) ? incoming : incoming.order ? [incoming.order] : [incoming];
    let modified = false;
    for (const item of items) {
      if (!item || !item.id) continue;
      const index = memoryOrders.findIndex((o) => o.id === item.id);
      if (index >= 0) {
        memoryOrders[index] = { ...memoryOrders[index], ...item };
      } else {
        memoryOrders.unshift(item);
      }
      modified = true;
    }
    if (modified) {
      writeJsonFile(ORDERS_FILE, memoryOrders);
      createBackupSnapshotThrottled("orders_snapshot", memoryOrders);
      broadcastEvent("orders_updated", { orders: memoryOrders });
    }
    res.json({ success: true, count: memoryOrders.length, orders: memoryOrders });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});
app.delete("/api/data/orders/:id", (req, res) => {
  try {
    const { id } = req.params;
    memoryOrders = memoryOrders.filter((o) => o.id !== id);
    writeJsonFile(ORDERS_FILE, memoryOrders);
    if (!memoryDeletedOrderIds.includes(id)) {
      memoryDeletedOrderIds.push(id);
      if (memoryDeletedOrderIds.length > 5e3) {
        memoryDeletedOrderIds = memoryDeletedOrderIds.slice(-5e3);
      }
      writeJsonFile(DELETED_ORDERS_FILE, memoryDeletedOrderIds);
    }
    broadcastEvent("orders_updated", { orders: memoryOrders, deletedId: id });
    res.json({ success: true, count: memoryOrders.length, deletedId: id });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});
app.post("/api/data/customers", (req, res) => {
  try {
    const incoming = req.body;
    const items = Array.isArray(incoming) ? incoming : incoming.customer ? [incoming.customer] : [incoming];
    for (const item of items) {
      if (!item || !item.id) continue;
      const index = memoryCustomers.findIndex((c) => c.id === item.id || c.username && c.username.toLowerCase() === item.username.toLowerCase());
      if (index >= 0) {
        memoryCustomers[index] = { ...memoryCustomers[index], ...item };
      } else {
        memoryCustomers.push(item);
      }
    }
    writeJsonFile(CUSTOMERS_FILE, memoryCustomers);
    createBackupSnapshotThrottled("customers_snapshot", memoryCustomers);
    broadcastEvent("customers_updated", { customers: memoryCustomers });
    res.json({ success: true, count: memoryCustomers.length });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});
app.delete("/api/data/customers/:id", (req, res) => {
  try {
    const { id } = req.params;
    memoryCustomers = memoryCustomers.filter((c) => c.id !== id);
    writeJsonFile(CUSTOMERS_FILE, memoryCustomers);
    broadcastEvent("customers_updated", { customers: memoryCustomers, deletedId: id });
    res.json({ success: true, count: memoryCustomers.length });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});
app.get("/api/data/backup/download", (_req, res) => {
  const orders = memoryOrders;
  const customers = memoryCustomers;
  const payload = {
    appName: "EF CPA Shop",
    exportTime: (/* @__PURE__ */ new Date()).toISOString(),
    totalOrders: orders.length,
    totalCustomers: customers.length,
    orders,
    customers
  };
  res.setHeader("Content-Disposition", `attachment; filename=efcpa_permanent_backup_${Date.now()}.json`);
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(payload, null, 2));
});
app.get("/download-project.zip", (_req, res) => {
  const filePath = path.join(process.cwd(), "dist", "deploy.zip");
  if (fs.existsSync(filePath)) {
    res.download(filePath, "efcpa-stock-app.zip");
  } else {
    res.status(404).send("File not found");
  }
});
var distPath = path.join(process.cwd(), "dist");
var distHtml = path.join(distPath, "index.html");
async function startServer() {
  const isDev = process.env.NODE_ENV === "development" && !fs.existsSync(distHtml);
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    app.get("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api/")) return next();
      try {
        const indexPath = path.join(process.cwd(), "index.html");
        let template = fs.readFileSync(indexPath, "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.use("/public", express.static(path.join(process.cwd(), "public")));
    app.get("*", (_req, res) => {
      if (fs.existsSync(distHtml)) {
        res.sendFile(distHtml);
      } else {
        res.status(503).send("Application is starting or building. Please refresh in a moment.");
      }
    });
  }
  const serverPort = Number(PORT) || 3e3;
  app.listen(serverPort, "0.0.0.0", () => {
    console.log(`EF CPA Shop server active and listening on port ${serverPort} (dev: ${isDev})`);
  });
}
startServer();
