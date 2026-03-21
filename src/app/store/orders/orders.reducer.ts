import { createReducer, on } from '@ngrx/store';
import type { Order } from '../../models/domain';
import * as OrdersActions from './orders.actions';

export interface OrdersState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
}

export const initialOrdersState: OrdersState = {
  orders: [],
  isLoading: false,
  error: null,
};

export const ordersReducer = createReducer(
  initialOrdersState,
  on(OrdersActions.loadOrdersRequest, OrdersActions.placeOrderRequest, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),
  on(OrdersActions.loadOrdersSuccess, (state, { orders }) => ({
    ...state,
    isLoading: false,
    orders,
    error: null,
  })),
  on(OrdersActions.loadOrdersFailure, OrdersActions.placeOrderFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),
  on(OrdersActions.placeOrderSuccess, (state, { order }) => ({
    ...state,
    isLoading: false,
    orders: [order, ...state.orders],
    error: null,
  })),
  on(OrdersActions.updateOrderStatusRequest, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(OrdersActions.updateOrderStatusSuccess, (state, { order }) => ({
    ...state,
    isLoading: false,
    error: null,
    orders: state.orders.map((o) => (o.id === order.id ? order : o)),
  })),
  on(OrdersActions.updateOrderStatusFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  }))
);
