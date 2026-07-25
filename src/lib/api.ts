// Client-side Supabase Database API Helper & Sync Manager
import { createClient } from "@supabase/supabase-js";
import { formatBigDigit } from "./utils";

export interface SupabaseStatus {
  connected: boolean;
  url: string | null;
  anonKey?: string | null;
  reason: "connected" | "missing_keys";
}

let clientInstance: any = null;

export async function getSupabaseClient(): Promise<any> {
  if (clientInstance) return clientInstance;
  
  const status = await getSupabaseStatus();
  if (status.connected && status.url && status.anonKey) {
    let sanitizedUrl = status.url.trim();
    if (sanitizedUrl.endsWith('/')) {
      sanitizedUrl = sanitizedUrl.slice(0, -1);
    }
    if (sanitizedUrl.endsWith('/rest/v1')) {
      sanitizedUrl = sanitizedUrl.slice(0, -8);
    }
    if (sanitizedUrl.endsWith('/')) {
      sanitizedUrl = sanitizedUrl.slice(0, -1);
    }
    try {
      clientInstance = createClient(sanitizedUrl, status.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      return clientInstance;
    } catch (err) {
      console.error("Gagal menginisialisasi client Supabase di sisi client:", err);
      return null;
    }
  }
  return null;
}

// Convert camelCase string/object to snake_case
export function camelToSnake(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object' || obj instanceof Date || obj instanceof File || obj instanceof Blob) return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key
      .replace(/([A-Z])/g, "_$1")
      .replace(/([0-9]+)/g, "_$1")
      .replace(/_+/g, "_")
      .toLowerCase();
    result[snakeKey] = camelToSnake(obj[key]);
  }
  return result;
}

// Convert snake_case string/object to camelCase
export function snakeToCamel(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object' || obj instanceof Date || obj instanceof File || obj instanceof Blob) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z0-9])/g, (g) => g[1].toUpperCase());
    result[camelKey] = snakeToCamel(obj[key]);
  }
  return result;
}

// Helper to write to localStorage safely, preventing crash when browser quota is full
export function safeLocalStorageSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    if (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 ||
      error.code === 1014
    ) {
      console.warn("localStorage quota exceeded! Data was not saved locally, but continues in memory/remotely.", error);
      return false;
    }
    console.error("Failed to write to localStorage:", error);
    return false;
  }
}

// Helper to parse JSON safely and report HTML fallbacks
async function safeJsonParse(res: Response): Promise<any> {
  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";
  
  if (!contentType.includes("application/json") && (text.trim().startsWith("<") || text.trim().startsWith("<!doctype"))) {
    // Gracefully handle HTML/Server Startup/Proxy templates without throwing loud console.errors
    console.warn("Menerima respon HTML dari server. Kemungkinan server sedang melakukan startup atau restart.");
    throw new Error("Respon dari server tidak valid (bukan format JSON). Silakan segarkan halaman jika server baru saja dinyalakan.");
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn("Gagal memproses JSON. Response didapat:", text.slice(0, 100));
    throw new Error("Respon dari server tidak valid (bukan format JSON). Silakan segarkan halaman jika server baru saja dinyalakan.");
  }
}

// Check if Supabase connection is configured and available
export async function getSupabaseStatus(): Promise<SupabaseStatus> {
  try {
    const res = await fetch("/api/supabase-status");
    if (!res.ok) throw new Error("Status API error");
    return await safeJsonParse(res);
  } catch (error) {
    return { connected: false, url: null, reason: "missing_keys" };
  }
}

// Fetch list of items from table (Full online Supabase)
export async function fetchTableData<T>(table: string, localKey?: string, defaultValue: T[] = []): Promise<T[]> {
  try {
    const status = await getSupabaseStatus();
    if (status.connected) {
      const res = await fetch(`/api/db/${table}`);
      if (res.ok) {
        const result = await safeJsonParse(res);
        if (result.success && Array.isArray(result.data)) {
          // Translate snake_case keys from database to camelCase for the React application
          const camelCasedData = snakeToCamel(result.data) as T[];
          // Deduplicate by ID to prevent duplicate keys in React loops
          const uniqueMap = new Map<any, T>();
          camelCasedData.forEach((item: any) => {
            if (item && item.id) {
              uniqueMap.set(item.id, item);
            } else if (item) {
              uniqueMap.set(Math.random().toString(), item);
            }
          });
          const fetchedData = Array.from(uniqueMap.values());
          if (localKey && fetchedData.length > 0) {
            safeLocalStorageSetItem(localKey, JSON.stringify(fetchedData));
          }
          return fetchedData;
        }
      }
    }
  } catch (err) {
    console.warn(`Supabase query failed for table ${table}.`, err);
  }

  if (localKey) {
    try {
      const localStr = localStorage.getItem(localKey);
      if (localStr) {
        const parsed = JSON.parse(localStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  return defaultValue;
}

// Insert single row directly to Supabase online (with fallback to localStorage)
export async function insertTableRow<T extends { id?: any }>(table: string, localKey: string, row: T): Promise<T> {
  let remoteRow = { ...row };
  try {
    const status = await getSupabaseStatus();
    if (status.connected) {
      const snakeCasedRow = camelToSnake(row);
      const res = await fetch(`/api/db/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snakeCasedRow),
      });
      if (res.ok) {
        const result = await safeJsonParse(res);
        if (result.success && result.data) {
          const camelRemote = snakeToCamel(result.data);
          const remoteObj = Array.isArray(camelRemote) ? camelRemote[0] : camelRemote;
          if (remoteObj && typeof remoteObj === 'object') {
            const merged: any = { id: row.id, ...row };
            const strFields = ['nik', 'nisn', 'noKk', 'nikAyah', 'nikIbu', 'noHp', 'nism', 'rt', 'rw'];
            for (const k of Object.keys(remoteObj)) {
              if (remoteObj[k] !== undefined && remoteObj[k] !== null && remoteObj[k] !== '') {
                if (strFields.includes(k)) {
                  const clientVal = formatBigDigit((row as any)[k]);
                  const serverVal = formatBigDigit(remoteObj[k]);
                  if (clientVal && clientVal !== '-' && clientVal.length > serverVal.length) {
                    merged[k] = clientVal;
                  } else if (!clientVal || clientVal === '-') {
                    merged[k] = clientVal;
                  } else {
                    merged[k] = serverVal || clientVal;
                  }
                } else {
                  merged[k] = typeof remoteObj[k] === 'number' ? String(remoteObj[k]) : remoteObj[k];
                }
              }
            }
            remoteRow = merged as T;
          }
        }
      }
    }
  } catch (err) {
    console.warn(`Supabase insert failed for ${table}, storing locally.`, err);
  }

  if (localKey && remoteRow) {
    try {
      const localStr = localStorage.getItem(localKey);
      const list = localStr ? JSON.parse(localStr) : [];
      if (Array.isArray(list)) {
        const updated = [remoteRow, ...list.filter((x: any) => x.id !== remoteRow.id)];
        safeLocalStorageSetItem(localKey, JSON.stringify(updated));
      }
    } catch (e) {}
  }

  return remoteRow;
}

// Insert multiple rows in bulk/batch directly to Supabase online (with fallback to localStorage)
export async function insertTableRows<T extends { id?: any }>(table: string, localKey: string, rows: T[]): Promise<T[]> {
  if (!rows || rows.length === 0) return [];
  
  let finalRows = [...rows];
  try {
    const status = await getSupabaseStatus();
    if (status.connected) {
      const snakeCasedRows = camelToSnake(rows);
      const res = await fetch(`/api/db/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snakeCasedRows),
      });
      if (res.ok) {
        const result = await safeJsonParse(res);
        if (result.success && result.data) {
          const fetched = result.data;
          const remoteRows = (Array.isArray(fetched) ? snakeToCamel(fetched) : [snakeToCamel(fetched)]) as T[];
          if (remoteRows && remoteRows.length > 0) {
            finalRows = remoteRows;
          }
        }
      }
    }
  } catch (err) {
    console.warn(`Supabase batch insert failed for ${table}, storing locally.`, err);
  }

  if (localKey && finalRows.length > 0) {
    try {
      const localStr = localStorage.getItem(localKey);
      const list = localStr ? JSON.parse(localStr) : [];
      if (Array.isArray(list)) {
        const existingIds = new Set(finalRows.map(x => x.id));
        const updated = [...finalRows, ...list.filter((x: any) => !existingIds.has(x.id))];
        safeLocalStorageSetItem(localKey, JSON.stringify(updated));
      }
    } catch (e) {}
  }

  return finalRows;
}

// Update single row directly on Supabase online (with fallback to localStorage)
export async function updateTableRow<T extends { id?: any }>(
  table: string,
  localKey: string,
  id: string | number,
  updatedData: Partial<T>
): Promise<T> {
  let remoteRow = { id, ...updatedData } as T;
  try {
    const status = await getSupabaseStatus();
    if (status.connected) {
      const snakeCasedData = camelToSnake(updatedData);
      const res = await fetch(`/api/db/${table}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snakeCasedData),
      });
      if (res.ok) {
        const result = await safeJsonParse(res);
        if (result.success && result.data) {
          const camelRemote = snakeToCamel(result.data);
          const cleanedRemote: any = {};
          if (camelRemote && typeof camelRemote === 'object') {
            const strFields = ['nik', 'nisn', 'noKk', 'nikAyah', 'nikIbu', 'noHp', 'nism', 'rt', 'rw'];
            for (const k of Object.keys(camelRemote)) {
              if (camelRemote[k] !== undefined) {
                if (strFields.includes(k)) {
                  const clientVal = formatBigDigit((updatedData as any)[k]);
                  const serverVal = formatBigDigit(camelRemote[k]);
                  if (clientVal && clientVal !== '-' && clientVal.length > serverVal.length) {
                    cleanedRemote[k] = clientVal;
                  } else if (!clientVal || clientVal === '-') {
                    cleanedRemote[k] = clientVal;
                  } else {
                    cleanedRemote[k] = serverVal || clientVal;
                  }
                } else {
                  cleanedRemote[k] = camelRemote[k];
                }
              }
            }
          }
          remoteRow = { id, ...updatedData, ...cleanedRemote } as T;
          const identifierFields = ['nik', 'nisn', 'noKk', 'nikAyah', 'nikIbu', 'noHp', 'nism', 'rt', 'rw'];
          for (const key of identifierFields) {
            const clientVal = formatBigDigit((updatedData as any)[key]);
            const serverVal = formatBigDigit((remoteRow as any)[key]);
            if (clientVal && clientVal !== '-' && clientVal.length > serverVal.length) {
              (remoteRow as any)[key] = clientVal;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn(`Supabase update failed for ${table}/${id}, updating locally.`, err);
  }

  if (localKey) {
    try {
      const localStr = localStorage.getItem(localKey);
      const list = localStr ? JSON.parse(localStr) : [];
      if (Array.isArray(list)) {
        const exists = list.some((item: any) => item.id === id);
        const updated = exists
          ? list.map((item: any) => (item.id === id ? { ...item, ...remoteRow } : item))
          : [{ id, ...remoteRow }, ...list];
        safeLocalStorageSetItem(localKey, JSON.stringify(updated));
      }
    } catch (e) {}
  }

  return remoteRow;
}

// Delete single row directly on Supabase online (with fallback to localStorage)
export async function deleteTableRow(table: string, localKey: string, id: string | number): Promise<boolean> {
  try {
    const status = await getSupabaseStatus();
    if (status.connected) {
      await fetch(`/api/db/${table}/${id}`, { method: "DELETE" });
    }
  } catch (err) {
    console.warn(`Supabase delete failed for ${table}/${id}, deleting locally.`, err);
  }

  if (localKey) {
    try {
      const localStr = localStorage.getItem(localKey);
      if (localStr) {
        const list = JSON.parse(localStr);
        if (Array.isArray(list)) {
          const updated = list.filter((item: any) => item.id !== id);
          safeLocalStorageSetItem(localKey, JSON.stringify(updated));
        }
      }
    } catch (e) {}
  }

  return true;
}

// Upload file to Supabase Storage Bucket
export async function uploadFileToStorage(base64DataUrl: string, originalName: string, fieldKey: string): Promise<string> {
  const status = await getSupabaseStatus();
  if (!status.connected) {
    // Fallback if Supabase is offline (keeps local copy)
    console.warn("Supabase is not connected. Using raw base64 data url as fallback storage.");
    return base64DataUrl;
  }

  // Extract base64 content and content type
  const match = base64DataUrl.match(/^data:(.*);base64,(.*)$/);
  if (!match) {
    throw new Error("Format file tidak valid.");
  }
  const contentType = match[1];
  const base64Data = match[2];

  // Create a unique filename
  const extension = originalName.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 7);
  const uniqueFileName = `${fieldKey}_${timestamp}_${randomStr}.${extension}`;

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: uniqueFileName,
      fileBase64: base64Data,
      contentType: contentType
    })
  });

  if (!res.ok) {
    const errData = await safeJsonParse(res).catch(() => ({}));
    throw new Error(errData.error || "Gagal mengunggah file ke server.");
  }

  const result = await safeJsonParse(res);
  if (result.success && result.publicUrl) {
    return result.publicUrl;
  } else {
    throw new Error(result.error || "Gagal mendapatkan URL file dari server.");
  }
}

