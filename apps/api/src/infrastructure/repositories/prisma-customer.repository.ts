import { Injectable } from '@nestjs/common';
import { Customer } from '../../domain/customer/customer.entity';
import {
  CustomerRepositoryPort,
  SaveCustomerInput,
} from '../../application/ports/customer-repository.port';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaCustomerRepository implements CustomerRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
    });
    return customer ? this.toDomain(customer) : null;
  }

  async upsertByEmail(input: SaveCustomerInput): Promise<Customer> {
    const email = input.email.toLowerCase();
    const customer = await this.prisma.customer.upsert({
      where: { email },
      update: {
        firstName: input.firstName,
        lastName: input.lastName,
        documentType: input.documentType,
        documentNumber: input.documentNumber,
        phone: input.phone,
      },
      create: {
        email,
        firstName: input.firstName,
        lastName: input.lastName,
        documentType: input.documentType,
        documentNumber: input.documentNumber,
        phone: input.phone,
      },
    });
    return this.toDomain(customer);
  }

  private toDomain(model: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    documentType: string;
    documentNumber: string;
    phone: string | null;
  }): Customer {
    return Customer.create({
      id: model.id,
      email: model.email,
      firstName: model.firstName,
      lastName: model.lastName,
      documentType: model.documentType,
      documentNumber: model.documentNumber,
      phone: model.phone,
    });
  }
}