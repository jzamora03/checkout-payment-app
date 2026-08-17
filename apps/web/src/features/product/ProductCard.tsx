import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import type { Product } from '../../types';
import { formatCurrency, formatStock } from '../../utils/format';

interface ProductCardProps {
  product: Product;
  onBuy: (product: Product) => void;
}

function ProductCard({ product, onBuy }: ProductCardProps) {
  const purchasable = product.isPurchasable && product.stock > 0;

  return (
    <Card
      data-testid={`product-${product.id}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        '&:hover': { transform: 'translateY(-4px)' },
      }}
    >
      <Box sx={{ position: 'relative', aspectRatio: '1', bgcolor: '#eef2ff' }}>
        {product.imageUrl ? (
          <CardMedia
            component="img"
            image={product.imageUrl}
            alt={product.name}
            sx={{ height: '100%' }}
          />
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              fontWeight: 800,
              color: 'primary.main',
            }}
            aria-hidden="true"
          >
            {product.name.charAt(0)}
          </Box>
        )}
        {!purchasable && (
          <Chip
            label="Agotado"
            color="error"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              color: '#fff',
            }}
          />
        )}
      </Box>

      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75,
          flex: 1,
          p: 1.5,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
          {product.name}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '3.5em',
          }}
        >
          {product.description}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5 }}>
          {formatCurrency(product.priceInCents)}
        </Typography>
        <Chip
          label={formatStock(product.stock)}
          size="small"
          color={product.stock === 0 ? 'error' : product.stock <= 5 ? 'warning' : 'success'}
          variant="outlined"
          sx={{ width: 'fit-content', alignSelf: 'flex-start' }}
        />
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={!purchasable}
          startIcon={<ShoppingCartIcon />}
          onClick={() => onBuy(product)}
        >
          Pagar con tarjeta
        </Button>
      </CardContent>
    </Card>
  );
}

export default ProductCard;