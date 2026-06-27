import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  validateSync,
} from 'class-validator';

enum Environment {
  Deveopment = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  // Database
  @IsString()
  DATABASE_HOST!: string;

  @IsNumber()
  DATABASE_PORT!: number;

  @IsString()
  DATABASE_USER!: string;

  @IsString()
  DATABASE_PASSWORD!: string;

  @IsString()
  DATABASE_NAME!: string;

  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV?: Environment;

  // JWT
  @IsString()
  JWT_SECRET!: string;

  @IsString()
  JWT_EXPIRES_IN!: string;

  @IsString()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  JWT_REFRESH_EXPIRES_IN!: string;

  // Mail
  @IsString()
  MAIL_HOST!: string;

  @IsNumber()
  MAIL_PORT!: number;

  @IsBoolean()
  MAIL_SECURE!: boolean;

  @IsString()
  MAIL_USER!: string;

  @IsString()
  MAIL_PASSWORD!: string;

  @IsString()
  MAIL_FROM!: string;

  @IsString()
  MAIL_FROM_NAME!: string;

  @IsNumber()
  RESET_TOKEN_EXPIRES_IN!: number;

  // Frontend
  @IsString()
  FRONTEND_URL!: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
