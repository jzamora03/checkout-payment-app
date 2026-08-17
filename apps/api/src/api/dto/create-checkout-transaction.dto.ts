import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CustomerDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  lastName: string;

  @IsIn(['CC', 'CE', 'TI', 'PASS'])
  documentType: string;

  @IsString()
  @Matches(/^[0-9]{4,20}$/, {
    message: 'documentNumber debe contener entre 4 y 20 dígitos',
  })
  documentNumber: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'phone debe ser un número de teléfono válido',
  })
  phone?: string | null;
}

export class DeliveryDto {
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  addressLine1: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  addressLine2?: string | null;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  state: string;

  @IsString()
  @Matches(/^[0-9A-Za-z-]{3,10}$/, {
    message: 'postalCode no es válido',
  })
  postalCode: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string | null;
}

export class CreateCheckoutTransactionDto {
  @IsUUID()
  productId: string;

  @IsString()
  @MinLength(10)
  @MaxLength(200)
  cardToken: string;

  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @ValidateNested()
  @Type(() => DeliveryDto)
  delivery: DeliveryDto;
}