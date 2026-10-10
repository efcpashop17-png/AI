import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const app = express();
const PORT = process.env.PORT || 3000;

const EASYSLIP_TOKEN = process.env.EASYSLIP_API_KEY || 'c16cec69-0221-40c7-a2e1-71abd59a745c';

// Body parsers for slip image data
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Prevent all HTTP caching for API routes across devices & LiteSpeed/Cloudflare
app.use("/api", (_req: Request, res: Response, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

// Process safety handlers to prevent unhandled crashes on hosting providers
process.on("uncaughtException", (err) => {
  console.error("[Server Error] Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Server Error] Unhandled Rejection:", reason);
});

// Cache for verified slips to protect user quota & credits from being burned twice
const slipVerificationCache = new Map<string, { status: number; data: any; cachedAt: number }>();

// EasySlip Live Info & Quota Endpoint
app.get("/api/easyslip/info", async (_req: Request, res: Response) => {
  try {
    const response = await fetch("https://api.easyslip.com/v2/info", {
      headers: {
        Authorization: `Bearer ${EASYSLIP_TOKEN}`,
      },
      signal: AbortSignal.timeout(6000), // Prevent hanging Nginx gateway timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("EasySlip info fetch error:", err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

// Health Check Endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "EF CPA Shop",
    easySlipConfigured: !!EASYSLIP_TOKEN,
    timestamp: new Date().toISOString(),
  });
});

// EasySlip Proxy Verification Endpoint with Anti-Waste Slip Cache
app.post("/api/verify-slip", async (req: Request, res: Response) => {
  try {
    const { image, payload } = req.body;
    if (!image && !payload) {
      return res.status(400).json({
        success: false,
        error: { message: "Image or payload is required" },
      });
    }

    const slipContent = String(image || payload);
    const slipHash = crypto.createHash("md5").update(slipContent.slice(0, 5000) + slipContent.length).digest("hex");

    // If already verified before, return cached result immediately to save credits
    if (slipVerificationCache.has(slipHash)) {
      const cached = slipVerificationCache.get(slipHash)!;
      return res.status(cached.status).json({
        ...cached.data,
        cached: true,
        message: `${cached.data.message || ''} (ดึงจากประวัติเพื่อประหยัดเครดิต EasySlip)`.trim(),
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
      signal: AbortSignal.timeout(12000), // Max 12s timeout to avoid Nginx 504
    });

    const data = await response.json();
    if (response.ok && data) {
      slipVerificationCache.set(slipHash, {
        status: response.status,
        data,
        cachedAt: Date.now(),
      });
    }
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
// ==========================================
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

// Static serving for uploaded files
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

// ==========================================
// Real-Time Server-Sent Events (SSE) Bus (with Anti-Worker Exhaustion & Connection Recycling)
// ==========================================
const sseClients = new Set<Response>();
const MAX_CONCURRENT_SSE = 30;

app.get("/api/data/events", (req: Request, res: Response) => {
  // Prevent socket timeout errors
  req.socket?.setTimeout(0);
  req.socket?.setNoDelay(true);
  req.socket?.setKeepAlive(true, 10000);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform, no-store");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  // If too many clients connected to shared host, remove oldest to prevent 504 Gateway Timeout
  if (sseClients.size >= MAX_CONCURRENT_SSE) {
    const firstClient = sseClients.values().next().value;
    if (firstClient) {
      try {
        firstClient.write(`data: ${JSON.stringify({ type: "reconnect", reason: "rotation" })}\n\n`);
        firstClient.end();
      } catch (_) {}
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

  // Send initial connected payload
  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`);

  // Send heartbeat every 15s
  const heartbeat = setInterval(() => {
    if (cleanedUp) return;
    try {
      res.write(`data: ${JSON.stringify({ type: "heartbeat", timestamp: Date.now() })}\n\n`);
    } catch (_) {
      cleanup();
    }
  }, 15000);

  // Recycle connection cleanly after 45s so Hostinger/Nginx proxy worker threads are never starved
  const maxLifetime = setTimeout(() => {
    if (cleanedUp) return;
    try {
      res.write(`data: ${JSON.stringify({ type: "reconnect", timestamp: Date.now() })}\n\n`);
      res.end();
    } catch (_) {}
    cleanup();
  }, 45000);

  req.on("close", cleanup);
  req.on("error", cleanup);
  res.on("close", cleanup);
  res.on("finish", cleanup);
  res.on("error", cleanup);
});

function broadcastEvent(type: string, data: any) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (_) {
      sseClients.delete(client);
    }
  }
}

// In-Memory Master Database with Atomic Disk Persistence
let memoryOrders: any[] = [];
let memoryCustomers: any[] = [];
let memoryGames: any[] | null = null;
let memorySettings: any = null;
let memoryDeletedOrderIds: string[] = [];
let lastSnapshotTime = 0;

function readJsonFile(filePath: string, defaultData: any = []): any {
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

function writeJsonFile(filePath: string, data: any): boolean {
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

function createBackupSnapshotThrottled(prefix: string, data: any) {
  const now = Date.now();
  if (now - lastSnapshotTime < 30000) return; // Limit to once every 30s to avoid disk thrashing
  lastSnapshotTime = now;
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(BACKUPS_DIR, `${prefix}_${timestamp}.json`);
    const tempPath = `${backupPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempPath, backupPath);

    const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.startsWith(prefix));
    if (files.length > 50) {
      files.sort().slice(0, files.length - 50).forEach((f) => {
        try { fs.unlinkSync(path.join(BACKUPS_DIR, f)); } catch (_) {}
      });
    }
  } catch (e) {
    console.error("Backup snapshot error:", e);
  }
}

// Initialize memory state from disk safely
function loadDatabaseState() {
  memoryDeletedOrderIds = readJsonFile(DELETED_ORDERS_FILE, []);
  if (!Array.isArray(memoryDeletedOrderIds)) {
    memoryDeletedOrderIds = [];
  }
  const deletedSet = new Set(memoryDeletedOrderIds.map((d: any) => String(d || '').trim().toLowerCase()));

  memoryOrders = readJsonFile(ORDERS_FILE, []);
  if (Array.isArray(memoryOrders)) {
    // Strictly filter out any deleted orders
    memoryOrders = memoryOrders.filter((o: any) => {
      if (!o || !o.id) return false;
      const cleanId = String(o.id).trim().toLowerCase();
      return !deletedSet.has(cleanId) && cleanId !== 'gp-test-sync-1';
    });
  } else {
    memoryOrders = [];
  }
  if (memoryOrders.length === 0 && fs.existsSync(ORDERS_SAFE_BACKUP)) {
    try {
      const backupOrders = JSON.parse(fs.readFileSync(ORDERS_SAFE_BACKUP, "utf-8"));
      if (Array.isArray(backupOrders) && backupOrders.length > 0) {
        memoryOrders = backupOrders.filter((o: any) => {
          if (!o || !o.id) return false;
          const cleanId = String(o.id).trim().toLowerCase();
          return !deletedSet.has(cleanId) && cleanId !== "gp-test-sync-1";
        });
        console.log(`[Auto-Recovery] Initialized ${memoryOrders.length} orders from safe backup`);
      }
    } catch (_) {}
  }

  // Ensure disk file is clean
  writeJsonFile(ORDERS_FILE, memoryOrders);

  memoryCustomers = readJsonFile(CUSTOMERS_FILE, []);
  if (memoryCustomers.length === 0 && fs.existsSync(CUSTOMERS_SAFE_BACKUP)) {
    try {
      memoryCustomers = JSON.parse(fs.readFileSync(CUSTOMERS_SAFE_BACKUP, "utf-8"));
      writeJsonFile(CUSTOMERS_FILE, memoryCustomers);
      console.log(`[Auto-Recovery] Initialized ${memoryCustomers.length} customers from safe backup`);
    } catch (_) {}
  }

  memoryGames = readJsonFile(GAMES_FILE, null);
  if (Array.isArray(memoryGames)) {
    memoryGames = memoryGames.map((g: any) => {
      if (g && Array.isArray(g.packages)) {
        const seen = new Set();
        const uniquePackages = g.packages.filter((p: any) => {
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
    } catch (_) {}
  }
  if (!memorySettings) {
    memorySettings = { logoUrl: "/logo.png" };
    writeJsonFile(SETTINGS_FILE, memorySettings);
    writeJsonFile(SETTINGS_SAFE_BACKUP, memorySettings);
  }

  console.log(`[Database Loaded] Orders: ${memoryOrders.length}, Customers: ${memoryCustomers.length}, Games: ${memoryGames ? memoryGames.length : 0}, Deleted: ${memoryDeletedOrderIds.length}`);
}

loadDatabaseState();

// Image Upload Endpoint (saves base64 data URL to permanent disk file)
app.post("/api/upload", (req: Request, res: Response) => {
  try {
    const { image, filename } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: "No image provided" });
    }

    if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/uploads/') || image.startsWith('/public/uploads/'))) {
      return res.json({ success: true, url: image });
    }

    const matches = String(image).match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    let ext = 'jpg';
    let buffer: Buffer;
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

app.get("/api/data/all", (_req: Request, res: Response) => {
  const deletedSet = new Set(memoryDeletedOrderIds.map((d: any) => String(d || '').trim().toLowerCase()));
  const cleanOrders = memoryOrders.filter((o: any) => o && o.id && !deletedSet.has(String(o.id).trim().toLowerCase()));
  res.json({
    success: true,
    orders: cleanOrders,
    deletedOrderIds: memoryDeletedOrderIds,
    customers: memoryCustomers,
    settings: memorySettings,
    games: memoryGames,
    timestamp: Date.now(),
  });
});

app.get("/api/data/orders", (_req: Request, res: Response) => {
  const deletedSet = new Set(memoryDeletedOrderIds.map((d: any) => String(d || '').trim().toLowerCase()));
  const cleanOrders = memoryOrders.filter((o: any) => o && o.id && !deletedSet.has(String(o.id).trim().toLowerCase()));
  res.json(cleanOrders);
});

app.get("/api/data/games", (_req: Request, res: Response) => {
  res.json({ success: true, games: memoryGames });
});

app.post("/api/data/games", (req: Request, res: Response) => {
  try {
    const incoming = req.body;
    let currentGames = memoryGames || readJsonFile(GAMES_FILE, []);

    // 1. Support single package update: { gameId, packageId, updates }
    if (incoming && incoming.gameId && incoming.packageId && incoming.updates) {
      let gIndex = currentGames.findIndex((g: any) => g.id === incoming.gameId);
      if (gIndex === -1) {
        gIndex = currentGames.findIndex((g: any) => g.packages && g.packages.some((p: any) => p.id === incoming.packageId));
      }
      if (gIndex >= 0) {
        currentGames[gIndex].packages = currentGames[gIndex].packages.map((p: any) => 
          p.id === incoming.packageId ? { ...p, ...incoming.updates } : p
        );
        memoryGames = currentGames;
        writeJsonFile(GAMES_FILE, currentGames);
        createBackupSnapshotThrottled("games_snapshot", currentGames);
        broadcastEvent("games_updated", { games: currentGames });
        return res.json({ success: true, game: currentGames[gIndex] });
      }
    }

    // 2. Support add package: { action: 'add_package', gameId, package }
    if (incoming && incoming.action === 'add_package' && incoming.gameId && incoming.package) {
      const gIndex = currentGames.findIndex((g: any) => g.id === incoming.gameId);
      if (gIndex >= 0) {
        const pkgs = currentGames[gIndex].packages || [];
        const existingIdx = pkgs.findIndex((p: any) => p.id === incoming.package.id);
        if (existingIdx >= 0) {
          pkgs[existingIdx] = { ...pkgs[existingIdx], ...incoming.package };
        } else {
          pkgs.push(incoming.package);
        }
        // Strict deduplication by package ID
        const seenPkgIds = new Set();
        currentGames[gIndex].packages = pkgs.filter((p: any) => {
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

    // 3. Support delete package: { action: 'delete_package', gameId, packageId }
    if (incoming && incoming.action === 'delete_package' && incoming.gameId && incoming.packageId) {
      const gIndex = currentGames.findIndex((g: any) => g.id === incoming.gameId);
      if (gIndex >= 0) {
        currentGames[gIndex].packages = (currentGames[gIndex].packages || []).filter((p: any) => p.id !== incoming.packageId);
        memoryGames = currentGames;
        writeJsonFile(GAMES_FILE, currentGames);
        createBackupSnapshotThrottled("games_snapshot", currentGames);
        broadcastEvent("games_updated", { games: currentGames });
        return res.json({ success: true, game: currentGames[gIndex] });
      }
    }

    // 4. Support single game update: { gameId, updates }
    if (incoming && incoming.gameId && incoming.updates && !incoming.packageId) {
      const gIndex = currentGames.findIndex((g: any) => g.id === incoming.gameId);
      if (gIndex >= 0) {
        currentGames[gIndex] = { ...currentGames[gIndex], ...incoming.updates };
        memoryGames = currentGames;
        writeJsonFile(GAMES_FILE, currentGames);
        createBackupSnapshotThrottled("games_snapshot", currentGames);
        broadcastEvent("games_updated", { games: currentGames });
        return res.json({ success: true, game: currentGames[gIndex] });
      }
    }

    // 5. Full games array update
    const gamesList = Array.isArray(incoming) ? incoming : (incoming.games || incoming);
    if (!Array.isArray(gamesList) || gamesList.length === 0) {
      return res.status(400).json({ success: false, error: "Invalid games array" });
    }

    const mergedMap = new Map();
    currentGames.forEach((g: any) => mergedMap.set(g.id, g));
    gamesList.forEach((g: any) => {
      if (g && g.id) {
        mergedMap.set(g.id, g);
      }
    });

    const finalGames = Array.from(mergedMap.values()).map((g: any) => {
      if (g && Array.isArray(g.packages)) {
        const seen = new Set();
        const uniquePackages = g.packages.filter((p: any) => {
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

app.post("/api/data/settings", (req: Request, res: Response) => {
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

app.get("/api/admin/logo", (_req: Request, res: Response) => {
  const logo = (memorySettings && memorySettings.logoUrl) ? memorySettings.logoUrl : "/logo.png";
  res.json({ success: true, logoUrl: logo });
});

app.post("/api/admin/logo", (req: Request, res: Response) => {
  try {
    const { logoUrl, logoBase64 } = req.body;
    if (!logoUrl && !logoBase64) {
      return res.status(400).json({ success: false, error: "กรุณาระบุรูปภาพหรือ URL โลโก้" });
    }

    let finalLogoUrl = logoUrl;

    if (logoBase64 && typeof logoBase64 === "string" && logoBase64.includes("base64,")) {
      const matches = logoBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      const ext = matches ? (matches[1] === "jpeg" ? "jpg" : matches[1]) : "png";
      const dataPart = matches ? matches[2] : logoBase64;
      const buffer = Buffer.from(dataPart, "base64");

      const filename = `shop_logo_${Date.now()}.${ext}`;
      const uploadPath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(uploadPath, buffer);

      try {
        fs.writeFileSync(path.join(process.cwd(), "public", "logo.png"), buffer);
      } catch (_) {}

      try {
        const distLogoPath = path.join(process.cwd(), "dist", "logo.png");
        if (fs.existsSync(path.dirname(distLogoPath))) {
          fs.writeFileSync(distLogoPath, buffer);
        }
      } catch (_) {}

      finalLogoUrl = `/uploads/${filename}`;
    }

    if (!memorySettings || typeof memorySettings !== "object") {
      memorySettings = {};
    }
    memorySettings.logoUrl = finalLogoUrl;
    memorySettings.updatedAt = new Date().toISOString();

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

app.post("/api/data/orders", (req: Request, res: Response) => {
  try {
    const incoming = req.body;
    const items = Array.isArray(incoming) ? incoming : (incoming.order ? [incoming.order] : [incoming]);

    const deletedSet = new Set(memoryDeletedOrderIds.map((d: any) => String(d || '').trim().toLowerCase()));

    let modified = false;
    for (const item of items) {
      if (!item || !item.id) continue;
      const itemClean = String(item.id).trim().toLowerCase();

      // Permanently reject any deleted order from being resurrected by client cache
      if (deletedSet.has(itemClean)) {
        continue;
      }

      const index = memoryOrders.findIndex((o: any) => String(o?.id || '').trim().toLowerCase() === itemClean);
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

app.delete("/api/data/orders/:id", (req: Request, res: Response) => {
  try {
    const rawId = String(req.params.id || '').trim();
    const cleanId = rawId.toLowerCase();

    memoryOrders = memoryOrders.filter((o: any) => {
      const oId = String(o?.id || '').trim().toLowerCase();
      return oId !== cleanId;
    });
    writeJsonFile(ORDERS_FILE, memoryOrders);

    if (!memoryDeletedOrderIds.some((d: any) => String(d || '').trim().toLowerCase() === cleanId)) {
      memoryDeletedOrderIds.push(rawId);
      if (memoryDeletedOrderIds.length > 5000) {
        memoryDeletedOrderIds = memoryDeletedOrderIds.slice(-5000);
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

app.get("/api/data/customers", (_req: Request, res: Response) => {
  res.json(memoryCustomers);
});

app.post("/api/data/customers/restore", (_req: Request, res: Response) => {
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

app.post("/api/data/customers", (req: Request, res: Response) => {
  try {
    const incoming = req.body;
    const items = Array.isArray(incoming) ? incoming : (incoming.customer ? [incoming.customer] : [incoming]);

    for (const item of items) {
      if (!item || !item.id) continue;
      const index = memoryCustomers.findIndex((c: any) => c.id === item.id || (c.username && c.username.toLowerCase() === item.username.toLowerCase()));
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

app.delete("/api/data/customers/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    memoryCustomers = memoryCustomers.filter((c: any) => c.id !== id);
    writeJsonFile(CUSTOMERS_FILE, memoryCustomers);
    broadcastEvent("customers_updated", { customers: memoryCustomers, deletedId: id });
    res.json({ success: true, count: memoryCustomers.length });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.get("/api/data/backup/download", (_req: Request, res: Response) => {
  const orders = memoryOrders;
  const customers = memoryCustomers;
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

// Download Endpoints for manual Hostinger / VPS deployment
app.get("/download-project.zip", (_req: Request, res: Response) => {
  const filePath = path.join(process.cwd(), "dist", "deploy.zip");
  if (fs.existsSync(filePath)) {
    res.download(filePath, "efcpa-stock-app.zip");
  } else {
    res.status(404).send("File not found");
  }
});

app.get("/download-project.tar.gz", (_req: Request, res: Response) => {
  const filePath = path.join(process.cwd(), "dist", "deploy.tar.gz");
  if (fs.existsSync(filePath)) {
    res.download(filePath, "efcpa-stock-app.tar.gz");
  } else {
    res.status(404).send("File not found");
  }
});

// Express Error-Handling Middleware (catches unhandled errors and prevents Nginx 504 timeouts)
app.use((err: any, _req: Request, res: Response, _next: any) => {
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
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.get("*", async (req: Request, res: Response, next) => {
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
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.use("/public", express.static(path.join(process.cwd(), "public")));
    app.get("*", (_req: Request, res: Response) => {
      if (fs.existsSync(distHtml)) {
        res.sendFile(distHtml);
      } else {
        res.status(503).send("Application is starting or building. Please refresh in a moment.");
      }
    });
  }

  // Support both numeric PORT and Unix Domain Socket (Hostinger / Phusion Passenger / Nginx)
  const rawPort = process.env.PORT || 3000;
  const isNumeric = !isNaN(Number(rawPort));

  if (isNumeric) {
    const portNumber = Number(rawPort);
    app.listen(portNumber, "0.0.0.0", () => {
      console.log(`EF CPA Shop server active and listening on port ${portNumber} (dev: ${isDev})`);
    });
  } else {
    // Unix Socket path supplied by Passenger / Hostinger
    app.listen(rawPort, () => {
      console.log(`EF CPA Shop server active and listening on socket ${rawPort} (dev: ${isDev})`);
    });
  }
}

startServer();

export default app;
export { app };
