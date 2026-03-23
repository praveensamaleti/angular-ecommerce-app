import { createReducer, on } from '@ngrx/store';
import type { Product, ProductsFilters } from '../../models/domain';
import * as ProductsActions from './products.actions';

export const DEFAULT_FILTERS: ProductsFilters = {
  query: '',
  category: 'All',
  minPrice: 0,
  maxPrice: 1000,
  page: 0,
  pageSize: 8,
};

export interface ProductsState {
  products: Product[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  filters: ProductsFilters;
  categories: string[];
}

export const initialProductsState: ProductsState = {
  products: [],
  totalCount: 0,
  isLoading: false,
  error: null,
  filters: { ...DEFAULT_FILTERS },
  categories: [],
};

export const productsReducer = createReducer(
  initialProductsState,
  on(ProductsActions.setFiltersQuery, (state, { query }) => ({
    ...state,
    filters: { ...state.filters, query, page: 0 },
  })),
  on(ProductsActions.setFiltersCategory, (state, { category }) => ({
    ...state,
    filters: { ...state.filters, category, page: 0 },
  })),
  on(ProductsActions.setFiltersPriceRange, (state, { minPrice, maxPrice }) => ({
    ...state,
    filters: { ...state.filters, minPrice, maxPrice, page: 0 },
  })),
  on(ProductsActions.setFiltersPage, (state, { page }) => ({
    ...state,
    filters: { ...state.filters, page },
  })),
  on(ProductsActions.setFiltersPageSize, (state, { pageSize }) => ({
    ...state,
    filters: { ...state.filters, pageSize, page: 0 },
  })),
  on(ProductsActions.resetFilters, (state) => ({
    ...state,
    filters: { ...DEFAULT_FILTERS },
  })),
  on(ProductsActions.loadProductsRequest, ProductsActions.upsertProductRequest, ProductsActions.deleteProductRequest, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),
  on(ProductsActions.loadProductsSuccess, (state, { products, totalCount }) => ({
    ...state,
    isLoading: false,
    products,
    totalCount,
    error: null,
  })),
  on(ProductsActions.loadProductsFailure, ProductsActions.upsertProductFailure, ProductsActions.deleteProductFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),
  on(ProductsActions.upsertProductSuccess, (state, { product }) => {
    const idx = state.products.findIndex((p) => p.id === product.id);
    const products = idx >= 0
      ? state.products.map((p, i) => (i === idx ? product : p))
      : [product, ...state.products];
    return { ...state, isLoading: false, products };
  }),
  on(ProductsActions.deleteProductSuccess, (state, { id }) => ({
    ...state,
    isLoading: false,
    products: state.products.filter((p) => p.id !== id),
  })),
  on(ProductsActions.loadCategoriesSuccess, (state, { categories }) => ({
    ...state,
    categories,
  }))
);
