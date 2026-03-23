import { createReducer, on } from '@ngrx/store';
import type { CartItem, CartTotals, Product } from '../../models/domain';
import * as CartActions from './cart.actions';

export interface CartState {
  items: CartItem[];
  totals: CartTotals;
  serverSynced: boolean;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Stable composite key that uniquely identifies a cart line.
 * Products without variants use productId alone.
 */
function itemKey(productId: string, variantId: string | undefined): string {
  return variantId ? `${productId}__${variantId}` : productId;
}

function computeTotals(items: CartItem[], products: Product[]): CartTotals {
  const productMap = new Map(products.map((p) => [p.id, p]));

  const subtotal = items.reduce((sum, it) => {
    const product = productMap.get(it.productId);
    if (!product) return sum;

    let unitPrice = product.price;
    if (it.variantId && product.variants?.length) {
      const variant = product.variants.find((v) => v.id === it.variantId);
      if (variant?.price != null) unitPrice = variant.price;
    }
    return sum + unitPrice * it.qty;
  }, 0);

  const itemCount = items.reduce((sum, it) => sum + it.qty, 0);
  const discount = subtotal * 0.1;
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * 0.08;
  const total = taxable + tax;
  return { subtotal, discount, tax, total, itemCount };
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

  on(CartActions.addToCart, (state, { productId, qty = 1, variantId }) => {
    const nextQty = clamp(qty, 1, 99);
    const key = itemKey(productId, variantId);
    const existing = state.items.find((i) => itemKey(i.productId, i.variantId) === key);
    if (existing) {
      return {
        ...state,
        items: state.items.map((i) =>
          itemKey(i.productId, i.variantId) === key
            ? { ...i, qty: clamp(i.qty + nextQty, 1, 99) }
            : i
        ),
      };
    }
    return { ...state, items: [...state.items, { productId, qty: nextQty, variantId }] };
  }),

  on(CartActions.removeFromCart, (state, { productId, variantId }) => {
    const key = itemKey(productId, variantId);
    return {
      ...state,
      items: state.items.filter((i) => itemKey(i.productId, i.variantId) !== key),
    };
  }),

  on(CartActions.setQty, (state, { productId, qty, variantId }) => ({
    ...state,
    items: state.items.map((i) =>
      itemKey(i.productId, i.variantId) === itemKey(productId, variantId)
        ? { ...i, qty: clamp(qty, 1, 99) }
        : i
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
