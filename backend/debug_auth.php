<?php
require_once 'src/config/database.php';

$db = Database::getInstance();
$conn = $db->getConnection();

$stmt = $conn->prepare("SELECT id, username, password, real_name, email, role, status FROM admin_users WHERE username = :username");
$stmt->execute([':username' => 'admin']);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

echo "User data:\n";
print_r($user);
echo "\n";

if ($user) {
    echo "Password from DB: " . $user['password'] . "\n";
    echo "Verify 'admin123': " . (password_verify('admin123', $user['password']) ? 'true' : 'false') . "\n";
    echo "Verify 'password': " . (password_verify('password', $user['password']) ? 'true' : 'false') . "\n";
}
