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

// ==========================================
// Permanent Persistent Storage & Backup System
// Data is stored permanently in /data/orders.json and /data/customers.json
// Never deleted unless explicitly removed by Admin
// ==========================================
const DATA_DIR = path.join(__dirname, "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const CUSTOMERS_FILE = path.join(DATA_DIR, "customers.json");
const BACKUPS_DIR = path.join(DATA_DIR, "backups");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

function readJsonFile(filePath, defaultData = []) {
  try {
    if (!fs.existsSync(filePath)) return defaultData;
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultData;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

function createBackupSnapshot(prefix, data) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(BACKUPS_DIR, `${prefix}_${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), "utf-8");
    
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
  res.json({
    success: true,
    orders,
    customers,
    timestamp: Date.now(),
  });
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

const distHtml = path.join(__dirname, "dist", "index.html");

// Serve static frontend files from dist and public directories
if (fs.existsSync(path.join(__dirname, "dist"))) {
  app.use(
    express.static(path.join(__dirname, "dist"), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
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
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
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
