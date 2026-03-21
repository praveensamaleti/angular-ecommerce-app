import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { switchMap, map, catchError, withLatestFrom } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import * as ProductsActions from './products.actions';
import { selectFilters } from './products.selectors';
import type { Product } from '../../models/domain';

@Injectable()
export class ProductsEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private store = inject(Store);

  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.loadProductsRequest),
      withLatestFrom(this.store.select(selectFilters)),
      switchMap(([, filters]) => {
        const params: Record<string, any> = {
          query: filters.query,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          page: filters.page,
          pageSize: filters.pageSize,
        };
        if (filters.category !== 'All') {
          params['category'] = filters.category;
        }
        return this.api.get<{ products: Product[]; totalCount: number }>('/api/products', params).pipe(
          map(({ products, totalCount }) => ProductsActions.loadProductsSuccess({ products, totalCount })),
          catchError((err) => [
            ProductsActions.loadProductsFailure({ error: err?.error?.message || 'Failed to load products.' }),
          ])
        );
      })
    )
  );

  upsertProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.upsertProductRequest),
      switchMap(({ product }) => {
        const request$ = product.id
          ? this.api.put<Product>(`/api/products/${product.id}`, product)
          : this.api.post<Product>('/api/products', product);
        return request$.pipe(
          map((saved) => ProductsActions.upsertProductSuccess({ product: saved })),
          catchError((err) => [
            ProductsActions.upsertProductFailure({ error: err?.error?.message || 'Failed to save product.' }),
          ])
        );
      })
    )
  );

  deleteProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.deleteProductRequest),
      switchMap(({ id }) =>
        this.api.delete(`/api/products/${id}`).pipe(
          map(() => ProductsActions.deleteProductSuccess({ id })),
          catchError((err) => [
            ProductsActions.deleteProductFailure({ error: err?.error?.message || 'Failed to delete product.' }),
          ])
        )
      )
    )
  );
}
