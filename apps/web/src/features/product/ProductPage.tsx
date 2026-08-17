import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../products/productsSlice';
import type { AppDispatch, RootState } from '../../app/store';
import { startCheckout } from '../checkout/checkoutSlice';
import type { Product } from '../../types';
import ProductCard from './ProductCard';
import { formatCurrency } from '../../utils/format';

function ProductPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { products, status, error } = useSelector((state: RootState) => state.products);

  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchProducts());
    }
  }, [dispatch, status]);

  const handleBuy = (product: Product) => {
    dispatch(startCheckout(product.id));
  };

  return (
    <div className="store">
      <header className="store__header">
        <h1 className="store__title">Mi Tienda</h1>
        <p className="store__subtitle">
          Tecnología con envío a domicilio y pago 100% seguro
        </p>
      </header>

      {status === 'loading' && (
        <div className="store__status" role="status">
          Cargando productos...
        </div>
      )}

      {status === 'failed' && (
        <div className="store__status store__status--error" role="alert">
          {error ?? 'No fue posible cargar los productos. Intenta de nuevo.'}
          <button type="button" className="btn btn--ghost" onClick={() => void dispatch(fetchProducts())}>
            Reintentar
          </button>
        </div>
      )}

      {status === 'succeeded' && (
        <ul className="product-grid">
          {products.map((product) => (
            <li key={product.id} className="product-grid__item">
              <ProductCard product={product} onBuy={handleBuy} />
            </li>
          ))}
        </ul>
      )}

      <footer className="store__fees">
        <p>
          Los precios incluyen una tarifa base de <strong>{formatCurrency(3000)}</strong> y
          envío por <strong>{formatCurrency(5000)}</strong>.
        </p>
      </footer>
    </div>
  );
}

export default ProductPage;