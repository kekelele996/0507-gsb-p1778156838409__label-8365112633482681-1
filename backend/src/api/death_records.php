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
            getDeathRecords($conn);
        } elseif (preg_match('/^\/(\d+)$/', $path, $matches)) {
            getDeathRecord($conn, $matches[1]);
        }
        break;
    case 'POST':
        createDeathRecord($conn);
        break;
    case 'PUT':
        if (preg_match('/^\/(\d+)$/', $path, $matches)) {
            updateDeathRecord($conn, $matches[1]);
        }
        break;
    case 'DELETE':
        if (preg_match('/^\/(\d+)$/', $path, $matches)) {
            deleteDeathRecord($conn, $matches[1]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

function getDeathRecords($conn) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = ($page - 1) * $limit;
    $search = isset($_GET['search']) ? $_GET['search'] : '';

    $where = '';
    $params = [];
    if ($search) {
        $where = " WHERE name LIKE :search1 OR id_card LIKE :search2 OR village LIKE :search3";
        $searchTerm = "%$search%";
        $params = [
            ':search1' => $searchTerm,
            ':search2' => $searchTerm,
            ':search3' => $searchTerm
        ];
    }

    $countSql = "SELECT COUNT(*) as total FROM death_records$where";
    $stmt = $conn->prepare($countSql);
    $stmt->execute($params);
    $total = $stmt->fetchColumn();

    $sql = "SELECT * FROM death_records$where ORDER BY death_date DESC LIMIT :limit OFFSET :offset";
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

function getDeathRecord($conn, $id) {
    $stmt = $conn->prepare("SELECT * FROM death_records WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        echo json_encode(['success' => true, 'data' => $row]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Record not found']);
    }
}

function createDeathRecord($conn) {
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

    // Validate input data
    if (empty($data)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No data received']);
        return;
    }

    $required = ['name', 'id_card', 'gender', 'death_date', 'death_reason', 'village'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Field '$field' is required"]);
            return;
        }
    }

    $sql = "INSERT INTO death_records (name, id_card, gender, age, death_date, death_time, death_reason, death_place, village, reporter_name, reporter_phone, reporter_relation, notes, created_by) VALUES (:name, :id_card, :gender, :age, :death_date, :death_time, :death_reason, :death_place, :village, :reporter_name, :reporter_phone, :reporter_relation, :notes, :created_by)";

    $stmt = $conn->prepare($sql);
    $params = [
        ':name' => $data['name'],
        ':id_card' => $data['id_card'],
        ':gender' => $data['gender'],
        ':age' => $data['age'] ?? null,
        ':death_date' => $data['death_date'],
        ':death_time' => $data['death_time'] ?? null,
        ':death_reason' => $data['death_reason'],
        ':death_place' => $data['death_place'] ?? null,
        ':village' => $data['village'],
        ':reporter_name' => $data['reporter_name'] ?? null,
        ':reporter_phone' => $data['reporter_phone'] ?? null,
        ':reporter_relation' => $data['reporter_relation'] ?? null,
        ':notes' => $data['notes'] ?? null,
        ':created_by' => $data['created_by'] ?? 1
    ];

    if ($stmt->execute($params)) {
        echo json_encode(['success' => true, 'data' => ['id' => $conn->lastInsertId()]]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to create record']);
    }
}

function updateDeathRecord($conn, $id) {
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

    // Validate input data
    if (empty($data)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No data received']);
        return;
    }

    $sql = "UPDATE death_records SET name=:name, id_card=:id_card, gender=:gender, age=:age, death_date=:death_date, death_time=:death_time, death_reason=:death_reason, death_place=:death_place, village=:village, reporter_name=:reporter_name, reporter_phone=:reporter_phone, reporter_relation=:reporter_relation, notes=:notes WHERE id=:id";

    $stmt = $conn->prepare($sql);
    $params = [
        ':name' => $data['name'],
        ':id_card' => $data['id_card'],
        ':gender' => $data['gender'],
        ':age' => $data['age'] ?? null,
        ':death_date' => $data['death_date'],
        ':death_time' => $data['death_time'] ?? null,
        ':death_reason' => $data['death_reason'],
        ':death_place' => $data['death_place'] ?? null,
        ':village' => $data['village'],
        ':reporter_name' => $data['reporter_name'] ?? null,
        ':reporter_phone' => $data['reporter_phone'] ?? null,
        ':reporter_relation' => $data['reporter_relation'] ?? null,
        ':notes' => $data['notes'] ?? null,
        ':id' => $id
    ];

    if ($stmt->execute($params)) {
        echo json_encode(['success' => true, 'message' => 'Record updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to update record']);
    }
}

function deleteDeathRecord($conn, $id) {
    $stmt = $conn->prepare("DELETE FROM death_records WHERE id = :id");

    if ($stmt->execute([':id' => $id])) {
        echo json_encode(['success' => true, 'message' => 'Record deleted successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to delete record']);
    }
}
