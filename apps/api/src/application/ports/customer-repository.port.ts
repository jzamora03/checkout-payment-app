import { Customer } from '../../domain/customer/customer.entity';

export interface SaveCustomerInput {
  email: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  phone: string | null;
}

export abstract class CustomerRepositoryPort {
  abstract findByEmail(email: string): Promise<Customer | null>;
  abstract upsertByEmail(input: SaveCustomerInput): Promise<Customer>;
}