# Nest Auth API

A production-ready authentication & authorization system built with NestJS.

## Features

- [x] Project setup (NestJS + TypeScript)
- [x] PostgreSQL + Docker
- [x] User module (entity, DTO, service)
- [x] Global exception filter
- [x] Response interceptor (unified format)
- [x] Structured logging with Pino
- [x] User registration & login
- [x] Password hashing (bcrypt/argon2)
- [x] JWT access & refresh tokens
- [ ] Role-based access control (RBAC)
- [ ] Password reset via email
- [ ] Rate limiting & security headers
- [ ] Swagger API documentation

## Tech Stack

| Technology | Purpose |
|------------|---------|
| NestJS 11 | Backend framework |
| TypeScript | Type safety |
| PostgreSQL 17 | Database |
| TypeORM | ORM |
| Docker | Containerization |
| Pino | Structured logging |
| Passport + JWT | Authentication |
| Swagger | API docs |

## Getting Started

### Prerequisites

- Node.js >= 22
- Docker & Docker Compose
- Git

### Installation
```bash
git clone https://github.com/payamomidvar/nest-auth-api.git
cd nest-auth-api
npm install

### Environment Variables

Create a `.env` file in the root:

env
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USER=nest_user
DATABASE_PASSWORD=nest_pass
DATABASE_NAME=nest_auth_db
JWT_SECRET=your_access_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

> Note: Port `5433` is used to avoid conflict with a local PostgreSQL instance running on the default port `5432`.

### Run Database

bash
docker compose up -d

### Run Application

bash
npm run start:dev

The API will be available at `http://localhost:3000/api`

## Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive tokens |
| POST | `/api/auth/refresh` | Get new tokens using refresh token |

## Project Structure


src/
├── auth/              # Authentication module
│   ├── strategies/    # JWT & JWT refresh strategies
│   ├── guards/        # JWT auth guards
│   ├── dto/           # Auth DTOs
│   ├── auth.service.ts
│   └── auth.controller.ts
├── users/             # User management module
│   ├── entities/      # User entity
│   ├── dto/           # Data transfer objects
│   ├── users.service.ts
│   └── users.controller.ts
├── common/
│   ├── filters/       # Global exception filter
│   ├── interceptors/  # Response & serialization interceptors
│   └── interfaces/    # Shared interfaces (Response, PaginationMeta)
├── config/            # Configuration module
├── app.module.ts
└── main.ts

## API Documentation

Coming soon (Swagger UI at `/api/docs`)

## License

MIT
