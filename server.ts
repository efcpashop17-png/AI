import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

const EASYSLIP_TOKEN = process.env.EASYSLIP_API_KEY || '80577a63-8428-40cd-999d-be9669474c76';

// Body parsers for slip image data
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Health Check Endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "EF CPA Shop",
    easySlipConfigured: !!EASYSLIP_TOKEN,
    timestamp: new Date().toISOString(),
  });
});

// EasySlip Proxy Verification Endpoint
app.post("/api/verify-slip", async (req: Request, res: Response) => {
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
// ==========================================
const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const CUSTOMERS_FILE = path.join(DATA_DIR, "customers.json");
const BACKUPS_DIR = path.join(DATA_DIR, "backups");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

function readJsonFile(filePath: string, defaultData: any[] = []): any[] {
  try {
    if (!fs.existsSync(filePath)) return defaultData;
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultData;
  }
}

function writeJsonFile(filePath: string, data: any): boolean {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

function createBackupSnapshot(prefix: string, data: any) {
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

app.get("/api/data/all", (_req: Request, res: Response) => {
  const orders = readJsonFile(ORDERS_FILE, []);
  const customers = readJsonFile(CUSTOMERS_FILE, []);
  res.json({
    success: true,
    orders,
    customers,
    timestamp: Date.now(),
  });
});

app.post("/api/data/orders", (req: Request, res: Response) => {
  try {
    const incoming = req.body;
    let currentOrders = readJsonFile(ORDERS_FILE, []);
    const items = Array.isArray(incoming) ? incoming : (incoming.order ? [incoming.order] : [incoming]);

    for (const item of items) {
      if (!item || !item.id) continue;
      const index = currentOrders.findIndex((o: any) => o.id === item.id);
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

app.delete("/api/data/orders/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let currentOrders = readJsonFile(ORDERS_FILE, []);
    createBackupSnapshot("orders_before_admin_delete", currentOrders);
    currentOrders = currentOrders.filter((o: any) => o.id !== id);
    writeJsonFile(ORDERS_FILE, currentOrders);
    res.json({ success: true, count: currentOrders.length });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.post("/api/data/customers", (req: Request, res: Response) => {
  try {
    const incoming = req.body;
    let currentCustomers = readJsonFile(CUSTOMERS_FILE, []);
    const items = Array.isArray(incoming) ? incoming : (incoming.customer ? [incoming.customer] : [incoming]);

    for (const item of items) {
      if (!item || !item.id) continue;
      const index = currentCustomers.findIndex((c: any) => c.id === item.id || (c.username && c.username.toLowerCase() === item.username.toLowerCase()));
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

app.delete("/api/data/customers/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let currentCustomers = readJsonFile(CUSTOMERS_FILE, []);
    createBackupSnapshot("customers_before_admin_delete", currentCustomers);
    currentCustomers = currentCustomers.filter((c: any) => c.id !== id);
    writeJsonFile(CUSTOMERS_FILE, currentCustomers);
    res.json({ success: true, count: currentCustomers.length });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.get("/api/data/backup/download", (_req: Request, res: Response) => {
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

// Download Endpoint for manual Hostinger deployment
app.get("/download-project.zip", (_req: Request, res: Response) => {
  const filePath = path.join(process.cwd(), "dist", "deploy.zip");
  if (fs.existsSync(filePath)) {
    res.download(filePath, "efcpa-stock-app.zip");
  } else {
    res.status(404).send("File not found");
  }
});

const distPath = path.join(process.cwd(), "dist");
const distHtml = path.join(distPath, "index.html");

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

if (isNaN(Number(PORT))) {
  app.listen(PORT, () => {
    console.log(`Server running on socket ${PORT}`);
  });
} else {
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
