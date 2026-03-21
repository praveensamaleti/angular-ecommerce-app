import { createAction, props } from '@ngrx/store';
import type { Category, Product } from '../../models/domain';

export const setFiltersQuery = createAction(
  '[Products] Set Filters Query',
  props<{ query: string }>()
);

export const setFiltersCategory = createAction(
  '[Products] Set Filters Category',
  props<{ category: Category | 'All' }>()
);

export const setFiltersPriceRange = createAction(
  '[Products] Set Filters Price Range',
  props<{ minPrice: number; maxPrice: number }>()
);

export const setFiltersPage = createAction(
  '[Products] Set Filters Page',
  props<{ page: number }>()
);

export const setFiltersPageSize = createAction(
  '[Products] Set Filters Page Size',
  props<{ pageSize: number }>()
);

export const resetFilters = createAction('[Products] Reset Filters');

export const loadProductsRequest = createAction('[Products] Load Products Request');

export const loadProductsSuccess = createAction(
  '[Products] Load Products Success',
  props<{ products: Product[]; totalCount: number }>()
);

export const loadProductsFailure = createAction(
  '[Products] Load Products Failure',
  props<{ error: string }>()
);

export const upsertProductRequest = createAction(
  '[Products] Upsert Product Request',
  props<{ product: Product }>()
);

export const upsertProductSuccess = createAction(
  '[Products] Upsert Product Success',
  props<{ product: Product }>()
);

export const upsertProductFailure = createAction(
  '[Products] Upsert Product Failure',
  props<{ error: string }>()
);

export const deleteProductRequest = createAction(
  '[Products] Delete Product Request',
  props<{ id: string }>()
);

export const deleteProductSuccess = createAction(
  '[Products] Delete Product Success',
  props<{ id: string }>()
);

export const deleteProductFailure = createAction(
  '[Products] Delete Product Failure',
  props<{ error: string }>()
);
