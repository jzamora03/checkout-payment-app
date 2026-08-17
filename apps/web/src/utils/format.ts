export function formatCurrency(cents: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatStock(stock: number): string {
  if (stock <= 0) {
    return 'Sin stock';
  }
  if (stock <= 5) {
    return `¡Solo quedan ${stock}!`;
  }
  return `${stock} disponibles`;
}