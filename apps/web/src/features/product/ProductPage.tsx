import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
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
    <Container maxWidth="lg" sx={{ py: 3, minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Box
        component="header"
        sx={{
          textAlign: 'center',
          py: 3,
          mb: 2,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: '#fff',
          px: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          Mi Tienda
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
          Tecnología con envío a domicilio y pago 100% seguro
        </Typography>
      </Box>

      {status === 'loading' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }} data-testid="products-loading">
          {[1, 2, 3, 4].map((item) => (
            <Box key={item}>
              <Skeleton variant="rounded" height={200} />
              <Skeleton variant="text" sx={{ mt: 1 }} />
              <Skeleton variant="text" width="60%" />
            </Box>
          ))}
        </Box>
      )}

      {status === 'failed' && (
        <Alert severity="error" data-testid="products-error">
          <AlertTitle>No pudimos cargar los productos</AlertTitle>
          {error ?? 'Intenta de nuevo en un momento.'}
          <Box sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => void dispatch(fetchProducts())}
            >
              Reintentar
            </Button>
          </Box>
        </Alert>
      )}

      {status === 'succeeded' && (
        <Box
          component="ul"
          sx={{
            listStyle: 'none',
            p: 0,
            m: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 2,
          }}
        >
          {products.map((product) => (
            <Box component="li" key={product.id} sx={{ display: 'flex' }}>
              <ProductCard product={product} onBuy={handleBuy} />
            </Box>
          ))}
        </Box>
      )}

      <Box
        component="footer"
        sx={{
          mt: 3,
          p: 1.5,
          borderRadius: '12px',
          bgcolor: 'rgba(79, 70, 229, 0.08)',
          color: 'text.secondary',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2">
          Los precios incluyen una tarifa base de <strong>{formatCurrency(3000)}</strong> y envío por{' '}
          <strong>{formatCurrency(5000)}</strong>.
        </Typography>
      </Box>
    </Container>
  );
}

export default ProductPage;
