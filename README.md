# Nest Auth API

A production-ready authentication & authorization system built with NestJS.

## Features (Planned)

- [x] Project setup (NestJS + TypeScript)
- [x] PostgreSQL + Docker
- [x] User module (entity, DTO, service)
- [x] Global exception filter
- [x] Response interceptor (unified format)
- [ ] User registration & login
- [ ] Password hashing (bcrypt/argon2)
- [ ] JWT access & refresh tokens
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
| JWT | Authentication |
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
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USER=nest_user
DATABASE_PASSWORD=nest_pass
DATABASE_NAME=nest_auth_db

> Note: Port `5433` is used to avoid conflict with a local PostgreSQL instance running on the default port `5432`.

### Run Database

bash
docker compose up -d

### Run Application

bash
npm run start:dev

## Project Structure


src/
├── auth/          # Authentication module
├── users/         # User management module
├── common/        # Shared guards, decorators, filters, interceptors
├── config/        # Configuration module
├── app.module.ts
└── main.ts

## API Documentation

Coming soon (Swagger UI at `/api/docs`)

## License

MIT
