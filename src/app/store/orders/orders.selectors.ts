import { createSelector, createFeatureSelector } from '@ngrx/store';
import type { OrdersState } from './orders.reducer';

export const selectOrdersState = createFeatureSelector<OrdersState>('orders');

export const selectOrders = createSelector(selectOrdersState, (s) => s.orders);
export const selectOrdersLoading = createSelector(selectOrdersState, (s) => s.isLoading);
export const selectOrdersError = createSelector(selectOrdersState, (s) => s.error);
