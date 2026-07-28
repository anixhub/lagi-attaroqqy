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
var import_path2 = __toESM(require("path"), 1);
var import_dotenv2 = __toESM(require("dotenv"), 1);

// api/index.ts
var import_express = __toESM(require("express"), 1);
var import_supabase_js = require("@supabase/supabase-js");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_path = __toESM(require("path"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
app.use(import_express.default.json({ limit: "10mb" }));
var supabaseClient = null;
function getSupabase() {
  let url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  url = url.trim();
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  if (url.endsWith("/rest/v1")) {
    url = url.slice(0, -8);
  }
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  if (!supabaseClient) {
    try {
      supabaseClient = (0, import_supabase_js.createClient)(url, key);
    } catch (err) {
      console.error("Gagal menginisialisasi client Supabase:", err.message);
      return null;
    }
  }
  return supabaseClient;
}
app.get("/api/supabase-status", (req, res) => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const isReady = !!(url && key);
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || null;
  res.json({
    connected: isReady,
    url: url || null,
    anonKey,
    reason: isReady ? "connected" : "missing_keys"
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
app.get("/api/download-sql-supabase", (req, res) => {
  const filePath = import_path.default.join(process.cwd(), "supabase_setup.sql");
  res.download(filePath, "supabase_setup.sql", (err) => {
    if (err) {
      res.status(500).send("Gagal mengunduh skema SQL Supabase");
    }
  });
});
app.get("/api/storage-stats", async (req, res) => {
  const client = getSupabase();
  if (!client) {
    return res.json({
      success: false,
      databaseSize: 125e4,
      bucketSize: 24e5,
      isFallback: true,
      error: "SUPABASE_NOT_CONFIGURED"
    });
  }
  try {
    const { data, error } = await client.rpc("get_storage_stats");
    if (error) {
      console.warn("RPC get_storage_stats failed, using default fallback sizes:", error);
      return res.json({
        success: true,
        databaseSize: 125e4,
        // 1.25 MB estimate fallback
        bucketSize: 24e5,
        // 2.4 MB estimate fallback
        isFallback: true
      });
    }
    if (data && data.length > 0) {
      res.json({
        success: true,
        databaseSize: Number(data[0].database_size) || 125e4,
        bucketSize: Number(data[0].bucket_size) || 0,
        isFallback: false
      });
    } else {
      res.json({
        success: true,
        databaseSize: 125e4,
        bucketSize: 24e5,
        isFallback: true
      });
    }
  } catch (err) {
    console.error("Error in /api/storage-stats handler:", err);
    res.json({
      success: true,
      databaseSize: 125e4,
      bucketSize: 24e5,
      isFallback: true,
      error: err.message
    });
  }
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
  const client = getSupabase();
  if (!client) {
    return res.json({ success: false, error: "SUPABASE_NOT_CONFIGURED" });
  }
  try {
    const emailLower = (username || "").trim().toLowerCase();
    const defaultUser = "superadmin@attaroqqy.com";
    const defaultPass = "1234";
    const { data, error } = await client.from("app_credentials").select("*").eq("username", emailLower).maybeSingle();
    if (error) throw error;
    let matchedUser = data;
    if (!matchedUser && emailLower === defaultUser && password === defaultPass) {
      const newId = "superadmin";
      const payload = {
        id: newId,
        username: defaultUser,
        password: defaultPass,
        role: "superadmin",
        status: "approved",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      await client.from("app_credentials").insert(payload);
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
    if (!matchedUser) {
      return res.status(401).json({ success: false, error: "Email atau Kata Sandi salah atau akun Anda tidak terdaftar." });
    }
    if (matchedUser.password !== password) {
      return res.status(401).json({ success: false, error: "Email atau Kata Sandi salah." });
    }
    const needsCancelReset = matchedUser.status === "minta_reset";
    if (matchedUser.status === "pending") {
      return res.status(403).json({ success: false, error: "Sesi Tertunda: Pendaftaran akun Anda masih menunggu persetujuan (approval) dari Superadmin." });
    } else if (matchedUser.status === "rejected") {
      return res.status(403).json({ success: false, error: "Akses Ditolak: Pendaftaran akun Anda ditolak oleh Superadmin." });
    }
    res.json({
      success: true,
      needsCancelReset,
      user: {
        id: matchedUser.id,
        username: matchedUser.username,
        role: matchedUser.role,
        status: matchedUser.status,
        displayName: matchedUser.display_name || matchedUser.displayName,
        avatarUrl: matchedUser.avatar_url || matchedUser.avatarUrl
      }
    });
  } catch (err) {
    console.error("Auth handler error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/upload", async (req, res) => {
  const client = getSupabase();
  if (!client) {
    return res.json({ success: false, error: "SUPABASE_NOT_CONFIGURED" });
  }
  try {
    const { fileName, fileBase64, contentType } = req.body;
    if (!fileName || !fileBase64) {
      return res.status(400).json({ success: false, error: "fileName and fileBase64 are required" });
    }
    const buffer = Buffer.from(fileBase64, "base64");
    const { data, error } = await client.storage.from("santri-assets").upload(fileName, buffer, {
      contentType: contentType || "application/octet-stream",
      upsert: true
    });
    if (error) {
      console.error("Supabase Storage Upload Error:", error);
      throw error;
    }
    const { data: urlData } = client.storage.from("santri-assets").getPublicUrl(fileName);
    res.json({
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl
    });
  } catch (err) {
    console.error("Storage upload handler exception:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/sync-role-permissions", async (req, res) => {
  const { roleName, permissions } = req.body;
  const client = getSupabase();
  if (!client) {
    return res.json({ success: false, error: "SUPABASE_NOT_CONFIGURED" });
  }
  try {
    const { data: roleData, error: roleError } = await client.from("roles").select("id").eq("name", roleName).maybeSingle();
    if (roleError) throw roleError;
    if (!roleData) {
      return res.status(404).json({ success: false, error: `Role '${roleName}' tidak ditemukan.` });
    }
    const roleId = roleData.id;
    const { data: permData, error: permError } = await client.from("permissions").select("id, name");
    if (permError) throw permError;
    const enabledPermIds = permData.filter((p) => permissions.includes(p.name)).map((p) => p.id);
    const { error: delError } = await client.from("role_has_permissions").delete().eq("role_id", roleId);
    if (delError) throw delError;
    if (enabledPermIds.length > 0) {
      const inserts = enabledPermIds.map((pid) => ({
        role_id: roleId,
        permission_id: pid
      }));
      const { error: insError } = await client.from("role_has_permissions").insert(inserts);
      if (insError) throw insError;
    }
    res.json({ success: true });
  } catch (err) {
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
app.get("/api/db/:table", async (req, res) => {
  const { table } = req.params;
  const client = getSupabase();
  if (!client) {
    return res.json({ success: false, error: "SUPABASE_NOT_CONFIGURED" });
  }
  try {
    let allData = [];
    let from = 0;
    const step = 1e3;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await client.from(table).select("*").range(from, from + step - 1);
      if (error) throw error;
      if (data && data.length > 0) {
        allData = allData.concat(data);
        if (data.length < step) {
          hasMore = false;
        } else {
          from += step;
        }
      } else {
        hasMore = false;
      }
    }
    let finalData = stripPassword(table, allData);
    if (table === "santri") {
      finalData = unpackPendidikanFormal(finalData);
    }
    res.json({ success: true, data: finalData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
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
function extractMissingColumn(errMessage) {
  if (!errMessage) return null;
  let match = errMessage.match(/column "([^"]+)"/i);
  if (match && match[1]) return match[1];
  match = errMessage.match(/Could not find the '([^']+)' column/i);
  if (match && match[1]) return match[1];
  match = errMessage.match(/Could not find column '([^']+)'/i);
  if (match && match[1]) return match[1];
  match = errMessage.match(/column '([^']+)'/i);
  if (match && match[1]) return match[1];
  match = errMessage.match(/column ([a-zA-Z0-9_]+) does not exist/i);
  if (match && match[1]) return match[1];
  return null;
}
async function performInsertWithRetry(client, table, body, attemptsLeft = 15) {
  const { data, error } = await client.from(table).insert(body).select();
  if (error && attemptsLeft > 0) {
    const errMessage = error.message || "";
    const colName = extractMissingColumn(errMessage);
    if (colName) {
      console.warn(`Table '${table}' is missing column '${colName}'. Stripping and retrying.`);
      let newBody;
      const camelCol = colName.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
      const snakeCol = colName.replace(/([A-Z])/g, "_$1").toLowerCase();
      if (Array.isArray(body)) {
        newBody = body.map((item) => {
          const copy = { ...item };
          delete copy[colName];
          delete copy[camelCol];
          delete copy[snakeCol];
          return copy;
        });
      } else {
        newBody = { ...body };
        delete newBody[colName];
        delete newBody[camelCol];
        delete newBody[snakeCol];
      }
      return performInsertWithRetry(client, table, newBody, attemptsLeft - 1);
    }
  }
  return { data, error };
}
async function performUpdateWithRetry(client, table, id, body, attemptsLeft = 15) {
  const updateBody = { ...body };
  delete updateBody.id;
  const { data, error } = await client.from(table).update(updateBody).eq("id", id).select();
  if (error && attemptsLeft > 0) {
    const errMessage = error.message || "";
    const colName = extractMissingColumn(errMessage);
    if (colName) {
      console.warn(`Table '${table}' is missing column '${colName}'. Stripping and retrying.`);
      const camelCol = colName.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
      const snakeCol = colName.replace(/([A-Z])/g, "_$1").toLowerCase();
      const newBody = { ...body };
      delete newBody[colName];
      delete newBody[camelCol];
      delete newBody[snakeCol];
      return performUpdateWithRetry(client, table, id, newBody, attemptsLeft - 1);
    }
  }
  if (!error && (!data || data.length === 0)) {
    console.warn(`Row with id '${id}' not found in table '${table}' during update. Performing insert/upsert fallback.`);
    const insertPayload = { id, ...body };
    return performInsertWithRetry(client, table, insertPayload, attemptsLeft);
  }
  return { data, error };
}
app.post("/api/db/:table", async (req, res) => {
  const { table } = req.params;
  const client = getSupabase();
  if (!client) {
    return res.json({ success: false, error: "SUPABASE_NOT_CONFIGURED" });
  }
  try {
    let sanitizedBody = sanitizePayload(req.body);
    if (table === "kelas") {
      delete sanitizedBody.tingkatan;
      delete sanitizedBody.kapasitas;
      delete sanitizedBody.tingkatan_kelas;
      delete sanitizedBody.kapasitas_kelas;
    } else if (table === "santri") {
      sanitizedBody = packPendidikanFormal(sanitizedBody);
    } else if (table === "rombel_assignment") {
      const isUuid = (val) => typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      if (Array.isArray(sanitizedBody)) {
        sanitizedBody = sanitizedBody.map((item) => {
          const copy = { ...item };
          if (copy.id && !isUuid(copy.id)) delete copy.id;
          return copy;
        });
      } else if (sanitizedBody && !isUuid(sanitizedBody.id)) {
        delete sanitizedBody.id;
      }
    }
    const isArray = Array.isArray(sanitizedBody);
    const { data, error } = await performInsertWithRetry(client, table, sanitizedBody);
    if (error) {
      throw error;
    }
    let resultData = stripPassword(table, isArray ? data || [] : data?.[0] || null);
    if (table === "santri") {
      resultData = unpackPendidikanFormal(resultData);
    }
    res.json({ success: true, data: resultData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.put("/api/db/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  const client = getSupabase();
  if (!client) {
    return res.json({ success: false, error: "SUPABASE_NOT_CONFIGURED" });
  }
  try {
    let sanitizedBody = sanitizePayload(req.body);
    if (table === "kelas") {
      delete sanitizedBody.tingkatan;
      delete sanitizedBody.kapasitas;
      delete sanitizedBody.tingkatan_kelas;
      delete sanitizedBody.kapasitas_kelas;
    } else if (table === "santri") {
      sanitizedBody = packPendidikanFormal(sanitizedBody);
    } else if (table === "rombel_assignment") {
      const isUuid = (val) => typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      if (sanitizedBody && !isUuid(sanitizedBody.id)) {
        delete sanitizedBody.id;
      }
    }
    const { data, error } = await performUpdateWithRetry(client, table, id, sanitizedBody);
    if (error) {
      throw error;
    }
    let resultData = stripPassword(table, data?.[0] || null);
    if (table === "santri") {
      resultData = unpackPendidikanFormal(resultData);
    }
    res.json({ success: true, data: resultData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.delete("/api/db/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  const client = getSupabase();
  if (!client) {
    return res.json({ success: false, error: "SUPABASE_NOT_CONFIGURED" });
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
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/db-truncate-all", async (req, res) => {
  const client = getSupabase();
  if (!client) {
    return res.json({ success: false, error: "SUPABASE_NOT_CONFIGURED" });
  }
  try {
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
    for (const table of tables) {
      if (table === "app_credentials") {
        const { error } = await client.from(table).delete().neq("id", "superadmin");
        if (error) console.error(`Gagal menghapus ${table}:`, error);
      } else if (table === "periode") {
        const { error } = await client.from(table).delete().neq("id", "Semua");
        if (error) console.error(`Gagal menghapus ${table}:`, error);
      } else if (table === "pesantren_profile") {
        const { error } = await client.from(table).update({
          nama_pesantren: "Pondok Pesantren Darussalam Al-Azhar",
          nama_yayasan: "Yayasan Pendidikan Islam Darussalam",
          nspp: "121235070001",
          nomor_notaris: "Akte Notaris No. 24 Tanggal 18 April 2011",
          alamat: "Jl. Pesantren No. 45, Kebonagung",
          desa: "Kebonagung",
          kecamatan: "Sawahan",
          kabupaten: "Nganjuk",
          provinsi: "Jawa Timur",
          kode_pos: "64475",
          telepon: "081234567890",
          email: "info@darussalam-alazhar.org",
          website: "www.darussalam-alazhar.org",
          nama_pengasuh: "KH. Muhammad Shodiq, M.Ag.",
          nama_wakil_pengasuh: "",
          nama_ketua_yayasan: "",
          nama_ketua_pondok: "Ustadz M. Syarifuddin",
          nama_sekretaris: "Ustadz M. Syukron, M.Pd.",
          nama_bendahara: "Ustadz H. Ahmad Ridwan",
          nama_ketua_keamanan: "Ustadz H. Sholihin",
          nama_ketua_pendidikan: "Ustadz Kholilur Rahman, S.Pd.",
          kota_tanda_tangan: "Nganjuk",
          logo_style: "classic",
          logo_url: "",
          kop_tambahan_1: "AKREDITASI A (SANGAT BAIK) - SK BAN-SM No. 134/BAN-SM/2022",
          kop_tambahan_2: "Akte Notaris No. 24 Tanggal 18 April 2011 - SK Kemenkumham No. AHU-4521.AH.01.04"
        }).eq("id", "main");
        if (error) console.error(`Gagal mereset ${table}:`, error);
      } else {
        const { error } = await client.from(table).delete().not("id", "is", null);
        if (error) {
          const { error: err2 } = await client.from(table).delete().neq("id", "-9999");
          if (err2) {
            console.error(`Gagal menghapus ${table} dengan fallback:`, err2);
          }
        }
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var api_default = app;

// server.ts
import_dotenv2.default.config();
var PORT = process.env.PORT ? parseInt(process.env.PORT) : 3e3;
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    api_default.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    api_default.use(import_express2.default.static(distPath));
    api_default.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  api_default.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = api_default;
//# sourceMappingURL=server.cjs.map
