import { createSelector, createFeatureSelector } from '@ngrx/store';
import type { CartState } from './cart.reducer';

export const selectCartState = createFeatureSelector<CartState>('cart');

export const selectCartItems = createSelector(selectCartState, (s) => s.items);
export const selectCartTotals = createSelector(selectCartState, (s) => s.totals);
export const selectItemCount = createSelector(selectCartState, (s) => s.totals.itemCount);
