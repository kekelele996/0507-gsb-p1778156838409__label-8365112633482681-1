# Labelease Backend API

PHP-based RESTful API backend with MySQL database support.

## Technology Stack

- PHP 8.2
- Apache HTTP Server
- MySQL/MariaDB
- PDO for database operations

## API Endpoints

### Health Check
- **GET** `/api/health`
  - Returns API status and database connection
  - Response: `{"status":"ok","database":"connected"}`

### Authentication
- **POST** `/api/login`
  - User login endpoint
  - Body: `{"username":"admin","password":"admin123"}`
  - Returns: User data with auth token

## Environment Variables

Required environment variables (configure in docker-compose.yml):

```bash
DB_HOST=db          # Database host (service name in Docker)
DB_NAME=labelease_db
DB_USER=root
DB_PASS=rootpass
```

## Project Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── index.php      # Main API router
│   │   ├── auth.php       # Authentication endpoint
│   │   └── health.php     # Health check endpoint
│   ├── config/
│   │   └── database.php   # Database connection class
│   └── models/
│       └── BaseModel.php  # Base model with common operations
├── .htaccess              # Apache rewrite rules
├── composer.json          # PHP dependencies
├── Dockerfile             # Docker image configuration
└── .env.example           # Environment variables template
```

## Usage

### Running with Docker

This backend is designed to run within a Docker Compose setup:

```bash
docker compose up
```

The API will be available at: `http://localhost:8000`

### Testing Endpoints

```bash
# Health check
curl http://localhost:8000/api/health

# Login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Development

### Adding New Endpoints

1. Create a new PHP file in `src/api/` (e.g., `users.php`)
2. Add the route in `src/api/index.php`:

```php
case '/api/users':
    require_once __DIR__ . '/users.php';
    break;
```

3. Implement your endpoint logic in the new file

### Creating Models

Extend `BaseModel` for your database entities:

```php
<?php
class User extends BaseModel {
    protected $table = 'users';

    public function findByEmail(string $email) {
        return $this->query(
            "SELECT * FROM {$this->table} WHERE email = :email",
            ['email' => $email]
        );
    }
}
```

## Features

- RESTful API design
- JSON responses
- CORS support
- PDO prepared statements (SQL injection protection)
- Singleton pattern for database connection
- Base model with CRUD operations
- Error handling with appropriate HTTP status codes
- Health check endpoint

## Security Notes

- This is a demo implementation
- Use JWT for production authentication
- Implement rate limiting
- Add request validation
- Use HTTPS in production
- Store secrets in environment variables
- Implement proper password hashing (password_hash/password_verify)
