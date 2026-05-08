<?php
/**
 * Password Reset Script
 *
 * This script ensures admin user has the correct password.
 * Run during container startup to fix password issues.
 */

require_once __DIR__ . '/src/config/database.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    // Generate correct password hash for admin123
    $password = 'admin123';
    $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

    // Check if admin user exists
    $stmt = $conn->prepare("SELECT id FROM admin_users WHERE username = 'admin'");
    $stmt->execute();
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($admin) {
        // Update existing admin password
        $stmt = $conn->prepare("UPDATE admin_users SET password = :password, status = 1 WHERE username = 'admin'");
        $stmt->execute([':password' => $hash]);
        echo "Admin password updated successfully.\n";
    } else {
        // Create admin user
        $stmt = $conn->prepare("INSERT INTO admin_users (username, password, real_name, email, role, status) VALUES ('admin', :password, '系统管理员', 'admin@example.com', 'admin', 1)");
        $stmt->execute([':password' => $hash]);
        echo "Admin user created successfully.\n";
    }

    // Also create/update test user with password user123
    $userPassword = 'user123';
    $userHash = password_hash($userPassword, PASSWORD_BCRYPT, ['cost' => 10]);

    $stmt = $conn->prepare("SELECT id FROM admin_users WHERE username = 'user'");
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $stmt = $conn->prepare("UPDATE admin_users SET password = :password, status = 1 WHERE username = 'user'");
        $stmt->execute([':password' => $userHash]);
        echo "User password updated successfully.\n";
    } else {
        $stmt = $conn->prepare("INSERT INTO admin_users (username, password, real_name, email, role, status) VALUES ('user', :password, '普通用户', 'user@example.com', 'user', 1)");
        $stmt->execute([':password' => $userHash]);
        echo "User created successfully.\n";
    }

    echo "Password reset completed. Admin: admin/admin123, User: user/user123\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
