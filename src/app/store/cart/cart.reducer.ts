import { createReducer, on } from '@ngrx/store';
import type { CartItem, CartTotals } from '../../models/domain';
import { computeTotals } from '../../services/cart-totals.service';
import * as CartActions from './cart.actions';

export interface CartState {
  items: CartItem[];
  totals: CartTotals;
  serverSynced: boolean;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

const initialTotals: CartTotals = {
  subtotal: 0,
  discount: 0,
  tax: 0,
  total: 0,
  itemCount: 0,
};

export const initialCartState: CartState = {
  items: [],
  totals: { ...initialTotals },
  serverSynced: false,
};

export const cartReducer = createReducer(
  initialCartState,
  on(CartActions.addToCart, (state, { productId, qty = 1 }) => {
    const nextQty = clamp(qty, 1, 99);
    const existing = state.items.find((i) => i.productId === productId);
    if (existing) {
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === productId
            ? { ...i, qty: clamp(i.qty + nextQty, 1, 99) }
            : i
        ),
      };
    }
    return { ...state, items: [...state.items, { productId, qty: nextQty }] };
  }),
  on(CartActions.removeFromCart, (state, { productId }) => ({
    ...state,
    items: state.items.filter((i) => i.productId !== productId),
  })),
  on(CartActions.setQty, (state, { productId, qty }) => ({
    ...state,
    items: state.items.map((i) =>
      i.productId === productId ? { ...i, qty: clamp(qty, 1, 99) } : i
    ),
  })),
  on(CartActions.clearCart, () => ({
    items: [],
    totals: { ...initialTotals },
    serverSynced: false,
  })),
  on(CartActions.recomputeTotals, (state, { products }) => {
    const nextTotals = computeTotals(state.items, products);
    const hasChanged =
      nextTotals.subtotal !== state.totals.subtotal ||
      nextTotals.discount !== state.totals.discount ||
      nextTotals.tax !== state.totals.tax ||
      nextTotals.total !== state.totals.total ||
      nextTotals.itemCount !== state.totals.itemCount;
    if (!hasChanged) return state;
    return { ...state, totals: nextTotals };
  }),
  on(CartActions.fetchCartSuccess, (state, { items }) => ({
    ...state,
    items,
    serverSynced: true,
  })),
  on(CartActions.syncCartSuccess, (state, { items }) => ({
    ...state,
    items,
    serverSynced: true,
  }))
);
