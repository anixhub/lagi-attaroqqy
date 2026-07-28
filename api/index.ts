import express from "express";
import { createClient } from "@supabase/supabase-js";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();

// Enable JSON parsing with a 10MB limit for compressed base64 photos
app.use(express.json({ limit: "10mb" }));

// -------------------------------------------------------------
// 1. MySQL Pool Initialization (Hostinger Database)
// -------------------------------------------------------------
let mysqlPool: mysql.Pool | null = null;

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

// -------------------------------------------------------------
// 2. Supabase Client Initialization (Fallback)
// -------------------------------------------------------------
let supabaseClient: any = null;

function getSupabase() {
  let url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    return null;
  }
  
  url = url.trim();
  if (url.endsWith('/')) url = url.slice(0, -1);
  if (url.endsWith('/rest/v1')) url = url.slice(0, -8);
  if (url.endsWith('/')) url = url.slice(0, -1);
  
  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, key);
    } catch (err: any) {
      console.error("Gagal menginisialisasi client Supabase:", err.message);
      return null;
    }
  }
  return supabaseClient;
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
// 3. Status Endpoints
// -------------------------------------------------------------
app.get("/api/db-status", async (req, res) => {
  const mysql = getMySQLPool();
  if (mysql) {
    try {
      await mysql.query("SELECT 1");
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

  const supabase = getSupabase();
  if (supabase) {
    return res.json({
      connected: true,
      type: "supabase",
      url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      reason: "connected"
    });
  }

  res.json({
    connected: false,
    type: "none",
    reason: "missing_keys"
  });
});

app.get("/api/supabase-status", async (req, res) => {
  const mysql = getMySQLPool();
  if (mysql) {
    try {
      await mysql.query("SELECT 1");
      return res.json({
        connected: true,
        type: "mysql",
        url: process.env.MYSQL_HOST || "Hostinger MySQL",
        anonKey: "mysql-active",
        reason: "connected"
      });
    } catch (e) {}
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const isReady = !!(url && key);
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || null;
  
  res.json({
    connected: isReady,
    type: isReady ? "supabase" : "none",
    url: url || null,
    anonKey: anonKey,
    reason: isReady ? "connected" : "missing_keys"
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

// Download SQL Schema for Supabase PostgreSQL
app.get("/api/download-sql-supabase", (req, res) => {
  const filePath = path.join(process.cwd(), "supabase_setup.sql");
  res.download(filePath, "supabase_setup.sql", (err) => {
    if (err) {
      res.status(500).send("Gagal mengunduh skema SQL Supabase");
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
    } catch (err: any) {
      console.warn("MySQL storage stats query failed:", err.message);
    }
  }

  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.rpc("get_storage_stats");
      if (!error && data && data.length > 0) {
        return res.json({
          success: true,
          databaseSize: Number(data[0].database_size) || 1250000,
          bucketSize: Number(data[0].bucket_size) || 0,
          isFallback: false
        });
      }
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
// 4. Authentication Endpoint
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
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Fallback to Supabase
  const client = getSupabase();
  if (!client) {
    return res.json({ success: false, error: "DB_NOT_CONFIGURED" });
  }

  try {
    const { data, error } = await client
      .from("app_credentials")
      .select("*")
      .eq("username", emailLower)
      .maybeSingle();

    if (error) throw error;

    let matchedUser = data;

    if (!matchedUser && emailLower === defaultUser && password === defaultPass) {
      const newId = 'superadmin';
      const payload = {
        id: newId,
        username: defaultUser,
        password: defaultPass,
        role: 'superadmin',
        status: 'approved',
        created_at: new Date().toISOString()
      };
      await client.from("app_credentials").insert(payload);
      
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
    console.error("Supabase Auth login error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 5. Storage Upload Endpoint (Files & Photos)
// -------------------------------------------------------------
app.post("/api/upload", async (req, res) => {
  try {
    const { fileName, fileBase64, contentType } = req.body;
    if (!fileName || !fileBase64) {
      return res.status(400).json({ success: false, error: "fileName and fileBase64 are required" });
    }

    const buffer = Buffer.from(fileBase64, "base64");

    // Save to local filesystem (works out-of-the-box on Hostinger Node.js)
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

    // Also upload to Supabase bucket if Supabase is connected
    const client = getSupabase();
    if (client) {
      try {
        await client.storage.from("santri-assets").upload(fileName, buffer, {
          contentType: contentType || "application/octet-stream",
          upsert: true
        });
      } catch (e) {}
    }

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
// 6. Generic DB Table Operations (MySQL Hostinger & Supabase Fallback)
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

// GET /api/db/:table
app.get("/api/db/:table", async (req, res) => {
  const { table } = req.params;
  if (!VALID_TABLES.has(table)) {
    return res.status(400).json({ success: false, error: `Tabel '${table}' tidak valid` });
  }

  const pool = getMySQLPool();
  if (pool) {
    try {
      const [rows]: any = await pool.query(`SELECT * FROM \`${table}\``);
      let finalData = stripPassword(table, rows || []);
      if (table === "santri") {
        finalData = unpackPendidikanFormal(finalData);
      }
      return res.json({ success: true, data: finalData });
    } catch (err: any) {
      console.error(`MySQL GET /api/db/${table} error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  const client = getSupabase();
  if (!client) {
    return res.json({ success: false, error: "DB_NOT_CONFIGURED" });
  }

  try {
    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await client
        .from(table)
        .select("*")
        .range(from, from + step - 1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        allData = allData.concat(data);
        if (data.length < step) hasMore = false;
        else from += step;
      } else {
        hasMore = false;
      }
    }

    let finalData = stripPassword(table, allData);
    if (table === "santri") {
      finalData = unpackPendidikanFormal(finalData);
    }

    res.json({ success: true, data: finalData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
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

  const pool = getMySQLPool();
  if (pool) {
    try {
      const rowsToInsert = Array.isArray(sanitizedBody) ? sanitizedBody : [sanitizedBody];
      const insertedResults = [];

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

      let resultData = stripPassword(table, Array.isArray(sanitizedBody) ? insertedResults : insertedResults[0]);
      if (table === "santri") {
        resultData = unpackPendidikanFormal(resultData);
      }
      return res.json({ success: true, data: resultData });
    } catch (err: any) {
      console.error(`MySQL POST /api/db/${table} error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  const client = getSupabase();
  if (!client) {
    return res.json({ success: false, error: "DB_NOT_CONFIGURED" });
  }

  try {
    const isArray = Array.isArray(sanitizedBody);
    const { data, error } = await client.from(table).insert(sanitizedBody).select();
    if (error) throw error;

    let resultData = stripPassword(table, isArray ? (data || []) : (data?.[0] || null));
    if (table === "santri") {
      resultData = unpackPendidikanFormal(resultData);
    }

    res.json({ success: true, data: resultData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
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
      let resultData = stripPassword(table, rows?.[0] || { id, ...sanitizedBody });
      if (table === "santri") {
        resultData = unpackPendidikanFormal(resultData);
      }
      return res.json({ success: true, data: resultData });
    } catch (err: any) {
      console.error(`MySQL PUT /api/db/${table}/${id} error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  const client = getSupabase();
  if (!client) {
    return res.json({ success: false, error: "DB_NOT_CONFIGURED" });
  }

  try {
    const { data, error } = await client.from(table).update(sanitizedBody).eq("id", id).select();
    if (error) throw error;

    let resultData = stripPassword(table, data?.[0] || null);
    if (table === "santri") {
      resultData = unpackPendidikanFormal(resultData);
    }

    res.json({ success: true, data: resultData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
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
      return res.json({ success: true });
    } catch (err: any) {
      console.error(`MySQL DELETE /api/db/${table}/${id} error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  const client = getSupabase();
  if (!client) {
    return res.json({ success: false, error: "DB_NOT_CONFIGURED" });
  }

  try {
    if (table === "santri") {
      const { data: sData } = await client.from("santri").select("id, nama").eq("id", id).maybeSingle();
      const santriNama = sData?.nama;

      await client.from("rombel_assignment").delete().eq("santri_id", id);
      if (santriNama) {
        await client.from("perizinan").delete().or(`santri_id.eq.${id},nama_santri.eq.${santriNama}`);
        await client.from("keamanan").delete().or(`santri_id.eq.${id},nama_santri.eq.${santriNama}`);
        await client.from("bendahara").delete().eq("nama_santri", santriNama);
      } else {
        await client.from("perizinan").delete().eq("santri_id", id);
        await client.from("keamanan").delete().eq("santri_id", id);
      }
    }
    const { data, error } = await client.from(table).delete().eq("id", id).select();
    if (error) throw error;
    res.json({ success: true, data: stripPassword(table, data?.[0] || null) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Role Permissions Sync
app.post("/api/sync-role-permissions", async (req, res) => {
  const { roleName, permissions } = req.body;

  const pool = getMySQLPool();
  if (pool) {
    try {
      const [rRows]: any = await pool.query("SELECT `id` FROM `roles` WHERE `name` = ? LIMIT 1", [roleName]);
      if (!rRows || rRows.length === 0) {
        return res.status(404).json({ success: false, error: `Role '${roleName}' tidak ditemukan.` });
      }
      const roleId = rRows[0].id;

      const [pRows]: any = await pool.query("SELECT `id`, `name` FROM `permissions`");
      const enabledPermIds = (pRows || [])
        .filter((p: any) => permissions.includes(p.name))
        .map((p: any) => p.id);

      await pool.query("DELETE FROM `role_has_permissions` WHERE `role_id` = ?", [roleId]);

      for (const pid of enabledPermIds) {
        await pool.query("INSERT INTO `role_has_permissions` (`role_id`, `permission_id`) VALUES (?, ?)", [roleId, pid]);
      }

      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  const client = getSupabase();
  if (!client) return res.json({ success: false, error: "DB_NOT_CONFIGURED" });

  try {
    const { data: roleData, error: roleError } = await client.from("roles").select("id").eq("name", roleName).maybeSingle();
    if (roleError) throw roleError;
    if (!roleData) return res.status(404).json({ success: false, error: `Role '${roleName}' tidak ditemukan.` });

    const roleId = roleData.id;
    const { data: permData, error: permError } = await client.from("permissions").select("id, name");
    if (permError) throw permError;

    const enabledPermIds = permData.filter((p: any) => permissions.includes(p.name)).map((p: any) => p.id);

    await client.from("role_has_permissions").delete().eq("role_id", roleId);

    if (enabledPermIds.length > 0) {
      const inserts = enabledPermIds.map((pid: any) => ({ role_id: roleId, permission_id: pid }));
      await client.from("role_has_permissions").insert(inserts);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
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
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  const client = getSupabase();
  if (!client) return res.json({ success: false, error: "DB_NOT_CONFIGURED" });

  try {
    for (const table of tables) {
      if (table === "app_credentials") {
        await client.from(table).delete().neq("id", "superadmin");
      } else if (table === "periode") {
        await client.from(table).delete().neq("id", "Semua");
      } else if (table === "pesantren_profile") {
        await client.from(table).update({
          nama_pesantren: "Pondok Pesantren Darussalam Al-Azhar",
          nama_yayasan: "Yayasan Pendidikan Islam Darussalam"
        }).eq("id", "main");
      } else {
        await client.from(table).delete().not("id", "is", null);
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default app;
