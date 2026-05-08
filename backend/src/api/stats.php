<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

$db = Database::getInstance();
$conn = $db->getConnection();

try {
    $summary = [
        'death_records_count' => $conn->query("SELECT COUNT(*) FROM death_records")->fetchColumn(),
        'village_contacts_count' => $conn->query("SELECT COUNT(*) FROM village_contacts")->fetchColumn(),
        'subsistence_count' => $conn->query("SELECT COUNT(*) FROM subsistence")->fetchColumn(),
        'special_assistance_count' => $conn->query("SELECT COUNT(*) FROM special_assistance")->fetchColumn(),
    ];

    echo json_encode(['success' => true, 'data' => $summary]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
