<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';
require_once 'auth_middleware.php';

$db = Database::getInstance();
$conn = $db->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '/';

// All endpoints require authentication
$currentUser = requireAuth($conn);

switch ($method) {
    case 'GET':
        if ($path === '/list' || $path === '/') {
            getVillageContacts($conn);
        } elseif (preg_match('/^\/(\d+)$/', $path, $matches)) {
            getVillageContact($conn, $matches[1]);
        }
        break;
    case 'POST':
        createVillageContact($conn);
        break;
    case 'PUT':
        if (preg_match('/^\/(\d+)$/', $path, $matches)) {
            updateVillageContact($conn, $matches[1]);
        }
        break;
    case 'DELETE':
        if (preg_match('/^\/(\d+)$/', $path, $matches)) {
            deleteVillageContact($conn, $matches[1]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

function getVillageContacts($conn) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = ($page - 1) * $limit;
    $search = isset($_GET['search']) ? $_GET['search'] : '';

    $where = '';
    $params = [];
    if ($search) {
        $where = " WHERE name LIKE :search1 OR village LIKE :search2 OR phone LIKE :search3";
        $searchTerm = "%$search%";
        $params = [
            ':search1' => $searchTerm,
            ':search2' => $searchTerm,
            ':search3' => $searchTerm
        ];
    }

    $countSql = "SELECT COUNT(*) as total FROM village_contacts$where";
    $stmt = $conn->prepare($countSql);
    $stmt->execute($params);
    $total = $stmt->fetchColumn();

    $sql = "SELECT * FROM village_contacts$where ORDER BY village, name LIMIT :limit OFFSET :offset";
    $stmt = $conn->prepare($sql);
    $params[':limit'] = $limit;
    $params[':offset'] = $offset;
    $stmt->execute($params);

    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $records,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function getVillageContact($conn, $id) {
    $stmt = $conn->prepare("SELECT * FROM village_contacts WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        echo json_encode(['success' => true, 'data' => $row]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Contact not found']);
    }
}

function createVillageContact($conn) {
    // Try to get JSON input first
    $rawInput = file_get_contents('php://input');

    // Try to convert from other encodings to UTF-8 if needed
    if (!mb_check_encoding($rawInput, 'UTF-8')) {
        // Try GBK conversion (common on Windows)
        $rawInput = mb_convert_encoding($rawInput, 'UTF-8', 'GBK,GB2312,UTF-8');
    }

    $data = json_decode($rawInput, true);

    // If JSON parsing failed (null) or returned empty array, try $_POST
    if ($data === null || $data === false) {
        $data = $_POST;
    }

    // Log for debugging (remove after fix)
    if (empty($data)) {
        error_log("Raw input: " . $rawInput);
        error_log("JSON decode error: " . json_last_error_msg());
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No data received', 'debug' => $rawInput]);
        return;
    }

    $required = ['name', 'village', 'phone'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Field '$field' is required"]);
            return;
        }
    }

    $sql = "INSERT INTO village_contacts (name, village, position, phone, email, address, notes, status) VALUES (:name, :village, :position, :phone, :email, :address, :notes, :status)";

    $stmt = $conn->prepare($sql);
    $params = [
        ':name' => $data['name'],
        ':village' => $data['village'],
        ':position' => $data['position'] ?? null,
        ':phone' => $data['phone'],
        ':email' => $data['email'] ?? null,
        ':address' => $data['address'] ?? null,
        ':notes' => $data['notes'] ?? null,
        ':status' => 'active'
    ];

    if ($stmt->execute($params)) {
        echo json_encode(['success' => true, 'data' => ['id' => $conn->lastInsertId()]]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to create contact']);
    }
}

function updateVillageContact($conn, $id) {
    // Try to get JSON input first
    $rawInput = file_get_contents('php://input');

    // Try to convert from other encodings to UTF-8 if needed
    if (!mb_check_encoding($rawInput, 'UTF-8')) {
        // Try GBK conversion (common on Windows)
        $rawInput = mb_convert_encoding($rawInput, 'UTF-8', 'GBK,GB2312,UTF-8');
    }

    $data = json_decode($rawInput, true);

    // If JSON parsing failed (null) or returned empty array, try $_POST
    if ($data === null || $data === false) {
        $data = $_POST;
    }

    // Log for debugging (remove after fix)
    if (empty($data)) {
        error_log("Raw input: " . $rawInput);
        error_log("JSON decode error: " . json_last_error_msg());
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No data received', 'debug' => $rawInput]);
        return;
    }

    $sql = "UPDATE village_contacts SET name=:name, village=:village, position=:position, phone=:phone, email=:email, address=:address, notes=:notes, status=:status WHERE id=:id";

    $stmt = $conn->prepare($sql);
    $params = [
        ':name' => $data['name'],
        ':village' => $data['village'],
        ':position' => $data['position'] ?? null,
        ':phone' => $data['phone'],
        ':email' => $data['email'] ?? null,
        ':address' => $data['address'] ?? null,
        ':notes' => $data['notes'] ?? null,
        ':status' => $data['status'] ?? 'active',
        ':id' => $id
    ];

    if ($stmt->execute($params)) {
        echo json_encode(['success' => true, 'message' => 'Contact updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to update contact']);
    }
}

function deleteVillageContact($conn, $id) {
    $stmt = $conn->prepare("DELETE FROM village_contacts WHERE id = :id");

    if ($stmt->execute([':id' => $id])) {
        echo json_encode(['success' => true, 'message' => 'Contact deleted successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to delete contact']);
    }
}
