import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import * as OrdersActions from './orders.actions';
import { clearCart } from '../cart/cart.actions';
import type { Order } from '../../models/domain';

@Injectable()
export class OrdersEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private router = inject(Router);

  loadOrders$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdersActions.loadOrdersRequest),
      switchMap(({ userId }) =>
        this.api.get<Order[]>('/api/orders', { userId }).pipe(
          map((orders) => OrdersActions.loadOrdersSuccess({ orders })),
          catchError((err) => [
            OrdersActions.loadOrdersFailure({ error: err?.error?.message || 'Failed to load orders.' }),
          ])
        )
      )
    )
  );

  placeOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdersActions.placeOrderRequest),
      switchMap(({ items, shipping, billing, payment }) =>
        this.api.post<Order>('/api/orders', { items, shipping, billing, payment }).pipe(
          map((order) => OrdersActions.placeOrderSuccess({ order })),
          catchError((err) => [
            OrdersActions.placeOrderFailure({ error: err?.error?.message || 'Failed to place order.' }),
          ])
        )
      )
    )
  );

  placeOrderSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(OrdersActions.placeOrderSuccess),
        tap(({ order }) => {
          this.router.navigate(['/order-success'], { state: { orderId: order.id } });
        })
      ),
    { dispatch: false }
  );

  placeOrderSuccessClearCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdersActions.placeOrderSuccess),
      map(() => clearCart())
    )
  );

  updateOrderStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdersActions.updateOrderStatusRequest),
      switchMap(({ orderId, status }) =>
        this.api.patch<Order>(`/api/admin/orders/${orderId}/status`, { status }).pipe(
          map((order) => OrdersActions.updateOrderStatusSuccess({ order })),
          catchError((err) => [
            OrdersActions.updateOrderStatusFailure({ error: err?.error?.message || 'Failed to update order status.' }),
          ])
        )
      )
    )
  );
}
