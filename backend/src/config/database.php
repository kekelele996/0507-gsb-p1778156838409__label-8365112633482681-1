<?php
/**
 * Database Configuration and Connection
 *
 * This file handles MySQL database connection using environment variables.
 * Required environment variables:
 * - DB_HOST: Database host (default: 'db')
 * - DB_NAME: Database name (default: 'labelease_db')
 * - DB_USER: Database user (default: 'root')
 * - DB_PASS: Database password (default: 'rootpass')
 */

class Database {
    private static $instance = null;
    private $connection;

    /**
     * Private constructor for Singleton pattern
     */
    private function __construct() {
        $host = getenv('DB_HOST') ?: 'db';
        $dbname = getenv('DB_NAME') ?: 'labelease_db';
        $username = getenv('DB_USER') ?: 'root';
        $password = getenv('DB_PASS') ?: 'rootpass';

        try {
            $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $this->connection = new PDO($dsn, $username, $password, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }

    /**
     * Get singleton instance
     */
    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    /**
     * Get PDO connection
     */
    public function getConnection(): PDO {
        return $this->connection;
    }

    /**
     * Prevent cloning of instance
     */
    private function __clone() {}

    /**
     * Prevent unserialization of instance
     */
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}
