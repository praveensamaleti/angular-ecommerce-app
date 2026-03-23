import { createAction, props } from '@ngrx/store';
import type { Product, CartItem } from '../../models/domain';

export const addToCart = createAction(
  '[Cart] Add To Cart',
  props<{ productId: string; qty?: number }>()
);

export const removeFromCart = createAction(
  '[Cart] Remove From Cart',
  props<{ productId: string }>()
);

export const setQty = createAction(
  '[Cart] Set Qty',
  props<{ productId: string; qty: number }>()
);

export const clearCart = createAction('[Cart] Clear Cart');

export const recomputeTotals = createAction(
  '[Cart] Recompute Totals',
  props<{ products: Product[] }>()
);

export const fetchCartRequest = createAction('[Cart API] Fetch Cart Request');

export const fetchCartSuccess = createAction(
  '[Cart API] Fetch Cart Success',
  props<{ items: CartItem[] }>()
);

export const fetchCartFailure = createAction(
  '[Cart API] Fetch Cart Failure',
  props<{ error: string }>()
);

export const syncCartRequest = createAction(
  '[Cart API] Sync Cart Request',
  props<{ items: CartItem[] }>()
);

export const syncCartSuccess = createAction(
  '[Cart API] Sync Cart Success',
  props<{ items: CartItem[] }>()
);

export const syncCartFailure = createAction(
  '[Cart API] Sync Cart Failure',
  props<{ error: string }>()
);
