import { createSelector, createFeatureSelector } from '@ngrx/store';
import type { ProductsState } from './products.reducer';

export const selectProductsState = createFeatureSelector<ProductsState>('products');

export const selectFilteredProducts = createSelector(selectProductsState, (s) => s.products);
export const selectProductsTotalCount = createSelector(selectProductsState, (s) => s.totalCount);
export const selectProductsLoading = createSelector(selectProductsState, (s) => s.isLoading);
export const selectProductsError = createSelector(selectProductsState, (s) => s.error);
export const selectFilters = createSelector(selectProductsState, (s) => s.filters);
