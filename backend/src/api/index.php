<?php
/**
 * Main API Router
 *
 * Routes all API requests to appropriate handlers.
 * Supports CORS for frontend integration.
 */

// Enable error reporting for development (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Set timezone
date_default_timezone_set('UTC');

// Set JSON header
header('Content-Type: application/json');

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include required files
require_once __DIR__ . '/../config/database.php';

// Parse request URI
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove query string and trailing slash
$requestPath = parse_url($requestUri, PHP_URL_PATH);
$requestPath = rtrim($requestPath, '/');

// Route the request
try {
    switch ($requestPath) {
        case '/api/health':
        case '/health':
            require_once __DIR__ . '/health.php';
            break;

        case '/api/login':
        case '/login':
            require_once __DIR__ . '/auth.php';
            break;

        case '/api/register':
        case '/register':
            require_once __DIR__ . '/register.php';
            break;

        default:
            // 404 Not Found
            http_response_code(404);
            echo json_encode([
                'error' => 'Not Found',
                'message' => 'The requested endpoint does not exist',
                'path' => $requestPath
            ]);
            break;
    }
} catch (Exception $e) {
    // Handle uncaught exceptions
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal Server Error',
        'message' => $e->getMessage()
    ]);
}
