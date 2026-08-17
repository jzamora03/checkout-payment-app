export enum DeliveryStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface DeliveryProps {
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
  status: DeliveryStatus;
}

export class Delivery {
  private constructor(private readonly props: DeliveryProps) {}

  static create(props: DeliveryProps): Delivery {
    return new Delivery(props);
  }

  get id(): string {
    return this.props.id;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get transactionId(): string | null {
    return this.props.transactionId;
  }

  get status(): DeliveryStatus {
    return this.props.status;
  }

  assignToTransaction(transactionId: string): Delivery {
    return new Delivery({ ...this.props, transactionId });
  }

  markAssigned(): Delivery {
    return new Delivery({ ...this.props, status: DeliveryStatus.ASSIGNED });
  }

  toDTO(): DeliveryProps {
    return { ...this.props };
  }
}