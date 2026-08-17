import { Delivery, DeliveryStatus } from '../../domain/delivery/delivery.entity';

export interface SaveDeliveryInput {
  customerId: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string | null;
}

export abstract class DeliveryRepositoryPort {
  abstract create(input: SaveDeliveryInput): Promise<Delivery>;
  abstract assignTransaction(deliveryId: string, transactionId: string): Promise<Delivery>;
  abstract updateStatus(deliveryId: string, status: DeliveryStatus): Promise<Delivery>;
  abstract findById(id: string): Promise<Delivery | null>;
}