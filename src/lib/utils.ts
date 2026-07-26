import { Santri, Lembaga, Kelas } from '../types';

export function formatBigDigit(val: any): string {
  if (val === undefined || val === null || val === '') return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '-') return '-';
    if (/^\d+$/.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.includes('e') || trimmed.includes('E')) {
      try {
        return BigInt(Math.round(Number(trimmed))).toString();
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }
  if (typeof val === 'number') {
    try {
      return BigInt(Math.round(val)).toString();
    } catch {
      return String(val);
    }
  }
  return String(val).trim();
}

export function mergeIdField(localRaw: any, remoteRaw: any): string {
  const localVal = formatBigDigit(localRaw);
  const remoteVal = formatBigDigit(remoteRaw);
  
  const localValid = Boolean(localVal && localVal !== '-');
  const remoteValid = Boolean(remoteVal && remoteVal !== '-');

  if (localValid && remoteValid) {
    return localVal.length >= remoteVal.length ? localVal : remoteVal;
  }
  if (localValid) return localVal;
  if (remoteValid) return remoteVal;
  return localVal || remoteVal || '';
}

export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

export const PENDIDIKAN_OPTIONS = [
  'Tidak Sekolah',
  'SD/MI',
  'SMP/MTs',
  'SMA/MA/MAK',
  'D1',
  'D2',
  'D3',
  'D4',
  'S1',
  'S2',
  'S3',
  'Lainnya'
] as const;

export function normalizePendidikan(val?: string | null): string {
  if (!val || val === '-' || String(val).trim() === '') {
    return 'Tidak Sekolah';
  }

  const raw = String(val).trim();
  const lower = raw.toLowerCase();

  if (
    lower === 'tidak sekolah' ||
    lower === 'belum sekolah' ||
    lower === 'tidak/belum sekolah' ||
    lower === 'tanpa sekolah' ||
    lower === 'tidak'
  ) {
    return 'Tidak Sekolah';
  }

  // Exact option matches
  const matchedExact = PENDIDIKAN_OPTIONS.find(opt => opt.toLowerCase() === lower);
  if (matchedExact) return matchedExact;

  // SD / MI
  if (
    lower === 'sd' ||
    lower === 'mi' ||
    lower === 'sd/mi' ||
    lower === 'sd-mi' ||
    lower.includes('sekolah dasar') ||
    lower.includes('madrasah ibtidaiyah')
  ) {
    return 'SD/MI';
  }

  // SMP / MTs
  if (
    lower === 'smp' ||
    lower === 'mts' ||
    lower === 'smp/mts' ||
    lower === 'smp-mts' ||
    lower.includes('sekolah menengah pertama') ||
    lower.includes('madrasah tsanawiyah')
  ) {
    return 'SMP/MTs';
  }

  // SMA / MA / MAK / SMK / SLTA
  if (
    lower === 'sma' ||
    lower === 'ma' ||
    lower === 'mak' ||
    lower === 'smk' ||
    lower === 'slta' ||
    lower === 'aliyah' ||
    lower === 'sma/ma/mak' ||
    lower === 'sma/ma/smk' ||
    lower === 'sma/ma' ||
    lower.includes('sekolah menengah atas') ||
    lower.includes('madrasah aliyah') ||
    lower.includes('sekolah menengah kejuruan')
  ) {
    return 'SMA/MA/MAK';
  }

  // Diplomas & Degrees
  if (lower === 'd1' || lower === 'd-1' || lower === 'diploma 1') return 'D1';
  if (lower === 'd2' || lower === 'd-2' || lower === 'diploma 2') return 'D2';
  if (lower === 'd3' || lower === 'd-3' || lower === 'diploma 3') return 'D3';
  if (lower === 'd4' || lower === 'd-4' || lower === 'diploma 4') return 'D4';
  if (lower === 's1' || lower === 's-1' || lower.includes('sarjana')) return 'S1';
  if (lower === 's2' || lower === 's-2' || lower.includes('magister') || lower.includes('pascasarjana')) return 'S2';
  if (lower === 's3' || lower === 's-3' || lower.includes('doktor')) return 'S3';

  if (lower === 'lainnya' || lower === 'lain-lain' || lower === 'other') {
    return 'Lainnya';
  }

  return 'Lainnya';
}

export function formatDateDDMMYYYY(dateVal?: string | number | Date | null): string {
  if (!dateVal || dateVal === '-' || String(dateVal).trim() === '') return '-';
  const str = String(dateVal).trim();

  // If already in DD-MM-YYYY format (e.g. 25-07-2026 or 05-08-2010 or 5-8-2010)
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
    const parts = str.split('-');
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${day}-${month}-${year}`;
  }

  // If in YYYY-MM-DD format (e.g. 2026-07-25)
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const parts = str.split('-');
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${day}-${month}-${year}`;
  }

  // If in DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const parts = str.split('/');
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${day}-${month}-${year}`;
  }

  // If in YYYY/MM/DD
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(str)) {
    const parts = str.split('/');
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${day}-${month}-${year}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return str;
}

export function demoteSantriToCalonPesertaDidik(
  santri: Santri,
  lembagasList?: Lembaga[],
  kelasList?: Kelas[]
): Santri {
  const currentClasses = santri.kelas
    ? santri.kelas.split(',').map(x => x.trim()).filter(Boolean)
    : [];

  // Identify formal lembagas
  const formalLembagaIds: string[] = [];
  let formalLembagas: Lembaga[] = [];
  if (lembagasList) {
    formalLembagas = lembagasList.filter(l => {
      if (l.jenis) return l.jenis === 'Formal';
      const lower = (l.nama || '').toLowerCase();
      return !lower.includes('madin') && !lower.includes('diniyah') && !lower.includes('tpq') &&
             !lower.includes('tahfidz') && !lower.includes('pondok') && !lower.includes('kitab') &&
             !lower.includes('internal');
    });
    formalLembagaIds.push(...formalLembagas.map(l => String(l.id)));
  }

  // Identify formal class names
  const formalClassNamesSet = new Set<string>();
  if (kelasList && formalLembagaIds.length > 0) {
    kelasList.forEach(k => {
      const lemId = String(k.lembagaId || (k as any).lembaga_id || '');
      if (formalLembagaIds.includes(lemId) && k.nama) {
        formalClassNamesSet.add(k.nama.trim().toLowerCase());
      }
    });
  }

  // Filter out formal classes & old default labels from currentClasses
  const nonFormalClasses = currentClasses.filter(c => {
    const lower = c.toLowerCase();
    if (lower === 'tanpa kelas' || lower === 'calon peserta didik' || lower === 'calon pelajar') {
      return false;
    }
    if (formalClassNamesSet.has(lower)) {
      return false;
    }
    return true;
  });

  // Combine 'Calon Peserta Didik' + non-formal classes
  const newClasses = Array.from(new Set(['Calon Peserta Didik', ...nonFormalClasses]));
  const finalKelasString = newClasses.join(', ');

  // Update pendidikanFormal
  let newFormal = santri.pendidikanFormal;
  if (santri.pendidikanFormal && santri.pendidikanFormal.trim() !== '') {
    const parts = santri.pendidikanFormal.split(' - ');
    const lemName = parts[0].trim();
    if (lemName) {
      newFormal = `${lemName} - Calon Peserta Didik`;
    } else {
      newFormal = 'Calon Peserta Didik';
    }
  } else if (formalLembagas.length > 0) {
    let matchedLem: Lembaga | undefined;
    if (kelasList && currentClasses.length > 0) {
      for (const cName of currentClasses) {
        const foundCls = kelasList.find(k => k.nama.trim().toLowerCase() === cName.toLowerCase());
        if (foundCls) {
          const lemId = String(foundCls.lembagaId || (foundCls as any).lembaga_id || '');
          matchedLem = formalLembagas.find(l => String(l.id) === lemId);
          if (matchedLem) break;
        }
      }
    }
    if (matchedLem) {
      newFormal = `${matchedLem.nama} - Calon Peserta Didik`;
    }
  }

  return {
    ...santri,
    statusEmis: 'Belum',
    kelas: finalKelasString,
    pendidikanFormal: newFormal || '',
  };
}

export function compressImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Use image/png for PNG to preserve transparency, otherwise image/jpeg for smaller file size
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressedBase64 = canvas.toDataURL(mimeType, file.type === 'image/png' ? undefined : quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
