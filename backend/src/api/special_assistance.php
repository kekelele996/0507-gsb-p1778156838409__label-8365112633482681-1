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
            getSpecialAssistance($conn);
        } elseif (preg_match('/^\/(\d+)$/', $path, $matches)) {
            getSpecialAssistanceRecord($conn, $matches[1]);
        }
        break;
    case 'POST':
        createSpecialAssistance($conn);
        break;
    case 'PUT':
        if (preg_match('/^\/(\d+)$/', $path, $matches)) {
            updateSpecialAssistance($conn, $matches[1]);
        }
        break;
    case 'DELETE':
        if (preg_match('/^\/(\d+)$/', $path, $matches)) {
            deleteSpecialAssistance($conn, $matches[1]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

function getSpecialAssistance($conn) {
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

    $countSql = "SELECT COUNT(*) as total FROM special_assistance$where";
    $stmt = $conn->prepare($countSql);
    $stmt->execute($params);
    $total = $stmt->fetchColumn();

    $sql = "SELECT * FROM special_assistance$where ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
    $stmt = $conn->prepare($sql);
    $params[':limit'] = $limit;
    $params[':offset'] = $offset;
    $stmt->execute($params);

    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Map allowance_standard to monthly_amount for frontend compatibility
    $records = array_map(function($record) {
        $record['monthly_amount'] = $record['allowance_standard'];
        return $record;
    }, $records);

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

function getSpecialAssistanceRecord($conn, $id) {
    $stmt = $conn->prepare("SELECT * FROM special_assistance WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        // Map allowance_standard to monthly_amount for frontend compatibility
        $row['monthly_amount'] = $row['allowance_standard'];
        echo json_encode(['success' => true, 'data' => $row]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Record not found']);
    }
}

function createSpecialAssistance($conn) {
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

    $required = ['name', 'id_card', 'village'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Field '$field' is required"]);
            return;
        }
    }

    $sql = "INSERT INTO special_assistance (name, id_card, gender, age, assistance_type, allowance_standard, admission_date, village, address, health_status, guardian, guardian_phone, remarks) VALUES (:name, :id_card, :gender, :age, :assistance_type, :allowance_standard, :admission_date, :village, :address, :health_status, :guardian, :guardian_phone, :remarks)";

    $stmt = $conn->prepare($sql);
    $params = [
        ':name' => $data['name'],
        ':id_card' => $data['id_card'],
        ':gender' => $data['gender'] ?? null,
        ':age' => $data['age'] ?? null,
        ':assistance_type' => $data['assistance_type'] ?? '分散供养',
        ':allowance_standard' => $data['allowance_standard'] ?? $data['monthly_amount'] ?? null,
        ':admission_date' => $data['admission_date'] ?? null,
        ':village' => $data['village'],
        ':address' => $data['address'] ?? null,
        ':health_status' => $data['health_status'] ?? null,
        ':guardian' => $data['guardian'] ?? null,
        ':guardian_phone' => $data['guardian_phone'] ?? null,
        ':remarks' => $data['remarks'] ?? null
    ];

    if ($stmt->execute($params)) {
        echo json_encode(['success' => true, 'data' => ['id' => $conn->lastInsertId()]]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to create record']);
    }
}

function updateSpecialAssistance($conn, $id) {
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

    $sql = "UPDATE special_assistance SET name=:name, id_card=:id_card, gender=:gender, age=:age, assistance_type=:assistance_type, allowance_standard=:allowance_standard, admission_date=:admission_date, village=:village, address=:address, health_status=:health_status, guardian=:guardian, guardian_phone=:guardian_phone, remarks=:remarks WHERE id=:id";

    $stmt = $conn->prepare($sql);
    $params = [
        ':name' => $data['name'],
        ':id_card' => $data['id_card'],
        ':gender' => $data['gender'] ?? null,
        ':age' => $data['age'] ?? null,
        ':assistance_type' => $data['assistance_type'] ?? '分散供养',
        ':allowance_standard' => $data['allowance_standard'] ?? $data['monthly_amount'] ?? null,
        ':admission_date' => $data['admission_date'] ?? null,
        ':village' => $data['village'],
        ':address' => $data['address'] ?? null,
        ':health_status' => $data['health_status'] ?? null,
        ':guardian' => $data['guardian'] ?? null,
        ':guardian_phone' => $data['guardian_phone'] ?? null,
        ':remarks' => $data['remarks'] ?? null,
        ':id' => $id
    ];

    if ($stmt->execute($params)) {
        echo json_encode(['success' => true, 'message' => 'Record updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to update record']);
    }
}

function deleteSpecialAssistance($conn, $id) {
    $stmt = $conn->prepare("DELETE FROM special_assistance WHERE id = :id");

    if ($stmt->execute([':id' => $id])) {
        echo json_encode(['success' => true, 'message' => 'Record deleted successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to delete record']);
    }
}
