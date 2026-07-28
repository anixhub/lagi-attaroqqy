<?php
// ==============================================================================
// KONFIGURASI KONEKSI DATABASE MYSQL HOSTINGER
// ==============================================================================
// Anda dapat memasukkan detail koneksi database Hostinger Anda di bawah ini
// atau mengisinya melalui variabel lingkungan (Environment Variables) di hPanel Hostinger.

$DB_HOST = getenv('DB_HOST') ?: getenv('MYSQL_HOST') ?: 'localhost';
$DB_USER = getenv('DB_USER') ?: getenv('MYSQL_USER') ?: 'u1014327_attaroqqy'; // Ganti dengan Username MySQL Hostinger
$DB_PASS = getenv('DB_PASS') ?: getenv('MYSQL_PASSWORD') ?: 'ponpesattaroqqy'; // Ganti dengan Password MySQL Hostinger
$DB_NAME = getenv('DB_NAME') ?: getenv('MYSQL_DATABASE') ?: 'u1014327_attaroqqy-db'; // Ganti dengan Nama Database Hostinger
$DB_PORT = getenv('DB_PORT') ?: getenv('MYSQL_PORT') ?: '3306';

// Jika ada file config.local.php kustom, gunakan nilai dari file tersebut
if (file_exists(__DIR__ . '/config.local.php')) {
    include __DIR__ . '/config.local.php';
}

function getPDOConnection() {
    global $DB_HOST, $DB_USER, $DB_PASS, $DB_NAME, $DB_PORT;
    try {
        $dsn = "mysql:host={$DB_HOST};port={$DB_PORT};dbname={$DB_NAME};charset=utf8mb4";
        $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        return null;
    }
}
