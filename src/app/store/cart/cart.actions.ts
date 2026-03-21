import { createAction, props } from '@ngrx/store';
import type { Product } from '../../models/domain';

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
