import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();

// Enable JSON parsing with a 10MB limit for compressed base64 photos
app.use(express.json({ limit: "10mb" }));

// Lazy initialised Supabase client
let supabaseClient: any = null;

function getSupabase() {
  let url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    return null;
  }
  
  // Sanitize url: remove trailing slashes or /rest/v1 suffix
  url = url.trim();
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  if (url.endsWith('/rest/v1')) {
    url = url.slice(0, -8);
  }
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
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

// Supabase Connection Status
app.get("/api/supabase-status", (req, res) => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const isReady = !!(url && key);
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || null;
  
  res.json({
    connected: isReady,
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

// Fetch active storage statistics (Database size & Bucket size)
app.get("/api/storage-stats", async (req, res) => {
  const client = getSupabase();
  if (!client) {
    return res.json({ 
      success: false, 
      databaseSize: 1250000, 
      bucketSize: 2400000, 
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
        databaseSize: 1250000, // 1.25 MB estimate fallback
        bucketSize: 2400000,    // 2.4 MB estimate fallback
        isFallback: true
      });
    }

    if (data && data.length > 0) {
      res.json({
        success: true,
        databaseSize: Number(data[0].database_size) || 1250000,
        bucketSize: Number(data[0].bucket_size) || 0,
        isFallback: false
      });
    } else {
      res.json({
        success: true,
        databaseSize: 1250000,
        bucketSize: 2400000,
        isFallback: true
      });
    }
  } catch (err: any) {
    console.error("Error in /api/storage-stats handler:", err);
    res.json({
      success: true,
      databaseSize: 1250000,
      bucketSize: 2400000,
      isFallback: true,
      error: err.message
    });
  }
});

// Helper to strip password from app_credentials output for security (Anti-inspect element)
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

// Secure Server-Side Login Authentication Endpoint
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const client = getSupabase();
  if (!client) {
    return res.json({ success: false, error: "SUPABASE_NOT_CONFIGURED" });
  }

  try {
    const emailLower = (username || "").trim().toLowerCase();
    
    // Check if it's default superadmin
    const defaultUser = 'superadmin@attaroqqy.com';
    const defaultPass = '1234';
    
    // Fetch from db
    const { data, error } = await client
      .from("app_credentials")
      .select("*")
      .eq("username", emailLower)
      .maybeSingle();

    if (error) throw error;

    let matchedUser = data;

    // If no matching user exists in DB yet, but they typed default superadmin credentials, allow and auto-seed
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

    // Verify password (plain text as currently stored)
    if (matchedUser.password !== password) {
      return res.status(401).json({ success: false, error: "Email atau Kata Sandi salah." });
    }

    const needsCancelReset = matchedUser.status === 'minta_reset';

    // Check account status
    if (matchedUser.status === 'pending') {
      return res.status(403).json({ success: false, error: "Sesi Tertunda: Pendaftaran akun Anda masih menunggu persetujuan (approval) dari Superadmin." });
    } else if (matchedUser.status === 'rejected') {
      return res.status(403).json({ success: false, error: "Akses Ditolak: Pendaftaran akun Anda ditolak oleh Superadmin." });
    }

    // Successfully authenticated
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

  } catch (err: any) {
    console.error("Auth handler error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Storage Upload Endpoint (Foto & Berkas)
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

    // Decode base64 to buffer
    const buffer = Buffer.from(fileBase64, "base64");

    // Upload to 'santri-assets' bucket in Supabase storage
    const { data, error } = await client.storage
      .from("santri-assets")
      .upload(fileName, buffer, {
        contentType: contentType || "application/octet-stream",
        upsert: true
      });

    if (error) {
      console.error("Supabase Storage Upload Error:", error);
      throw error;
    }

    // Retrieve public URL
    const { data: urlData } = client.storage
      .from("santri-assets")
      .getPublicUrl(fileName);

    res.json({
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl
    });
  } catch (err: any) {
    console.error("Storage upload handler exception:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Generic API Endpoints to map to Supabase Tables
app.post("/api/sync-role-permissions", async (req, res) => {
  const { roleName, permissions } = req.body;
  const client = getSupabase();
  if (!client) {
    return res.json({ success: false, error: "SUPABASE_NOT_CONFIGURED" });
  }

  try {
    // 1. Get role id
    const { data: roleData, error: roleError } = await client
      .from("roles")
      .select("id")
      .eq("name", roleName)
      .maybeSingle();
      
    if (roleError) throw roleError;
    if (!roleData) {
      return res.status(404).json({ success: false, error: `Role '${roleName}' tidak ditemukan.` });
    }
    const roleId = roleData.id;

    // 2. Get all permissions
    const { data: permData, error: permError } = await client
      .from("permissions")
      .select("id, name");
    if (permError) throw permError;

    const enabledPermIds = permData
      .filter((p: any) => permissions.includes(p.name))
      .map((p: any) => p.id);

    // 3. Delete all existing mappings for this role
    const { error: delError } = await client
      .from("role_has_permissions")
      .delete()
      .eq("role_id", roleId);
    if (delError) throw delError;

    // 4. Insert new mappings
    if (enabledPermIds.length > 0) {
      const inserts = enabledPermIds.map((pid: any) => ({
        role_id: roleId,
        permission_id: pid
      }));
      const { error: insError } = await client
        .from("role_has_permissions")
        .insert(inserts);
      if (insError) throw insError;
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to pack pendidikan_formal into catatan if column is missing
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
    // Clear PF tag if formal education is empty, Tanpa Kelas, or if kelas is Tanpa Kelas
    if (copy.catatan && typeof copy.catatan === "string") {
      copy.catatan = copy.catatan.replace(/\[PF:.*?\]\s*/g, "").trim() || null;
    }
  }
  return copy;
}

// Helper to unpack pendidikan_formal from catatan when reading from database
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

app.get("/api/db/:table", async (req, res) => {
  const { table } = req.params;
  const client = getSupabase();
  if (!client) {
    return res.json({ success: false, error: "SUPABASE_NOT_CONFIGURED" });
  }

  try {
    // Fetch all rows in chunks of 1000 to bypass Supabase's default 1000-row PostgREST limit
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
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to sanitize payload: convert all empty strings to null for database safety
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

// Extract missing column name from PostgreSQL/PostgREST error messages
function extractMissingColumn(errMessage: string): string | null {
  if (!errMessage) return null;

  // 1. Matches PostgreSQL syntax: column "status" does not exist
  let match = errMessage.match(/column "([^"]+)"/i);
  if (match && match[1]) return match[1];

  // 2. Matches PostgREST syntax: Could not find the 'status' column of 'santri' in the schema cache
  match = errMessage.match(/Could not find the '([^']+)' column/i);
  if (match && match[1]) return match[1];

  // 3. Matches PostgREST syntax: Could not find column 'status' in schema cache
  match = errMessage.match(/Could not find column '([^']+)'/i);
  if (match && match[1]) return match[1];

  // 4. General "column 'status'" or similar
  match = errMessage.match(/column '([^']+)'/i);
  if (match && match[1]) return match[1];

  match = errMessage.match(/column ([a-zA-Z0-9_]+) does not exist/i);
  if (match && match[1]) return match[1];

  return null;
}

// Dynamically insert rows, stripping any columns that do not exist in the database and retrying
async function performInsertWithRetry(client: any, table: string, body: any, attemptsLeft = 15): Promise<{ data: any; error: any }> {
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
        newBody = body.map((item: any) => {
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

// Dynamically update rows, stripping any columns that do not exist in the database and retrying
async function performUpdateWithRetry(client: any, table: string, id: string, body: any, attemptsLeft = 15): Promise<{ data: any; error: any }> {
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

  // If no error occurred but 0 rows were updated (row with id was not in Supabase yet), fallback to performInsertWithRetry
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
      const isUuid = (val: any) => typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      if (Array.isArray(sanitizedBody)) {
        sanitizedBody = sanitizedBody.map((item: any) => {
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

    let resultData = stripPassword(table, isArray ? (data || []) : (data?.[0] || null));
    if (table === "santri") {
      resultData = unpackPendidikanFormal(resultData);
    }

    res.json({ success: true, data: resultData });
  } catch (err: any) {
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
      const isUuid = (val: any) => typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
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
  } catch (err: any) {
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
      // Find santri first to get name for cascading
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

// Truncate all tables for the administrative Danger Zone
app.post("/api/db-truncate-all", async (req, res) => {
  const client = getSupabase();
  if (!client) {
    return res.json({ success: false, error: "SUPABASE_NOT_CONFIGURED" });
  }

  try {
    // List of tables to truncate in correct dependency order
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
        // Only delete accounts that are NOT superadmin
        const { error } = await client.from(table).delete().neq("id", "superadmin");
        if (error) console.error(`Gagal menghapus ${table}:`, error);
      } else if (table === "periode") {
        // Only delete periods that are NOT 'Semua'
        const { error } = await client.from(table).delete().neq("id", "Semua");
        if (error) console.error(`Gagal menghapus ${table}:`, error);
      } else if (table === "pesantren_profile") {
        // Reset main pesantren profile instead of deleting
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
        // Delete all records from this table. A safe way is deleting where id is not null.
        const { error } = await client.from(table).delete().not("id", "is", null);
        if (error) {
          // Fallback if some table doesn't have "id" or has bigint id or string id
          const { error: err2 } = await client.from(table).delete().neq("id", "-9999");
          if (err2) {
            console.error(`Gagal menghapus ${table} dengan fallback:`, err2);
          }
        }
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default app;
