<?php
/**
 * Base Model Class
 *
 * Provides common database operations for all models.
 * All model classes should extend this class.
 */

require_once __DIR__ . '/../config/database.php';

abstract class BaseModel {
    protected $db;
    protected $connection;
    protected $table;

    /**
     * Constructor
     * Initializes database connection
     */
    public function __construct() {
        $this->db = Database::getInstance();
        $this->connection = $this->db->getConnection();
    }

    /**
     * Find a record by ID
     *
     * @param int $id Record ID
     * @return array|false Record data or false if not found
     */
    public function find(int $id) {
        $sql = "SELECT * FROM {$this->table} WHERE id = :id LIMIT 1";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    /**
     * Get all records
     *
     * @param array $options Query options (limit, offset, order)
     * @return array List of records
     */
    public function findAll(array $options = []): array {
        $limit = $options['limit'] ?? 100;
        $offset = $options['offset'] ?? 0;
        $order = $options['order'] ?? 'id ASC';

        // SECURITY: Validate order parameter to prevent SQL injection
        // Only allow alphanumeric column names and ASC/DESC direction
        $allowedDirections = ['ASC', 'DESC'];
        $orderParts = explode(' ', trim($order));
        $column = preg_replace('/[^a-zA-Z0-9_]/', '', $orderParts[0] ?? 'id');
        $direction = isset($orderParts[1]) && in_array(strtoupper($orderParts[1]), $allowedDirections)
            ? strtoupper($orderParts[1])
            : 'ASC';
        $safeOrder = "$column $direction";

        $sql = "SELECT * FROM {$this->table} ORDER BY {$safeOrder} LIMIT :limit OFFSET :offset";
        $stmt = $this->connection->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Insert a new record
     *
     * @param array $data Associative array of column => value
     * @return int|false Last insert ID or false on failure
     */
    public function create(array $data) {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_map(fn($key) => ":{$key}", array_keys($data)));

        $sql = "INSERT INTO {$this->table} ({$columns}) VALUES ({$placeholders})";
        $stmt = $this->connection->prepare($sql);

        foreach ($data as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }

        if ($stmt->execute()) {
            return (int) $this->connection->lastInsertId();
        }

        return false;
    }

    /**
     * Update a record by ID
     *
     * @param int $id Record ID
     * @param array $data Associative array of column => value
     * @return bool True on success, false on failure
     */
    public function update(int $id, array $data): bool {
        $setClause = implode(', ', array_map(fn($key) => "{$key} = :{$key}", array_keys($data)));

        $sql = "UPDATE {$this->table} SET {$setClause} WHERE id = :id";
        $stmt = $this->connection->prepare($sql);

        foreach ($data as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Delete a record by ID
     *
     * @param int $id Record ID
     * @return bool True on success, false on failure
     */
    public function delete(int $id): bool {
        $sql = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->connection->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Count records
     *
     * @param array $conditions WHERE conditions
     * @return int Number of records
     */
    public function count(array $conditions = []): int {
        $sql = "SELECT COUNT(*) as count FROM {$this->table}";

        if (!empty($conditions)) {
            $whereClause = implode(' AND ', array_map(fn($key) => "{$key} = :{$key}", array_keys($conditions)));
            $sql .= " WHERE {$whereClause}";
        }

        $stmt = $this->connection->prepare($sql);

        foreach ($conditions as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }

        $stmt->execute();
        $result = $stmt->fetch();

        return (int) $result['count'];
    }

    /**
     * Execute a custom query
     *
     * @param string $sql SQL query
     * @param array $params Query parameters
     * @return array Query results
     */
    protected function query(string $sql, array $params = []): array {
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
}
