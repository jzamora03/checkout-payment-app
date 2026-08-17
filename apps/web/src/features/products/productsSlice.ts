import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import type { Product } from '../../types';

export type ProductsStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface ProductsState {
  products: Product[];
  status: ProductsStatus;
  error: string | null;
}

const initialState: ProductsState = {
  products: [],
  status: 'idle',
  error: null,
};

export const fetchProducts = createAsyncThunk('products/fetch', async (): Promise<Product[]> => {
  return api.listProducts();
});

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
      state.status = 'succeeded';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'No fue posible cargar los productos';
      });
  },
});

export const { setProducts } = productsSlice.actions;
export default productsSlice.reducer;