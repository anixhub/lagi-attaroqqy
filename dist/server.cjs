var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express2 = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_dotenv2 = __toESM(require("dotenv"), 1);
var import_ws2 = require("ws");

// api/index.ts
var import_express = __toESM(require("express"), 1);
var import_promise = __toESM(require("mysql2/promise"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_ws = require("ws");
import_dotenv.default.config();
var app = (0, import_express.default)();
var wssInstance = null;
function setWssInstance(wss) {
  wssInstance = wss;
}
function broadcastWebSocketMessage(payload) {
  if (!wssInstance) return;
  const msgStr = JSON.stringify(payload);
  wssInstance.clients.forEach((client) => {
    if (client.readyState === import_ws.WebSocket.OPEN) {
      client.send(msgStr);
    }
  });
}
app.use((req, res, next) => {
  if (req.url.includes("/api/")) {
    const apiIndex = req.url.indexOf("/api/");
    req.url = req.url.substring(apiIndex);
  }
  next();
});
app.use(import_express.default.json({ limit: "10mb" }));
app.use("/uploads", import_express.default.static(import_path.default.join(process.cwd(), "public", "uploads")));
app.use("/uploads", import_express.default.static(import_path.default.join(process.cwd(), "dist", "uploads")));
var mysqlPool = null;
var memoryStore = /* @__PURE__ */ new Map();
function getMySQLPool() {
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
      mysqlPool = import_promise.default.createPool({
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
    } catch (err) {
      console.error("Gagal membuat koneksi MySQL Pool:", err.message);
      return null;
    }
  }
  return mysqlPool;
}
var VALID_TABLES = /* @__PURE__ */ new Set([
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
    } catch (err) {
      console.warn("MySQL ping failed:", err.message);
    }
  }
  res.json({
    connected: true,
    type: "memory",
    reason: "memory_store_active"
  });
});
app.get("/api/download-sql-mysql", (req, res) => {
  const filePath = import_path.default.join(process.cwd(), "hostinger_mysql_setup.sql");
  res.download(filePath, "hostinger_mysql_setup.sql", (err) => {
    if (err) {
      res.status(500).send("Gagal mengunduh skema SQL MySQL Hostinger");
    }
  });
});
app.get("/api/storage-stats", async (req, res) => {
  const pool = getMySQLPool();
  if (pool) {
    try {
      const dbName = process.env.MYSQL_DATABASE || process.env.DB_NAME || process.env.DB_DATABASE;
      const [rows] = await pool.query(
        "SELECT SUM(data_length + index_length) AS db_size FROM information_schema.TABLES WHERE table_schema = ?",
        [dbName]
      );
      const dbSize = rows?.[0]?.db_size ? Number(rows[0].db_size) : 125e4;
      return res.json({
        success: true,
        databaseSize: dbSize,
        bucketSize: 24e5,
        isFallback: false
      });
    } catch (err) {
    }
  }
  res.json({
    success: true,
    databaseSize: 125e4,
    bucketSize: 24e5,
    isFallback: true
  });
});
function stripPassword(table, data) {
  if (table !== "app_credentials" || !data) return data;
  if (Array.isArray(data)) {
    return data.map((item) => {
      const { password: password2, ...rest2 } = item;
      return rest2;
    });
  }
  const { password, ...rest } = data;
  return rest;
}
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const emailLower = (username || "").trim().toLowerCase();
  const defaultUser = "superadmin@attaroqqy.com";
  const defaultPass = "1234";
  const pool = getMySQLPool();
  if (pool) {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM `app_credentials` WHERE LOWER(`username`) = ? LIMIT 1",
        [emailLower]
      );
      let matchedUser2 = rows?.[0];
      if (!matchedUser2 && emailLower === defaultUser && password === defaultPass) {
        const newId = "superadmin";
        await pool.query(
          "INSERT INTO `app_credentials` (`id`, `username`, `password`, `role`, `status`) VALUES (?, ?, ?, 'superadmin', 'approved') ON DUPLICATE KEY UPDATE `id`=`id`",
          [newId, defaultUser, defaultPass]
        );
        return res.json({
          success: true,
          user: {
            id: newId,
            username: defaultUser,
            role: "superadmin",
            status: "approved"
          }
        });
      }
      if (!matchedUser2) {
        return res.status(401).json({ success: false, error: "Email atau Kata Sandi salah atau akun Anda tidak terdaftar." });
      }
      if (matchedUser2.password !== password) {
        return res.status(401).json({ success: false, error: "Email atau Kata Sandi salah." });
      }
      if (matchedUser2.status === "pending") {
        return res.status(403).json({ success: false, error: "Sesi Tertunda: Pendaftaran akun Anda masih menunggu persetujuan (approval) dari Superadmin." });
      } else if (matchedUser2.status === "rejected") {
        return res.status(403).json({ success: false, error: "Akses Ditolak: Pendaftaran akun Anda ditolak oleh Superadmin." });
      }
      return res.json({
        success: true,
        needsCancelReset: matchedUser2.status === "minta_reset",
        user: {
          id: matchedUser2.id,
          username: matchedUser2.username,
          role: matchedUser2.role,
          status: matchedUser2.status,
          displayName: matchedUser2.display_name || matchedUser2.displayName,
          avatarUrl: matchedUser2.avatar_url || matchedUser2.avatarUrl
        }
      });
    } catch (err) {
      console.error("MySQL Auth login error:", err);
    }
  }
  const list = memoryStore.get("app_credentials") || [];
  let matchedUser = list.find((u) => (u.username || "").toLowerCase() === emailLower);
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
  if (matchedUser.status === "pending") {
    return res.status(403).json({ success: false, error: "Sesi Tertunda: Pendaftaran akun Anda masih menunggu persetujuan (approval) dari Superadmin." });
  } else if (matchedUser.status === "rejected") {
    return res.status(403).json({ success: false, error: "Akses Ditolak: Pendaftaran akun Anda ditolak oleh Superadmin." });
  }
  return res.json({
    success: true,
    needsCancelReset: matchedUser.status === "minta_reset",
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
app.post("/api/upload", async (req, res) => {
  try {
    const { fileName, fileBase64 } = req.body;
    if (!fileName || !fileBase64) {
      return res.status(400).json({ success: false, error: "fileName and fileBase64 are required" });
    }
    const buffer = Buffer.from(fileBase64, "base64");
    const publicDir = import_path.default.join(process.cwd(), "public", "uploads");
    if (!import_fs.default.existsSync(publicDir)) {
      import_fs.default.mkdirSync(publicDir, { recursive: true });
    }
    const distDir = import_path.default.join(process.cwd(), "dist", "uploads");
    if (!import_fs.default.existsSync(distDir)) {
      import_fs.default.mkdirSync(distDir, { recursive: true });
    }
    import_fs.default.writeFileSync(import_path.default.join(publicDir, fileName), buffer);
    import_fs.default.writeFileSync(import_path.default.join(distDir, fileName), buffer);
    const publicUrl = `/uploads/${fileName}`;
    res.json({
      success: true,
      path: publicUrl,
      publicUrl
    });
  } catch (err) {
    console.error("Storage upload handler error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
function packPendidikanFormal(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if (Array.isArray(payload)) return payload.map(packPendidikanFormal);
  const copy = { ...payload };
  const pfVal = String(copy.pendidikan_formal || copy.pendidikanFormal || "").trim();
  const kelasVal = String(copy.kelas || "").trim();
  if (pfVal && pfVal.toLowerCase() !== "tanpa kelas" && kelasVal.toLowerCase() !== "tanpa kelas") {
    let existingNotes = (copy.catatan || "").replace(/\[PF:.*?\]\s*/g, "").trim();
    copy.catatan = `[PF:${pfVal}] ${existingNotes}`.trim();
  } else {
    if (copy.catatan && typeof copy.catatan === "string") {
      copy.catatan = copy.catatan.replace(/\[PF:.*?\]\s*/g, "").trim() || null;
    }
  }
  return copy;
}
function unpackPendidikanFormal(data) {
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
function sanitizePayload(payload) {
  if (!payload) return payload;
  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item));
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
async function tryMySQLQuery(sql, params = []) {
  const pool = getMySQLPool();
  if (!pool) return { success: false, error: "NO_MYSQL" };
  try {
    const [rows] = await pool.query(sql, params);
    return { success: true, rows };
  } catch (err) {
    return { success: false, error: err };
  }
}
app.get("/api/db/:table", async (req, res) => {
  const { table } = req.params;
  if (!VALID_TABLES.has(table)) {
    return res.status(400).json({ success: false, error: `Tabel '${table}' tidak valid` });
  }
  const mysqlRes = await tryMySQLQuery(`SELECT * FROM \`${table}\``);
  if (mysqlRes.success) {
    let finalData2 = stripPassword(table, mysqlRes.rows || []);
    if (table === "santri") {
      finalData2 = unpackPendidikanFormal(finalData2);
    }
    return res.json({ success: true, data: finalData2 });
  }
  let data = memoryStore.get(table) || [];
  let finalData = stripPassword(table, data);
  if (table === "santri") {
    finalData = unpackPendidikanFormal(finalData);
  }
  res.json({ success: true, data: finalData });
});
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
  const insertedResults = [];
  const pool = getMySQLPool();
  if (pool) {
    try {
      for (const row of rowsToInsert) {
        if (!row.id) {
          row.id = String(Date.now()) + Math.random().toString(36).substring(2, 7);
        }
        const keys = Object.keys(row);
        const columns = keys.map((k) => `\`${k}\``).join(", ");
        const placeholders = keys.map(() => "?").join(", ");
        const values = keys.map((k) => typeof row[k] === "object" && row[k] !== null ? JSON.stringify(row[k]) : row[k]);
        const updateClause = keys.map((k) => `\`${k}\` = VALUES(\`${k}\`)`).join(", ");
        const sql = `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
        await pool.query(sql, values);
        insertedResults.push(row);
      }
    } catch (err) {
      console.warn(`MySQL POST /api/db/${table} error:`, err.message);
    }
  }
  let list = memoryStore.get(table) || [];
  for (const row of rowsToInsert) {
    if (!row.id) {
      row.id = String(Date.now()) + Math.random().toString(36).substring(2, 7);
    }
    const idx = list.findIndex((item) => item.id === row.id);
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
  broadcastWebSocketMessage({
    event: "db_change",
    table,
    action: "insert",
    data: resultData
  });
  return res.json({ success: true, data: resultData });
});
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
  let updatedResult = { id, ...sanitizedBody };
  const pool = getMySQLPool();
  if (pool) {
    try {
      const updateData = { ...sanitizedBody };
      delete updateData.id;
      const keys = Object.keys(updateData);
      if (keys.length > 0) {
        const setClause = keys.map((k) => `\`${k}\` = ?`).join(", ");
        const values = keys.map((k) => typeof updateData[k] === "object" && updateData[k] !== null ? JSON.stringify(updateData[k]) : updateData[k]);
        values.push(id);
        const sql = `UPDATE \`${table}\` SET ${setClause} WHERE \`id\` = ?`;
        await pool.query(sql, values);
      }
      const [rows] = await pool.query(`SELECT * FROM \`${table}\` WHERE \`id\` = ? LIMIT 1`, [id]);
      if (rows?.[0]) updatedResult = rows[0];
    } catch (err) {
      console.warn(`MySQL PUT /api/db/${table}/${id} error:`, err.message);
    }
  }
  let list = memoryStore.get(table) || [];
  const idx = list.findIndex((item) => item.id === id);
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
  broadcastWebSocketMessage({
    event: "db_change",
    table,
    action: "update",
    id,
    data: resultData
  });
  return res.json({ success: true, data: resultData });
});
app.delete("/api/db/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  if (!VALID_TABLES.has(table)) {
    return res.status(400).json({ success: false, error: `Tabel '${table}' tidak valid` });
  }
  const pool = getMySQLPool();
  if (pool) {
    try {
      if (table === "santri") {
        const [sRows] = await pool.query("SELECT `nama` FROM `santri` WHERE `id` = ? LIMIT 1", [id]);
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
    } catch (err) {
      console.warn(`MySQL DELETE /api/db/${table}/${id} error:`, err.message);
    }
  }
  let list = memoryStore.get(table) || [];
  memoryStore.set(table, list.filter((item) => item.id !== id));
  broadcastWebSocketMessage({
    event: "db_change",
    table,
    action: "delete",
    id
  });
  return res.json({ success: true });
});
app.post("/api/sync-role-permissions", async (req, res) => {
  const { roleName, permissions } = req.body;
  const pool = getMySQLPool();
  if (pool) {
    try {
      const [rRows] = await pool.query("SELECT `id` FROM `roles` WHERE `name` = ? LIMIT 1", [roleName]);
      if (rRows && rRows.length > 0) {
        const roleId = rRows[0].id;
        const [pRows] = await pool.query("SELECT `id`, `name` FROM `permissions`");
        const enabledPermIds = (pRows || []).filter((p) => permissions.includes(p.name)).map((p) => p.id);
        await pool.query("DELETE FROM `role_has_permissions` WHERE `role_id` = ?", [roleId]);
        for (const pid of enabledPermIds) {
          await pool.query("INSERT INTO `role_has_permissions` (`role_id`, `permission_id`) VALUES (?, ?)", [roleId, pid]);
        }
      }
    } catch (err) {
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
    } catch (err) {
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
var api_default = app;

// server.ts
import_dotenv2.default.config();
var PORT = process.env.PORT ? parseInt(process.env.PORT) : 3e3;
async function startServer() {
  const httpServer = import_http.default.createServer(api_default);
  const wss = new import_ws2.WebSocketServer({ server: httpServer });
  setWssInstance(wss);
  const onlineUsers = /* @__PURE__ */ new Map();
  wss.on("connection", (ws) => {
    let connectedUserId = null;
    ws.send(JSON.stringify({ type: "connected", timestamp: Date.now() }));
    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "presence_join" && msg.user) {
          connectedUserId = msg.user.id || Math.random().toString(36).substring(2);
          onlineUsers.set(connectedUserId, { ...msg.user, id: connectedUserId, lastSeen: Date.now() });
          broadcastWebSocketMessage({ type: "online_users", users: Array.from(onlineUsers.values()) });
        } else if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        }
      } catch (err) {
        console.error("Error handling WebSocket message:", err);
      }
    });
    ws.on("close", () => {
      if (connectedUserId && onlineUsers.has(connectedUserId)) {
        onlineUsers.delete(connectedUserId);
        broadcastWebSocketMessage({ type: "online_users", users: Array.from(onlineUsers.values()) });
      }
    });
    ws.on("error", (err) => {
      console.warn("WebSocket client error:", err.message);
    });
  });
  if (process.env.NODE_ENV === "development") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    api_default.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    api_default.use(import_express2.default.static(distPath));
    api_default.use("/attaroqqy", import_express2.default.static(distPath));
    api_default.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running with Realtime WebSockets on http://localhost:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = api_default;
//# sourceMappingURL=server.cjs.map
