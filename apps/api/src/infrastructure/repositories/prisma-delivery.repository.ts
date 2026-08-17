import { Injectable } from '@nestjs/common';
import {
  Delivery,
  DeliveryStatus,
} from '../../domain/delivery/delivery.entity';
import {
  DeliveryRepositoryPort,
  SaveDeliveryInput,
} from '../../application/ports/delivery-repository.port';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaDeliveryRepository implements DeliveryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: SaveDeliveryInput): Promise<Delivery> {
    const delivery = await this.prisma.delivery.create({
      data: {
        customerId: input.customerId,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country,
        notes: input.notes,
        status: DeliveryStatus.PENDING,
      },
    });
    return this.toDomain(delivery);
  }

  async assignTransaction(
    deliveryId: string,
    transactionId: string,
  ): Promise<Delivery> {
    const delivery = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { transactionId },
    });
    return this.toDomain(delivery);
  }

  async updateStatus(
    deliveryId: string,
    status: DeliveryStatus,
  ): Promise<Delivery> {
    const delivery = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { status },
    });
    return this.toDomain(delivery);
  }

  async findById(id: string): Promise<Delivery | null> {
    const delivery = await this.prisma.delivery.findUnique({ where: { id } });
    return delivery ? this.toDomain(delivery) : null;
  }

  private toDomain(model: {
    id: string;
    customerId: string;
    transactionId: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    notes: string | null;
    status: string;
  }): Delivery {
    return Delivery.create({
      id: model.id,
      customerId: model.customerId,
      transactionId: model.transactionId,
      addressLine1: model.addressLine1,
      addressLine2: model.addressLine2,
      city: model.city,
      state: model.state,
      postalCode: model.postalCode,
      country: model.country,
      notes: model.notes,
      status: model.status as DeliveryStatus,
    });
  }
}