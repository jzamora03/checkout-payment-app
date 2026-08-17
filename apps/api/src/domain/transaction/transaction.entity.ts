export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  ERROR = 'ERROR',
  VOIDED = 'VOIDED',
}

export interface TransactionProps {
  id: string;
  reference: string;
  wompiTransactionId: string | null;
  productId: string;
  customerId: string;
  deliveryId: string | null;
  amountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  totalInCents: number;
  currency: string;
  status: TransactionStatus;
  statusMessage: string | null;
  paymentMethodType: string | null;
  cardBrand: string | null;
  cardLastFour: string | null;
  customerEmail: string;
  ipAddress: string | null;
}

const FINAL_STATUSES: ReadonlySet<TransactionStatus> = new Set([
  TransactionStatus.APPROVED,
  TransactionStatus.DECLINED,
  TransactionStatus.ERROR,
  TransactionStatus.VOIDED,
]);

export class Transaction {
  private constructor(private readonly props: TransactionProps) {}

  static create(props: TransactionProps): Transaction {
    return new Transaction(props);
  }

  get id(): string {
    return this.props.id;
  }

  get reference(): string {
    return this.props.reference;
  }

  get wompiTransactionId(): string | null {
    return this.props.wompiTransactionId;
  }

  get productId(): string {
    return this.props.productId;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get deliveryId(): string | null {
    return this.props.deliveryId;
  }

  get amountInCents(): number {
    return this.props.amountInCents;
  }

  get baseFeeInCents(): number {
    return this.props.baseFeeInCents;
  }

  get deliveryFeeInCents(): number {
    return this.props.deliveryFeeInCents;
  }

  get totalInCents(): number {
    return this.props.totalInCents;
  }

  get currency(): string {
    return this.props.currency;
  }

  get status(): TransactionStatus {
    return this.props.status;
  }

  get statusMessage(): string | null {
    return this.props.statusMessage;
  }

  get customerEmail(): string {
    return this.props.customerEmail;
  }

  get isFinalized(): boolean {
    return FINAL_STATUSES.has(this.props.status);
  }

  get isApproved(): boolean {
    return this.props.status === TransactionStatus.APPROVED;
  }

  withWompiId(wompiTransactionId: string): Transaction {
    return new Transaction({ ...this.props, wompiTransactionId });
  }

  markApproved(message?: string): Transaction {
    if (this.isFinalized) {
      return this;
    }
    return new Transaction({
      ...this.props,
      status: TransactionStatus.APPROVED,
      statusMessage: message ?? 'Transacción aprobada',
    });
  }

  markDeclined(message?: string): Transaction {
    if (this.isFinalized) {
      return this;
    }
    return new Transaction({
      ...this.props,
      status: TransactionStatus.DECLINED,
      statusMessage: message ?? 'Transacción declinada',
    });
  }

  markError(message?: string): Transaction {
    if (this.isFinalized) {
      return this;
    }
    return new Transaction({
      ...this.props,
      status: TransactionStatus.ERROR,
      statusMessage: message ?? 'Error procesando la transacción',
    });
  }

  toDTO(): TransactionProps {
    return { ...this.props };
  }
}