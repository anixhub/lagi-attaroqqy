import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";

dotenv.config();

const app = express();

// WebSocket Instance Management for Realtime Broadcasting
let wssInstance: WebSocketServer | null = null;

export function setWssInstance(wss: WebSocketServer) {
  wssInstance = wss;
}

export function broadcastWebSocketMessage(payload: any) {
  if (!wssInstance) return;
  const msgStr = JSON.stringify(payload);
  wssInstance.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msgStr);
    }
  });
}

// Subpath URL Normalization Middleware
app.use((req, res, next) => {
  if (req.url.includes("/api/")) {
    const apiIndex = req.url.indexOf("/api/");
    req.url = req.url.substring(apiIndex);
  }
  next();
});

// Enable JSON parsing with a 10MB limit for compressed base64 photos
app.use(express.json({ limit: "10mb" }));

// -------------------------------------------------------------
// 1. MySQL Pool & Memory Store (Fallback) Initialization
// -------------------------------------------------------------
let mysqlPool: mysql.Pool | null = null;
const memoryStore = new Map<string, any[]>();

function getMySQLPool(): mysql.Pool | null {
  const host = process.env.MYSQL_HOST || process.env.DB_HOST || "localhost";
  const user = process.env.MYSQL_USER || process.env.DB_USER;
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || process.env.DB_PASS || "";
  const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || process.env.DB_DATABASE;
  const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306);

  if (!user || !database) {
    return null;
  }

  if (!mysqlPool) {
    try {
      mysqlPool = mysql.createPool({
        host,
        user,
        password,
        database,
        port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        dateStrings: true
      });
    } catch (err: any) {
      console.error("Gagal membuat koneksi MySQL Pool:", err.message);
      return null;
    }
  }
  return mysqlPool;
}

// Whitelist of valid table names to prevent SQL injection
const VALID_TABLES = new Set([
  "santri",
  "lembaga",
  "kelas",
  "kompleks",
  "kamar",
  "kategori_rombel",
  "kelompok_rombel",
  "rombel_assignment",
  "surat",
  "bendahara",
  "keamanan",
  "periode",
  "perizinan",
  "katalog_pelanggaran",
  "app_credentials",
  "pesantren_profile",
  "feedback",
  "permissions",
  "roles",
  "role_has_permissions",
  "document_generation_logs",
  "document_templates"
]);

// -------------------------------------------------------------
// 2. Status & Utilities Endpoints
// -------------------------------------------------------------
app.get("/api/db-status", async (req, res) => {
  const pool = getMySQLPool();
  if (pool) {
    try {
      await pool.query("SELECT 1");
      return res.json({
        connected: true,
        type: "mysql",
        host: process.env.MYSQL_HOST || process.env.DB_HOST || "localhost",
        database: process.env.MYSQL_DATABASE || process.env.DB_NAME || process.env.DB_DATABASE,
        reason: "connected"
      });
    } catch (err: any) {
      console.warn("MySQL ping failed:", err.message);
    }
  }

  res.json({
    connected: true,
    type: "memory",
    reason: "memory_store_active"
  });
});

// Download SQL Schema for Hostinger MySQL
app.get("/api/download-sql-mysql", (req, res) => {
  const filePath = path.join(process.cwd(), "hostinger_mysql_setup.sql");
  res.download(filePath, "hostinger_mysql_setup.sql", (err) => {
    if (err) {
      res.status(500).send("Gagal mengunduh skema SQL MySQL Hostinger");
    }
  });
});

// Storage Stats
app.get("/api/storage-stats", async (req, res) => {
  const pool = getMySQLPool();
  if (pool) {
    try {
      const dbName = process.env.MYSQL_DATABASE || process.env.DB_NAME || process.env.DB_DATABASE;
      const [rows]: any = await pool.query(
        "SELECT SUM(data_length + index_length) AS db_size FROM information_schema.TABLES WHERE table_schema = ?",
        [dbName]
      );
      const dbSize = rows?.[0]?.db_size ? Number(rows[0].db_size) : 1250000;
      return res.json({
        success: true,
        databaseSize: dbSize,
        bucketSize: 2400000,
        isFallback: false
      });
    } catch (err: any) {}
  }

  res.json({
    success: true,
    databaseSize: 1250000,
    bucketSize: 2400000,
    isFallback: true
  });
});

// Helper to strip password from app_credentials output for security
function stripPassword(table: string, data: any): any {
  if (table !== "app_credentials" || !data) return data;
  if (Array.isArray(data)) {
    return data.map(item => {
      const { password, ...rest } = item;
      return rest;
    });
  }
  const { password, ...rest } = data;
  return rest;
}

// -------------------------------------------------------------
// 3. Authentication Endpoint
// -------------------------------------------------------------
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const emailLower = (username || "").trim().toLowerCase();
  const defaultUser = 'superadmin@attaroqqy.com';
  const defaultPass = '1234';

  const pool = getMySQLPool();
  if (pool) {
    try {
      const [rows]: any = await pool.query(
        "SELECT * FROM `app_credentials` WHERE LOWER(`username`) = ? LIMIT 1",
        [emailLower]
      );

      let matchedUser = rows?.[0];

      if (!matchedUser && emailLower === defaultUser && password === defaultPass) {
        const newId = 'superadmin';
        await pool.query(
          "INSERT INTO `app_credentials` (`id`, `username`, `password`, `role`, `status`) VALUES (?, ?, ?, 'superadmin', 'approved') ON DUPLICATE KEY UPDATE `id`=`id`",
          [newId, defaultUser, defaultPass]
        );
        return res.json({
          success: true,
          user: {
            id: newId,
            username: defaultUser,
            role: 'superadmin',
            status: 'approved'
          }
        });
      }

      if (!matchedUser) {
        return res.status(401).json({ success: false, error: "Email atau Kata Sandi salah atau akun Anda tidak terdaftar." });
      }

      if (matchedUser.password !== password) {
        return res.status(401).json({ success: false, error: "Email atau Kata Sandi salah." });
      }

      if (matchedUser.status === 'pending') {
        return res.status(403).json({ success: false, error: "Sesi Tertunda: Pendaftaran akun Anda masih menunggu persetujuan (approval) dari Superadmin." });
      } else if (matchedUser.status === 'rejected') {
        return res.status(403).json({ success: false, error: "Akses Ditolak: Pendaftaran akun Anda ditolak oleh Superadmin." });
      }

      return res.json({
        success: true,
        needsCancelReset: matchedUser.status === 'minta_reset',
        user: {
          id: matchedUser.id,
          username: matchedUser.username,
          role: matchedUser.role,
          status: matchedUser.status,
          displayName: matchedUser.display_name || matchedUser.displayName,
          avatarUrl: matchedUser.avatar_url || matchedUser.avatarUrl
        }
      });
    } catch (err: any) {
      console.error("MySQL Auth login error:", err);
    }
  }

  // Memory store fallback authentication
  const list = memoryStore.get("app_credentials") || [];
  let matchedUser = list.find((u: any) => (u.username || "").toLowerCase() === emailLower);

  if (!matchedUser && emailLower === defaultUser && password === defaultPass) {
    matchedUser = {
      id: "superadmin",
      username: defaultUser,
      password: defaultPass,
      role: "superadmin",
      status: "approved"
    };
    list.push(matchedUser);
    memoryStore.set("app_credentials", list);
  }

  if (!matchedUser) {
    return res.status(401).json({ success: false, error: "Email atau Kata Sandi salah atau akun Anda tidak terdaftar." });
  }

  if (matchedUser.password !== password) {
    return res.status(401).json({ success: false, error: "Email atau Kata Sandi salah." });
  }

  if (matchedUser.status === 'pending') {
    return res.status(403).json({ success: false, error: "Sesi Tertunda: Pendaftaran akun Anda masih menunggu persetujuan (approval) dari Superadmin." });
  } else if (matchedUser.status === 'rejected') {
    return res.status(403).json({ success: false, error: "Akses Ditolak: Pendaftaran akun Anda ditolak oleh Superadmin." });
  }

  return res.json({
    success: true,
    needsCancelReset: matchedUser.status === 'minta_reset',
    user: {
      id: matchedUser.id,
      username: matchedUser.username,
      role: matchedUser.role,
      status: matchedUser.status,
      displayName: matchedUser.display_name || matchedUser.displayName,
      avatarUrl: matchedUser.avatar_url || matchedUser.avatarUrl
    }
  });
});

// -------------------------------------------------------------
// 4. Storage Upload Endpoint (Files & Photos)
// -------------------------------------------------------------
app.post("/api/upload", async (req, res) => {
  try {
    const { fileName, fileBase64 } = req.body;
    if (!fileName || !fileBase64) {
      return res.status(400).json({ success: false, error: "fileName and fileBase64 are required" });
    }

    const buffer = Buffer.from(fileBase64, "base64");

    const publicDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const distDir = path.join(process.cwd(), "dist", "uploads");
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    fs.writeFileSync(path.join(publicDir, fileName), buffer);
    fs.writeFileSync(path.join(distDir, fileName), buffer);

    const publicUrl = `uploads/${fileName}`;

    res.json({
      success: true,
      path: `uploads/${fileName}`,
      publicUrl: publicUrl
    });
  } catch (err: any) {
    console.error("Storage upload handler error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 5. Generic DB Table Operations & Realtime Broadcasting
// -------------------------------------------------------------
function packPendidikanFormal(payload: any): any {
  if (!payload || typeof payload !== "object") return payload;
  if (Array.isArray(payload)) return payload.map(packPendidikanFormal);
  const copy = { ...payload };
  const pfVal = String(copy.pendidikan_formal || copy.pendidikanFormal || "").trim();
  const kelasVal = String(copy.kelas || "").trim();

  if (pfVal && pfVal.toLowerCase() !== 'tanpa kelas' && kelasVal.toLowerCase() !== 'tanpa kelas') {
    let existingNotes = (copy.catatan || "").replace(/\[PF:.*?\]\s*/g, "").trim();
    copy.catatan = `[PF:${pfVal}] ${existingNotes}`.trim();
  } else {
    if (copy.catatan && typeof copy.catatan === "string") {
      copy.catatan = copy.catatan.replace(/\[PF:.*?\]\s*/g, "").trim() || null;
    }
  }
  return copy;
}

function unpackPendidikanFormal(data: any): any {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(unpackPendidikanFormal);
  if (typeof data === "object") {
    const copy = { ...data };
    if (copy.catatan && typeof copy.catatan === "string" && copy.catatan.includes("[PF:")) {
      const match = copy.catatan.match(/\[PF:(.*?)\]/);
      if (match) {
        copy.pendidikan_formal = copy.pendidikan_formal || match[1];
        copy.catatan = copy.catatan.replace(/\[PF:.*?\]\s*/g, "").trim() || null;
      }
    }
    return copy;
  }
  return data;
}

function sanitizePayload(payload: any): any {
  if (!payload) return payload;
  if (Array.isArray(payload)) {
    return payload.map(item => sanitizePayload(item));
  }
  if (typeof payload === "object") {
    const cleaned = { ...payload };
    for (const key of Object.keys(cleaned)) {
      if (cleaned[key] === "") {
        cleaned[key] = null;
      } else if (typeof cleaned[key] === "object" && cleaned[key] !== null) {
        cleaned[key] = sanitizePayload(cleaned[key]);
      }
    }
    return cleaned;
  }
  return payload;
}

async function tryMySQLQuery(sql: string, params: any[] = []): Promise<{ success: boolean; rows?: any; error?: any }> {
  const pool = getMySQLPool();
  if (!pool) return { success: false, error: "NO_MYSQL" };

  try {
    const [rows]: any = await pool.query(sql, params);
    return { success: true, rows };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

// GET /api/db/:table
app.get("/api/db/:table", async (req, res) => {
  const { table } = req.params;
  if (!VALID_TABLES.has(table)) {
    return res.status(400).json({ success: false, error: `Tabel '${table}' tidak valid` });
  }

  const mysqlRes = await tryMySQLQuery(`SELECT * FROM \`${table}\``);
  if (mysqlRes.success) {
    let finalData = stripPassword(table, mysqlRes.rows || []);
    if (table === "santri") {
      finalData = unpackPendidikanFormal(finalData);
    }
    return res.json({ success: true, data: finalData });
  }

  // Fallback memory store
  let data = memoryStore.get(table) || [];
  let finalData = stripPassword(table, data);
  if (table === "santri") {
    finalData = unpackPendidikanFormal(finalData);
  }
  res.json({ success: true, data: finalData });
});

// POST /api/db/:table
app.post("/api/db/:table", async (req, res) => {
  const { table } = req.params;
  if (!VALID_TABLES.has(table)) {
    return res.status(400).json({ success: false, error: `Tabel '${table}' tidak valid` });
  }

  let sanitizedBody = sanitizePayload(req.body);
  if (table === "kelas") {
    delete sanitizedBody.tingkatan;
    delete sanitizedBody.kapasitas;
    delete sanitizedBody.tingkatan_kelas;
    delete sanitizedBody.kapasitas_kelas;
  } else if (table === "santri") {
    sanitizedBody = packPendidikanFormal(sanitizedBody);
  }

  const rowsToInsert = Array.isArray(sanitizedBody) ? sanitizedBody : [sanitizedBody];
  const insertedResults: any[] = [];

  const pool = getMySQLPool();
  if (pool) {
    try {
      for (const row of rowsToInsert) {
        if (!row.id) {
          row.id = String(Date.now()) + Math.random().toString(36).substring(2, 7);
        }
        const keys = Object.keys(row);
        const columns = keys.map(k => `\`${k}\``).join(", ");
        const placeholders = keys.map(() => "?").join(", ");
        const values = keys.map(k => (typeof row[k] === "object" && row[k] !== null ? JSON.stringify(row[k]) : row[k]));
        const updateClause = keys.map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(", ");

        const sql = `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
        await pool.query(sql, values);
        insertedResults.push(row);
      }
    } catch (err: any) {
      console.warn(`MySQL POST /api/db/${table} error:`, err.message);
    }
  }

  // Memory store mirror
  let list = memoryStore.get(table) || [];
  for (const row of rowsToInsert) {
    if (!row.id) {
      row.id = String(Date.now()) + Math.random().toString(36).substring(2, 7);
    }
    const idx = list.findIndex((item: any) => item.id === row.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...row };
    } else {
      list.push(row);
    }
    if (!pool) insertedResults.push(row);
  }
  memoryStore.set(table, list);

  let resultData = stripPassword(table, Array.isArray(sanitizedBody) ? insertedResults : insertedResults[0]);
  if (table === "santri") {
    resultData = unpackPendidikanFormal(resultData);
  }

  // Realtime WebSocket broadcast
  broadcastWebSocketMessage({
    event: "db_change",
    table,
    action: "insert",
    data: resultData
  });

  return res.json({ success: true, data: resultData });
});

// PUT /api/db/:table/:id
app.put("/api/db/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  if (!VALID_TABLES.has(table)) {
    return res.status(400).json({ success: false, error: `Tabel '${table}' tidak valid` });
  }

  let sanitizedBody = sanitizePayload(req.body);
  if (table === "kelas") {
    delete sanitizedBody.tingkatan;
    delete sanitizedBody.kapasitas;
    delete sanitizedBody.tingkatan_kelas;
    delete sanitizedBody.kapasitas_kelas;
  } else if (table === "santri") {
    sanitizedBody = packPendidikanFormal(sanitizedBody);
  }

  let updatedResult: any = { id, ...sanitizedBody };

  const pool = getMySQLPool();
  if (pool) {
    try {
      const updateData = { ...sanitizedBody };
      delete updateData.id;
      const keys = Object.keys(updateData);

      if (keys.length > 0) {
        const setClause = keys.map(k => `\`${k}\` = ?`).join(", ");
        const values = keys.map(k => (typeof updateData[k] === "object" && updateData[k] !== null ? JSON.stringify(updateData[k]) : updateData[k]));
        values.push(id);

        const sql = `UPDATE \`${table}\` SET ${setClause} WHERE \`id\` = ?`;
        await pool.query(sql, values);
      }

      const [rows]: any = await pool.query(`SELECT * FROM \`${table}\` WHERE \`id\` = ? LIMIT 1`, [id]);
      if (rows?.[0]) updatedResult = rows[0];
    } catch (err: any) {
      console.warn(`MySQL PUT /api/db/${table}/${id} error:`, err.message);
    }
  }

  // Memory store mirror
  let list = memoryStore.get(table) || [];
  const idx = list.findIndex((item: any) => item.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...sanitizedBody, id };
  } else {
    list.push({ id, ...sanitizedBody });
  }
  memoryStore.set(table, list);

  let resultData = stripPassword(table, updatedResult);
  if (table === "santri") {
    resultData = unpackPendidikanFormal(resultData);
  }

  // Realtime WebSocket broadcast
  broadcastWebSocketMessage({
    event: "db_change",
    table,
    action: "update",
    id,
    data: resultData
  });

  return res.json({ success: true, data: resultData });
});

// DELETE /api/db/:table/:id
app.delete("/api/db/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  if (!VALID_TABLES.has(table)) {
    return res.status(400).json({ success: false, error: `Tabel '${table}' tidak valid` });
  }

  const pool = getMySQLPool();
  if (pool) {
    try {
      if (table === "santri") {
        const [sRows]: any = await pool.query("SELECT `nama` FROM `santri` WHERE `id` = ? LIMIT 1", [id]);
        const santriNama = sRows?.[0]?.nama;

        await pool.query("DELETE FROM `rombel_assignment` WHERE `santri_id` = ?", [id]);
        if (santriNama) {
          await pool.query("DELETE FROM `perizinan` WHERE `santri_id` = ? OR `nama_santri` = ?", [id, santriNama]);
          await pool.query("DELETE FROM `keamanan` WHERE `santri_id` = ? OR `nama_santri` = ?", [id, santriNama]);
          await pool.query("DELETE FROM `bendahara` WHERE `nama_santri` = ?", [santriNama]);
        } else {
          await pool.query("DELETE FROM `perizinan` WHERE `santri_id` = ?", [id]);
          await pool.query("DELETE FROM `keamanan` WHERE `santri_id` = ?", [id]);
        }
      }

      await pool.query(`DELETE FROM \`${table}\` WHERE \`id\` = ?`, [id]);
    } catch (err: any) {
      console.warn(`MySQL DELETE /api/db/${table}/${id} error:`, err.message);
    }
  }

  // Memory store mirror
  let list = memoryStore.get(table) || [];
  memoryStore.set(table, list.filter((item: any) => item.id !== id));

  // Realtime WebSocket broadcast
  broadcastWebSocketMessage({
    event: "db_change",
    table,
    action: "delete",
    id
  });

  return res.json({ success: true });
});

// Role Permissions Sync
app.post("/api/sync-role-permissions", async (req, res) => {
  const { roleName, permissions } = req.body;

  const pool = getMySQLPool();
  if (pool) {
    try {
      const [rRows]: any = await pool.query("SELECT `id` FROM `roles` WHERE `name` = ? LIMIT 1", [roleName]);
      if (rRows && rRows.length > 0) {
        const roleId = rRows[0].id;

        const [pRows]: any = await pool.query("SELECT `id`, `name` FROM `permissions`");
        const enabledPermIds = (pRows || [])
          .filter((p: any) => permissions.includes(p.name))
          .map((p: any) => p.id);

        await pool.query("DELETE FROM `role_has_permissions` WHERE `role_id` = ?", [roleId]);

        for (const pid of enabledPermIds) {
          await pool.query("INSERT INTO `role_has_permissions` (`role_id`, `permission_id`) VALUES (?, ?)", [roleId, pid]);
        }
      }
    } catch (err: any) {
      console.warn("Error sync role permissions MySQL:", err.message);
    }
  }

  broadcastWebSocketMessage({
    event: "db_change",
    table: "role_has_permissions",
    action: "update"
  });

  return res.json({ success: true });
});

// Truncate all tables for administrative reset
app.post("/api/db-truncate-all", async (req, res) => {
  const tables = [
    "rombel_assignment",
    "keamanan",
    "bendahara",
    "perizinan",
    "document_generation_logs",
    "document_templates",
    "santri",
    "kamar",
    "kompleks",
    "kelompok_rombel",
    "kategori_rombel",
    "kelas",
    "lembaga",
    "surat",
    "periode",
    "katalog_pelanggaran",
    "feedback",
    "app_credentials",
    "pesantren_profile"
  ];

  const pool = getMySQLPool();
  if (pool) {
    try {
      await pool.query("SET FOREIGN_KEY_CHECKS = 0");
      for (const table of tables) {
        if (table === "app_credentials") {
          await pool.query("DELETE FROM `app_credentials` WHERE `id` != 'superadmin'");
        } else if (table === "periode") {
          await pool.query("DELETE FROM `periode` WHERE `id` != 'Semua'");
        } else if (table === "pesantren_profile") {
          await pool.query(
            "UPDATE `pesantren_profile` SET `nama_pesantren` = 'Pondok Pesantren Darussalam Al-Azhar', `nama_yayasan` = 'Yayasan Pendidikan Islam Darussalam' WHERE `id` = 'main'"
          );
        } else {
          await pool.query(`TRUNCATE TABLE \`${table}\``);
        }
      }
      await pool.query("SET FOREIGN_KEY_CHECKS = 1");
    } catch (err: any) {
      console.warn("Truncate error MySQL:", err.message);
    }
  }

  memoryStore.clear();

  broadcastWebSocketMessage({
    event: "db_change",
    action: "truncate_all"
  });

  return res.json({ success: true });
});

export default app;
