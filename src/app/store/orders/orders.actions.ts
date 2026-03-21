import { createAction, props } from '@ngrx/store';
import type { Address, Order, OrderStatus, Payment } from '../../models/domain';

export const loadOrdersRequest = createAction(
  '[Orders] Load Orders Request',
  props<{ userId: string }>()
);

export const loadOrdersSuccess = createAction(
  '[Orders] Load Orders Success',
  props<{ orders: Order[] }>()
);

export const loadOrdersFailure = createAction(
  '[Orders] Load Orders Failure',
  props<{ error: string }>()
);

export const placeOrderRequest = createAction(
  '[Orders] Place Order Request',
  props<{
    items: Array<{ productId: string; qty: number }>;
    shipping: Address;
    billing: Address;
    payment: Payment;
  }>()
);

export const placeOrderSuccess = createAction(
  '[Orders] Place Order Success',
  props<{ order: Order }>()
);

export const placeOrderFailure = createAction(
  '[Orders] Place Order Failure',
  props<{ error: string }>()
);

export const updateOrderStatusRequest = createAction(
  '[Orders] Update Order Status Request',
  props<{ orderId: string; status: OrderStatus }>()
);

export const updateOrderStatusSuccess = createAction(
  '[Orders] Update Order Status Success',
  props<{ order: Order }>()
);

export const updateOrderStatusFailure = createAction(
  '[Orders] Update Order Status Failure',
  props<{ error: string }>()
);
