import { Customer } from '../../domain/customer/customer.entity';

export interface SaveCustomerInput {
  email: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  phone: string | null;
}

export interface CustomerRepositoryPort {
  findByEmail(email: string): Promise<Customer | null>;
  upsertByEmail(input: SaveCustomerInput): Promise<Customer>;
}