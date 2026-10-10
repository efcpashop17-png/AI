import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
const app = express();
const PORT = process.env.PORT || 3e3;
const EASYSLIP_TOKEN = process.env.EASYSLIP_API_KEY || "c16cec69-0221-40c7-a2e1-71abd59a745c";
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});
process.on("uncaughtException", (err) => {
  console.error("[Server Error] Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Server Error] Unhandled Rejection:", reason);
});
const slipVerificationCache = /* @__PURE__ */ new Map();
app.get("/api/easyslip/info", async (_req, res) => {
  try {
    const response = await fetch("https://api.easyslip.com/v2/info", {
      headers: {
        Authorization: `Bearer ${EASYSLIP_TOKEN}`
      },
      signal: AbortSignal.timeout(6e3)
      // Prevent hanging Nginx gateway timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("EasySlip info fetch error:", err);
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
      }),
      signal: AbortSignal.timeout(12e3)
      // Max 12s timeout to avoid Nginx 504
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
const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const ORDERS_SAFE_BACKUP = path.join(DATA_DIR, "orders.safe_backup.json");
const DELETED_ORDERS_FILE = path.join(DATA_DIR, "deleted_order_ids.json");
const CUSTOMERS_FILE = path.join(DATA_DIR, "customers.json");
const CUSTOMERS_SAFE_BACKUP = path.join(DATA_DIR, "customers.safe_backup.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const SETTINGS_SAFE_BACKUP = path.join(DATA_DIR, "settings.safe_backup.json");
const GAMES_FILE = path.join(DATA_DIR, "games.json");
const BACKUPS_DIR = path.join(DATA_DIR, "backups");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
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
const sseClients = /* @__PURE__ */ new Set();
const MAX_CONCURRENT_SSE = 30;
app.get("/api/data/events", (req, res) => {
  req.socket?.setTimeout(0);
  req.socket?.setNoDelay(true);
  req.socket?.setKeepAlive(true, 1e4);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform, no-store");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  if (sseClients.size >= MAX_CONCURRENT_SSE) {
    const firstClient = sseClients.values().next().value;
    if (firstClient) {
      try {
        firstClient.write(`data: ${JSON.stringify({ type: "reconnect", reason: "rotation" })}

`);
        firstClient.end();
      } catch (_) {
      }
      sseClients.delete(firstClient);
    }
  }
  sseClients.add(res);
  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    clearInterval(heartbeat);
    clearTimeout(maxLifetime);
    sseClients.delete(res);
  };
  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}

`);
  const heartbeat = setInterval(() => {
    if (cleanedUp) return;
    try {
      res.write(`data: ${JSON.stringify({ type: "heartbeat", timestamp: Date.now() })}

`);
    } catch (_) {
      cleanup();
    }
  }, 15e3);
  const maxLifetime = setTimeout(() => {
    if (cleanedUp) return;
    try {
      res.write(`data: ${JSON.stringify({ type: "reconnect", timestamp: Date.now() })}

`);
      res.end();
    } catch (_) {
    }
    cleanup();
  }, 45e3);
  req.on("close", cleanup);
  req.on("error", cleanup);
  res.on("close", cleanup);
  res.on("finish", cleanup);
  res.on("error", cleanup);
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
let memoryOrders = [];
let memoryCustomers = [];
let memoryGames = null;
let memorySettings = null;
let memoryDeletedOrderIds = [];
let lastSnapshotTime = 0;
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
  memoryDeletedOrderIds = readJsonFile(DELETED_ORDERS_FILE, []);
  if (!Array.isArray(memoryDeletedOrderIds)) {
    memoryDeletedOrderIds = [];
  }
  const deletedSet = new Set(memoryDeletedOrderIds.map((d) => String(d || "").trim().toLowerCase()));
  memoryOrders = readJsonFile(ORDERS_FILE, []);
  if (Array.isArray(memoryOrders)) {
    memoryOrders = memoryOrders.filter((o) => {
      if (!o || !o.id) return false;
      const cleanId = String(o.id).trim().toLowerCase();
      return !deletedSet.has(cleanId) && cleanId !== "gp-test-sync-1";
    });
  } else {
    memoryOrders = [];
  }
  if (memoryOrders.length === 0 && fs.existsSync(ORDERS_SAFE_BACKUP)) {
    try {
      const backupOrders = JSON.parse(fs.readFileSync(ORDERS_SAFE_BACKUP, "utf-8"));
      if (Array.isArray(backupOrders) && backupOrders.length > 0) {
        memoryOrders = backupOrders.filter((o) => {
          if (!o || !o.id) return false;
          const cleanId = String(o.id).trim().toLowerCase();
          return !deletedSet.has(cleanId) && cleanId !== "gp-test-sync-1";
        });
        console.log(`[Auto-Recovery] Initialized ${memoryOrders.length} orders from safe backup`);
      }
    } catch (_) {
    }
  }
  writeJsonFile(ORDERS_FILE, memoryOrders);
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
  if (Array.isArray(memoryGames)) {
    memoryGames = memoryGames.map((g) => {
      if (g && Array.isArray(g.packages)) {
        const seen = /* @__PURE__ */ new Set();
        const uniquePackages = g.packages.filter((p) => {
          if (!p || !p.id) return false;
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        return { ...g, packages: uniquePackages };
      }
      return g;
    });
    writeJsonFile(GAMES_FILE, memoryGames);
  }
  memorySettings = readJsonFile(SETTINGS_FILE, null);
  if (!memorySettings && fs.existsSync(SETTINGS_SAFE_BACKUP)) {
    try {
      memorySettings = JSON.parse(fs.readFileSync(SETTINGS_SAFE_BACKUP, "utf-8"));
      writeJsonFile(SETTINGS_FILE, memorySettings);
      console.log(`[Auto-Recovery] Initialized settings from safe backup`);
    } catch (_) {
    }
  }
  if (!memorySettings) {
    memorySettings = { logoUrl: "/logo.png" };
    writeJsonFile(SETTINGS_FILE, memorySettings);
    writeJsonFile(SETTINGS_SAFE_BACKUP, memorySettings);
  }
  console.log(`[Database Loaded] Orders: ${memoryOrders.length}, Customers: ${memoryCustomers.length}, Games: ${memoryGames ? memoryGames.length : 0}, Deleted: ${memoryDeletedOrderIds.length}`);
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
  const deletedSet = new Set(memoryDeletedOrderIds.map((d) => String(d || "").trim().toLowerCase()));
  const cleanOrders = memoryOrders.filter((o) => o && o.id && !deletedSet.has(String(o.id).trim().toLowerCase()));
  res.json({
    success: true,
    orders: cleanOrders,
    deletedOrderIds: memoryDeletedOrderIds,
    customers: memoryCustomers,
    settings: memorySettings,
    games: memoryGames,
    timestamp: Date.now()
  });
});
app.get("/api/data/orders", (_req, res) => {
  const deletedSet = new Set(memoryDeletedOrderIds.map((d) => String(d || "").trim().toLowerCase()));
  const cleanOrders = memoryOrders.filter((o) => o && o.id && !deletedSet.has(String(o.id).trim().toLowerCase()));
  res.json(cleanOrders);
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
        const pkgs = currentGames[gIndex].packages || [];
        const existingIdx = pkgs.findIndex((p) => p.id === incoming.package.id);
        if (existingIdx >= 0) {
          pkgs[existingIdx] = { ...pkgs[existingIdx], ...incoming.package };
        } else {
          pkgs.push(incoming.package);
        }
        const seenPkgIds = /* @__PURE__ */ new Set();
        currentGames[gIndex].packages = pkgs.filter((p) => {
          if (!p || !p.id) return false;
          if (seenPkgIds.has(p.id)) return false;
          seenPkgIds.add(p.id);
          return true;
        });
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
    const finalGames = Array.from(mergedMap.values()).map((g) => {
      if (g && Array.isArray(g.packages)) {
        const seen = /* @__PURE__ */ new Set();
        const uniquePackages = g.packages.filter((p) => {
          if (!p || !p.id) return false;
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        return { ...g, packages: uniquePackages };
      }
      return g;
    });
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
    writeJsonFile(SETTINGS_SAFE_BACKUP, incoming);
    broadcastEvent("settings_updated", { settings: incoming });
    res.json({ success: true, settings: incoming });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});
app.get("/api/admin/logo", (_req, res) => {
  const logo = memorySettings && memorySettings.logoUrl ? memorySettings.logoUrl : "/logo.png";
  res.json({ success: true, logoUrl: logo });
});
app.post("/api/admin/logo", (req, res) => {
  try {
    const { logoUrl, logoBase64 } = req.body;
    if (!logoUrl && !logoBase64) {
      return res.status(400).json({ success: false, error: "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E23\u0E39\u0E1B\u0E20\u0E32\u0E1E\u0E2B\u0E23\u0E37\u0E2D URL \u0E42\u0E25\u0E42\u0E01\u0E49" });
    }
    let finalLogoUrl = logoUrl;
    if (logoBase64 && typeof logoBase64 === "string" && logoBase64.includes("base64,")) {
      const matches = logoBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      const ext = matches ? matches[1] === "jpeg" ? "jpg" : matches[1] : "png";
      const dataPart = matches ? matches[2] : logoBase64;
      const buffer = Buffer.from(dataPart, "base64");
      const filename = `shop_logo_${Date.now()}.${ext}`;
      const uploadPath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(uploadPath, buffer);
      try {
        fs.writeFileSync(path.join(process.cwd(), "public", "logo.png"), buffer);
      } catch (_) {
      }
      try {
        const distLogoPath = path.join(process.cwd(), "dist", "logo.png");
        if (fs.existsSync(path.dirname(distLogoPath))) {
          fs.writeFileSync(distLogoPath, buffer);
        }
      } catch (_) {
      }
      finalLogoUrl = `/uploads/${filename}`;
    }
    if (!memorySettings || typeof memorySettings !== "object") {
      memorySettings = {};
    }
    memorySettings.logoUrl = finalLogoUrl;
    memorySettings.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    writeJsonFile(SETTINGS_FILE, memorySettings);
    writeJsonFile(SETTINGS_SAFE_BACKUP, memorySettings);
    createBackupSnapshotThrottled("settings_snapshot", memorySettings);
    broadcastEvent("settings_updated", { settings: memorySettings });
    console.log(`[Admin Logo Updated] New logoUrl: ${finalLogoUrl}`);
    res.json({ success: true, logoUrl: finalLogoUrl, settings: memorySettings });
  } catch (err) {
    console.error("Admin logo update error:", err);
    res.status(500).json({ success: false, error: String(err) });
  }
});
app.post("/api/data/orders", (req, res) => {
  try {
    const incoming = req.body;
    const items = Array.isArray(incoming) ? incoming : incoming.order ? [incoming.order] : [incoming];
    const deletedSet = new Set(memoryDeletedOrderIds.map((d) => String(d || "").trim().toLowerCase()));
    let modified = false;
    for (const item of items) {
      if (!item || !item.id) continue;
      const itemClean = String(item.id).trim().toLowerCase();
      if (deletedSet.has(itemClean)) {
        continue;
      }
      const index = memoryOrders.findIndex((o) => String(o?.id || "").trim().toLowerCase() === itemClean);
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
      broadcastEvent("orders_updated", { orders: memoryOrders, deletedOrderIds: memoryDeletedOrderIds });
    }
    res.json({ success: true, count: memoryOrders.length, orders: memoryOrders });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});
app.delete("/api/data/orders/:id", (req, res) => {
  try {
    const rawId = String(req.params.id || "").trim();
    const cleanId = rawId.toLowerCase();
    memoryOrders = memoryOrders.filter((o) => {
      const oId = String(o?.id || "").trim().toLowerCase();
      return oId !== cleanId;
    });
    writeJsonFile(ORDERS_FILE, memoryOrders);
    if (!memoryDeletedOrderIds.some((d) => String(d || "").trim().toLowerCase() === cleanId)) {
      memoryDeletedOrderIds.push(rawId);
      if (memoryDeletedOrderIds.length > 5e3) {
        memoryDeletedOrderIds = memoryDeletedOrderIds.slice(-5e3);
      }
      writeJsonFile(DELETED_ORDERS_FILE, memoryDeletedOrderIds);
    }
    createBackupSnapshotThrottled("orders_snapshot", memoryOrders);
    broadcastEvent("orders_updated", { orders: memoryOrders, deletedId: rawId, deletedOrderIds: memoryDeletedOrderIds });
    res.json({ success: true, count: memoryOrders.length, deletedId: rawId });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});
app.get("/api/data/customers", (_req, res) => {
  res.json(memoryCustomers);
});
app.post("/api/data/customers/restore", (_req, res) => {
  try {
    if (fs.existsSync(CUSTOMERS_SAFE_BACKUP)) {
      memoryCustomers = JSON.parse(fs.readFileSync(CUSTOMERS_SAFE_BACKUP, "utf-8"));
      writeJsonFile(CUSTOMERS_FILE, memoryCustomers);
      broadcastEvent("customers_updated", { customers: memoryCustomers });
      return res.json({ success: true, count: memoryCustomers.length, customers: memoryCustomers });
    }
    res.json({ success: true, count: memoryCustomers.length, customers: memoryCustomers });
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
app.get("/download-project.tar.gz", (_req, res) => {
  const filePath = path.join(process.cwd(), "dist", "deploy.tar.gz");
  if (fs.existsSync(filePath)) {
    res.download(filePath, "efcpa-stock-app.tar.gz");
  } else {
    res.status(404).send("File not found");
  }
});
app.use((err, _req, res, _next) => {
  console.error("[Express Error Handler]:", err);
  if (!res.headersSent) {
    res.status(500).json({ success: false, error: "Internal Server Error", message: err?.message });
  }
});
const distPath = path.join(process.cwd(), "dist");
const distHtml = path.join(distPath, "index.html");
async function startServer() {
  const isDev = process.env.NODE_ENV !== "production";
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
  const rawPort = process.env.PORT || 3e3;
  const isNumeric = !isNaN(Number(rawPort));
  if (isNumeric) {
    const portNumber = Number(rawPort);
    app.listen(portNumber, "0.0.0.0", () => {
      console.log(`EF CPA Shop server active and listening on port ${portNumber} (dev: ${isDev})`);
    });
  } else {
    app.listen(rawPort, () => {
      console.log(`EF CPA Shop server active and listening on socket ${rawPort} (dev: ${isDev})`);
    });
  }
}
startServer();
var server_default = app;
export {
  app,
  server_default as default
};
