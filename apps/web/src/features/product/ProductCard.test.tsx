import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductCard from './ProductCard';
import type { Product } from '../../types';

const baseProduct: Product = {
  id: 'p1',
  sku: 'SKU',
  name: 'Auriculares Pro',
  description: 'Con cancelación de ruido',
  priceInCents: 249900,
  currency: 'COP',
  stock: 5,
  imageUrl: null,
  isPurchasable: true,
};

describe('ProductCard', () => {
  it('muestra nombre, precio y stock', () => {
    render(<ProductCard product={baseProduct} onBuy={jest.fn()} />);
    expect(screen.getByText('Auriculares Pro')).toBeInTheDocument();
    expect(screen.getByText('¡Solo quedan 5!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pagar con tarjeta' })).toBeEnabled();
  });

  it('deshabilita el botón si no hay stock', () => {
    const product = { ...baseProduct, stock: 0, isPurchasable: false };
    render(<ProductCard product={product} onBuy={jest.fn()} />);
    const button = screen.getByRole('button', { name: 'Pagar con tarjeta' });
    expect(button).toBeDisabled();
    expect(screen.getByText('Sin stock')).toBeInTheDocument();
  });

  it('notifica la compra al hacer clic', async () => {
    const user = userEvent.setup();
    const onBuy = jest.fn();
    render(<ProductCard product={baseProduct} onBuy={onBuy} />);
    await user.click(screen.getByRole('button', { name: 'Pagar con tarjeta' }));
    expect(onBuy).toHaveBeenCalledWith(baseProduct);
  });

  it('usa la imagen del producto si existe', () => {
    const product = { ...baseProduct, imageUrl: 'https://img.test/x.png' };
    const { container } = render(<ProductCard product={product} onBuy={jest.fn()} />);
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://img.test/x.png');
  });
});