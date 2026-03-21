import { Injectable } from '@angular/core';
import type { CartItem, CartTotals, Product } from '../models/domain';

@Injectable({ providedIn: 'root' })
export class CartTotalsService {
  computeTotals(items: CartItem[], products: Product[]): CartTotals {
    return computeTotals(items, products);
  }
}

export function computeTotals(items: CartItem[], products: Product[]): CartTotals {
  const map = new Map(products.map((p) => [p.id, p]));
  const subtotal = items.reduce((sum, it) => {
    const p = map.get(it.productId);
    if (!p) return sum;
    return sum + p.price * it.qty;
  }, 0);
  const itemCount = items.reduce((sum, it) => sum + it.qty, 0);
  const discount = subtotal * 0.1;
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * 0.08;
  const total = taxable + tax;
  return { subtotal, discount, tax, total, itemCount };
}
