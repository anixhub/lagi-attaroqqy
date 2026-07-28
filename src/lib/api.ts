// Client-side Database API Helper & WebSocket Realtime Manager
import { formatBigDigit, mergeIdField } from "./utils";

export interface SupabaseStatus {
  connected: boolean;
  type?: string;
  url: string | null;
  anonKey?: string | null;
  reason: "connected" | "missing_keys";
}

// Global WebSocket connection for zero-latency real-time sync across devices
let sharedSocket: WebSocket | null = null;
const realtimeListeners = new Set<(event: any) => void>();
let reconnectTimer: any = null;

function initRealtimeWebSocket() {
  if (typeof window === "undefined") return;
  if (sharedSocket && (sharedSocket.readyState === WebSocket.CONNECTING || sharedSocket.readyState === WebSocket.OPEN)) {
    return;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}`;

  try {
    sharedSocket = new WebSocket(wsUrl);

    sharedSocket.onopen = () => {
      console.log("⚡ Realtime WebSocket connected to Express server.");
    };

    sharedSocket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        realtimeListeners.forEach((fn) => fn(payload));
      } catch (e) {
        console.error("Error parsing WebSocket event payload", e);
      }
    };

    sharedSocket.onclose = () => {
      sharedSocket = null;
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(initRealtimeWebSocket, 1500);
    };

    sharedSocket.onerror = () => {
      if (sharedSocket) {
        try {
          sharedSocket.close();
        } catch (e) {}
      }
    };
  } catch (err) {
    console.warn("Realtime WebSocket connection failed, retrying...", err);
  }
}

/**
 * Subscribe to real-time database changes broadcasted by the server.
 * Triggers instantly (0 delay) on any insert, update, delete across any device.
 */
export function subscribeRealtimeChanges(callback: (event: any) => void): () => void {
  initRealtimeWebSocket();
  realtimeListeners.add(callback);
  return () => {
    realtimeListeners.delete(callback);
  };
}

export async function getSupabaseClient(): Promise<any> {
  return null;
}

export async function getSupabaseStatus(): Promise<SupabaseStatus> {
  return { connected: true, type: "mysql_realtime", url: null, reason: "connected" };
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

// Helper to write to localStorage safely
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
      console.warn("localStorage quota exceeded! Data saved in memory/remotely.", error);
      return false;
    }
    console.error("Failed to write to localStorage:", error);
    return false;
  }
}

// Helper to parse JSON safely
async function safeJsonParse(res: Response): Promise<any> {
  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";
  
  if (!contentType.includes("application/json") && (text.trim().startsWith("<") || text.trim().startsWith("<!doctype"))) {
    console.warn("Menerima respon HTML dari server.");
    throw new Error("Respon dari server tidak valid (bukan format JSON).");
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Respon dari server tidak valid (bukan format JSON).");
  }
}

// Helper to resolve dynamic API URLs supporting subpath hosting
export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  
  const envApiUrl = (import.meta as any).env?.VITE_API_URL;
  if (envApiUrl && typeof envApiUrl === 'string' && envApiUrl.trim() !== '') {
    const baseUrl = envApiUrl.trim().endsWith('/') ? envApiUrl.trim().slice(0, -1) : envApiUrl.trim();
    return `${baseUrl}${cleanEndpoint}`;
  }

  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0 && parts[0] !== 'api' && !parts[0].includes('.')) {
      return `/${parts[0]}${cleanEndpoint}`;
    }
  }
  return cleanEndpoint;
}

// Fetch list of items from table
export async function fetchTableData<T>(table: string, localKey?: string, defaultValue: T[] = []): Promise<T[]> {
  try {
    const url = getApiUrl(`/api/db/${table}?_t=${Date.now()}`);
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (res.ok) {
      const result = await safeJsonParse(res);
      if (result.success && Array.isArray(result.data)) {
        const camelCasedData = snakeToCamel(result.data) as T[];
        const uniqueMap = new Map<any, T>();
        camelCasedData.forEach((item: any) => {
          if (item && item.id) {
            uniqueMap.set(item.id, item);
          } else if (item) {
            uniqueMap.set(Math.random().toString(), item);
          }
        });
        const fetchedData = Array.from(uniqueMap.values());
        if (localKey) {
          safeLocalStorageSetItem(localKey, JSON.stringify(fetchedData));
        }
        return fetchedData;
      }
    }
  } catch (err) {
    console.warn(`Fetch query failed for table ${table}.`, err);
  }

  if (localKey) {
    try {
      const localStr = localStorage.getItem(localKey);
      if (localStr) {
        const parsed = JSON.parse(localStr);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {}
  }

  return defaultValue;
}

// Insert single row
export async function insertTableRow<T extends { id?: any }>(table: string, localKey: string, row: T): Promise<T> {
  let remoteRow = { ...row };
  try {
    const snakeCasedRow = camelToSnake(row);
    const res = await fetch(getApiUrl(`/api/db/${table}`), {
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
            if (remoteObj[k] !== undefined) {
              if (strFields.includes(k)) {
                merged[k] = mergeIdField((row as any)[k], remoteObj[k]);
              } else {
                merged[k] = typeof remoteObj[k] === 'number' ? String(remoteObj[k]) : remoteObj[k];
              }
            }
          }
          remoteRow = merged as T;
        }
      }
    }
  } catch (err) {
    console.warn(`Insert failed for ${table}, storing locally.`, err);
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

// Insert multiple rows
export async function insertTableRows<T extends { id?: any }>(table: string, localKey: string, rows: T[]): Promise<T[]> {
  if (!rows || rows.length === 0) return [];
  
  let finalRows = [...rows];
  try {
    const snakeCasedRows = camelToSnake(rows);
    const res = await fetch(getApiUrl(`/api/db/${table}`), {
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
  } catch (err) {
    console.warn(`Batch insert failed for ${table}, storing locally.`, err);
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

// Update single row
export async function updateTableRow<T extends { id?: any }>(
  table: string,
  localKey: string,
  id: string | number,
  updatedData: Partial<T>
): Promise<T> {
  let remoteRow = { id, ...updatedData } as T;
  try {
    const snakeCasedData = camelToSnake(updatedData);
    const res = await fetch(getApiUrl(`/api/db/${table}/${id}`), {
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
                cleanedRemote[k] = mergeIdField((updatedData as any)[k], camelRemote[k]);
              } else {
                cleanedRemote[k] = camelRemote[k];
              }
            }
          }
        }
        remoteRow = { id, ...updatedData, ...cleanedRemote } as T;
      }
    }
  } catch (err) {
    console.warn(`Update failed for ${table}/${id}, updating locally.`, err);
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

// Delete single row
export async function deleteTableRow(table: string, localKey: string, id: string | number): Promise<boolean> {
  try {
    await fetch(getApiUrl(`/api/db/${table}/${id}`), { method: "DELETE" });
  } catch (err) {
    console.warn(`Delete failed for ${table}/${id}, deleting locally.`, err);
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

// Upload file
export async function uploadFileToStorage(base64DataUrl: string, originalName: string, fieldKey: string): Promise<string> {
  const match = base64DataUrl.match(/^data:(.*);base64,(.*)$/);
  if (!match) {
    throw new Error("Format file tidak valid.");
  }
  const contentType = match[1];
  const base64Data = match[2];

  const extension = originalName.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 7);
  const uniqueFileName = `${fieldKey}_${timestamp}_${randomStr}.${extension}`;

  const res = await fetch(getApiUrl("/api/upload"), {
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
