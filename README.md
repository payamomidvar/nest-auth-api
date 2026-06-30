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
- [x] Role-based access control (RBAC)
- [x] Password reset via email
- [x] Rate limiting (throttling)
- [x] Security headers (Helmet)
- [x] Swagger API documentation

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
| Nodemailer + Handlebars | Email & templates |
| @nestjs/throttler | Rate limiting |
| Helmet | Security headers |
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
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USER=nest_user
DATABASE_PASSWORD=nest_pass
DATABASE_NAME=nest_auth_db
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Mail Configuration
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_SECURE=false
MAIL_USER=your-mailtrap-user
MAIL_PASSWORD=your-mailtrap-password
MAIL_FROM=noreply@yourapp.com
MAIL_FROM_NAME=YourApp
RESET_TOKEN_EXPIRES_IN=300000

# Frontend
FRONTEND_URL=http://localhost:3000

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
| POST | `/api/auth/forgot-password` | Request password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |

## User Management Endpoints

All endpoints require JWT authentication. Some require specific roles.

| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/users` | ADMIN | List all users (paginated) |
| GET | `/api/users/by-email?email=` | ADMIN | Find user by email |
| GET | `/api/users/:id` | Authenticated | Get user by ID |

## Password Reset Flow

1. User submits their email to `POST /api/auth/forgot-password`
2. A reset token is generated, hashed, stored, and emailed as a link to the frontend (`FRONTEND_URL/reset-password?token=...`)
3. User opens the link, enters a new password on the frontend page
4. The frontend sends `POST /api/auth/reset-password` with the token and new password
5. The token is validated against its expiry (`RESET_TOKEN_EXPIRES_IN`) and the password is updated

> Reset tokens are hashed (SHA-256) before storage, so the raw token only ever exists in the email link.

## Rate Limiting

The API uses [`@nestjs/throttler`](https://docs.nestjs.com/security/rate-limiting) to protect against brute-force and abuse.

- **Global default:** 10 requests per minute per client (`ttl: 60000`, `limit: 10`), enforced by a global `ThrottlerGuard` registered via `APP_GUARD`.
- **Stricter per-route limit:** the `POST /api/auth/forgot-password` endpoint is limited to **3 requests per minute** using the `@Throttle({ default: { limit: 3, ttl: 60000 } })` decorator.

When a client exceeds a limit, the request is rejected with HTTP `429 Too Many Requests`. The `ThrottlerException` is handled inside the unified `HttpExceptionFilter`, which logs it as a warning and returns a standardized JSON response:

json
{
  "statusCode": 429,
  "message": "Too Many Requests. Please wait a moment and try again."
}

### Trust Proxy (Production)

When running behind a reverse proxy (Nginx, Cloudflare, AWS Load Balancer, etc.), Express needs to trust the proxy so it can read the client's real IP from the `X-Forwarded-For` header. Without this, rate limiting would count requests per proxy instead of per client.

This is enabled only in production:

typescript
if (process.env.NODE_ENV === 'production') {
  (app.getHttpAdapter().getInstance() as any).set('trust proxy', 1);
}

In development (no proxy in front of the app), the setting is skipped.

## Security Headers

The API uses [`helmet`](https://github.com/helmetjs/helmet) to set security-related HTTP headers (`X-Frame-Options`, `Strict-Transport-Security`, `X-Content-Type-Options`, etc.) and reduce common web vulnerabilities.

- A custom **Content Security Policy (CSP)** is applied **only in production**, so Swagger UI (which relies on inline scripts/styles) keeps working in development.

typescript
import helmet from 'helmet';

if (process.env.NODE_ENV === 'production') {
  app.use(
helmet({
contentSecurityPolicy: {
directives: {
defaultSrc: [`'self'`],
scriptSrc: [`'self'`],
styleSrc: [`'self'`, `'unsafe-inline'`],
imgSrc: [`'self'`, 'data:'],
},
},
}),
  );
} else {
  app.use(helmet({ contentSecurityPolicy: false }));
}

## Authorization (RBAC)

The system supports two roles:
- **`user`** — Default role assigned on registration
- **`admin`** — Full access to user management

To create the first admin, update the role directly in the database:

sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';

Routes can be protected using the `@Roles()` decorator:

typescript
@Get()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
findAll() {
  // Only admins can access this
}

## Project Structure

text
src/
├── auth/              # Authentication module
│   ├── strategies/    # JWT & JWT refresh strategies
│   ├── guards/        # JWT auth & roles guards
│   ├── decorators/    # @Roles decorator
│   ├── dto/           # Auth DTOs
│   ├── auth.service.ts
│   └── auth.controller.ts
├── common/
│   ├── filters/       # Global exception filter
│   ├── interceptors/  # Response & serialization interceptors
│   └── interfaces/    # Shared interfaces (Response, PaginationMeta)
├── config/            # Configuration & env validation
├── mail/              # Mail module
│   ├── dto/           # Mail-related DTOs
│   ├── interfaces/    # mail-context.interface.ts
│   ├── templates/     # Handlebars templates (reset-password.hbs)
│   ├── mail.module.ts
│   └── mail.service.ts
├── users/             # User management module
│   ├── dto/           # Data transfer objects
│   ├── entities/      # User entity
│   ├── enums/         # Role enum
│   ├── users.controller.ts
│   └── users.service.ts
├── app.module.ts
└── main.ts

## API Documentation

Interactive API docs are available via Swagger UI at:

http://localhost:3000/api/docs

Swagger is disabled in production to avoid exposing the full API surface. Access it only in development or staging environments.

The docs include Bearer token authorization support. After login, paste your access token via the Authorize button to test protected endpoints directly.

## License

MIT
`