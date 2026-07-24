-- ==========================================
-- SMART SANTRI SUPABASE SETUP & BLUEPRINT
-- ==========================================
-- Log Perubahan Database:
-- [2026-07-24]
-- * Penambahan/mempertahankan kolom 'pendidikan_formal' (TEXT) pada tabel 'santri' agar tersimpan langsung di Supabase.
-- * Penyesuaian kolom 'id' pada tabel 'rombel_assignment' dari UUID ke TEXT agar fleksibel menerima string ID buatan aplikasi maupun UUID secara seamless.
-- * Pembaruan fungsi trigger 'cascade_delete_santri_related_records' untuk menghapus data relasi berdasarkan santri_id dan mencakup rombel_assignment.
-- [2026-07-15]
-- * Penambahan kolom 'santri_id' (TEXT) dan 'nis' (VARCHAR(20)) pada tabel 'keamanan' dan 'perizinan' untuk mencegah bentrokan data bagi santri dengan nama yang sama.
-- * Menghapus nama dummy untuk Ketua Yayasan ('Drs. H. M. Zainul Arifin') dan Wakil Pengasuh ('KH. Abul Huda, Lc.') pada tabel pesantren_profile (mengubah nilai default dan data awal menjadi kosong/empty string).
-- [2026-07-14]
-- * Mengubah kolom 'ketua_kamar' pada tabel 'kamar' menjadi NULLABLE agar tidak melanggar batasan NOT NULL saat menyisipkan atau mengosongkan data.
-- * Penambahan PostgreSQL trigger dan function 'cascade_delete_santri_related_records' untuk mengotomatiskan cascade delete records terkait (Keamanan, Bendahara, Perizinan, dan Kamar) ketika data Santri dihapus.
-- * Pembaruan tabel 'feedback' dengan menambahkan kolom 'is_starred' (bintang) dan 'sender_email' (email) untuk mendukung saringan pesan berbintang dan detail pengirim.
-- * Pembuatan tabel 'feedback' untuk menampung masukan dan pesan langsung dari akun pengurus lain ke Superadmin.
-- * Penambahan kolom-kolom identitas pesantren baru untuk Wakil Pengasuh, Ketua Yayasan, Ketua Pondok, Ketua Keamanan, Ketua Pendidikan, dan Nomor Notaris pada tabel pesantren_profile.
-- [2026-07-13]
-- * Pembuatan PostgreSQL function 'get_storage_stats' untuk menghitung ukuran valid Database Storage dan Bucket Storage di Supabase.
-- * Penambahan alur lupa kata sandi mandiri dengan status 'minta_reset' (Minta Reset Sandi) pada kolom status tabel 'app_credentials'.
-- [2026-07-12]
-- * Penambahan kolom 'role', 'status', 'created_at' di tabel 'app_credentials' untuk sistem registrasi dan persetujuan (approval) multi-pengurus.
-- * Penambahan tabel 'app_credentials' untuk manajemen kredensial login superadmin secara dinamis.
-- * Penambahan tabel 'perizinan' untuk mencatat izin pulang/keluar santri secara terpusat di cloud.
-- * Penambahan tabel 'katalog_pelanggaran' untuk sinkronisasi Buku Induk Sanksi/Tata Tertib ke database.
-- * Penambahan tabel 'periode' untuk menyimpan data periode sanksi (keamanan), termasuk status aktif/tidak aktif.
-- [2026-07-11]
-- * Penghapusan kolom 'tingkatan' dan 'kapasitas' pada tabel 'kelas' sesuai permintaan pengguna demi simplifikasi modul akademik.
-- * Penambahan tabel 'pesantren_profile' untuk menyimpan data identitas resmi pesantren sebagai acuan cetak dokumen (surat resmi, kuitansi, rapot, dll).
-- * Pemisahan total modul perijinan antara Putra dan Putri (10 modul x 2 aksi = 20 permissions).
-- * Pemetaan otomatis default permissions berdasarkan peran masing-masing pengurus asrama putra & putri.
-- * Penyederhanaan matrix permission sebelumnya menjadi 10 permission (5 modul x 2 aksi: view, write).
-- [2026-07-10]
-- * Penambahan tabel 'permissions', 'roles', 'model_has_permissions', 'model_has_roles', dan 'role_has_permissions' sesuai skema standar Spatie Laravel-Permission.
-- [2026-07-02]
-- * Penambahan kolom 'nomor_lemari' pada tabel santri untuk manajemen nomor lemari santri di kamar.
-- * Penambahan tabel 'document_templates' untuk menyimpan template dokumen persuratan (.docx).
-- * Penambahan tabel 'document_generation_logs' untuk pencatatan riwayat pencetakan dokumen santri.
-- * Aktivasi RLS dan seeding data template bawaan (Surat Keterangan Aktif & Surat Izin Pulang).
-- * Penyelarasan skema untuk modul 'Data Kamar Santri' di Humasy, menggunakan kolom 'kamar' yang sudah tersedia pada tabel 'santri'.
-- [2026-07-01]
-- * Inisialisasi skema dasar SmartSantri (santri, surat, bendahara, keamanan).
-- * Penambahan tabel 'lembaga' untuk mengelompokkan lembaga pendidikan formal/non-formal di pondok.
-- * Penambahan kolom 'gender' pada tabel 'lembaga' untuk memisahkan secara total lembaga Putra dan Putri.
-- * Penambahan tabel 'kelas' untuk manajemen jenjang kelas per lembaga dengan Wali Kelas dan kapasitas.
-- * Penambahan kolom 'kelas_id' pada tabel 'santri' untuk mereferensikan kelas secara relasional.
-- * Penambahan tabel 'kategori_rombel' untuk kategori rombongan belajar dinamis (e.g. Kelompok Ngaji, Tahfidz).
-- * Penambahan tabel 'kelompok_rombel' untuk detail unit kelompok belajar dengan pembimbing dan kuota.
-- * Penambahan tabel 'rombel_assignment' sebagai tabel junction relasi many-to-many antara santri dan rombel.
-- * Aktivasi Row Level Security (RLS) pada seluruh tabel baru dengan kebijakan akses publik dan terotentikasi.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1b. SEQUENCES (Harus dibuat di awal sebelum tabel utama untuk DEFAULT nextval)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'santri_seq') THEN
        CREATE SEQUENCE santri_seq START WITH 9;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'lembaga_seq') THEN
        CREATE SEQUENCE lembaga_seq START WITH 5;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'kelas_seq') THEN
        CREATE SEQUENCE kelas_seq START WITH 9;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'kompleks_seq') THEN
        CREATE SEQUENCE kompleks_seq START WITH 8;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'kamar_seq') THEN
        CREATE SEQUENCE kamar_seq START WITH 9;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'rombel_cat_seq') THEN
        CREATE SEQUENCE rombel_cat_seq START WITH 4;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'rombel_group_seq') THEN
        CREATE SEQUENCE rombel_group_seq START WITH 8;
    END IF;
END
$$;

-- 2. TABEL UTAMA: SANTRI
CREATE TABLE IF NOT EXISTS santri (
    id TEXT PRIMARY KEY DEFAULT 'S' || lpad(nextval('santri_seq'::regclass)::text, 3, '0'),
    nis VARCHAR(20) UNIQUE,
    nama VARCHAR(100) NOT NULL,
    kelas TEXT, -- Kelas tekstual asli (digunakan TEXT agar tidak terpotong saat santri punya banyak kelas/lembaga)
    kamar TEXT, -- Kamar tekstual asli
    asal VARCHAR(100),
    gender VARCHAR(10) CHECK (gender IN ('Putra', 'Putri')),
    tanggal_masuk DATE DEFAULT CURRENT_DATE,
    nisn VARCHAR(20),
    nism VARCHAR(30),
    nik CHAR(16),
    no_kk CHAR(16),
    tempat_lahir VARCHAR(50),
    tanggal_lahir DATE,
    anak_ke INTEGER,
    dari_bersaudara INTEGER,
    nama_ayah VARCHAR(100),
    nik_ayah CHAR(16),
    pekerjaan_ayah VARCHAR(50),
    pendidikan_ayah VARCHAR(50),
    nama_ibu VARCHAR(100),
    nik_ibu CHAR(16),
    pekerjaan_ibu VARCHAR(50),
    pendidikan_ibu VARCHAR(50),
    alamat TEXT,
    rt VARCHAR(10),
    rw VARCHAR(10),
    desa VARCHAR(50),
    kecamatan VARCHAR(50),
    kabupaten VARCHAR(50),
    provinsi VARCHAR(50),
    jarak_rumah NUMERIC(5,2),
    no_hp VARCHAR(20),
    status_keanggotaan VARCHAR(20) DEFAULT 'Aktif',
    status_domisili VARCHAR(20) DEFAULT 'Muqim',
    status_emis VARCHAR(20) DEFAULT 'Belum',
    status_verval VARCHAR(20) DEFAULT 'Belum',
    tanggal_keluar DATE,
    catatan TEXT,
    file_kk TEXT,
    file_ktp TEXT,
    file_akta TEXT,
    file_ijazah TEXT,
    file_pas_foto TEXT,
    nomor_lemari VARCHAR(30),
    pendidikan_terakhir VARCHAR(50) DEFAULT 'SD/MI',
    pendidikan_formal TEXT,
    pendidikan_internal TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Migrasi kolom pendidikan_terakhir, status_emis, status_verval, kelas, dan kamar pada santri untuk database yang sudah ada
DO $$
BEGIN
    -- Mengubah tipe data kelas dan kamar agar cukup menampung kombinasi multi-kelas yang panjang
    ALTER TABLE santri ALTER COLUMN kelas TYPE TEXT;
    ALTER TABLE santri ALTER COLUMN kamar TYPE TEXT;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='santri' AND column_name='pendidikan_terakhir') THEN
        ALTER TABLE santri ADD COLUMN pendidikan_terakhir VARCHAR(50) DEFAULT 'SD/MI';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='santri' AND column_name='status_emis') THEN
        ALTER TABLE santri ADD COLUMN status_emis VARCHAR(20) DEFAULT 'Belum';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='santri' AND column_name='status_verval') THEN
        ALTER TABLE santri ADD COLUMN status_verval VARCHAR(20) DEFAULT 'Belum';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='santri' AND column_name='pendidikan_formal') THEN
        ALTER TABLE santri ADD COLUMN pendidikan_formal TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='santri' AND column_name='pendidikan_internal') THEN
        ALTER TABLE santri ADD COLUMN pendidikan_internal TEXT;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='santri' AND column_name='status_hidup') THEN
        ALTER TABLE santri DROP COLUMN status_hidup CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='santri' AND column_name='status') THEN
        ALTER TABLE santri DROP COLUMN status CASCADE;
    END IF;
END
$$;

-- Sequence helper untuk ID santri (dibuat di awal skema)

-- 3. TABEL LEMBAGA PENDIDIKAN
CREATE TABLE IF NOT EXISTS lembaga (
    id TEXT PRIMARY KEY DEFAULT 'L' || lpad(nextval('lembaga_seq'::regclass)::text, 3, '0'),
    nama VARCHAR(100) NOT NULL,
    kode VARCHAR(20) NOT NULL, -- MADIN, TAHFIDZ, dll
    deskripsi TEXT,
    gender VARCHAR(10) DEFAULT 'Putra' CHECK (gender IN ('Putra', 'Putri')),
    jenis VARCHAR(20) DEFAULT 'Internal' CHECK (jenis IN ('Internal')),
    logo TEXT,
    ta_mulai_tanggal INT DEFAULT 1,
    ta_mulai_bulan INT DEFAULT 7,
    ta_selesai_tanggal INT DEFAULT 30,
    ta_selesai_bulan INT DEFAULT 6,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT lembaga_kode_gender_key UNIQUE (kode, gender)
);

-- Migrasi kolom gender & penyesuaian constraint pada lembaga untuk database yang sudah ada
DO $$
BEGIN
    -- Tambah kolom jika belum ada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lembaga' AND column_name='gender') THEN
        ALTER TABLE lembaga ADD COLUMN gender VARCHAR(10) DEFAULT 'Putra' CHECK (gender IN ('Putra', 'Putri'));
    END IF;
    
    -- Tambah kolom jenis jika belum ada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lembaga' AND column_name='jenis') THEN
        ALTER TABLE lembaga ADD COLUMN jenis VARCHAR(20) DEFAULT 'Internal' CHECK (jenis IN ('Internal'));
    END IF;

    -- Tambah kolom logo jika belum ada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lembaga' AND column_name='logo') THEN
        ALTER TABLE lembaga ADD COLUMN logo TEXT;
    END IF;

    -- Tambah kolom ta_mulai_tanggal jika belum ada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lembaga' AND column_name='ta_mulai_tanggal') THEN
        ALTER TABLE lembaga ADD COLUMN ta_mulai_tanggal INT DEFAULT 1;
    END IF;

    -- Tambah kolom ta_mulai_bulan jika belum ada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lembaga' AND column_name='ta_mulai_bulan') THEN
        ALTER TABLE lembaga ADD COLUMN ta_mulai_bulan INT DEFAULT 7;
    END IF;

    -- Tambah kolom ta_selesai_tanggal jika belum ada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lembaga' AND column_name='ta_selesai_tanggal') THEN
        ALTER TABLE lembaga ADD COLUMN ta_selesai_tanggal INT DEFAULT 30;
    END IF;

    -- Tambah kolom ta_selesai_bulan jika belum ada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lembaga' AND column_name='ta_selesai_bulan') THEN
        ALTER TABLE lembaga ADD COLUMN ta_selesai_bulan INT DEFAULT 6;
    END IF;

    -- Hapus constraint lama yang membuat kode unik global (jika ada)
    ALTER TABLE lembaga DROP CONSTRAINT IF EXISTS lembaga_kode_key;
    
    -- Tambah constraint baru unik berdasarkan kode + gender jika belum ada
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lembaga_kode_gender_key') THEN
        ALTER TABLE lembaga ADD CONSTRAINT lembaga_kode_gender_key UNIQUE (kode, gender);
    END IF;
END
$$;

-- Sequence helper untuk ID lembaga (dibuat di awal skema)

-- 4. TABEL KELAS (Relasi Many-to-One ke Lembaga)
CREATE TABLE IF NOT EXISTS kelas (
    id TEXT PRIMARY KEY DEFAULT 'K' || lpad(nextval('kelas_seq'::regclass)::text, 3, '0'),
    lembaga_id TEXT REFERENCES lembaga(id) ON DELETE CASCADE,
    nama VARCHAR(50) NOT NULL,
    wali_kelas VARCHAR(100),
    batas_usia_hari INT DEFAULT 1,
    batas_usia_bulan INT DEFAULT 7,
    batas_usia_umur_min INT,
    batas_usia_umur_max INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Migrasi penyesuaian kolom pada tabel 'kelas' untuk database yang sudah ada
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kelas' AND column_name='tingkatan') THEN
        ALTER TABLE kelas DROP COLUMN tingkatan;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kelas' AND column_name='kapasitas') THEN
        ALTER TABLE kelas DROP COLUMN kapasitas;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kelas' AND column_name='wali_kelas' AND is_nullable='NO') THEN
        ALTER TABLE kelas ALTER COLUMN wali_kelas DROP NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kelas' AND column_name='batas_usia_hari') THEN
        ALTER TABLE kelas ADD COLUMN batas_usia_hari INT DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kelas' AND column_name='batas_usia_bulan') THEN
        ALTER TABLE kelas ADD COLUMN batas_usia_bulan INT DEFAULT 7;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kelas' AND column_name='batas_usia_umur_min') THEN
        ALTER TABLE kelas ADD COLUMN batas_usia_umur_min INT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kelas' AND column_name='batas_usia_umur_max') THEN
        ALTER TABLE kelas ADD COLUMN batas_usia_umur_max INT;
    END IF;
END
$$;

-- Sequence helper untuk ID kelas (dibuat di awal skema)

-- Tambahkan kolom 'kelas_id' pada tabel santri secara relasional
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='santri' AND column_name='kelas_id') THEN
        ALTER TABLE santri ADD COLUMN kelas_id TEXT REFERENCES kelas(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- Tambahkan kolom 'nomor_lemari' pada tabel santri secara relasional
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='santri' AND column_name='nomor_lemari') THEN
        ALTER TABLE santri ADD COLUMN nomor_lemari VARCHAR(30);
    END IF;
END
$$;

-- 4b. TABEL KOMPLEKS & KAMAR (HUMAS)
CREATE TABLE IF NOT EXISTS kompleks (
    id TEXT PRIMARY KEY DEFAULT 'KMP-' || lpad(nextval('kompleks_seq'::regclass)::text, 3, '0'),
    nama VARCHAR(100) NOT NULL,
    kode VARCHAR(20) NOT NULL,
    deskripsi TEXT,
    gender VARCHAR(10) DEFAULT 'Putra' CHECK (gender IN ('Putra', 'Putri')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT kompleks_kode_gender_key UNIQUE (kode, gender)
);

-- Sequence helper untuk ID kompleks (dibuat di awal skema)

CREATE TABLE IF NOT EXISTS kamar (
    id TEXT PRIMARY KEY DEFAULT 'KMR-' || lpad(nextval('kamar_seq'::regclass)::text, 3, '0'),
    kompleks_id TEXT REFERENCES kompleks(id) ON DELETE CASCADE,
    nama VARCHAR(50) NOT NULL,
    ketua_kamar VARCHAR(100), -- Diubah menjadi nullable agar tidak melanggar batasan NOT NULL saat data kosong
    kapasitas INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Migrasi kolom ketua_kamar menjadi nullable untuk database yang sudah ada
ALTER TABLE kamar ALTER COLUMN ketua_kamar DROP NOT NULL;

-- Sequence helper untuk ID kamar (dibuat di awal skema)

-- 5. TABEL KATEGORI ROMBONGAN BELAJAR (ROMBEL)
CREATE TABLE IF NOT EXISTS kategori_rombel (
    id TEXT PRIMARY KEY DEFAULT 'R' || lpad(nextval('rombel_cat_seq'::regclass)::text, 3, '0'),
    nama VARCHAR(100) NOT NULL, -- e.g. "Kelompok Ngaji Kitab", "Hafalan Al-Quran"
    deskripsi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Sequence helper untuk ID kategori rombel (dibuat di awal skema)

-- 6. TABEL KELOMPOK ROMBEL
CREATE TABLE IF NOT EXISTS kelompok_rombel (
    id TEXT PRIMARY KEY DEFAULT 'G' || lpad(nextval('rombel_group_seq'::regclass)::text, 3, '0'),
    kategori_id TEXT REFERENCES kategori_rombel(id) ON DELETE CASCADE,
    nama VARCHAR(100) NOT NULL, -- e.g. "Halaqah Al-Fatih", "Sorogan Fathul Qorib"
    pembimbing VARCHAR(100), -- Nama Ustadz/Ustadzah (Opsional)
    kuota INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Sequence helper untuk ID kelompok rombel (dibuat di awal skema)

-- 7. TABEL JUNCTION: ROMBEL ASSIGNMENT (Many-to-Many antara Santri dan Kelompok Rombel)
CREATE TABLE IF NOT EXISTS rombel_assignment (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    santri_id TEXT REFERENCES santri(id) ON DELETE CASCADE,
    kategori_id TEXT REFERENCES kategori_rombel(id) ON DELETE CASCADE,
    kelompok_id TEXT REFERENCES kelompok_rombel(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (santri_id, kategori_id) -- Menjamin santri hanya terdaftar di satu kelompok per kategori
);

-- Migrasi id rombel_assignment ke TEXT jika sebelumnya UUID
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rombel_assignment' AND column_name='id' AND data_type='uuid') THEN
        ALTER TABLE rombel_assignment ALTER COLUMN id TYPE TEXT USING id::text;
        ALTER TABLE rombel_assignment ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
    END IF;
END
$$;

-- 8. TABEL PELENGKAP LAIN (Surat, Bendahara, Keamanan)
CREATE TABLE IF NOT EXISTS surat (
    id VARCHAR(50) PRIMARY KEY,
    no_surat VARCHAR(100) UNIQUE NOT NULL,
    perihal VARCHAR(255) NOT NULL,
    tanggal DATE DEFAULT CURRENT_DATE,
    jenis VARCHAR(10) CHECK (jenis IN ('Masuk', 'Keluar')),
    mitra VARCHAR(100) NOT NULL,
    kategori VARCHAR(50) CHECK (kategori IN ('Undangan', 'Pemberitahuan', 'Permohonan', 'Keputusan', 'Rekomendasi')),
    status VARCHAR(20) DEFAULT 'Dalam Proses' CHECK (status IN ('Diarsipkan', 'Dalam Proses', 'Mendesak'))
);

CREATE TABLE IF NOT EXISTS bendahara (
    id VARCHAR(50) PRIMARY KEY,
    nama_santri VARCHAR(100) NOT NULL,
    kamar VARCHAR(50),
    bulan VARCHAR(30) NOT NULL,
    nominal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'Belum Lunas' CHECK (status IN ('Lunas', 'Belum Lunas')),
    tanggal_bayar DATE
);

CREATE TABLE IF NOT EXISTS keamanan (
    id VARCHAR(50) PRIMARY KEY,
    santri_id TEXT, -- ID santri yang unik
    nis VARCHAR(20), -- Nomor Induk Santri
    nama_santri VARCHAR(100) NOT NULL,
    kamar VARCHAR(50),
    jenis_pelanggaran TEXT NOT NULL,
    tanggal DATE DEFAULT CURRENT_DATE,
    tindakan TEXT,
    poin INTEGER DEFAULT 0
);

-- Migrasi penambahan kolom santri_id dan nis ke tabel keamanan untuk database lama
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='keamanan' AND column_name='santri_id') THEN
        ALTER TABLE keamanan ADD COLUMN santri_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='keamanan' AND column_name='nis') THEN
        ALTER TABLE keamanan ADD COLUMN nis VARCHAR(20);
    END IF;
END
$$;

-- 8b. TABEL PERIODE SANKSI
CREATE TABLE IF NOT EXISTS periode (
    id VARCHAR(50) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8c. TABEL PERIZINAN SANTRI
CREATE TABLE IF NOT EXISTS perizinan (
    id VARCHAR(50) PRIMARY KEY,
    santri_id TEXT, -- ID santri yang unik
    nis VARCHAR(20), -- Nomor Induk Santri
    nama_santri VARCHAR(100) NOT NULL,
    kelas TEXT,
    kamar TEXT,
    jenis_izin VARCHAR(50) NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    keterangan TEXT,
    status VARCHAR(50) NOT NULL,
    tanggal_kembali DATE,
    gender VARCHAR(10) CHECK (gender IN ('Putra', 'Putri')),
    is_cabut BOOLEAN DEFAULT FALSE,
    tanggal_cabut DATE,
    alasan_cabut TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Migrasi penambahan kolom santri_id dan nis ke tabel perizinan untuk database lama
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perizinan' AND column_name='santri_id') THEN
        ALTER TABLE perizinan ADD COLUMN santri_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perizinan' AND column_name='nis') THEN
        ALTER TABLE perizinan ADD COLUMN nis VARCHAR(20);
    END IF;
END
$$;

-- 8d. TABEL KATALOG PELANGGARAN (BUKU INDUK SANKSI)
CREATE TABLE IF NOT EXISTS katalog_pelanggaran (
    id VARCHAR(50) PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    kategori VARCHAR(50) NOT NULL,
    deskripsi TEXT,
    rules JSONB DEFAULT '[]'::jsonb,
    default_poin INTEGER DEFAULT 0,
    default_tazir TEXT,
    gender VARCHAR(10) CHECK (gender IN ('Putra', 'Putri')),
    repetition_strategy VARCHAR(50) DEFAULT 'repeat_1_2',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8e. TABEL KREDENSIAL KEAMANAN AKUN (SUPERADMIN & PENGURUS LAIN)
CREATE TABLE IF NOT EXISTS app_credentials (
    id TEXT PRIMARY KEY DEFAULT 'superadmin',
    username TEXT NOT NULL DEFAULT 'superadmin@attaroqqy.com',
    password TEXT NOT NULL DEFAULT '1234',
    role TEXT DEFAULT 'superadmin',
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrasi kolom-kolom baru ke app_credentials secara aman dan idempotent
DO $$
BEGIN
    -- Tambah kolom role jika belum ada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_credentials' AND column_name='role') THEN
        ALTER TABLE app_credentials ADD COLUMN role TEXT DEFAULT 'superadmin';
    END IF;

    -- Tambah kolom status jika belum ada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_credentials' AND column_name='status') THEN
        ALTER TABLE app_credentials ADD COLUMN status TEXT DEFAULT 'approved';
    END IF;

    -- Tambah kolom created_at jika belum ada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_credentials' AND column_name='created_at') THEN
        ALTER TABLE app_credentials ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Tambah kolom display_name jika belum ada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_credentials' AND column_name='display_name') THEN
        ALTER TABLE app_credentials ADD COLUMN display_name TEXT DEFAULT 'Admin Utama';
    END IF;

    -- Tambah kolom avatar_url jika belum ada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_credentials' AND column_name='avatar_url') THEN
        ALTER TABLE app_credentials ADD COLUMN avatar_url TEXT DEFAULT '';
    END IF;

    -- Tambah constraint UNIQUE untuk username agar tidak terjadi registrasi email ganda
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_credentials_username_key') THEN
        ALTER TABLE app_credentials ADD CONSTRAINT app_credentials_username_key UNIQUE (username);
    END IF;
END
$$;

-- Seeding default credentials jika belum ada
INSERT INTO app_credentials (id, username, password, role, status)
VALUES ('superadmin', 'superadmin@attaroqqy.com', '1234', 'superadmin', 'approved')
ON CONFLICT (id) DO NOTHING;


-- ==========================================
-- 8f. TRIGGER CASCADE DELETE DATA SANTRI
-- ==========================================
-- Jika data santri di data induk dihapus, maka secara otomatis hapus semua data cabangnya:
-- riwayat pelanggaran (keamanan), log perizinan (perizinan), data keuangan (bendahara),
-- dan kosongkan jabatan ketua_kamar jika santri yang bersangkutan terdaftar sebagai ketua kamar.
CREATE OR REPLACE FUNCTION cascade_delete_santri_related_records()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Hapus dari keamanan (Riwayat Pelanggaran)
    DELETE FROM keamanan WHERE santri_id = OLD.id OR nama_santri = OLD.nama;
    
    -- 2. Hapus dari bendahara (Keuangan / Pembayaran Bulanan)
    DELETE FROM bendahara WHERE nama_santri = OLD.nama;
    
    -- 3. Hapus dari perizinan (Log Perizinan & Data Keluar Masuk)
    DELETE FROM perizinan WHERE santri_id = OLD.id OR nama_santri = OLD.nama;

    -- 4. Hapus dari rombel_assignment (Assignment Rombongan Belajar)
    DELETE FROM rombel_assignment WHERE santri_id = OLD.id;
    
    -- 5. Kosongkan ketua_kamar jika santri yang dihapus adalah ketua kamar
    UPDATE kamar SET ketua_kamar = '' WHERE ketua_kamar = OLD.nama;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cascade_delete_santri ON santri;
CREATE TRIGGER trigger_cascade_delete_santri
BEFORE DELETE ON santri
FOR EACH ROW
EXECUTE FUNCTION cascade_delete_santri_related_records();


-- ==========================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ==========================================
-- Mengaktifkan RLS pada seluruh tabel demi keamanan data
ALTER TABLE santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE lembaga ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE kompleks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kamar ENABLE ROW LEVEL SECURITY;
ALTER TABLE kategori_rombel ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelompok_rombel ENABLE ROW LEVEL SECURITY;
ALTER TABLE rombel_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE surat ENABLE ROW LEVEL SECURITY;
ALTER TABLE bendahara ENABLE ROW LEVEL SECURITY;
ALTER TABLE keamanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE periode ENABLE ROW LEVEL SECURITY;
ALTER TABLE perizinan ENABLE ROW LEVEL SECURITY;
ALTER TABLE katalog_pelanggaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_credentials ENABLE ROW LEVEL SECURITY;

-- Membuat Kebijakan Akses (Policy) - Akses Terbuka / Berdasarkan Autentikasi
-- Karena aplikasi ini digunakan oleh pengurus terotentikasi, kita beri akses ALL untuk user terautentikasi, dan SELECT untuk umum jika diperlukan.

-- Kebijakan untuk SANTRI
DROP POLICY IF EXISTS "Akses penuh santri untuk user terotentikasi" ON santri;
CREATE POLICY "Akses penuh santri untuk user terotentikasi" ON santri 
    FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Akses publik baca santri" ON santri;
CREATE POLICY "Akses publik baca santri" ON santri 
    FOR SELECT USING (true);

-- Kebijakan untuk LEMBAGA
DROP POLICY IF EXISTS "Akses penuh lembaga untuk user terotentikasi" ON lembaga;
CREATE POLICY "Akses penuh lembaga untuk user terotentikasi" ON lembaga 
    FOR ALL USING (true) WITH CHECK (true);

-- Kebijakan untuk KELAS
DROP POLICY IF EXISTS "Akses penuh kelas untuk user terotentikasi" ON kelas;
CREATE POLICY "Akses penuh kelas untuk user terotentikasi" ON kelas 
    FOR ALL USING (true) WITH CHECK (true);

-- Kebijakan untuk KOMPLEKS
DROP POLICY IF EXISTS "Akses penuh kompleks untuk user terotentikasi" ON kompleks;
CREATE POLICY "Akses penuh kompleks untuk user terotentikasi" ON kompleks 
    FOR ALL USING (true) WITH CHECK (true);

-- Kebijakan untuk KAMAR
DROP POLICY IF EXISTS "Akses penuh kamar untuk user terotentikasi" ON kamar;
CREATE POLICY "Akses penuh kamar untuk user terotentikasi" ON kamar 
    FOR ALL USING (true) WITH CHECK (true);

-- Kebijakan untuk KATEGORI ROMBEL
DROP POLICY IF EXISTS "Akses penuh kategori rombel untuk user terotentikasi" ON kategori_rombel;
CREATE POLICY "Akses penuh kategori rombel untuk user terotentikasi" ON kategori_rombel 
    FOR ALL USING (true) WITH CHECK (true);

-- Kebijakan untuk KELOMPOK ROMBEL
DROP POLICY IF EXISTS "Akses penuh kelompok rombel untuk user terotentikasi" ON kelompok_rombel;
CREATE POLICY "Akses penuh kelompok rombel untuk user terotentikasi" ON kelompok_rombel 
    FOR ALL USING (true) WITH CHECK (true);

-- Kebijakan untuk ROMBEL ASSIGNMENT
DROP POLICY IF EXISTS "Akses penuh rombel assignment untuk user terotentikasi" ON rombel_assignment;
CREATE POLICY "Akses penuh rombel assignment untuk user terotentikasi" ON rombel_assignment 
    FOR ALL USING (true) WITH CHECK (true);

-- Kebijakan untuk SURAT
DROP POLICY IF EXISTS "Akses penuh surat untuk user terotentikasi" ON surat;
CREATE POLICY "Akses penuh surat untuk user terotentikasi" ON surat 
    FOR ALL USING (true) WITH CHECK (true);

-- Kebijakan untuk BENDAHARA
DROP POLICY IF EXISTS "Akses penuh bendahara untuk user terotentikasi" ON bendahara;
CREATE POLICY "Akses penuh bendahara untuk user terotentikasi" ON bendahara 
    FOR ALL USING (true) WITH CHECK (true);

-- Kebijakan untuk KEAMANAN
DROP POLICY IF EXISTS "Akses penuh keamanan untuk user terotentikasi" ON keamanan;
CREATE POLICY "Akses penuh keamanan untuk user terotentikasi" ON keamanan 
    FOR ALL USING (true) WITH CHECK (true);

-- Kebijakan untuk PERIODE
DROP POLICY IF EXISTS "Akses penuh periode untuk user terotentikasi" ON periode;
CREATE POLICY "Akses penuh periode untuk user terotentikasi" ON periode 
    FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Akses publik baca periode" ON periode;
CREATE POLICY "Akses publik baca periode" ON periode 
    FOR SELECT USING (true);

-- Kebijakan untuk PERIZINAN
DROP POLICY IF EXISTS "Akses penuh perizinan untuk user terotentikasi" ON perizinan;
CREATE POLICY "Akses penuh perizinan untuk user terotentikasi" ON perizinan 
    FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Akses publik baca perizinan" ON perizinan;
CREATE POLICY "Akses publik baca perizinan" ON perizinan 
    FOR SELECT USING (true);

-- Kebijakan untuk KATALOG PELANGGARAN
DROP POLICY IF EXISTS "Akses penuh katalog_pelanggaran untuk user terotentikasi" ON katalog_pelanggaran;
CREATE POLICY "Akses penuh katalog_pelanggaran untuk user terotentikasi" ON katalog_pelanggaran 
    FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Akses publik baca katalog_pelanggaran" ON katalog_pelanggaran;
CREATE POLICY "Akses publik baca katalog_pelanggaran" ON katalog_pelanggaran 
    FOR SELECT USING (true);

-- Kebijakan untuk KREDENSIAL APLIKASI
DROP POLICY IF EXISTS "Akses penuh app_credentials untuk user terotentikasi" ON app_credentials;
CREATE POLICY "Akses penuh app_credentials untuk user terotentikasi" ON app_credentials 
    FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Akses publik baca app_credentials" ON app_credentials;
CREATE POLICY "Akses publik baca app_credentials" ON app_credentials 
    FOR SELECT USING (true);


-- ==========================================
-- SEED DATA AWAL (OPSIONAL & IDEMPOTEN)
-- ==========================================
-- Insert Periode Bawaan (Periode 'Semua' wajib dipertahankan untuk sistem filter aplikasi)
INSERT INTO periode (id, nama, start_date, end_date, is_active) VALUES
('Semua', 'Semua Periode', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;

-- Catatan: Data Contoh (Lembaga, Kelas, Kategori Rombel, Kelompok Rombel, Kompleks, dan Kamar) 
-- telah dihapus sepenuhnya dari skema SQL ini agar data yang sudah Anda bersihkan tidak kembali lagi.
-- Sekarang seluruh data tersebut bersifat bersih dan profesional, serta dapat dikelola sepenuhnya dari aplikasi.


-- ==========================================
-- SUBMODUL: CETAK DOKUMEN (SEKRETARIS)
-- ==========================================

CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_template VARCHAR(100) NOT NULL,
    kategori VARCHAR(50) NOT NULL, -- Perizinan, Keterangan, Undangan, dll
    file_path TEXT, -- URL atau path penyimpanan
    file_name VARCHAR(255),
    content_raw TEXT, -- Isi text asli untuk representasi visual
    placeholders JSONB DEFAULT '[]'::jsonb, -- Array string placeholders, e.g. ["nama_santri", "nis"]
    uploaded_by VARCHAR(100) DEFAULT 'Admin Sekretariat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS document_generation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES document_templates(id) ON DELETE CASCADE,
    santri_id TEXT REFERENCES santri(id) ON DELETE CASCADE,
    generated_by VARCHAR(100) DEFAULT 'Admin Sekretariat',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    file_output_path TEXT
);

-- Mengaktifkan RLS untuk tabel baru
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_generation_logs ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses (Policy) untuk document_templates & logs
DROP POLICY IF EXISTS "Akses penuh document_templates untuk user terotentikasi" ON document_templates;
CREATE POLICY "Akses penuh document_templates untuk user terotentikasi" ON document_templates 
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses penuh document_generation_logs untuk user terotentikasi" ON document_generation_logs;
CREATE POLICY "Akses penuh document_generation_logs untuk user terotentikasi" ON document_generation_logs 
    FOR ALL USING (true) WITH CHECK (true);

-- Seed awal data template surat bawaan (idempotent)
INSERT INTO document_templates (id, nama_template, kategori, file_name, content_raw, placeholders, uploaded_by) VALUES
('f1111111-1111-1111-1111-111111111111', 'Surat Keterangan Santri Aktif', 'Keterangan', 'surat_keterangan_aktif.docx', 
'Yang bertanda tangan di bawah ini menerangkan bahwa santri:

Nama          : {nama_santri}
NIS           : {nis}
Tempat/Tgl Lahir : {tempat_lahir}, {tanggal_lahir}
Nama Wali     : {nama_wali}
Alamat        : {alamat}

adalah benar-benar santri yang saat ini masih aktif belajar di Pondok Pesantren Al-Fattah Tambakberas Jombang dan berkelakuan baik.', 
'["nama_santri", "nis", "tempat_lahir", "tanggal_lahir", "nama_wali", "alamat"]'::jsonb, 'Sistem'),

('f2222222-2222-2222-2222-222222222222', 'Surat Izin Pulang / Libur', 'Perizinan', 'surat_izin_pulang.docx', 
'Diberikan izin pulang kepada santri berikut:

Nama          : {nama_santri}
NIS           : {nis}
Kamar         : {kamar}
Alamat        : {alamat}
No. HP Wali   : {no_hp_wali}

Untuk kembali ke rumah dalam rangka liburan semester/keperluan keluarga dari tanggal {tanggal_mulai} sampai {tanggal_selesai}.', 
'["nama_santri", "nis", "kamar", "alamat", "no_hp_wali", "tanggal_mulai", "tanggal_selesai"]'::jsonb, 'Sistem')
ON CONFLICT (id) DO NOTHING;


-- =============================================================
-- SUBMODUL: PROFIL PESANTREN (ACUAN CETAK SISTEM)
-- =============================================================

CREATE TABLE IF NOT EXISTS pesantren_profile (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
    nama_pesantren VARCHAR(100) DEFAULT 'Pondok Pesantren Darussalam Al-Azhar',
    nama_yayasan VARCHAR(100) DEFAULT 'Yayasan Pendidikan Islam Darussalam',
    nspp VARCHAR(50) DEFAULT '121235070001',
    nomor_notaris VARCHAR(150) DEFAULT 'Akte Notaris No. 24 Tanggal 18 April 2011',
    alamat TEXT DEFAULT 'Jl. Pesantren No. 45, Kebonagung',
    desa VARCHAR(50) DEFAULT 'Kebonagung',
    kecamatan VARCHAR(50) DEFAULT 'Sawahan',
    kabupaten VARCHAR(50) DEFAULT 'Nganjuk',
    provinsi VARCHAR(50) DEFAULT 'Jawa Timur',
    kode_pos VARCHAR(10) DEFAULT '64475',
    telepon VARCHAR(20) DEFAULT '081234567890',
    email VARCHAR(100) DEFAULT 'info@darussalam-alazhar.org',
    website VARCHAR(100) DEFAULT 'www.darussalam-alazhar.org',
    nama_pengasuh VARCHAR(100) DEFAULT 'KH. Muhammad Shodiq, M.Ag.',
    nama_wakil_pengasuh VARCHAR(100) DEFAULT '',
    nama_ketua_yayasan VARCHAR(100) DEFAULT '',
    nama_ketua_pondok VARCHAR(100) DEFAULT 'Ustadz M. Syarifuddin',
    nama_sekretaris VARCHAR(100) DEFAULT 'Ustadz M. Syukron, M.Pd.',
    nama_bendahara VARCHAR(100) DEFAULT 'Ustadz H. Ahmad Ridwan',
    nama_ketua_keamanan VARCHAR(100) DEFAULT 'Ustadz H. Sholihin',
    nama_ketua_pendidikan VARCHAR(100) DEFAULT 'Ustadz Kholilur Rahman, S.Pd.',
    kota_tanda_tangan VARCHAR(50) DEFAULT 'Nganjuk',
    logo_style VARCHAR(50) DEFAULT 'classic',
    logo_url TEXT DEFAULT '',
    kop_tambahan_1 VARCHAR(150) DEFAULT 'AKREDITASI A (SANGAT BAIK) - SK BAN-SM No. 134/BAN-SM/2022',
    kop_tambahan_2 VARCHAR(150) DEFAULT 'Akte Notaris No. 24 Tanggal 18 April 2011 - SK Kemenkumham No. AHU-4521.AH.01.04',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Migrasi Kolom Baru (jika tabel sudah ada sebelumnya)
ALTER TABLE pesantren_profile ADD COLUMN IF NOT EXISTS nomor_notaris VARCHAR(150) DEFAULT 'Akte Notaris No. 24 Tanggal 18 April 2011';
ALTER TABLE pesantren_profile ADD COLUMN IF NOT EXISTS nama_wakil_pengasuh VARCHAR(100) DEFAULT '';
ALTER TABLE pesantren_profile ADD COLUMN IF NOT EXISTS nama_ketua_yayasan VARCHAR(100) DEFAULT '';
ALTER TABLE pesantren_profile ADD COLUMN IF NOT EXISTS nama_ketua_pondok VARCHAR(100) DEFAULT 'Ustadz M. Syarifuddin';
ALTER TABLE pesantren_profile ADD COLUMN IF NOT EXISTS nama_ketua_keamanan VARCHAR(100) DEFAULT 'Ustadz H. Sholihin';
ALTER TABLE pesantren_profile ADD COLUMN IF NOT EXISTS nama_ketua_pendidikan VARCHAR(100) DEFAULT 'Ustadz Kholilur Rahman, S.Pd.';
ALTER TABLE pesantren_profile ADD COLUMN IF NOT EXISTS kota_tanda_tangan VARCHAR(50) DEFAULT 'Nganjuk';
ALTER TABLE pesantren_profile ADD COLUMN IF NOT EXISTS logo_style VARCHAR(50) DEFAULT 'classic';

-- Hapus batasan NOT NULL agar semua kolom bersifat opsional
ALTER TABLE pesantren_profile ALTER COLUMN nama_pesantren DROP NOT NULL;
ALTER TABLE pesantren_profile ALTER COLUMN nama_yayasan DROP NOT NULL;

-- Mengaktifkan RLS untuk pesantren_profile
ALTER TABLE pesantren_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses penuh pesantren_profile untuk user terotentikasi" ON pesantren_profile;
CREATE POLICY "Akses penuh pesantren_profile untuk user terotentikasi" ON pesantren_profile 
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik baca pesantren_profile" ON pesantren_profile;
CREATE POLICY "Akses publik baca pesantren_profile" ON pesantren_profile 
    FOR SELECT USING (true);

-- Seed data awal profil pesantren dengan kolom lengkap
INSERT INTO pesantren_profile (
    id, nama_pesantren, nama_yayasan, nspp, nomor_notaris, alamat, desa, kecamatan, kabupaten, provinsi, 
    kode_pos, telepon, email, website, nama_pengasuh, nama_wakil_pengasuh, nama_ketua_yayasan, nama_ketua_pondok, 
    nama_sekretaris, nama_bendahara, nama_ketua_keamanan, nama_ketua_pendidikan, kota_tanda_tangan, logo_style, kop_tambahan_1, kop_tambahan_2
)
VALUES (
    'main',
    'Pondok Pesantren Darussalam Al-Azhar',
    'Yayasan Pendidikan Islam Darussalam',
    '121235070001',
    'Akte Notaris No. 24 Tanggal 18 April 2011',
    'Jl. Pesantren No. 45, Kebonagung',
    'Kebonagung',
    'Sawahan',
    'Nganjuk',
    'Jawa Timur',
    '64475',
    '081234567890',
    'info@darussalam-alazhar.org',
    'www.darussalam-alazhar.org',
    'KH. Muhammad Shodiq, M.Ag.',
    '',
    '',
    'Ustadz M. Syarifuddin',
    'Ustadz M. Syukron, M.Pd.',
    'Ustadz H. Ahmad Ridwan',
    'Ustadz H. Sholihin',
    'Ustadz Kholilur Rahman, S.Pd.',
    'Nganjuk',
    'classic',
    'AKREDITASI A (SANGAT BAIK) - SK BAN-SM No. 134/BAN-SM/2022',
    'Akte Notaris No. 24 Tanggal 18 April 2011 - SK Kemenkumham No. AHU-4521.AH.01.04'
) ON CONFLICT (id) DO UPDATE SET 
    nomor_notaris = COALESCE(pesantren_profile.nomor_notaris, EXCLUDED.nomor_notaris),
    nama_wakil_pengasuh = COALESCE(pesantren_profile.nama_wakil_pengasuh, EXCLUDED.nama_wakil_pengasuh),
    nama_ketua_yayasan = COALESCE(pesantren_profile.nama_ketua_yayasan, EXCLUDED.nama_ketua_yayasan),
    nama_ketua_pondok = COALESCE(pesantren_profile.nama_ketua_pondok, EXCLUDED.nama_ketua_pondok),
    nama_ketua_keamanan = COALESCE(pesantren_profile.nama_ketua_keamanan, EXCLUDED.nama_ketua_keamanan),
    nama_ketua_pendidikan = COALESCE(pesantren_profile.nama_ketua_pendidikan, EXCLUDED.nama_ketua_pendidikan),
    kota_tanda_tangan = COALESCE(pesantren_profile.kota_tanda_tangan, EXCLUDED.kota_tanda_tangan),
    logo_style = COALESCE(pesantren_profile.logo_style, EXCLUDED.logo_style);


-- =============================================================
-- 9. SPATIE LARAVEL-PERMISSION TABLES (For Admin Role Matrix)
-- =============================================================

CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    guard_name VARCHAR(255) NOT NULL DEFAULT 'web',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT permissions_name_guard_name_unique UNIQUE (name, guard_name)
);

CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    guard_name VARCHAR(255) NOT NULL DEFAULT 'web',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT roles_name_guard_name_unique UNIQUE (name, guard_name)
);

CREATE TABLE IF NOT EXISTS model_has_permissions (
    permission_id BIGINT REFERENCES permissions(id) ON DELETE CASCADE,
    model_type VARCHAR(255) NOT NULL,
    model_id BIGINT NOT NULL,
    PRIMARY KEY (permission_id, model_id, model_type)
);

CREATE TABLE IF NOT EXISTS model_has_roles (
    role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
    model_type VARCHAR(255) NOT NULL,
    model_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, model_id, model_type)
);

CREATE TABLE IF NOT EXISTS role_has_permissions (
    permission_id BIGINT REFERENCES permissions(id) ON DELETE CASCADE,
    role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (permission_id, role_id)
);

-- Active Row Level Security (RLS) on Spatie tables
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_has_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_has_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_has_permissions ENABLE ROW LEVEL SECURITY;

-- Creating Security Policies (Policies)
DROP POLICY IF EXISTS "Akses penuh permissions untuk user terotentikasi" ON permissions;
CREATE POLICY "Akses penuh permissions untuk user terotentikasi" ON permissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses penuh roles untuk user terotentikasi" ON roles;
CREATE POLICY "Akses penuh roles untuk user terotentikasi" ON roles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses penuh model_has_permissions untuk user terotentikasi" ON model_has_permissions;
CREATE POLICY "Akses penuh model_has_permissions untuk user terotentikasi" ON model_has_permissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses penuh model_has_roles untuk user terotentikasi" ON model_has_roles;
CREATE POLICY "Akses penuh model_has_roles untuk user terotentikasi" ON model_has_roles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses penuh role_has_permissions untuk user terotentikasi" ON role_has_permissions;
CREATE POLICY "Akses penuh role_has_permissions untuk user terotentikasi" ON role_has_permissions FOR ALL USING (true) WITH CHECK (true);


-- =============================================================
-- 10. SEED DATA AWAL: ROLES & PERMISSIONS (20 Permissions & 11 Roles)
-- =============================================================

-- Seed 20 permissions (10 modules x 2 actions: view, write)
INSERT INTO permissions (name, guard_name) VALUES
('sekretaris_putra.view', 'web'),
('sekretaris_putra.write', 'web'),
('sekretaris_putri.view', 'web'),
('sekretaris_putri.write', 'web'),

('bendahara_putra.view', 'web'),
('bendahara_putra.write', 'web'),
('bendahara_putri.view', 'web'),
('bendahara_putri.write', 'web'),

('keamanan_putra.view', 'web'),
('keamanan_putra.write', 'web'),
('keamanan_putri.view', 'web'),
('keamanan_putri.write', 'web'),

('humasy_putra.view', 'web'),
('humasy_putra.write', 'web'),
('humasy_putri.view', 'web'),
('humasy_putri.write', 'web'),

('pendidikan_putra.view', 'web'),
('pendidikan_putra.write', 'web'),
('pendidikan_putri.view', 'web'),
('pendidikan_putri.write', 'web')
ON CONFLICT (name, guard_name) DO NOTHING;

-- Seed 11 roles
INSERT INTO roles (name, guard_name) VALUES
('superadmin', 'web'),
('sekretaris_putra', 'web'),
('sekretaris_putri', 'web'),
('bendahara_putra', 'web'),
('bendahara_putri', 'web'),
('keamanan_putra', 'web'),
('keamanan_putri', 'web'),
('humasy_putra', 'web'),
('humasy_putri', 'web'),
('pendidikan_putra', 'web'),
('pendidikan_putri', 'web')
ON CONFLICT (name, guard_name) DO NOTHING;

-- Assign view & write permissions based on role category name, and all permissions to superadmin
DO $$
DECLARE
    role_rec RECORD;
    perm_rec RECORD;
    super_role_id BIGINT;
    perm_write_id BIGINT;
    perm_write_id_alt BIGINT;
BEGIN
    -- Get superadmin role id
    SELECT id INTO super_role_id FROM roles WHERE name = 'superadmin' LIMIT 1;
    
    -- Assign all permissions to superadmin
    IF super_role_id IS NOT NULL THEN
        FOR perm_rec IN SELECT id FROM permissions LOOP
            INSERT INTO role_has_permissions (permission_id, role_id) 
            VALUES (perm_rec.id, super_role_id) 
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Assign permissions to non-superadmin roles:
    -- All non-superadmin roles can view all modules (*.view), but can only write (*.write) to their specific module(s).
    FOR role_rec IN SELECT id, name FROM roles WHERE name != 'superadmin' LOOP
        -- 1. Insert all '.view' permissions for this role
        FOR perm_rec IN SELECT id FROM permissions WHERE name LIKE '%.view' LOOP
            INSERT INTO role_has_permissions (permission_id, role_id)
            VALUES (perm_rec.id, role_rec.id)
            ON CONFLICT DO NOTHING;
        END LOOP;

        -- 2. Determine and insert specific '.write' permission(s)
        perm_write_id := NULL;
        perm_write_id_alt := NULL;

        IF role_rec.name = 'sekretaris_putra' THEN
            SELECT id INTO perm_write_id FROM permissions WHERE name = 'sekretaris_putra.write' LIMIT 1;
        ELSIF role_rec.name = 'sekretaris_putri' THEN
            SELECT id INTO perm_write_id FROM permissions WHERE name = 'sekretaris_putri.write' LIMIT 1;
        ELSIF role_rec.name = 'bendahara_putra' THEN
            SELECT id INTO perm_write_id FROM permissions WHERE name = 'bendahara_putra.write' LIMIT 1;
        ELSIF role_rec.name = 'bendahara_putri' THEN
            SELECT id INTO perm_write_id FROM permissions WHERE name = 'bendahara_putri.write' LIMIT 1;
        ELSIF role_rec.name = 'kepala_keamanan' THEN
            SELECT id INTO perm_write_id FROM permissions WHERE name = 'keamanan_putra.write' LIMIT 1;
            SELECT id INTO perm_write_id_alt FROM permissions WHERE name = 'keamanan_putri.write' LIMIT 1;
        ELSIF role_rec.name = 'keamanan_putra' THEN
            SELECT id INTO perm_write_id FROM permissions WHERE name = 'keamanan_putra.write' LIMIT 1;
        ELSIF role_rec.name = 'keamanan_putri' THEN
            SELECT id INTO perm_write_id FROM permissions WHERE name = 'keamanan_putri.write' LIMIT 1;
        ELSIF role_rec.name = 'humasy_putra' THEN
            SELECT id INTO perm_write_id FROM permissions WHERE name = 'humasy_putra.write' LIMIT 1;
        ELSIF role_rec.name = 'humasy_putri' THEN
            SELECT id INTO perm_write_id FROM permissions WHERE name = 'humasy_putri.write' LIMIT 1;
        ELSIF role_rec.name = 'pendidikan_putra' THEN
            SELECT id INTO perm_write_id FROM permissions WHERE name = 'pendidikan_putra.write' LIMIT 1;
        ELSIF role_rec.name = 'pendidikan_putri' THEN
            SELECT id INTO perm_write_id FROM permissions WHERE name = 'pendidikan_putri.write' LIMIT 1;
        END IF;

        IF perm_write_id IS NOT NULL THEN
            INSERT INTO role_has_permissions (permission_id, role_id) 
            VALUES (perm_write_id, role_rec.id) 
            ON CONFLICT DO NOTHING;
        END IF;

        IF perm_write_id_alt IS NOT NULL THEN
            INSERT INTO role_has_permissions (permission_id, role_id) 
            VALUES (perm_write_id_alt, role_rec.id) 
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END
$$;


-- =============================================================
-- 10. USER PROFILES & AUTOMATED SIGNUP TRIGGER
-- =============================================================

-- Tabel profiles untuk menampung data user setelah mendaftar di Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'sekretaris_putra', -- Peran default saat mendaftar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mengaktifkan RLS untuk keamanan data profil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Kebijakan keamanan RLS untuk tabel profiles
DROP POLICY IF EXISTS "Profil dapat dilihat oleh semua pengguna terotentikasi" ON public.profiles;
CREATE POLICY "Profil dapat dilihat oleh semua pengguna terotentikasi" 
    ON public.profiles FOR SELECT 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Pengguna hanya dapat mengubah profil mereka sendiri" ON public.profiles;
CREATE POLICY "Pengguna hanya dapat mengubah profil mereka sendiri" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Fungsi otomatis yang dipicu setiap kali user baru terdaftar di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, fullname, email, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'fullname', 'Pengguna Baru'),
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'sekretaris_putra')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pemicu otomatis (Database Trigger) untuk menghubungkan auth.users dengan public.profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================================
-- 11. STORAGE BUCKETS FOR SANTRI FILES (Foto & Berkas)
-- =============================================================
-- Menambahkan bucket 'santri-assets' ke storage.buckets jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('santri-assets', 'santri-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Kebijakan Akses (Policy) untuk bucket 'santri-assets'
-- Agar publik dapat mengunduh/membaca foto dan berkas secara bebas (SELECT)
DROP POLICY IF EXISTS "Akses publik membaca file di bucket santri-assets" ON storage.objects;
CREATE POLICY "Akses publik membaca file di bucket santri-assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'santri-assets');

-- Agar user terotentikasi dapat mengunggah (INSERT) file apa saja ke bucket ini
DROP POLICY IF EXISTS "User terotentikasi dapat mengunggah ke bucket santri-assets" ON storage.objects;
CREATE POLICY "User terotentikasi dapat mengunggah ke bucket santri-assets" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'santri-assets');

-- Agar user terotentikasi dapat memperbarui/mengganti (UPDATE) file di bucket ini
DROP POLICY IF EXISTS "User terotentikasi dapat memperbarui file di bucket santri-assets" ON storage.objects;
CREATE POLICY "User terotentikasi dapat memperbarui file di bucket santri-assets" ON storage.objects
    FOR UPDATE WITH CHECK (bucket_id = 'santri-assets');

-- Agar user terotentikasi dapat menghapus (DELETE) file di bucket ini
DROP POLICY IF EXISTS "User terotentikasi dapat menghapus file di bucket santri-assets" ON storage.objects;
CREATE POLICY "User terotentikasi dapat menghapus file di bucket santri-assets" ON storage.objects
    FOR DELETE USING (bucket_id = 'santri-assets');


-- Migrasi mengubah kolom 'pembimbing' pada tabel 'kelompok_rombel' agar NULLABLE (tidak wajib)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kelompok_rombel' AND column_name='pembimbing' AND is_nullable='NO') THEN
        ALTER TABLE kelompok_rombel ALTER COLUMN pembimbing DROP NOT NULL;
    END IF;
END
$$;


-- PostgreSQL function 'get_storage_stats' untuk menghitung ukuran valid Database Storage dan Bucket Storage
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS TABLE (
  database_size bigint,
  bucket_size bigint
) AS $$
DECLARE
  db_sz bigint;
  bk_sz bigint;
BEGIN
  -- 1. Database Size in bytes
  SELECT pg_database_size(current_database()) INTO db_sz;

  -- 2. Bucket Size in bytes (summing file sizes in storage.objects)
  SELECT COALESCE(SUM((metadata->>'size')::bigint), 0) INTO bk_sz 
  FROM storage.objects;

  RETURN QUERY SELECT db_sz, bk_sz;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================
-- 12. TABEL FEEDBACK (MASUKAN DAN PESAN KEUANGAN/SISTEM UNTUK SUPERADMIN)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_username VARCHAR(255) NOT NULL,
    sender_role VARCHAR(50),
    sender_email VARCHAR(255) DEFAULT '',
    message TEXT NOT NULL,
    is_starred BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Migrasi kolom is_starred dan sender_email pada feedback untuk database yang sudah ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='feedback' AND column_name='is_starred') THEN
        ALTER TABLE public.feedback ADD COLUMN is_starred BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='feedback' AND column_name='sender_email') THEN
        ALTER TABLE public.feedback ADD COLUMN sender_email VARCHAR(255) DEFAULT '';
    END IF;
END
$$;

-- Mengaktifkan RLS untuk keamanan data feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Kebijakan keamanan RLS untuk tabel feedback
DROP POLICY IF EXISTS "Siapa saja dapat mengirim masukan" ON public.feedback;
CREATE POLICY "Siapa saja dapat mengirim masukan" 
    ON public.feedback FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Semua pengguna terotentikasi dapat melihat masukan" ON public.feedback;
CREATE POLICY "Semua pengguna terotentikasi dapat melihat masukan" 
    ON public.feedback FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Pengguna dapat menghapus masukan" ON public.feedback;
CREATE POLICY "Pengguna dapat menghapus masukan" 
    ON public.feedback FOR DELETE 
    USING (true);


-- SINKRONISASI CACHE SKEMA POSTGREST (Sangat Penting!)
-- Jalankan notifikasi ini agar Supabase langsung mendeteksi kolom baru (avatar_url, dll) tanpa delay
ALTER TABLE public.santri ALTER COLUMN nis DROP NOT NULL;
NOTIFY pgrst, 'reload schema';


-- =============================================================
-- 13. MENGAKTIFKAN SUPABASE REALTIME REPLICATION UNTUK SEMUA TABEL UTAMA
-- =============================================================
-- Mengubah REPLICA IDENTITY ke FULL untuk memastikan payload lengkap (termasuk old data saat DELETE/UPDATE) dikirimkan
ALTER TABLE public.santri REPLICA IDENTITY FULL;
ALTER TABLE public.bendahara REPLICA IDENTITY FULL;
ALTER TABLE public.keamanan REPLICA IDENTITY FULL;
ALTER TABLE public.lembaga REPLICA IDENTITY FULL;
ALTER TABLE public.kelas REPLICA IDENTITY FULL;
ALTER TABLE public.kompleks REPLICA IDENTITY FULL;
ALTER TABLE public.kamar REPLICA IDENTITY FULL;
ALTER TABLE public.kategori_rombel REPLICA IDENTITY FULL;
ALTER TABLE public.kelompok_rombel REPLICA IDENTITY FULL;
ALTER TABLE public.rombel_assignment REPLICA IDENTITY FULL;
ALTER TABLE public.perizinan REPLICA IDENTITY FULL;
ALTER TABLE public.periode REPLICA IDENTITY FULL;
ALTER TABLE public.katalog_pelanggaran REPLICA IDENTITY FULL;
ALTER TABLE public.pesantren_profile REPLICA IDENTITY FULL;
ALTER TABLE public.app_credentials REPLICA IDENTITY FULL;
ALTER TABLE public.feedback REPLICA IDENTITY FULL;

-- Menghapus dan membuat ulang publikasi secara aman untuk mendaftarkan semua tabel secara realtime
DROP PUBLICATION IF EXISTS supabase_realtime;

CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.santri, 
    public.bendahara, 
    public.keamanan, 
    public.lembaga, 
    public.kelas, 
    public.kompleks, 
    public.kamar, 
    public.kategori_rombel, 
    public.kelompok_rombel, 
    public.rombel_assignment, 
    public.perizinan, 
    public.periode, 
    public.katalog_pelanggaran, 
    public.pesantren_profile, 
    public.app_credentials,
    public.feedback;





