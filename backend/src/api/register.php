<?php
/**
 * User Registration Endpoint
 *
 * POST /api/register
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

// Get JSON input with encoding handling
$rawInput = file_get_contents('php://input');
if (!mb_check_encoding($rawInput, 'UTF-8')) {
    $rawInput = mb_convert_encoding($rawInput, 'UTF-8', 'GBK,GB2312,UTF-8');
}
$data = json_decode($rawInput, true);

if ($data === null || $data === false) {
    $data = $_POST;
}

// Validate required fields
$required = ['username', 'password'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => "Field '$field' is required"]);
        exit;
    }
}

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    // Check if username already exists
    $stmt = $conn->prepare("SELECT id FROM admin_users WHERE username = :username");
    $stmt->execute([':username' => $data['username']]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Username already exists']);
        exit;
    }

    // Hash password
    $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);

    // Insert new user - SECURITY: Force role to 'user', ignore user input
    // New users require admin approval (status = 0)
    $sql = "INSERT INTO admin_users (username, password, real_name, email, role, status) VALUES (:username, :password, :real_name, :email, :role, :status)";
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':username' => $data['username'],
        ':password' => $passwordHash,
        ':real_name' => $data['real_name'] ?? $data['username'],
        ':email' => $data['email'] ?? null,
        ':role' => 'user',  // Force to 'user', ignore any user-provided role
        ':status' => 0,  // Require admin approval
    ]);

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'User created successfully',
        'data' => ['id' => $conn->lastInsertId()]
    ]);

} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage()); // Log to server, not client
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error occurred']);
}
