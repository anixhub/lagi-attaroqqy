<?php
// ==============================================================================
// BACKEND API PHP & MYSQL DEDIKASI HOSTINGER (ATTAROKEY 4.0)
// ==============================================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once __DIR__ . '/db_config.php';

// Normalize URI Path
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Extract route after /api/
$apiPrefix = '/api/';
$apiPos = strpos($uri, $apiPrefix);
$route = '';
if ($apiPos !== false) {
    $route = substr($uri, $apiPos + strlen($apiPrefix));
} else {
    $route = ltrim($uri, '/');
}
$routeParts = explode('/', trim($route, '/'));

// Get raw JSON body if available
$inputJSON = file_get_contents('php://input');
$body = json_decode($inputJSON, true) ?: [];

// List of allowed tables
$validTables = [
    "santri", "lembaga", "kelas", "kompleks", "kamar", "kategori_rombel",
    "kelompok_rombel", "rombel_assignment", "surat", "bendahara", "keamanan",
    "periode", "perizinan", "katalog_pelanggaran", "app_credentials",
    "pesantren_profile", "feedback", "permissions", "roles",
    "role_has_permissions", "document_generation_logs", "document_templates"
];

// Helper to remove password from user object
function stripPassword($table, $data) {
    if ($table !== 'app_credentials' || !$data) return $data;
    if (isset($data[0]) && is_array($data)) {
        return array_map(function($item) {
            unset($item['password']);
            return $item;
        }, $data);
    }
    unset($data['password']);
    return $data;
}

// ------------------------------------------------------------------------------
// ROUTING HANDLERS
// ------------------------------------------------------------------------------

$pdo = getPDOConnection();

// 1. STATUS ENDPOINTS (/api/db-status, /api/supabase-status)
if ($routeParts[0] === 'db-status' || $routeParts[0] === 'supabase-status') {
    if ($pdo) {
        echo json_encode([
            "connected" => true,
            "type" => "mysql",
            "host" => $GLOBALS['DB_HOST'],
            "database" => $GLOBALS['DB_NAME'],
            "anonKey" => "mysql-hostinger-active",
            "reason" => "connected"
        ]);
    } else {
        echo json_encode([
            "connected" => false,
            "type" => "none",
            "url" => null,
            "anonKey" => null,
            "reason" => "Hostinger MySQL belum dikoneksikan. Silakan isi file public/api/db_config.php atau set DB_USER & DB_NAME di hPanel."
        ]);
    }
    exit;
}

// 2. AUTH LOGIN (/api/auth/login)
if ($routeParts[0] === 'auth' && isset($routeParts[1]) && $routeParts[1] === 'login') {
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(["success" => false, "error" => "Method not allowed"]);
        exit;
    }

    $username = strtolower(trim($body['username'] ?? ''));
    $password = $body['password'] ?? '';
    $defaultUser = 'superadmin@attaroqqy.com';
    $defaultPass = '1234';

    if (!$pdo) {
        // Fallback for default superadmin if DB is not yet initialized
        if ($username === strtolower($defaultUser) && $password === $defaultPass) {
            echo json_encode([
                "success" => true,
                "user" => [
                    "id" => "superadmin",
                    "username" => $defaultUser,
                    "role" => "superadmin",
                    "status" => "approved",
                    "displayName" => "Super Admin"
                ]
            ]);
            exit;
        }
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Koneksi ke Database Hostinger MySQL Gagal. Periksa kredensial di public/api/db_config.php."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM `app_credentials` WHERE LOWER(`username`) = ? LIMIT 1");
        $stmt->execute([$username]);
        $matchedUser = $stmt->fetch();

        // Auto-seed superadmin if table is empty or superadmin missing
        if (!$matchedUser && $username === strtolower($defaultUser) && $password === $defaultPass) {
            $stmtInsert = $pdo->prepare("INSERT INTO `app_credentials` (`id`, `username`, `password`, `role`, `status`) VALUES ('superadmin', ?, ?, 'superadmin', 'approved') ON DUPLICATE KEY UPDATE `id`='superadmin'");
            $stmtInsert->execute([$defaultUser, $defaultPass]);
            echo json_encode([
                "success" => true,
                "user" => [
                    "id" => "superadmin",
                    "username" => $defaultUser,
                    "role" => "superadmin",
                    "status" => "approved",
                    "displayName" => "Super Admin"
                ]
            ]);
            exit;
        }

        if (!$matchedUser) {
            http_response_code(401);
            echo json_encode(["success" => false, "error" => "Email atau Kata Sandi salah atau akun Anda tidak terdaftar."]);
            exit;
        }

        if ($matchedUser['password'] !== $password) {
            http_response_code(401);
            echo json_encode(["success" => false, "error" => "Email atau Kata Sandi salah."]);
            exit;
        }

        if ($matchedUser['status'] === 'pending') {
            http_response_code(403);
            echo json_encode(["success" => false, "error" => "Akun Anda masih menunggu persetujuan (approval) dari Superadmin."]);
            exit;
        } else if ($matchedUser['status'] === 'rejected') {
            http_response_code(403);
            echo json_encode(["success" => false, "error" => "Permohonan pendaftaran akun Anda ditolak oleh Superadmin."]);
            exit;
        }

        echo json_encode([
            "success" => true,
            "needsCancelReset" => ($matchedUser['status'] === 'minta_reset'),
            "user" => [
                "id" => $matchedUser['id'],
                "username" => $matchedUser['username'],
                "role" => $matchedUser['role'],
                "status" => $matchedUser['status'],
                "displayName" => $matchedUser['display_name'] ?? $matchedUser['displayName'] ?? $matchedUser['username'],
                "avatarUrl" => $matchedUser['avatar_url'] ?? $matchedUser['avatarUrl'] ?? null
            ]
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
        exit;
    }
}

// 3. FILE UPLOAD ENDPOINT (/api/upload)
if ($routeParts[0] === 'upload') {
    $fileName = $body['fileName'] ?? null;
    $fileBase64 = $body['fileBase64'] ?? null;

    if (!$fileName || !$fileBase64) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "fileName and fileBase64 required"]);
        exit;
    }

    $uploadDir = __DIR__ . '/../uploads/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $decoded = base64_decode($fileBase64);
    $targetPath = $uploadDir . basename($fileName);
    file_put_contents($targetPath, $decoded);

    echo json_encode([
        "success" => true,
        "path" => "uploads/" . basename($fileName),
        "publicUrl" => "uploads/" . basename($fileName)
    ]);
    exit;
}

// 4. DATABASE REST OPERATIONS (/api/db/:table and /api/db/:table/:id)
if ($routeParts[0] === 'db' && isset($routeParts[1])) {
    $table = $routeParts[1];
    $id = $routeParts[2] ?? null;

    if (!in_array($table, $validTables)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Tabel '{$table}' tidak valid"]);
        exit;
    }

    if (!$pdo) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Database Hostinger MySQL belum terhubung. Periksa public/api/db_config.php."]);
        exit;
    }

    try {
        if ($method === 'GET') {
            $stmt = $pdo->prepare("SELECT * FROM `{$table}`");
            $stmt->execute();
            $rows = $stmt->fetchAll();
            echo json_encode(["success" => true, "data" => stripPassword($table, $rows)]);
            exit;
        }

        if ($method === 'POST') {
            $rowsToInsert = isset($body[0]) && is_array($body) ? $body : [$body];
            $results = [];

            foreach ($rowsToInsert as $row) {
                if (empty($row['id'])) {
                    $row['id'] = strval(round(microtime(true) * 1000)) . substr(md5(uniqid()), 0, 5);
                }
                $keys = array_keys($row);
                $cols = implode(", ", array_map(fn($k) => "`$k`", $keys));
                $placeholders = implode(", ", array_fill(0, count($keys), "?"));
                $updateCols = implode(", ", array_map(fn($k) => "`$k` = VALUES(`$k`)", $keys));

                $vals = array_map(fn($k) => is_array($row[$k]) || is_object($row[$k]) ? json_encode($row[$k]) : $row[$k], $keys);

                $sql = "INSERT INTO `{$table}` ({$cols}) VALUES ({$placeholders}) ON DUPLICATE KEY UPDATE {$updateCols}";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($vals);
                $results[] = $row;
            }

            echo json_encode(["success" => true, "data" => stripPassword($table, count($rowsToInsert) === 1 ? $results[0] : $results)]);
            exit;
        }

        if ($method === 'PUT' && $id) {
            unset($body['id']);
            $keys = array_keys($body);
            if (count($keys) > 0) {
                $setCols = implode(", ", array_map(fn($k) => "`$k` = ?", $keys));
                $vals = array_map(fn($k) => is_array($body[$k]) || is_object($body[$k]) ? json_encode($body[$k]) : $body[$k], $keys);
                $vals[] = $id;

                $sql = "UPDATE `{$table}` SET {$setCols} WHERE `id` = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($vals);
            }

            $stmtFetch = $pdo->prepare("SELECT * FROM `{$table}` WHERE `id` = ? LIMIT 1");
            $stmtFetch->execute([$id]);
            $updatedRow = $stmtFetch->fetch();

            echo json_encode(["success" => true, "data" => stripPassword($table, $updatedRow ?: array_merge(["id" => $id], $body))]);
            exit;
        }

        if ($method === 'DELETE' && $id) {
            $stmt = $pdo->prepare("DELETE FROM `{$table}` WHERE `id` = ?");
            $stmt->execute([$id]);
            echo json_encode(["success" => true]);
            exit;
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
        exit;
    }
}

// Default 404 handler for unmatched API routes
http_response_code(404);
echo json_encode(["success" => false, "error" => "API endpoint tidak ditemukan: " . $route]);
