export interface CustomerProps {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  phone: string | null;
}

export class Customer {
  private constructor(private readonly props: CustomerProps) {}

  static create(props: CustomerProps): Customer {
    return new Customer(props);
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get documentType(): string {
    return this.props.documentType;
  }

  get documentNumber(): string {
    return this.props.documentNumber;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`.trim();
  }

  toDTO(): CustomerProps {
    return { ...this.props };
  }
}