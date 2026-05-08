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

// Use secure authentication from middleware
$currentUser = verifyAuth($conn);

function isAuthenticated($user) {
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        return false;
    }
    return true;
}

switch ($method) {
    case 'GET':
        if ($path === '/me' || $path === '/profile') {
            getProfile($conn, $currentUser);
        } elseif ($path === '/users' || $path === '/users/list') {
            getUsers($conn, $currentUser);
        } elseif (preg_match('/^\/users\/(\d+)$/', $path, $matches)) {
            getUser($conn, $currentUser, $matches[1]);
        } elseif ($path === '/stats') {
            getStats($conn, $currentUser);
        } elseif ($path === '/stats/dashboard') {
            getDashboardStats($conn);
        }
        break;
    case 'POST':
        if ($path === '/users' || $path === '/users/create') {
            createUser($conn, $currentUser);
        }
        break;
    case 'PUT':
        if (preg_match('/^\/users\/(\d+)$/', $path, $matches)) {
            updateUser($conn, $currentUser, $matches[1]);
        }
        break;
    case 'DELETE':
        if (preg_match('/^\/users\/(\d+)$/', $path, $matches)) {
            deleteUser($conn, $currentUser, $matches[1]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

function createUser($conn, $user) {
    if (!requireAdmin($conn)) return;

    $rawInput = file_get_contents('php://input');
    if (!mb_check_encoding($rawInput, 'UTF-8')) {
        $rawInput = mb_convert_encoding($rawInput, 'UTF-8', 'GBK,GB2312,UTF-8');
    }
    $data = json_decode($rawInput, true);

    if ($data === null || $data === false) {
        $data = $_POST;
    }

    // Validate required fields
    if (empty($data['username']) || empty($data['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Username and password are required']);
        return;
    }

    $username = trim($data['username']);
    $password = $data['password'];
    $email = $data['email'] ?? '';
    $role = $data['role'] ?? 'user';
    $fullName = $data['full_name'] ?? $data['real_name'] ?? '';
    $status = isset($data['status']) ? ($data['status'] === 'active' || $data['status'] === 1 ? 1 : 0) : 1;

    // Check if username already exists
    $stmt = $conn->prepare("SELECT id FROM admin_users WHERE username = :username");
    $stmt->execute([':username' => $username]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Username already exists']);
        return;
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // SECURITY: Non-admin users cannot create admin users
    $currentUserRole = $user['role'] ?? '';
    if ($currentUserRole !== 'admin' && $role === 'admin') {
        $role = 'user';
    }

    // Insert new user
    $stmt = $conn->prepare("INSERT INTO admin_users (username, password, email, role, real_name, status, created_at) VALUES (:username, :password, :email, :role, :real_name, :status, NOW())");

    try {
        $result = $stmt->execute([
            ':username' => $username,
            ':password' => $hashedPassword,
            ':email' => $email,
            ':role' => $role,
            ':real_name' => $fullName,
            ':status' => $status
        ]);

        if ($result) {
            $newUserId = $conn->lastInsertId();
            echo json_encode([
                'success' => true,
                'message' => 'User created successfully',
                'data' => [
                    'id' => $newUserId,
                    'username' => $username,
                    'email' => $email,
                    'role' => $role
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to create user']);
        }
    } catch (Exception $e) {
        error_log('Database error: ' . $e->getMessage()); // Log to server, not client
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error occurred']);
    }
}

function getProfile($conn, $user) {
    if (!isAuthenticated($user)) return;

    $stmt = $conn->prepare("SELECT id, username, email, role, real_name as full_name, created_at FROM admin_users WHERE id = :id");
    $stmt->execute([':id' => $user['id']]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($profile) {
        echo json_encode(['success' => true, 'data' => $profile]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found']);
    }
}

function getUsers($conn, $user) {
    if (!requireAdmin($conn)) return;

    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = ($page - 1) * $limit;
    $search = isset($_GET['search']) ? $_GET['search'] : '';

    $where = " WHERE 1=1";
    $params = [];

    if ($search) {
        $where .= " AND (username LIKE :search1 OR email LIKE :search2 OR real_name LIKE :search3)";
        $searchTerm = "%$search%";
        $params[':search1'] = $searchTerm;
        $params[':search2'] = $searchTerm;
        $params[':search3'] = $searchTerm;
    }

    $countSql = "SELECT COUNT(*) as total FROM admin_users$where";
    $stmt = $conn->prepare($countSql);
    $stmt->execute($params);
    $total = $stmt->fetchColumn();

    $params[':limit'] = $limit;
    $params[':offset'] = $offset;
    $sql = "SELECT id, username, email, role, real_name as full_name, status, created_at FROM admin_users$where ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $users,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function getUser($conn, $user, $id) {
    if (!requireAdmin($conn)) return;

    $stmt = $conn->prepare("SELECT id, username, email, role, real_name as full_name, status, created_at FROM admin_users WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo json_encode(['success' => true, 'data' => $user]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found']);
    }
}

function updateUser($conn, $user, $id) {
    if (!requireAdmin($conn)) return;

    $rawInput = file_get_contents('php://input');
    if (!mb_check_encoding($rawInput, 'UTF-8')) {
        $rawInput = mb_convert_encoding($rawInput, 'UTF-8', 'GBK,GB2312,UTF-8');
    }
    $data = json_decode($rawInput, true);

    if ($data === null || $data === false) {
        $data = $_POST;
    }

    // Build dynamic SQL based on provided fields
    $updateFields = [];
    $params = [':id' => $id];

    if (isset($data['username'])) {
        $updateFields[] = 'username = :username';
        $params[':username'] = $data['username'];
    }
    if (isset($data['email'])) {
        $updateFields[] = 'email = :email';
        $params[':email'] = $data['email'];
    }
    if (isset($data['role'])) {
        $updateFields[] = 'role = :role';
        $params[':role'] = $data['role'];
    }
    if (isset($data['full_name'])) {
        $updateFields[] = 'real_name = :full_name';
        $params[':full_name'] = $data['full_name'];
    }
    if (isset($data['status'])) {
        $updateFields[] = 'status = :status';
        $params[':status'] = $data['status'] === 'active' ? 1 : 0;
    }
    // Optional password update
    if (!empty($data['password'])) {
        $updateFields[] = 'password = :password';
        $params[':password'] = password_hash($data['password'], PASSWORD_DEFAULT);
    }

    if (empty($updateFields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No fields to update']);
        return;
    }

    $sql = 'UPDATE admin_users SET ' . implode(', ', $updateFields) . ' WHERE id = :id';
    $stmt = $conn->prepare($sql);

    if ($stmt->execute($params)) {
        echo json_encode(['success' => true, 'message' => 'User updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to update user']);
    }
}

function deleteUser($conn, $user, $id) {
    if (!requireAdmin($conn)) return;

    if ($id == $user['id']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Cannot delete yourself']);
        return;
    }

    // Prevent deleting admin users
    $stmt = $conn->prepare("SELECT role FROM admin_users WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $targetUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($targetUser && $targetUser['role'] === 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Cannot delete admin users']);
        return;
    }

    $stmt = $conn->prepare("DELETE FROM admin_users WHERE id = :id");
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to delete user']);
    }
}

function getStats($conn, $user) {
    if (!isAuthenticated($user)) return;

    $stats = [];

    $stmt = $conn->query("SELECT COUNT(*) as count FROM death_records");
    $stats['death_records'] = $stmt->fetchColumn();

    $stmt = $conn->query("SELECT COUNT(*) as count FROM village_contacts");
    $stats['village_contacts'] = $stmt->fetchColumn();

    $stmt = $conn->query("SELECT COUNT(*) as count FROM subsistence");
    $stats['subsistence'] = $stmt->fetchColumn();

    $stmt = $conn->query("SELECT COUNT(*) as count FROM special_assistance");
    $stats['special_assistance'] = $stmt->fetchColumn();

    $stmt = $conn->query("SELECT COUNT(DISTINCT village) as count FROM death_records");
    $stats['villages'] = $stmt->fetchColumn();

    echo json_encode(['success' => true, 'data' => $stats]);
}

function getDashboardStats($conn) {
    $result = [
        'summary' => [],
        'recent' => []
    ];

    // Current month for stats
    $currentMonth = date('Y-m');

    // Death Records Stats
    $stmt = $conn->query("SELECT COUNT(*) as count FROM death_records");
    $deathTotal = $stmt->fetchColumn();

    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM death_records WHERE DATE_FORMAT(death_date, '%Y-%m') = :month");
    $stmt->execute([':month' => $currentMonth]);
    $deathThisMonth = $stmt->fetchColumn();

    // Village Contacts Stats
    $stmt = $conn->query("SELECT COUNT(*) as count FROM village_contacts");
    $contactsTotal = $stmt->fetchColumn();

    $stmt = $conn->query("SELECT COUNT(*) as count FROM village_contacts WHERE status = 'active'");
    $contactsActive = $stmt->fetchColumn();

    // Subsistence Stats
    $stmt = $conn->query("SELECT COUNT(*) as count FROM subsistence");
    $subsistenceTotal = $stmt->fetchColumn();

    $stmt = $conn->query("SELECT SUM(allowance_amount) as total FROM subsistence");
    $subsistenceAllowance = $stmt->fetchColumn() ?: 0;

    // Special Assistance Stats
    $stmt = $conn->query("SELECT COUNT(*) as count FROM special_assistance");
    $assistanceTotal = $stmt->fetchColumn();

    $stmt = $conn->query("SELECT SUM(allowance_standard) as total FROM special_assistance");
    $assistanceAllowance = $stmt->fetchColumn() ?: 0;

    // Villages count
    $stmt = $conn->query("SELECT COUNT(DISTINCT village) as count FROM death_records");
    $villages = $stmt->fetchColumn();

    $result['summary'] = [
        'death_records' => [
            'total' => (int)$deathTotal,
            'this_month' => (int)$deathThisMonth
        ],
        'village_contacts' => [
            'total' => (int)$contactsTotal,
            'active' => (int)$contactsActive
        ],
        'subsistence' => [
            'total' => (int)$subsistenceTotal,
            'total_allowance' => (float)$subsistenceAllowance
        ],
        'special_assistance' => [
            'total' => (int)$assistanceTotal,
            'total_allowance' => (float)$assistanceAllowance
        ],
        'villages' => (int)$villages
    ];

    // Recent records
    $stmt = $conn->query("SELECT id, name, village, death_date, created_at FROM death_records ORDER BY created_at DESC LIMIT 5");
    $result['recent']['death_records'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $conn->query("SELECT id, name, village, position, created_at FROM village_contacts ORDER BY created_at DESC LIMIT 5");
    $result['recent']['village_contacts'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $conn->query("SELECT id, name, village, allowance_amount as monthly_allowance, created_at FROM subsistence ORDER BY created_at DESC LIMIT 5");
    $result['recent']['subsistence'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $conn->query("SELECT id, name, village, assistance_type, COALESCE(allowance_standard, 0) as monthly_amount, created_at FROM special_assistance ORDER BY created_at DESC LIMIT 5");
    $result['recent']['special_assistance'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $result]);
}
