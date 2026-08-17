export interface ProductProps {
  id: string;
  sku: string;
  name: string;
  description: string;
  priceInCents: number;
  currency: string;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  version: number;
}

export class Product {
  private constructor(private readonly props: ProductProps) {}

  static create(props: ProductProps): Product {
    return new Product(props);
  }

  get id(): string {
    return this.props.id;
  }

  get sku(): string {
    return this.props.sku;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get priceInCents(): number {
    return this.props.priceInCents;
  }

  get currency(): string {
    return this.props.currency;
  }

  get stock(): number {
    return this.props.stock;
  }

  get imageUrl(): string | null {
    return this.props.imageUrl;
  }

  get version(): number {
    return this.props.version;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get isOutOfStock(): boolean {
    return this.props.stock <= 0;
  }

  get isPurchasable(): boolean {
    return this.props.isActive && this.props.stock > 0;
  }

  toDTO(): ProductProps {
    return { ...this.props };
  }
}