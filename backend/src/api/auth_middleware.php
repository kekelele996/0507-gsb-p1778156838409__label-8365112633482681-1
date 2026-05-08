<?php
/**
 * Authentication Middleware
 *
 * Provides secure authentication verification for API endpoints using HMAC-SHA256 signed tokens.
 */

require_once __DIR__ . '/../config/database.php';

/**
 * Verify authentication from Authorization header
 * Returns current user data if authenticated, null otherwise
 *
 * @param PDO $conn Database connection
 * @return array|null User data or null if not authenticated
 */
function verifyAuth(PDO $conn) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

    if (!preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
        return null;
    }

    $token = $matches[1];

    // Token format: base64(user_id:username:timestamp:signature)
    $tokenData = base64_decode($token);

    if (!$tokenData) {
        return null;
    }

    $parts = explode(':', $tokenData);

    // Require exactly 4 parts: user_id, username, timestamp, signature
    if (count($parts) !== 4) {
        return null;
    }

    $userId = (int)$parts[0];
    $username = $parts[1];
    $timestamp = (int)$parts[2];
    $signature = $parts[3];

    // Verify token is not expired (24 hours)
    // Allow 5 minutes clock skew for server/client time differences
    $tokenAge = time() - $timestamp;
    if ($tokenAge > 86400) { // 24 hours = 86400 seconds
        return null;
    }
    // Allow tokens up to 5 minutes in the future (clock skew tolerance)
    if ($tokenAge < -300) {
        return null;
    }

    // Verify signature using server secret (MANDATORY - reject unsigned tokens)
    $secret = getenv('JWT_SECRET') ?: 'village-secret-key-change-in-production';
    $signatureData = "{$userId}:{$username}:{$timestamp}";
    $expectedSignature = hash_hmac('sha256', $signatureData, $secret);

    if (!hash_equals($expectedSignature, $signature)) {
        return null;
    }

    // Fetch user from database
    $stmt = $conn->prepare("SELECT id, username, role FROM admin_users WHERE id = :id AND status = 1");
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    return $user ?: null;
}

/**
 * Require authentication - sends 401 response if not authenticated
 *
 * @param PDO $conn Database connection
 * @return array|null User data or null (and sends 401)
 */
function requireAuth(PDO $conn) {
    $user = verifyAuth($conn);

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Authentication required']);
        exit;
    }

    return $user;
}

/**
 * Require admin role - sends 403 response if not admin
 *
 * @param PDO $conn Database connection
 * @return array|null User data or null (and sends 403)
 */
function requireAdmin(PDO $conn) {
    $user = requireAuth($conn);

    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin role required']);
        exit;
    }

    return $user;
}
