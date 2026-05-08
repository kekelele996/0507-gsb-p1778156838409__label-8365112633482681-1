<?php
/**
 * Health Check Endpoint
 *
 * Returns the health status of the API and database connection.
 * GET /api/health
 */

require_once '../config/database.php';

try {
    // Test database connection
    $db = Database::getInstance();
    $conn = $db->getConnection();

    // Simple query to verify connection
    $stmt = $conn->query('SELECT 1 as test');
    $result = $stmt->fetch();

    if ($result && $result['test'] === 1) {
        // Database is connected
        http_response_code(200);
        echo json_encode([
            'status' => 'ok',
            'database' => 'connected',
            'timestamp' => date('c'),
            'version' => '1.0.0'
        ], JSON_PRETTY_PRINT);
    } else {
        // Database query failed
        throw new Exception('Database query failed');
    }

} catch (Exception $e) {
    // Database connection failed
    http_response_code(503);
    echo json_encode([
        'status' => 'error',
        'database' => 'disconnected',
        'error' => $e->getMessage(),
        'timestamp' => date('c')
    ]);
}
