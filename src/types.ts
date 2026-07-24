export interface Santri {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  kamar: string;
  asal: string;
  gender: 'Putra' | 'Putri';
  tanggalMasuk: string;

  // Identitas Santri tambahan
  nisn?: string;
  nism?: string;
  nik?: string;
  noKk?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  anakKe?: number;
  dariBersaudara?: number;

  // Orang Tua
  namaAyah?: string;
  nikAyah?: string;
  pekerjaanAyah?: string;
  pendidikanAyah?: string;
  namaIbu?: string;
  nikIbu?: string;
  pekerjaanIbu?: string;
  pendidikanIbu?: string;

  // Alamat & Kontak
  alamat?: string;
  rt?: string;
  rw?: string;
  desa?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  jarakRumah?: number; // dalam km
  noHp?: string;

  // Status Tambahan
  statusKeanggotaan: 'Aktif' | 'Alumni' | 'Meninggal';
  status?: string;
  statusDomisili?: 'Muqim' | 'Kampung';
  statusEmis?: 'Terdaftar' | 'Belum';
  statusVerval?: 'Sukses' | 'Proses';

  // Administrasi
  tanggalKeluar?: string;
  catatan?: string;
  pendidikanTerakhir?: string;

  // Dokumen (simulated filenames or content)
  fileKk?: string;
  fileKtp?: string;
  fileAkta?: string;
  fileIjazah?: string;
  filePasFoto?: string;
  nomorLemari?: string;
  pendidikanInternal?: string;
  pendidikanFormal?: string;
}

export interface Surat {
  id: string;
  noSurat: string;
  perihal: string;
  tanggal: string;
  jenis: 'Masuk' | 'Keluar';
  mitra: string; // Pengirim atau Penerima
  kategori: 'Undangan' | 'Pemberitahuan' | 'Permohonan' | 'Keputusan' | 'Rekomendasi';
  status: 'Diarsipkan' | 'Dalam Proses' | 'Mendesak';
}

export interface KeamananRecord {
  id: string;
  namaSantri: string;
  kamar: string;
  jenisPelanggaran: string;
  tanggal: string;
  tindakan: string;
  poin: number;
  santriId?: string;
  nis?: string;
}

export interface BendaharaRecord {
  id: string;
  namaSantri: string;
  kamar: string;
  bulan: string;
  nominal: number;
  status: 'Lunas' | 'Belum Lunas';
  tanggalBayar?: string;
}

export interface KelasPendidikan {
  id: string;
  namaKelas: string;
  waliKelas: string;
  jumlahSantri: number;
  tingkatan: 'Ula' | 'Wustho' | 'Ulya';
}

export interface HumasAgenda {
  id: string;
  namaAcara: string;
  tanggal: string;
  lokasi: string;
  penanggungJawab: string;
  targetPeserta: string;
}

export interface Lembaga {
  id: string;
  nama: string;
  kode: string; // e.g., "MADIN", "MA", "TAHFIDZ"
  deskripsi?: string;
  gender?: 'Putra' | 'Putri';
  jenis?: 'Formal' | 'Internal' | 'Rombel';
  logo?: string;
  taMulaiTanggal?: number; // 1-31
  taMulaiBulan?: number; // 1-12
  taSelesaiTanggal?: number; // 1-31
  taSelesaiBulan?: number; // 1-12
}

export interface Kelas {
  id: string;
  lembagaId: string;
  nama: string;
  waliKelas: string;
  tingkatan: 'Ula' | 'Wustho' | 'Ulya' | 'Lainnya';
  kapasitas?: number;
  batasUsiaHari?: number;
  batasUsiaBulan?: number;
  batasUsiaUmurMin?: number;
  batasUsiaUmurMax?: number;
  isDefault?: boolean;
}

export const isDefaultClass = (c: { id?: string; nama?: string; isDefault?: boolean } | null | undefined): boolean => {
  if (!c) return false;
  if (c.nama) {
    const lower = c.nama.trim().toLowerCase();
    if (lower === 'calon pelajar' || lower === 'calon peserta didik') return true;
  }
  if (c.id && (c.id.endsWith('-default') || c.id.includes('-default'))) return true;
  if (c.isDefault !== undefined) return Boolean(c.isDefault);
  return false;
};

export const getClsLembagaId = (c: any): string => {
  if (!c) return '';
  return String(c.lembagaId || c.lembaga_id || '').trim();
};

export const isGenderMatch = (lembagaGender?: string | null, santriGender?: string | null): boolean => {
  if (!lembagaGender) return true;
  const lG = lembagaGender.trim().toLowerCase();
  if (lG === 'campuran' || lG === 'semua' || lG === 'semua gender' || lG === '') return true;
  if (!santriGender) return true;
  const sG = santriGender.trim().toLowerCase();
  
  const isMale = (g: string) => g === 'putra' || g === 'laki-laki' || g === 'l';
  const isFemale = (g: string) => g === 'putri' || g === 'perempuan' || g === 'p';

  if (isMale(lG) && isMale(sG)) return true;
  if (isFemale(lG) && isFemale(sG)) return true;
  return lG === sG;
};

export const isEmisTerdaftar = (status?: string | null): boolean => {
  return (status || '').trim().toLowerCase() === 'terdaftar';
};

export interface KategoriRombel {
  id: string;
  nama: string; // e.g., "Kelompok Ngaji Kitab", "Setoran Hafalan"
  deskripsi?: string;
}

export interface KelompokRombel {
  id: string;
  kategoriId: string;
  nama: string; // e.g., "Kelompok Al-Farabi", "Halaqah B1"
  pembimbing: string; // Ustadz/Ustadzah
  kuota?: number;
}

export interface KelasAssignment {
  santriId: string;
  kelasId: string;
}

export interface RombelAssignment {
  id?: string;
  santriId: string;
  kategoriId: string;
  kelompokId: string;
}

export interface Kompleks {
  id: string;
  nama: string;
  kode: string;
  deskripsi?: string;
  gender?: 'Putra' | 'Putri';
}

export interface Kamar {
  id: string;
  kompleksId: string;
  nama: string;
  ketuaKamar: string;
  kapasitas: number;
}

export interface RuleRepetisi {
  id: string;
  kaliKe: number;
  poin: number;
  tazir: string;
}

export interface KatalogPelanggaranItem {
  id: string;
  nama: string;
  kategori: 'Ringan' | 'Sedang' | 'Berat' | 'Sangat Berat';
  deskripsi?: string;
  rules: RuleRepetisi[];
  defaultPoin: number;
  defaultTazir: string;
  gender?: 'Putra' | 'Putri';
  repetitionStrategy?: 'repeat_1_2' | 'same_as_2' | 'custom';
}

export interface PerizinanRecord {
  id: string;
  namaSantri: string;
  kelas: string;
  kamar: string;
  jenisIzin: 'Sakit' | 'Keperluan Keluarga' | 'Pulang Bulanan' | 'Lainnya';
  tanggalMulai: string;
  tanggalSelesai: string;
  keterangan: string;
  status: 'Izin Aktif' | 'Sudah Kembali' | 'Keluar Selesai' | 'Izin Dicabut';
  tanggalKembali?: string;
  gender: 'Putra' | 'Putri';
  isCabut?: boolean;
  tanggalCabut?: string;
  alasanCabut?: string;
  santriId?: string;
  nis?: string;
}

export interface AppCredentials {
  id: string;
  username: string;
  password?: string;
  role: 'superadmin' | 'sekretaris_putra' | 'sekretaris_putri' | 'bendahara_putra' | 'bendahara_putri' | 'pendidikan_putra' | 'pendidikan_putri' | 'humas_putra' | 'humas_putri' | 'keamanan_putra' | 'keamanan_putri';
  status: 'pending' | 'approved' | 'rejected' | 'minta_reset';
  displayName?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

