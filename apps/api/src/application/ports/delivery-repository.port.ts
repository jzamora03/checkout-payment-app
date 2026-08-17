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

export interface DeliveryRepositoryPort {
  create(input: SaveDeliveryInput): Promise<Delivery>;
  assignTransaction(deliveryId: string, transactionId: string): Promise<Delivery>;
  updateStatus(deliveryId: string, status: DeliveryStatus): Promise<Delivery>;
  findById(id: string): Promise<Delivery | null>;
}