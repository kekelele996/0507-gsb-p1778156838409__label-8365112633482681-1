<?php
/**
 * Authentication Endpoint
 *
 * Handles user login requests and returns signed JWT token.
 * POST /api/login
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'error' => 'Method Not Allowed',
        'message' => 'Only POST method is allowed'
    ]);
    exit;
}

require_once '../config/database.php';

// Get JSON input with encoding handling
$rawInput = file_get_contents('php://input');

// Try to convert from other encodings to UTF-8 if needed
if (!mb_check_encoding($rawInput, 'UTF-8')) {
    $rawInput = mb_convert_encoding($rawInput, 'UTF-8', 'GBK,GB2312,UTF-8');
}

$input = json_decode($rawInput, true);

// If JSON parsing failed, try $_POST
if ($input === null || $input === false) {
    $input = $_POST;
}

// Validate input
if (!$input) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Bad Request',
        'message' => 'Invalid JSON input'
    ]);
    exit;
}

// Extract credentials
$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

// Validate required fields
if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Validation Error',
        'message' => 'Username and password are required'
    ]);
    exit;
}

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    // Query user from database
    $stmt = $conn->prepare("SELECT id, username, password, real_name, email, role, status FROM admin_users WHERE username = :username");
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verify user exists and password is correct
    if ($user && password_verify($password, $user['password'])) {
        // Check if user is active
        if ($user['status'] != 1) {
            http_response_code(403);
            echo json_encode([
                'error' => 'Forbidden',
                'message' => 'Account is disabled'
            ]);
            exit;
        }

        // Generate JWT token with HMAC-SHA256 signature
        $timestamp = time();
        $secret = getenv('JWT_SECRET') ?: 'village-secret-key-change-in-production';
        $expiresIn = 86400; // 24 hours

        // Create token payload: base64(user_id:username:timestamp:signature)
        $signatureData = "{$user['id']}:{$user['username']}:{$timestamp}";
        $signature = hash_hmac('sha256', $signatureData, $secret);
        $token = base64_encode("{$signatureData}:{$signature}");

        // Remove password from response
        unset($user['password']);

        // Successful login with token
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'real_name' => $user['real_name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'token' => $token,
                'expires_in' => $expiresIn
            ]
        ]);
    } else {
        // Failed login
        http_response_code(401);
        echo json_encode([
            'error' => 'Unauthorized',
            'message' => 'Invalid username or password'
        ]);
    }
} catch (Exception $e) {
    error_log('Auth error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Database Error',
        'message' => 'Login failed due to database error'
    ]);
}
