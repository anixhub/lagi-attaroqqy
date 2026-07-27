-- ===================================================
-- SMART SANTRI DATABASE SCHEMA FOR HOSTINGER (MySQL / MariaDB)
-- Siap di-import di cPanel phpMyAdmin Hostinger
-- ===================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. TABEL SANTRI
CREATE TABLE IF NOT EXISTS `santri` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nis` VARCHAR(20) UNIQUE,
  `nama` VARCHAR(100) NOT NULL,
  `kelas` TEXT,
  `kamar` TEXT,
  `asal` VARCHAR(100),
  `gender` VARCHAR(10),
  `tanggal_masuk` DATE DEFAULT (CURRENT_DATE),
  `nisn` VARCHAR(20),
  `nism` VARCHAR(30),
  `nik` CHAR(16),
  `no_kk` CHAR(16),
  `tempat_lahir` VARCHAR(50),
  `tanggal_lahir` DATE,
  `anak_ke` INT,
  `dari_bersaudara` INT,
  `nama_ayah` VARCHAR(100),
  `nik_ayah` CHAR(16),
  `pekerjaan_ayah` VARCHAR(50),
  `pendidikan_ayah` VARCHAR(50),
  `nama_ibu` VARCHAR(100),
  `nik_ibu` CHAR(16),
  `pekerjaan_ibu` VARCHAR(50),
  `pendidikan_ibu` VARCHAR(50),
  `alamat` TEXT,
  `rt` VARCHAR(10),
  `rw` VARCHAR(10),
  `desa` VARCHAR(50),
  `kecamatan` VARCHAR(50),
  `kabupaten` VARCHAR(50),
  `provinsi` VARCHAR(50),
  `jarak_rumah` DECIMAL(5,2),
  `no_hp` VARCHAR(20),
  `status_keanggotaan` VARCHAR(20) DEFAULT 'Aktif',
  `status_domisili` VARCHAR(20) DEFAULT 'Muqim',
  `status_emis` VARCHAR(20) DEFAULT 'Belum',
  `status_verval` VARCHAR(20) DEFAULT 'Belum',
  `tanggal_keluar` DATE,
  `catatan` TEXT,
  `file_kk` TEXT,
  `file_ktp` TEXT,
  `file_akta` TEXT,
  `file_ijazah` TEXT,
  `file_pas_foto` TEXT,
  `nomor_lemari` VARCHAR(30),
  `pendidikan_terakhir` VARCHAR(50) DEFAULT 'SD/MI',
  `pendidikan_formal` TEXT,
  `pendidikan_internal` TEXT,
  `kelas_id` VARCHAR(50),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. TABEL LEMBAGA
CREATE TABLE IF NOT EXISTS `lembaga` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `kode` VARCHAR(20) NOT NULL,
  `deskripsi` TEXT,
  `gender` VARCHAR(10) DEFAULT 'Putra',
  `jenis` VARCHAR(20) DEFAULT 'Internal',
  `logo` TEXT,
  `ta_mulai_tanggal` INT DEFAULT 1,
  `ta_mulai_bulan` INT DEFAULT 7,
  `ta_selesai_tanggal` INT DEFAULT 30,
  `ta_selesai_bulan` INT DEFAULT 6,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `lembaga_kode_gender` (`kode`, `gender`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. TABEL KELAS
CREATE TABLE IF NOT EXISTS `kelas` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `lembaga_id` VARCHAR(50),
  `nama` VARCHAR(50) NOT NULL,
  `wali_kelas` VARCHAR(100),
  `batas_usia_hari` INT DEFAULT 1,
  `batas_usia_bulan` INT DEFAULT 7,
  `batas_usia_umur_min` INT,
  `batas_usia_umur_max` INT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`lembaga_id`) REFERENCES `lembaga`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. TABEL KOMPLEKS & KAMAR
CREATE TABLE IF NOT EXISTS `kompleks` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `kode` VARCHAR(20) NOT NULL,
  `deskripsi` TEXT,
  `gender` VARCHAR(10) DEFAULT 'Putra',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `kompleks_kode_gender` (`kode`, `gender`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `kamar` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `kompleks_id` VARCHAR(50),
  `nama` VARCHAR(50) NOT NULL,
  `ketua_kamar` VARCHAR(100),
  `kapasitas` INT DEFAULT 15,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`kompleks_id`) REFERENCES `kompleks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. TABEL ROMBEL & KELOMPOK
CREATE TABLE IF NOT EXISTS `kategori_rombel` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `deskripsi` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `kelompok_rombel` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `kategori_id` VARCHAR(50),
  `nama` VARCHAR(100) NOT NULL,
  `pembimbing` VARCHAR(100),
  `kuota` INT DEFAULT 20,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`kategori_id`) REFERENCES `kategori_rombel`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rombel_assignment` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `santri_id` VARCHAR(50),
  `kategori_id` VARCHAR(50),
  `kelompok_id` VARCHAR(50),
  `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `santri_kategori_unique` (`santri_id`, `kategori_id`),
  FOREIGN KEY (`santri_id`) REFERENCES `santri`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`kategori_id`) REFERENCES `kategori_rombel`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`kelompok_id`) REFERENCES `kelompok_rombel`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. TABEL SURAT, BENDAHARA, KEAMANAN, PERIODE, PERIZINAN
CREATE TABLE IF NOT EXISTS `surat` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `no_surat` VARCHAR(100) NOT NULL UNIQUE,
  `perihal` VARCHAR(255) NOT NULL,
  `tanggal` DATE DEFAULT (CURRENT_DATE),
  `jenis` VARCHAR(10),
  `mitra` VARCHAR(100) NOT NULL,
  `kategori` VARCHAR(50),
  `status` VARCHAR(20) DEFAULT 'Dalam Proses'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bendahara` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nama_santri` VARCHAR(100) NOT NULL,
  `kamar` VARCHAR(50),
  `bulan` VARCHAR(30) NOT NULL,
  `nominal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(20) DEFAULT 'Belum Lunas',
  `tanggal_bayar` DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `keamanan` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `santri_id` VARCHAR(50),
  `nis` VARCHAR(20),
  `nama_santri` VARCHAR(100) NOT NULL,
  `kamar` VARCHAR(50),
  `jenis_pelanggaran` TEXT NOT NULL,
  `tanggal` DATE DEFAULT (CURRENT_DATE),
  `tindakan` TEXT,
  `poin` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `periode` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `start_date` DATE,
  `end_date` DATE,
  `is_active` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `perizinan` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `santri_id` VARCHAR(50),
  `nis` VARCHAR(20),
  `nama_santri` VARCHAR(100) NOT NULL,
  `kelas` TEXT,
  `kamar` TEXT,
  `jenis_izin` VARCHAR(50) NOT NULL,
  `tanggal_mulai` DATE NOT NULL,
  `tanggal_selesai` DATE NOT NULL,
  `keterangan` TEXT,
  `status` VARCHAR(50) NOT NULL,
  `tanggal_kembali` DATE,
  `gender` VARCHAR(10),
  `is_cabut` TINYINT(1) DEFAULT 0,
  `tanggal_cabut` DATE,
  `alasan_cabut` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `katalog_pelanggaran` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nama` VARCHAR(150) NOT NULL,
  `kategori` VARCHAR(50) NOT NULL,
  `deskripsi` TEXT,
  `rules` LONGTEXT,
  `default_poin` INT DEFAULT 0,
  `default_tazir` TEXT,
  `gender` VARCHAR(10),
  `repetition_strategy` VARCHAR(50) DEFAULT 'repeat_1_2',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. TABEL AKUN / KREDENSIAL
CREATE TABLE IF NOT EXISTS `app_credentials` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY DEFAULT 'superadmin',
  `username` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL DEFAULT '1234',
  `role` VARCHAR(50) DEFAULT 'superadmin',
  `status` VARCHAR(50) DEFAULT 'approved',
  `display_name` VARCHAR(100) DEFAULT 'Admin Utama',
  `avatar_url` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `app_credentials` (`id`, `username`, `password`, `role`, `status`)
VALUES ('superadmin', 'superadmin@attaroqqy.com', '1234', 'superadmin', 'approved')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- 8. TABEL PROFIL PESANTREN
CREATE TABLE IF NOT EXISTS `pesantren_profile` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY DEFAULT 'main',
  `nama_pesantren` VARCHAR(100),
  `nama_yayasan` VARCHAR(100),
  `nspp` VARCHAR(50) DEFAULT '121235070001',
  `nomor_notaris` VARCHAR(150),
  `alamat` TEXT,
  `desa` VARCHAR(50),
  `kecamatan` VARCHAR(50),
  `kabupaten` VARCHAR(50),
  `provinsi` VARCHAR(50),
  `kode_pos` VARCHAR(10),
  `telepon` VARCHAR(20),
  `email` VARCHAR(100),
  `website` VARCHAR(100),
  `nama_pengasuh` VARCHAR(100),
  `nama_wakil_pengasuh` VARCHAR(100),
  `nama_ketua_yayasan` VARCHAR(100),
  `nama_ketua_pondok` VARCHAR(100),
  `nama_sekretaris` VARCHAR(100),
  `nama_bendahara` VARCHAR(100),
  `nama_ketua_keamanan` VARCHAR(100),
  `nama_ketua_pendidikan` VARCHAR(100),
  `kota_tanda_tangan` VARCHAR(50),
  `logo_style` VARCHAR(50) DEFAULT 'classic',
  `logo_url` TEXT,
  `kop_tambahan_1` VARCHAR(150),
  `kop_tambahan_2` VARCHAR(150),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `pesantren_profile` (`id`, `nama_pesantren`, `nama_yayasan`) 
VALUES ('main', 'Pondok Pesantren Darussalam Al-Azhar', 'Yayasan Pendidikan Islam Darussalam')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- 9. TABEL FEEDBACK
CREATE TABLE IF NOT EXISTS `feedback` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `sender_username` VARCHAR(255) NOT NULL,
  `sender_role` VARCHAR(50),
  `sender_email` VARCHAR(255) DEFAULT '',
  `message` TEXT NOT NULL,
  `is_starred` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. TABEL PERMISSIONS & ROLES
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `guard_name` VARCHAR(255) NOT NULL DEFAULT 'web',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `permissions_name_guard` (`name`, `guard_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `guard_name` VARCHAR(255) NOT NULL DEFAULT 'web',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `roles_name_guard` (`name`, `guard_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `role_has_permissions` (
  `permission_id` BIGINT NOT NULL,
  `role_id` BIGINT NOT NULL,
  PRIMARY KEY (`permission_id`, `role_id`),
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SEED PERIODE DEFAULT
INSERT INTO `periode` (`id`, `nama`, `is_active`) VALUES ('Semua', 'Semua Periode', 1)
ON DUPLICATE KEY UPDATE `id`=`id`;

SET FOREIGN_KEY_CHECKS = 1;
