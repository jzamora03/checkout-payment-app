import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number;

  @IsUrl({ require_tld: false })
  DATABASE_URL: string;

  @IsUrl({ require_tld: false })
  PAYMENT_API_URL: string;

  @IsString()
  @MinLength(10)
  PAYMENT_PUBLIC_KEY: string;

  @IsString()
  @MinLength(10)
  PAYMENT_PRIVATE_KEY: string;

  @IsString()
  PAYMENT_EVENTS_KEY: string;

  @IsString()
  @MinLength(10)
  PAYMENT_INTEGRITY_KEY: string;

  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  BASE_FEE_CENTS: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  DELIVERY_FEE_CENTS: number;

  @IsUrl({ require_tld: false })
  @IsOptional()
  APP_URL?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Configuración de entorno inválida: ${errors.toString()}`);
  }
  return validated;
}
