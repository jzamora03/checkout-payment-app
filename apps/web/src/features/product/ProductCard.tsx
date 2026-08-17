import type { Product } from '../../types';
import { formatCurrency, formatStock } from '../../utils/format';

interface ProductCardProps {
  product: Product;
  onBuy: (product: Product) => void;
}

function ProductCard({ product, onBuy }: ProductCardProps) {
  const purchasable = product.isPurchasable && product.stock > 0;

  return (
    <article className="product-card" data-testid={`product-${product.id}`}>
      <div className="product-card__media">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            width={400}
            height={400}
          />
        ) : (
          <div className="product-card__placeholder" aria-hidden="true">
            {product.name.charAt(0)}
          </div>
        )}
        {!purchasable && (
          <span className="product-card__badge product-card__badge--out">Agotado</span>
        )}
      </div>
      <div className="product-card__body">
        <h2 className="product-card__name">{product.name}</h2>
        <p className="product-card__description">{product.description}</p>
        <p className="product-card__price">{formatCurrency(product.priceInCents)}</p>
        <p className="product-card__stock" data-stock={product.stock}>
          {formatStock(product.stock)}
        </p>
        <button
          type="button"
          className="btn btn--primary btn--block"
          disabled={!purchasable}
          onClick={() => onBuy(product)}
        >
          Pagar con tarjeta
        </button>
      </div>
    </article>
  );
}

export default ProductCard;