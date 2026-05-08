<?php
require_once '../config/database.php';

$db = Database::getInstance();
$conn = $db->getConnection();

$stmt = $conn->prepare("SELECT id, username, password, real_name, email, role, status FROM admin_users WHERE username = :username");
$stmt->execute([':username' => 'admin']);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

header('Content-Type: application/json');
echo json_encode([
    'user' => $user,
    'verify_admin123' => password_verify('admin123', $user['password']),
    'verify_password' => password_verify('password', $user['password']),
]);
