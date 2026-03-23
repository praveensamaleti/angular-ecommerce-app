import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap, map, catchError } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import * as CartActions from './cart.actions';
import type { CartItem } from '../../models/domain';

@Injectable()
export class CartEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);

  fetchCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.fetchCartRequest),
      switchMap(() =>
        this.api.get<{ items: CartItem[] }>('/api/cart').pipe(
          map((data) => CartActions.fetchCartSuccess({ items: data.items })),
          catchError((err) => [
            CartActions.fetchCartFailure({ error: err?.message || 'Failed to load cart.' }),
          ])
        )
      )
    )
  );

  syncCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.syncCartRequest),
      switchMap(({ items }) =>
        this.api.post<{ items: CartItem[] }>('/api/cart/sync', { items }).pipe(
          map((data) => CartActions.syncCartSuccess({ items: data.items })),
          catchError(() => [CartActions.fetchCartRequest()])
        )
      )
    )
  );
}
